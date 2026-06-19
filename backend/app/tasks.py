from celery import shared_task
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from decimal import Decimal
from app.database import SessionLocal
from app import models
from app.config import settings


@shared_task(bind=True, name="app.tasks.check_near_expiry_batches")
def check_near_expiry_batches(self):
    db = SessionLocal()
    try:
        today = date.today()
        threshold_date_90 = today + timedelta(days=90)
        threshold_date_30 = today + timedelta(days=30)
        threshold_date_7 = today + timedelta(days=7)

        batches = db.query(models.Batch).filter(
            models.Batch.status.in_([models.BatchStatus.IN_STOCK, models.BatchStatus.PARTIAL]),
            models.Batch.expiry_date <= threshold_date_90,
            models.Batch.quantity > 0
        ).all()

        created_count = 0
        for batch in batches:
            days_to_expiry = (batch.expiry_date - today).days

            if days_to_expiry <= 7:
                level = models.RiskLevel.CRITICAL
                action = "立即启动紧急促销或退回供应商"
            elif days_to_expiry <= 30:
                level = models.RiskLevel.HIGH
                action = "加快出库，联系销售部优先出库"
            elif days_to_expiry <= 90:
                level = models.RiskLevel.MEDIUM
                action = "关注库存情况，制定促销计划"
            else:
                level = models.RiskLevel.LOW
                action = "纳入日常监控"

            existing = db.query(models.ExpiryReminder).filter(
                models.ExpiryReminder.batch_id == batch.id,
                models.ExpiryReminder.status == models.ReminderStatus.PENDING
            ).first()

            if not existing:
                total_stock = db.query(func.sum(models.Stock.quantity)).filter(
                    models.Stock.batch_id == batch.id
                ).scalar() or 0

                reminder = models.ExpiryReminder(
                    batch_id=batch.id,
                    days_to_expiry=days_to_expiry,
                    reminder_level=level,
                    status=models.ReminderStatus.PENDING,
                    current_stock=total_stock,
                    suggested_action=action
                )
                db.add(reminder)
                created_count += 1

        db.commit()
        return {"status": "success", "created_reminders": created_count, "checked_batches": len(batches)}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@shared_task(bind=True, name="app.tasks.check_low_stock")
def check_low_stock(self):
    db = SessionLocal()
    try:
        created_count = 0
        medicines = db.query(models.Medicine).filter(
            models.Medicine.is_active == True
        ).all()

        for med in medicines:
            total_stock = db.query(func.sum(models.Stock.available_quantity)).join(
                models.Batch, models.Stock.batch_id == models.Batch.id
            ).filter(
                models.Batch.medicine_id == med.id,
                models.Batch.status.in_([models.BatchStatus.IN_STOCK, models.BatchStatus.PARTIAL])
            ).scalar() or 0

            avg_daily = Decimal(med.reorder_point / 30) if med.reorder_point > 0 else Decimal(0)
            days_of_stock = Decimal(total_stock / avg_daily) if avg_daily > 0 else Decimal(999)

            if total_stock < med.safety_stock:
                if total_stock == 0:
                    level = models.RiskLevel.CRITICAL
                    desc = f"{med.name} 库存已断货"
                elif total_stock < (med.safety_stock * 0.3):
                    level = models.RiskLevel.HIGH
                    desc = f"{med.name} 库存严重不足"
                else:
                    level = models.RiskLevel.MEDIUM
                    desc = f"{med.name} 库存低于安全线"

                existing = db.query(models.StockRisk).filter(
                    models.StockRisk.medicine_id == med.id,
                    models.StockRisk.status == models.ReminderStatus.PENDING
                ).first()

                if not existing:
                    risk = models.StockRisk(
                        medicine_id=med.id,
                        risk_type="low_stock",
                        risk_level=level,
                        current_stock=total_stock,
                        avg_daily_consumption=avg_daily,
                        days_of_stock=days_of_stock,
                        description=desc
                    )
                    db.add(risk)
                    created_count += 1

        db.commit()
        return {"status": "success", "created_risks": created_count}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@shared_task(bind=True, name="app.tasks.generate_replenish_suggestions")
