from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date
from ..database import get_db
from .. import models, schemas, crud
from ..auth import get_current_user, require_role
from ..utils import create_audit_log, create_notification
from ..schemas.common import ResponseModel, PageResult

router = APIRouter(prefix="/api/quotes", tags=["报价管理"])


def generate_quote_no(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    last = db.query(models.Quote).filter(models.Quote.quote_no.like(f"Q{today}%")).order_by(models.Quote.quote_no.desc()).first()
    seq = int(last.quote_no[-4:]) + 1 if last else 1
    return f"Q{today}{seq:04d}"


@router.get("", response_model=ResponseModel[PageResult[schemas.QuoteInDB]])
def list_quotes(
    page: int = 1, page_size: int = 20, keyword: Optional[str] = None,
    material_id: Optional[int] = None, supplier_id: Optional[int] = None,
    status: Optional[models.QuoteStatus] = None,
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if material_id: filters["material_id"] = material_id
    if supplier_id: filters["supplier_id"] = supplier_id
    if status: filters["status"] = status
    items, total = crud.quote.get_multi(
        db, page=page, page_size=page_size, keyword=keyword,
        keyword_fields=["quote_no", "remarks"], filters=filters, order_by="id",
        includes=["material", "supplier"]
    )
    return ResponseModel(data=PageResult(items=items, total=total, page=page, page_size=page_size))


@router.post("", response_model=ResponseModel[schemas.QuoteInDB])
def create_quote(
    quote_in: schemas.QuoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    quote_data = quote_in.model_dump()
    quote_data["quote_no"] = generate_quote_no(db)
    quote_data["submitted_by"] = current_user.id
    quote = crud.quote.create(db, obj_in=quote_data)
    create_audit_log(db, "create", "quote", quote.id, quote.quote_no, current_user,
                     new_value=quote_in.model_dump(), description="创建报价单")
    return ResponseModel(data=quote)


@router.get("/{quote_id}", response_model=ResponseModel[schemas.QuoteInDB])
def get_quote(quote_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quote = crud.quote.get(db, quote_id, includes=["material", "supplier"])
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    return ResponseModel(data=quote)


@router.put("/{quote_id}", response_model=ResponseModel[schemas.QuoteInDB])
def update_quote(
    quote_id: int, quote_in: schemas.QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.PROCUREMENT, models.UserRole.ADMIN))
):
    quote = crud.quote.get(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    if quote_in.status == models.QuoteStatus.EVALUATED:
        quote_in_data = quote_in.model_dump(exclude_unset=True)
        quote_in_data["evaluated_by"] = current_user.id
        quote = crud.quote.update(db, quote, quote_in_data)
    else:
        quote = crud.quote.update(db, quote, quote_in.model_dump(exclude_unset=True))
    create_audit_log(db, "update", "quote", quote.id, quote.quote_no, current_user,
                     new_value=quote_in.model_dump(exclude_unset=True), description="更新报价单")
    return ResponseModel(data=quote)


@router.post("/compare/{material_id}", response_model=ResponseModel[schemas.QuoteComparisonResult])
def compare_quotes(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = crud.material.get(db, material_id, includes=["category"])
    if not material:
        raise HTTPException(status_code=404, detail="耗材不存在")

    quotes = db.query(models.Quote).filter(
        models.Quote.material_id == material_id,
        models.Quote.status.in_([models.QuoteStatus.SUBMITTED, models.QuoteStatus.EVALUATED, models.QuoteStatus.ACCEPTED])
    ).all()

    if not quotes:
        raise HTTPException(status_code=400, detail="该耗材暂无有效报价")

    historical_quotes = db.query(models.Quote).filter(
        models.Quote.material_id == material_id,
        models.Quote.status.in_([models.QuoteStatus.EVALUATED, models.QuoteStatus.ACCEPTED])
    ).all()
    historical_prices = [q.unit_price for q in historical_quotes]
    avg_price = sum(historical_prices) / len(historical_prices) if historical_prices else 0
    min_price = min(historical_prices) if historical_prices else 0
    max_price = max(historical_prices) if historical_prices else 0

    agreement_price = None
    agreement_item = db.query(models.AgreementItem).join(models.FrameworkAgreement).filter(
        models.AgreementItem.material_id == material_id,
        models.FrameworkAgreement.status == models.AgreementStatus.ACTIVE
    ).first()
    if agreement_item:
        agreement_price = agreement_item.unit_price

    sorted_quotes = sorted(quotes, key=lambda q: q.unit_price)
    lowest_price = sorted_quotes[0].unit_price
    lowest_supplier = sorted_quotes[0].supplier.name if sorted_quotes[0].supplier else ""

    comparisons = []
    for idx, quote in enumerate(sorted_quotes, 1):
        variance = quote.unit_price - avg_price if avg_price else 0
        variance_pct = (variance / avg_price * 100) if avg_price else 0
        is_within = agreement_price and quote.unit_price <= agreement_price

        comp_no = f"COMP{datetime.now().strftime('%Y%m%d%H%M%S')}{idx}"
        comparison = models.QuoteComparison(
            comparison_no=comp_no, material_id=material_id, quote_id=quote.id,
            historical_avg_price=avg_price, historical_min_price=min_price,
            historical_max_price=max_price, price_variance=variance,
            price_variance_percent=variance_pct, rank_by_price=idx,
            is_lowest=(idx == 1), is_within_agreement=bool(is_within),
            agreement_price=agreement_price, created_by=current_user.id
        )
        comparisons.append(comparison)

        if variance_pct > 20 or variance_pct < -20:
            admins = db.query(models.User).filter(
                models.User.role.in_([models.UserRole.MANAGER, models.UserRole.PROCUREMENT])
            ).all()
            for admin in admins:
                create_notification(db, admin.id, models.AlertType.PRICE_ABNORMAL,
                                    f"价格异常提醒: {material.name}",
                                    f"供应商 {quote.supplier.name} 报价偏离历史均价 {variance_pct:.1f}%",
                                    "quote", quote.id)

    db.add_all(comparisons)
    db.commit()

    comparison_ids = [c.id for c in comparisons]
    comparisons = db.query(models.QuoteComparison).filter(
        models.QuoteComparison.id.in_(comparison_ids)
    ).options(
        joinedload(models.QuoteComparison.quote).options(
            joinedload(models.Quote.supplier)
        )
    ).order_by(models.QuoteComparison.rank_by_price).all()

    result = schemas.QuoteComparisonResult(
        material_id=material_id, material_name=material.name, material_code=material.code,
        quotes=comparisons, historical_avg_price=avg_price, historical_min_price=min_price,
        historical_max_price=max_price, lowest_price=lowest_price,
        lowest_supplier=lowest_supplier, agreement_price=agreement_price
    )
    create_audit_log(db, "compare", "quote", material_id, material.name, current_user,
                     description=f"执行报价比价: {material.name}")
    return ResponseModel(data=result)
