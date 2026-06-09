from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.ml import (
    ABRun,
    ABStatus,
    EvaluationResult,
    ModelMetric,
    ModelStatus,
    ModelVersion,
)
from app.models.task import Task, TaskStatus, TaskType, TaskPriority
from app.models.user import User
from app.schemas.base import BaseResponse, PageResponse
from app.schemas.mlops import (
    ABTestAnalyzeResponse,
    ABTestCreateRequest,
    ABTestInfo,
    ABTestStopRequest,
    ApproveRequest,
    EvaluationCreateRequest,
    EvaluationInfo,
    MetricPoint,
    ModelInfo,
    ModelMetricsResponse,
    ModelRegisterRequest,
    PreflightCheckResult,
    PreflightResponse,
    PublishRequest,
    RollbackRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mlops", tags=["MLOps"])


@router.post("/models/register", response_model=BaseResponse[ModelInfo])
async def register_model(
    req: ModelRegisterRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_q = select(ModelVersion).where(
        and_(ModelVersion.model_name == req.model_name, ModelVersion.version == req.version)
    )
    existing = (await db.execute(existing_q)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="同名称+版本的模型已存在")

    model = ModelVersion(
        model_name=req.model_name,
        version=req.version,
        task_type=req.task_type,
        status=ModelStatus.DRAFT,
        is_default=False,
        provider=req.provider,
        base_model=req.base_model,
        fine_tuned_on=req.fine_tuned_on,
        prompt_template_version=req.prompt_template_version,
        system_prompt=req.system_prompt,
        generation_config=req.generation_config,
        rag_config=req.rag_config,
        training_metrics=req.training_metrics,
        eval_metrics=req.eval_metrics,
        description=req.description,
        changelog=req.changelog,
        tags=req.tags,
        parent_version_id=req.parent_version_id,
        created_by_id=current_user.id,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return BaseResponse(data=ModelInfo.model_validate(model), message="模型注册成功")


@router.post("/models/{model_id}/preflight", response_model=BaseResponse[PreflightResponse])
async def preflight_check(
    model_id: int,
    req: Optional[dict] = Body(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ModelVersion).where(ModelVersion.id == model_id)
    model = (await db.execute(q)).scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    checks = [
        PreflightCheckResult(name="eval_metrics_present", passed=bool(model.eval_metrics),
                             message="评估指标存在" if model.eval_metrics else "缺少评估指标",
                             severity="warning" if not model.eval_metrics else "info"),
        PreflightCheckResult(name="description_present", passed=bool(model.description),
                             message="描述已填写" if model.description else "缺少发布说明",
                             severity="info"),
        PreflightCheckResult(name="changelog_present", passed=bool(model.changelog),
                             message="变更记录已填写" if model.changelog else "缺少变更日志",
                             severity="info"),
        PreflightCheckResult(name="status_ready", passed=model.status in [ModelStatus.DRAFT, ModelStatus.TESTING, ModelStatus.STAGING],
                             message="状态可发布" if model.status in [ModelStatus.DRAFT, ModelStatus.TESTING, ModelStatus.STAGING] else "当前状态不可发布",
                             severity="error" if model.status not in [ModelStatus.DRAFT, ModelStatus.TESTING, ModelStatus.STAGING] else "info"),
    ]
    all_passed = all(c.passed for c in checks if c.severity != "info")
    return BaseResponse(
        data=PreflightResponse(model_id=model_id, all_passed=all_passed, checks=checks)
    )


@router.post("/models/{model_id}/approve", response_model=BaseResponse[ModelInfo])
async def approve_model(
    model_id: int,
    req: ApproveRequest = Body(default_factory=ApproveRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ModelVersion).where(ModelVersion.id == model_id)
    model = (await db.execute(q)).scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")
    model.status = ModelStatus.STAGING
    model.approved_by_id = current_user.id
    model.approved_at = datetime.utcnow()
    if req.note and model.changelog:
        model.changelog = f"{model.changelog}\n\n审核备注: {req.note}"
    await db.commit()
    await db.refresh(model)
    return BaseResponse(data=ModelInfo.model_validate(model), message="模型已审核通过")


@router.post("/models/{model_id}/publish", response_model=BaseResponse[ModelInfo])
async def publish_model(
    model_id: int,
    req: PublishRequest = Body(default_factory=PublishRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ModelVersion).where(ModelVersion.id == model_id)
    model = (await db.execute(q)).scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")
    model.status = ModelStatus.PRODUCTION
    model.published_by_id = current_user.id
    model.published_at = datetime.utcnow()

    if req.set_default:
        same_name_q = select(ModelVersion).where(ModelVersion.model_name == model.model_name)
        for m in (await db.execute(same_name_q)).scalars().all():
            m.is_default = (m.id == model.id)

    await db.commit()
    await db.refresh(model)
    return BaseResponse(data=ModelInfo.model_validate(model), message="模型已发布到生产")


@router.post("/models/{model_id}/rollback", response_model=BaseResponse[ModelInfo])
async def rollback_model(
    model_id: int,
    req: RollbackRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ModelVersion).where(ModelVersion.id == model_id)
    model = (await db.execute(q)).scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    target_q = select(ModelVersion).where(ModelVersion.id == req.target_version_id)
    target = (await db.execute(target_q)).scalar_one_or_none() if req.target_version_id else None

    model.status = ModelStatus.ROLLED_BACK
    model.rolled_back_at = datetime.utcnow()
    model.rollback_reason = req.reason
    if target:
        model.rollback_to_version = target.version
    await db.commit()
    await db.refresh(model)
    return BaseResponse(data=ModelInfo.model_validate(model), message="模型已回滚")


@router.get("/models", response_model=BaseResponse[PageResponse[ModelInfo]])
async def list_models(
    model_name: Optional[str] = Query(None),
    status: Optional[ModelStatus] = Query(None),
    task_type: Optional[str] = Query(None),
    is_default: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if model_name:
        conditions.append(ModelVersion.model_name.ilike(f"%{model_name}%"))
    if status:
        conditions.append(ModelVersion.status == status)
    if task_type:
        conditions.append(ModelVersion.task_type == task_type)
    if is_default is not None:
        conditions.append(ModelVersion.is_default == is_default)
    where_clause = and_(*conditions) if conditions else True

    total_q = select(func.count()).select_from(ModelVersion).where(where_clause)
    total = (await db.execute(total_q)).scalar_one() or 0

    q = select(ModelVersion).where(where_clause).order_by(
        ModelVersion.is_default.desc(),
        ModelVersion.created_at.desc(),
    ).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    items = [ModelInfo.model_validate(r) for r in rows]

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.get("/models/{model_id}/metrics", response_model=BaseResponse[ModelMetricsResponse])
async def get_model_metrics(
    model_id: int,
    metric: Optional[str] = Query(None, description="指标类型(旧参数,兼容用)"),
    window_days: Optional[int] = Query(None, ge=1, le=365, description="时间窗口天数(旧参数,兼容用)"),
    metric_type: Optional[str] = Query(None, description="指标类型: f1,accuracy,precision,recall 等"),
    days: Optional[int] = Query(None, ge=1, le=365, description="统计天数"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m_q = select(ModelVersion.id).where(ModelVersion.id == model_id)
    if not (await db.execute(m_q)).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="模型不存在")

    final_metric = metric_type or metric or "f1"
    final_days = days or window_days or 30

    start = datetime.utcnow() - timedelta(days=final_days)
    from app.models.ml import MetricType
    try:
        metric_type_enum = MetricType(final_metric.upper())
    except ValueError:
        metric_type_enum = MetricType.F1

    q = select(ModelMetric).where(
        and_(
            ModelMetric.model_id == model_id,
            ModelMetric.metric_type == metric_type_enum,
            ModelMetric.created_at >= start,
        )
    ).order_by(ModelMetric.created_at.asc())

    metrics = list((await db.execute(q)).scalars().all())
    points = [
        MetricPoint(
            timestamp=m.created_at,
            value=m.metric_value,
            ci_lower=m.metric_ci_lower,
            ci_upper=m.metric_ci_upper,
            sample_size=m.sample_size,
        )
        for m in metrics
    ]

    avg_val = sum(p.value for p in points) / len(points) if points else None
    return BaseResponse(
        data=ModelMetricsResponse(
            model_id=model_id,
            metric_type=metric_type_enum,
            window_days=final_days,
            points=points,
            avg=avg_val,
            trend=None,
        )
    )


@router.get("/ab-tests", response_model=BaseResponse[PageResponse[ABTestInfo]])
async def list_ab_tests(
    status: Optional[ABStatus] = Query(None),
    task_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if status:
        conditions.append(ABRun.status == status)
    if task_type:
        conditions.append(ABRun.task_type == task_type)
    where_clause = and_(*conditions) if conditions else True

    total_q = select(func.count()).select_from(ABRun).where(where_clause)
    total = (await db.execute(total_q)).scalar_one() or 0

    q = select(ABRun).where(where_clause).order_by(
        ABRun.created_at.desc(),
    ).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()

    items = []
    for ab in rows:
        info = ABTestInfo.model_validate(ab)
        mq_a = select(ModelVersion.model_name, ModelVersion.version).where(ModelVersion.id == ab.model_a_id)
        mq_b = select(ModelVersion.model_name, ModelVersion.version).where(ModelVersion.id == ab.model_b_id)
        row_a = (await db.execute(mq_a)).first()
        row_b = (await db.execute(mq_b)).first()
        if row_a:
            info.model_a_name = f"{row_a[0]} {row_a[1]}"
        if row_b:
            info.model_b_name = f"{row_b[0]} {row_b[1]}"
        items.append(info)

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.post("/ab-tests", response_model=BaseResponse[ABTestInfo])
async def create_ab_test(
    req: ABTestCreateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for mid in [req.model_a_id, req.model_b_id]:
        mq = select(ModelVersion.id).where(ModelVersion.id == mid)
        if not (await db.execute(mq)).scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"模型 {mid} 不存在")

    ab = ABRun(
        name=req.name,
        description=req.description,
        model_a_id=req.model_a_id,
        model_b_id=req.model_b_id,
        task_type=req.task_type,
        status=ABStatus.DRAFT,
        dataset_id=req.dataset_id,
        split_ratio=req.split_ratio,
        target_sample_size=req.target_sample_size,
        primary_metric=req.primary_metric,
        created_by_id=current_user.id,
    )
    db.add(ab)
    await db.commit()
    await db.refresh(ab)
    return BaseResponse(data=ABTestInfo.model_validate(ab), message="AB测试已创建")


@router.get("/ab-tests/{ab_id}", response_model=BaseResponse[ABTestInfo])
async def get_ab_test(
    ab_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ABRun).where(ABRun.id == ab_id)
    ab = (await db.execute(q)).scalar_one_or_none()
    if not ab:
        raise HTTPException(status_code=404, detail="AB测试不存在")

    info = ABTestInfo.model_validate(ab)
    mq_a = select(ModelVersion.model_name).where(ModelVersion.id == ab.model_a_id)
    mq_b = select(ModelVersion.model_name).where(ModelVersion.id == ab.model_b_id)
    info.model_a_name = (await db.execute(mq_a)).scalar_one_or_none()
    info.model_b_name = (await db.execute(mq_b)).scalar_one_or_none()
    return BaseResponse(data=info)


@router.post("/ab-tests/{ab_id}/analyze", response_model=BaseResponse[ABTestAnalyzeResponse])
async def analyze_ab_test(
    ab_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ABRun).where(ABRun.id == ab_id)
    ab = (await db.execute(q)).scalar_one_or_none()
    if not ab:
        raise HTTPException(status_code=404, detail="AB测试不存在")

    return BaseResponse(
        data=ABTestAnalyzeResponse(
            ab_run_id=ab_id,
            analyzed=True,
            primary_metric=ab.primary_metric or "f1",
            a_score=None,
            b_score=None,
            diff=None,
            p_value=None,
            is_significant=False,
            recommended_winner=None,
        ),
        message="分析完成(占位)",
    )


@router.post("/ab-tests/{ab_id}/stop", response_model=BaseResponse[ABTestInfo])
async def stop_ab_test(
    ab_id: int,
    req: ABTestStopRequest = Body(default_factory=ABTestStopRequest),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ABRun).where(ABRun.id == ab_id)
    ab = (await db.execute(q)).scalar_one_or_none()
    if not ab:
        raise HTTPException(status_code=404, detail="AB测试不存在")

    ab.status = ABStatus.STOPPED
    ab.end_date = datetime.utcnow()
    if req.winner and req.winner in ["A", "B"]:
        ab.winner = req.winner
    await db.commit()
    await db.refresh(ab)

    info = ABTestInfo.model_validate(ab)
    return BaseResponse(data=info, message=f"AB测试已停止, 胜者={req.winner}")


@router.post("/evaluations", response_model=BaseResponse[EvaluationInfo])
async def run_evaluation(
    req: EvaluationCreateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for mid, did in [(req.model_id, req.dataset_id)]:
        mq = select(ModelVersion.id).where(ModelVersion.id == mid)
        if not (await db.execute(mq)).scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"模型 {mid} 不存在")
    task = Task(
        task_type=TaskType.EVALUATE_MODEL,
        status=TaskStatus.PENDING,
        priority=TaskPriority.MEDIUM,
        model_id=req.model_id,
        dataset_id=req.dataset_id,
        ab_run_id=req.ab_run_id,
        creator_id=current_user.id,
        title=f"评估模型#{req.model_id}",
        params={
            "model_id": req.model_id,
            "dataset_id": req.dataset_id,
            "task_type": req.task_type.value if req.task_type else None,
            "variant_label": req.variant_label,
            "metrics": req.metrics,
            "judge_model": req.judge_model,
        },
    )
    db.add(task)
    await db.flush()
    eva = EvaluationResult(
        model_id=req.model_id,
        ab_run_id=req.ab_run_id,
        task_type=req.task_type,
        variant_label=req.variant_label,
        total_samples=0,
        processed_samples=0,
        model_output="evaluation_triggered",
    )
    eva.id = 0
    await db.commit()
    return BaseResponse(
        data=EvaluationInfo(
            id=task.id,
            model_id=req.model_id,
            dataset_id=req.dataset_id,
            ab_run_id=req.ab_run_id,
            task_type=req.task_type,
            variant_label=req.variant_label,
            created_at=datetime.utcnow(),
        ),
        message="评估任务已触发",
    )


@router.get("/evaluations/{evaluation_id}", response_model=BaseResponse[EvaluationInfo])
async def get_evaluation(
    evaluation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(EvaluationResult).where(EvaluationResult.id == evaluation_id)
    eva = (await db.execute(q)).scalar_one_or_none()
    if not eva:
        raise HTTPException(status_code=404, detail="评估结果不存在")
    return BaseResponse(data=EvaluationInfo.model_validate(eva))


@router.get("/models/{model_id}/pre-release-checks", response_model=BaseResponse[PreflightResponse])
async def pre_release_checks_get_alias(
    model_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ModelVersion).where(ModelVersion.id == model_id)
    model = (await db.execute(q)).scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")

    checks = [
        PreflightCheckResult(
            name="eval_metrics_present",
            passed=bool(model.eval_metrics),
            message="评估指标存在" if model.eval_metrics else "缺少评估指标",
            severity="warning" if not model.eval_metrics else "info",
        ),
        PreflightCheckResult(
            name="description_present",
            passed=bool(model.description),
            message="描述已填写" if model.description else "缺少发布说明",
            severity="info",
        ),
        PreflightCheckResult(
            name="changelog_present",
            passed=bool(model.changelog),
            message="变更记录已填写" if model.changelog else "缺少变更日志",
            severity="info",
        ),
        PreflightCheckResult(
            name="status_ready",
            passed=model.status in [ModelStatus.DRAFT, ModelStatus.TESTING, ModelStatus.STAGING],
            message="状态可发布" if model.status in [ModelStatus.DRAFT, ModelStatus.TESTING, ModelStatus.STAGING] else "当前状态不可发布",
            severity="error" if model.status not in [ModelStatus.DRAFT, ModelStatus.TESTING, ModelStatus.STAGING] else "info",
        ),
    ]

    test_sample_count = 0
    if model.eval_metrics and isinstance(model.eval_metrics, dict):
        test_sample_count = int(model.eval_metrics.get("test_samples") or model.eval_metrics.get("sample_count") or model.eval_metrics.get("n_samples") or 0)
    eval_q = select(func.count()).select_from(EvaluationResult).where(EvaluationResult.model_id == model_id)
    eval_result = (await db.execute(eval_q)).scalar_one() or 0
    total_test_samples = max(test_sample_count, eval_result)
    coverage_passed = total_test_samples >= 20
    checks.append(PreflightCheckResult(
        name="test_coverage_pass",
        passed=coverage_passed,
        message=f"测试样本数达标({total_test_samples}>=20)" if coverage_passed else f"测试样本数不足({total_test_samples}<20)",
        severity="warning" if not coverage_passed else "info",
    ))

    improvement_passed = True
    improvement_message = "无父版本，跳过对比"
    if model.parent_version_id:
        parent_q = select(ModelVersion).where(ModelVersion.id == model.parent_version_id)
        parent = (await db.execute(parent_q)).scalar_one_or_none()
        if parent:
            current_f1 = 0.0
            parent_f1 = 0.0
            if model.eval_metrics and isinstance(model.eval_metrics, dict):
                current_f1 = float(model.eval_metrics.get("f1") or model.eval_metrics.get("f1_score") or 0.0)
            if parent.eval_metrics and isinstance(parent.eval_metrics, dict):
                parent_f1 = float(parent.eval_metrics.get("f1") or parent.eval_metrics.get("f1_score") or 0.0)
            f1_diff = current_f1 - parent_f1
            improvement_passed = f1_diff > 0.02
            improvement_message = f"F1提升{f1_diff:.4f}{'(>0.02，达标)' if improvement_passed else '(<=0.02，未达标)'}"
        else:
            improvement_passed = False
            improvement_message = "父版本不存在"
    checks.append(PreflightCheckResult(
        name="significant_improvement",
        passed=improvement_passed,
        message=improvement_message,
        severity="warning" if not improvement_passed and model.parent_version_id else "info",
    ))

    all_passed = all(c.passed for c in checks if c.severity != "info")
    return BaseResponse(
        data=PreflightResponse(model_id=model_id, all_passed=all_passed, checks=checks),
        message="发布前检查完成",
    )
