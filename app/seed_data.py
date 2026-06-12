from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models
from app.security import hash_password
from app.services import (
    HarvestChainService,
    SubsidyBatchChainService,
    SortingService,
    MonitorAlertService,
)
from app.config import settings


def seed_all():
    db = SessionLocal()
    try:
        _seed_users(db)
        _seed_plots(db)
        _seed_varieties(db)
        _seed_thresholds(db)
        _seed_harvests_and_chain(db)
        _seed_subsidy(db)
        _seed_sorting_diffs(db)
        db.commit()
        print(f"[seed] 演示数据初始化完成 (RUN_MODE={settings.run_mode})")
    except Exception as e:
        db.rollback()
        print(f"[seed] 初始化失败: {e}")
        raise
    finally:
        db.close()


def _seed_users(db: Session):
    if db.query(models.User).count() > 0:
        return
    users = [
        {
            "username": "admin",
            "email": "admin@orchard.local",
            "full_name": "系统管理员",
            "password": "admin123",
            "role": models.UserRole.ADMIN,
            "phone": "13800000001",
        },
        {
            "username": "farmer",
            "email": "farmer@orchard.local",
            "full_name": "李农场主",
            "password": "farmer123",
            "role": models.UserRole.FARMER,
            "phone": "13800000002",
        },
        {
            "username": "worker",
            "email": "worker@orchard.local",
            "full_name": "张工人",
            "password": "worker123",
            "role": models.UserRole.WORKER,
            "phone": "13800000003",
        },
        {
            "username": "auditor",
            "email": "auditor@orchard.local",
            "full_name": "王审核员",
            "password": "auditor123",
            "role": models.UserRole.AUDITOR,
            "phone": "13800000004",
        },
    ]
    for u in users:
        db.add(models.User(
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
            phone=u["phone"],
            is_active=True,
            created_by=1,
            updated_by=1,
        ))
    db.flush()
    print("[seed] 创建 4 个用户: admin/farmer/worker/auditor (密码同用户名)")


def _seed_plots(db: Session):
    if db.query(models.Plot).count() > 0:
        return
    plots = [
        {"code": "P-A01", "name": "东坡A区", "area_mu": 50.0, "location": "东山坡", "soil_type": "红壤"},
        {"code": "P-B02", "name": "西坡B区", "area_mu": 35.0, "location": "西山坡", "soil_type": "沙壤"},
        {"code": "P-C03", "name": "南谷C区", "area_mu": 80.0, "location": "南山谷", "soil_type": "水稻土"},
    ]
    for p in plots:
        db.add(models.Plot(**p, created_by=1, updated_by=1))
    db.flush()
    print("[seed] 创建 3 个地块")


def _seed_varieties(db: Session):
    if db.query(models.Variety).count() > 0:
        return
    varieties = [
        {"code": "V-RED-01", "name": "红富士苹果", "fruit_type": "苹果", "plot_id": 1,
         "plant_date": date(2020, 3, 15), "expected_yield_kg": 1800.0, "maturity_days": 150,
         "description": "晚熟品种，着色好，甜度高"},
        {"code": "V-GALA-02", "name": "嘎啦苹果", "fruit_type": "苹果", "plot_id": 1,
         "plant_date": date(2021, 4, 1), "expected_yield_kg": 1500.0, "maturity_days": 120,
         "description": "中熟品种，肉质脆"},
        {"code": "V-PEAR-03", "name": "翠冠梨", "fruit_type": "梨", "plot_id": 2,
         "plant_date": date(2019, 2, 20), "expected_yield_kg": 2200.0, "maturity_days": 110,
         "description": "早熟梨，品质优"},
        {"code": "V-PEACH-04", "name": "水蜜桃", "fruit_type": "桃", "plot_id": 3,
         "plant_date": date(2020, 3, 10), "expected_yield_kg": 1600.0, "maturity_days": 95,
         "description": "软溶质，汁多味甜"},
    ]
    for v in varieties:
        db.add(models.Variety(**v, is_active=True, created_by=1, updated_by=1))
    db.flush()
    print("[seed] 创建 4 个品种")


