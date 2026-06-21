from datetime import datetime, timedelta, date
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet, PetPhoto, HealthRecord
from app.models.customer import Customer
from app.schemas.pet import (
    PetCreate,
    PetUpdate,
    PetPhotoCreate,
    PetPhotoUpdate,
    HealthRecordCreate,
    HealthRecordUpdate,
)


class PetService:
    @staticmethod
    async def get_by_id(db: AsyncSession, pet_id: int) -> Optional[Pet]:
        result = await db.execute(select(Pet).where(Pet.id == pet_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, pet_in: PetCreate) -> Pet:
        pet = Pet(**pet_in.model_dump())
        db.add(pet)
        await db.commit()
        await db.refresh(pet)
        return pet

    @staticmethod
    async def update(db: AsyncSession, db_pet: Pet, pet_in: PetUpdate) -> Pet:
        update_data = pet_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_pet, field, value)
        await db.commit()
        await db.refresh(db_pet)
        return db_pet

    @staticmethod
    async def delete(db: AsyncSession, pet_id: int) -> bool:
        result = await db.execute(select(Pet).where(Pet.id == pet_id))
        pet = result.scalar_one_or_none()
        if pet:
            await db.delete(pet)
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        customer_id: Optional[int] = None,
        species: Optional[str] = None,
        name: Optional[str] = None,
    ) -> tuple[int, List[Pet]]:
        query = select(Pet)
        if customer_id:
            query = query.where(Pet.customer_id == customer_id)
        if species:
            query = query.where(Pet.species == species)
        if name:
            query = query.where(Pet.name.ilike(f"%{name}%"))

        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(Pet.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        pets = result.scalars().all()
        return total, pets

    @staticmethod
    async def add_photo(db: AsyncSession, photo_in: PetPhotoCreate) -> PetPhoto:
        photo = PetPhoto(**photo_in.model_dump())
        if not photo.taken_at:
            photo.taken_at = datetime.utcnow()
        db.add(photo)
        await db.commit()
        await db.refresh(photo)
        return photo

    @staticmethod
    async def get_photos_by_pet_id(db: AsyncSession, pet_id: int) -> List[PetPhoto]:
        result = await db.execute(
            select(PetPhoto).where(PetPhoto.pet_id == pet_id).order_by(PetPhoto.taken_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update_photo(db: AsyncSession, db_photo: PetPhoto, photo_in: PetPhotoUpdate) -> PetPhoto:
        update_data = photo_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_photo, field, value)
        await db.commit()
        await db.refresh(db_photo)
        return db_photo

    @staticmethod
    async def delete_photo(db: AsyncSession, photo_id: int) -> bool:
        result = await db.execute(select(PetPhoto).where(PetPhoto.id == photo_id))
        photo = result.scalar_one_or_none()
        if photo:
            await db.delete(photo)
            await db.commit()
            return True
        return False

    @staticmethod
    async def add_health_record(db: AsyncSession, record_in: HealthRecordCreate) -> HealthRecord:
        record = HealthRecord(**record_in.model_dump())
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_health_records_by_pet_id(
        db: AsyncSession, pet_id: int, record_type: Optional[str] = None
    ) -> List[HealthRecord]:
        query = select(HealthRecord).where(HealthRecord.pet_id == pet_id)
        if record_type:
            query = query.where(HealthRecord.record_type == record_type)
        query = query.order_by(HealthRecord.record_date.desc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_health_record_by_id(db: AsyncSession, record_id: int) -> Optional[HealthRecord]:
        result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_health_record(
        db: AsyncSession, db_record: HealthRecord, record_in: HealthRecordUpdate
    ) -> HealthRecord:
        update_data = record_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_record, field, value)
        await db.commit()
        await db.refresh(db_record)
        return db_record

    @staticmethod
    async def delete_health_record(db: AsyncSession, record_id: int) -> bool:
        result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id))
        record = result.scalar_one_or_none()
        if record:
            await db.delete(record)
            await db.commit()
            return True
        return False

    @staticmethod
    def generate_mock_pets(count: int = 15) -> List[dict]:
        species_list = ["dog", "cat", "rabbit", "hamster"]
        breed_map = {
            "dog": ["金毛", "拉布拉多", "泰迪", "哈士奇", "柯基"],
            "cat": ["英短", "美短", "布偶", "橘猫", "暹罗"],
            "rabbit": ["垂耳兔", "荷兰兔", "侏儒兔"],
            "hamster": ["金丝熊", "三线", "布丁"],
        }
        genders = ["male", "female"]
        mock_pets = []
        now = datetime.now()
        for i in range(1, count + 1):
            species = species_list[i % len(species_list)]
            breeds = breed_map[species]
            breed = breeds[i % len(breeds)]
            birthday = date(2020 + (i % 4), 1 + (i % 12), 1 + (i % 28))
            mock_pets.append({
                "id": i,
                "name": f"{species}{i}号",
                "species": species,
                "breed": breed,
                "gender": genders[i % 2],
                "birthday": birthday.isoformat(),
                "weight": round(2.0 + (i % 10) * 1.5, 1),
                "avatar": f"/uploads/pets/avatar_{i}.jpg",
                "health_status": "健康" if i % 3 != 0 else "需要关注",
                "allergy_info": "无" if i % 4 != 0 else "对某些食物过敏",
                "customer_id": (i % 10) + 1,
                "customer_name": f"客户{(i % 10) + 1}",
                "created_at": (now - timedelta(days=i * 10)).isoformat(),
                "updated_at": (now - timedelta(days=i * 5)).isoformat(),
            })
        return mock_pets

    @staticmethod
    def generate_mock_photos(pet_id: int, count: int = 5) -> List[dict]:
        now = datetime.now()
        photos = []
        for i in range(1, count + 1):
            photos.append({
                "id": pet_id * 100 + i,
                "pet_id": pet_id,
                "order_id": (pet_id + i) % 3 if (pet_id + i) % 3 != 0 else None,
                "url": f"/uploads/pets/{pet_id}/photo_{i}.jpg",
                "description": f"照片描述-{i}",
                "taken_at": (now - timedelta(days=i)).isoformat(),
                "uploaded_by": 1,
                "created_at": (now - timedelta(days=i)).isoformat(),
                "updated_at": (now - timedelta(days=i)).isoformat(),
            })
        return photos

    @staticmethod
    def generate_mock_health_records(pet_id: int, count: int = 4) -> List[dict]:
        record_types = ["vaccine", "deworming", "checkup", "treatment"]
        type_names = {
            "vaccine": "疫苗接种",
            "deworming": "驱虫",
            "checkup": "体检",
            "treatment": "治疗",
        }
        now = datetime.now()
        records = []
        for i in range(1, count + 1):
            rtype = record_types[i % len(record_types)]
            records.append({
                "id": pet_id * 1000 + i,
                "pet_id": pet_id,
                "record_type": rtype,
                "title": f"{type_names[rtype]}记录-{i}",
                "description": f"{type_names[rtype]}详细描述信息-{i}",
                "record_date": (date.today() - timedelta(days=i * 30)).isoformat(),
                "created_at": (now - timedelta(days=i * 30)).isoformat(),
                "updated_at": (now - timedelta(days=i * 30)).isoformat(),
            })
        return records
