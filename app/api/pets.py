from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, is_test_user
from app.models.models import Pet, User, UserRole
from app.schemas.schemas import PetCreate, PetUpdate, PetResponse

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("", response_model=List[PetResponse])
async def list_pets(
    skip: int = 0,
    limit: int = 100,
    owner_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Pet).where(Pet.is_active == True)

    if current_user.role == UserRole.CUSTOMER:
        query = query.where(Pet.owner_id == current_user.id)
    elif owner_id is not None:
        query = query.where(Pet.owner_id == owner_id)

    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    pet_in: PetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    owner_id = current_user.id if current_user.role == UserRole.CUSTOMER else current_user.id
    pet = Pet(
        **pet_in.model_dump(),
        owner_id=owner_id,
    )
    db.add(pet)
    await db.commit()
    await db.refresh(pet)
    return pet


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if current_user.role == UserRole.CUSTOMER and pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this pet")

    return pet


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    pet_in: PetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if current_user.role == UserRole.CUSTOMER and pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this pet")

    update_data = pet_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pet, field, value)

    await db.commit()
    await db.refresh(pet)
    return pet


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if current_user.role == UserRole.CUSTOMER and pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this pet")

    pet.is_active = False
    await db.commit()
    return {"message": "Pet deleted successfully"}
