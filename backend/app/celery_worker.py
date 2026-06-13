import os
import re
from datetime import datetime
from celery import Celery
from diff_match_patch import diff_match_patch
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

app = Celery(
    "qinghe_tasks",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

app.conf.task_routes = {
    "app.celery_worker.*": {"queue": "default"},
}

SYNC_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://qinghe:qinghe123@localhost:5432/qinghe_qa"
).replace("+asyncpg", "+psycopg2")

engine = create_engine(SYNC_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def _calculate_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0

    dmp = diff_match_patch()
    diff = dmp.diff_main(text1, text2)
    dmp.diff_cleanupSemantic(diff)

    total_chars = sum(len(text) for _, text in diff)
    same_chars = sum(len(text) for op, text in diff if op == 0)

    return same_chars / total_chars if total_chars > 0 else 0.0


def _extract_keywords(text: str) -> set:
    if not text:
        return set()
    words = re.findall(r'[\w\u4e00-\u9fa5]+', text.lower())
    return set(words)


def _jaccard_similarity(set1: set, set2: set) -> float:
    if not set1 and not set2:
        return 1.0
    intersection = set1 & set2
    union = set1 | set2
    return len(intersection) / len(union) if union else 0.0


@app.task(name="app.celery_worker.analyze_ticket_similarity")
def analyze_ticket_similarity(ticket_id: int):
    from app.models import Ticket, TicketSimilarity

    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return {"status": "error", "message": "Ticket not found"}

        other_tickets = db.query(Ticket).filter(
            Ticket.id != ticket_id,
            Ticket.created_at >= ticket.created_at.replace(year=ticket.created_at.year - 1)
        ).all()

        combined_text = f"{ticket.title} {ticket.description}"
        keywords = _extract_keywords(combined_text)

        similarities = []
        for other in other_tickets:
            other_combined = f"{other.title} {other.description}"
            other_keywords = _extract_keywords(other_combined)

            content_sim = _calculate_similarity(combined_text, other_combined)
            keyword_sim = _jaccard_similarity(keywords, other_keywords)

            total_sim = (content_sim * 0.6) + (keyword_sim * 0.4)

            if total_sim >= 0.3:
                similarities.append((other.id, total_sim))

        similarities.sort(key=lambda x: x[1], reverse=True)

        for similar_id, score in similarities[:10]:
            existing = db.query(TicketSimilarity).filter(
                TicketSimilarity.ticket_id == ticket_id,
                TicketSimilarity.similar_ticket_id == similar_id
            ).first()

            if existing:
                existing.similarity_score = score
                existing.calculated_at = datetime.utcnow()
            else:
                sim = TicketSimilarity(
                    ticket_id=ticket_id,
                    similar_ticket_id=similar_id,
                    similarity_score=score
                )
                db.add(sim)

            reverse_existing = db.query(TicketSimilarity).filter(
                TicketSimilarity.ticket_id == similar_id,
                TicketSimilarity.similar_ticket_id == ticket_id
            ).first()

            if not reverse_existing:
                reverse_sim = TicketSimilarity(
                    ticket_id=similar_id,
                    similar_ticket_id=ticket_id,
                    similarity_score=score
                )
                db.add(reverse_sim)

        high_sim_count = sum(1 for _, s in similarities if s >= 0.7)
        if high_sim_count >= 3:
            ticket.has_overdue_risk = True

        db.commit()

        return {
            "status": "success",
            "ticket_id": ticket_id,
            "similar_found": len(similarities),
            "high_similarity_count": high_sim_count
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.task(name="app.celery_worker.check_sla_overdue")
def check_sla_overdue():
    from app.models import Ticket, TicketStatus

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        tickets = db.query(Ticket).filter(
            Ticket.status.in_([TicketStatus.PENDING, TicketStatus.PROCESSING]),
            Ticket.sla_deadline.isnot(None),
            Ticket.sla_deadline < now
        ).all()

        count = 0
        for ticket in tickets:
            if not ticket.has_overdue_risk:
                ticket.has_overdue_risk = True
                count += 1

        db.commit()
        return {"status": "success", "updated_tickets": count}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.task(name="app.celery_worker.analyze_risk_ticket")
def analyze_risk_ticket(ticket_id: int):
    from app.models import Ticket, RiskSample, RiskLevel, CustomerFeedback

    db = SessionLocal()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return {"status": "error", "message": "Ticket not found"}

        risk_factors = 0
        risk_level = RiskLevel.LOW

        feedback = db.query(CustomerFeedback).filter(
            CustomerFeedback.ticket_id == ticket_id
        ).first()

        if feedback and feedback.rating <= 2:
            risk_factors += 2

        if ticket.has_overdue_risk:
            risk_factors += 1

        if ticket.priority in ["high", "urgent"]:
            risk_factors += 1

        similar_count = db.execute(
            select(Ticket).join(
                Ticket.similar_tickets
            ).filter(
                Ticket.id == ticket_id,
                Ticket.similar_tickets.any(similarity_score__gte=0.7)
            )
        ).scalar()

        if similar_count and similar_count >= 5:
            risk_factors += 1

        if risk_factors >= 4:
            risk_level = RiskLevel.CRITICAL
        elif risk_factors >= 3:
            risk_level = RiskLevel.HIGH
        elif risk_factors >= 2:
            risk_level = RiskLevel.MEDIUM

        if risk_level != RiskLevel.LOW:
            existing = db.query(RiskSample).filter(
                RiskSample.ticket_id == ticket_id
            ).first()

            if not existing:
                risk_sample = RiskSample(
                    ticket_id=ticket_id,
                    risk_level=risk_level,
                    risk_type="auto_detected",
                    description=f"自动检测到风险，风险因子数：{risk_factors}"
                )
                db.add(risk_sample)
                ticket.risk_level = risk_level
                ticket.has_overdue_risk = True
                db.commit()

        return {
            "status": "success",
            "ticket_id": ticket_id,
            "risk_factors": risk_factors,
            "risk_level": risk_level.value
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


app.conf.beat_schedule = {
    "check-sla-overdue-every-hour": {
        "task": "app.celery_worker.check_sla_overdue",
        "schedule": 3600.0,
    },
}
