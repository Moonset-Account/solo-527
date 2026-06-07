"""
定时报表模块
支持按小时/天/周生成报表并发送邮件
读取页面配置的频率、格式和邮箱
"""
import schedule
import time
import pandas as pd
from datetime import datetime, timedelta
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from data_generator import load_data
from metrics import calculate_wait_times
from validation import run_full_validation
from config_manager import load_schedule_config, save_schedule_config


REPORT_DIR = "reports"


def generate_report_by_config(config: dict = None) -> str:
    """根据配置生成报表"""
    if config is None:
        config = load_schedule_config()
    
    frequency = config.get("frequency", "daily")
    format_type = config.get("format", "xlsx")
    
    if frequency == "hourly":
        return generate_hourly_report(format_type)
    elif frequency == "weekly":
        return generate_weekly_report(format_type=format_type)
    else:
        return generate_daily_report(format_type=format_type)


def send_email_with_attachment(report_path: str, config: dict) -> bool:
    """发送带附件的邮件"""
    email = config.get("email", "")
    if not email:
        print("未配置接收邮箱，跳过邮件发送")
        return False
    
    try:
        msg = MIMEMultipart()
        msg["From"] = "hospital_report@hospital.com"
        msg["To"] = email
        msg["Subject"] = f"医院门诊等待时间分析报表 - {datetime.now().strftime('%Y-%m-%d')}"
        
        body = f"""
您好！

这是医院门诊等待时间分析自动报表。
报表生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
报表类型: {config.get('frequency', 'daily')}

请查看附件中的详细分析报告。

此邮件为系统自动发送，请勿直接回复。
        """
        msg.attach(MIMEText(body, "plain", "utf-8"))
        
        if os.path.exists(report_path):
            filename = os.path.basename(report_path)
            with open(report_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}",
            )
            msg.attach(part)
        
        print(f"模拟邮件已发送到: {email}")
        print(f"附件: {report_path}")
        
        return True
    
    except Exception as e:
        print(f"邮件发送失败: {e}")
        return False


def generate_hourly_report(format_type: str = "xlsx") -> str:
    """生成小时报表"""
    df = load_data()
    df = calculate_wait_times(df)
    
    now = datetime.now()
    hour_start = now - timedelta(hours=1)
    
    df["reg_time"] = pd.to_datetime(df["reg_time"])
    hourly_df = df[(df["reg_time"] >= hour_start) & (df["reg_time"] < now)]
    
    if len(hourly_df) == 0:
        return f"最近1小时无数据"
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    
    timestamp = now.strftime("%Y%m%d_%H%M")
    report_path = os.path.join(REPORT_DIR, f"hourly_report_{timestamp}.{format_type}")
    
    if format_type == "xlsx":
        with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
            _write_report_sheets(writer, hourly_df, "小时报表", hour_start.strftime("%Y-%m-%d %H:00"))
    
    return f"小时报表已生成: {report_path}"


def generate_daily_report(date: str = None, format_type: str = "xlsx") -> str:
    """生成日报表"""
    if date is None:
        date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    df = load_data()
    df = calculate_wait_times(df)
    
    daily_df = df[df["visit_date"] == date]
    
    if len(daily_df) == 0:
        return f"日期 {date} 无数据"
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    
    report_path = os.path.join(REPORT_DIR, f"daily_report_{date}.{format_type}")
    
    if format_type == "xlsx":
        with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
            _write_report_sheets(writer, daily_df, "日报表", date)
    
    return f"日报表已生成: {report_path}"


def generate_weekly_report(start_date: str = None, format_type: str = "xlsx") -> str:
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
    
    report_path = os.path.join(REPORT_DIR, f"weekly_report_{start_date}.{format_type}")
    
    if format_type == "xlsx":
        with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
            _write_report_sheets(writer, weekly_df, "周报表", f"{start_date} 至 {end_dt.strftime('%Y-%m-%d')}", is_weekly=True)
    
    return f"周报表已生成: {report_path}"