def _seed_thresholds(db: Session):
    if db.query(models.Threshold).count() > 0:
        return
    default_thresholds = [
        {"variety_id": 1, "metric": "temperature_c", "min_value": 15.0, "max_value": 32.0,
         "alert_level": models.AlertLevel.WARNING, "description": "苹果适宜温度"},
        {"variety_id": 1, "metric": "humidity_pct", "min_value": 40.0, "max_value": 85.0,
         "alert_level": models.AlertLevel.INFO, "description": "苹果适宜湿度"},
        {"variety_id": 2, "metric": "temperature_c", "min_value": 15.0, "max_value": 32.0,
         "alert_level": models.AlertLevel.WARNING, "description": "嘎啦苹果适宜温度"},
        {"variety_id": 2, "metric": "humidity_pct", "min_value": 45.0, "max_value": 80.0,
         "alert_level": models.AlertLevel.INFO},
        {"variety_id": 3, "metric": "temperature_c", "min_value": 12.0, "max_value": 30.0,
         "alert_level": models.AlertLevel.WARNING, "description": "梨适宜温度"},
        {"variety_id": 3, "metric": "soil_moisture_pct", "min_value": 25.0, "max_value": 65.0,
         "alert_level": models.AlertLevel.CRITICAL, "description": "土壤水分临界值"},
        {"variety_id": 4, "metric": "temperature_c", "min_value": 18.0, "max_value": 33.0,
         "alert_level": models.AlertLevel.WARNING, "description": "桃适宜温度"},
        {"variety_id": 4, "metric": "rainfall_mm", "max_value": 50.0,
         "alert_level": models.AlertLevel.CRITICAL, "description": "日降雨量过高影响品质"},
    ]
    for t in default_thresholds:
        db.add(models.Threshold(**t, is_active=True, created_by=1, updated_by=1))
    db.flush()
    print("[seed] 创建 8 条阈值规则")


def _seed_harvests_and_chain(db: Session):
    if db.query(models.HarvestRecord).count() > 0:
        return
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    farmer = db.query(models.User).filter(models.User.username == "farmer").first()
    worker = db.query(models.User).filter(models.User.username == "worker").first()

    harvest_data_list = [
        {
            "code": "H-20250601-A",
            "plot_id": 1,
            "variety_id": 1,
            "harvest_date": date(2025, 6, 1),
            "status": "completed",
            "weather": "晴",
            "temperature_c": 26.5,
            "humidity_pct": 62.0,
            "workers_count": 8,
            "actual_yield_kg": 4200.0,
            "quality_score": 88.5,
            "notes": "红富士采收，着色均匀",
            "run_auto_chain": True,
        },
        {
            "code": "H-20250605-B",
            "plot_id": 1,
            "variety_id": 2,
            "harvest_date": date(2025, 6, 5),
            "status": "in_progress",
            "weather": "多云",
            "temperature_c": 34.0,
            "humidity_pct": 75.0,
            "workers_count": 6,
            "actual_yield_kg": 2800.0,
            "quality_score": 82.0,
            "notes": "嘎啦苹果高温下采收",
            "run_auto_chain": True,
        },
        {
            "code": "H-20250610-C",
            "plot_id": 2,
            "variety_id": 3,
            "harvest_date": date(2025, 6, 10),
            "status": "completed",
            "weather": "小雨",
            "temperature_c": 22.0,
            "humidity_pct": 88.0,
            "workers_count": 10,
            "actual_yield_kg": 6500.0,
            "quality_score": 90.0,
            "notes": "翠冠梨采收",
            "run_auto_chain": True,
        },
    ]

    for data in harvest_data_list:
        harvest = HarvestChainService.create_harvest(db, data, farmer.id)
        db.flush()
        db.refresh(harvest)

        batch_data_list = [
            {
                "code": f"{data['code']}-B1",
                "harvest_id": harvest.id,
                "variety_id": data["variety_id"],
                "batch_date": data["harvest_date"],
                "status": "packed",
                "weight_kg": round(data["actual_yield_kg"] * 0.6, 2),
                "container_count": 24,
                "storage_location": "A区冷库-01",
                "quality_grade": "一级",
                "handler_id": worker.id,
                "notes": "第一批，优选",
                "run_auto_chain": True,
            },
            {
                "code": f"{data['code']}-B2",
                "harvest_id": harvest.id,
                "variety_id": data["variety_id"],
                "batch_date": data["harvest_date"] + timedelta(days=1),
                "status": "sorting",
                "weight_kg": round(data["actual_yield_kg"] * 0.4, 2),
                "container_count": 16,
                "storage_location": "B区暂存",
                "quality_grade": "二级",
                "handler_id": worker.id,
                "notes": "第二批，待分选",
                "run_auto_chain": True,
            },
        ]
        for b_data in batch_data_list:
            HarvestChainService.create_batch(db, b_data, worker.id)
            db.flush()

    db.flush()
    print("[seed] 创建 3 条采收记录，6 个批次，自动触发阈值告警和产量预测")


