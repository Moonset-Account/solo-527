from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, is_test_user
from app.models.models import Service, Package, PackageItem, User, UserRole
from app.schemas.schemas import (
    ServiceCreate, ServiceResponse,
    PackageCreate, PackageResponse, PackageItemResponse
)

router = APIRouter(tags=["services_packages"])


@router.get("/services", response_model=List[ServiceResponse])
async def list_services(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Service).where(Service.is_active == True)
    if category:
        query = query.where(Service.category == category)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    service = Service(**service_in.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_in: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    for field, value in service_in.model_dump().items():
        setattr(service, field, value)

    await db.commit()
    await db.refresh(service)
    return service


@router.get("/packages", response_model=List[PackageResponse])
async def list_packages(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Package).where(Package.is_active == True).offset(skip).limit(limit))
    packages = result.scalars().all()

    response_packages = []
    for pkg in packages:
        pkg_dict = {c.name: getattr(pkg, c.name) for c in pkg.__table__.columns}
        items_result = await db.execute(
            select(PackageItem).where(PackageItem.package_id == pkg.id)
        )
        items = items_result.scalars().all()
        pkg_dict["items"] = [
            PackageItemResponse(
                id=item.id,
                service_id=item.service_id,
                quantity=item.quantity
            )
            for item in items
        ]
        response_packages.append(PackageResponse(**pkg_dict))

    return response_packages


@router.post("/packages", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
async def create_package(
    package_in: PackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    package_data = package_in.model_dump(exclude={"items"})
    package = Package(**package_data)
    db.add(package)
    await db.flush()

    for item_in in package_in.items:
        item = PackageItem(
            package_id=package.id,
            service_id=item_in.service_id,
            quantity=item_in.quantity,
        )
        db.add(item)

    await db.commit()
    await db.refresh(package)

    pkg_dict = {c.name: getattr(package, c.name) for c in package.__table__.columns}
    items_result = await db.execute(
        select(PackageItem).where(PackageItem.package_id == package.id)
    )
    items = items_result.scalars().all()
    pkg_dict["items"] = [
        PackageItemResponse(
            id=item.id,
            service_id=item.service_id,
            quantity=item.quantity
        )
        for item in items
    ]
    return PackageResponse(**pkg_dict)


@router.get("/packages/{package_id}", response_model=PackageResponse)
async def get_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Package).where(Package.id == package_id))
    package = result.scalar_one_or_none()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    pkg_dict = {c.name: getattr(package, c.name) for c in package.__table__.columns}
    items_result = await db.execute(
        select(PackageItem).where(PackageItem.package_id == package.id)
    )
    items = items_result.scalars().all()
    pkg_dict["items"] = [
        PackageItemResponse(
            id=item.id,
            service_id=item.service_id,
            quantity=item.quantity
        )
        for item in items
    ]
    return PackageResponse(**pkg_dict)
