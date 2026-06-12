from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_user, require_roles
from ..schemas.gap import ConfigCreate, ConfigUpdate, ConfigResponse
from ..models import SystemConfig, ConfigType, User, UserRole

router = APIRouter()


def _seed_default_configs(db: Session):
    if db.query(SystemConfig).count() > 0:
        return
    defaults = [
        (ConfigType.CONTRACT_VERSION, "V1.0", "V1.0", "初始版本（2024版）"),
        (ConfigType.CONTRACT_VERSION, "V2.0", "V2.0", "2025年数据安全法修订版"),
        (ConfigType.CONTRACT_VERSION, "V2.1", "V2.1", "2026年个人信息保护合规版"),
        (ConfigType.RECTIFICATION_PERIOD, "P7", "7", "一般问题整改期限（天）"),
        (ConfigType.RECTIFICATION_PERIOD, "P15", "15", "中等问题整改期限（天）"),
        (ConfigType.RECTIFICATION_PERIOD, "P30", "30", "严重问题整改期限（天）"),
        (ConfigType.RECTIFICATION_PERIOD, "P60", "60", "重大问题整改期限（天）"),
        (ConfigType.RISK_LEVEL, "CRITICAL", "critical", "极高风险-立即整改"),
        (ConfigType.RISK_LEVEL, "HIGH", "high", "高风险-限期整改"),
        (ConfigType.RISK_LEVEL, "MEDIUM", "medium", "中风险-持续改进"),
        (ConfigType.RISK_LEVEL, "LOW", "low", "低风险-观察跟踪"),
        (ConfigType.EFFECTIVE_CONDITION, "EC_HIGH_RISK", "",
         "触发条件：存在≥1个critical或≥3个high缺口", {"critical_min": 1, "high_min": 3, "target_risk": "critical"}),
        (ConfigType.EFFECTIVE_CONDITION, "EC_OVERDUE", "",
         "触发条件：整改超期≥7天自动升级风险等级", {"overdue_days": 7, "upgrade_level": 1}),
        (ConfigType.EFFECTIVE_CONDITION, "EC_AUTO_ASSIGN", "",
         "触发条件：新提交自动分派给空闲律师", {"auto_assign": True, "load_balance": "round_robin"}),
        (ConfigType.CHECKLIST_CATEGORY, "CAT_DATA", "data_compliance", "数据合规模板"),
        (ConfigType.CHECKLIST_CATEGORY, "CAT_PRIVACY", "privacy", "隐私合规模板"),
        (ConfigType.CHECKLIST_CATEGORY, "CAT_SECURITY", "security", "网络安全模板"),
    ]
    for idx, (ct, key, val, desc, *data) in enumerate(defaults):
        cfg = SystemConfig(
            config_type=ct,
            config_key=key,
            config_value=val,
            description=desc,
            config_data=data[0] if data else None,
            is_active=True,
            sort_order=idx,
            created_by=1,
        )
        db.add(cfg)
    db.commit()


@router.get("", response_model=list[ConfigResponse])
def list_configs(
    config_type: Optional[ConfigType] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _seed_default_configs(db)
    q = db.query(SystemConfig)
    if config_type:
        q = q.filter(SystemConfig.config_type == config_type)
    if is_active is not None:
        q = q.filter(SystemConfig.is_active == is_active)
    items = q.order_by(SystemConfig.sort_order.asc(), SystemConfig.id.asc()).all()
    return [ConfigResponse.model_validate(c) for c in items]


@router.get("/grouped")
def grouped_configs(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    _seed_default_configs(db)
    items = db.query(SystemConfig).filter(SystemConfig.is_active == True).all()
    result = {}
    for t in ConfigType:
        result[t.value] = []
    for c in items:
        entry = {
            "id": c.id,
            "key": c.config_key,
            "value": c.config_value,
            "data": c.config_data,
            "description": c.description,
            "effective_start": c.effective_start.isoformat() if c.effective_start else None,
            "effective_end": c.effective_end.isoformat() if c.effective_end else None,
            "sort_order": c.sort_order,
        }
        result.setdefault(c.config_type.value, []).append(entry)
    return result


@router.post("", response_model=ConfigResponse)
def create_config(
    req: ConfigCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN)),
):
    cfg = SystemConfig(
        **req.model_dump(exclude_unset=True),
        created_by=current.id,
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return ConfigResponse.model_validate(cfg)


@router.patch("/{cid}", response_model=ConfigResponse)
def update_config(
    cid: int,
    req: ConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    cfg = db.query(SystemConfig).filter(SystemConfig.id == cid).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="配置不存在")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(cfg, k, v)
    db.commit()
    db.refresh(cfg)
    return ConfigResponse.model_validate(cfg)


@router.delete("/{cid}")
def delete_config(cid: int, db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    cfg = db.query(SystemConfig).filter(SystemConfig.id == cid).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="配置不存在")
    db.delete(cfg)
    db.commit()
    return {"ok": True}