def _seed_subsidy(db: Session):
    if db.query(models.SubsidyVoucher).count() > 0:
        return
    farmer = db.query(models.User).filter(models.User.username == "farmer").first()
    auditor = db.query(models.User).filter(models.User.username == "auditor").first()

    vouchers = [
        {
            "code": "SUB-2025-001",
            "harvest_id": 1,
            "batch_id": 1,
            "variety_id": 1,
            "subsidy_type": "果品提质补贴",
            "amount": 3500.00,
            "applicant_id": farmer.id,
            "documents_ref": "/docs/sub-001.pdf",
        },
        {
            "code": "SUB-2025-002",
            "harvest_id": 2,
            "batch_id": 3,
            "variety_id": 2,
            "subsidy_type": "救灾复产补贴",
            "amount": 2200.00,
            "applicant_id": farmer.id,
            "documents_ref": "/docs/sub-002.pdf",
        },
    ]
    for v in vouchers:
        SubsidyBatchChainService.create_subsidy_voucher(db, v, farmer.id)
        db.flush()

    voucher1 = db.query(models.SubsidyVoucher).filter(models.SubsidyVoucher.code == "SUB-2025-001").first()
    if voucher1:
        SubsidyBatchChainService.review_subsidy(
            db, voucher1.id, auditor.id, "approved", "材料齐全，符合补贴条件"
        )
        db.flush()
        SubsidyBatchChainService.review_subsidy(
            db, voucher1.id, auditor.id, "paid", "已打款至农商行账户"
        )
        db.flush()
    print("[seed] 创建 2 条补贴凭证，1 条已支付")


def _seed_sorting_diffs(db: Session):
    if db.query(models.SortingDifference).count() > 0:
        return
    worker = db.query(models.User).filter(models.User.username == "worker").first()
    auditor = db.query(models.User).filter(models.User.username == "auditor").first()

    diffs = [
        {
            "batch_id": 2,
            "harvest_id": 1,
            "variety_id": 1,
            "reported_weight_kg": 1680.0,
            "actual_weight_kg": 1590.0,
            "reported_grade": "一级",
            "actual_grade": "二级",
            "remarks": "上报与实际分选差异约5%，部分果品有轻微碰伤",
            "result": "discounted",
            "social_impact": "none",
            "impact_description": "内部处理，未对外",
            "handled_by": worker.id,
            "resolution": "按二级价格结算，记作业失误一次",
        },
        {
            "batch_id": 4,
            "harvest_id": 2,
            "variety_id": 2,
            "reported_weight_kg": 1120.0,
            "actual_weight_kg": 1020.0,
            "reported_grade": "一级",
            "actual_grade": "三级",
            "remarks": "高温导致部分果品晒伤，等级差异显著",
            "result": "rejected",
            "social_impact": "consumer_complaint",
            "impact_description": "少量流入市场后收到3起消费者投诉",
            "handled_by": auditor.id,
            "resolution": "全批次退回，启动消费者赔付",
        },
        {
            "batch_id": 6,
            "harvest_id": 3,
            "variety_id": 3,
            "reported_weight_kg": 2600.0,
            "actual_weight_kg": 2580.0,
            "reported_grade": "一级",
            "actual_grade": "一级",
            "remarks": "小重量误差，在正常范围",
            "result": "accepted",
            "social_impact": "community_positive",
            "impact_description": "翠冠梨品质获当地社区好评，获评当季推荐果品",
            "handled_by": worker.id,
            "resolution": "正常入库，作为标杆批次",
        },
    ]
    for d in diffs:
        SortingService.create_sorting_diff(db, d, d["handled_by"])
        db.flush()
    print("[seed] 创建 3 条分选差异记录（含社会影响统计）")


if __name__ == "__main__":
    seed_all()
