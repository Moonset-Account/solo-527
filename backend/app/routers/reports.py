from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional
import io
import uuid
import json
import pandas as pd
from ..database import get_db
from ..models import User, APITask, TaskStatus
from ..schemas import ExportRequest, APITaskResponse
from ..auth import get_current_user, get_current_active_dispatcher
from ..celery_app import export_report_task

router = APIRouter(tags=["报表导出"])


@router.post("/api/reports/export", response_model=APITaskResponse)
async def create_export_task(
    request: Request,
    export_data: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    task_id = str(uuid.uuid4())
    
    api_task = APITask(
        task_id=task_id,
        task_name="导出报表",
        status=TaskStatus.PENDING,
        retry_count=0,
        max_retries=3,
        request_data=export_data.model_dump(),
        created_by=current_user.id
    )
    db.add(api_task)
    db.commit()
    db.refresh(api_task)
    
    export_params = {
        "start_date": export_data.start_date.isoformat() if export_data.start_date else None,
        "end_date": export_data.end_date.isoformat() if export_data.end_date else None,
        "include_utilization": export_data.include_utilization,
        "include_conflicts": export_data.include_conflicts,
        "include_operations": export_data.include_operations
    }
    
    export_report_task.delay(export_params, current_user.id, task_id)
    
    return api_task


@router.get("/api/tasks", response_model=list[APITaskResponse])
async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    task_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(APITask)
    
    if status:
        query = query.filter(APITask.status == status)
    if task_name:
        query = query.filter(APITask.task_name.like(f"%{task_name}%"))
    
    return query.order_by(APITask.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/api/tasks/{task_id}", response_model=APITaskResponse)
async def get_task_detail(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    task = db.query(APITask).filter(APITask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    return task


@router.post("/api/tasks/{task_id}/retry")
async def retry_task(
    request: Request,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    task = db.query(APITask).filter(APITask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    if task.retry_count >= task.max_retries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已达到最大重试次数"
        )
    
    task.status = TaskStatus.PENDING
    task.retry_count += 1
    task.error_message = None
    task.error_traceback = None
    db.commit()
    
    export_report_task.delay(task.request_data, current_user.id, task_id)
    
    return {"message": "已重新提交任务", "retry_count": task.retry_count}


@router.get("/api/reports/download/{task_id}")
async def download_report(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    task = db.query(APITask).filter(APITask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    if task.status != TaskStatus.SUCCESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务未完成，当前状态: {task.status}"
        )
    
    data = task.response_data
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报表数据不存在"
        )
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        if "utilization" in data and data["utilization"]:
            df_util = pd.DataFrame(data["utilization"])
            df_util.columns = [
                "排班ID", "咨询师", "日期", "时段", "最大预约数",
                "已预约数", "利用率(%)", "状态"
            ]
            df_util.to_excel(writer, sheet_name="档期利用", index=False)
        
        if "conflicts" in data and data["conflicts"]:
            df_conflict = pd.DataFrame(data["conflicts"])
            df_conflict.columns = [
                "预约ID", "访客姓名", "访客电话", "咨询师",
                "预约日期", "时段", "冲突原因"
            ]
            df_conflict.to_excel(writer, sheet_name="预约冲突", index=False)
        
        if "operations" in data and data["operations"]:
            df_ops = pd.DataFrame(data["operations"])
            df_ops.columns = [
                "操作ID", "操作人", "操作类型", "目标类型",
                "目标ID", "IP地址", "操作时间"
            ]
            df_ops.to_excel(writer, sheet_name="操作记录", index=False)
    
    output.seek(0)
    filename = f"counseling_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/api/reports/{task_id}/preview")
async def preview_report(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    task = db.query(APITask).filter(APITask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    
    if task.status != TaskStatus.SUCCESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务未完成，当前状态: {task.status}"
        )
    
    return task.response_data
