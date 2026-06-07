import pandas as pd
from fpdf import FPDF
from datetime import datetime
import os


def get_chinese_font_info():
    font_paths = [
        ('PingFang', '/System/Library/Fonts/PingFang.ttc'),
        ('STHeiti', '/System/Library/Fonts/STHeiti Medium.ttc'),
        ('STHeiti Light', '/System/Library/Fonts/STHeiti Light.ttc'),
        ('Songti', '/System/Library/Fonts/Supplemental/Songti.ttc'),
        ('ArialUnicode', '/Library/Fonts/Arial Unicode.ttf'),
        ('ArialUnicodeMS', '/Library/Fonts/Arial Unicode.ttf'),
    ]
    
    for font_name, font_path in font_paths:
        if os.path.exists(font_path):
            return font_name, font_path
    
    return 'Helvetica', None


FONT_NAME, FONT_PATH = get_chinese_font_info()


def export_to_csv(df: pd.DataFrame, filepath: str = None) -> str:
    if filepath is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = f'data/export_{timestamp}.csv'
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    return filepath


class PDF(FPDF):
    def header(self):
        self.set_font(FONT_NAME, 'B', 16)
        self.cell(0, 10, 'Canteen Queue Analysis Report' if FONT_PATH is None else '校园食堂窗口排队分析报告', 0, 1, 'C')
        self.ln(5)
    
    def footer(self):
        self.set_y(-15)
        self.set_font(FONT_NAME, '', 8)
        self.cell(0, 10, f'Page {self.page_no()}' if FONT_PATH is None else f'第 {self.page_no()} 页', 0, 0, 'C')


def export_to_pdf(orders_df: pd.DataFrame, windows_df: pd.DataFrame, filepath: str = None) -> str:
    if filepath is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = f'data/report_{timestamp}.pdf'
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    pdf = PDF()
    current_font = FONT_NAME
    if FONT_PATH:
        pdf.add_font(current_font, '', FONT_PATH)
        pdf.add_font(current_font, 'B', FONT_PATH)
    else:
        current_font = 'Helvetica'
    
    pdf.add_page()
    
    pdf.set_font(current_font, 'B', 14)
    gen_time_label = f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}' if FONT_PATH is None else f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
    pdf.cell(0, 10, gen_time_label, 0, 1)
    pdf.ln(5)
    
    pdf.set_font(current_font, 'B', 12)
    sec1_title = '1. Overview' if FONT_PATH is None else '一、数据概览'
    pdf.cell(0, 10, sec1_title, 0, 1)
    pdf.set_font(current_font, '', 10)
    
    valid_orders = orders_df[~orders_df['is_abnormal']]
    label1 = f'Total orders: {len(orders_df)}' if FONT_PATH is None else f'总订单数: {len(orders_df)}'
    label2 = f'Valid orders: {len(valid_orders)}' if FONT_PATH is None else f'有效订单数: {len(valid_orders)}'
    label3 = f'Abnormal orders: {len(orders_df) - len(valid_orders)}' if FONT_PATH is None else f'异常订单数: {len(orders_df) - len(valid_orders)}'
    label4 = f'Avg total wait: {valid_orders["total_wait"].mean():.1f} min' if FONT_PATH is None else f'平均总等待时间: {valid_orders["total_wait"].mean():.1f} 分钟'
    pdf.cell(0, 8, label1, 0, 1)
    pdf.cell(0, 8, label2, 0, 1)
    pdf.cell(0, 8, label3, 0, 1)
    pdf.cell(0, 8, label4, 0, 1)
    pdf.ln(5)
    
    pdf.set_font(current_font, 'B', 12)
    sec2_title = '2. Window Statistics' if FONT_PATH is None else '二、窗口统计'
    pdf.cell(0, 10, sec2_title, 0, 1)
    pdf.set_font(current_font, '', 10)
    
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
    if FONT_PATH is None:
        headers = ['Window', 'Count', 'Queue', 'Payment', 'Serve', 'Total']
    else:
        headers = ['窗口名称', '订单数', '排队等待', '支付等待', '出餐时间', '总等待']
    
    pdf.set_font(current_font, 'B', 9)
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 8, header, 1)
    pdf.ln()
    
    pdf.set_font(current_font, '', 9)
    for _, row in window_stats.iterrows():
        pdf.cell(col_widths[0], 7, str(row['窗口名称'])[:15], 1)
        pdf.cell(col_widths[1], 7, str(row['订单数']), 1)
        pdf.cell(col_widths[2], 7, f"{row['平均排队等待']:.1f}", 1)
        pdf.cell(col_widths[3], 7, f"{row['平均支付等待']:.1f}", 1)
        pdf.cell(col_widths[4], 7, f"{row['平均出餐时间']:.1f}", 1)
        pdf.cell(col_widths[5], 7, f"{row['平均总等待']:.1f}", 1)
        pdf.ln()
    
    pdf.ln(5)
    pdf.set_font(current_font, 'B', 12)
    sec3_title = '3. Time Slot Analysis' if FONT_PATH is None else '三、时段分析'
    pdf.cell(0, 10, sec3_title, 0, 1)
    pdf.set_font(current_font, '', 10)
    
    time_slot_stats = valid_orders.groupby('time_slot').agg(
        订单数=('order_no', 'count'),
        平均总等待=('total_wait', 'mean')
    ).reset_index()
    
    slot_names = {
        'breakfast': 'Breakfast' if FONT_PATH is None else '早餐',
        'lunch': 'Lunch' if FONT_PATH is None else '午餐',
        'dinner': 'Dinner' if FONT_PATH is None else '晚餐',
        'night_snack': 'Night Snack' if FONT_PATH is None else '夜宵',
        'other': 'Other' if FONT_PATH is None else '其他'
    }
    
    for _, row in time_slot_stats.iterrows():
        slot_name = slot_names.get(row['time_slot'], row['time_slot'])
        if FONT_PATH is None:
            label = f"{slot_name}: {row['订单数']} orders, avg wait {row['平均总等待']:.1f} min"
        else:
            label = f"{slot_name}: {row['订单数']} 单, 平均等待 {row['平均总等待']:.1f} 分钟"
        pdf.cell(0, 8, label, 0, 1)
    
    pdf.ln(5)
    pdf.set_font(current_font, 'B', 12)
    sec4_title = '4. Abnormal Orders' if FONT_PATH is None else '四、异常订单说明'
    pdf.cell(0, 10, sec4_title, 0, 1)
    pdf.set_font(current_font, '', 10)
    
    abnormal_orders = orders_df[orders_df['is_abnormal']]
    if not abnormal_orders.empty:
        reason_counts = abnormal_orders['abnormal_reason'].value_counts()
        for reason, count in reason_counts.items():
            pdf.cell(0, 8, f"{reason}: {count} orders", 0, 1)
    else:
        no_abn_label = 'No abnormal orders' if FONT_PATH is None else '暂无异常订单'
        pdf.cell(0, 8, no_abn_label, 0, 1)
    
    pdf.output(filepath)
    return filepath
