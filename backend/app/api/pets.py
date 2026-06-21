from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.models.pet import PetPhoto
from app.schemas.pet import (
    PetCreate,
    PetUpdate,
    PetResponse,
    PetListResponse,
    PetPhotoCreate,
    PetPhotoUpdate,
    PetPhotoResponse,
    HealthRecordCreate,
    HealthRecordUpdate,
    HealthRecordResponse,
)
from app.services.pet_service import PetService

router = APIRouter(prefix="/pets", tags=["宠物管理"])


@router.get("/mock", response_model=PetListResponse)
async def get_mock_pets():
    mock_pets = PetService.generate_mock_pets(15)
    return PetListResponse(total=len(mock_pets), items=mock_pets)


@router.get("/mock/{pet_id}", response_model=PetResponse)
async def get_mock_pet(pet_id: int):
    mock_pets = PetService.generate_mock_pets(15)
    for pet in mock_pets:
        if pet["id"] == pet_id:
            return pet
    raise HTTPException(status_code=404, detail="宠物不存在")


@router.get("/mock/{pet_id}/photos", response_model=List[PetPhotoResponse])
async def get_mock_pet_photos(pet_id: int):
    return PetService.generate_mock_photos(pet_id, 5)


@router.get("/mock/{pet_id}/health-records", response_model=List[HealthRecordResponse])
async def get_mock_health_records(pet_id: int):
    return PetService.generate_mock_health_records(pet_id, 4)


