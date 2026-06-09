#!/usr/bin/env python3
"""
完整演示脚本 - 展示系统完整工作流
包含: 数据生成 → 特征提取 → 模型训练 → 模型注册 → 推理告警 → 人工反馈
"""
import os
import sys
import time
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from data_generator import SensorDataGenerator, DataLoader
from feature_engineer import FeatureExtractor
from model_trainer import AnomalyModelTrainer
from mlflow_manager import MLflowModelManager
from inference_engine import InferenceEngine, AlertManager


def step(message):
    print(f"\n{'='*60}")
    print(f"▶ {message}")
    print('='*60)


def sub_step(message):
    print(f"\n  · {message}...")


def print_stats(name, value, suffix=""):
    print(f"    ✓ {name}: {value}{suffix}")


def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║           工业传感器异常预测系统 - 完整演示流程              ║
╚══════════════════════════════════════════════════════════════╝
""")

    # Step 1: 初始化数据库
    step("Step 1: 初始化数据库")
    sub_step("创建表结构")
    Database.init_tables(drop_first=True)
    print_stats("完成", "数据库所有表已创建并初始化")

    # Step 2: 生成模拟数据
    step("Step 2: 生成模拟传感器数据 (30天)")
    generator = SensorDataGenerator(random_seed=42)
    start_date = datetime.now() - timedelta(days=30)
    sub_step("生成温度/振动/电流/转速数据")
    df = generator.generate_historical_data(
        start_date=start_date,
        days=30,
        anomaly_ratio=0.08,
        drift_ratio=0.04,
        downtime_ratio=0.05,
        insert_to_db=True
    )
    print_stats("总记录数", f"{len(df):,}")
    print_stats("设备数量", df['equipment_id'].nunique())
    print_stats("时间范围", f"{df['timestamp'].min()} 到 {df['timestamp'].max()}")
    label_counts = df['raw_label'].fillna('停机检修').value_counts()
    for label, count in label_counts.items():
        print_stats(f"  {label}", f"{count:,} ({count/len(df)*100:.1f}%)")

    # Step 3: 特征工程
    step("Step 3: 特征工程 (滑动窗口提取)")
    extractor = FeatureExtractor(window_size=60, step_size=10)
    loader = DataLoader()

    sub_step("加载数据(排除停机检修)")
    sensor_df = loader.load_sensor_data(exclude_downtime=True)
    print_stats("有效样本数", f"{len(sensor_df):,}")

    sub_step("提取时域/频域/趋势/交叉特征")
    features_df = extractor.extract_and_save_features(
        sensor_df,
        exclude_downtime=True
    )
    feature_cols = [c for c in features_df.columns if c not in 
                    ['label', 'equipment_id', 'window_start', 'window_end', 'data_version']]
    print_stats("特征维度", len(feature_cols))
    print_stats("窗口数量", f"{len(features_df):,}")
    print_stats("数据版本", features_df['data_version'].iloc[0])
    label_counts = features_df['label'].value_counts()
    for label, count in label_counts.items():
        print_stats(f"  标签[{label}]", f"{count:,}")

    # Step 4: 模型训练
    step("Step 4: 训练异常检测模型 (严格工程师确认准入 + 冷启动种子样本)")
    trainer = AnomalyModelTrainer()

    X = features_df[feature_cols].copy()
    y = features_df['label'].copy()

    sub_step("查看训练集准入状态概览")
    summary = trainer.get_training_dataset_summary()
    print_stats("总FeatureRecord数", f"{summary['total_feature_records']:,}")
    print_stats("  历史未确认(不可训练)", f"{summary['total_unconfirmed_samples']:,}")
    print_stats("  工程师确认(准入训练)", summary['total_allowed_samples'])
    print_stats("严格准入规则", "已启用" if summary['strict_training_rule_enabled'] else "未启用")
    print_stats("训练就绪", "是" if summary['ready_for_training'] else f"否 (还需{max(0, 15 - summary['total_allowed_samples'])}条)")

    sub_step("训练 Gradient Boosting 分类器 (启用冷启动种子样本)")
    result = trainer.train(
        feature_df=X,
        label_series=y,
        model_type="gb",
        test_size=0.2,
        include_feedback=False,
        auto_seed_samples=True,
        description="演示系统初始训练 - 严格准入制 + 冷启动种子"
    )

    model_version = result["model_version"]
    data_version = result["data_version"]
    test_metrics = result["test_metrics"]
    dataset_info = result["dataset_info"]

    print_stats("模型版本", model_version)
    print_stats("数据版本", data_version)
    if dataset_info:
        print_stats("冷启动种子样本", dataset_info.get("seed_samples_generated", 0))
        print_stats("工程师准入样本", dataset_info.get("total_allowed_from_db", 0))
        print_stats("严格训练规则", "是" if dataset_info.get("strict_training_rule") else "否")
    print("\n  📊 测试集指标:")
    print_stats("    准确率 Accuracy", f"{test_metrics['accuracy']*100:.2f}%")
    print_stats("    精确率 Precision(Macro)", f"{test_metrics['precision_macro']*100:.2f}%")
    print_stats("    召回率 Recall(Macro)", f"{test_metrics['recall_macro']*100:.2f}%")
    print_stats("    F1分数 (Macro)", f"{test_metrics['f1_macro']*100:.2f}%")
    print_stats("    ROC AUC", f"{test_metrics['roc_auc']*100:.2f}%")

    cv_metrics = result["cv_metrics"]
    print("\n  🔄 5折交叉验证:")
    print_stats("    CV F1均值", f"{cv_metrics['cv_f1_macro_mean']*100:.2f}%")
    print_stats("    CV F1标准差", f"{cv_metrics['cv_f1_macro_std']*100:.2f}%")

    print("\n  📋 分类别F1:")
    for cls, f1 in test_metrics["f1_per_class"].items():
        print_stats(f"    {cls}", f"{f1*100:.2f}%")

    # Step 5: MLflow 注册模型
    step("Step 5: MLflow 模型注册与版本管理")
    mm = MLflowModelManager()
    sub_step("注册模型到MLflow (或本地注册表)")
    registered_version, model_uri = mm.register_model(
        trainer, result, trained_by="demo_script"
    )
    print_stats("注册的模型版本", registered_version)
    print_stats("模型URI", model_uri)

    sub_step("自动部署当前模型为生产版本")
    mm.deploy_model(registered_version)
    print_stats("部署状态", "已成功部署为线上模型")

    # Step 6: 推理与告警生成
    step("Step 6: 批量推理与告警生成")
    engine = InferenceEngine()
    sub_step("加载已部署模型")
    print_stats("模型就绪", "是" if engine.is_model_ready() else "否")
    print_stats("模型版本", engine._model_version)

    sub_step("执行全设备推理 (回溯最近1天)")
    result_infer = engine.run_batch_inference(
        equipment_ids=None,
        lookback_minutes=1440
    )
    print_stats("处理设备数", result_infer["total_equipment_processed"])
    print_stats("推理窗口数", result_infer["total_inference_results"])
    print_stats("新生成告警数", result_infer["total_new_alerts"])

    # Step 7: 告警查看与人工反馈
    step("Step 7: 告警列表与人工确认模拟 (严格准入训练前置)")
    alerts, total = AlertManager.list_alerts(status=None, limit=100)
    print_stats("总告警数", total)

    if alerts:
        sub_step(f"显示前{min(5, len(alerts))}条告警")
        print(f"    {'ID':<6}{'设备':<12}{'类型':<14}{'置信度':<10}{'状态'}")
        print(f"    {'─'*50}")
        for a in alerts[:5]:
            print(f"    #{a['id']:<5}{a['equipment_id']:<12}{a['alert_type']:<14}"
                  f"{a['confidence']*100:.1f}%{'':<5}{a['status']}")

        sub_step("模拟工程师对告警进行人工确认 (至少20条，满足准入训练阈值)")
        types_available = ["REAL_FAULT", "SENSOR_DRIFT", "FALSE_ALARM"]
        type_names = {"REAL_FAULT": "真实故障", "SENSOR_DRIFT": "传感器漂移", "FALSE_ALARM": "误报"}

        target_count = max(20, min(30, len(alerts)))
        confirmed_ids = []
        for i, a in enumerate(alerts[:target_count]):
            feedback_type = types_available[i % len(types_available)]
            note = f"工程师自动模拟反馈 - {type_names[feedback_type]}"
            AlertManager.submit_feedback(
                alert_id=a['id'],
                feedback_type=feedback_type,
                feedback_user="演示工程师",
                feedback_note=note,
                relabel_from=None
            )
            confirmed_ids.append(a['id'])
            if (i + 1) % 10 == 0:
                print_stats(f"  进度 {i+1}/{target_count}", "已提交工程师确认")

        print(f"\n  共确认 {len(confirmed_ids)} 条告警，已写入 FeatureRecord 标记 source=engineer_confirmed")

        sub_step("查看反馈统计与训练准入状态")
        stats = AlertManager.get_feedback_statistics()
        print_stats("  总反馈数", stats["total_feedback"])
        for fb_type, count in stats["type_counts"].items():
            name = type_names.get(fb_type, fb_type)
            rate = stats["type_rates"].get(fb_type, 0) * 100
            print_stats(f"    {name}", f"{count} ({rate:.1f}%)")

        summary_after = trainer.get_training_dataset_summary()
        print_stats("  准入样本数 (engineer_confirmed + seed)", summary_after['total_allowed_samples'])
        print_stats("  未确认样本数 (raw_label排除)", summary_after['total_unconfirmed_samples'])
        print_stats("  训练就绪状态", "✅ 已就绪" if summary_after['ready_for_training'] else "❌ 未就绪")
        for src, cnt in summary_after.get('by_source_count', {}).items():
            allowed = src in summary_after.get('training_allowed_sources', [])
            print_stats(f"    来源 [{src}]", f"{cnt} {'✓准入' if allowed else '✗排除'}")

    # Step 8: 重新训练 (包含反馈数据)
    step("Step 8: 增量训练 - 纳入人工反馈")
    sub_step("重新训练模型，纳入工程师确认的反馈数据")
    result2 = trainer.train(
        feature_df=None,
        label_series=None,
        model_type="gb",
        include_feedback=True,
        description="增量训练 - 包含最新人工反馈数据"
    )
    new_version = result2["model_version"]
    new_metrics = result2["test_metrics"]
    print_stats("新模型版本", new_version)
    print_stats("使用反馈数", result2["dataset_info"]["used_feedback_count"])
    print_stats("新F1分数", f"{new_metrics['f1_macro']*100:.2f}%")

    sub_step("注册并部署新模型")
    mm.register_model(trainer, result2, trained_by="demo_script_retrain")
    mm.deploy_model(new_version)
    print_stats("已部署", f"模型 {new_version} 已自动部署")

    # 显示模型版本列表
    step("Step 9: 查看模型与数据版本")
    models = mm.list_model_versions()
    print_stats("已注册模型数", len(models))
    print(f"\n  版本列表:")
    for m in models:
        deployed = " 🟢 已部署" if m["is_deployed"] else ""
        print(f"    · {m['version']:<25} F1={m['f1_score']*100:.1f}%  数据={m['training_data_version'] or '-'}{deployed}")

    # 完成
    print("""
╔══════════════════════════════════════════════════════════════╗
║                     🎉 演示流程完成！                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  下一步操作:                                                 ║
║  1. 启动服务: python app.py                                  ║
║  2. 浏览器访问: http://localhost:8080                        ║
║  3. 进入「后台管理」→「系统管理」继续操作                    ║
║                                                              ║
║  主要功能页面:                                               ║
║  · / - 仪表盘 (系统概览)                                     ║
║  · /alerts - 告警管理 (人工确认)                              ║
║  · /monitoring - 模型监控 (反馈趋势)                          ║
║  · /admin - 后台管理 (版本记录)                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断")
        sys.exit(0)
    except Exception as e:
        import traceback
        print(f"\n\n❌ 演示出错: {e}\n")
        traceback.print_exc()
        sys.exit(1)
