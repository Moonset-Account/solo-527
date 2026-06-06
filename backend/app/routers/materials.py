from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import (
    Material, MaterialUsage, User, UserRole,
    CleaningTask, MaintenanceOrder, Attachment, AttachmentType, AttachmentPurpose
)
from app.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialResponse,
    MaterialUsageCreate, MaterialUsageResponse, AttachmentResponse
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.storage import storage
from app.core.logging import logger

router = APIRouter(tags=["物料与附件"])


@router.get("/api/materials", response_model=ApiResponse[PaginatedResponse[MaterialResponse]])
def get_materials(
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Material)
    if category:
        query = query.filter(Material.category == category)
    if keyword:
        query = query.filter(Material.name.like(f"%{keyword}%"))

    total = query.count()
    materials = query.order_by(Material.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return ApiResponse(data=PaginatedResponse(
        data=[MaterialResponse.model_validate(m) for m in materials],
        total=total,
        page=page,
        page_size=page_size
    ))


@router.post("/api/materials", response_model=ApiResponse[MaterialResponse])
def create_material(
    material_in: MaterialCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限操作", code=403)

    material = Material(**material_in.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    logger.info(f"Material {material.name} created by {current_user.username}")
    return ApiResponse(data=MaterialResponse.model_validate(material))


@router.post("/api/material-usages", response_model=ApiResponse[MaterialUsageResponse])
def create_material_usage(
    usage_in: MaterialUsageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    material = db.query(Material).filter(Material.id == usage_in.material_id).first()
    if not material:
        raise BusinessException("物料不存在")

    if material.stock_quantity < usage_in.quantity:
        raise BusinessException("库存不足")

    unit_price = material.unit_price
    total_cost = round(unit_price * usage_in.quantity, 2)

    usage = MaterialUsage(
        material_id=usage_in.material_id,
        cleaning_task_id=usage_in.cleaning_task_id,
        maintenance_order_id=usage_in.maintenance_order_id,
        quantity=usage_in.quantity,
        unit_price=unit_price,
        total_cost=total_cost,
        remarks=usage_in.remarks
    )
    material.stock_quantity -= usage_in.quantity

    db.add(usage)
    db.commit()
    db.refresh(usage)

    response = MaterialUsageResponse(
        id=usage.id,
        material_id=usage.material_id,
        material_name=material.name,
        cleaning_task_id=usage.cleaning_task_id,
        maintenance_order_id=usage.maintenance_order_id,
        quantity=usage.quantity,
        unit_price=usage.unit_price,
        total_cost=usage.total_cost,
        remarks=usage.remarks,
        created_at=usage.created_at
    )
    return ApiResponse(data=response)


@router.post("/api/attachments/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    cleaning_task_id: Optional[int] = Form(None),
    maintenance_order_id: Optional[int] = Form(None),
    purpose: AttachmentPurpose = Form(AttachmentPurpose.OTHER),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if cleaning_task_id is None and maintenance_order_id is None:
        raise BusinessException("必须关联保洁任务或维修工单")

    if not file.content_type or not file.content_type.startswith(("image/", "application/")):
        raise BusinessException("不支持的文件类型")

    content = await file.read()
    from io import BytesIO
    file_data = BytesIO(content)

    object_name = storage.upload_file(
        file_data,
        file.filename or "attachment",
        file.content_type or "application/octet-stream"
    )

    attachment_type = AttachmentType.IMAGE
    if file.content_type and file.content_type.startswith("image/"):
        attachment_type = AttachmentType.IMAGE
    elif file.content_type and file.content_type.startswith("video/"):
        attachment_type = AttachmentType.VIDEO
    else:
        attachment_type = AttachmentType.DOCUMENT

    attachment = Attachment(
        cleaning_task_id=cleaning_task_id,
        maintenance_order_id=maintenance_order_id,
        uploaded_by=current_user.id,
        object_name=object_name,
        original_filename=file.filename or "attachment",
        content_type=file.content_type,
        file_size=len(content),
        attachment_type=attachment_type,
        purpose=purpose
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    file_url = storage.get_file_url(object_name)

    response = AttachmentResponse(
        id=attachment.id,
        cleaning_task_id=attachment.cleaning_task_id,
        maintenance_order_id=attachment.maintenance_order_id,
        uploaded_by=attachment.uploaded_by,
        object_name=attachment.object_name,
        original_filename=attachment.original_filename,
        content_type=attachment.content_type,
        file_size=attachment.file_size,
        attachment_type=attachment.attachment_type,
        purpose=attachment.purpose,
        file_url=file_url,
        created_at=attachment.created_at
    )

    return ApiResponse(data=response)


@router.get("/api/attachments/cleaning-task/{task_id}", response_model=ApiResponse[List[AttachmentResponse]])
def get_cleaning_task_attachments(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    attachments = db.query(Attachment).filter(Attachment.cleaning_task_id == task_id).all()
    response = []
    for att in attachments:
        file_url = storage.get_file_url(att.object_name)
        response.append(AttachmentResponse(
            id=att.id,
            cleaning_task_id=att.cleaning_task_id,
            maintenance_order_id=att.maintenance_order_id,
            uploaded_by=att.uploaded_by,
            object_name=att.object_name,
            original_filename=att.original_filename,
            content_type=att.content_type,
            file_size=att.file_size,
            attachment_type=att.attachment_type,
            purpose=att.purpose,
            file_url=file_url,
            created_at=att.created_at
        ))
    return ApiResponse(data=response)


@router.get("/api/attachments/maintenance-order/{order_id}", response_model=ApiResponse[List[AttachmentResponse]])
def get_maintenance_order_attachments(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    attachments = db.query(Attachment).filter(Attachment.maintenance_order_id == order_id).all()
    response = []
    for att in attachments:
        file_url = storage.get_file_url(att.object_name)
        response.append(AttachmentResponse(
            id=att.id,
            cleaning_task_id=att.cleaning_task_id,
            maintenance_order_id=att.maintenance_order_id,
            uploaded_by=att.uploaded_by,
            object_name=att.object_name,
            original_filename=att.original_filename,
            content_type=att.content_type,
            file_size=att.file_size,
            attachment_type=att.attachment_type,
            purpose=att.purpose,
            file_url=file_url,
            created_at=att.created_at
        ))
    return ApiResponse(data=response)