def generate_replenish_suggestions(self):
    db = SessionLocal()
    try:
        created_count = 0
        medicines = db.query(models.Medicine).filter(
            models.Medicine.is_active == True
        ).all()

        for med in medicines:
            total_stock = db.query(func.sum(models.Stock.available_quantity)).join(
                models.Batch, models.Stock.batch_id == models.Batch.id
            ).filter(
                models.Batch.medicine_id == med.id,
                models.Batch.status.in_([models.BatchStatus.IN_STOCK, models.BatchStatus.PARTIAL])
            ).scalar() or 0

            if total_stock <= med.reorder_point:
                gap = med.max_stock - total_stock
                suggested_qty = max(gap, med.safety_stock * 2)

                if total_stock == 0:
                    priority = models.RiskLevel.CRITICAL
                elif total_stock < med.safety_stock:
                    priority = models.RiskLevel.HIGH
                else:
                    priority = models.RiskLevel.MEDIUM

                reasons = []
                if total_stock < med.safety_stock:
                    reasons.append(f"当前库存{total_stock}{med.unit}低于安全库存{med.safety_stock}{med.unit}")
                if total_stock <= med.reorder_point:
                    reasons.append(f"已达到补货点{med.reorder_point}{med.unit}")

                existing = db.query(models.ReplenishSuggestion).filter(
                    models.ReplenishSuggestion.medicine_id == med.id,
                    models.ReplenishSuggestion.status.in_(["pending", "in_progress"])
                ).first()

                if not existing:
                    suggestion = models.ReplenishSuggestion(
                        medicine_id=med.id,
                        current_stock=total_stock,
                        safety_stock=med.safety_stock,
                        reorder_point=med.reorder_point,
                        suggested_quantity=suggested_qty,
                        max_stock=med.max_stock,
                        priority=priority,
                        status="pending",
                        suggestion_reason="；".join(reasons)
                    )
                    db.add(suggestion)
                    created_count += 1

        db.commit()
        return {"status": "success", "created_suggestions": created_count}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@shared_task(bind=True, name="app.tasks.check_sign_differences")
def check_sign_differences(self):
    db = SessionLocal()
    try:
        created_count = 0
        batches = db.query(models.Batch).filter(
            models.Batch.received_quantity > 0,
            models.Batch.quantity != models.Batch.received_quantity,
            models.Batch.sign_difference == 0
        ).all()

        for batch in batches:
            diff_qty = batch.received_quantity - batch.quantity
            diff_amount = Decimal(diff_qty) * (batch.purchase_price or 0)

            existing = db.query(models.SignDifference).filter(
                models.SignDifference.batch_id == batch.id,
                models.SignDifference.status == "pending"
            ).first()

            if not existing and diff_qty != 0:
                sign_diff = models.SignDifference(
                    batch_id=batch.id,
                    purchase_order_no=batch.purchase_order_no,
                    expected_quantity=batch.quantity,
                    actual_quantity=batch.received_quantity,
                    difference_quantity=diff_qty,
                    difference_amount=diff_amount,
                    status="pending"
                )
                batch.sign_difference = diff_amount
                batch.sign_difference_remark = f"系统自动检测：预期{batch.quantity}，实收{batch.received_quantity}"
                db.add(sign_diff)
                created_count += 1

        db.commit()
        return {"status": "success", "detected_differences": created_count}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@shared_task(bind=True, name="app.tasks.export_report")
def export_report(self, report_id: int):
    import os
    import pandas as pd
    from pathlib import Path

    db = SessionLocal()
    try:
        report = db.query(models.ReportExport).filter(models.ReportExport.id == report_id).first()
        if not report:
            return {"status": "error", "message": "报表不存在"}

        export_dir = Path("/app/exports")
        export_dir.mkdir(parents=True, exist_ok=True)
        file_name = f"{report.report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{report.id}.xlsx"
        file_path = export_dir / file_name

        data, columns = _get_report_data(db, report)
        df = pd.DataFrame(data, columns=columns)
        df.to_excel(str(file_path), index=False, engine='openpyxl')

        file_size = file_path.stat().st_size
        report.file_path = str(file_path)
        report.file_size = file_size
        report.total_records = len(data)
        report.status = "completed"
        report.generated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "file_path": str(file_path), "records": len(data)}
    except Exception as e:
        if report:
            report.status = "failed"
            report.error_message = str(e)
            db.commit()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def _get_report_data(db: Session, report: models.ReportExport):
    filters = report.filters or {}
    report_type = report.report_type

    if report_type == "stock_summary":
        return _get_stock_summary(db, filters)
    elif report_type == "batch_flow":
        return _get_batch_flow_report(db, filters)
    elif report_type == "near_expiry":
        return _get_near_expiry_report(db, filters)
    elif report_type == "abnormal_record":
        return _get_abnormal_report(db, filters)
    elif report_type == "replenish":
        return _get_replenish_report(db, filters)
    elif report_type == "sign_difference":
        return _get_sign_diff_report(db, filters)
    else:
        return [], ["无数据"]


