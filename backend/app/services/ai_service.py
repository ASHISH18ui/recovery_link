import json
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger(__name__)

class AISummaryResult(BaseModel):
    summary: str
    risk_level: str  # "low", "medium", "high"
    flags: List[str] = []
    missing_info: List[str] = []
    callback_requested: bool = False

class RuleBasedRecoveryEvaluator:
    @staticmethod
    def evaluate(
        current_data: Dict[str, Any],
        previous_checkins: List[Dict[str, Any]] = None
    ) -> AISummaryResult:
        flags: List[str] = []
        missing_info: List[str] = []
        risk_level = "low"
        
        pain = current_data.get("pain_level", 0)
        has_fever = current_data.get("has_fever", False)
        temperature = current_data.get("temperature")
        has_swelling = current_data.get("has_swelling", False)
        swelling_details = current_data.get("swelling_details")
        eating_normally = current_data.get("eating_normally", True)
        sleeping_normally = current_data.get("sleeping_normally", True)
        moving_normally = current_data.get("moving_normally", True)
        medication_taken = current_data.get("medication_taken", True)
        missed_medication_reason = current_data.get("missed_medication_reason")
        new_symptoms = current_data.get("new_symptoms")
        callback_requested = current_data.get("callback_requested", False)
        callback_reason = current_data.get("callback_reason")

        # 1. Fever check
        if has_fever or (temperature is not None and temperature >= 38.0):
            temp_str = f" ({temperature}°C)" if temperature else ""
            flags.append(f"Fever reported{temp_str} - potential surgical site infection risk")
            risk_level = "high"
            if temperature is None:
                missing_info.append("Precise thermometer reading")

        # 2. Pain trend check over previous check-ins
        if previous_checkins and len(previous_checkins) > 0:
            last_pain = previous_checkins[0].get("pain_level", 0)
            if (pain - last_pain) >= 2:
                flags.append(f"Pain rising {pain - last_pain} points since previous check-in ({last_pain}/10 → {pain}/10)")
                if risk_level != "high":
                    risk_level = "medium"

        # 3. Severe pain check
        if pain >= 8:
            flags.append(f"Severe acute pain reported ({pain}/10)")
            risk_level = "high"
        elif pain >= 6 and risk_level == "low":
            flags.append(f"Elevated pain reported ({pain}/10)")
            risk_level = "medium"

        # 4. Swelling plus elevated pain
        if has_swelling:
            details = f" ({swelling_details})" if swelling_details else ""
            if pain >= 5:
                flags.append(f"Localized swelling{details} combined with elevated pain ({pain}/10)")
                risk_level = "high"
            else:
                flags.append(f"Swelling noted near surgical site{details}")
                if risk_level == "low":
                    risk_level = "medium"

        # 5. Medication adherence
        if not medication_taken:
            reason = f": {missed_medication_reason}" if missed_medication_reason else ""
            flags.append(f"Missed prescribed medication dose{reason}")
            if risk_level == "low":
                risk_level = "medium"
            if not missed_medication_reason:
                missing_info.append("Reason for omitting medication")

        # 6. Callback requested
        if callback_requested:
            c_reason = f" - Reason: '{callback_reason}'" if callback_reason else ""
            flags.append(f"Patient explicitly requested a clinician callback{c_reason}")
            if risk_level == "low":
                risk_level = "medium"
            if not callback_reason:
                missing_info.append("Specific concern for callback request")

        # 7. Mobility / ADLs
        if not moving_normally:
            flags.append("Patient unable to mobilize normally")
            if risk_level == "low":
                risk_level = "medium"
        if not sleeping_normally or not eating_normally:
            issues = []
            if not sleeping_normally: issues.append("sleep disturbance")
            if not eating_normally: issues.append("reduced oral intake")
            flags.append(f"Impaired daily function ({', '.join(issues)})")

        # 8. New or worsening symptoms
        if new_symptoms and new_symptoms.strip():
            flags.append(f"New or worsening symptom: {new_symptoms.strip()}")
            if risk_level == "low":
                risk_level = "medium"

        # Compose readable clinical summary
        summary_parts = []
        summary_parts.append(f"Patient reported pain score of {pain}/10.")
        
        if not medication_taken:
            summary_parts.append("Did not take all scheduled medications.")
        else:
            summary_parts.append("Adherent with prescribed medications.")
            
        if has_fever or (temperature and temperature >= 38.0):
            summary_parts.append(f"Patient noted feverish symptoms (Temp: {temperature or 'unrecorded'}°C).")
            
        if has_swelling:
            summary_parts.append("Notable swelling present around surgical site.")
            
        if not moving_normally:
            summary_parts.append("Experiencing restricted mobility.")
            
        if new_symptoms:
            summary_parts.append(f"Reported new/worsening symptom: '{new_symptoms.strip()}'.")
            
        if callback_requested:
            summary_parts.append("URGENT: Patient requested care team callback.")
        elif risk_level == "low":
            summary_parts.append("Recovery is progressing within expected baseline parameters.")

        summary_text = " ".join(summary_parts)

        return AISummaryResult(
            summary=summary_text,
            risk_level=risk_level,
            flags=flags,
            missing_info=missing_info,
            callback_requested=callback_requested
        )

