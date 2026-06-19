from app.services.celery_app import celery_app
from app.core.database import SessionLocal
from app.crud import crud_refund_exception, crud_registration, crud_todo
from app.models.registration import RegistrationStatus
from app.models.todo import TodoPriority, TodoType
from app.schemas.todo import TodoCreate
from app.schemas.registration import RegistrationUpdate


@celery_app.task(bind=True, name="process_refund_exception")
def process_refund_exception(self, registration_id: int, description: str, refund_amount: int = 0):
    """
    处理退票异常，自动创建待办事项
    """
    db = SessionLocal()
    try:
        registration = crud_registration.get(db, id=registration_id)
        if not registration:
            return {"status": "error", "message": "报名记录不存在"}
        
        existing_exceptions = crud_refund_exception.get_multi(
            db, registration_id=registration_id, limit=10
        )
        if existing_exceptions[1] > 0:
            return {"status": "skipped", "message": "已存在退票异常记录"}
        
        exception = crud_refund_exception.create_auto(
            db,
            registration_id=registration_id,
            description=description,
            refund_amount=refund_amount,
        )
        
        todo_data = TodoCreate(
            title=f"退票异常处理 - {registration.real_name}",
            description=f"自动生成退票异常：{description}\n报名编号：{registration.registration_no}\n退款金额：{refund_amount}",
            priority=TodoPriority.HIGH,
            todo_type=TodoType.REFUND_EXCEPTION,
            registration_id=registration_id,
        )
        todo = crud_todo.create_with_creator(db, obj_in=todo_data, created_by_id=None)
        todo.refund_exception_id = exception.id
        db.commit()
        db.refresh(todo)
        
        return {
            "status": "success",
            "exception_id": exception.id,
            "todo_id": todo.id,
            "registration_id": registration_id,
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, name="sync_refund_result_to_participation")
def sync_refund_result_to_participation(self, registration_id: int, actual_refund_amount: int):
    """
    将退票处理结果回写到活动参与状态
    """
    db = SessionLocal()
    try:
        registration = crud_registration.get(db, id=registration_id)
        if not registration:
            return {"status": "error", "message": "报名记录不存在"}
        
        if actual_refund_amount > 0:
            crud_registration.update(
                db,
                db_obj=registration,
                obj_in=RegistrationUpdate(status=RegistrationStatus.REFUNDED),
            )
        
        return {
            "status": "success",
            "registration_id": registration_id,
            "new_status": RegistrationStatus.REFUNDED.value if actual_refund_amount > 0 else registration.status.value,
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(bind=True, name="auto_check_refund_exceptions")
def auto_check_refund_exceptions(self):
    """
    定时检查退票异常，自动生成待办
    """
    db = SessionLocal()
    try:
        from app.models.registration import Registration
        from sqlalchemy import and_
        
        refunding_registrations = db.query(Registration).filter(
            Registration.status == RegistrationStatus.REFUND_EXCEPTION
        ).all()
        
        created_count = 0
        for reg in refunding_registrations:
            existing, _ = crud_refund_exception.get_multi(
                db, registration_id=reg.id, limit=1
            )
            if not existing:
                process_refund_exception.delay(
                    registration_id=reg.id,
                    description="系统检测到退票异常状态，需要人工处理",
                    refund_amount=reg.ticket_price,
                )
                created_count += 1
        
        return {
            "status": "success",
            "refund_exception_count": len(refunding_registrations),
            "new_todos_created": created_count,
        }
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
