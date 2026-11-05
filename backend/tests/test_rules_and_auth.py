import pytest
from app.services.ai_service import RuleBasedRecoveryEvaluator
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token

def test_password_hashing():
    raw = "SecurePassword123!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_flow():
    user_id = "user-12345"
    role = "doctor"
    token = create_access_token(subject=user_id, role=role)
    assert token is not None
    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == role

def test_flag_rule_fever():
    data = {
        "pain_level": 3,
        "has_fever": True,
        "temperature": 38.5,
        "has_swelling": False,
        "medication_taken": True,
        "moving_normally": True
    }
    result = RuleBasedRecoveryEvaluator.evaluate(data)
    assert result.risk_level == "high"
    assert any("Fever reported" in f for f in result.flags)

def test_flag_rule_pain_rising():
    prev = [{"pain_level": 3, "date": "2026-11-04"}]
    data = {
        "pain_level": 6,  # +3 rise
        "has_fever": False,
        "has_swelling": False,
        "medication_taken": True,
        "moving_normally": True
    }
    result = RuleBasedRecoveryEvaluator.evaluate(data, previous_checkins=prev)
    assert result.risk_level in ["medium", "high"]
    assert any("Pain rising" in f for f in result.flags)

def test_flag_rule_swelling_plus_pain():
    data = {
        "pain_level": 7,
        "has_fever": False,
        "has_swelling": True,
        "swelling_details": "Tense fluid around knee",
        "medication_taken": True,
        "moving_normally": False
    }
    result = RuleBasedRecoveryEvaluator.evaluate(data)
    assert result.risk_level == "high"
    assert any("Localized swelling" in f for f in result.flags)

def test_flag_rule_missed_medication():
    data = {
        "pain_level": 2,
        "has_fever": False,
        "has_swelling": False,
        "medication_taken": False,
        "missed_medication_reason": "Forgot morning pill",
        "moving_normally": True
    }
    result = RuleBasedRecoveryEvaluator.evaluate(data)
    assert result.risk_level == "medium"
    assert any("Missed prescribed medication" in f for f in result.flags)

def test_flag_rule_callback_requested():
    data = {
        "pain_level": 3,
        "has_fever": False,
        "has_swelling": False,
        "medication_taken": True,
        "callback_requested": True,
        "callback_reason": "Dressing feels loose"
    }
    result = RuleBasedRecoveryEvaluator.evaluate(data)
    assert result.callback_requested is True
    assert any("requested a clinician callback" in f for f in result.flags)

def test_stable_baseline():
    data = {
        "pain_level": 2,
        "has_fever": False,
        "has_swelling": False,
        "medication_taken": True,
        "eating_normally": True,
        "sleeping_normally": True,
        "moving_normally": True,
        "callback_requested": False
    }
    result = RuleBasedRecoveryEvaluator.evaluate(data)
    assert result.risk_level == "low"
    assert len(result.flags) == 0
    assert "expected baseline" in result.summary

