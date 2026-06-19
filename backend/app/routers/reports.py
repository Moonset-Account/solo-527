from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional
import io
import uuid
import json
from ..database import get_db
from ..models import User, APITask, TaskStatus
from ..schemas import ExportRequest, APITaskResponse
from ..auth import get_current_user, get_current_active_dispatcher, log_operation, model_to_dict
from ..celery_app import export_report_task, generate_report, generate_excel_bytes

router = APIRouter(tags=["报表导出"])


@router.post("/api/reports/export", response_model=APITaskResponse)
async def create_export_task(
    request: Request,
    export_data: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    task_id = str(uuid.uuid4())

    export_params = {
        "start_date": export_data.start_date.isoformat() if export_data.start_date else None,
        "end_date": export_data.end_date.isoformat() if export_data.end_date else None,
        "include_utilization": export_data.include_utilization,
        "include_conflicts": export_data.include_conflicts,
        "include_operations": export_data.include_operations
    }

    report_data = generate_report(db, export_params)

    api_task = APITask(
        task_id=task_id,
        task_name="导出报表",
        status=TaskStatus.SUCCESS,
        retry_count=0,
        max_retries=3,
        request_data=export_data.model_dump(),
        response_data=report_data,
        created_by=current_user.id,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    db.add(api_task)
    db.commit()
    db.refresh(api_task)

    log_operation(
        db, current_user.id, "create", "report",
        request=request,
        new_value={"params": export_params, "task_id": task_id}
    )

    try:
        export_report_task.delay(export_params, current_user.id, task_id)
    except Exception:
        pass

    return api_task


@router.post("/api/reports/export-sync")
async def export_sync(
    request: Request,
    export_data: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    export_params = {
        "start_date": export_data.start_date.isoformat() if export_data.start_date else None,
        "end_date": export_data.end_date.isoformat() if export_data.end_date else None,
        "include_utilization": export_data.include_utilization,
        "include_conflicts": export_data.include_conflicts,
        "include_operations": export_data.include_operations
    }

    report_data = generate_report(db, export_params)

    task_id = str(uuid.uuid4())
    api_task = APITask(
        task_id=task_id,
        task_name="同步导出报表",
        status=TaskStatus.SUCCESS,
        retry_count=0,
        max_retries=3,
        request_data=export_data.model_dump(),
        response_data={
            "summary": report_data.get("summary", {}),
            "stats": report_data.get("summary", {}).get("stats", {})
        },
        created_by=current_user.id,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    db.add(api_task)
    db.commit()

    log_operation(
        db, current_user.id, "export", "report",
        request=request,
        new_value={"params": export_params, "task_id": task_id}
    )

    excel_bytes = generate_excel_bytes(report_data)
    from urllib.parse import quote
    filename = f"counseling_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filename_cn = f"心理咨询排班报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}; filename*=UTF-8''{quote(filename_cn)}",
            "X-Task-Id": task_id
        }
    )


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
            detail="已达到最大重试次数，请直接发起新的导出"
        )

    task.status = TaskStatus.PENDING
    task.retry_count += 1
    task.error_message = None
    task.error_traceback = None
    db.commit()

    try:
        export_params = {
            "start_date": task.request_data.get("start_date") if task.request_data else None,
            "end_date": task.request_data.get("end_date") if task.request_data else None,
            "include_utilization": task.request_data.get("include_utilization", True) if task.request_data else True,
            "include_conflicts": task.request_data.get("include_conflicts", True) if task.request_data else True,
            "include_operations": task.request_data.get("include_operations", True) if task.request_data else True
        }
        report_data = generate_report(db, export_params)
        task.status = TaskStatus.SUCCESS
        task.response_data = report_data
        task.started_at = datetime.utcnow()
        task.completed_at = datetime.utcnow()
        db.commit()

        log_operation(
            db, current_user.id, "retry", "task", task.id,
            request=request,
            new_value={"task_id": task_id, "status": "success"}
        )

        return {"message": "重试成功，数据已生成", "retry_count": task.retry_count}
    except Exception as e:
        task.status = TaskStatus.FAILED
        task.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重试失败: {str(e)}"
        )


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
        if task.status in [TaskStatus.PENDING, TaskStatus.RUNNING, TaskStatus.RETRYING]:
            if task.request_data:
                export_params = {
                    "start_date": task.request_data.get("start_date"),
                    "end_date": task.request_data.get("end_date"),
                    "include_utilization": task.request_data.get("include_utilization", True),
                    "include_conflicts": task.request_data.get("include_conflicts", True),
                    "include_operations": task.request_data.get("include_operations", True)
                }
                try:
                    report_data = generate_report(db, export_params)
                    task.status = TaskStatus.SUCCESS
                    task.response_data = report_data
                    task.started_at = datetime.utcnow()
                    task.completed_at = datetime.utcnow()
                    db.commit()
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"报表生成失败: {str(e)}"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"任务尚未完成，当前状态: {task.status}，请稍后重试"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"任务状态: {task.status}，无法下载。错误信息: {task.error_message or '未知错误'}"
            )

    data = task.response_data
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报表数据不存在，请重新导出"
        )

    excel_bytes = generate_excel_bytes(data)
    from urllib.parse import quote
    filename = f"counseling_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    filename_cn = f"心理咨询排班报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    log_operation(
        db, current_user.id, "download", "report",
        new_value={"task_id": task_id, "filename": filename_cn}
    )

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}; filename*=UTF-8''{quote(filename_cn)}",
            "Cache-Control": "no-cache",
            "X-Report-Task-Id": task_id
        }
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
        if task.status in [TaskStatus.PENDING, TaskStatus.RUNNING] and task.request_data:
            export_params = {
                "start_date": task.request_data.get("start_date"),
                "end_date": task.request_data.get("end_date"),
                "include_utilization": task.request_data.get("include_utilization", True),
                "include_conflicts": task.request_data.get("include_conflicts", True),
                "include_operations": task.request_data.get("include_operations", True)
            }
            try:
                report_data = generate_report(db, export_params)
                task.status = TaskStatus.SUCCESS
                task.response_data = report_data
                task.started_at = datetime.utcnow()
                task.completed_at = datetime.utcnow()
                db.commit()
                return report_data
            except Exception:
                pass

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务未完成，当前状态: {task.status}"
        )

    return task.response_data
