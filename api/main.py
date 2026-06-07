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
from mock_data import generate_mock_data
from services import (
    compute_summary, compute_trend, compute_heatmap,
    compute_shift_rank, compute_alarm_correlation,
)
from export import create_export_task, get_export_task, get_export_csv

app = FastAPI(title="物流分拣差错率分析系统", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mock_data = generate_mock_data(days=30)

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
        mock_data,
        start_time=req.start_time,
        end_time=req.end_time,
        shift=req.shift,
        device=req.device,
    )
    return result


@app.post("/api/trend", response_model=TrendResponse)
async def api_trend(req: TrendRequest):
    result = compute_trend(
        mock_data,
        start_time=req.start_time,
        end_time=req.end_time,
        granularity=req.granularity,
        shift=req.shift,
    )
    return result


@app.post("/api/heatmap", response_model=HeatmapResponse)
async def api_heatmap(req: HeatmapRequest):
    result = compute_heatmap(
        mock_data,
        start_time=req.start_time,
        end_time=req.end_time,
        metric=req.metric,
    )
    return result


@app.post("/api/shift-rank", response_model=ShiftRankResponse)
async def api_shift_rank(req: ShiftRankRequest):
    result = compute_shift_rank(
        mock_data,
        start_time=req.start_time,
        end_time=req.end_time,
    )
    return result


@app.post("/api/alarm-correlation", response_model=AlarmCorrelationResponse)
async def api_alarm_correlation(req: AlarmCorrelationRequest):
    result = compute_alarm_correlation(
        mock_data,
        start_time=req.start_time,
        end_time=req.end_time,
    )
    return result


@app.get("/api/metrics")
async def api_metrics():
    config = _load_metrics()
    return config


@app.post("/api/export", response_model=ExportTaskResponse)
async def api_export(req: ExportRequest):
    task_id = create_export_task(
        mock_data,
        start_time=req.start_time,
        end_time=req.end_time,
        data_type=req.data_type,
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
    return {"status": "ok", "message": "物流分拣差错率分析系统运行正常"}
