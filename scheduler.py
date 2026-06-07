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
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Template

from data_generator import load_data
from metrics import calculate_wait_times
from validation import run_full_validation
from config_manager import load_schedule_config, save_schedule_config


REPORT_DIR = "reports"
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>医院门诊等待时间分析报表</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; color: #333; }
        .header { background: #1f77b4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .card { background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .card h2 { margin-top: 0; color: #1f77b4; font-size: 18px; border-bottom: 2px solid #1f77b4; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #e9ecef; font-weight: bold; }
        tr:hover { background: #f1f3f4; }
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 15px 0; }
        .metric-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center; }
        .metric-value { font-size: 28px; font-weight: bold; color: #1f77b4; }
        .metric-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
        .anomaly { background: #fff3cd !important; }
        .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #dee2e6; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 10px 0; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 10px 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 医院门诊等待时间分析报表</h1>
        <p>报表类型: {{ report_type }} | 期间: {{ period }} | 生成时间: {{ generated_at }}</p>
    </div>
    
    <div class="card">
        <h2>📊 核心指标概览</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">{{ metrics.total_samples }}</div>
                <div class="metric-label">总样本量</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ metrics.anomaly_count }}</div>
                <div class="metric-label">异常样本</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ metrics.avg_wait }} 分钟</div>
                <div class="metric-label">平均总等待</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ metrics.p95_wait }} 分钟</div>
                <div class="metric-label">P95 总等待</div>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h2>🏥 各科室等待时间统计</h2>
        <table>
            <thead>
                <tr>
                    <th>科室</th>
                    <th>样本量</th>
                    <th>平均总等待(分钟)</th>
                    <th>中位数(分钟)</th>
                    <th>分诊→叫号均值(分钟)</th>
                    <th>异常数</th>
                </tr>
            </thead>
            <tbody>
                {% for row in dept_stats %}
                <tr class="{{ 'anomaly' if row['异常数'] > 5 else '' }}">
                    <td>{{ row['dept_name'] }}</td>
                    <td>{{ row['visit_id_count'] }}</td>
                    <td>{{ row['total_wait_time_mean'] }}</td>
                    <td>{{ row['total_wait_time_median'] }}</td>
                    <td>{{ row['wait_分诊_叫号_mean'] }}</td>
                    <td>{{ row['异常数'] }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    
    <div class="card">
        <h2>⏰ 时段分布统计</h2>
        <table>
            <thead>
                <tr>
                    <th>时段</th>
                    <th>样本量</th>
                    <th>平均总等待(分钟)</th>
                    <th>中位数(分钟)</th>
                </tr>
            </thead>
            <tbody>
                {% for row in slot_stats %}
                <tr>
                    <td>{{ row['time_slot'] }}</td>
                    <td>{{ row['visit_id_count'] }}</td>
                    <td>{{ row['total_wait_time_mean'] }}</td>
                    <td>{{ row['total_wait_time_median'] }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    
    {% if anomalies|length > 0 %}
    <div class="card">
        <h2>⚠️ 异常样本明细</h2>
        <div class="warning">共发现 {{ anomalies|length }} 个异常样本，请重点关注</div>
        <table>
            <thead>
                <tr>
                    <th>就诊ID</th>
                    {% if is_weekly %}<th>日期</th>{% endif %}
                    <th>科室</th>
                    <th>医生</th>
                    <th>患者类型</th>
                    <th>时段</th>
                    <th>总等待(分钟)</th>
                    <th>异常原因</th>
                </tr>
            </thead>
            <tbody>
                {% for row in anomalies %}
                <tr class="anomaly">
                    <td>{{ row['visit_id'] }}</td>
                    {% if is_weekly %}<td>{{ row['visit_date'] }}</td>{% endif %}
                    <td>{{ row['dept_name'] }}</td>
                    <td>{{ row['doctor_name'] }}</td>
                    <td>{{ row['patient_type'] }}</td>
                    <td>{{ row['time_slot'] }}</td>
                    <td>{{ row['total_wait_time'] }}</td>
                    <td>{{ row['anomaly_reason'] }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% endif %}
    
    <div class="footer">
        <p>此报表为系统自动生成 | 医院门诊等待时间分析工作台</p>
        <p>如有疑问请联系运营改善小组</p>
    </div>
</body>
</html>
"""


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


def send_email_with_attachment(report_path: str, config: dict) -> dict:
    """发送带附件的邮件（真实SMTP发送）
    返回: {"success": bool, "message": str, "mode": "real"|"simulated"|"skipped"}
    """
    email = config.get("email", "")
    if not email:
        return {
            "success": False,
            "message": "未配置接收邮箱，跳过邮件发送",
            "mode": "skipped"
        }
    
    smtp_config = config.get("smtp", {
        "server": "smtp.hospital.com",
        "port": 587,
        "username": "report@hospital.com",
        "password": "",
        "use_tls": True
    })
    
    if not smtp_config.get("password"):
        msg = (
            f"SMTP密码未配置，无法发送真实邮件。\n"
            f"请在定时报表设置中配置SMTP服务器信息。\n"
            f"已生成报表文件: {report_path}\n"
            f"收件人: {email}"
        )
        print(f"⚠️  {msg}")
        return {
            "success": False,
            "message": msg,
            "mode": "skipped"
        }
    
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_config.get("username", "hospital_report@hospital.com")
        msg["To"] = email
        msg["Subject"] = f"医院门诊等待时间分析报表 - {datetime.now().strftime('%Y-%m-%d')}"
        
        body = f"""
您好！

这是医院门诊等待时间分析自动报表。
报表生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
报表类型: {config.get('frequency', 'daily')}
报表格式: {config.get('format', 'xlsx')}

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
        
        with smtplib.SMTP(smtp_config["server"], smtp_config["port"]) as server:
            if smtp_config.get("use_tls", True):
                server.starttls()
            server.login(smtp_config["username"], smtp_config["password"])
            server.send_message(msg)
        
        success_msg = f"✅ 邮件已成功发送到: {email}，附件: {os.path.basename(report_path)}"
        print(success_msg)
        return {
            "success": True,
            "message": success_msg,
            "mode": "real"
        }
    
    except Exception as e:
        error_msg = f"❌ 邮件发送失败: {str(e)}"
        print(error_msg)
        return {
            "success": False,
            "message": error_msg,
            "mode": "failed"
        }


def _generate_html_report(df, report_type: str, period: str, is_weekly: bool = False) -> str:
    """生成HTML格式报表"""
    is_anomaly_bool = df["is_anomaly"].astype(str).str.lower() == "true"
    
    dept_stats = df.groupby("dept_name").agg({
        "visit_id": "count",
        "total_wait_time": ["mean", "median"],
        "wait_分诊_叫号": ["mean", "median"],
    }).round(2)
    dept_stats.columns = ['_'.join(col).strip() for col in dept_stats.columns.values]
    dept_stats["异常数"] = df.groupby("dept_name").apply(
        lambda x: (x["is_anomaly"].astype(str).str.lower() == "true").sum()
    )
    dept_stats = dept_stats.reset_index().to_dict("records")
    
    slot_stats = df.groupby("time_slot").agg({
        "visit_id": "count",
        "total_wait_time": ["mean", "median"]
    }).round(2)
    slot_stats.columns = ['_'.join(col).strip() for col in slot_stats.columns.values]
    slot_stats = slot_stats.reset_index().to_dict("records")
    
    anomalies = []
    anomaly_df = df[is_anomaly_bool]
    if len(anomaly_df) > 0:
        cols = ["visit_id", "dept_name", "doctor_name", "patient_type", 
                "time_slot", "total_wait_time", "anomaly_reason"]
        if is_weekly:
            cols.insert(1, "visit_date")
        cols = [c for c in cols if c in anomaly_df.columns]
        anomalies = anomaly_df[cols].head(50).to_dict("records")
    
    metrics = {
        "total_samples": len(df),
        "anomaly_count": int(is_anomaly_bool.sum()),
        "avg_wait": round(df["total_wait_time"].mean(), 1) if "total_wait_time" in df.columns else 0,
        "p95_wait": round(df["total_wait_time"].quantile(0.95), 1) if "total_wait_time" in df.columns else 0,
    }
    
    template = Template(EMAIL_TEMPLATE)
    html_content = template.render(
        report_type=report_type,
        period=period,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        metrics=metrics,
        dept_stats=dept_stats,
        slot_stats=slot_stats,
        anomalies=anomalies,
        is_weekly=is_weekly
    )
    
    return html_content


def _generate_pdf_report(df, report_type: str, period: str, report_path: str, is_weekly: bool = False):
    """使用reportlab生成PDF报表"""
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    is_anomaly_bool = df["is_anomaly"].astype(str).str.lower() == "true"
    
    doc = SimpleDocTemplate(report_path, pagesize=landscape(A4), 
                          leftMargin=1*cm, rightMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm)
    styles = getSampleStyleSheet()
    elements = []
    
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, 
                                 textColor=colors.HexColor('#1f77b4'), spaceAfter=10)
    subtitle_style = ParagraphStyle('CustomSubtitle', parent=styles['Normal'], fontSize=10, 
                                    textColor=colors.gray, spaceAfter=15)
    
    elements.append(Paragraph("🏥 医院门诊等待时间分析报表", title_style))
    elements.append(Paragraph(f"报表类型: {report_type} | 期间: {period} | 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    
    elements.append(Paragraph("📊 核心指标概览", styles['Heading2']))
    
    metrics_data = [
        ["总样本量", "异常样本", "平均总等待(分钟)", "P95总等待(分钟)"],
        [str(len(df)), 
         str(int(is_anomaly_bool.sum())), 
         str(round(df["total_wait_time"].mean(), 1)) if "total_wait_time" in df.columns else "0",
         str(round(df["total_wait_time"].quantile(0.95), 1)) if "total_wait_time" in df.columns else "0"]
    ]
    metrics_table = Table(metrics_data, colWidths=[4*cm, 4*cm, 5*cm, 5*cm])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f77b4')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 1), (-1, 1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 0.5*cm))
    
    elements.append(Paragraph("🏥 各科室等待时间统计", styles['Heading2']))
    
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
    
    dept_data = [["科室", "样本量", "平均总等待", "中位数", "分诊→叫号均值", "异常数"]]
    for _, row in dept_stats.iterrows():
        dept_data.append([
            str(row["dept_name"]),
            str(row["visit_id_count"]),
            str(row["total_wait_time_mean"]),
            str(row["total_wait_time_median"]),
            str(row["wait_分诊_叫号_mean"]),
            str(row["异常数"])
        ])
    
    dept_table = Table(dept_data, colWidths=[4*cm, 2.5*cm, 3*cm, 2.5*cm, 3.5*cm, 2.5*cm])
    dept_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9ecef')),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(dept_table)
    elements.append(Spacer(1, 0.5*cm))
    
    if len(dept_data) > 50:
        elements.append(Paragraph(f"⚠️  表格数据较多，仅显示前50行", styles['Normal']))
    
    if len(df[is_anomaly_bool]) > 0:
        elements.append(Paragraph("⚠️ 异常样本（前20条）", styles['Heading2']))
        anomaly_df = df[is_anomaly_bool].head(20)
        anomaly_cols = ["visit_id", "dept_name", "doctor_name", "patient_type", 
                        "time_slot", "total_wait_time", "anomaly_reason"]
        if is_weekly:
            anomaly_cols.insert(1, "visit_date")
        anomaly_cols = [c for c in anomaly_cols if c in anomaly_df.columns]
        
        anomaly_data = [["就诊ID", "科室", "医生", "患者类型", "时段", "总等待(分)", "异常原因"]]
        if is_weekly:
            anomaly_data[0].insert(1, "日期")
        
        for _, row in anomaly_df.iterrows():
            row_data = [str(row[c]) for c in anomaly_cols]
            anomaly_data.append(row_data)
        
        anomaly_table = Table(anomaly_data, colWidths=[3*cm, 3*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 4*cm] if not is_weekly 
                              else [3*cm, 2.5*cm, 3*cm, 2.5*cm, 2.5*cm, 2*cm, 2*cm, 4*cm])
        anomaly_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fff3cd')),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        ]))
        elements.append(anomaly_table)
    
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("此报表为系统自动生成 | 医院门诊等待时间分析工作台", 
                            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.gray)))
    
    doc.build(elements)


def generate_hourly_report(format_type: str = "xlsx") -> str:
    """生成小时报表"""
    df = load_data()
    df = calculate_wait_times(df)
    
    now = datetime.now()
    hour_start = now - timedelta(hours=1)
    period = hour_start.strftime("%Y-%m-%d %H:00") + " - " + now.strftime("%H:00")
    
    df["reg_time"] = pd.to_datetime(df["reg_time"])
    hourly_df = df[(df["reg_time"] >= hour_start) & (df["reg_time"] < now)]
    
    if len(hourly_df) == 0:
        return f"最近1小时无数据"
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    
    timestamp = now.strftime("%Y%m%d_%H%M")
    report_path = os.path.join(REPORT_DIR, f"hourly_report_{timestamp}.{format_type}")
    
    if format_type == "html":
        html_content = _generate_html_report(hourly_df, "小时报表", period)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(html_content)
    elif format_type == "pdf":
        _generate_pdf_report(hourly_df, "小时报表", period, report_path)
    else:
        with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
            _write_report_sheets(writer, hourly_df, "小时报表", period)
    
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
    
    if format_type == "html":
        html_content = _generate_html_report(daily_df, "日报表", date)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(html_content)
    elif format_type == "pdf":
        _generate_pdf_report(daily_df, "日报表", date, report_path)
    else:
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
    period = f"{start_date} 至 {end_dt.strftime('%Y-%m-%d')}"
    
    weekly_df = df[df["visit_date"].isin(date_range)]
    
    if len(weekly_df) == 0:
        return f"日期范围 {period} 无数据"
    
    os.makedirs(REPORT_DIR, exist_ok=True)
    
    report_path = os.path.join(REPORT_DIR, f"weekly_report_{start_date}.{format_type}")
    
    if format_type == "html":
        html_content = _generate_html_report(weekly_df, "周报表", period, is_weekly=True)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(html_content)
    elif format_type == "pdf":
        _generate_pdf_report(weekly_df, "周报表", period, report_path, is_weekly=True)
    else:
        with pd.ExcelWriter(report_path, engine="openpyxl") as writer:
            _write_report_sheets(writer, weekly_df, "周报表", period, is_weekly=True)
    
    return f"周报表已生成: {report_path}"


def _write_report_sheets(writer, df, report_type: str, period: str, is_weekly: bool = False):
    """写入Excel报表Sheet"""
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
    
    actual_path = report_path.split(": ")[-1] if ": " in report_path and os.path.exists(report_path.split(": ")[-1]) else None
    if actual_path and config.get("email"):
        result = send_email_with_attachment(actual_path, config)
        if result["success"]:
            config["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            config["last_status"] = result["message"]
            save_schedule_config(config)
        else:
            config["last_run"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            config["last_status"] = result["message"]
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
    print(f"报表格式: {config.get('format', 'xlsx')}")
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
            fmt = sys.argv[3] if len(sys.argv) > 3 else "xlsx"
            print(generate_daily_report(date, format_type=fmt))
        elif sys.argv[1] == "weekly":
            start_date = sys.argv[2] if len(sys.argv) > 2 else None
            fmt = sys.argv[3] if len(sys.argv) > 3 else "xlsx"
            print(generate_weekly_report(start_date, format_type=fmt))
        elif sys.argv[1] == "hourly":
            fmt = sys.argv[2] if len(sys.argv) > 2 else "xlsx"
            print(generate_hourly_report(format_type=fmt))
        elif sys.argv[1] == "schedule":
            run_scheduler()
        elif sys.argv[1] == "validate":
            report = run_full_validation()
            from validation import print_validation_report
            print_validation_report(report)
        elif sys.argv[1] == "run":
            scheduled_job()
        elif sys.argv[1] == "test-email":
            config = load_schedule_config()
            test_path = generate_daily_report(format_type="html")
            if ": " in test_path:
                send_email_with_attachment(test_path.split(": ")[-1], config)
    else:
        print("使用方法:")
        print("  python scheduler.py daily [date] [format]   - 生成日报表")
        print("  python scheduler.py weekly [start] [format]  - 生成周报表")
        print("  python scheduler.py hourly [format]          - 生成小时报表")
        print("  python scheduler.py schedule                 - 运行定时任务")
        print("  python scheduler.py run                      - 立即执行一次报表任务")
        print("  python scheduler.py test-email               - 测试邮件发送")
        print("  python scheduler.py validate                 - 运行验收测试")
        print()
        print("支持格式: xlsx, html, pdf")