def _get_stock_summary(db: Session, filters: dict):
    query = db.query(
        models.Medicine.code.label("药品编码"),
        models.Medicine.name.label("药品名称"),
        models.Medicine.specification.label("规格"),
        models.Medicine.unit.label("单位"),
        func.sum(models.Stock.quantity).label("库存总量"),
        func.sum(models.Stock.available_quantity).label("可用库存"),
        func.sum(models.Stock.locked_quantity).label("锁定库存"),
        models.Batch.batch_no.label("批次号"),
        models.Batch.expiry_date.label("效期"),
        models.WarehouseLocation.code.label("库位")
    ).select_from(models.Stock).join(
        models.Batch, models.Stock.batch_id == models.Batch.id
    ).join(
        models.Medicine, models.Batch.medicine_id == models.Medicine.id
    ).join(
        models.WarehouseLocation, models.Stock.location_id == models.WarehouseLocation.id
    )
    result = query.group_by(
        models.Medicine.code, models.Medicine.name, models.Medicine.specification,
        models.Medicine.unit, models.Batch.batch_no, models.Batch.expiry_date,
        models.WarehouseLocation.code
    ).all()
    return [row._asdict() for row in result], ["药品编码","药品名称","规格","单位","库存总量","可用库存","锁定库存","批次号","效期","库位"]


def _get_batch_flow_report(db: Session, filters: dict):
    query = db.query(
        models.BatchFlow.id.label("流水号"),
        models.BatchFlow.operation_time.label("操作时间"),
        models.BatchFlow.flow_type.label("流转类型"),
        models.Batch.batch_no.label("批次号"),
        models.Medicine.code.label("药品编码"),
        models.Medicine.name.label("药品名称"),
        models.BatchFlow.quantity.label("数量"),
        models.BatchFlow.reference_no.label("关联单号"),
        models.BatchFlow.counterparty.label("往来单位"),
        models.User.full_name.label("操作人")
    ).select_from(models.BatchFlow).join(
        models.Batch, models.BatchFlow.batch_id == models.Batch.id
    ).join(
        models.Medicine, models.Batch.medicine_id == models.Medicine.id
    ).outerjoin(
        models.User, models.BatchFlow.operator_id == models.User.id
    )

    if filters.get("start_date"):
        query = query.filter(models.BatchFlow.operation_time >= filters["start_date"])
    if filters.get("end_date"):
        query = query.filter(models.BatchFlow.operation_time <= filters["end_date"])
    if filters.get("batch_no"):
        query = query.filter(models.Batch.batch_no.like(f'%{filters["batch_no"]}%'))

    result = query.order_by(models.BatchFlow.operation_time.desc()).all()
    return [row._asdict() for row in result], ["流水号","操作时间","流转类型","批次号","药品编码","药品名称","数量","关联单号","往来单位","操作人"]


def _get_near_expiry_report(db: Session, filters: dict):
    query = db.query(
        models.ExpiryReminder.id.label("提醒ID"),
        models.Batch.batch_no.label("批次号"),
        models.Medicine.code.label("药品编码"),
        models.Medicine.name.label("药品名称"),
        models.ExpiryReminder.days_to_expiry.label("距效期天数"),
        models.ExpiryReminder.reminder_level.label("预警级别"),
        models.ExpiryReminder.current_stock.label("当前库存"),
        models.Batch.expiry_date.label("有效期"),
        models.ExpiryReminder.status.label("状态"),
        models.ExpiryReminder.suggested_action.label("建议措施"),
        models.ExpiryReminder.created_at.label("生成时间"),
        models.User.full_name.label("处理人"),
        models.ExpiryReminder.handled_at.label("处理时间"),
        models.ExpiryReminder.handle_duration_minutes.label("处理时长(分钟)")
    ).select_from(models.ExpiryReminder).join(
        models.Batch, models.ExpiryReminder.batch_id == models.Batch.id
    ).join(
        models.Medicine, models.Batch.medicine_id == models.Medicine.id
    ).outerjoin(
        models.User, models.ExpiryReminder.handled_by == models.User.id
    )

    if filters.get("level"):
        query = query.filter(models.ExpiryReminder.reminder_level == filters["level"])
    if filters.get("status"):
        query = query.filter(models.ExpiryReminder.status == filters["status"])

    result = query.all()
    return [row._asdict() for row in result], ["提醒ID","批次号","药品编码","药品名称","距效期天数","预警级别","当前库存","有效期","状态","建议措施","生成时间","处理人","处理时间","处理时长(分钟)"]


