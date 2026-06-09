from __future__ import annotations

import hashlib
import logging
import os
from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    Query,
    status,
    Body,
)
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.config import settings
from app.models.contract import (
    ContractClause,
    ContractDocument,
    ContractStatus,
    ContractSummary,
    ContractType,
    RiskAlert,
    ClauseCategory,
    RiskLevel,
    RiskType,
)
from app.models.task import Task, TaskStatus, TaskType, TaskPriority
from app.models.user import User, UserRole
from app.schemas.base import BaseResponse, PageResponse, PaginationParams
from app.schemas.contract import (
    ClauseInfo,
    ClauseListFilter,
    CompareRequest,
    ContractCreate,
    ContractDetail,
    ContractInfo,
    ContractListFilter,
    ContractUpdate,
    DiffItem,
    DiffResult,
    ReanalyzeRequest,
    RiskDetectRequest,
    RiskInfo,
    RiskListFilter,
    SummaryGenerateRequest,
    SummaryInfo,
    UploadResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Contracts"])


def _save_uploaded_file(file: UploadFile, upload_dir: str) -> tuple[str, int, str]:
    os.makedirs(upload_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_name = os.path.basename(file.filename or f"upload_{timestamp}")
    save_name = f"{timestamp}_{hashlib.md5(safe_name.encode()).hexdigest()[:8]}_{safe_name}"
    file_path = os.path.join(upload_dir, save_name)

    file_size = 0
    sha256 = hashlib.sha256()
    with open(file_path, "wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
            file_size += len(chunk)
            sha256.update(chunk)

    return file_path, file_size, sha256.hexdigest()


def _create_parse_task(
    db: AsyncSession,
    contract_id: int,
    creator_id: Optional[int],
    title: str,
) -> Task:
    task = Task(
        task_type=TaskType.PARSE_DOCUMENT,
        status=TaskStatus.PENDING,
        priority=TaskPriority.HIGH,
        contract_id=contract_id,
        creator_id=creator_id,
        title=f"解析合同: {title}",
        params={"contract_id": contract_id},
    )
    db.add(task)
    return task


@router.post("/upload", response_model=BaseResponse[UploadResponse])
async def upload_document(
    file: UploadFile = File(..., description="合同文件 (PDF/DOCX/TXT)"),
    title: Optional[str] = Form(None, description="合同标题, 默认使用文件名"),
    contract_type: Optional[ContractType] = Form(None, description="合同类型"),
    contract_no: Optional[str] = Form(None, description="合同编号"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in settings.SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型: {ext}, 仅支持 {settings.SUPPORTED_EXTENSIONS}",
        )

    file_path, file_size, file_hash = _save_uploaded_file(file, settings.UPLOAD_DIR)

    if file_size > settings.MAX_UPLOAD_SIZE:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"文件过大: {file_size} bytes, 最大支持 {settings.MAX_UPLOAD_SIZE}",
        )

    contract_title = title or os.path.splitext(file.filename or "未命名合同")[0]

    contract = ContractDocument(
        title=contract_title,
        contract_no=contract_no,
        contract_type=contract_type,
        status=ContractStatus.PARSING,
        file_name=file.filename or "",
        file_path=file_path,
        file_size=file_size,
        file_hash=file_hash,
        mime_type=file.content_type,
        uploader_id=current_user.id,
    )
    db.add(contract)
    await db.flush()

    task = _create_parse_task(db, contract.id, current_user.id, contract_title)
    await db.commit()
    await db.refresh(contract)
    await db.refresh(task)

    return BaseResponse(
        data=UploadResponse(task_id=task.id, contract_id=contract.id),
        message="上传成功，已开始解析",
    )


@router.get("", response_model=BaseResponse[PageResponse[ContractInfo]])
async def list_contracts(
    contract_type: Optional[ContractType] = Query(None),
    status: Optional[ContractStatus] = Query(None),
    keyword: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if contract_type:
        conditions.append(ContractDocument.contract_type == contract_type)
    if status:
        conditions.append(ContractDocument.status == status)
    if keyword:
        kw = f"%{keyword}%"
        conditions.append(
            or_(
                ContractDocument.title.ilike(kw),
                ContractDocument.contract_no.ilike(kw),
                ContractDocument.party_a.ilike(kw),
                ContractDocument.party_b.ilike(kw),
            )
        )
    if date_from:
        conditions.append(ContractDocument.created_at >= date_from)
    if date_to:
        conditions.append(ContractDocument.created_at <= date_to)

    where_clause = and_(*conditions) if conditions else True

    total_query = select(func.count()).select_from(ContractDocument).where(where_clause)
    total_result = await db.execute(total_query)
    total = total_result.scalar_one() or 0

    query = (
        select(ContractDocument)
        .where(where_clause)
        .order_by(ContractDocument.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = [ContractInfo.model_validate(r) for r in result.scalars().all()]

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.get("/{contract_id}", response_model=BaseResponse[ContractDetail])
async def get_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ContractDocument).where(ContractDocument.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")
    return BaseResponse(data=ContractDetail.model_validate(contract))


@router.get("/{contract_id}/clauses", response_model=BaseResponse[PageResponse[ClauseInfo]])
async def list_clauses(
    contract_id: int,
    category: Optional[ClauseCategory] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument.id).where(ContractDocument.id == contract_id)
    )
    if not contract_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="合同不存在")

    conditions = [ContractClause.document_id == contract_id]
    if category:
        conditions.append(ContractClause.category == category)
    if keyword:
        conditions.append(
            or_(
                ContractClause.original_text.ilike(f"%{keyword}%"),
                ContractClause.clause_title.ilike(f"%{keyword}%"),
            )
        )
    where_clause = and_(*conditions)

    total_result = await db.execute(
        select(func.count()).select_from(ContractClause).where(where_clause)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(ContractClause)
        .where(where_clause)
        .order_by(ContractClause.clause_index.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [ClauseInfo.model_validate(r) for r in result.scalars().all()]

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.get("/{contract_id}/summary", response_model=BaseResponse[Optional[SummaryInfo]])
async def get_summary(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument.id).where(ContractDocument.id == contract_id)
    )
    if not contract_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="合同不存在")

    result = await db.execute(
        select(ContractSummary)
        .where(ContractSummary.document_id == contract_id)
        .order_by(ContractSummary.created_at.desc())
        .limit(1)
    )
    summary = result.scalar_one_or_none()
    return BaseResponse(data=SummaryInfo.model_validate(summary) if summary else None)


@router.post("/{contract_id}/summary", response_model=BaseResponse[dict])
async def generate_summary(
    contract_id: int,
    req: SummaryGenerateRequest = Body(default_factory=SummaryGenerateRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument).where(ContractDocument.id == contract_id)
    )
    contract = contract_result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    task = Task(
        task_type=TaskType.GENERATE_SUMMARY,
        status=TaskStatus.PENDING,
        priority=TaskPriority.MEDIUM,
        contract_id=contract_id,
        creator_id=current_user.id,
        title=f"生成摘要: {contract.title}",
        params={"contract_id": contract_id, "summary_type": req.summary_type, "force": req.force},
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return BaseResponse(data={"task_id": task.id}, message="已触发摘要生成任务")


@router.get("/{contract_id}/risks", response_model=BaseResponse[PageResponse[RiskInfo]])
async def list_risks(
    contract_id: int,
    risk_level: Optional[RiskLevel] = Query(None),
    risk_type: Optional[RiskType] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument.id).where(ContractDocument.id == contract_id)
    )
    if not contract_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="合同不存在")

    conditions = [RiskAlert.document_id == contract_id]
    if risk_level:
        conditions.append(RiskAlert.risk_level == risk_level)
    if risk_type:
        conditions.append(RiskAlert.risk_type == risk_type)
    where_clause = and_(*conditions)

    total_result = await db.execute(
        select(func.count()).select_from(RiskAlert).where(where_clause)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(RiskAlert)
        .where(where_clause)
        .order_by(RiskAlert.risk_score.desc(), RiskAlert.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [RiskInfo.model_validate(r) for r in result.scalars().all()]

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.post("/{contract_id}/risks/detect", response_model=BaseResponse[dict])
async def detect_risks(
    contract_id: int,
    req: RiskDetectRequest = Body(default_factory=RiskDetectRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument).where(ContractDocument.id == contract_id)
    )
    contract = contract_result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    contract.status = ContractStatus.ANALYZING
    task = Task(
        task_type=TaskType.DETECT_RISKS,
        status=TaskStatus.PENDING,
        priority=TaskPriority.HIGH,
        contract_id=contract_id,
        creator_id=current_user.id,
        title=f"风险检测: {contract.title}",
        params={
            "contract_id": contract_id,
            "force": req.force,
            "detection_methods": req.detection_methods,
        },
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return BaseResponse(data={"task_id": task.id}, message="已触发风险检测任务")


@router.post("/{contract_id}/compare", response_model=BaseResponse[DiffResult])
async def compare_contracts(
    contract_id: int,
    req: CompareRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    a_result = await db.execute(
        select(ContractDocument).where(ContractDocument.id == contract_id)
    )
    b_result = await db.execute(
        select(ContractDocument).where(ContractDocument.id == req.other_contract_id)
    )
    a = a_result.scalar_one_or_none()
    b = b_result.scalar_one_or_none()
    if not a or not b:
        raise HTTPException(status_code=404, detail="合同不存在")

    diff = DiffResult(
        contract_a_id=a.id,
        contract_b_id=b.id,
        summary_changes=[
            DiffItem(field="title", left_value=a.title, right_value=b.title,
                     diff_type="changed" if a.title != b.title else "unchanged"),
            DiffItem(field="party_a", left_value=a.party_a, right_value=b.party_a,
                     diff_type="changed" if a.party_a != b.party_a else "unchanged"),
            DiffItem(field="party_b", left_value=a.party_b, right_value=b.party_b,
                     diff_type="changed" if a.party_b != b.party_b else "unchanged"),
            DiffItem(field="total_amount", left_value=a.total_amount, right_value=b.total_amount,
                     diff_type="changed" if a.total_amount != b.total_amount else "unchanged"),
            DiffItem(field="sign_date", left_value=str(a.sign_date), right_value=str(b.sign_date),
                     diff_type="changed" if a.sign_date != b.sign_date else "unchanged"),
            DiffItem(field="effective_date", left_value=str(a.effective_date), right_value=str(b.effective_date),
                     diff_type="changed" if a.effective_date != b.effective_date else "unchanged"),
            DiffItem(field="expiry_date", left_value=str(a.expiry_date), right_value=str(b.expiry_date),
                     diff_type="changed" if a.expiry_date != b.expiry_date else "unchanged"),
        ],
        clause_diffs=[],
        risk_diffs=[],
        overall_similarity=0.0,
    )
    return BaseResponse(data=diff, message="对比完成")


@router.post("/{contract_id}/reanalyze", response_model=BaseResponse[dict])
async def reanalyze_contract(
    contract_id: int,
    req: ReanalyzeRequest = Body(default_factory=ReanalyzeRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument).where(ContractDocument.id == contract_id)
    )
    contract = contract_result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="合同不存在")

    contract.status = ContractStatus.PARSING

    steps = req.steps or ["parse", "summary", "risks"]
    task = Task(
        task_type=TaskType.PARSE_DOCUMENT,
        status=TaskStatus.PENDING,
        priority=TaskPriority.HIGH,
        contract_id=contract_id,
        creator_id=current_user.id,
        title=f"重新分析: {contract.title}",
        params={"contract_id": contract_id, "steps": steps, "force": req.force},
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    return BaseResponse(data={"task_id": task.id}, message="已触发重新分析流程")
