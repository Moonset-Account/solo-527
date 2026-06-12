from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime
from jose import JWTError, jwt
from app.database import get_db
from app.models import User, ExportRecord, RepairOrder
from app.schemas import ExportRequest, ExportRecordResponse
from app.utils.permissions import get_current_user
from app.tasks import generate_export
from app.config import settings

router = APIRouter(prefix="/api/export", tags=["export"])


def _get_user_from_token(token: str, db: Session) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def _get_user_by_request(request: Request, token: str | None, db: Session) -> User:
    if token:
        return _get_user_from_token(token, db)

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header[7:]
        return _get_user_from_token(token_str, db)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _do_generate_export(db: Session, record: ExportRecord, filter_params: dict):
    import os
    from app.utils.export_utils import generate_excel
    from app.models import User as UserModel

    operator = db.query(UserModel).filter(UserModel.id == record.operator_id).first()
    operator_name = operator.real_name or operator.username if operator else "Unknown"

    queryset = db.query(RepairOrder)
    if filter_params:
        if filter_params.get("status"):
            queryset = queryset.filter(RepairOrder.status == filter_params["status"])
        if filter_params.get("category"):
            queryset = queryset.filter(RepairOrder.category == filter_params["category"])
        if filter_params.get("student_id"):
            queryset = queryset.filter(RepairOrder.student_id == filter_params["student_id"])

    columns = ["id", "title", "category", "status", "urgency", "dorm_room", "created_at", "updated_at"]
    filename = f"export_{record.export_type}_{record.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xlsx"

    os.makedirs(settings.EXPORT_DIR, exist_ok=True)
    file_path = os.path.join(settings.EXPORT_DIR, filename)

    generate_excel(queryset.all(), columns, filter_params, operator_name, file_path, db)

    record.file_path = file_path
    record.generated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


@router.post("/", response_model=ExportRecordResponse, status_code=status.HTTP_201_CREATED)
async def trigger_export(
    export_req: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = ExportRecord(
        operator_id=current_user.id,
        export_type=export_req.export_type,
        filter_params=export_req.filter_params,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        celery_result = generate_export.delay(export_id=record.id, filter_params=export_req.filter_params or {})
    except Exception:
        try:
            _do_generate_export(db, record, export_req.filter_params or {})
        except Exception as e:
            pass

    return record


@router.post("/sync", response_model=ExportRecordResponse, status_code=status.HTTP_201_CREATED)
async def trigger_export_sync(
    export_req: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = ExportRecord(
        operator_id=current_user.id,
        export_type=export_req.export_type,
        filter_params=export_req.filter_params,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        _do_generate_export(db, record, export_req.filter_params or {})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Export failed: {str(e)}")

    return record


@router.get("/{export_id}", response_model=ExportRecordResponse)
async def get_export_status(
    export_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = db.query(ExportRecord).filter(ExportRecord.id == export_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export record not found")

    return record


@router.get("/{export_id}/download")
async def download_export(
    export_id: int,
    request: Request,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    current_user = _get_user_by_request(request, token, db)

    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = db.query(ExportRecord).filter(ExportRecord.id == export_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export record not found")

    if not record.file_path or not os.path.exists(record.file_path):
        try:
            _do_generate_export(db, record, record.filter_params or {})
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Export file not found and regeneration failed: {str(e)}")

        if not record.file_path or not os.path.exists(record.file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export file not found")

    filename = os.path.basename(record.file_path)
    return FileResponse(
        path=record.file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/", response_model=list[ExportRecordResponse])
async def list_exports(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    return db.query(ExportRecord).order_by(ExportRecord.created_at.desc()).offset(skip).limit(limit).all()
