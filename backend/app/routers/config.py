from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    AcceptanceTemplateCreate,
    AcceptanceTemplateResponse,
    AcceptanceTemplateUpdate,
    BudgetVersionCreate,
    BudgetVersionResponse,
    BudgetVersionUpdate,
    InspectionTemplateCreate,
    InspectionTemplateResponse,
    InspectionTemplateUpdate,
    ConfigChangeLogResponse,
    PaginatedResponse,
)
from app.services.auth_service import get_current_user
from app.services.config_service import (
    get_acceptance_templates,
    get_acceptance_template,
    create_acceptance_template,
    update_acceptance_template,
    delete_acceptance_template,
    get_budget_versions,
    get_budget_version,
    create_budget_version,
    update_budget_version,
    delete_budget_version,
    get_inspection_templates,
    get_inspection_template,
    create_inspection_template,
    update_inspection_template,
    delete_inspection_template,
    get_changelog,
)

router = APIRouter(prefix="/api/config", tags=["配置管理"])


@router.get("/acceptance-templates", response_model=PaginatedResponse)
async def list_acceptance_templates(
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_acceptance_templates(db, page=page, page_size=page_size)


@router.post(
    "/acceptance-templates",
    response_model=AcceptanceTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_acceptance_template(
    data: AcceptanceTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_acceptance_template(db, data, current_user.id)


@router.get("/acceptance-templates/{template_id}", response_model=AcceptanceTemplateResponse)
async def get_acceptance_template_detail(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await get_acceptance_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="验收模板不存在")
    return template


@router.put("/acceptance-templates/{template_id}", response_model=AcceptanceTemplateResponse)
async def update_existing_acceptance_template(
    template_id: int,
    data: AcceptanceTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await get_acceptance_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="验收模板不存在")
    return await update_acceptance_template(db, template, data, current_user.id)


@router.delete(
    "/acceptance-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_existing_acceptance_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await get_acceptance_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="验收模板不存在")
    await delete_acceptance_template(db, template, current_user.id)


@router.get("/budget-versions", response_model=PaginatedResponse)
async def list_budget_versions(
    page: int = 1,
    page_size: int = 10,
    contract_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_budget_versions(
        db, page=page, page_size=page_size, contract_id=contract_id
    )


@router.post(
    "/budget-versions",
    response_model=BudgetVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_budget_version(
    data: BudgetVersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_budget_version(db, data, current_user.id)


@router.get("/budget-versions/{version_id}", response_model=BudgetVersionResponse)
async def get_budget_version_detail(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = await get_budget_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="预算版本不存在")
    return version


@router.put("/budget-versions/{version_id}", response_model=BudgetVersionResponse)
async def update_existing_budget_version(
    version_id: int,
    data: BudgetVersionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = await get_budget_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="预算版本不存在")
    return await update_budget_version(db, version, data, current_user.id)


@router.delete(
    "/budget-versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_existing_budget_version(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = await get_budget_version(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="预算版本不存在")
    await delete_budget_version(db, version, current_user.id)


@router.get("/inspection-templates", response_model=PaginatedResponse)
async def list_inspection_templates(
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_inspection_templates(db, page=page, page_size=page_size)


@router.post(
    "/inspection-templates",
    response_model=InspectionTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_inspection_template(
    data: InspectionTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_inspection_template(db, data, current_user.id)


@router.get("/inspection-templates/{template_id}", response_model=InspectionTemplateResponse)
async def get_inspection_template_detail(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await get_inspection_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="巡检模板不存在")
    return template


@router.put("/inspection-templates/{template_id}", response_model=InspectionTemplateResponse)
async def update_existing_inspection_template(
    template_id: int,
    data: InspectionTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await get_inspection_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="巡检模板不存在")
    return await update_inspection_template(db, template, data, current_user.id)


@router.delete(
    "/inspection-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_existing_inspection_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await get_inspection_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="巡检模板不存在")
    await delete_inspection_template(db, template, current_user.id)


@router.get("/changelog", response_model=PaginatedResponse)
async def list_changelog(
    page: int = 1,
    page_size: int = 10,
    entity_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_changelog(db, page=page, page_size=page_size, entity_type=entity_type)