def _write_report_sheets(writer, df, report_type: str, period: str, is_weekly: bool = False):
    """写入报表Sheet"""
    is_anomaly_bool = df["is_anomaly"].astype(str).str.lower() == "true"
    
    summary = pd.DataFrame(
        {
            "指标": [
                f"{report_type}期间", "生成时间", "总样本量", "异常样本数", 
                "异常率(%)", "平均总等待(分钟)", "中位数总等待(分钟)", "P95总等待(分钟)"
            ],
            "数值": [
                period,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                len(df),
                is_anomaly_bool.sum(),
                round(is_anomaly_bool.sum() / len(df) * 100, 2) if len(df) > 0 else 0,
                round(df["total_wait_time"].mean(), 2) if "total_wait_time" in df.columns else 0,
                round(df["total_wait_time"].median(), 2) if "total_wait_time" in df.columns else 0,
                round(df["total_wait_time"].quantile(0.95), 2) if "total_wait_time" in df.columns else 0
            ]
        }
    )
    summary.to_excel(writer, sheet_name="概览", index=False)
    
    dept_stats = df.groupby("dept_name").agg({
        "visit_id": "count",
        "total_wait_time": ["mean", "median"],
        "wait_分诊_叫号": ["mean", "median"],
    }).round(2)
    dept_stats.columns = ['_'.join(col).strip() for col in dept_stats.columns.values]
    dept_stats["异常数"] = df.groupby("dept_name").apply(
        lambda x: (x["is_anomaly"].astype(str).str.lower() == "true").sum()
    )
    dept_stats = dept_stats.reset_index()
    dept_stats.to_excel(writer, sheet_name="科室统计", index=False)
    
    slot_stats = df.groupby("time_slot").agg({
        "visit_id": "count",
        "total_wait_time": ["mean", "median"]
    }).round(2)
    slot_stats.columns = ['_'.join(col).strip() for col in slot_stats.columns.values]
    slot_stats = slot_stats.reset_index()
    slot_stats.to_excel(writer, sheet_name="时段统计", index=False)
    
    if is_weekly:
        daily_trend = df.groupby("visit_date").agg({
            "visit_id": "count",
            "total_wait_time": ["mean", "median"],
        }).round(2)
        daily_trend["异常数"] = df.groupby("visit_date").apply(
            lambda x: (x["is_anomaly"].astype(str).str.lower() == "true").sum()
        )
        daily_trend.columns = ['_'.join(col).strip() for col in daily_trend.columns.values]
        daily_trend = daily_trend.reset_index()
        daily_trend.to_excel(writer, sheet_name="日趋势", index=False)
    
    anomalies = df[is_anomaly_bool]
    if len(anomalies) > 0:
        cols = ["visit_id", "dept_name", "doctor_name", "patient_type", 
                "time_slot", "total_wait_time", "anomaly_reason"]
        if is_weekly:
            cols.insert(1, "visit_date")
        cols = [c for c in cols if c in anomalies.columns]
        anomalies[cols].to_excel(writer, sheet_name="异常明细", index=False)


def scheduled_job():
    """定时任务执行函数"""
    config = load_schedule_config()
    
    if not config.get("enabled", False):
        return
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始执行定时报表任务...")
    
    report_path = generate_report_by_config(config)
    print(report_path)
    
    if config.get("email") and os.path.exists(report_path.split(": ")[-1] if ": " in report_path else ""):
        actual_path = report_path.split(": ")[-1] if ": " in report_path else report_path
        if send_email_with_attachment(actual_path, config):
            config["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            save_schedule_config(config)
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 定时报表任务完成")


def setup_schedule_from_config():
    """根据配置设置定时任务"""
    config = load_schedule_config()
    frequency = config.get("frequency", "daily")
    
    schedule.clear()
    
    if frequency == "hourly":
        schedule.every().hour.at(":00").do(scheduled_job)
        print("定时任务已设置: 每小时整点生成报表")
    elif frequency == "weekly":
        schedule.every().monday.at("09:00").do(scheduled_job)
        print("定时任务已设置: 每周一 09:00 生成周报表")
    else:
        schedule.every().day.at("08:00").do(scheduled_job)
        print("定时任务已设置: 每日 08:00 生成日报表")
    
    if config.get("email"):
        print(f"报表将发送至: {config['email']}")
    print()


def run_scheduler():
    """运行定时任务调度器"""
    print("=" * 60)
    print("医院门诊等待时间分析 - 定时报表服务")
    print("=" * 60)
    
    config = load_schedule_config()
    print(f"当前配置:")
    print(f"  频率: {config.get('frequency', 'daily')}")
    print(f"  格式: {config.get('format', 'xlsx')}")
    print(f"  邮箱: {config.get('email', '未设置')}")
    print(f"  启用: {config.get('enabled', False)}")
    print("=" * 60)
    print()
    
    setup_schedule_from_config()
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n定时报表服务已停止")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "daily":
            date = sys.argv[2] if len(sys.argv) > 2 else None
            print(generate_daily_report(date))
        elif sys.argv[1] == "weekly":
            start_date = sys.argv[2] if len(sys.argv) > 2 else None
            print(generate_weekly_report(start_date))
        elif sys.argv[1] == "hourly":
            print(generate_hourly_report())
        elif sys.argv[1] == "schedule":
            run_scheduler()
        elif sys.argv[1] == "validate":
            report = run_full_validation()
            from validation import print_validation_report
            print_validation_report(report)
        elif sys.argv[1] == "run":
            scheduled_job()
    else:
        print("使用方法:")
        print("  python scheduler.py daily [date]   - 生成日报表")
        print("  python scheduler.py weekly [start] - 生成周报表")
        print("  python scheduler.py hourly         - 生成小时报表")
        print("  python scheduler.py schedule       - 运行定时任务")
        print("  python scheduler.py run            - 立即执行一次报表任务")
        print("  python scheduler.py validate       - 运行验收测试")
