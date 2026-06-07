from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from datetime import datetime, timedelta
from typing import Optional, List
import os
import logging

from data.api.schemas.models import (
    FilterParams, BacklogResponse, FunnelResponse, WorkloadResponse,
    AppealReversalResponse, SummaryResponse, DimensionsResponse,
    ExportTaskSubmit, ExportTaskStatus, BacklogPoint, FunnelStep,
    WorkloadItem, AppealReversalItem
)
from data.api.routes.queries import (
    get_backlog_trend, get_funnel_data, get_workload_data,
    get_appeal_reversal_data, get_summary_data
)
from data.metrics.definitions import RISK_TAGS, QUEUE_TYPES, SHIFTS, SOURCES, REVIEWERS
from data.export.tasks import export_manager

logger = logging.getLogger(__name__)

app = FastAPI(title="内容安全审核积压看板 API")


@app.get("/api/health")
async def health_check():
    from data.db.models import db_manager
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "database_connected": db_manager.is_connected,
    }


@app.get("/api/summary", response_model=SummaryResponse)
async def get_summary(hours: Optional[int] = 24):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=hours)
    return get_summary_data(time_start, time_end)


@app.get("/api/dimensions", response_model=DimensionsResponse)
async def get_dimensions():
    return {
        "risk_tags": RISK_TAGS,
        "queue_types": QUEUE_TYPES,
        "shifts": SHIFTS,
        "sources": SOURCES,
        "reviewers": REVIEWERS,
    }


@app.post("/api/backlog", response_model=BacklogResponse)
async def query_backlog(params: FilterParams):
    df = get_backlog_trend(
        time_start=params.time_start,
        time_end=params.time_end,
        granularity=params.granularity,
        risk_tags=params.risk_tags,
        queue_types=params.queue_types,
        reviewers=params.reviewers,
        shifts=params.shifts,
        sources=params.sources,
    )
    data = [
        BacklogPoint(
            timestamp=row.timestamp,
            queue_name=row.queue_name,
            backlog_count=row.backlog_count,
            sla_breach_count=row.sla_breach_count,
        )
        for _, row in df.iterrows()
    ]
    return BacklogResponse(data=data, filters_applied=params)


@app.post("/api/funnel", response_model=FunnelResponse)
async def query_funnel(params: FilterParams):
    df = get_funnel_data(
        time_start=params.time_start,
        time_end=params.time_end,
        risk_tags=params.risk_tags,
        queue_types=params.queue_types,
        reviewers=params.reviewers,
        shifts=params.shifts,
        sources=params.sources,
    )
    data = [
        FunnelStep(
            step_name=row.step_name,
            count=row["count"],
            avg_duration_seconds=row.avg_duration_seconds,
            conversion_rate=row.conversion_rate,
        )
        for _, row in df.iterrows()
    ]
    return FunnelResponse(data=data, filters_applied=params)


@app.post("/api/workload", response_model=WorkloadResponse)
async def query_workload(params: FilterParams):
    df = get_workload_data(
        time_start=params.time_start,
        time_end=params.time_end,
        risk_tags=params.risk_tags,
        queue_types=params.queue_types,
        reviewers=params.reviewers,
        shifts=params.shifts,
        sources=params.sources,
    )
    data = [
        WorkloadItem(
            reviewer_id=row.reviewer_id,
            reviewer_name=row.reviewer_name,
            shift=row["shift"],
            processed_count=row.processed_count,
            avg_review_seconds=row.avg_review_seconds,
            current_backlog=row.current_backlog,
        )
        for _, row in df.iterrows()
    ]
    return WorkloadResponse(data=data, filters_applied=params)


@app.post("/api/appeal", response_model=AppealReversalResponse)
async def query_appeal(params: FilterParams):
    df = get_appeal_reversal_data(
        time_start=params.time_start,
        time_end=params.time_end,
        risk_tags=params.risk_tags,
        queue_types=params.queue_types,
        reviewers=params.reviewers,
        shifts=params.shifts,
        sources=params.sources,
    )
    data = [
        AppealReversalItem(
            original_risk_tag=row.original_risk_tag,
            appeal_total=row.appeal_total,
            appeal_success=row.appeal_success,
            appeal_failed=row.appeal_failed,
            reversal_rate=row.reversal_rate,
        )
        for _, row in df.iterrows()
    ]
    return AppealReversalResponse(data=data, filters_applied=params)


@app.post("/api/export/submit")
async def submit_export(submit: ExportTaskSubmit):
    task_id = export_manager.submit_task(
        filters=submit.filters.model_dump(),
        export_type=submit.export_type,
        format=submit.format,
    )
    return {"task_id": task_id}


@app.get("/api/export/status/{task_id}", response_model=ExportTaskStatus)
async def get_export_status(task_id: str):
    task = export_manager.get_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return ExportTaskStatus(
        task_id=task.task_id,
        status=task.status,
        progress=task.progress,
        download_url=f"/api/export/download/{task_id}" if task.status == "completed" else None,
        error_message=task.error_message,
    )


@app.get("/api/export/download/{task_id}")
async def download_export(task_id: str):
    file_path = export_manager.get_file_path(task_id)
    if file_path and os.path.exists(file_path):
        return FileResponse(
            file_path,
            media_type="application/octet-stream",
            filename=os.path.basename(file_path),
        )
    raise HTTPException(status_code=404, detail=f"Export file for task {task_id} not found")


@app.post("/api/cache/clear")
async def clear_cache():
    from data.cache.redis_client import cache_client
    cache_client.clear_all()
    return {"status": "ok"}