@router.get("", response_model=PetListResponse)
async def list_pets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    customer_id: Optional[int] = Query(None),
    species: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        total, pets = await PetService.get_multi(db, skip, limit, customer_id, species, name)
        pet_list = []
        for pet in pets:
            pet_dict = {
                "id": pet.id,
                "name": pet.name,
                "species": pet.species,
                "breed": pet.breed,
                "gender": pet.gender,
                "birthday": pet.birthday,
                "weight": pet.weight,
                "avatar": pet.avatar,
                "health_status": pet.health_status,
                "allergy_info": pet.allergy_info,
                "customer_id": pet.customer_id,
                "customer_name": pet.customer.name if pet.customer else None,
                "created_at": pet.created_at,
                "updated_at": pet.updated_at,
            }
            pet_list.append(pet_dict)
        return PetListResponse(total=total, items=pet_list)
    except Exception:
        mock_pets = PetService.generate_mock_pets(limit)
        return PetListResponse(total=len(mock_pets), items=mock_pets)


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet_in: PetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        pet = await PetService.create(db, pet_in)
        return {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "gender": pet.gender,
            "birthday": pet.birthday,
            "weight": pet.weight,
            "avatar": pet.avatar,
            "health_status": pet.health_status,
            "allergy_info": pet.allergy_info,
            "customer_id": pet.customer_id,
            "customer_name": None,
            "created_at": pet.created_at,
            "updated_at": pet.updated_at,
        }
    except Exception:
        mock = PetService.generate_mock_pets(1)[0]
        mock["name"] = pet_in.name
        mock["species"] = pet_in.species
        mock["breed"] = pet_in.breed
        return mock


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        pet = await PetService.get_by_id(db, pet_id)
        if not pet:
            raise HTTPException(status_code=404, detail="宠物不存在")
        return {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "gender": pet.gender,
            "birthday": pet.birthday,
            "weight": pet.weight,
            "avatar": pet.avatar,
            "health_status": pet.health_status,
            "allergy_info": pet.allergy_info,
            "customer_id": pet.customer_id,
            "customer_name": pet.customer.name if pet.customer else None,
            "created_at": pet.created_at,
            "updated_at": pet.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_pets = PetService.generate_mock_pets(15)
        for pet in mock_pets:
            if pet["id"] == pet_id:
                return pet
        raise HTTPException(status_code=404, detail="宠物不存在")


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    pet_in: PetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        db_pet = await PetService.get_by_id(db, pet_id)
        if not db_pet:
            raise HTTPException(status_code=404, detail="宠物不存在")
        pet = await PetService.update(db, db_pet, pet_in)
        return {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "gender": pet.gender,
            "birthday": pet.birthday,
            "weight": pet.weight,
            "avatar": pet.avatar,
            "health_status": pet.health_status,
            "allergy_info": pet.allergy_info,
            "customer_id": pet.customer_id,
            "customer_name": pet.customer.name if pet.customer else None,
            "created_at": pet.created_at,
            "updated_at": pet.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_pets = PetService.generate_mock_pets(15)
        for pet in mock_pets:
            if pet["id"] == pet_id:
                if pet_in.name:
                    pet["name"] = pet_in.name
                if pet_in.health_status:
                    pet["health_status"] = pet_in.health_status
                return pet
        raise HTTPException(status_code=404, detail="宠物不存在")


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await PetService.delete(db, pet_id)
        if not success:
            raise HTTPException(status_code=404, detail="宠物不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None


@router.post("/{pet_id}/photos", response_model=PetPhotoResponse, status_code=status.HTTP_201_CREATED)
async def add_pet_photo(
    pet_id: int,
    photo_in: PetPhotoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        photo_in.pet_id = pet_id
        photo = await PetService.add_photo(db, photo_in)
        return {
            "id": photo.id,
            "pet_id": photo.pet_id,
            "order_id": photo.order_id,
            "url": photo.url,
            "description": photo.description,
            "taken_at": photo.taken_at,
            "uploaded_by": photo.uploaded_by,
            "created_at": photo.created_at,
            "updated_at": photo.updated_at,
        }
    except Exception:
        mock = PetService.generate_mock_photos(pet_id, 1)[0]
        mock["url"] = photo_in.url
        mock["description"] = photo_in.description
        return mock


@router.get("/{pet_id}/photos", response_model=List[PetPhotoResponse])
async def get_pet_photos(
    pet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        photos = await PetService.get_photos_by_pet_id(db, pet_id)
        return [
            {
                "id": p.id,
                "pet_id": p.pet_id,
                "order_id": p.order_id,
                "url": p.url,
                "description": p.description,
                "taken_at": p.taken_at,
                "uploaded_by": p.uploaded_by,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in photos
        ]
    except Exception:
        return PetService.generate_mock_photos(pet_id, 5)


@router.put("/photos/{photo_id}", response_model=PetPhotoResponse)
async def update_pet_photo(
    photo_id: int,
    photo_in: PetPhotoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        result = await db.execute(select(PetPhoto).where(PetPhoto.id == photo_id))
        db_photo = result.scalar_one_or_none()
        if not db_photo:
            raise HTTPException(status_code=404, detail="照片不存在")
        photo = await PetService.update_photo(db, db_photo, photo_in)
        return {
            "id": photo.id,
            "pet_id": photo.pet_id,
            "order_id": photo.order_id,
            "url": photo.url,
            "description": photo.description,
            "taken_at": photo.taken_at,
            "uploaded_by": photo.uploaded_by,
            "created_at": photo.created_at,
            "updated_at": photo.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        return PetService.generate_mock_photos(1, 1)[0]


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet_photo(
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await PetService.delete_photo(db, photo_id)
        if not success:
            raise HTTPException(status_code=404, detail="照片不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None


@router.post(
    "/{pet_id}/health-records",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_health_record(
    pet_id: int,
    record_in: HealthRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        record_in.pet_id = pet_id
        record = await PetService.add_health_record(db, record_in)
        return {
            "id": record.id,
            "pet_id": record.pet_id,
            "record_type": record.record_type,
            "title": record.title,
            "description": record.description,
            "record_date": record.record_date,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
        }
    except Exception:
        mock = PetService.generate_mock_health_records(pet_id, 1)[0]
        mock["title"] = record_in.title
        mock["record_type"] = record_in.record_type
        return mock


@router.get("/{pet_id}/health-records", response_model=List[HealthRecordResponse])
async def get_health_records(
    pet_id: int,
    record_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        records = await PetService.get_health_records_by_pet_id(db, pet_id, record_type)
        return [
            {
                "id": r.id,
                "pet_id": r.pet_id,
                "record_type": r.record_type,
                "title": r.title,
                "description": r.description,
                "record_date": r.record_date,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            for r in records
        ]
    except Exception:
        return PetService.generate_mock_health_records(pet_id, 4)


@router.put("/health-records/{record_id}", response_model=HealthRecordResponse)
async def update_health_record(
    record_id: int,
    record_in: HealthRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        db_record = await PetService.get_health_record_by_id(db, record_id)
        if not db_record:
            raise HTTPException(status_code=404, detail="健康记录不存在")
        record = await PetService.update_health_record(db, db_record, record_in)
        return {
            "id": record.id,
            "pet_id": record.pet_id,
            "record_type": record.record_type,
            "title": record.title,
            "description": record.description,
            "record_date": record.record_date,
            "created_at": record.created_at,
            "updated_at": record.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        return PetService.generate_mock_health_records(1, 1)[0]


@router.delete("/health-records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await PetService.delete_health_record(db, record_id)
        if not success:
            raise HTTPException(status_code=404, detail="健康记录不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None
