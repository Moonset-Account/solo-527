"""
定时报表模块
支持按小时/天/周生成报表并发送
"""
import schedule
import time
import pandas as pd
from datetime import datetime, timedelta
import os
from data_generator import load_data
from metrics import calculate_wait_times, filter_dataframe, compute_summary_metrics
from validation import run_full_validation


REPORT_DIR = "reports"


def generate_daily_report(date: str = None) -> str:
    """生成日报表"""
    if date is None:
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    df = load_data()
    df = calculate_wait_times(df)
    
    daily_df = df[df["visit_date"] == date]
    
    if len(daily_df) == 0:
        return f"日期 {date} 无数据"
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    
    report_path = os.path.join(REPORT_DIR, f"daily_report_{date}.xlsx")
    
    with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
        summary = pd.DataFrame(
            {
                "指标": ["报表日期", "生成时间", "总样本量", "异常样本数", "异常率(%)",
                        "平均总等待(分钟)", "中位数总等待(分钟)", "P95总等待(分钟)"],
                "数值": [
                    date,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    len(daily_df),
                    daily_df["is_anomaly"].sum(),
                    round(daily_df["is_anomaly"].sum() / len(daily_df) * 100, 2),
                    round(daily_df["total_wait_time"].mean(), 2),
                    round(daily_df["total_wait_time"].median(), 2),
                    round(daily_df["total_wait_time"].quantile(0.95), 2)
                ]
            }
        )
        summary.to_excel(writer, sheet_name="概览", index=False)
        
        dept_stats = daily_df.groupby("dept_name").agg({
            "visit_id": "count",
            "total_wait_time": ["mean", "median"],
            "wait_分诊_叫号": ["mean", "median"],
            "is_anomaly": "sum"
        }).round(2)
        dept_stats.columns = ['_'.join(col).strip() for col in dept_stats.columns.values]
        dept_stats.to_excel(writer, sheet_name="科室统计")
        
        slot_stats = daily_df.groupby("time_slot").agg({
            "visit_id": "count",
            "total_wait_time": ["mean", "median"]
        }).round(2)
        slot_stats.columns = ['_'.join(col).strip() for col in slot_stats.columns.values]
        slot_stats.to_excel(writer, sheet_name="时段统计")
        
        type_stats = daily_df.groupby("patient_type").agg({
            "visit_id": "count",
            "total_wait_time": ["mean", "median"]
        }).round(2)
        type_stats.columns = ['_'.join(col).strip() for col in type_stats.columns.values]
        type_stats.to_excel(writer, sheet_name="患者类型统计")
        
        anomalies = daily_df[daily_df["is_anomaly"] == True]
        if len(anomalies) > 0:
            anomalies[["visit_id", "dept_name", "doctor_name", "patient_type", 
                      "time_slot", "total_wait_time", "anomaly_reason"]].to_excel(
                writer, sheet_name="异常明细", index=False
            )
    
    return f"日报表已生成: {report_path}"


def generate_weekly_report(start_date: str = None) -> str:
    """生成周报表"""
    if start_date is None:
        end_date = datetime.now() - timedelta(days=1)
        start_date = (end_date - timedelta(days=6)).strftime("%Y-%m-%d")
    
    df = load_data()
    df = calculate_wait_times(df)
    
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = start_dt + timedelta(days=6)
    date_range = [d.strftime("%Y-%m-%d") for d in pd.date_range(start_dt, end_dt)]
    
    weekly_df = df[df["visit_date"].isin(date_range)]
    
    if len(weekly_df) == 0:
        return f"日期范围 {start_date} - {end_dt.strftime('%Y-%m-%d')} 无数据"
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    
    report_path = os.path.join(REPORT_DIR, f"weekly_report_{start_date}.xlsx")
    
    with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
        summary = pd.DataFrame(
            {
                "指标": ["开始日期", "结束日期", "生成时间", "总样本量", "异常样本数", 
                        "异常率(%)", "平均总等待(分钟)", "中位数总等待(分钟)"],
                "数值": [
                    start_date,
                    end_dt.strftime("%Y-%m-%d"),
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    len(weekly_df),
                    weekly_df["is_anomaly"].sum(),
                    round(weekly_df["is_anomaly"].sum() / len(weekly_df) * 100, 2),
                    round(weekly_df["total_wait_time"].mean(), 2),
                    round(weekly_df["total_wait_time"].median(), 2)
                ]
            }
        )
        summary.to_excel(writer, sheet_name="概览", index=False)
        
        daily_trend = weekly_df.groupby("visit_date").agg({
            "visit_id": "count",
            "total_wait_time": ["mean", "median"],
            "is_anomaly": "sum"
        }).round(2)
        daily_trend.columns = ['_'.join(col).strip() for col in daily_trend.columns.values]
        daily_trend.to_excel(writer, sheet_name="日趋势")
        
        dept_stats = weekly_df.groupby("dept_name").agg({
            "visit_id": "count",
            "total_wait_time": ["mean", "median"],
            "wait_分诊_叫号": ["mean", "median"]
        }).round(2)
        dept_stats.columns = ['_'.join(col).strip() for col in dept_stats.columns.values]
        dept_stats.to_excel(writer, sheet_name="科室统计")
        
        anomalies = weekly_df[weekly_df["is_anomaly"] == True]
        if len(anomalies) > 0:
            anomalies[["visit_id", "visit_date", "dept_name", "doctor_name", 
                      "total_wait_time", "anomaly_reason"]].to_excel(
                writer, sheet_name="异常明细", index=False
            )
    
    return f"周报表已生成: {report_path}"


def setup_schedule():
    """设置定时任务"""
    schedule.every().day.at("08:00").do(generate_daily_report)
    schedule.every().monday.at("09:00").do(generate_weekly_report)
    
    print("定时任务已设置:")
    print("  - 每日 08:00 生成日报表")
    print("  - 每周一 09:00 生成周报表")
    print()


def run_scheduler():
    """运行定时任务调度器"""
    setup_schedule()
    
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "daily":
            date = sys.argv[2] if len(sys.argv) > 2 else None
            print(generate_daily_report(date))
        elif sys.argv[1] == "weekly":
            start_date = sys.argv[2] if len(sys.argv) > 2 else None
            print(generate_weekly_report(start_date))
        elif sys.argv[1] == "schedule":
            run_scheduler()
        elif sys.argv[1] == "validate":
            report = run_full_validation()
            from validation import print_validation_report
            print_validation_report(report)
    else:
        print("使用方法:")
        print("  python scheduler.py daily [date]   - 生成日报表")
        print("  python scheduler.py weekly [start] - 生成周报表")
        print("  python scheduler.py schedule       - 运行定时任务")
        print("  python scheduler.py validate       - 运行验收测试")