class AISummaryService:
    def __init__(self):
        self.gemini_client = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini AI Client initialized successfully for RecoverLink.")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini Client: {e}. Falling back to Rule-based.")

    def analyze_checkin(
        self,
        current_data: Dict[str, Any],
        previous_checkins: List[Dict[str, Any]] = None
    ) -> AISummaryResult:
        # Step 1: Always run rule-based evaluator to establish rigorous clinical flags
        rule_result = RuleBasedRecoveryEvaluator.evaluate(current_data, previous_checkins)

        # Step 2: If Gemini API is configured, enhance the summary prose while keeping clinical boundaries
        if self.gemini_client:
            try:
                prompt = (
                    "You are the clinical summarization engine for 'RecoverLink', a hospital post-discharge monitoring platform.\n"
                    "CORE DIRECTIVE: You summarize patient responses and highlight clinical concerns. "
                    "You MUST NEVER diagnose diseases, suggest treatment, or give medical advice to patients.\n"
                    "Review the following daily patient check-in data and clinical rule results, and provide a clear, "
                    "concise 1-3 sentence summary for the surgical care team.\n\n"
                    f"Patient Check-in Data:\n{json.dumps(current_data, indent=2)}\n"
                    f"Previous Check-ins (latest first):\n{json.dumps(previous_checkins or [], indent=2)}\n"
                    f"Detected Clinical Flags:\n{json.dumps(rule_result.flags, indent=2)}\n\n"
                    "Respond with a JSON object matching this schema:\n"
                    "{\n"
                    '  "summary": "Concise 1-3 sentence objective clinical summary for staff",\n'
                    '  "risk_level": "low" | "medium" | "high",\n'
                    '  "flags": ["list", "of", "flags"],\n'
                    '  "missing_info": ["missing", "measurements"],\n'
                    '  "callback_requested": true | false\n'
                    "}"
                )
                
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "temperature": 0.2
                    }
                )
                parsed = json.loads(response.text)
                
                # Merge or keep the stricter risk level from the rules
                risk_order = {"low": 1, "medium": 2, "high": 3}
                rule_rank = risk_order.get(rule_result.risk_level, 1)
                llm_rank = risk_order.get(parsed.get("risk_level", "low"), 1)
                final_risk = rule_result.risk_level if rule_rank >= llm_rank else parsed.get("risk_level", "low")

                # Merge flags
                all_flags = list(dict.fromkeys(rule_result.flags + parsed.get("flags", [])))
                all_missing = list(dict.fromkeys(rule_result.missing_info + parsed.get("missing_info", [])))

                return AISummaryResult(
                    summary=parsed.get("summary", rule_result.summary),
                    risk_level=final_risk,
                    flags=all_flags,
                    missing_info=all_missing,
                    callback_requested=current_data.get("callback_requested", False)
                )
            except Exception as e:
                logger.warning(f"LLM generation failed: {e}. Using rule-based fallback.")
                return rule_result

        return rule_result

ai_service = AISummaryService()

