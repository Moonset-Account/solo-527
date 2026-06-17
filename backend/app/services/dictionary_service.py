from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import re

from app.models.dictionary import Dictionary, DictionaryItem, ValidationRule
from app.schemas.dictionary import (
    DictionaryCreate, DictionaryUpdate, DictionaryQuery,
    DictionaryItemCreate, DictionaryItemUpdate,
    ValidationRuleCreate, ValidationRuleUpdate, ValidationRuleQuery,
)
from app.schemas.common import PageResult


class DictionaryService:
    @staticmethod
    def get(db: Session, dictionary_id: int) -> Optional[Dictionary]:
        return db.query(Dictionary).filter(Dictionary.id == dictionary_id, Dictionary.is_deleted == False).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[Dictionary]:
        return db.query(Dictionary).filter(Dictionary.code == code, Dictionary.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: DictionaryQuery) -> PageResult:
        q = db.query(Dictionary).filter(Dictionary.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(Dictionary.name.like(keyword), Dictionary.code.like(keyword)))

        if query.code:
            q = q.filter(Dictionary.code == query.code)

        if query.is_active is not None:
            q = q.filter(Dictionary.is_active == query.is_active)

        total = q.count()
        items = q.order_by(Dictionary.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(db: Session, data: DictionaryCreate, created_by: Optional[int] = None) -> Dictionary:
        db_dict = Dictionary(
            name=data.name,
            code=data.code,
            description=data.description,
            created_by=created_by,
        )

        if data.items:
            for item_data in data.items:
                item = DictionaryItem(**item_data)
                db_dict.items.append(item)

        db.add(db_dict)
        db.commit()
        db.refresh(db_dict)
        return db_dict

    @staticmethod
    def update(db: Session, dictionary_id: int, data: DictionaryUpdate, updated_by: Optional[int] = None) -> Optional[Dictionary]:
        db_dict = DictionaryService.get(db, dictionary_id)
        if not db_dict:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_dict, field, value)

        db_dict.version += 1
        db_dict.updated_by = updated_by
        db_dict.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_dict)
        return db_dict

    @staticmethod
    def delete(db: Session, dictionary_id: int, updated_by: Optional[int] = None) -> bool:
        db_dict = DictionaryService.get(db, dictionary_id)
        if not db_dict:
            return False
        db_dict.is_deleted = True
        db_dict.updated_by = updated_by
        db_dict.updated_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def get_items(db: Session, code: str) -> List[DictionaryItem]:
        dictionary = DictionaryService.get_by_code(db, code)
        if not dictionary:
            return []
        return [
            item for item in dictionary.items
            if not item.is_deleted and item.is_active
        ]

    @staticmethod
    def add_item(db: Session, dictionary_id: int, data: DictionaryItemCreate, created_by: Optional[int] = None) -> Optional[DictionaryItem]:
        dictionary = DictionaryService.get(db, dictionary_id)
        if not dictionary:
            return None

        item = DictionaryItem(
            dictionary_id=dictionary_id,
            **data.model_dump(),
            created_by=created_by,
        )
        db.add(item)
        dictionary.version += 1
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_item(db: Session, item_id: int, data: DictionaryItemUpdate, updated_by: Optional[int] = None) -> Optional[DictionaryItem]:
        item = db.query(DictionaryItem).filter(DictionaryItem.id == item_id, DictionaryItem.is_deleted == False).first()
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        item.updated_by = updated_by
        item.updated_at = datetime.utcnow()

        if item.dictionary:
            item.dictionary.version += 1

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_item(db: Session, item_id: int, updated_by: Optional[int] = None) -> bool:
        item = db.query(DictionaryItem).filter(DictionaryItem.id == item_id, DictionaryItem.is_deleted == False).first()
        if not item:
            return False

        dictionary = item.dictionary

        item.is_deleted = True
        item.updated_by = updated_by
        item.updated_at = datetime.utcnow()

        if dictionary:
            dictionary.version += 1

        db.commit()
        return True

    @staticmethod
    def get_all_active_dicts(db: Session) -> Dict[str, List[Dict[str, Any]]]:
        dictionaries = db.query(Dictionary).filter(Dictionary.is_deleted == False, Dictionary.is_active == True).all()
        result = {}
        for d in dictionaries:
            items = [
                {"label": item.label, "value": item.value, "color": item.color, "sort_order": item.sort_order}
                for item in d.items
                if not item.is_deleted and item.is_active
            ]
            items.sort(key=lambda x: x["sort_order"])
            result[d.code] = items
        return result


