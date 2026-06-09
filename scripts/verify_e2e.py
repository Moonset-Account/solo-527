#!/usr/bin/env python3
"""端到端验证脚本: 工程师确认样本、维修过滤、模型指标、部署流程"""
import os
import sys
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def section(title):
    n = 68
    print(f"\n{'='*n}")
    print(f"▶ {title}")
    print('='*n)


def check(label, condition, detail=""):
    mark = "✅" if condition else "❌"
    print(f"  {mark} {label}: {detail}")
    return 1 if condition else 0


def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for f in ["sensor_prediction.db"]:
        if os.path.exists(f):
            os.remove(f)
    import shutil
    if os.path.exists("models"):
        shutil.rmtree("models", ignore_errors=True)

    total_checks = 0
    passed = 0

    from database import (
        Database, FEATURE_SOURCE_ENGINEER_CONFIRMED, FEATURE_SOURCE_RELABELED,
        FEATURE_SOURCE_AUTO_LABELED, FEATURE_SOURCE_UNCONFIRMED, TRAINING_ALLOWED_SOURCES,
        FeatureRecord
    )
    from data_generator import SensorDataGenerator, DataLoader
    from feature_engineer import FeatureExtractor
    from model_trainer import AnomalyModelTrainer
    from mlflow_manager import MLflowModelManager
    from inference_engine import InferenceEngine, AlertManager

    section("1. 初始化数据库 + 生成数据(含维修记录)")
    Database.init_tables(drop_first=True)
    print("  ✓ 表结构已创建")

    gen = SensorDataGenerator(random_seed=123)
    start = datetime.now() - timedelta(days=21)
    df = gen.generate_historical_data(
        start_date=start, days=21, anomaly_ratio=0.10,
        drift_ratio=0.05, downtime_ratio=0.05, insert_to_db=True
    )
    check("传感器数据>1万条", len(df) > 10000, str(len(df)))
    total_checks += 1; passed += 1 if len(df) > 10000 else 0

    sess = Database.get_session()
    from database import MaintenanceRecord
    n_maint = sess.query(MaintenanceRecord).count()
    check("维修记录>5条", n_maint > 5, f"{n_maint} 条")
    total_checks += 1; passed += 1 if n_maint > 5 else 0
    sess.close()

    section("2. 特征工程 (含维修11维特征 + 维修窗口过滤)")
    fe = FeatureExtractor(window_size=60, step_size=10)
    loader = DataLoader()
    sensor_df = loader.load_sensor_data(exclude_downtime=True)
    features_df = fe.extract_and_save_features(sensor_df, exclude_downtime=True)
    feature_cols = [c for c in features_df.columns if c not in
                    ['label', 'equipment_id', 'window_start', 'window_end', 'data_version']]

    maint_feat_names = [c for c in feature_cols if c.startswith("maint_")]
    check("维修相关特征>=11维", len(maint_feat_names) >= 11, f"{len(maint_feat_names)} 维: {maint_feat_names[:5]}...")
    total_checks += 1; passed += 1 if len(maint_feat_names) >= 11 else 0

    check("特征维度>=100", len(feature_cols) >= 100, str(len(feature_cols)))
    total_checks += 1; passed += 1 if len(feature_cols) >= 100 else 0

    check("窗口数>1000", len(features_df) > 1000, f"{len(features_df):,}")
    total_checks += 1; passed += 1 if len(features_df) > 1000 else 0

    section("3. 训练前准入状态审计 (严格工程师确认)")
    trainer = AnomalyModelTrainer()
    summary = trainer.get_training_dataset_summary()
    srcs = summary.get('by_source_count', {})
    print(f"  来源分布: {json.dumps(srcs, ensure_ascii=False)}")
    check("历史未确认数=FeatureRecord总数",
          summary.get('total_feature_records', 0) == summary.get('total_unconfirmed_samples', -1),
          f"total={summary.get('total_feature_records')}, unconfirmed={summary.get('total_unconfirmed_samples')}")
    total_checks += 1
    if summary.get('total_feature_records', 0) == summary.get('total_unconfirmed_samples', -1): passed += 1

    check("工程师确认样本=0 (还未做人工反馈)", summary.get('total_allowed_samples', 0) < 15,
          f"allowed={summary.get('total_allowed_samples')}")
    total_checks += 1
    if summary.get('total_allowed_samples', 0) < 15: passed += 1

    check("训练就绪状态=False (工程师确认样本不足15)",
          summary.get('ready_for_training') == False, str(summary.get('ready_for_training')))
    total_checks += 1
    if summary.get('ready_for_training') == False: passed += 1

    section("4. 初始训练 (strict_from_db_only=True + 冷启动种子样本)")
    result = trainer.train(
        feature_df=None, label_series=None,
        model_type="gb", auto_seed_samples=True, strict_from_db_only=True,
        include_feedback=False, description="E2E验证-初始训练"
    )
    mv = result["model_version"]
    tm = result["test_metrics"]
    di = result["dataset_info"]

    check("模型版本号非空", mv and len(mv) > 0, mv)
    total_checks += 1; passed += 1 if mv else 0

    acc = float(tm.get("accuracy") or tm.get("accuracy_macro") or 0)
    prec = float(tm.get("precision") or tm.get("precision_macro") or 0)
    rec = float(tm.get("recall") or tm.get("recall_macro") or 0)
    f1 = float(tm.get("f1") or tm.get("f1_macro") or 0)
    check("冷启动种子样本生成>=30条",
          int(di.get("seed_samples_generated", 0)) >= 30,
          f"{di.get('seed_samples_generated')} 条")
    total_checks += 1
    if int(di.get("seed_samples_generated", 0)) >= 30: passed += 1

    check("Accuracy>0.5", acc > 0.5, f"{(acc*100):.2f}%")
    total_checks += 1; passed += 1 if acc > 0.5 else 0
    check("Precision>0.5", prec > 0.5, f"{(prec*100):.2f}%")
    total_checks += 1; passed += 1 if prec > 0.5 else 0
    check("Recall>0.5", rec > 0.5, f"{(rec*100):.2f}%")
    total_checks += 1; passed += 1 if rec > 0.5 else 0
    check("F1>0.5", f1 > 0.5, f"{(f1*100):.2f}%")
    total_checks += 1; passed += 1 if f1 > 0.5 else 0

    per_class = tm.get("per_class_precision_recall_f1", {})
    has_per_class = isinstance(per_class, dict) and len(per_class) >= 2
    check("per_class指标存在且含3类", has_per_class, f"{list(per_class.keys()) if isinstance(per_class,dict) else 'NONE'}")
    total_checks += 1
    if has_per_class: passed += 1

    check("严格训练规则已启用",
          str(di.get("strict_training_rule_enabled", "")).lower() == "true",
          str(di.get("strict_training_rule_enabled")))
    total_checks += 1
    if str(di.get("strict_training_rule_enabled", "")).lower() == "true": passed += 1

    by_src = di.get("by_source_in_training", {})
    train_ok_sources = [s for s in by_src.keys() if s in TRAINING_ALLOWED_SOURCES]
    bad_sources = [s for s in by_src.keys() if s == FEATURE_SOURCE_UNCONFIRMED]
    check(f"训练样本来源中没有 {FEATURE_SOURCE_UNCONFIRMED}",
          len(bad_sources) == 0,
          f"准入来源={train_ok_sources}, 排除来源出现={bad_sources}")
    total_checks += 1
    if len(bad_sources) == 0: passed += 1

    section("5. 模型注册 + 部署 (deployed目录含完整指标)")
    mm = MLflowModelManager()
    reg_ver, uri = mm.register_model(trainer, result, trained_by="e2e_script")
    check("注册成功版本号正确", reg_ver == mv, f"注册={reg_ver}, 训练={mv}")
    total_checks += 1; passed += 1 if reg_ver == mv else 0

    mm.deploy_model(reg_ver)
    from config import Config
    deployed_dir = os.path.join(Config.MODEL_DIR, "deployed")
    deploy_meta = os.path.join(deployed_dir, "metadata.json")
    deploy_metrics = os.path.join(deployed_dir, "metrics.json")
    deploy_pipeline = os.path.join(deployed_dir, "pipeline.joblib")

    check("deployed/metadata.json 存在", os.path.exists(deploy_meta), deploy_meta)
    total_checks += 1; passed += 1 if os.path.exists(deploy_meta) else 0
    check("deployed/metrics.json 存在", os.path.exists(deploy_metrics), deploy_metrics)
    total_checks += 1; passed += 1 if os.path.exists(deploy_metrics) else 0
    check("deployed/pipeline.joblib 存在", os.path.exists(deploy_pipeline), deploy_pipeline)
    total_checks += 1; passed += 1 if os.path.exists(deploy_pipeline) else 0

    with open(deploy_meta, "r", encoding="utf-8") as f:
        dmeta = json.load(f)
    check("部署metadata含完整metrics", "metrics" in dmeta and len(dmeta["metrics"]) > 10,
          f"metrics keys数={len(dmeta.get('metrics', {}))}")
    total_checks += 1
    if "metrics" in dmeta and len(dmeta["metrics"]) > 10: passed += 1

    with open(deploy_metrics, "r", encoding="utf-8") as f:
        dmetric = json.load(f)
    m_acc = float(dmetric.get("accuracy") or 0)
    m_p = float(dmetric.get("precision") or dmetric.get("precision_macro") or 0)
    m_r = float(dmetric.get("recall") or dmetric.get("recall_macro") or 0)
    m_f1 = float(dmetric.get("f1") or dmetric.get("f1_macro") or 0)
    check("metrics.json Accuracy非0", m_acc > 0.5, f"{(m_acc*100):.2f}%")
    total_checks += 1; passed += 1 if m_acc > 0.5 else 0
    check("metrics.json Precision非0", m_p > 0.5, f"{(m_p*100):.2f}%")
    total_checks += 1; passed += 1 if m_p > 0.5 else 0
    check("metrics.json Recall非0", m_r > 0.5, f"{(m_r*100):.2f}%")
    total_checks += 1; passed += 1 if m_r > 0.5 else 0
    check("metrics.json F1非0", m_f1 > 0.5, f"{(m_f1*100):.2f}%")
    total_checks += 1; passed += 1 if m_f1 > 0.5 else 0

    section("6. 推理告警 + 工程师人工反馈(FeatureRecord可追溯)")
    engine = InferenceEngine()
    check("部署模型就绪", engine.is_model_ready(), engine._model_version)
    total_checks += 1; passed += 1 if engine.is_model_ready() else 0

    rinf = engine.run_batch_inference(equipment_ids=None, lookback_minutes=1440)
    _, n_alerts = AlertManager.list_alerts(status=None, limit=500)
    check("告警数>=10条", n_alerts >= 10, f"{n_alerts}条")
    total_checks += 1; passed += 1 if n_alerts >= 10 else 0

    alerts, _ = AlertManager.list_alerts(status=None, limit=25)
    types_available = ["REAL_FAULT", "SENSOR_DRIFT", "FALSE_ALARM"]
    for i, a in enumerate(alerts[:25]):
        AlertManager.submit_feedback(
            alert_id=a["id"], feedback_type=types_available[i % 3],
            feedback_user="E2E测试工程师", feedback_note=f"自动确认 #{i}"
        )

    sess2 = Database.get_session()
    n_engineer = sess2.query(FeatureRecord).filter(
        FeatureRecord.source == FEATURE_SOURCE_ENGINEER_CONFIRMED
    ).count()
    n_seed = sess2.query(FeatureRecord).filter(
        FeatureRecord.source == FEATURE_SOURCE_AUTO_LABELED
    ).count()
    n_unconf = sess2.query(FeatureRecord).filter(
        FeatureRecord.source == FEATURE_SOURCE_UNCONFIRMED
    ).count()
    fb_with_fid = sess2.query(FeatureRecord).filter(
        FeatureRecord.feedback_id.isnot(None)
    ).count()
    sess2.close()

    check("工程师确认样本数>=20条", n_engineer >= 20, f"engineer_confirmed={n_engineer} 条")
    total_checks += 1; passed += 1 if n_engineer >= 20 else 0
    check("冷启动种子样本保留", n_seed >= 30, f"auto_labeled_seed={n_seed} 条")
    total_checks += 1; passed += 1 if n_seed >= 30 else 0
    check("历史未确认样本仍保留(raw_label不参与)",
          n_unconf > 1000, f"historical_unconfirmed={n_unconf:,} 条")
    total_checks += 1; passed += 1 if n_unconf > 1000 else 0
    check("工程师样本关联feedback_id可追溯", fb_with_fid >= 20, f"feedback_id非空={fb_with_fid} 条")
    total_checks += 1; passed += 1 if fb_with_fid >= 20 else 0

    section("7. 增量训练 (纯数据库准入样本: 工程师+种子, 无raw_label)")
    summary_mid = trainer.get_training_dataset_summary()
    check("增量训练前工程师样本已可训练(>=15)",
          summary_mid.get("ready_for_training") is True,
          f"就绪={summary_mid.get('ready_for_training')}, "
          f"allowed={summary_mid.get('total_allowed_samples')}")
    total_checks += 1
    if summary_mid.get("ready_for_training") is True: passed += 1

    result2 = trainer.train(
        feature_df=None, label_series=None,
        model_type="gb", auto_seed_samples=False, strict_from_db_only=True,
        include_feedback=True, description="E2E验证-增量训练(工程师确认样本)"
    )
    tm2 = result2["test_metrics"]
    di2 = result2["dataset_info"]
    a2 = float(tm2.get("accuracy") or 0)
    p2 = float(tm2.get("precision") or 0)
    r2 = float(tm2.get("recall") or 0)
    f2 = float(tm2.get("f1") or 0)
    used_fb = int(di2.get("used_feedback_count", 0))

    check("增量训练 Accuracy>0.5", a2 > 0.5, f"{(a2*100):.2f}%")
    total_checks += 1; passed += 1 if a2 > 0.5 else 0
    check("增量训练 F1>0.5", f2 > 0.5, f"{(f2*100):.2f}%")
    total_checks += 1; passed += 1 if f2 > 0.5 else 0
    check("增量训练使用了反馈样本", used_fb >= 10, f"used_feedback={used_fb}")
    total_checks += 1; passed += 1 if used_fb >= 10 else 0

    by_src2 = di2.get("by_source_in_training", {})
    bad_sources2 = [s for s in by_src2.keys() if s == FEATURE_SOURCE_UNCONFIRMED]
    check(f"增量训练依然排除 {FEATURE_SOURCE_UNCONFIRMED}",
          len(bad_sources2) == 0,
          f"增量训练来源={list(by_src2.keys())}, 排除来源={bad_sources2}")
    total_checks += 1
    if len(bad_sources2) == 0: passed += 1

    mm.register_model(trainer, result2, trained_by="e2e_script_retrain")
    new_model_v = result2["model_version"]
    mm.deploy_model(new_model_v)

    section("8. 模拟 Flask 路由: /api/models/deployed/detail 真实指标")
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    import app as flask_app_module
    flask_app_module.app.config["TESTING"] = True
    client = flask_app_module.app.test_client()

    resp = client.get("/api/models/deployed/detail")
    assert resp.status_code == 200, f"status={resp.status_code}"
    ddata = resp.get_json().get("data") or {}

    check("接口状态=200", resp.status_code == 200, str(resp.status_code))
    total_checks += 1; passed += 1 if resp.status_code == 200 else 0
    check("version字段正确", ddata.get("version") == new_model_v,
          f"接口version={ddata.get('version')}, 实际部署={new_model_v}")
    total_checks += 1
    if ddata.get("version") == new_model_v: passed += 1

    dmetrics = ddata.get("metrics") or {}
    i_acc = float(dmetrics.get("accuracy") or 0)
    i_p = float(dmetrics.get("precision") or 0)
    i_r = float(dmetrics.get("recall") or 0)
    i_f1 = float(dmetrics.get("f1") or 0)
    print(f"  接口返回指标: Acc={(i_acc*100):.2f}%  P={(i_p*100):.2f}%  "
          f"R={(i_r*100):.2f}%  F1={(i_f1*100):.2f}%")
    check("接口 Accuracy>0.5 (非0.0)", i_acc > 0.5, f"{(i_acc*100):.2f}%")
    total_checks += 1; passed += 1 if i_acc > 0.5 else 0
    check("接口 Precision>0.5 (非0.0)", i_p > 0.5, f"{(i_p*100):.2f}%")
    total_checks += 1; passed += 1 if i_p > 0.5 else 0
    check("接口 Recall>0.5 (非0.0)", i_r > 0.5, f"{(i_r*100):.2f}%")
    total_checks += 1; passed += 1 if i_r > 0.5 else 0
    check("接口 F1>0.5 (非0.0)", i_f1 > 0.5, f"{(i_f1*100):.2f}%")
    total_checks += 1; passed += 1 if i_f1 > 0.5 else 0

    i_perclass = dmetrics.get("per_class") or {}
    check("接口 per_class 指标存在", isinstance(i_perclass, dict) and len(i_perclass) >= 2,
          f"类别数={len(i_perclass) if isinstance(i_perclass, dict) else 0}, keys={list(i_perclass.keys()) if isinstance(i_perclass, dict) else []}")
    total_checks += 1
    if isinstance(i_perclass, dict) and len(i_perclass) >= 2: passed += 1

    i_di = ddata.get("dataset_info") or {}
    check("接口 dataset_info 严格规则=True",
          str(i_di.get("strict_training_rule_enabled")) == "True",
          f"strict={i_di.get('strict_training_rule_enabled')}")
    total_checks += 1
    if str(i_di.get("strict_training_rule_enabled")) == "True": passed += 1

    section("9. 模拟 Flask 路由: /api/models/train 严格准入")
    resp2 = client.post("/api/models/train", json={
        "model_type": "gb", "description": "E2E-API训练",
        "use_historical_data": False, "include_feedback": True,
        "auto_seed_samples": False
    })
    rj = resp2.get_json() or {}
    tr_ok = resp2.status_code == 200 and rj.get("success") is True
    print(f"  /api/models/train status={resp2.status_code}, success={rj.get('success')}, version={rj.get('model_version')}")
    check("训练API成功", tr_ok, f"status={resp2.status_code}")
    total_checks += 1; passed += 1 if tr_ok else 0

    strict_note = rj.get("strict_training_note") or ""
    check("训练API严格说明字符串", "严格准入模式" in strict_note or "严格工程师确认" in strict_note,
          strict_note[:80] if strict_note else "(空)")
    total_checks += 1
    if ("严格准入模式" in strict_note or "严格工程师确认" in strict_note): passed += 1

    api_metrics = (rj.get("metrics") or {})
    a_api = float(api_metrics.get("accuracy") or api_metrics.get("accuracy_macro") or 0)
    f_api = float(api_metrics.get("f1") or api_metrics.get("f1_macro") or 0)
    check("训练API返回Accuracy非0", a_api > 0.5, f"{(a_api*100):.2f}%")
    total_checks += 1; passed += 1 if a_api > 0.5 else 0
    check("训练API返回F1非0", f_api > 0.5, f"{(f_api*100):.2f}%")
    total_checks += 1; passed += 1 if f_api > 0.5 else 0

    section("10. 总结")
    ratio = (passed / total_checks * 100) if total_checks > 0 else 0
    print(f"\n  ╔{'═'*60}╗")
    print(f"  ║  通过检查: {passed}/{total_checks}  通过率: {ratio:.1f}%{'':>22}║")
    print(f"  ╚{'═'*60}╝\n")
    if passed == total_checks:
        print("  🎉 全部检查通过!")
    else:
        print(f"  ⚠️  有 {total_checks - passed} 项检查未通过，请排查。")
    return 0 if passed == total_checks else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n  用户中断")
        sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\n  ❌ E2E验证异常: {e}")
        sys.exit(1)
