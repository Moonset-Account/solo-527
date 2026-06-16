import csv
import io
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.export import ExportFormat, ExportRequest

router = APIRouter(prefix="/exports", tags=["Exports"])


@router.post("/")
async def export_data(request: ExportRequest, db: AsyncSession = Depends(get_db)):
    rows, headers = await _fetch_export_data(request, db)

    if request.format == ExportFormat.csv:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        for row in rows:
            writer.writerow([str(v) if v is not None else "" for v in row])
        output.seek(0)
        content = output.getvalue()
        filename = f"{request.module.value}_export.csv"
        media_type = "text/csv"
        return StreamingResponse(
            iter([content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    output = io.BytesIO()
    try:
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = request.module.value
        ws.append(headers)
        for row in rows:
            ws.append([str(v) if v is not None else "" for v in row])
        wb.save(output)
    except ImportError:
        output = io.BytesIO()
        text_wrapper = io.TextIOWrapper(output, encoding="utf-8", write_through=True)
        writer_csv = csv.writer(text_wrapper)
        writer_csv.writerow(headers)
        for row in rows:
            writer_csv.writerow([str(v) if v is not None else "" for v in row])
        text_wrapper.flush()

    output.seek(0)
    filename = f"{request.module.value}_export.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


async def _fetch_export_data(request: ExportRequest, db: AsyncSession) -> tuple[list, list]:
    filters = request.filters or {}

    if request.module.value == "ar_collection":
        from app.models.ar_record import ARRecord

        query = select(ARRecord)
        if filters.get("status"):
            query = query.where(ARRecord.status == filters["status"])
        if filters.get("customer_name"):
            query = query.where(ARRecord.customer_name.ilike(f"%{filters['customer_name']}%"))
        if filters.get("responsible_person"):
            query = query.where(ARRecord.responsible_person.ilike(f"%{filters['responsible_person']}%"))
        if filters.get("date_from"):
            query = query.where(ARRecord.due_date >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(ARRecord.due_date <= filters["date_to"])

        result = await db.execute(query.order_by(ARRecord.created_at.desc()))
        records = result.scalars().all()

        headers = [
            "ID", "客户名称", "客户ID", "金额", "币种", "到期日",
            "状态", "负责人", "描述", "订阅ID", "创建时间",
        ]
        rows = [
            [
                str(r.id), r.customer_name, r.customer_id, float(r.amount),
                r.currency, str(r.due_date), r.status.value if hasattr(r.status, 'value') else str(r.status),
                r.responsible_person, r.description, r.subscription_id, str(r.created_at),
            ]
            for r in records
        ]
        return rows, headers

    elif request.module.value == "refund_dispute":
        from app.models.refund import Refund

        query = select(Refund)
        if filters.get("status"):
            query = query.where(Refund.status == filters["status"])
        if filters.get("applicant"):
            query = query.where(Refund.applicant.ilike(f"%{filters['applicant']}%"))
        if filters.get("date_from"):
            query = query.where(Refund.created_at >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(Refund.created_at <= filters["date_to"])

        result = await db.execute(query.order_by(Refund.created_at.desc()))
        refunds = result.scalars().all()

        headers = [
            "ID", "应收记录ID", "金额", "原因", "状态",
            "申请人", "审核人", "审核备注", "创建时间",
        ]
        rows = [
            [
                str(r.id), str(r.ar_record_id), float(r.amount), r.reason,
                r.status.value if hasattr(r.status, 'value') else str(r.status),
                r.applicant, r.reviewer, r.review_note, str(r.created_at),
            ]
            for r in refunds
        ]
        return rows, headers

    elif request.module.value == "processing_record":
        from app.models.payment import Payment
        from app.models.writeoff import Writeoff

        payment_query = select(Payment)
        if filters.get("status"):
            payment_query = payment_query.where(Payment.status == filters["status"])
        if filters.get("operator"):
            payment_query = payment_query.where(Payment.operator.ilike(f"%{filters['operator']}%"))
        if filters.get("date_from"):
            payment_query = payment_query.where(Payment.created_at >= filters["date_from"])
        if filters.get("date_to"):
            payment_query = payment_query.where(Payment.created_at <= filters["date_to"])
        payment_result = await db.execute(payment_query.order_by(Payment.created_at.desc()))
        payments = payment_result.scalars().all()

        writeoff_query = select(Writeoff)
        if filters.get("status"):
            writeoff_query = writeoff_query.where(Writeoff.status == filters["status"])
        if filters.get("operator"):
            writeoff_query = writeoff_query.where(Writeoff.operator.ilike(f"%{filters['operator']}%"))
        if filters.get("date_from"):
            writeoff_query = writeoff_query.where(Writeoff.created_at >= filters["date_from"])
        if filters.get("date_to"):
            writeoff_query = writeoff_query.where(Writeoff.created_at <= filters["date_to"])
        writeoff_result = await db.execute(writeoff_query.order_by(Writeoff.created_at.desc()))
        writeoffs = writeoff_result.scalars().all()

        headers = ["ID", "类型", "应收记录ID", "金额", "状态", "操作人", "创建时间"]
        rows = []
        for p in payments:
            rows.append([
                str(p.id), "回款", str(p.ar_record_id), float(p.amount),
                p.status.value if hasattr(p.status, 'value') else str(p.status),
                p.operator, str(p.created_at),
            ])
        for w in writeoffs:
            rows.append([
                str(w.id), "核销", str(w.ar_record_id), float(w.amount),
                w.status.value if hasattr(w.status, 'value') else str(w.status),
                w.operator, str(w.created_at),
            ])
        rows.sort(key=lambda x: x[6], reverse=True)
        return rows, headers

    return [], []
