from __future__ import annotations
from fastapi import APIRouter, Depends, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse, PlanRuleCreate, PlanRuleUpdate, PlanRuleResponse
from app.services.plan import PlanService, PlanRuleService

router = APIRouter(prefix="/plans")


@router.get("/")
async def plan_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("plans/index.html", {"request": request})


@router.get("/api/", response_model=list[PlanResponse])
async def list_plans(page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * size
    svc = PlanService(db)
    plans = await svc.list(offset=offset, limit=size)
    return plans


@router.post("/api/", response_model=PlanResponse, status_code=201)
async def create_plan(data: PlanCreate, db: AsyncSession = Depends(get_db)):
    svc = PlanService(db)
    plan = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(plan)
    return plan


@router.put("/api/{plan_id}", response_model=PlanResponse)
async def update_plan(plan_id: str, data: PlanUpdate, db: AsyncSession = Depends(get_db)):
    svc = PlanService(db)
    plan = await svc.update(plan_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return plan


@router.post("/api/{plan_id}/toggle", response_model=PlanResponse)
async def toggle_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlanService(db)
    plan = await svc.toggle_active(plan_id)
    await db.commit()
    return plan


@router.get("/{plan_id}/rules")
async def plan_rules_partial(request: Request, plan_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlanRuleService(db)
    rules = await svc.list_by_plan(plan_id)
    return templates.TemplateResponse("plans/rules.html", {"request": request, "rules": rules, "plan_id": plan_id})


@router.post("/api/{plan_id}/rules", response_model=PlanRuleResponse, status_code=201)
async def create_plan_rule(plan_id: str, data: PlanRuleCreate, db: AsyncSession = Depends(get_db)):
    svc = PlanRuleService(db)
    payload = data.model_dump()
    payload["plan_id"] = plan_id
    rule = await svc.create(**payload)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/api/rules/{rule_id}", response_model=PlanRuleResponse)
async def update_plan_rule(rule_id: str, data: PlanRuleUpdate, db: AsyncSession = Depends(get_db)):
    svc = PlanRuleService(db)
    rule = await svc.update(rule_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return rule


@router.post("/api/rules/{rule_id}/toggle", response_model=PlanRuleResponse)
async def toggle_plan_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    svc = PlanRuleService(db)
    rule = await svc.toggle(rule_id)
    await db.commit()
    return rule


@router.post("/htmx/", status_code=201)
async def htmx_create_plan(
    request: Request,
    name: str = Form(...),
    code: str = Form(...),
    price: float = Form(default=0),
    call_limit: int = Form(default=0),
    rate_limit: int = Form(default=0),
    notes: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    svc = PlanService(db)
    plan = await svc.create(
        name=name,
        code=code,
        price=float(price),
        call_limit=int(call_limit),
        rate_limit=int(rate_limit),
        notes=notes,
    )
    await db.commit()
    await db.refresh(plan)
    return templates.TemplateResponse(
        "plans/_row.html",
        {"request": request, "p": plan, "loop": {"index": 1}},
    )


@router.post("/htmx/{plan_id}/toggle")
async def htmx_toggle_plan(
    request: Request,
    plan_id: str,
    db: AsyncSession = Depends(get_db),
):
    svc = PlanService(db)
    plan = await svc.toggle_active(plan_id)
    await db.commit()
    return templates.TemplateResponse(
        "plans/_row.html",
        {"request": request, "p": plan, "loop": {"index": 1}},
    )


@router.post("/htmx/{plan_id}/rules", status_code=201)
async def htmx_create_plan_rule(
    request: Request,
    plan_id: str,
    rule_key: str = Form(...),
    rule_name: str = Form(...),
    rule_value: str = Form(...),
    notes: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    svc = PlanRuleService(db)
    rule = await svc.create(
        plan_id=plan_id,
        rule_key=rule_key,
        rule_name=rule_name,
        rule_value=rule_value,
        notes=notes,
    )
    await db.commit()
    await db.refresh(rule)
    return templates.TemplateResponse(
        "plans/_rule_row.html",
        {"request": request, "rule": rule, "loop": {"index": 1}},
    )


@router.post("/htmx/rules/{rule_id}/toggle")
async def htmx_toggle_plan_rule(
    request: Request,
    rule_id: str,
    db: AsyncSession = Depends(get_db),
):
    svc = PlanRuleService(db)
    rule = await svc.toggle(rule_id)
    await db.commit()
    return templates.TemplateResponse(
        "plans/_rule_row.html",
        {"request": request, "rule": rule, "loop": {"index": 1}},
    )
