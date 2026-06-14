import json
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    AcceptanceTemplate,
    BudgetVersion,
    InspectionTemplate,
    ConfigChangeLog,
)
from app.schemas.schemas import (
    AcceptanceTemplateCreate,
    AcceptanceTemplateUpdate,
    BudgetVersionCreate,
    BudgetVersionUpdate,
    InspectionTemplateCreate,
    InspectionTemplateUpdate,
    PaginatedResponse,
)
from app.services.base import model_to_dict


async def _log_change(
    db: AsyncSession,
    user_id: int,
    entity_type: str,
    entity_id: int,
    action: str,
    before_data: Optional[dict] = None,
    after_data: Optional[dict] = None,
    is_demo: bool = False,
) -> ConfigChangeLog:
    log = ConfigChangeLog(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        before_data=before_data,
        after_data=after_data,
        is_demo=is_demo,
    )
    db.add(log)
    await db.flush()
    return log


async def get_acceptance_templates(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResponse:
    query = select(AcceptanceTemplate)
    count_query = select(func.count()).select_from(AcceptanceTemplate)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    templates = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(t) for t in templates], total=total, page=page, page_size=page_size
    )


async def get_acceptance_template(
    db: AsyncSession, template_id: int
) -> Optional[AcceptanceTemplate]:
    result = await db.execute(
        select(AcceptanceTemplate).where(AcceptanceTemplate.id == template_id)
    )
    return result.scalar_one_or_none()


async def create_acceptance_template(
    db: AsyncSession, data: AcceptanceTemplateCreate, user_id: int
) -> AcceptanceTemplate:
    template = AcceptanceTemplate(**data.model_dump())
    db.add(template)
    await db.flush()
    await _log_change(
        db,
        user_id,
        "acceptance_template",
        template.id,
        "create",
        after_data=data.model_dump(),
        is_demo=data.is_demo,
    )
    return template


async def update_acceptance_template(
    db: AsyncSession,
    template: AcceptanceTemplate,
    data: AcceptanceTemplateUpdate,
    user_id: int,
) -> AcceptanceTemplate:
    before = {
        "name": template.name,
        "items": template.items,
    }
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    await db.flush()
    await _log_change(
        db,
        user_id,
        "acceptance_template",
        template.id,
        "update",
        before_data=before,
        after_data=update_data,
        is_demo=template.is_demo,
    )
    return template


async def delete_acceptance_template(
    db: AsyncSession, template: AcceptanceTemplate, user_id: int
) -> None:
    before = {
        "name": template.name,
        "items": template.items,
    }
    await _log_change(
        db,
        user_id,
        "acceptance_template",
        template.id,
        "delete",
        before_data=before,
        is_demo=template.is_demo,
    )
    await db.delete(template)
    await db.flush()


async def get_budget_versions(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    contract_id: Optional[int] = None,
) -> PaginatedResponse:
    query = select(BudgetVersion)
    count_query = select(func.count()).select_from(BudgetVersion)
    if contract_id:
        query = query.where(BudgetVersion.contract_id == contract_id)
        count_query = count_query.where(BudgetVersion.contract_id == contract_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    versions = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(v) for v in versions], total=total, page=page, page_size=page_size
    )


async def get_budget_version(
    db: AsyncSession, version_id: int
) -> Optional[BudgetVersion]:
    result = await db.execute(
        select(BudgetVersion).where(BudgetVersion.id == version_id)
    )
    return result.scalar_one_or_none()


async def create_budget_version(
    db: AsyncSession, data: BudgetVersionCreate, user_id: int
) -> BudgetVersion:
    version = BudgetVersion(**data.model_dump())
    db.add(version)
    await db.flush()
    await _log_change(
        db,
        user_id,
        "budget_version",
        version.id,
        "create",
        after_data=data.model_dump(),
        is_demo=data.is_demo,
    )
    return version


async def update_budget_version(
    db: AsyncSession,
    version: BudgetVersion,
    data: BudgetVersionUpdate,
    user_id: int,
) -> BudgetVersion:
    before = {
        "version": version.version,
        "items": version.items,
        "contract_id": version.contract_id,
    }
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(version, key, value)
    await db.flush()
    await _log_change(
        db,
        user_id,
        "budget_version",
        version.id,
        "update",
        before_data=before,
        after_data=update_data,
        is_demo=version.is_demo,
    )
    return version


async def delete_budget_version(
    db: AsyncSession, version: BudgetVersion, user_id: int
) -> None:
    before = {
        "version": version.version,
        "items": version.items,
        "contract_id": version.contract_id,
    }
    await _log_change(
        db,
        user_id,
        "budget_version",
        version.id,
        "delete",
        before_data=before,
        is_demo=version.is_demo,
    )
    await db.delete(version)
    await db.flush()


async def get_inspection_templates(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResponse:
    query = select(InspectionTemplate)
    count_query = select(func.count()).select_from(InspectionTemplate)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    templates = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(t) for t in templates], total=total, page=page, page_size=page_size
    )


async def get_inspection_template(
    db: AsyncSession, template_id: int
) -> Optional[InspectionTemplate]:
    result = await db.execute(
        select(InspectionTemplate).where(InspectionTemplate.id == template_id)
    )
    return result.scalar_one_or_none()


async def create_inspection_template(
    db: AsyncSession, data: InspectionTemplateCreate, user_id: int
) -> InspectionTemplate:
    template = InspectionTemplate(**data.model_dump())
    db.add(template)
    await db.flush()
    await _log_change(
        db,
        user_id,
        "inspection_template",
        template.id,
        "create",
        after_data=data.model_dump(),
        is_demo=data.is_demo,
    )
    return template


async def update_inspection_template(
    db: AsyncSession,
    template: InspectionTemplate,
    data: InspectionTemplateUpdate,
    user_id: int,
) -> InspectionTemplate:
    before = {
        "name": template.name,
        "check_items": template.check_items,
    }
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)
    await db.flush()
    await _log_change(
        db,
        user_id,
        "inspection_template",
        template.id,
        "update",
        before_data=before,
        after_data=update_data,
        is_demo=template.is_demo,
    )
    return template


async def delete_inspection_template(
    db: AsyncSession, template: InspectionTemplate, user_id: int
) -> None:
    before = {
        "name": template.name,
        "check_items": template.check_items,
    }
    await _log_change(
        db,
        user_id,
        "inspection_template",
        template.id,
        "delete",
        before_data=before,
        is_demo=template.is_demo,
    )
    await db.delete(template)
    await db.flush()


async def get_changelog(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    entity_type: Optional[str] = None,
) -> PaginatedResponse:
    query = select(ConfigChangeLog)
    count_query = select(func.count()).select_from(ConfigChangeLog)
    if entity_type:
        query = query.where(ConfigChangeLog.entity_type == entity_type)
        count_query = count_query.where(ConfigChangeLog.entity_type == entity_type)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.order_by(ConfigChangeLog.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    logs = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(l) for l in logs], total=total, page=page, page_size=page_size
    )
