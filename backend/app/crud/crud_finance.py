from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models import CashFlow, LaborRecord, SystemSetting, CashFlowType, ModuleType, Store
from app.schemas import CashFlowCreate, LaborRecordCreate, LaborRecordUpdate, SystemSettingCreate, SystemSettingUpdate


class CRUDCashFlow(CRUDBase[CashFlow, CashFlowCreate, CashFlowCreate]):
    def get_by_store(self, db: Session, *, store_id: int, flow_type: Optional[CashFlowType] = None,
                     start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                     skip: int = 0, limit: int = 100):
        query = db.query(CashFlow).filter(CashFlow.store_id == store_id)
        if flow_type:
            query = query.filter(CashFlow.flow_type == flow_type)
        if start_date:
            query = query.filter(CashFlow.transaction_time >= start_date)
        if end_date:
            query = query.filter(CashFlow.transaction_time <= end_date)
        return query.order_by(CashFlow.transaction_time.desc()).offset(skip).limit(limit).all()

    def get_summary(self, db: Session, *, store_id: int = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
        query = db.query(CashFlow)
        if store_id:
            query = query.filter(CashFlow.store_id == store_id)
        if start_date:
            query = query.filter(CashFlow.transaction_time >= start_date)
        if end_date:
            query = query.filter(CashFlow.transaction_time <= end_date)

        records = query.all()
        total_income = sum(r.amount for r in records if r.flow_type == CashFlowType.INCOME)
        total_expense = sum(r.amount for r in records if r.flow_type == CashFlowType.EXPENSE)

        category_breakdown = {}
        for r in records:
            key = f"{r.flow_type}_{r.category or '其他'}"
            if key not in category_breakdown:
                category_breakdown[key] = 0
            category_breakdown[key] += r.amount

        return {
            "total_income": total_income,
            "total_expense": total_expense,
            "net_balance": total_income - total_expense,
            "category_breakdown": category_breakdown
        }


crud_cash_flow = CRUDCashFlow(CashFlow)


class CRUDLaborRecord(CRUDBase[LaborRecord, LaborRecordCreate, LaborRecordUpdate]):
    def create(self, db: Session, *, obj_in: LaborRecordCreate) -> LaborRecord:
        obj_in_data = obj_in.model_dump()
        obj_in_data["total_amount"] = (
            obj_in_data.get("regular_hours", 0) * obj_in_data.get("hourly_rate", 0) +
            obj_in_data.get("overtime_hours", 0) * obj_in_data.get("overtime_rate", 0)
        )
        db_obj = LaborRecord(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: LaborRecord, obj_in: LaborRecordUpdate | Dict[str, Any]) -> LaborRecord:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field in update_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])

        db_obj.total_amount = (
            db_obj.regular_hours * db_obj.hourly_rate +
            db_obj.overtime_hours * db_obj.overtime_rate
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_user(self, db: Session, *, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None):
        query = db.query(LaborRecord).filter(LaborRecord.user_id == user_id)
        if start_date:
            query = query.filter(LaborRecord.work_date >= start_date)
        if end_date:
            query = query.filter(LaborRecord.work_date <= end_date)
        return query.order_by(LaborRecord.work_date.desc()).all()

    def get_by_store(self, db: Session, *, store_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None):
        query = db.query(LaborRecord).filter(LaborRecord.store_id == store_id)
        if start_date:
            query = query.filter(LaborRecord.work_date >= start_date)
        if end_date:
            query = query.filter(LaborRecord.work_date <= end_date)
        return query.order_by(LaborRecord.work_date.desc()).all()

    def get_stats(self, db: Session, *, store_id: int = None, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        query = db.query(
            LaborRecord.store_id,
            func.sum(LaborRecord.regular_hours).label("total_regular_hours"),
            func.sum(LaborRecord.overtime_hours).label("total_overtime_hours"),
            func.sum(LaborRecord.regular_hours * LaborRecord.hourly_rate).label("total_regular_cost"),
            func.sum(LaborRecord.overtime_hours * LaborRecord.overtime_rate).label("total_overtime_cost"),
            func.sum(LaborRecord.total_amount).label("total_cost"),
            func.count(func.distinct(LaborRecord.user_id)).label("employee_count")
        )

        if store_id:
            query = query.filter(LaborRecord.store_id == store_id)
        if start_date:
            query = query.filter(LaborRecord.work_date >= start_date)
        if end_date:
            query = query.filter(LaborRecord.work_date <= end_date)

        query = query.group_by(LaborRecord.store_id)
        results = query.all()

        stats = []
        for row in results:
            store = db.query(Store).filter(Store.id == row.store_id).first()
            stats.append({
                "store_id": row.store_id,
                "store_name": store.name if store else "Unknown",
                "period": f"{start_date} ~ {end_date}" if start_date and end_date else "All",
                "total_regular_hours": float(row.total_regular_hours or 0),
                "total_overtime_hours": float(row.total_overtime_hours or 0),
                "total_regular_cost": float(row.total_regular_cost or 0),
                "total_overtime_cost": float(row.total_overtime_cost or 0),
                "total_cost": float(row.total_cost or 0),
                "employee_count": int(row.employee_count or 0)
            })
        return stats


crud_labor = CRUDLaborRecord(LaborRecord)


class CRUDSystemSetting(CRUDBase[SystemSetting, SystemSettingCreate, SystemSettingUpdate]):
    def get_by_key(self, db: Session, *, module: ModuleType, key: str) -> Optional[SystemSetting]:
        return db.query(SystemSetting).filter(
            SystemSetting.module == module,
            SystemSetting.key == key
        ).first()

    def get_by_module(self, db: Session, *, module: ModuleType, enabled_only: bool = True):
        query = db.query(SystemSetting).filter(SystemSetting.module == module)
        if enabled_only:
            query = query.filter(SystemSetting.is_enabled == True)
        return query.all()

    def get_all_enabled(self, db: Session) -> Dict[str, Dict[str, Any]]:
        settings = db.query(SystemSetting).filter(SystemSetting.is_enabled == True).all()
        result = {}
        for s in settings:
            if s.module.value not in result:
                result[s.module.value] = {}
            value = s.value
            if s.value_type == "boolean":
                value = value.lower() == "true" if isinstance(value, str) else bool(value)
            elif s.value_type == "number":
                value = float(value) if value else 0
            elif s.value_type == "integer":
                value = int(value) if value else 0
            elif s.value_type == "json":
                import json
                try:
                    value = json.loads(value) if value else None
                except:
                    pass
            result[s.module.value][s.key] = value
        return result

    def is_module_enabled(self, db: Session, module: ModuleType) -> bool:
        setting = self.get_by_key(db, module=module, key="enabled")
        if setting:
            return setting.value.lower() == "true" if setting.value else False
        return True

    def set_value(self, db: Session, *, module: ModuleType, key: str, value: str, value_type: str = "string", description: str = None) -> SystemSetting:
        existing = self.get_by_key(db, module=module, key=key)
        if existing:
            existing.value = value
            existing.value_type = value_type
            if description:
                existing.description = description
            db.add(existing)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            return self.create(db, obj_in=SystemSettingCreate(
                module=module, key=key, value=value, value_type=value_type, description=description
            ))


crud_setting = CRUDSystemSetting(SystemSetting)
