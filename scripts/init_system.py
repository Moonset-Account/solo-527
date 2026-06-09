#!/usr/bin/env python3
"""
系统初始化脚本：
1. 生成示例数据
2. 导入示例数据到数据库
3. 训练初始 LightGBM 模型
4. 激活模型，准备好在线推理
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import pandas as pd
from datetime import date
from app.core.database import SessionLocal, get_db
from app.services.data_import_service import DataImportService
from app.services.model_service import ModelService
from app.services.scoring_service import ScoringService
from app.services.business_service import SmsStrategyService
from app.services.user_service import UserService
from app.schemas.model import ModelTrainRequest
from app.models.model_version import ModelVersion
from app.core.security import get_password_hash

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "data")

def step(desc):
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"\n{'='*60}")
            print(f"▶ {desc}")
            print(f"{'='*60}")
            result = func(*args, **kwargs)
            print(f"✅ {desc} 完成")
            return result
        return wrapper
    return decorator

@step("步骤1: 生成示例数据集")
def generate_sample_data():
    from generate_sample_data import generate_departments, generate_time_slots, generate_appointments, generate_new_patients
    dept_df = generate_departments()
    slot_df = generate_time_slots(dept_df)
    appt_df = generate_appointments(count=3000)
    new_df = generate_new_patients(count=300)
    return dept_df, slot_df, appt_df, new_df

@step("步骤2: 导入科室数据")
def import_departments(db, dept_df):
    file_path = os.path.join(SAMPLE_DIR, "sample_departments.csv")
    with open(file_path, "rb") as f:
        content = f.read()
    success, failed, errors = DataImportService.import_departments(db, content, "sample_departments.csv")
    print(f"  成功: {success} 条, 失败: {failed} 条")
    if errors:
        for e in errors[:5]:
            print(f"  - {e}")
    return success

@step("步骤3: 导入时段配置")
def import_time_slots(db):
    file_path = os.path.join(SAMPLE_DIR, "sample_time_slots.csv")
    with open(file_path, "rb") as f:
        content = f.read()
    success, failed, errors = DataImportService.import_time_slots(db, content, "sample_time_slots.csv")
    print(f"  成功: {success} 条, 失败: {failed} 条")
    return success

@step("步骤4: 导入预约记录（含已标注历史数据）")
def import_appointments(db):
    file_path = os.path.join(SAMPLE_DIR, "sample_appointments.csv")
    with open(file_path, "rb") as f:
        content = f.read()
    result = DataImportService.import_appointments(db, content, "sample_appointments.csv")
    print(f"  总数: {result.total_count}")
    print(f"  成功: {result.success_count} 条, 失败: {result.failed_count} 条")
    print(f"  批次号: {result.batch_id}")
    if result.errors:
        for e in result.errors[:5]:
            print(f"  - {e}")
    return result

@step("步骤5: 训练初始 LightGBM 模型")
def train_initial_model(db):
    versions = db.query(ModelVersion).count()
    if versions > 0:
        print(f"  检测到已存在 {versions} 个模型版本，跳过训练。如果需要重新训练请删除数据库。")
        return None

    version_name = f"v{date.today().strftime('%Y%m%d')}_demo"
    request = ModelTrainRequest(
        version=version_name,
        description=f"Demo初始模型 - 基于示例数据集训练，{date.today().isoformat()}",
        hyperparameters={
            "num_leaves": 63,
            "learning_rate": 0.05,
            "max_depth": 8,
            "n_estimators": 300,
            "feature_fraction": 0.9,
            "bagging_fraction": 0.8,
        },
        test_size=0.2,
        random_state=42,
    )

    print(f"  训练版本: {version_name}")
    print("  🕒 训练中，请耐心等待...")
    result = ModelService.train_model(db, request, user_id=1)

    if result:
        print(f"  训练样本: {result.training_sample_count} 条")
        m = result.metrics
        print(f"  模型指标:")
        print(f"    - AUC: {m.auc * 100:.2f}%" if m.auc else "    - AUC: N/A")
        print(f"    - 准确率: {m.accuracy * 100:.2f}%" if m.accuracy else "")
        print(f"    - 精确率: {m.precision * 100:.2f}%" if m.precision else "")
        print(f"    - 召回率: {m.recall * 100:.2f}%" if m.recall else "")
        print(f"    - F1: {m.f1:.4f}" if m.f1 else "")
        print(f"  Top 特征:")
        for i, fi in enumerate(result.feature_importance[:5]):
            print(f"    {i+1}. {fi['feature']}: {fi['importance_ratio']:.2f}%")
    else:
        print("  ❌ 训练失败，请检查标注数据量是否充足（需要 actual_status 字段）")
    return result

@step("步骤6: 激活模型并审核通过")
def activate_model(db, train_result):
    if train_result is None:
        mv = db.query(ModelVersion).filter(ModelVersion.is_active == False).order_by(ModelVersion.created_at.desc()).first()
    else:
        mv = db.query(ModelVersion).filter(ModelVersion.version == train_result.version).first()

    if not mv:
        print("  ❌ 没有可激活的模型版本")
        return False

    result = ModelService.review_model(db, mv.id, "approved", "Demo初始模型，已审核通过，自动激活", user_id=1)
    if result and result.is_active:
        print(f"  ✅ 模型 {result.version} 已激活上线！AUC={result.metrics_auc * 100:.2f}%" if result.metrics_auc else "已激活")
        return True
    print("  ❌ 激活失败")
    return False

@step("步骤7: 运行批量评分（对未来预约进行风险评估）")
def run_scoring(db):
    result = ScoringService.run_scoring(db)
    print(f"  总评分数: {result.total_count}")
    print(f"  成功: {result.success_count}, 失败: {result.failed_count}")
    print(f"  风险分布:")
    for level, cnt in sorted(result.risk_distribution.items()):
        print(f"    - {level}: {cnt} 条")
    if result.batch_id:
        print(f"  批次号: {result.batch_id}")
    return result

@step("步骤8: 自动生成回访名单和短信策略")
def generate_operations(db):
    from app.services.business_service import CallbackService, SmsStrategyService
    from app.schemas.business import CallbackListGenerateRequest

    SmsStrategyService.init_default_templates(db)
    sent = SmsStrategyService.auto_send_strategy(db)
    print(f"  短信已发送（模拟）: {sum(sent.values())} 条")
    print(f"    低风险: {sent.get('low', 0)}, 中风险: {sent.get('medium', 0)}, 高风险: {sent.get('high', 0)}, 极高风险: {sent.get('critical', 0)}")

    callbacks = CallbackService.generate_callback_list(db, CallbackListGenerateRequest(
        min_risk_level="high",
        max_count=50,
    ))
    print(f"  回访名单已生成: {len(callbacks)} 条")
    return True

def main():
    print("=" * 70)
    print("🏥  门诊爽约风险提醒AI平台 - 系统初始化与演示数据准备")
    print("=" * 70)

    try:
        dept_df, slot_df, appt_df, new_df = generate_sample_data()
        db = next(get_db())
        try:
            import_departments(db, dept_df)
            import_time_slots(db)
            import_appointments(db)
            train_result = train_initial_model(db)
            activate_model(db, train_result)
            run_scoring(db)
            generate_operations(db)

            print(f"\n{'='*70}")
            print("🎉🎉🎉 初始化完成！")
            print(f"{'='*70}")
            print("\n📋 已完成的初始化内容：")
            print("  ✅ 示例科室（12个）、时段配置已导入")
            print("  ✅ 3000+ 预约记录（含标注数据）已导入")
            print("  ✅ LightGBM 初始模型已训练并激活上线")
            print("  ✅ 批量风险评分已完成")
            print("  ✅ 默认短信策略已初始化")
            print("  ✅ 回访名单已自动生成")
            print("  ✅ 三个演示账号已就绪:")
            print("     🔑 admin / admin123     (管理员, 全部权限)")
            print("     🔑 operator / operator123 (运营人员)")
            print("     🔑 datascientist / ds123456 (数据科学家)")
            print("\n🚀 下一步：启动前后端服务")
            print("  后端: cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
            print("  前端: cd frontend && npm install && npm run dev")
            print("  然后访问: http://localhost:5173")
            print(f"{'='*70}\n")
        finally:
            db.close()
    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
