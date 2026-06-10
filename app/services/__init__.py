from __future__ import annotations

import csv
import io
import random
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable, Optional, Sequence
from uuid import UUID

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from sqlalchemy import and_, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app import models
from app.core.config import settings
from app.core.security import generate_session_id, hash_password, verify_password
from app.db.redis_cache import RedisCache, get_cache
from app.schemas import *  # noqa: F401,F403
from app.schemas import (
    AnomalyOut,
    AnomalyResolveIn,
    AuditLogOut,
    BillCreateIn,
    BillListFilter,
    BillOut,
    BillPriorityTags,
    BillUpdateIn,
    ClientBillCard,
    DashboardStats,
    ExportCreateIn,
    ExportTaskOut,
    InvoiceCreateIn,
    InvoiceError,
    InvoiceOut,
    MessageOut,
    NoteCreateIn,
    NoteOut,
    PaginatedOut,
    PaginationIn,
    PrepaidAccountOut,
    PrepaidTxnOut,
    SessionUser,
    TransactionImportResult,
    TransactionOut,
    UserLoginIn,
    UserOut,
    UserRegisterIn,
)


def _to_decimal(v: Any) -> Decimal:
    return Decimal(str(v)) if v is not None else Decimal("0")


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _paginate(total: int, items: list, p: PaginationIn) -> PaginatedOut:
    total_pages = (total + p.page_size - 1) // p.page_size if total > 0 else 1
    return PaginatedOut(items=items, total=total, page=p.page, page_size=p.page_size, total_pages=total_pages)


def _cn_tax_id_valid(tax_id: str) -> bool:
    if not tax_id or len(tax_id) not in (15, 17, 18, 20):
        return False
    return bool(re.match(r"^[0-9A-HJ-NPQRTUWXY]{15,20}$", tax_id.upper()))


class AuthService:
    def __init__(self, db: AsyncSession, cache: RedisCache):
        self.db = db
        self.cache = cache

    async def authenticate(self, email: str, password: str) -> Optional[models.User]:
        stmt = select(models.User).where(func.lower(models.User.email) == email.lower())
        result = await self.db.execute(stmt)
        user: Optional[models.User] = result.scalar_one_or_none()
        if user and verify_password(password, user.password_hash):
            return user
        return None

    async def login(self, data: UserLoginIn) -> tuple[Optional[models.User], Optional[str]]:
        user = await self.authenticate(data.email, data.password)
        if not user:
            return None, None
        sid = generate_session_id()
        await self.cache.set_json(
            f"session:{sid}",
            {
                "user_id": str(user.id),
                "role": user.role,
                "email": user.email,
                "name": user.name,
                "client_id": str(user.client_id) if user.client_id else None,
                "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=settings.session_ttl_seconds)).isoformat(),
            },
            ttl=settings.session_ttl_seconds,
        )
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()
        return user, sid

    async def logout(self, session_id: str) -> None:
        await self.cache.delete(f"session:{session_id}")

    async def get_session_user(self, session_id: str) -> Optional[SessionUser]:
        raw = await self.cache.get_json(f"session:{session_id}")
        if not raw:
            return None
        try:
            expires_at = datetime.fromisoformat(raw["expires_at"])
            if expires_at < datetime.now(timezone.utc):
                await self.cache.delete(f"session:{session_id}")
                return None
        except Exception:
            return None
        return SessionUser(
            id=UUID(raw["user_id"]),
            email=raw["email"],
            name=raw["name"],
            role=raw["role"],
            client_id=UUID(raw["client_id"]) if raw.get("client_id") else None,
        )

    async def register_client(self, data: UserRegisterIn) -> UserOut:
        async with self.db.begin_nested():
            client = models.Client(
                name=data.company_name or data.name,
                contact_name=data.name,
                prepaid_balance=Decimal("0"),
                credit_limit=Decimal("0"),
            )
            self.db.add(client)
            await self.db.flush()
            user = models.User(
                email=data.email.lower(),
                password_hash=hash_password(data.password),
                name=data.name,
                role="CLIENT",
                client_id=client.id,
            )
            self.db.add(user)
            await self.db.flush()
            account = models.PrepaidAccount(
                client_id=client.id,
                current_balance=Decimal("0"),
                total_recharged=Decimal("0"),
                total_deducted=Decimal("0"),
            )
            self.db.add(account)
        return UserOut.model_validate(user)

    async def init_default_admin(self) -> MessageOut:
        stmt = select(models.User).where(models.User.role == "ADMIN")
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            return MessageOut(message="管理员账户已存在，跳过创建")
        user = models.User(
            email=settings.init_admin_email.lower(),
            password_hash=hash_password(settings.init_admin_password),
            name=settings.init_admin_name,
            role="ADMIN",
        )
        self.db.add(user)
        await self.db.commit()
        return MessageOut(message=f"默认管理员已创建: {settings.init_admin_email} / {settings.init_admin_password}")


