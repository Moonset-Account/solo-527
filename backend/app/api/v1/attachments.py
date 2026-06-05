from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models
from ...services import storage_service, logger

router = APIRouter()

allow_admin_member = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER])


@router.post("/pre-upload", response_model=schemas.Attachment, dependencies=[Depends(allow_admin_member)])
async def pre_upload_attachment(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    file_data = await file.read()
    file_obj = io.BytesIO(file_data)
    
    object_name = storage_service.upload_file(
        file_obj,
        file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(file_data)
    )
    
    if not object_name:
        raise HTTPException(status_code=500, detail="文件上传失败")
    
    attachment_in = schemas.AttachmentCreate(
        file_name=object_name,
        original_name=file.filename,
        file_path=object_name,
        file_size=len(file_data),
        mime_type=file.content_type,
        related_type=models.AttachmentType.REAGENT_BATCH,
        related_id=0
    )
    
    attachment = crud.attachment.create(db, obj_in=attachment_in, created_by=current_user.id)
    
    logger.info(f"用户 {current_user.username} 预上传了附件: {file.filename}")
    return attachment


@router.post("/upload", response_model=schemas.Attachment, dependencies=[Depends(allow_admin_member)])
async def upload_attachment(
    request: Request,
    related_type: models.AttachmentType,
    related_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    file_data = await file.read()
    file_obj = io.BytesIO(file_data)
    
    object_name = storage_service.upload_file(
        file_obj,
        file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(file_data)
    )
    
    if not object_name:
        raise HTTPException(status_code=500, detail="文件上传失败")
    
    attachment_in = schemas.AttachmentCreate(
        file_name=object_name,
        original_name=file.filename,
        file_path=object_name,
        file_size=len(file_data),
        mime_type=file.content_type,
        related_type=related_type,
        related_id=related_id
    )
    
    attachment = crud.attachment.create(db, obj_in=attachment_in, created_by=current_user.id)
    
    logger.info(f"用户 {current_user.username} 上传了附件: {file.filename}")
    return attachment


@router.get("/stream/{file_name}")
def stream_local_file(file_name: str, db: Session = Depends(get_db)):
    object_name = f"local://{file_name}"
    file_data = storage_service.download_file(object_name)
    if not file_data:
        raise HTTPException(status_code=404, detail="文件不存在")
    return StreamingResponse(io.BytesIO(file_data), media_type="application/octet-stream")


@router.get("/{attachment_id}")
def get_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    attachment = crud.attachment.get(db, id=attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    file_data = storage_service.download_file(attachment.file_path)
    if not file_data:
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=attachment.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{attachment.original_name}"
        }
    )


@router.get("/related/{related_type}/{related_id}", response_model=List[schemas.Attachment])
def get_related_attachments(
    related_type: models.AttachmentType,
    related_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.attachment.get_by_related(db, related_type=related_type, related_id=related_id)


@router.delete("/{attachment_id}", dependencies=[Depends(allow_admin_member)])
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    attachment = crud.attachment.get(db, id=attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    storage_service.delete_file(attachment.file_path)
    crud.attachment.remove(db, id=attachment_id)
    
    return {"message": "附件已删除"}
