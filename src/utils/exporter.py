import pandas as pd
from fpdf import FPDF
from datetime import datetime
import os


def export_to_csv(df: pd.DataFrame, filepath: str = None) -> str:
    if filepath is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = f'data/export_{timestamp}.csv'
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    return filepath


class PDF(FPDF):
    def header(self):
        self.set_font('PingFang', 'B', 16)
        self.cell(0, 10, '校园食堂窗口排队分析报告', 0, 1, 'C')
        self.ln(5)
    
    def footer(self):
        self.set_y(-15)
        self.set_font('PingFang', '', 8)
        self.cell(0, 10, f'第 {self.page_no()} 页', 0, 0, 'C')


def export_to_pdf(orders_df: pd.DataFrame, windows_df: pd.DataFrame, filepath: str = None) -> str:
    if filepath is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = f'data/report_{timestamp}.pdf'
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    pdf = PDF()
    pdf.add_font('PingFang', '', '/System/Library/Fonts/PingFang.ttc')
    pdf.add_font('PingFang', 'B', '/System/Library/Fonts/PingFang.ttc')
    
    pdf.add_page()
    
    pdf.set_font('PingFang', 'B', 14)
    pdf.cell(0, 10, f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1)
    pdf.ln(5)
    
    pdf.set_font('PingFang', 'B', 12)
    pdf.cell(0, 10, '一、数据概览', 0, 1)
    pdf.set_font('PingFang', '', 10)
    
    valid_orders = orders_df[~orders_df['is_abnormal']]
    pdf.cell(0, 8, f'总订单数: {len(orders_df)}', 0, 1)
    pdf.cell(0, 8, f'有效订单数: {len(valid_orders)}', 0, 1)
    pdf.cell(0, 8, f'异常订单数: {len(orders_df) - len(valid_orders)}', 0, 1)
    pdf.cell(0, 8, f'平均总等待时间: {valid_orders["total_wait"].mean():.1f} 分钟', 0, 1)
    pdf.ln(5)
    
    pdf.set_font('PingFang', 'B', 12)
    pdf.cell(0, 10, '二、窗口统计', 0, 1)
    pdf.set_font('PingFang', '', 10)
    
    window_stats = valid_orders.groupby('window_id').agg(
        订单数=('order_no', 'count'),
        平均排队等待=('wait_queue', 'mean'),
        平均支付等待=('wait_payment', 'mean'),
        平均出餐时间=('wait_serve', 'mean'),
        平均总等待=('total_wait', 'mean')
    ).reset_index()
    
    window_stats['窗口名称'] = window_stats['window_id'].map(
        dict(zip(windows_df['id'], windows_df['name']))
    )
    
    col_widths = [50, 20, 25, 25, 25, 25]
    headers = ['窗口名称', '订单数', '排队等待', '支付等待', '出餐时间', '总等待']
    
    pdf.set_font('PingFang', 'B', 9)
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 8, header, 1)
    pdf.ln()
    
    pdf.set_font('PingFang', '', 9)
    for _, row in window_stats.iterrows():
        pdf.cell(col_widths[0], 7, str(row['窗口名称'])[:15], 1)
        pdf.cell(col_widths[1], 7, str(row['订单数']), 1)
        pdf.cell(col_widths[2], 7, f"{row['平均排队等待']:.1f}", 1)
        pdf.cell(col_widths[3], 7, f"{row['平均支付等待']:.1f}", 1)
        pdf.cell(col_widths[4], 7, f"{row['平均出餐时间']:.1f}", 1)
        pdf.cell(col_widths[5], 7, f"{row['平均总等待']:.1f}", 1)
        pdf.ln()
    
    pdf.ln(5)
    pdf.set_font('PingFang', 'B', 12)
    pdf.cell(0, 10, '三、时段分析', 0, 1)
    pdf.set_font('PingFang', '', 10)
    
    time_slot_stats = valid_orders.groupby('time_slot').agg(
        订单数=('order_no', 'count'),
        平均总等待=('total_wait', 'mean')
    ).reset_index()
    
    slot_names = {
        'breakfast': '早餐',
        'lunch': '午餐',
        'dinner': '晚餐',
        'night_snack': '夜宵',
        'other': '其他'
    }
    
    for _, row in time_slot_stats.iterrows():
        slot_name = slot_names.get(row['time_slot'], row['time_slot'])
        pdf.cell(0, 8, f"{slot_name}: {row['订单数']} 单, 平均等待 {row['平均总等待']:.1f} 分钟", 0, 1)
    
    pdf.ln(5)
    pdf.set_font('PingFang', 'B', 12)
    pdf.cell(0, 10, '四、异常订单说明', 0, 1)
    pdf.set_font('PingFang', '', 10)
    
    abnormal_orders = orders_df[orders_df['is_abnormal']]
    if not abnormal_orders.empty:
        reason_counts = abnormal_orders['abnormal_reason'].value_counts()
        for reason, count in reason_counts.items():
            pdf.cell(0, 8, f"{reason}: {count} 单", 0, 1)
    else:
        pdf.cell(0, 8, '暂无异常订单', 0, 1)
    
    pdf.output(filepath)
    return filepath
