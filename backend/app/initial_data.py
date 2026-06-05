from sqlalchemy.orm import Session
from datetime import date, timedelta
from . import crud, models, schemas
from .models.user import UserRole
from .models.reagent import HazardLevel, ReagentCategory
from .models.storage import CabinetType
from .services import logger


def init_db(db: Session) -> None:
    user_count = crud.user.count(db)
    if user_count > 0:
        logger.info("数据库已有数据，跳过初始化")
        return
    
    logger.info("开始初始化测试数据...")
    
    admin1 = crud.user.create(db, obj_in=schemas.UserCreate(
        username="admin",
        email="admin@lab.com",
        full_name="系统管理员",
        password="admin123",
        role=UserRole.ADMIN,
        phone="13800138001",
        department="实验室管理处"
    ))
    
    admin2 = crud.user.create(db, obj_in=schemas.UserCreate(
        username="manager",
        email="manager@lab.com",
        full_name="张经理",
        password="manager123",
        role=UserRole.ADMIN,
        phone="13800138002",
        department="化学实验室"
    ))
    
    member1 = crud.user.create(db, obj_in=schemas.UserCreate(
        username="researcher1",
        email="researcher1@lab.com",
        full_name="李研究员",
        password="research123",
        role=UserRole.MEMBER,
        phone="13800138003",
        department="材料科学实验室"
    ))
    
    member2 = crud.user.create(db, obj_in=schemas.UserCreate(
        username="researcher2",
        email="researcher2@lab.com",
        full_name="王博士",
        password="research123",
        role=UserRole.MEMBER,
        phone="13800138004",
        department="生物实验室"
    ))
    
    external = crud.user.create(db, obj_in=schemas.UserCreate(
        username="supplier",
        email="supplier@company.com",
        full_name="供应商联系人",
        password="supplier123",
        role=UserRole.EXTERNAL,
        phone="13900139001",
        department="外部供应商"
    ))
    
    logger.info("用户数据初始化完成")
    
    cabinets = [
        {"name": "普通试剂柜A", "code": "CAB-001", "type": CabinetType.GENERAL, "location": "化学实验室101室"},
        {"name": "易燃品柜", "code": "CAB-002", "type": CabinetType.FLAMMABLE, "location": "化学实验室101室"},
        {"name": "腐蚀品柜", "code": "CAB-003", "type": CabinetType.CORROSIVE, "location": "化学实验室102室"},
        {"name": "毒品柜", "code": "CAB-004", "type": CabinetType.TOXIC, "location": "化学实验室103室"},
        {"name": "冷藏柜", "code": "CAB-005", "type": CabinetType.REFRIGERATOR, "location": "生物实验室201室", "temperature_min": 2, "temperature_max": 8},
        {"name": "冷冻柜", "code": "CAB-006", "type": CabinetType.FREEZER, "location": "生物实验室201室", "temperature_min": -20, "temperature_max": -10},
    ]
    
    cabinet_objs = []
    for cab in cabinets:
        cabinet = crud.storage_cabinet.create(db, obj_in=schemas.StorageCabinetCreate(**cab), created_by=admin1.id)
        cabinet_objs.append(cabinet)
    
    logger.info("柜位数据初始化完成")
    
    reagents_data = [
        {
            "name": "乙醇", "english_name": "Ethanol", "cas_number": "64-17-5",
            "molecular_formula": "C2H5OH", "category": ReagentCategory.ORGANIC,
            "hazard_level": HazardLevel.LOW, "specification": "分析纯 500ml",
            "manufacturer": "国药集团", "supplier": "上海化学试剂厂",
            "unit": "瓶", "min_stock": 5, "description": "常用有机溶剂",
            "safety_notes": "易燃，远离火源", "storage_conditions": "阴凉干燥处",
            "requires_double_confirm": False
        },
        {
            "name": "浓硫酸", "english_name": "Sulfuric Acid", "cas_number": "7664-93-9",
            "molecular_formula": "H2SO4", "category": ReagentCategory.ACID,
            "hazard_level": HazardLevel.HIGH, "specification": "分析纯 500ml",
            "manufacturer": "国药集团", "supplier": "上海化学试剂厂",
            "unit": "瓶", "min_stock": 2, "description": "强腐蚀性酸",
            "safety_notes": "强腐蚀，佩戴防护装备", "storage_conditions": "腐蚀品柜，与碱隔离",
            "requires_double_confirm": True
        },
        {
            "name": "氢氧化钠", "english_name": "Sodium Hydroxide", "cas_number": "1310-73-2",
            "molecular_formula": "NaOH", "category": ReagentCategory.ALKALI,
            "hazard_level": HazardLevel.MEDIUM, "specification": "分析纯 500g",
            "manufacturer": "国药集团", "supplier": "天津化学试剂厂",
            "unit": "瓶", "min_stock": 3, "description": "常用强碱",
            "safety_notes": "腐蚀性，避免接触皮肤", "storage_conditions": "密封干燥保存",
            "requires_double_confirm": False
        },
        {
            "name": "甲醇", "english_name": "Methanol", "cas_number": "67-56-1",
            "molecular_formula": "CH3OH", "category": ReagentCategory.ORGANIC,
            "hazard_level": HazardLevel.HIGH, "specification": "色谱纯 4L",
            "manufacturer": "Merck", "supplier": "西格玛奥德里奇",
            "unit": "瓶", "min_stock": 2, "description": "HPLC级溶剂",
            "safety_notes": "有毒，易燃，避免吸入", "storage_conditions": "易燃品柜",
            "requires_double_confirm": True
        },
        {
            "name": "氯化钠", "english_name": "Sodium Chloride", "cas_number": "7647-14-5",
            "molecular_formula": "NaCl", "category": ReagentCategory.INORGANIC,
            "hazard_level": HazardLevel.NONE, "specification": "分析纯 500g",
            "manufacturer": "国药集团", "supplier": "上海化学试剂厂",
            "unit": "瓶", "min_stock": 10, "description": "常用盐类",
            "safety_notes": "无特殊危害", "storage_conditions": "常温保存",
            "requires_double_confirm": False
        },
        {
            "name": "三氯甲烷", "english_name": "Chloroform", "cas_number": "67-66-3",
            "molecular_formula": "CHCl3", "category": ReagentCategory.ORGANIC,
            "hazard_level": HazardLevel.EXTREME, "specification": "分析纯 500ml",
            "manufacturer": "国药集团", "supplier": "上海化学试剂厂",
            "unit": "瓶", "min_stock": 1, "description": "有毒有机溶剂",
            "safety_notes": "剧毒，致癌物，通风橱操作", "storage_conditions": "毒品柜，双人双锁",
            "requires_double_confirm": True
        },
        {
            "name": "胰蛋白酶", "english_name": "Trypsin", "cas_number": "9002-07-7",
            "category": ReagentCategory.BIOLOGICAL,
            "hazard_level": HazardLevel.LOW, "specification": "1:250 100g",
            "manufacturer": "Sigma", "supplier": "西格玛奥德里奇",
            "unit": "瓶", "min_stock": 2, "description": "生物实验用酶",
            "safety_notes": "避免吸入", "storage_conditions": "2-8℃冷藏",
            "requires_double_confirm": False
        },
    ]
    
    reagent_objs = []
    for r_data in reagents_data:
        reagent = crud.reagent.create(db, obj_in=schemas.ReagentCreate(**r_data), created_by=admin1.id)
        reagent_objs.append(reagent)
    
    logger.info("试剂数据初始化完成")
    
    today = date.today()
    
    batches_data = [
        {"reagent_idx": 0, "batch_number": "20240101", "quantity": 20, "unit_price": 45.0,
         "production_date": today - timedelta(days=60), "expiry_date": today + timedelta(days=365*3),
         "storage_cabinet_idx": 0, "shelf_position": "A-1"},
        {"reagent_idx": 0, "batch_number": "20240215", "quantity": 10, "unit_price": 48.0,
         "production_date": today - timedelta(days=30), "expiry_date": today + timedelta(days=365*2),
         "storage_cabinet_idx": 1, "shelf_position": "B-2"},
        {"reagent_idx": 1, "batch_number": "SA2024001", "quantity": 5, "unit_price": 85.0,
         "production_date": today - timedelta(days=90), "expiry_date": today + timedelta(days=365*2),
         "storage_cabinet_idx": 2, "shelf_position": "C-1"},
        {"reagent_idx": 1, "batch_number": "SA2024002", "quantity": 8, "unit_price": 88.0,
         "production_date": today - timedelta(days=15), "expiry_date": today + timedelta(days=365*3),
         "storage_cabinet_idx": 2, "shelf_position": "C-2"},
        {"reagent_idx": 2, "batch_number": "NaOH202401", "quantity": 15, "unit_price": 35.0,
         "production_date": today - timedelta(days=120), "expiry_date": today + timedelta(days=365*5),
         "storage_cabinet_idx": 0, "shelf_position": "A-3"},
        {"reagent_idx": 3, "batch_number": "MeOH202401", "quantity": 4, "unit_price": 520.0,
         "production_date": today - timedelta(days=45), "expiry_date": today + timedelta(days=365*2),
         "storage_cabinet_idx": 1, "shelf_position": "B-1"},
        {"reagent_idx": 4, "batch_number": "NaCl2024001", "quantity": 25, "unit_price": 25.0,
         "production_date": today - timedelta(days=180), "expiry_date": today + timedelta(days=365*5),
         "storage_cabinet_idx": 0, "shelf_position": "A-2"},
        {"reagent_idx": 5, "batch_number": "CHL202301", "quantity": 2, "unit_price": 380.0,
         "production_date": today - timedelta(days=365), "expiry_date": today + timedelta(days=30),
         "storage_cabinet_idx": 3, "shelf_position": "D-1"},
        {"reagent_idx": 5, "batch_number": "CHL202401", "quantity": 3, "unit_price": 395.0,
         "production_date": today - timedelta(days=60), "expiry_date": today + timedelta(days=365),
         "storage_cabinet_idx": 3, "shelf_position": "D-2"},
        {"reagent_idx": 6, "batch_number": "TRY202401", "quantity": 8, "unit_price": 1280.0,
         "production_date": today - timedelta(days=30), "expiry_date": today + timedelta(days=180),
         "storage_cabinet_idx": 4, "shelf_position": "E-1"},
        {"reagent_idx": 0, "batch_number": "20231201", "quantity": 2, "unit_price": 42.0,
         "production_date": today - timedelta(days=180), "expiry_date": today - timedelta(days=10),
         "storage_cabinet_idx": 0, "shelf_position": "A-1"},
    ]
    
    for b_data in batches_data:
        b_data["reagent_id"] = reagent_objs[b_data.pop("reagent_idx")].id
        b_data["storage_cabinet_id"] = cabinet_objs[b_data.pop("storage_cabinet_idx")].id
        batch_in = schemas.ReagentBatchCreate(**b_data)
        crud.reagent_batch.create(db, obj_in=batch_in, created_by=admin1.id)
    
    logger.info("试剂批次数据初始化完成")
    
    req_items1 = [
        schemas.RequisitionItemCreate(reagent_batch_id=1, quantity=2, purpose="合成实验", remarks="需要无水乙醇"),
        schemas.RequisitionItemCreate(reagent_batch_id=5, quantity=1, purpose="缓冲液配置", remarks=""),
    ]
    req1 = crud.requisition.create(db, obj_in=schemas.RequisitionCreate(
        title="有机合成实验领用",
        purpose="化合物合成项目",
        priority="normal",
        items=req_items1
    ), created_by=member1.id)
    
    req_items2 = [
        schemas.RequisitionItemCreate(reagent_batch_id=2, quantity=1, purpose="HPLC分析", remarks="色谱纯"),
    ]
    req2 = crud.requisition.create(db, obj_in=schemas.RequisitionCreate(
        title="色谱分析领用",
        purpose="样品纯度检测",
        priority="high",
        items=req_items2
    ), created_by=member2.id)
    
    crud.requisition.confirm(db, requisition_id=req2.id, confirmer_id=admin1.id, is_first=True)
    crud.requisition.confirm(db, requisition_id=req2.id, confirmer_id=admin2.id, is_first=False)
    crud.requisition.approve(db, requisition_id=req2.id, approver_id=admin1.id)
    
    logger.info("领用申请数据初始化完成")
    
    check1 = crud.inventory_check.create(db, obj_in=schemas.InventoryCheckCreate(
        title="2024年第一季度盘点",
        type="full",
        remarks="季度例行盘点"
    ), created_by=admin1.id)
    
    logger.info("盘点任务数据初始化完成")
    logger.info("所有测试数据初始化完成！")
    logger.info("=" * 60)
    logger.info("测试账号:")
    logger.info("  管理员: admin / admin123")
    logger.info("  管理员: manager / manager123")
    logger.info("  研究员: researcher1 / research123")
    logger.info("  研究员: researcher2 / research123")
    logger.info("  外部用户: supplier / supplier123")
    logger.info("=" * 60)
