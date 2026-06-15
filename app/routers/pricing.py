from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PricingRule
from app.schemas import PricingRuleCreate, PricingRule as PricingRuleSchema

router = APIRouter()


@router.get("", response_model=List[PricingRuleSchema])
def get_pricing_rules(
    service_type: Optional[str] = None,
    source: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingRule)
    if service_type:
        query = query.filter(PricingRule.service_type == service_type)
    if source:
        query = query.filter(PricingRule.source == source)
    if is_active is not None:
        query = query.filter(PricingRule.is_active == is_active)
    return query.order_by(PricingRule.id).all()


@router.post("", response_model=PricingRuleSchema)
def create_pricing_rule(rule: PricingRuleCreate, db: Session = Depends(get_db)):
    db_rule = PricingRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


@router.get("/{rule_id}", response_model=PricingRuleSchema)
def get_pricing_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="价格规则不存在")
    return rule


@router.put("/{rule_id}", response_model=PricingRuleSchema)
def update_pricing_rule(
    rule_id: int,
    rule_data: PricingRuleCreate,
    db: Session = Depends(get_db)
):
    rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="价格规则不存在")

    for key, value in rule_data.model_dump().items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_pricing_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(PricingRule).filter(PricingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="价格规则不存在")
    db.delete(rule)
    db.commit()
    return {"status": "success", "message": "删除成功"}


@router.get("/calculate")
def calculate_price(
    service_type: str,
    source: str = "all",
    db: Session = Depends(get_db)
):
    rules = db.query(PricingRule).filter(
        PricingRule.service_type == service_type,
        PricingRule.is_active == True,
        (PricingRule.source == source) | (PricingRule.source == "all")
    ).all()

    if not rules:
        return {"price": 0, "rules": []}

    result = []
    for rule in rules:
        final_price = rule.base_price * (1 - rule.discount / 100) if rule.discount > 0 else rule.base_price
        result.append({
            "rule_id": rule.id,
            "rule_name": rule.name,
            "base_price": rule.base_price,
            "discount": rule.discount,
            "final_price": final_price
        })

    result.sort(key=lambda x: x["final_price"])
    return {"price": result[0]["final_price"] if result else 0, "rules": result}
