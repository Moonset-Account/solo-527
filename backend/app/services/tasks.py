from celery import shared_task
from sqlalchemy import select

from app.database import async_session
from app.models.models import User, Notification, Contract, InspectionTask, SatisfactionRecord
from app.services.inspection_service import detect_delayed_tasks


@shared_task(name="check_delayed_tasks")
def check_delayed_tasks():
    import asyncio

    async def _run():
        async with async_session() as session:
            try:
                delayed = await detect_delayed_tasks(session)

                material_staff_result = await session.execute(
                    select(User).where(User.role == "material_staff")
                )
                material_staff = material_staff_result.scalars().all()

                for task in delayed:
                    contract_result = await session.execute(
                        select(Contract).where(Contract.id == task.contract_id)
                    )
                    contract = contract_result.scalar_one_or_none()
                    contract_name = contract.name if contract else f"合同{task.contract_id}"

                    inspector_notif = Notification(
                        user_id=task.inspector_id,
                        type="delay_warning",
                        title="验收任务延期通知",
                        content=f"验收任务「{task.node_name}」已超过截止日期，请尽快处理",
                        is_demo=task.is_demo,
                    )
                    session.add(inspector_notif)

                    for ms in material_staff:
                        material_notif = Notification(
                            user_id=ms.id,
                            type="material_reminder",
                            title="节点延期提醒",
                            content=f"合同「{contract_name}」的「{task.node_name}」节点已延期，请准备后续材料安排",
                            is_demo=task.is_demo,
                        )
                        session.add(material_notif)

                await session.flush()
                await session.commit()
                return len(delayed)
            except Exception:
                await session.rollback()
                raise

    return asyncio.run(_run())


@shared_task(name="send_pending_notifications")
def send_pending_notifications():
    import asyncio
    from datetime import date, timedelta

    async def _run():
        async with async_session() as session:
            try:
                today = date.today()
                three_days_later = today + timedelta(days=3)

                query = select(InspectionTask).where(
                    InspectionTask.status.in_(["pending", "in_progress"]),
                    InspectionTask.deadline >= today,
                    InspectionTask.deadline <= three_days_later,
                    InspectionTask.is_delayed == False,
                )
                result = await session.execute(query)
                upcoming_tasks = result.scalars().all()

                for task in upcoming_tasks:
                    contract_result = await session.execute(
                        select(Contract).where(Contract.id == task.contract_id)
                    )
                    contract = contract_result.scalar_one_or_none()
                    contract_name = contract.name if contract else f"合同{task.contract_id}"

                    days_left = (task.deadline - today).days
                    if days_left == 0:
                        message = f"合同「{contract_name}」的「{task.node_name}」任务今天到期"
                    else:
                        message = f"合同「{contract_name}」的「{task.node_name}」任务还有{days_left}天到期"

                    existing_notif = await session.execute(
                        select(Notification).where(
                            Notification.user_id == task.inspector_id,
                            Notification.title.contains(task.node_name),
                            Notification.is_read == False,
                        )
                    )
                    if not existing_notif.scalar_one_or_none():
                        notif = Notification(
                            user_id=task.inspector_id,
                            type="inspection_due",
                            title="验收任务即将到期",
                            content=message,
                            is_demo=task.is_demo,
                        )
                        session.add(notif)

                await session.flush()
                await session.commit()
                return len(upcoming_tasks)
            except Exception:
                await session.rollback()
                raise

    return asyncio.run(_run())


@shared_task(name="send_satisfaction_reminders")
def send_satisfaction_reminders():
    import asyncio
    from datetime import date, timedelta

    async def _run():
        async with async_session() as session:
            try:
                seven_days_ago = date.today() - timedelta(days=7)

                query = select(SatisfactionRecord).where(
                    SatisfactionRecord.level == "pending",
                    SatisfactionRecord.created_at <= seven_days_ago,
                )
                result = await session.execute(query)
                pending_records = result.scalars().all()

                for record in pending_records:
                    contract_result = await session.execute(
                        select(Contract).where(Contract.id == record.contract_id)
                    )
                    contract = contract_result.scalar_one_or_none()
                    contract_name = contract.name if contract else f"合同{record.contract_id}"

                    admin_result = await session.execute(
                        select(User).where(User.role == "admin")
                    )
                    admins = admin_result.scalars().all()

                    for admin in admins:
                        notif = Notification(
                            user_id=admin.id,
                            type="satisfaction_reminder",
                            title="满意度评价催办",
                            content=f"合同「{contract_name}」的客户满意度评价待提交，请提醒客户",
                            is_demo=record.is_demo,
                        )
                        session.add(notif)

                await session.flush()
                await session.commit()
                return len(pending_records)
            except Exception:
                await session.rollback()
                raise

    return asyncio.run(_run())
