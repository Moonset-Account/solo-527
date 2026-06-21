from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.adoption import AdoptionApplication
from app.models.pet import Pet
from app.schemas.adoption import (
    AdoptionApplicationCreate,
    AdoptionApplicationUpdate,
    AdoptionReviewRequest,
)


class AdoptionService:
    @staticmethod
    async def get_by_id(db: AsyncSession, application_id: int) -> Optional[AdoptionApplication]:
        result = await db.execute(select(AdoptionApplication).where(AdoptionApplication.id == application_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, app_in: AdoptionApplicationCreate) -> AdoptionApplication:
        application = AdoptionApplication(**app_in.model_dump(), status="pending")
        db.add(application)
        await db.commit()
        await db.refresh(application)
        return application

    @staticmethod
    async def update(
        db: AsyncSession, db_application: AdoptionApplication, app_in: AdoptionApplicationUpdate
    ) -> AdoptionApplication:
        update_data = app_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_application, field, value)
        await db.commit()
        await db.refresh(db_application)
        return db_application

    @staticmethod
    async def delete(db: AsyncSession, application_id: int) -> bool:
        result = await db.execute(select(AdoptionApplication).where(AdoptionApplication.id == application_id))
        application = result.scalar_one_or_none()
        if application:
            await db.delete(application)
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        pet_id: Optional[int] = None,
        applicant_phone: Optional[str] = None,
    ) -> tuple[int, List[AdoptionApplication]]:
        query = select(AdoptionApplication)
        if status:
            query = query.where(AdoptionApplication.status == status)
        if pet_id:
            query = query.where(AdoptionApplication.pet_id == pet_id)
        if applicant_phone:
            query = query.where(AdoptionApplication.applicant_phone.ilike(f"%{applicant_phone}%"))

        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(AdoptionApplication.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        applications = result.scalars().all()
        return total, applications

    @staticmethod
    async def review(
        db: AsyncSession,
        review_in: AdoptionReviewRequest,
        reviewer_id: int,
    ) -> Optional[AdoptionApplication]:
        valid_actions = {
            "approve": "approved",
            "reject": "rejected",
            "pending": "pending",
        }
        if review_in.action not in valid_actions:
            raise ValueError(f"无效的审核操作: {review_in.action}")

        result = await db.execute(
            select(AdoptionApplication).where(AdoptionApplication.id == review_in.application_id)
        )
        application = result.scalar_one_or_none()
        if not application:
            return None

        if application.status != "pending":
            raise ValueError("只能审核待处理状态的申请")

        application.status = valid_actions[review_in.action]
        application.review_remark = review_in.remark
        application.reviewed_by = reviewer_id
        application.reviewed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(application)
        return application

    @staticmethod
    def generate_mock_applications(count: int = 12) -> List[dict]:
        statuses = ["pending", "approved", "rejected"]
        housing_types = ["公寓", "别墅", "平房", "合租"]
        pet_experiences = ["有多年养宠经验", "有过养宠经验", "首次养宠"]
        now = datetime.now()
        mock_apps = []
        for i in range(1, count + 1):
            mock_apps.append({
                "id": i,
                "applicant_name": f"申请人{i}",
                "applicant_phone": f"139{20000000 + i:08d}",
                "applicant_id_card": f"1101011990{i:08d}" if i % 3 != 0 else None,
                "address": f"北京市朝阳区某街道{i}号",
                "housing_type": housing_types[i % len(housing_types)],
                "pet_experience": pet_experiences[i % len(pet_experiences)],
                "family_members": 2 + (i % 4),
                "has_other_pets": i % 2 == 0,
                "pet_id": (i % 5) + 1,
                "pet_name": f"宠物{(i % 5) + 1}",
                "apply_reason": f"申请领养原因详细描述-{i}，我非常喜欢小动物，会好好照顾它的。",
                "status": statuses[i % len(statuses)],
                "review_remark": f"审核意见-{i}" if i % 3 != 0 else None,
                "reviewed_by": 1 if i % 3 != 0 else None,
                "reviewed_at": (now - timedelta(days=i)).isoformat() if i % 3 != 0 else None,
                "created_at": (now - timedelta(days=i + 5)).isoformat(),
                "updated_at": (now - timedelta(days=i)).isoformat(),
            })
        return mock_apps