def _get_abnormal_report(db: Session, filters: dict):
    query = db.query(
        models.AbnormalRecord.id.label("异常ID"),
        models.AbnormalRecord.abnormal_type.label("异常类型"),
        models.Batch.batch_no.label("批次号"),
        models.Medicine.name.label("药品名称"),
        models.AbnormalRecord.description.label("异常描述"),
        models.AbnormalRecord.severity.label("严重程度"),
        models.AbnormalRecord.status.label("状态"),
        models.User.full_name.label("发现人"),
        models.AbnormalRecord.found_at.label("发现时间"),
        models.User.full_name.label("处理人"),
        models.AbnormalRecord.handled_at.label("处理时间"),
        models.AbnormalRecord.handle_duration_minutes.label("办理时长(分钟)"),
        models.AbnormalRecord.handle_solution.label("处理方案")
    ).select_from(models.AbnormalRecord).outerjoin(
        models.Batch, models.AbnormalRecord.batch_id == models.Batch.id
    ).outerjoin(
        models.Medicine, models.AbnormalRecord.medicine_id == models.Medicine.id
    ).outerjoin(
        models.User, models.AbnormalRecord.found_by == models.User.id
    )

    result = query.all()
    return [row._asdict() for row in result], ["异常ID","异常类型","批次号","药品名称","异常描述","严重程度","状态","发现人","发现时间","处理人","处理时间","办理时长(分钟)","处理方案"]


def _get_replenish_report(db: Session, filters: dict):
    query = db.query(
        models.ReplenishSuggestion.id.label("建议ID"),
        models.Medicine.code.label("药品编码"),
        models.Medicine.name.label("药品名称"),
        models.Medicine.specification.label("规格"),
        models.ReplenishSuggestion.current_stock.label("当前库存"),
        models.ReplenishSuggestion.safety_stock.label("安全库存"),
        models.ReplenishSuggestion.reorder_point.label("补货点"),
        models.ReplenishSuggestion.suggested_quantity.label("建议补货量"),
        models.ReplenishSuggestion.priority.label("优先级"),
        models.ReplenishSuggestion.status.label("状态"),
        models.ReplenishSuggestion.suggestion_reason.label("补货原因"),
        models.ReplenishSuggestion.created_at.label("创建时间")
    ).select_from(models.ReplenishSuggestion).join(
        models.Medicine, models.ReplenishSuggestion.medicine_id == models.Medicine.id
    )

    result = query.all()
    return [row._asdict() for row in result], ["建议ID","药品编码","药品名称","规格","当前库存","安全库存","补货点","建议补货量","优先级","状态","补货原因","创建时间"]


def _get_sign_diff_report(db: Session, filters: dict):
    query = db.query(
        models.SignDifference.id.label("差异ID"),
        models.SignDifference.purchase_order_no.label("采购单号"),
        models.Batch.batch_no.label("批次号"),
        models.Medicine.name.label("药品名称"),
        models.SignDifference.expected_quantity.label("预期数量"),
        models.SignDifference.actual_quantity.label("实际数量"),
        models.SignDifference.difference_quantity.label("差异数量"),
        models.SignDifference.difference_amount.label("差异金额"),
        models.SignDifference.difference_reason.label("差异原因"),
        models.SignDifference.status.label("状态"),
        models.User.full_name.label("处理人"),
        models.SignDifference.handled_at.label("处理时间"),
        models.SignDifference.handle_duration_minutes.label("办理时长(分钟)")
    ).select_from(models.SignDifference).join(
        models.Batch, models.SignDifference.batch_id == models.Batch.id
    ).join(
        models.Medicine, models.Batch.medicine_id == models.Medicine.id
    ).outerjoin(
        models.User, models.SignDifference.handled_by == models.User.id
    )

    result = query.all()
    return [row._asdict() for row in result], ["差异ID","采购单号","批次号","药品名称","预期数量","实际数量","差异数量","差异金额","差异原因","状态","处理人","处理时间","办理时长(分钟)"]