class ValidationRuleService:
    @staticmethod
    def get(db: Session, rule_id: int) -> Optional[ValidationRule]:
        return db.query(ValidationRule).filter(ValidationRule.id == rule_id, ValidationRule.is_deleted == False).first()

    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[ValidationRule]:
        return db.query(ValidationRule).filter(ValidationRule.code == code, ValidationRule.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: ValidationRuleQuery) -> PageResult:
        q = db.query(ValidationRule).filter(ValidationRule.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(ValidationRule.name.like(keyword), ValidationRule.code.like(keyword), ValidationRule.field_name.like(keyword)))

        if query.rule_type:
            q = q.filter(ValidationRule.rule_type == query.rule_type)

        if query.is_active is not None:
            q = q.filter(ValidationRule.is_active == query.is_active)

        total = q.count()
        items = q.order_by(ValidationRule.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(db: Session, data: ValidationRuleCreate, created_by: Optional[int] = None) -> ValidationRule:
        db_obj = ValidationRule(**data.model_dump(), created_by=created_by)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, rule_id: int, data: ValidationRuleUpdate, updated_by: Optional[int] = None) -> Optional[ValidationRule]:
        db_obj = ValidationRuleService.get(db, rule_id)
        if not db_obj:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, rule_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = ValidationRuleService.get(db, rule_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def validate_field(db: Session, field_name: str, value: Any) -> List[Dict[str, Any]]:
        rules = (
            db.query(ValidationRule)
            .filter(
                ValidationRule.field_name == field_name,
                ValidationRule.is_active == True,
                ValidationRule.is_deleted == False,
            )
            .all()
        )

        errors = []
        for rule in rules:
            result = ValidationRuleService._apply_rule(rule, value)
            if not result["valid"]:
                errors.append({
                    "rule_code": rule.code,
                    "rule_name": rule.name,
                    "error_message": rule.error_message,
                })

        return errors

    @staticmethod
    def _apply_rule(rule: ValidationRule, value: Any) -> Dict[str, Any]:
        config = rule.rule_config or {}

        if value is None:
            return {"valid": True}

        try:
            if rule.rule_type == "required":
                if value is None or value == "":
                    return {"valid": False}

            elif rule.rule_type == "min_length":
                min_len = config.get("min", 0)
                if len(str(value)) < min_len:
                    return {"valid": False}

            elif rule.rule_type == "max_length":
                max_len = config.get("max", 100)
                if len(str(value)) > max_len:
                    return {"valid": False}

            elif rule.rule_type == "min_value":
                min_val = config.get("min", 0)
                if float(value) < float(min_val):
                    return {"valid": False}

            elif rule.rule_type == "max_value":
                max_val = config.get("max", 0)
                if float(value) > float(max_val):
                    return {"valid": False}

            elif rule.rule_type == "regex":
                pattern = config.get("pattern", "")
                if not re.match(pattern, str(value)):
                    return {"valid": False}

            elif rule.rule_type == "email":
                pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                if not re.match(pattern, str(value)):
                    return {"valid": False}

            elif rule.rule_type == "phone":
                pattern = r"^1[3-9]\d{9}$"
                if not re.match(pattern, str(value)):
                    return {"valid": False}

            return {"valid": True}
        except (ValueError, TypeError):
            return {"valid": False}
