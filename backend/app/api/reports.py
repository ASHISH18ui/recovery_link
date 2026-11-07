import csv
import io
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db import get_db
from app.models.models import (
    Patient, CarePlan, Checkin, Alert, User, Admission, DischargeRecord
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
def get_reports_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hospital_id = current_user.hospital_id

    patients = db.query(Patient).filter(Patient.hospital_id == hospital_id).all()
    patient_ids = [p.id for p in patients]

    checkins = db.query(Checkin).filter(Checkin.patient_id.in_(patient_ids)).all() if patient_ids else []
    alerts = db.query(Alert).filter(Alert.patient_id.in_(patient_ids)).all() if patient_ids else []

    # Risk counts
    risk_counts = {"low": 0, "medium": 0, "high": 0}
    for p in patients:
        pending_high = any(a.risk_level == "high" and a.status == "pending" for a in p.alerts)
        pending_med = any(a.risk_level == "medium" and a.status == "pending" for a in p.alerts)
        if pending_high:
            risk_counts["high"] += 1
        elif pending_med:
            risk_counts["medium"] += 1
        else:
            risk_counts["low"] += 1

    # Recovery trends by post-op day or last 14 dates
    daily_stats: Dict[str, Dict[str, Any]] = {}
    now = datetime.now(timezone.utc)
    for i in range(13, -1, -1):
        d_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[d_str] = {"date": d_str, "pain_sum": 0, "count": 0, "fever_count": 0, "med_adherent": 0}

    for c in checkins:
        if c.date in daily_stats:
            daily_stats[c.date]["count"] += 1
            daily_stats[c.date]["pain_sum"] += c.pain_level
            if c.has_fever:
                daily_stats[c.date]["fever_count"] += 1
            if c.medication_taken:
                daily_stats[c.date]["med_adherent"] += 1

    trend_series = []
    for d_str, val in daily_stats.items():
        avg_pain = round(val["pain_sum"] / val["count"], 1) if val["count"] > 0 else 0
        adherence_pct = round((val["med_adherent"] / val["count"]) * 100) if val["count"] > 0 else 100
        trend_series.append({
            "date": d_str,
            "display_date": d_str[5:],  # MM-DD
            "avg_pain": avg_pain,
            "checkins_count": val["count"],
            "adherence_rate": adherence_pct,
            "fever_flags": val["fever_count"]
        })

    # Procedures summary
    procedures: Dict[str, Dict[str, Any]] = {}
    for p in patients:
        proc = "General Surgery"
        if p.care_plans and p.care_plans[0].discharge_record:
            proc = p.care_plans[0].discharge_record.surgical_procedure or "General Surgery"
        
        if proc not in procedures:
            procedures[proc] = {"name": proc, "patient_count": 0, "alerts_count": 0, "avg_pain": 0, "pain_total": 0, "checkin_total": 0}
        
        procedures[proc]["patient_count"] += 1
        procedures[proc]["alerts_count"] += len([a for a in p.alerts if a.status in ["pending", "acknowledged"]])
        for c in p.checkins:
            procedures[proc]["pain_total"] += c.pain_level
            procedures[proc]["checkin_total"] += 1

    procedure_list = []
    for proc_name, data in procedures.items():
        avg_p = round(data["pain_total"] / data["checkin_total"], 1) if data["checkin_total"] > 0 else 0.0
        readmit_risk = "Low"
        if data["alerts_count"] > 3 or avg_p > 6.0:
            readmit_risk = "High"
        elif data["alerts_count"] > 1 or avg_p > 4.0:
            readmit_risk = "Moderate"

        procedure_list.append({
            "procedure": proc_name,
            "patients": data["patient_count"],
            "active_alerts": data["alerts_count"],
            "avg_pain_score": avg_p,
            "readmission_risk": readmit_risk
        })

    total_checkins = len(checkins)
    overall_adherence = round((sum(1 for c in checkins if c.medication_taken) / total_checkins) * 100) if total_checkins > 0 else 92
    total_alerts = len(alerts)
    resolved_alerts = sum(1 for a in alerts if a.status in ["acknowledged", "resolved"])
    alert_resolution_rate = round((resolved_alerts / total_alerts) * 100) if total_alerts > 0 else 100

    return {
        "total_monitored_patients": len(patients),
        "total_checkins_logged": total_checkins,
        "overall_medication_adherence": overall_adherence,
        "alert_resolution_rate": alert_resolution_rate,
        "risk_distribution": risk_counts,
        "daily_trends": trend_series,
        "procedure_breakdown": procedure_list
    }

@router.get("/export-csv")
def export_recovery_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hospital_id = current_user.hospital_id
    patients = db.query(Patient).filter(Patient.hospital_id == hospital_id).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Patient ID", "MRN", "Full Name", "Phone", "DOB", "Gender",
        "Procedure", "Diagnosis", "Total Checkins", "Latest Pain (0-10)",
        "Latest Risk Level", "Active Alerts", "Latest Checkin Date"
    ])

    for p in patients:
        proc = "N/A"
        diag = "N/A"
        if p.care_plans and p.care_plans[0].discharge_record:
            rec = p.care_plans[0].discharge_record
            proc = rec.surgical_procedure or "N/A"
            if rec.admission:
                diag = rec.admission.diagnosis or "N/A"

        latest_c = db.query(Checkin).filter(Checkin.patient_id == p.id).order_by(desc(Checkin.submitted_at)).first()
        active_alerts = db.query(Alert).filter(Alert.patient_id == p.id, Alert.status == "pending").count()

        writer.writerow([
            p.id,
            p.mrn or "N/A",
            p.full_name,
            p.phone,
            p.date_of_birth,
            p.gender,
            proc,
            diag,
            len(p.checkins),
            latest_c.pain_level if latest_c else "N/A",
            latest_c.ai_risk_level if latest_c else "low",
            active_alerts,
            latest_c.date if latest_c else "None"
        ])

    csv_data = output.getvalue()
    filename = f"aftercare_recovery_report_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

