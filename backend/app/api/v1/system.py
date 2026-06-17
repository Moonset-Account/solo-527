from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.dictionary import (
    DictionaryCreate, DictionaryUpdate, DictionaryBase, DictionaryQuery,
    DictionaryItemCreate, DictionaryItemUpdate, DictionaryItemBase,
    DictionaryWithItemsResponse,
    ValidationRuleCreate, ValidationRuleUpdate, ValidationRuleBase, ValidationRuleQuery,
    ValidationRequest,
)
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import DictionaryService, ValidationRuleService

router = APIRouter(tags=["系统配置"])


@router.get("/dictionaries", response_model=ResponseModel[PageResult])
def list_dictionaries(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    code: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    query = DictionaryQuery(page=page, page_size=page_size, keyword=keyword, code=code, is_active=is_active)
    result = DictionaryService.list(db, query)
    items = [DictionaryBase.model_validate(d) for d in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("/dictionaries", response_model=ResponseModel[DictionaryBase])
def create_dictionary(
    data: DictionaryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    if DictionaryService.get_by_code(db, data.code):
        raise HTTPException(status_code=400, detail="字典编码已存在")
    dictionary = DictionaryService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=DictionaryBase.model_validate(dictionary))


@router.get("/dictionaries/{code}/items", response_model=ResponseModel)
def get_dictionary_items(
    code: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    items = DictionaryService.get_items(db, code)
    return ResponseModel(data=[DictionaryItemBase.model_validate(i) for i in items])


@router.get("/dictionaries/all", response_model=ResponseModel)
def get_all_dictionaries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dicts = DictionaryService.get_all_active_dicts(db)
    return ResponseModel(data=dicts)


@router.get("/dictionaries/{dictionary_id}", response_model=ResponseModel[DictionaryWithItemsResponse])
def get_dictionary(
    dictionary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    dictionary = DictionaryService.get(db, dictionary_id)
    if not dictionary:
        raise HTTPException(status_code=404, detail="字典不存在")
    return ResponseModel(data=DictionaryWithItemsResponse.model_validate(dictionary))


@router.put("/dictionaries/{dictionary_id}", response_model=ResponseModel[DictionaryBase])
def update_dictionary(
    dictionary_id: int,
    data: DictionaryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    dictionary = DictionaryService.update(db, dictionary_id, data, updated_by=current_user.id)
    if not dictionary:
        raise HTTPException(status_code=404, detail="字典不存在")
    return ResponseModel(data=DictionaryBase.model_validate(dictionary))


@router.delete("/dictionaries/{dictionary_id}")
def delete_dictionary(
    dictionary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    if not DictionaryService.delete(db, dictionary_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="字典不存在")
    return ResponseModel(message="删除成功")


@router.post("/dictionaries/{dictionary_id}/items", response_model=ResponseModel[DictionaryItemBase])
def add_dictionary_item(
    dictionary_id: int,
    data: DictionaryItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    item = DictionaryService.add_item(db, dictionary_id, data, created_by=current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="字典不存在")
    return ResponseModel(data=DictionaryItemBase.model_validate(item))


@router.put("/dictionary-items/{item_id}", response_model=ResponseModel[DictionaryItemBase])
def update_dictionary_item(
    item_id: int,
    data: DictionaryItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    item = DictionaryService.update_item(db, item_id, data, updated_by=current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="字典项不存在")
    return ResponseModel(data=DictionaryItemBase.model_validate(item))


@router.delete("/dictionary-items/{item_id}")
def delete_dictionary_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("dictionary:manage")),
):
    if not DictionaryService.delete_item(db, item_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="字典项不存在")
    return ResponseModel(message="删除成功")


@router.get("/validation-rules", response_model=ResponseModel[PageResult])
def list_validation_rules(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    rule_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("validation:manage")),
):
    query = ValidationRuleQuery(page=page, page_size=page_size, keyword=keyword, rule_type=rule_type, is_active=is_active)
    result = ValidationRuleService.list(db, query)
    items = [ValidationRuleBase.model_validate(r) for r in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("/validation-rules", response_model=ResponseModel[ValidationRuleBase])
def create_validation_rule(
    data: ValidationRuleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("validation:manage")),
):
    if ValidationRuleService.get_by_code(db, data.code):
        raise HTTPException(status_code=400, detail="规则编码已存在")
    rule = ValidationRuleService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=ValidationRuleBase.model_validate(rule))


@router.get("/validation-rules/{rule_id}", response_model=ResponseModel[ValidationRuleBase])
def get_validation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("validation:manage")),
):
    rule = ValidationRuleService.get(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="校验规则不存在")
    return ResponseModel(data=ValidationRuleBase.model_validate(rule))


@router.put("/validation-rules/{rule_id}", response_model=ResponseModel[ValidationRuleBase])
def update_validation_rule(
    rule_id: int,
    data: ValidationRuleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("validation:manage")),
):
    rule = ValidationRuleService.update(db, rule_id, data, updated_by=current_user.id)
    if not rule:
        raise HTTPException(status_code=404, detail="校验规则不存在")
    return ResponseModel(data=ValidationRuleBase.model_validate(rule))


@router.delete("/validation-rules/{rule_id}")
def delete_validation_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("validation:manage")),
):
    if not ValidationRuleService.delete(db, rule_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="校验规则不存在")
    return ResponseModel(message="删除成功")


@router.post("/validation-rules/validate")
def validate_field(
    data: ValidationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    errors = ValidationRuleService.validate_field(db, data.field_name, data.value)
    return ResponseModel(data={"valid": len(errors) == 0, "errors": errors})
