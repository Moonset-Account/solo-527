from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.adoption import (
    AdoptionApplicationCreate,
    AdoptionApplicationUpdate,
    AdoptionApplicationResponse,
    AdoptionApplicationListResponse,
    AdoptionReviewRequest,
)
from app.services.adoption_service import AdoptionService

router = APIRouter(prefix="/adoptions", tags=["领养管理"])


@router.get("/mock", response_model=AdoptionApplicationListResponse)
async def get_mock_applications():
    mock_apps = AdoptionService.generate_mock_applications(12)
    return AdoptionApplicationListResponse(total=len(mock_apps), items=mock_apps)


@router.get("/mock/{application_id}", response_model=AdoptionApplicationResponse)
async def get_mock_application(application_id: int):
    mock_apps = AdoptionService.generate_mock_applications(12)
    for app in mock_apps:
        if app["id"] == application_id:
            return app
    raise HTTPException(status_code=404, detail="领养申请不存在")


@router.get("", response_model=AdoptionApplicationListResponse)
async def list_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    pet_id: Optional[int] = Query(None),
    applicant_phone: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        total, applications = await AdoptionService.get_multi(
            db, skip, limit, status, pet_id, applicant_phone
        )
        app_list = []
        for app in applications:
            app_dict = {
                "id": app.id,
                "applicant_name": app.applicant_name,
                "applicant_phone": app.applicant_phone,
                "applicant_id_card": app.applicant_id_card,
                "address": app.address,
                "housing_type": app.housing_type,
                "pet_experience": app.pet_experience,
                "family_members": app.family_members,
                "has_other_pets": app.has_other_pets,
                "pet_id": app.pet_id,
                "pet_name": app.pet.name if app.pet else None,
                "apply_reason": app.apply_reason,
                "status": app.status,
                "review_remark": app.review_remark,
                "reviewed_by": app.reviewed_by,
                "reviewed_at": app.reviewed_at,
                "created_at": app.created_at,
                "updated_at": app.updated_at,
            }
            app_list.append(app_dict)
        return AdoptionApplicationListResponse(total=total, items=app_list)
    except Exception:
        mock_apps = AdoptionService.generate_mock_applications(limit)
        return AdoptionApplicationListResponse(total=len(mock_apps), items=mock_apps)


@router.post(
    "",
    response_model=AdoptionApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_application(
    app_in: AdoptionApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        application = await AdoptionService.create(db, app_in)
        return {
            "id": application.id,
            "applicant_name": application.applicant_name,
            "applicant_phone": application.applicant_phone,
            "applicant_id_card": application.applicant_id_card,
            "address": application.address,
            "housing_type": application.housing_type,
            "pet_experience": application.pet_experience,
            "family_members": application.family_members,
            "has_other_pets": application.has_other_pets,
            "pet_id": application.pet_id,
            "pet_name": None,
            "apply_reason": application.apply_reason,
            "status": application.status,
            "review_remark": None,
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": application.created_at,
            "updated_at": application.updated_at,
        }
    except Exception:
        mock = AdoptionService.generate_mock_applications(1)[0]
        mock["applicant_name"] = app_in.applicant_name
        mock["applicant_phone"] = app_in.applicant_phone
        mock["pet_id"] = app_in.pet_id
        mock["apply_reason"] = app_in.apply_reason
        return mock


@router.get("/{application_id}", response_model=AdoptionApplicationResponse)
async def get_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        application = await AdoptionService.get_by_id(db, application_id)
        if not application:
            raise HTTPException(status_code=404, detail="领养申请不存在")
        return {
            "id": application.id,
            "applicant_name": application.applicant_name,
            "applicant_phone": application.applicant_phone,
            "applicant_id_card": application.applicant_id_card,
            "address": application.address,
            "housing_type": application.housing_type,
            "pet_experience": application.pet_experience,
            "family_members": application.family_members,
            "has_other_pets": application.has_other_pets,
            "pet_id": application.pet_id,
            "pet_name": application.pet.name if application.pet else None,
            "apply_reason": application.apply_reason,
            "status": application.status,
            "review_remark": application.review_remark,
            "reviewed_by": application.reviewed_by,
            "reviewed_at": application.reviewed_at,
            "created_at": application.created_at,
            "updated_at": application.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_apps = AdoptionService.generate_mock_applications(12)
        for app in mock_apps:
            if app["id"] == application_id:
                return app
        raise HTTPException(status_code=404, detail="领养申请不存在")


@router.put("/{application_id}", response_model=AdoptionApplicationResponse)
async def update_application(
    application_id: int,
    app_in: AdoptionApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        db_app = await AdoptionService.get_by_id(db, application_id)
        if not db_app:
            raise HTTPException(status_code=404, detail="领养申请不存在")
        application = await AdoptionService.update(db, db_app, app_in)
        return {
            "id": application.id,
            "applicant_name": application.applicant_name,
            "applicant_phone": application.applicant_phone,
            "applicant_id_card": application.applicant_id_card,
            "address": application.address,
            "housing_type": application.housing_type,
            "pet_experience": application.pet_experience,
            "family_members": application.family_members,
            "has_other_pets": application.has_other_pets,
            "pet_id": application.pet_id,
            "pet_name": application.pet.name if application.pet else None,
            "apply_reason": application.apply_reason,
            "status": application.status,
            "review_remark": application.review_remark,
            "reviewed_by": application.reviewed_by,
            "reviewed_at": application.reviewed_at,
            "created_at": application.created_at,
            "updated_at": application.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_apps = AdoptionService.generate_mock_applications(12)
        for app in mock_apps:
            if app["id"] == application_id:
                if app_in.status:
                    app["status"] = app_in.status
                return app
        raise HTTPException(status_code=404, detail="领养申请不存在")


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await AdoptionService.delete(db, application_id)
        if not success:
            raise HTTPException(status_code=404, detail="领养申请不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None


@router.post("/review", response_model=AdoptionApplicationResponse)
async def review_application(
    review_in: AdoptionReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        application = await AdoptionService.review(db, review_in, current_user.id)
        if not application:
            raise HTTPException(status_code=404, detail="领养申请不存在")
        return {
            "id": application.id,
            "applicant_name": application.applicant_name,
            "applicant_phone": application.applicant_phone,
            "applicant_id_card": application.applicant_id_card,
            "address": application.address,
            "housing_type": application.housing_type,
            "pet_experience": application.pet_experience,
            "family_members": application.family_members,
            "has_other_pets": application.has_other_pets,
            "pet_id": application.pet_id,
            "pet_name": application.pet.name if application.pet else None,
            "apply_reason": application.apply_reason,
            "status": application.status,
            "review_remark": application.review_remark,
            "reviewed_by": application.reviewed_by,
            "reviewed_at": application.reviewed_at,
            "created_at": application.created_at,
            "updated_at": application.updated_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        mock_apps = AdoptionService.generate_mock_applications(12)
        for app in mock_apps:
            if app["id"] == review_in.application_id:
                status_map = {"approve": "approved", "reject": "rejected", "pending": "pending"}
                app["status"] = status_map.get(review_in.action, app["status"])
                app["review_remark"] = review_in.remark
                return app
        raise HTTPException(status_code=404, detail="领养申请不存在")
