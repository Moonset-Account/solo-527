from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.asset import Asset, AssetStatusEnum
from app.models.user import User, RoleEnum
from app.routers.auth import require_login, require_admin

router = APIRouter(prefix="/assets", tags=["资产"])


@router.get("")
async def list_assets(
    request: Request,
    status: str | None = Query(None),
    asset_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    query = select(Asset).order_by(Asset.updated_at.desc())
    if status:
        query = query.where(Asset.status == AssetStatusEnum(status))
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)

    result = await db.execute(query)
    assets = result.scalars().all()

    types_result = await db.execute(select(Asset.asset_type).distinct())
    asset_types = [r[0] for r in types_result.all()]

    return templates.TemplateResponse("assets/list.html", {
        "request": request,
        "assets": assets,
        "asset_types": asset_types,
        "current_user": user,
        "AssetStatusEnum": AssetStatusEnum,
        "RoleEnum": RoleEnum,
    })


@router.get("/{asset_id}")
async def asset_detail(
    request: Request,
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        return templates.TemplateResponse("assets/list.html", {
            "request": request, "assets": [], "asset_types": [],
            "current_user": user, "error": "资产不存在",
            "AssetStatusEnum": AssetStatusEnum, "RoleEnum": RoleEnum,
        })

    return templates.TemplateResponse("assets/detail.html", {
        "request": request,
        "asset": asset,
        "current_user": user,
        "AssetStatusEnum": AssetStatusEnum,
        "RoleEnum": RoleEnum,
    })


@router.post("/create")
async def create_asset(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    form = await request.form()
    asset = Asset(
        name=form.get("name", "").strip(),
        asset_type=form.get("asset_type", "").strip(),
        model=form.get("model", "").strip() or None,
        serial_number=form.get("serial_number", "").strip() or None,
        location=form.get("location", "").strip() or None,
        status=AssetStatusEnum(form.get("status", "in_use")),
        config_detail=form.get("config_detail", "").strip() or None,
        owner=form.get("owner", "").strip() or None,
    )
    db.add(asset)
    return RedirectResponse(url="/assets", status_code=303)


@router.post("/{asset_id}/update")
async def update_asset(
    request: Request,
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    form = await request.form()
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        return Response(status_code=404)

    for field in ["name", "asset_type", "model", "serial_number", "location", "config_detail", "owner"]:
        val = form.get(field)
        if val is not None:
            setattr(asset, field, val.strip() or None)

    status_val = form.get("status")
    if status_val:
        asset.status = AssetStatusEnum(status_val)

    return RedirectResponse(url=f"/assets/{asset_id}", status_code=303)
