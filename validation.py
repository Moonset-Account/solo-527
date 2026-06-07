"""
验收测试模块
检查缺失值、异常点和样本量
"""
import pandas as pd
import numpy as np
from typing import Dict, List
from data_generator import load_data, generate_mock_data, save_data
from metrics import calculate_wait_times


def check_missing_values(df: pd.DataFrame) -> Dict:
    """检查缺失值"""
    time_cols = ["reg_time", "checkin_time", "triage_time", "call_time", 
                 "consult_start_time", "consult_end_time", "payment_time", "medicine_time"]
    
    missing_report = {}
    
    for col in time_cols:
        if col in df.columns:
            missing_count = df[col].isna().sum()
            missing_pct = (missing_count / len(df)) * 100
            missing_report[col] = {
                "count": int(missing_count),
                "percentage": round(missing_pct, 2),
                "status": "正常" if missing_pct < 5 else ("警告" if missing_pct < 15 else "严重")
            }
    
    total_missing = df[time_cols].isna().any(axis=1).sum()
    missing_report["_summary"] = {
        "total_records": len(df),
        "records_with_missing": int(total_missing),
        "missing_rate": round((total_missing / len(df)) * 100, 2)
    }
    
    return missing_report


def check_anomalies(df: pd.DataFrame) -> Dict:
    """检查异常点"""
    wait_cols = [col for col in df.columns if col.startswith("wait_")] + ["total_wait_time", "consult_duration"]
    wait_cols = [col for col in wait_cols if col in df.columns]
    
    anomaly_report = {}
    
    for col in wait_cols:
        valid_data = df[col].dropna()
        if len(valid_data) == 0:
            continue
        
        q1 = valid_data.quantile(0.25)
        q3 = valid_data.quantile(0.75)
        iqr = q3 - q1
        
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = valid_data[(valid_data < lower_bound) | (valid_data > upper_bound)]
        extreme_outliers = valid_data[(valid_data < q1 - 3 * iqr) | (valid_data > q3 + 3 * iqr)]
        
        negative_values = (valid_data < 0).sum()
        
        anomaly_report[col] = {
            "count": len(valid_data),
            "mean": round(valid_data.mean(), 2),
            "median": round(valid_data.median(), 2),
            "min": round(valid_data.min(), 2),
            "max": round(valid_data.max(), 2),
            "iqr_outliers": int(len(outliers)),
            "extreme_outliers": int(len(extreme_outliers)),
            "negative_values": int(negative_values),
            "status": "正常" if len(outliers) / len(valid_data) < 0.05 else ("警告" if len(outliers) / len(valid_data) < 0.15 else "严重")
        }
    
    labeled_anomalies = df[df["is_anomaly"] == True]
    anomaly_report["_summary"] = {
        "labeled_anomalies": int(len(labeled_anomalies)),
        "labeled_rate": round((len(labeled_anomalies) / len(df)) * 100, 2),
        "anomaly_reasons": labeled_anomalies["anomaly_reason"].value_counts().to_dict() if len(labeled_anomalies) > 0 else {}
    }
    
    return anomaly_report


def check_sample_sizes(df: pd.DataFrame) -> Dict:
    """检查样本量"""
    sample_report = {}
    
    sample_report["total"] = len(df)
    
    dept_counts = df["dept_name"].value_counts()
    sample_report["by_dept"] = dept_counts.to_dict()
    sample_report["min_dept_samples"] = int(dept_counts.min())
    sample_report["max_dept_samples"] = int(dept_counts.max())
    
    time_slot_counts = df["time_slot"].value_counts()
    sample_report["by_time_slot"] = time_slot_counts.to_dict()
    
    patient_type_counts = df["patient_type"].value_counts()
    sample_report["by_patient_type"] = patient_type_counts.to_dict()
    
    doctor_counts = df.groupby(["dept_name", "doctor_name"]).size().reset_index(name="count")
    sample_report["min_doctor_samples"] = int(doctor_counts["count"].min())
    sample_report["doctors_with_few_samples"] = doctor_counts[doctor_counts["count"] < 30][["dept_name", "doctor_name", "count"]].to_dict("records")
    
    date_counts = df["visit_date"].value_counts().sort_index()
    sample_report["by_date"] = date_counts.to_dict()
    sample_report["min_daily_samples"] = int(date_counts.min())
    sample_report["max_daily_samples"] = int(date_counts.max())
    
    sample_report["_status"] = "正常" if len(df) >= 1000 and sample_report["min_dept_samples"] >= 50 else ("警告" if len(df) >= 500 else "严重")
    
    return sample_report


