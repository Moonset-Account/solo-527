from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth import get_current_user, RoleChecker
from app.services.apartment_service import get_vacancy_stats
from app.services.appointment_service import count_appointments, get_today_appointments
from app.services.deposit_service import get_total_deposit_amount
from app.services.risk_service import count_risks
from app.models import User

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vacancy_stats = get_vacancy_stats(db)

    consultant_id = current_user.id if current_user.role == "consultant" else None
    today_count = get_today_appointments(db, consultant_id)
    pending_appointments = count_appointments(db, status="pending")
    pending_risks = count_risks(db, status="pending")
    total_deposits = get_total_deposit_amount(db, status="paid")

    return {
        "total_apartments": vacancy_stats["total"],
        "vacant_apartments": vacancy_stats["vacant"],
        "occupied_apartments": vacancy_stats["occupied"],
        "vacancy_rate": vacancy_stats["vacancy_rate"],
        "today_appointments": today_count,
        "pending_appointments": pending_appointments,
        "pending_risks": pending_risks,
        "total_deposits": total_deposits
    }
