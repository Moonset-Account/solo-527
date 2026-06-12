import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
from app.config import settings
from app.database import get_db
from app.models import (
    User, RepairOrder, Attachment, OperationHistory,
    NotificationReceipt, ClubActivity, SecondHandTrade, SeatViolation,
)
from app.schemas import (
    RepairOrderCreate, RepairOrderUpdate, RepairOrderResponse,
    NotificationReceiptResponse, ClubActivityResponse, SecondHandTradeResponse,
    SeatViolationResponse,
)
from app.utils.permissions import get_current_user

router = APIRouter(prefix="/api/repairs", tags=["repairs"])


@router.get("/notifications", response_model=list[NotificationReceiptResponse])
def list_my_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(NotificationReceipt).filter(
        NotificationReceipt.user_id == current_user.id
    ).order_by(NotificationReceipt.sent_at.desc()).offset(skip).limit(limit).all()


@router.get("/activities", response_model=list[ClubActivityResponse])
def list_activities(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ClubActivity).order_by(ClubActivity.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/trades", response_model=list[SecondHandTradeResponse])
def list_trades(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(SecondHandTrade).order_by(SecondHandTrade.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/seat-violations", response_model=list[SeatViolationResponse])
def list_my_seat_violations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(SeatViolation).filter(
        SeatViolation.student_id == current_user.id
    ).order_by(SeatViolation.created_at.desc()).all()


@router.post("/", response_model=RepairOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_repair(
    title: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    dorm_room: Optional[str] = Form(None),
    urgency: Optional[str] = Form("medium"),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = RepairOrder(
        title=title,
        description=description,
        category=category,
        location=location,
        dorm_room=dorm_room or current_user.dorm_room,
        urgency=urgency,
        student_id=current_user.id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    if files:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        for file in files:
            if file.filename:
                file_ext = os.path.splitext(file.filename)[1]
                file_name = f"{uuid.uuid4().hex}{file_ext}"
                file_path = os.path.join(settings.UPLOAD_DIR, file_name)
                content = await file.read()
                with open(file_path, "wb") as f:
                    f.write(content)
                attachment = Attachment(
                    order_id=order.id,
                    file_path=file_path,
                    file_name=file.filename,
                    file_type=file.content_type,
                    file_size=len(content),
                )
                db.add(attachment)
        db.commit()
        db.refresh(order)

    return order


@router.get("/", response_model=list[RepairOrderResponse])
def list_repairs(
    status: Optional[str] = None,
    category: Optional[str] = None,
    student_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(RepairOrder)
    if current_user.role == "student":
        query = query.filter(RepairOrder.student_id == current_user.id)
    if status:
        query = query.filter(RepairOrder.status == status)
    if category:
        query = query.filter(RepairOrder.category == category)
    if student_id:
        query = query.filter(RepairOrder.student_id == student_id)
    return query.order_by(RepairOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=RepairOrderResponse)
def get_repair(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this order")
    return order


@router.put("/{order_id}", response_model=RepairOrderResponse)
def update_repair(
    order_id: int,
    order_update: RepairOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair order not found")

    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this order")

    update_data = order_update.model_dump(exclude_unset=True)
    for field, new_value in update_data.items():
        old_value = getattr(order, field)
        if old_value != new_value:
            history = OperationHistory(
                order_id=order.id,
                operator_id=current_user.id,
                field_name=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(new_value) if new_value is not None else None,
            )
            db.add(history)
        setattr(order, field, new_value)

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/upload", response_model=RepairOrderResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    order_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(RepairOrder).filter(RepairOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair order not found")

    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload to this order")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    for file in files:
        if file.filename:
            file_ext = os.path.splitext(file.filename)[1]
            file_name = f"{uuid.uuid4().hex}{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, file_name)
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            attachment = Attachment(
                order_id=order.id,
                file_path=file_path,
                file_name=file.filename,
                file_type=file.content_type,
                file_size=len(content),
            )
            db.add(attachment)
    db.commit()
    db.refresh(order)
    return order