def run_full_validation(df: pd.DataFrame = None) -> Dict:
    """运行完整验收测试"""
    if df is None:
        try:
            df = load_data()
        except:
            df = generate_mock_data(num_patients=3000, days=14)
            save_data(df)
    
    df = calculate_wait_times(df)
    
    report = {
        "validation_time": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        "missing_values": check_missing_values(df),
        "anomalies": check_anomalies(df),
        "sample_sizes": check_sample_sizes(df)
    }
    
    overall_status = "通过"
    issues = []
    
    if report["missing_values"]["_summary"]["missing_rate"] > 10:
        overall_status = "不通过"
        issues.append(f"缺失值过高: {report['missing_values']['_summary']['missing_rate']}%")
    
    anomaly_rate = report["anomalies"]["_summary"]["labeled_rate"]
    if anomaly_rate > 15:
        overall_status = "不通过"
        issues.append(f"异常率过高: {anomaly_rate}%")
    
    if report["sample_sizes"]["total"] < 500:
        overall_status = "不通过"
        issues.append(f"总样本量不足: {report['sample_sizes']['total']}")
    
    report["overall_status"] = overall_status
    report["issues"] = issues
    
    return report


def print_validation_report(report: Dict):
    """打印验收报告"""
    print("=" * 70)
    print("医院门诊等待时间分析 - 验收测试报告")
    print("=" * 70)
    print(f"验证时间: {report['validation_time']}")
    print(f"整体状态: {'✅ 通过' if report['overall_status'] == '通过' else '❌ 不通过'}")
    print()
    
    if report["issues"]:
        print("发现的问题:")
        for issue in report["issues"]:
            print(f"  ⚠️  {issue}")
        print()
    
    print("-" * 70)
    print("1. 缺失值检查")
    print("-" * 70)
    mv = report["missing_values"]
    print(f"总记录数: {mv['_summary']['total_records']}")
    print(f"含缺失值记录: {mv['_summary']['records_with_missing']} ({mv['_summary']['missing_rate']}%)")
    print()
    for col, info in mv.items():
        if col.startswith("_"):
            continue
        status_icon = "✅" if info["status"] == "正常" else ("⚠️" if info["status"] == "警告" else "❌")
        print(f"  {status_icon} {col}: {info['count']} 缺失 ({info['percentage']}%) - {info['status']}")
    
    print()
    print("-" * 70)
    print("2. 异常点检查")
    print("-" * 70)
    an = report["anomalies"]
    print(f"标记异常数: {an['_summary']['labeled_anomalies']} ({an['_summary']['labeled_rate']}%)")
    if an["_summary"]["anomaly_reasons"]:
        print("异常原因分布:")
        for reason, count in an["_summary"]["anomaly_reasons"].items():
            print(f"  - {reason}: {count}")
    print()
    for col, info in an.items():
        if col.startswith("_"):
            continue
        status_icon = "✅" if info["status"] == "正常" else ("⚠️" if info["status"] == "警告" else "❌")
        print(f"  {status_icon} {col}:")
        print(f"     范围: {info['min']} - {info['max']} 分钟, 均值: {info['mean']}, 中位数: {info['median']}")
        print(f"     IQR异常: {info['iqr_outliers']}, 极端异常: {info['extreme_outliers']}, 负值: {info['negative_values']}")
    
    print()
    print("-" * 70)
    print("3. 样本量检查")
    print("-" * 70)
    ss = report["sample_sizes"]
    print(f"总样本量: {ss['total']}")
    print(f"科室样本范围: {ss['min_dept_samples']} - {ss['max_dept_samples']}")
    print(f"日均样本范围: {ss['min_daily_samples']} - {ss['max_daily_samples']}")
    if ss["doctors_with_few_samples"]:
        print(f"样本量不足30的医生数: {len(ss['doctors_with_few_samples'])}")
    print(f"整体状态: {ss['_status']}")
    
    print()
    print("=" * 70)


if __name__ == "__main__":
    report = run_full_validation()
    print_validation_report(report)