class BillService:
    def __init__(self, db: AsyncSession, cache: RedisCache, operator: SessionUser, client_ip: str = ""):
        self.db = db
        self.cache = cache
        self.operator = operator
        self.client_ip = client_ip

    async def _write_audit(self, entity_type: str, entity_id: UUID, field: str, old: Any, new: Any, reason: str = "") -> None:
        log = models.AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field,
            old_value=str(old) if old is not None else None,
            new_value=str(new) if new is not None else None,
            operator_id=self.operator.id,
            operator_name=self.operator.name,
            operator_ip=self.client_ip,
            change_reason=reason or None,
        )
        self.db.add(log)

    def _build_priority(self, bill: models.Bill, client: Optional[models.Client]) -> BillPriorityTags:
        inv_status: Optional[str] = None
        if bill.invoices:
            latest = sorted(bill.invoices, key=lambda x: x.applied_at, reverse=True)
            inv_status = latest[0].status
        balance = client.prepaid_balance if client else Decimal("0")
        remaining = bill.total_amount - bill.paid_amount
        sufficient = balance >= remaining
        impact: str = "NONE"
        score = bill.forecast_impact_score
        if bill.days_overdue > 15:
            impact = "DECREASE"
        elif balance >= remaining * 2 and bill.status in ("ISSUED", "PARTIAL"):
            impact = "INCREASE"
        return BillPriorityTags(
            invoice_status=inv_status,
            invoice_requested=bill.invoice_requested or bool(bill.invoices),
            prepaid_sufficient=sufficient,
            prepaid_balance=balance,
            forecast_impact=impact,
            forecast_score=score,
        )

    async def list(self, p: PaginationIn, f: BillListFilter) -> PaginatedOut[BillOut]:
        stmt = select(models.Bill).options(
            selectinload(models.Bill.client),
            selectinload(models.Bill.invoices),
        )
        conds: list = []
        if f.keyword:
            kw = f"%{f.keyword}%"
            conds.append(or_(models.Bill.bill_no.ilike(kw), models.Client.name.ilike(kw)))
            stmt = stmt.join(models.Client, models.Bill.client_id == models.Client.id)
        if f.status:
            conds.append(models.Bill.status.in_(f.status))
        if f.client_id:
            conds.append(models.Bill.client_id == f.client_id)
        if f.only_overdue:
            conds.append(models.Bill.days_overdue > 0)
        if f.date_from:
            conds.append(models.Bill.issue_date >= f.date_from)
        if f.date_to:
            conds.append(models.Bill.issue_date <= f.date_to)
        if f.due_from:
            conds.append(models.Bill.due_date >= f.due_from)
        if f.due_to:
            conds.append(models.Bill.due_date <= f.due_to)
        if f.min_amount:
            conds.append(models.Bill.total_amount >= f.min_amount)
        if f.max_amount:
            conds.append(models.Bill.total_amount <= f.max_amount)
        if f.invoice_requested is not None:
            conds.append(models.Bill.invoice_requested == f.invoice_requested)
        if conds:
            stmt = stmt.where(and_(*conds))
        sort_fields = {
            "due_date": models.Bill.due_date,
            "amount": models.Bill.total_amount,
            "priority": models.Bill.forecast_impact_score,
            "created": models.Bill.created_at,
            "status": models.Bill.status,
        }
        sf = sort_fields.get(f.sort_by, models.Bill.due_date)
        stmt = stmt.order_by(desc(sf) if f.sort_desc else sf)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total: int = total_res.scalar_one() or 0
        stmt = stmt.offset(p.offset).limit(p.limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        items: list[BillOut] = []
        for b in rows:
            out = BillOut.model_validate(b)
            out.client_name = b.client.name if b.client else ""
            out.priority = self._build_priority(b, b.client)
            items.append(out)
        return _paginate(total, items, p)

    async def list_client_bills(self, client_id: UUID, p: PaginationIn, status: Optional[str] = None) -> PaginatedOut[ClientBillCard]:
        stmt = (
            select(models.Bill)
            .options(selectinload(models.Bill.client), selectinload(models.Bill.invoices))
            .where(models.Bill.client_id == client_id)
        )
        if status and status != "ALL":
            stmt = stmt.where(models.Bill.status == status)
        stmt = stmt.order_by(desc(models.Bill.due_date))
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one() or 0
        stmt = stmt.offset(p.offset).limit(p.limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        items: list[ClientBillCard] = []
        for b in rows:
            inv_status = None
            if b.invoices:
                inv_status = sorted(b.invoices, key=lambda x: x.applied_at, reverse=True)[0].status
            balance = b.client.prepaid_balance if b.client else Decimal("0")
            remaining = b.total_amount - b.paid_amount
            items.append(
                ClientBillCard(
                    id=b.id, bill_no=b.bill_no, period_start=b.period_start, period_end=b.period_end,
                    issue_date=b.issue_date, due_date=b.due_date, total_amount=b.total_amount,
                    paid_amount=b.paid_amount, remaining_amount=remaining, status=b.status,
                    days_overdue=b.days_overdue, invoice_requested=b.invoice_requested or bool(b.invoices),
                    invoice_status=inv_status, prepaid_sufficient=balance >= remaining,
                )
            )
        return _paginate(total, items, p)

    async def get(self, bill_id: UUID) -> Optional[BillOut]:
        stmt = (
            select(models.Bill)
            .options(selectinload(models.Bill.client), selectinload(models.Bill.invoices), selectinload(models.Bill.order))
            .where(models.Bill.id == bill_id)
        )
        b = (await self.db.execute(stmt)).scalar_one_or_none()
        if not b:
            return None
        out = BillOut.model_validate(b)
        out.client_name = b.client.name if b.client else ""
        out.priority = self._build_priority(b, b.client)
        return out

    async def create(self, data: BillCreateIn) -> BillOut:
        period = data.period_end.strftime("%Y%m")
        random_suffix = random.randint(1000, 9999)
        bill_no = f"BL{period}{random_suffix:04d}"
        bill = models.Bill(
            bill_no=bill_no, client_id=data.client_id, order_id=data.order_id,
            period_start=data.period_start, period_end=data.period_end,
            issue_date=data.issue_date, due_date=data.due_date,
            total_amount=data.total_amount, paid_amount=Decimal("0"),
            status="ISSUED", days_overdue=0, invoice_requested=False,
            created_by=self.operator.id,
        )
        self.db.add(bill)
        await self.db.flush()
        await self._write_audit("BILL", bill.id, "status", "DRAFT", "ISSUED", "创建账单")
        await self.db.commit()
        await self.db.refresh(bill)
        return await self.get(bill.id) or BillOut.model_validate(bill)

    async def update(self, bill_id: UUID, data: BillUpdateIn) -> Optional[BillOut]:
        stmt = select(models.Bill).where(models.Bill.id == bill_id)
        bill = (await self.db.execute(stmt)).scalar_one_or_none()
        if not bill:
            return None
        if data.status and data.status != bill.status:
            await self._write_audit("BILL", bill.id, "status", bill.status, data.status, data.change_reason or "")
            bill.status = data.status
        if data.due_date and data.due_date != bill.due_date:
            await self._write_audit("BILL", bill.id, "due_date", bill.due_date, data.due_date, data.change_reason or "")
            bill.due_date = data.due_date
        if data.total_amount and data.total_amount != bill.total_amount:
            await self._write_audit("BILL", bill.id, "total_amount", bill.total_amount, data.total_amount, data.change_reason or "")
            bill.total_amount = data.total_amount
        await self.db.commit()
        await self.db.refresh(bill)
        return await self.get(bill.id)

    async def add_note(self, bill_id: UUID, data: NoteCreateIn) -> NoteOut:
        note = models.Note(
            bill_id=bill_id, content=data.content, is_internal=data.is_internal,
            author_id=self.operator.id, mentions=[],
        )
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        out = NoteOut.model_validate(note)
        out.author_name = self.operator.name
        return out

    async def get_notes(self, bill_id: UUID) -> list[NoteOut]:
        stmt = (
            select(models.Note, models.User.name)
            .join(models.User, models.Note.author_id == models.User.id)
            .where(models.Note.bill_id == bill_id)
            .order_by(desc(models.Note.created_at))
        )
        rows = (await self.db.execute(stmt)).all()
        results: list[NoteOut] = []
        for n, author_name in rows:
            out = NoteOut.model_validate(n)
            out.author_name = author_name
            results.append(out)
        return results

    async def get_audit_logs(self, bill_id: UUID) -> list[AuditLogOut]:
        stmt = (
            select(models.AuditLog)
            .where(and_(models.AuditLog.entity_type == "BILL", models.AuditLog.entity_id == bill_id))
            .order_by(desc(models.AuditLog.created_at)).limit(200)
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        return [AuditLogOut.model_validate(r) for r in rows]

    async def refresh_days_overdue(self) -> int:
        today = _today()
        stmt = select(models.Bill).where(
            and_(models.Bill.status.in_(["ISSUED", "PARTIAL"]), models.Bill.due_date < today)
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        for b in rows:
            b.days_overdue = (today - b.due_date).days
            if b.days_overdue > 0:
                b.status = "OVERDUE"
        if rows:
            await self.db.commit()
        return len(rows)


class AnomalyService:
    def __init__(self, db: AsyncSession, operator: Optional[SessionUser] = None):
        self.db = db
        self.operator = operator

    async def list(self, p: PaginationIn, type_filter: Optional[AnomalyType] = None, status_filter: Optional[AnomalyStatus] = None) -> PaginatedOut[AnomalyOut]:
        stmt = select(models.Anomaly)
        if type_filter:
            stmt = stmt.where(models.Anomaly.type == type_filter)
        if status_filter:
            stmt = stmt.where(models.Anomaly.status == status_filter)
        stmt = stmt.order_by(desc(models.Anomaly.created_at))
        total = (await self.db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
        stmt = stmt.offset(p.offset).limit(p.limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return _paginate(total, [AnomalyOut.model_validate(r) for r in rows], p)

    async def create(
        self,
        type: AnomalyType,
        severity: AnomalySeverity,
        title: str,
        description: str = "",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[UUID] = None,
    ) -> AnomalyOut:
        if related_entity_id:
            exist_stmt = select(func.count()).where(
                and_(
                    models.Anomaly.type == type,
                    models.Anomaly.related_entity_id == related_entity_id,
                    models.Anomaly.status.in_(["OPEN", "PROCESSING"]),
                )
            )
            if (await self.db.execute(exist_stmt)).scalar_one() > 0:
                exist = (await self.db.execute(
                    select(models.Anomaly).where(and_(
                        models.Anomaly.type == type,
                        models.Anomaly.related_entity_id == related_entity_id,
                        models.Anomaly.status.in_(["OPEN", "PROCESSING"]),
                    ))
                )).scalar_one()
                return AnomalyOut.model_validate(exist)
        anomaly = models.Anomaly(
            type=type, severity=severity, title=title, description=description,
            related_entity_type=related_entity_type, related_entity_id=related_entity_id,
            status="OPEN", assignee_id=self.operator.id if self.operator else None,
        )
        self.db.add(anomaly)
        await self.db.flush()
        return AnomalyOut.model_validate(anomaly)

    async def resolve(self, anom_id: UUID, data: AnomalyResolveIn) -> Optional[AnomalyOut]:
        stmt = select(models.Anomaly).where(models.Anomaly.id == anom_id)
        a = (await self.db.execute(stmt)).scalar_one_or_none()
        if not a:
            return None
        a.status = data.status
        if data.assignee_id:
            a.assignee_id = data.assignee_id
        if data.status == "RESOLVED":
            a.resolved_at = datetime.now(timezone.utc)
            a.resolved_note = data.resolved_note
        await self.db.commit()
        await self.db.refresh(a)
        return AnomalyOut.model_validate(a)


class TransactionService:
    def __init__(self, db: AsyncSession, operator: SessionUser, client_ip: str = ""):
        self.db = db
        self.operator = operator
        self.client_ip = client_ip
        self._anomaly_svc = AnomalyService(db, operator)

    async def list(self, p: PaginationIn, status: Optional[TxnMatchStatus] = None) -> PaginatedOut[TransactionOut]:
        stmt = select(models.BankTransaction)
        if status:
            stmt = stmt.where(models.BankTransaction.match_status == status)
        stmt = stmt.order_by(desc(models.BankTransaction.txn_date), desc(models.BankTransaction.created_at))
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one() or 0
        stmt = stmt.offset(p.offset).limit(p.limit)
        rows = (await self.db.execute(stmt)).scalars().all()
        return _paginate(total, [TransactionOut.model_validate(r) for r in rows], p)

    async def import_csv(self, content: str, batch: str) -> TransactionImportResult:
        reader = csv.DictReader(io.StringIO(content))
        total = 0; success = 0; skipped = 0; auto_matched = 0
        for row in reader:
            total += 1
            txn_no = str(row.get("流水号") or row.get("txn_no") or uuid.uuid4().hex[:16])
            exists_stmt = select(func.count()).where(models.BankTransaction.txn_no == txn_no)
            if (await self.db.execute(exists_stmt)).scalar_one() > 0:
                skipped += 1; continue
            try:
                amount = _to_decimal(row.get("金额") or row.get("amount") or "0")
                direction = str(row.get("方向") or row.get("direction") or ("IN" if amount >= 0 else "OUT")).upper()
                if direction not in ("IN", "OUT"):
                    direction = "IN" if amount > 0 else "OUT"
                txn = models.BankTransaction(
                    txn_no=txn_no,
                    txn_date=datetime.strptime(str(row.get("交易日期") or row.get("txn_date") or _today().isoformat()), "%Y-%m-%d").date(),
                    amount=abs(amount), direction=direction,
                    counterparty=str(row.get("对方户名") or row.get("counterparty") or "")[:300],
                    counterparty_account=str(row.get("对方账号") or row.get("counterparty_account") or "")[:100],
                    summary=str(row.get("摘要") or row.get("summary") or "")[:500],
                    match_status="UNMATCHED", matched_amount=Decimal("0"),
                    confidence_score=None, import_batch=batch,
                )
                self.db.add(txn); success += 1
            except Exception:
                skipped += 1; continue
        await self.db.flush()
        if success:
            auto_matched = await self.run_auto_match(batch=batch)
        await self.db.commit()
        return TransactionImportResult(batch=batch, total=total, success=success, skipped=skipped, auto_matched=auto_matched)

    async def run_auto_match(self, batch: Optional[str] = None) -> int:
        stmt = select(models.BankTransaction).where(models.BankTransaction.match_status == "UNMATCHED")
        if batch:
            stmt = stmt.where(models.BankTransaction.import_batch == batch)
        stmt = stmt.where(models.BankTransaction.direction == "IN")
        txns: Sequence[models.BankTransaction] = (await self.db.execute(stmt)).scalars().all()
        matched_count = 0
        for txn in txns:
            confidence = 0.0
            bill_stmt = select(models.Bill).where(and_(
                models.Bill.status.in_(["ISSUED", "PARTIAL", "OVERDUE"]),
                (models.Bill.total_amount - models.Bill.paid_amount) > 0,
            ))
            if txn.counterparty:
                bill_stmt = bill_stmt.join(models.Client, models.Bill.client_id == models.Client.id).where(
                    func.lower(models.Client.name).contains(txn.counterparty.lower()[:6])
                )
                confidence += 0.4
            candidates: Sequence[models.Bill] = (await self.db.execute(bill_stmt)).scalars().all()
            best_bill: Optional[models.Bill] = None
            for b in candidates:
                remaining = b.total_amount - b.paid_amount
                if abs(remaining - txn.amount) < Decimal("0.05"):
                    confidence += 0.5; best_bill = b; break
                if abs(remaining - txn.amount) / max(remaining, Decimal("1")) < 0.05:
                    confidence += 0.3
                    if not best_bill: best_bill = b
            if txn.summary and best_bill:
                if str(best_bill.bill_no) in str(txn.summary): confidence += 0.1
            if best_bill and confidence >= 0.7:
                await self._apply_match(txn, best_bill, min(txn.amount, best_bill.total_amount - best_bill.paid_amount), "AUTO", confidence)
                txn.confidence_score = float(confidence)
                matched_count += 1
            else:
                await self._anomaly_svc.create(
                    type="TXN_UNMATCHED",
                    severity="MEDIUM" if txn.amount > Decimal("10000") else "LOW",
                    title=f"流水未匹配：{txn.txn_no}",
                    description=f"金额{txn.amount:.2f}，对方户名：{txn.counterparty}，摘要：{txn.summary}",
                    related_entity_type="TXN", related_entity_id=txn.id,
                )
        await self.db.commit()
        return matched_count

    async def manual_match(self, txn_id: UUID, bill_id: UUID, amount: Decimal) -> MessageOut:
        txn = (await self.db.execute(select(models.BankTransaction).where(models.BankTransaction.id == txn_id))).scalar_one_or_none()
        bill = (await self.db.execute(select(models.Bill).where(models.Bill.id == bill_id))).scalar_one_or_none()
        if not txn or not bill: return MessageOut(message="流水或账单不存在", code=404)
        remaining = bill.total_amount - bill.paid_amount
        if amount > remaining + Decimal("0.05"): return MessageOut(message=f"金额超过账单剩余金额{remaining:,.2f}", code=400)
        if amount > txn.amount - txn.matched_amount + Decimal("0.05"): return MessageOut(message=f"金额超过流水可用金额", code=400)
        await self._apply_match(txn, bill, amount, "MANUAL", 1.0)
        await self.db.commit()
        return MessageOut(message=f"已匹配 {amount:,.2f} 元")

    async def _apply_match(self, txn: models.BankTransaction, bill: models.Bill, amount: Decimal, match_type: MatchType, confidence: float) -> None:
        pay = models.Payment(
            transaction_id=txn.id, bill_id=bill.id, amount=amount, match_type=match_type,
            matched_by=self.operator.id if match_type == "MANUAL" else None,
            remark=f"自动匹配 置信度{confidence:.0%}" if match_type == "AUTO" else "",
        )
        self.db.add(pay)
        bill.paid_amount = bill.paid_amount + amount
        remaining = bill.total_amount - bill.paid_amount
        if remaining <= Decimal("0.01"): bill.status = "PAID"
        elif remaining < bill.total_amount and bill.status not in ("PAID", "OVERDUE"): bill.status = "PARTIAL"
        txn.matched_amount = txn.matched_amount + amount
        if txn.amount - txn.matched_amount <= Decimal("0.01"): txn.match_status = "MATCHED"
        else: txn.match_status = "PARTIAL"
        if bill.id not in (txn.matched_bill_ids or []):
            txn.matched_bill_ids = list(txn.matched_bill_ids or []) + [bill.id]
        if match_type == "MANUAL":
            anomaly_stmt = select(models.Anomaly).where(and_(
                models.Anomaly.related_entity_type == "TXN",
                models.Anomaly.related_entity_id == txn.id,
                models.Anomaly.status.in_(["OPEN", "IN_PROGRESS"]),
            ))
            anomalies = (await self.db.execute(anomaly_stmt)).scalars().all()
            for a in anomalies:
                a.status = "RESOLVED"
                a.resolved_at = datetime.now(timezone.utc)
                a.resolution_note = f"人工匹配账单 {bill.bill_no}"
                a.resolved_by_id = self.operator.id
