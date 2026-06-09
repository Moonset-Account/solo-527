from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import List, Optional

from fastapi import (
    APIRouter,
    Body,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.config import settings
from app.models.dataset import (
    Dataset,
    DatasetSample,
    DatasetVersion,
    SampleStatus,
    SampleType,
)
from app.models.user import User
from app.schemas.base import BaseResponse, PageResponse
from app.schemas.dataset import (
    DatasetCloneRequest,
    DatasetCreate,
    DatasetExportRequest,
    DatasetExportResponse,
    DatasetImportResponse,
    DatasetInfo,
    DatasetUpdate,
    DatasetVersionCreate,
    DatasetVersionInfo,
    SampleCreate,
    SampleInfo,
    SampleRollbackRequest,
    SampleUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=BaseResponse[PageResponse[DatasetInfo]])
async def list_datasets(
    dataset_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_public: Optional[bool] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if dataset_type:
        conditions.append(Dataset.dataset_type == dataset_type)
    if is_active is not None:
        conditions.append(Dataset.is_active == is_active)
    if is_public is not None:
        conditions.append(Dataset.is_public == is_public)
    if keyword:
        kw = f"%{keyword}%"
        conditions.append(Dataset.name.ilike(kw))
    where_clause = and_(*conditions) if conditions else True

    total_result = await db.execute(
        select(func.count()).select_from(Dataset).where(where_clause)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(Dataset)
        .where(where_clause)
        .order_by(Dataset.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [DatasetInfo.model_validate(r) for r in result.scalars().all()]

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.post("", response_model=BaseResponse[DatasetInfo])
async def create_dataset(
    req: DatasetCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = Dataset(
        name=req.name,
        description=req.description,
        dataset_type=req.dataset_type,
        version=req.version,
        tags=req.tags,
        extra_metadata=req.metadata,
        is_public=req.is_public,
        owner_id=current_user.id,
    )
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    return BaseResponse(data=DatasetInfo.model_validate(dataset), message="数据集创建成功")


@router.get("/{dataset_id}", response_model=BaseResponse[DatasetInfo])
async def get_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")
    return BaseResponse(data=DatasetInfo.model_validate(dataset))


@router.put("/{dataset_id}", response_model=BaseResponse[DatasetInfo])
async def update_dataset(
    dataset_id: int,
    req: DatasetUpdate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(dataset, k, v)
    dataset.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(dataset)
    return BaseResponse(data=DatasetInfo.model_validate(dataset), message="数据集已更新")


@router.delete("/{dataset_id}", response_model=BaseResponse[dict])
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")
    dataset.is_active = False
    dataset.updated_at = datetime.utcnow()
    await db.commit()
    return BaseResponse(data={"deleted": True, "id": dataset_id}, message="数据集已软删除")


@router.get("/{dataset_id}/samples", response_model=BaseResponse[PageResponse[SampleInfo]])
async def list_samples(
    dataset_id: int,
    sample_type: Optional[SampleType] = Query(None),
    status: Optional[SampleStatus] = Query(None),
    assignee_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds_result = await db.execute(select(Dataset.id).where(Dataset.id == dataset_id))
    if not ds_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="数据集不存在")

    conditions = [DatasetSample.dataset_id == dataset_id]
    if sample_type:
        conditions.append(DatasetSample.sample_type == sample_type)
    if status:
        conditions.append(DatasetSample.status == status)
    if assignee_id:
        conditions.append(DatasetSample.assignee_id == assignee_id)
    where_clause = and_(*conditions)

    total_result = await db.execute(
        select(func.count()).select_from(DatasetSample).where(where_clause)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(DatasetSample)
        .where(where_clause)
        .order_by(DatasetSample.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [SampleInfo.model_validate(r) for r in result.scalars().all()]

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.post("/{dataset_id}/samples", response_model=BaseResponse[SampleInfo])
async def create_sample(
    dataset_id: int,
    req: SampleCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = ds_result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")

    sample = DatasetSample(
        dataset_id=dataset_id,
        sample_type=req.sample_type,
        status=SampleStatus.DRAFT,
        input_text=req.input_text,
        reference_output=req.reference_output,
        input_metadata=req.input_metadata,
        reference_metadata=req.reference_metadata,
        reference_score=req.reference_score,
        difficulty_level=req.difficulty_level,
        source_contract_id=req.source_contract_id,
        source_clause_id=req.source_clause_id,
    )
    db.add(sample)
    dataset.sample_count = (dataset.sample_count or 0) + 1
    await db.commit()
    await db.refresh(sample)
    return BaseResponse(data=SampleInfo.model_validate(sample), message="样本已创建")


@router.put("/samples/{sample_id}", response_model=BaseResponse[SampleInfo])
async def update_sample(
    sample_id: int,
    req: SampleUpdate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(DatasetSample).where(DatasetSample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")

    old_sample_id = sample.id
    new_sample = DatasetSample(
        dataset_id=sample.dataset_id,
        sample_type=req.sample_type or sample.sample_type,
        status=req.status or sample.status,
        input_text=req.input_text or sample.input_text,
        reference_output=req.reference_output if req.reference_output is not None else sample.reference_output,
        input_metadata=req.input_metadata if req.input_metadata is not None else sample.input_metadata,
        reference_metadata=req.reference_metadata if req.reference_metadata is not None else sample.reference_metadata,
        reference_score=req.reference_score if req.reference_score is not None else sample.reference_score,
        difficulty_level=req.difficulty_level or sample.difficulty_level,
        source_contract_id=sample.source_contract_id,
        source_clause_id=sample.source_clause_id,
        assignee_id=sample.assignee_id,
        reviewer_id=current_user.id,
        review_comment=req.review_comment,
        previous_sample_id=old_sample_id,
    )
    db.add(new_sample)

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(sample, k, v)
    sample.status = SampleStatus.SUPERSEDED

    await db.commit()
    await db.refresh(new_sample)
    return BaseResponse(data=SampleInfo.model_validate(new_sample), message="样本已更新(创建新版本链)")


@router.post("/samples/{sample_id}/rollback", response_model=BaseResponse[SampleInfo])
async def rollback_sample(
    sample_id: int,
    req: SampleRollbackRequest = Body(default_factory=SampleRollbackRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(DatasetSample).where(DatasetSample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")

    target_id = sample.previous_sample_id
    if not target_id:
        raise HTTPException(status_code=400, detail="没有可回滚的历史版本")

    target_result = await db.execute(
        select(DatasetSample).where(DatasetSample.id == target_id)
    )
    target = target_result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="回滚目标版本不存在")

    new_sample = DatasetSample(
        dataset_id=target.dataset_id,
        sample_type=target.sample_type,
        status=SampleStatus.DRAFT,
        input_text=target.input_text,
        reference_output=target.reference_output,
        input_metadata=target.input_metadata,
        reference_metadata=target.reference_metadata,
        reference_score=target.reference_score,
        difficulty_level=target.difficulty_level,
        source_contract_id=target.source_contract_id,
        source_clause_id=target.source_clause_id,
        assignee_id=target.assignee_id,
        reviewer_id=current_user.id,
        previous_sample_id=sample.id,
        rollback_to_id=target.id,
        is_rollback=True,
        rollback_reason=req.reason,
        rolled_back_at=datetime.utcnow(),
    )
    db.add(new_sample)
    await db.commit()
    await db.refresh(new_sample)
    return BaseResponse(data=SampleInfo.model_validate(new_sample), message="样本已回滚")


@router.post("/{dataset_id}/versions", response_model=BaseResponse[DatasetVersionInfo])
async def create_version(
    dataset_id: int,
    req: DatasetVersionCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = ds_result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")

    version = DatasetVersion(
        dataset_id=dataset_id,
        version=req.version,
        change_log=req.change_log,
        sample_count=dataset.sample_count or 0,
        stats_snapshot={
            "sample_count": dataset.sample_count,
            "approved_count": dataset.approved_count,
            "labeled_count": dataset.labeled_count,
        },
        created_by_id=current_user.id,
    )
    db.add(version)
    dataset.version = req.version
    await db.commit()
    await db.refresh(version)
    return BaseResponse(data=DatasetVersionInfo.model_validate(version), message="版本快照已创建")


@router.get("/{dataset_id}/versions", response_model=BaseResponse[List[DatasetVersionInfo]])
async def list_versions(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DatasetVersion)
        .where(DatasetVersion.dataset_id == dataset_id)
        .order_by(DatasetVersion.created_at.desc())
    )
    items = [DatasetVersionInfo.model_validate(r) for r in result.scalars().all()]
    return BaseResponse(data=items)


@router.post("/{dataset_id}/export", response_model=BaseResponse[DatasetExportResponse])
async def export_dataset(
    dataset_id: int,
    req: DatasetExportRequest = Body(default_factory=DatasetExportRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = ds_result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")

    sample_q = select(DatasetSample).where(DatasetSample.dataset_id == dataset_id)
    if req.status_filter:
        sample_q = sample_q.where(DatasetSample.status.in_(req.status_filter))
    if req.sample_ids:
        sample_q = sample_q.where(DatasetSample.id.in_(req.sample_ids))

    samples_result = await db.execute(sample_q)
    samples = list(samples_result.scalars().all())

    os.makedirs(settings.EXPORT_DIR, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_name = f"dataset_{dataset_id}_{ts}.jsonl"
    file_path = os.path.join(settings.EXPORT_DIR, file_name)

    with open(file_path, "w", encoding="utf-8") as f:
        for s in samples:
            import json as _json
            line = _json.dumps(
                {
                    "id": s.id,
                    "sample_type": s.sample_type.value if hasattr(s.sample_type, "value") else str(s.sample_type),
                    "input_text": s.input_text,
                    "reference_output": s.reference_output,
                    "input_metadata": s.input_metadata,
                    "reference_metadata": s.reference_metadata,
                    "difficulty_level": s.difficulty_level,
                },
                ensure_ascii=False,
            )
            f.write(line + "\n")

    file_size = os.path.getsize(file_path)
    file_url = f"/static/exports/{file_name}"

    return BaseResponse(
        data=DatasetExportResponse(
            dataset_id=dataset_id,
            file_url=file_url,
            sample_count=len(samples),
            file_size=file_size,
        ),
        message="导出成功",
    )


@router.post("/{dataset_id}/import", response_model=BaseResponse[DatasetImportResponse])
async def import_dataset(
    dataset_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ds_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = ds_result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="数据集不存在")

    content = await file.read()
    lines = content.decode("utf-8").strip().splitlines()
    imported = 0
    skipped = 0
    errors: List[str] = []

    import json as _json
    for i, line in enumerate(lines, 1):
        try:
            obj = _json.loads(line)
            if not obj.get("input_text"):
                skipped += 1
                errors.append(f"行{i}: 缺少input_text")
                continue
            sample = DatasetSample(
                dataset_id=dataset_id,
                sample_type=SampleType(obj.get("sample_type", "clause_summary")),
                status=SampleStatus.DRAFT,
                input_text=obj["input_text"],
                reference_output=obj.get("reference_output"),
                input_metadata=obj.get("input_metadata"),
                reference_metadata=obj.get("reference_metadata"),
                difficulty_level=obj.get("difficulty_level", 1),
            )
            db.add(sample)
            imported += 1
        except Exception as e:
            skipped += 1
            errors.append(f"行{i}: {str(e)}")

    dataset.sample_count = (dataset.sample_count or 0) + imported
    await db.commit()

    return BaseResponse(
        data=DatasetImportResponse(
            dataset_id=dataset_id,
            imported_count=imported,
            skipped_count=skipped,
            errors=errors[:100],
        ),
        message=f"导入完成, 成功{imported}条, 跳过{skipped}条",
    )


@router.post("/{dataset_id}/clone", response_model=BaseResponse[DatasetInfo])
async def clone_dataset(
    dataset_id: int,
    req: DatasetCloneRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    src_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    src = src_result.scalar_one_or_none()
    if not src:
        raise HTTPException(status_code=404, detail="源数据集不存在")

    new_ds = Dataset(
        name=req.new_name,
        description=src.description,
        dataset_type=src.dataset_type,
        version="1.0",
        tags=src.tags,
        extra_metadata={"cloned_from": src.id, **(src.extra_metadata or {})},
        is_active=True,
        is_public=False,
        owner_id=current_user.id,
    )
    db.add(new_ds)
    await db.flush()

    if req.include_samples:
        samples_result = await db.execute(
            select(DatasetSample).where(DatasetSample.dataset_id == src.id)
        )
        for s in samples_result.scalars().all():
            clone_s = DatasetSample(
                dataset_id=new_ds.id,
                sample_type=s.sample_type,
                status=SampleStatus.DRAFT,
                input_text=s.input_text,
                reference_output=s.reference_output,
                input_metadata=s.input_metadata,
                reference_metadata=s.reference_metadata,
                difficulty_level=s.difficulty_level,
            )
            db.add(clone_s)
            new_ds.sample_count = (new_ds.sample_count or 0) + 1

    await db.commit()
    await db.refresh(new_ds)
    return BaseResponse(data=DatasetInfo.model_validate(new_ds), message="数据集克隆成功")
