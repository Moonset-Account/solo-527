from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case

from app.models import (
    Category, Ticket, AnnotationVersion, SimilarCase, ErrorSample,
    ModelVersion, BatchConfirmLog,
)
from app.models.ticket import TicketStatus, RefundStatus
from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse, CategoryCreate, CategoryUpdate,
    AnnotationCreate, BatchConfirmRequest,
)
from app.ml.cleaner import TextCleaner


class CategoryService:
    @staticmethod
    def get_all(db: Session, active_only: bool = True) -> List[Category]:
        query = db.query(Category)
        if active_only:
            query = query.filter(Category.is_active == True)
        return query.order_by(Category.parent_id, Category.code).all()

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Category]:
        return db.query(Category).filter(Category.code == code).first()

    @staticmethod
    def create(db: Session, data: CategoryCreate) -> Category:
        category = Category(**data.model_dump())
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update(db: Session, category_id: int, data: CategoryUpdate) -> Optional[Category]:
        category = CategoryService.get_by_id(db, category_id)
        if not category:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(category, k, v)
        category.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def get_flat_list(db: Session, active_only: bool = True) -> List[Tuple[int, str, str]]:
        return [
            (c.id, c.code, c.name) for c in CategoryService.get_all(db, active_only)
        ]


class TicketService:
    @staticmethod
    def create(db: Session, data: TicketCreate) -> Ticket:
        ticket = Ticket(**data.model_dump())
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def bulk_create(db: Session, tickets: List[TicketCreate]) -> List[Ticket]:
        objects = [Ticket(**t.model_dump()) for t in tickets]
        db.bulk_save_objects(objects)
        db.commit()
        return objects

    @staticmethod
    def get_by_id(db: Session, ticket_id: int) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.id == ticket_id).first()

    @staticmethod
    def get_by_no(db: Session, ticket_no: str) -> Optional[Ticket]:
        return db.query(Ticket).filter(Ticket.ticket_no == ticket_no).first()

    @staticmethod
    def list(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        channel: Optional[str] = None,
        category_id: Optional[int] = None,
        predicted_category_id: Optional[int] = None,
        is_error_case: Optional[bool] = None,
        low_confidence_only: bool = False,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        keyword: Optional[str] = None,
    ) -> Tuple[List[Ticket], int]:
        query = db.query(Ticket)

        if status:
            query = query.filter(Ticket.status == status)
        if channel:
            query = query.filter(Ticket.channel == channel)
        if category_id is not None:
            query = query.filter(Ticket.category_id == category_id)
        if predicted_category_id is not None:
            query = query.filter(Ticket.predicted_category_id == predicted_category_id)
        if is_error_case is not None:
            query = query.filter(Ticket.is_error_case == is_error_case)
        if low_confidence_only:
            from app.core.config import settings
            query = query.filter(Ticket.confidence < settings.LOW_CONFIDENCE_THRESHOLD)
        if date_from:
            query = query.filter(Ticket.created_at >= date_from)
        if date_to:
            query = query.filter(Ticket.created_at <= date_to)
        if keyword:
            like = f"%{keyword}%"
            query = query.filter(or_(Ticket.title.ilike(like), Ticket.content.ilike(like)))

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Ticket.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    @staticmethod
    def update(db: Session, ticket_id: int, data: TicketUpdate) -> Optional[Ticket]:
        ticket = TicketService.get_by_id(db, ticket_id)
        if not ticket:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(ticket, k, v)
        ticket.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def update_prediction(
        db: Session,
        ticket_id: int,
        predicted_category_id: int,
        confidence: float,
        model_version_id: int,
        similar_cases: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[Ticket]:
        from app.core.config import settings
        ticket = TicketService.get_by_id(db, ticket_id)
        if not ticket:
            return None

        ticket.predicted_category_id = predicted_category_id
        ticket.confidence = confidence
        ticket.model_version_id = model_version_id

        if confidence < settings.LOW_CONFIDENCE_THRESHOLD:
            ticket.status = TicketStatus.PENDING_REVIEW.value
        else:
            ticket.status = TicketStatus.AUTO_CLASSIFIED.value

        ticket.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(ticket)

        if similar_cases:
            for sc in similar_cases:
                case = SimilarCase(
                    ticket_id=ticket_id,
                    similar_ticket_id=sc.get("ticket_id"),
                    similarity_score=sc.get("similarity_score", 0.0),
                    category_match=sc.get("category_match"),
                )
                db.add(case)
            db.commit()

        return ticket

    @staticmethod
    def get_pending_tickets(db: Session, limit: int = 1000) -> List[Ticket]:
        return (
            db.query(Ticket)
            .filter(Ticket.status.in_([TicketStatus.NEW.value]))
            .order_by(Ticket.created_at.asc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_confirmed_tickets_for_training(
        db: Session,
        from_date: Optional[datetime] = None,
        include_error_samples: bool = True,
    ) -> List[Ticket]:
        query = db.query(Ticket).filter(
            Ticket.category_id.isnot(None),
            Ticket.status == TicketStatus.CONFIRMED.value,
        )
        if from_date:
            query = query.filter(Ticket.created_at >= from_date)
        if not include_error_samples:
            query = query.filter(Ticket.is_error_case == False)
        return query.order_by(Ticket.created_at.asc()).all()

    @staticmethod
    def build_training_text(ticket: Ticket) -> str:
        cleaner = TextCleaner()
        cleaned = cleaner.clean_ticket(ticket.title, ticket.content, ticket.channel)
        return cleaned.normalized or cleaned.cleaned

    @staticmethod
    def get_similar_cases(db: Session, ticket_id: int) -> List[Dict[str, Any]]:
        cases = (
            db.query(SimilarCase)
            .filter(SimilarCase.ticket_id == ticket_id)
            .order_by(SimilarCase.similarity_score.desc())
            .limit(5)
            .all()
        )
        result = []
        for c in cases:
            sim_ticket = c.similar_ticket
            result.append({
                "ticket_id": c.similar_ticket_id,
                "title": sim_ticket.title if sim_ticket else "",
                "category_id": c.similar_ticket.category_id if sim_ticket else None,
                "similarity_score": c.similarity_score,
                "category_match": c.category_match,
            })
        return result


class AnnotationService:
    @staticmethod
    def get_versions(db: Session, ticket_id: int) -> List[AnnotationVersion]:
        return (
            db.query(AnnotationVersion)
            .filter(AnnotationVersion.ticket_id == ticket_id)
            .order_by(AnnotationVersion.version.desc())
            .all()
        )

    @staticmethod
    def get_latest_version(db: Session, ticket_id: int) -> Optional[AnnotationVersion]:
        return (
            db.query(AnnotationVersion)
            .filter(AnnotationVersion.ticket_id == ticket_id)
            .order_by(AnnotationVersion.version.desc())
            .first()
        )

    @staticmethod
    def create_annotation(
        db: Session,
        data: AnnotationCreate,
        skip_version_check: bool = False,
    ) -> Tuple[Optional[AnnotationVersion], Optional[str]]:
        ticket = TicketService.get_by_id(db, data.ticket_id)
        if not ticket:
            return None, "工单不存在"

        category = CategoryService.get_by_id(db, data.category_id)
        if not category:
            return None, "分类不存在"

        latest = AnnotationService.get_latest_version(db, data.ticket_id)
        next_version = (latest.version + 1) if latest else 1

        if not skip_version_check and latest and latest.category_id == data.category_id:
            return latest, None

        change_log = {}
        if latest:
            change_log = {
                "previous_category_id": latest.category_id,
                "previous_category_name": latest.category.name if latest.category else None,
                "new_category_id": data.category_id,
                "new_category_name": category.name,
            }

        annotation = AnnotationVersion(
            ticket_id=data.ticket_id,
            category_id=data.category_id,
            version=next_version,
            reason=data.reason,
            operator_id=data.operator_id,
            operator_name=data.operator_name,
            source=data.source,
            change_log=change_log,
        )
        db.add(annotation)

        original_predicted = ticket.predicted_category_id
        ticket.category_id = data.category_id
        ticket.status = TicketStatus.HUMAN_REVIEWED.value

        if (original_predicted is not None
                and original_predicted != data.category_id
                and ticket.confidence is not None):
            ticket.is_error_case = True
            ticket.error_source_id = data.operator_id

            existing_err = (
                db.query(ErrorSample)
                .filter(ErrorSample.ticket_id == data.ticket_id)
                .first()
            )
            if not existing_err:
                error = ErrorSample(
                    ticket_id=data.ticket_id,
                    original_predicted_id=original_predicted,
                    correct_category_id=data.category_id,
                    source=data.source,
                    model_version_id=ticket.model_version_id,
                    reported_by=data.operator_name,
                )
                db.add(error)

        ticket.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(annotation)
        return annotation, None

    @staticmethod
    def batch_confirm(
        db: Session,
        data: BatchConfirmRequest,
    ) -> Tuple[Dict[str, Any], Optional[str]]:
        valid_tickets = (
            db.query(Ticket)
            .filter(Ticket.id.in_(data.ticket_ids))
            .filter(Ticket.status.in_([
                TicketStatus.AUTO_CLASSIFIED.value,
                TicketStatus.HUMAN_REVIEWED.value,
                TicketStatus.PENDING_REVIEW.value,
            ]))
            .all()
        )

        overrides = data.category_overrides or {}
        confirmed_count = 0
        error_case_count = 0
        category_updates = {}

        for ticket in valid_tickets:
            final_category_id = overrides.get(ticket.id) or ticket.predicted_category_id or ticket.category_id
            if final_category_id is None:
                continue

            category = CategoryService.get_by_id(db, final_category_id)
            if not category:
                continue

            if ticket.status == TicketStatus.AUTO_CLASSIFIED.value:
                if ticket.predicted_category_id == final_category_id:
                    ticket.category_id = final_category_id
                else:
                    AnnotationService.create_annotation(
                        db,
                        AnnotationCreate(
                            ticket_id=ticket.id,
                            category_id=final_category_id,
                            reason=f"批量覆盖：{data.reason}",
                            operator_id=data.operator_id,
                            operator_name=data.operator_name,
                            source="batch_confirm",
                        ),
                        skip_version_check=True,
                    )
            elif ticket.status in [TicketStatus.HUMAN_REVIEWED.value, TicketStatus.PENDING_REVIEW.value]:
                if ticket.category_id != final_category_id:
                    AnnotationService.create_annotation(
                        db,
                        AnnotationCreate(
                            ticket_id=ticket.id,
                            category_id=final_category_id,
                            reason=f"批量覆盖：{data.reason}",
                            operator_id=data.operator_id,
                            operator_name=data.operator_name,
                            source="batch_confirm",
                        ),
                        skip_version_check=True,
                    )

            ticket.status = TicketStatus.CONFIRMED.value
            ticket.confirmed_at = datetime.utcnow()
            ticket.updated_at = datetime.utcnow()
            category_updates[str(ticket.id)] = final_category_id

            if ticket.is_error_case:
                error_case_count += 1
            confirmed_count += 1

        log = BatchConfirmLog(
            operator_id=data.operator_id,
            operator_name=data.operator_name,
            ticket_ids=[t.id for t in valid_tickets],
            category_updates=category_updates,
            total_count=len(valid_tickets),
            error_case_count=error_case_count,
            stats_updated=False,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "batch_id": log.id,
            "total_count": log.total_count,
            "confirmed_count": confirmed_count,
            "error_case_count": error_case_count,
            "stats_updated": False,
            "created_at": log.created_at,
        }, None


class ErrorSampleService:
    @staticmethod
    def list(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        source: Optional[str] = None,
        included_in_training: Optional[bool] = None,
        model_version_id: Optional[int] = None,
    ) -> Tuple[List[ErrorSample], int, Dict[str, int]]:
        query = db.query(ErrorSample)

        if source:
            query = query.filter(ErrorSample.source == source)
        if included_in_training is not None:
            query = query.filter(ErrorSample.included_in_training == included_in_training)
        if model_version_id:
            query = query.filter(ErrorSample.model_version_id == model_version_id)

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(ErrorSample.created_at.desc()).offset(offset).limit(page_size).all()

        source_counts = dict(
            db.query(ErrorSample.source, func.count(ErrorSample.id))
            .group_by(ErrorSample.source)
            .all()
        )

        return items, total, source_counts

    @staticmethod
    def get_for_training(
        db: Session,
        source_filter: Optional[List[str]] = None,
        training_run_id: Optional[int] = None,
    ) -> List[ErrorSample]:
        query = db.query(ErrorSample)
        if source_filter:
            query = query.filter(ErrorSample.source.in_(source_filter))
        return query.filter(ErrorSample.included_in_training == False).all()

    @staticmethod
    def mark_included(
        db: Session,
        sample_ids: List[int],
        training_run_id: int,
    ) -> int:
        if not sample_ids:
            return 0
        count = (
            db.query(ErrorSample)
            .filter(ErrorSample.id.in_(sample_ids))
            .update({
                ErrorSample.included_in_training: True,
                ErrorSample.training_run_id: training_run_id,
            }, synchronize_session=False)
        )
        db.commit()
        return count

    @staticmethod
    def get_error_sources_with_metadata(
        db: Session,
    ) -> List[Dict[str, Any]]:
        rows = (
            db.query(
                ErrorSample.source,
                func.count(ErrorSample.id),
                func.sum(case((ErrorSample.included_in_training == True, 1), else_=0)),
                ModelVersion.version_tag,
            )
            .outerjoin(ModelVersion, ModelVersion.id == ErrorSample.model_version_id)
            .group_by(ErrorSample.source, ModelVersion.version_tag)
            .all()
        )
        return [
            {
                "source": r[0],
                "model_version": r[3],
                "total": r[1],
                "included_in_training": r[2],
                "pending": r[1] - (r[2] or 0),
            }
            for r in rows
        ]
