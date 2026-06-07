import sys
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import yaml

sys.path.insert(0, os.path.dirname(__file__))

from models import (
    SummaryRequest, SummaryResponse,
    TrendRequest, TrendResponse,
    HeatmapRequest, HeatmapResponse,
    ShiftRankRequest, ShiftRankResponse,
    AlarmCorrelationRequest, AlarmCorrelationResponse,
    ExportRequest, ExportTaskResponse,
)
from services import (
    compute_summary, compute_trend, compute_heatmap,
    compute_shift_rank, compute_alarm_correlation,
)
from export import create_export_task, get_export_task, get_export_csv
from db.database import query

app = FastAPI(title="物流分拣差错率分析系统", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

METRICS_CONFIG = None


def _load_metrics():
    global METRICS_CONFIG
    if METRICS_CONFIG is not None:
        return METRICS_CONFIG
    config_path = Path(__file__).parent / "config" / "metrics.yaml"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            METRICS_CONFIG = yaml.safe_load(f)
    else:
        METRICS_CONFIG = {}
    return METRICS_CONFIG


@app.post("/api/summary", response_model=SummaryResponse)
async def api_summary(req: SummaryRequest):
    result = compute_summary(
        start_time=req.start_time,
        end_time=req.end_time,
        shift=req.shift,
        device=req.device,
        slot=req.slot,
        route=req.route,
    )
    return result


@app.post("/api/trend", response_model=TrendResponse)
async def api_trend(req: TrendRequest):
    result = compute_trend(
        start_time=req.start_time,
        end_time=req.end_time,
        granularity=req.granularity,
        shift=req.shift,
        slot=req.slot,
        route=req.route,
        device=req.device,
    )
    return result


@app.post("/api/heatmap", response_model=HeatmapResponse)
async def api_heatmap(req: HeatmapRequest):
    result = compute_heatmap(
        start_time=req.start_time,
        end_time=req.end_time,
        metric=req.metric,
        shift=req.shift,
        slot=req.slot,
        route=req.route,
        device=req.device,
    )
    return result


@app.post("/api/shift-rank", response_model=ShiftRankResponse)
async def api_shift_rank(req: ShiftRankRequest):
    result = compute_shift_rank(
        start_time=req.start_time,
        end_time=req.end_time,
        shift=req.shift,
        slot=req.slot,
        route=req.route,
        device=req.device,
    )
    return result


@app.post("/api/alarm-correlation", response_model=AlarmCorrelationResponse)
async def api_alarm_correlation(req: AlarmCorrelationRequest):
    result = compute_alarm_correlation(
        start_time=req.start_time,
        end_time=req.end_time,
        shift=req.shift,
        slot=req.slot,
        route=req.route,
        device=req.device,
    )
    return result


@app.get("/api/metrics")
async def api_metrics():
    config = _load_metrics()
    raw = config.get("metrics", {})
    result = []
    for key, val in raw.items():
        result.append({
            "key": key,
            "name": val.get("name", key),
            "formula": val.get("formula", ""),
            "description": val.get("description", ""),
            "unit": val.get("unit", ""),
            "threshold_warning": val.get("threshold_warning", 0),
            "threshold_critical": val.get("threshold_critical", 0),
            "category": val.get("category", ""),
        })
    return {"metrics": result}


@app.post("/api/export", response_model=ExportTaskResponse)
async def api_export(req: ExportRequest):
    task_id = create_export_task(
        start_time=req.start_time,
        end_time=req.end_time,
        data_type=req.data_type,
        shift=req.shift,
        slot=req.slot,
        route=req.route,
        device=req.device,
    )
    return ExportTaskResponse(task_id=task_id, status="处理中")


@app.get("/api/export/{task_id}")
async def api_export_status(task_id: str):
    result = get_export_task(task_id)
    if result is None:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    return result


@app.get("/api/export/{task_id}/download")
async def api_export_download(task_id: str):
    csv_content = get_export_csv(task_id)
    if csv_content is None:
        raise HTTPException(status_code=404, detail="导出文件不存在或未完成")

    import io
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=export_{task_id}.csv"},
    )


@app.get("/api/health")
async def health_check():
    try:
        query("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "message": "物流分拣差错率分析系统运行正常", "database": db_status}
