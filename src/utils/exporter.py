import pandas as pd
from datetime import datetime
import io
from src.database.mock_data import STAGE_NAMES, SAMPLE_TYPE_NAMES


def generate_export_filename(prefix="lab_timeline_report"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.xlsx"


def build_filter_description(start_date, end_date, sample_types, priorities, departments, 
                             only_timeout, only_returned):
    """
    构建筛选口径描述文本
    """
    descriptions = []
    
    if start_date and end_date:
        descriptions.append(f"时间范围: {start_date.strftime('%Y-%m-%d')} 至 {end_date.strftime('%Y-%m-%d')}")
    elif start_date:
        descriptions.append(f"开始时间: {start_date.strftime('%Y-%m-%d')}")
    elif end_date:
        descriptions.append(f"结束时间: {end_date.strftime('%Y-%m-%d')}")
    
    if sample_types and len(sample_types) > 0:
        type_names = [SAMPLE_TYPE_NAMES.get(t, t) for t in sample_types]
        descriptions.append(f"样本类型: {', '.join(type_names)}")
    
    if priorities and len(priorities) > 0:
        priority_names = ['急诊' if p == 'emergency' else '常规' for p in priorities]
        descriptions.append(f"优先级: {', '.join(priority_names)}")
    
    if departments and len(departments) > 0:
        descriptions.append(f"科室: {', '.join(departments)}")
    
    if only_timeout:
        descriptions.append("仅显示超时样本")
    
    if only_returned:
        descriptions.append("仅显示退回样本")
    
    if not descriptions:
        descriptions.append("无筛选条件（全量数据）")
    
    return "; ".join(descriptions)


def export_to_excel(df, start_date=None, end_date=None, sample_types=None, 
                    priorities=None, departments=None, only_timeout=False, 
                    only_returned=False, returns_df=None, thresholds_df=None):
    """
    导出报告到 Excel，包含：
    1. 概览页（时间窗口、样本量、筛选口径）
    2. 样本明细页
    3. 超时统计页
    4. 科室对比页
    5. 退回记录页（如有）
    6. 阈值配置页
    """
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        workbook = writer.book
        
        title_format = workbook.add_format({
            'bold': True, 'font_size': 14, 'align': 'left', 'valign': 'vcenter'
        })
        header_format = workbook.add_format({
            'bold': True, 'bg_color': '#D9E1F2', 'border': 1, 'align': 'center', 'valign': 'vcenter'
        })
        normal_format = workbook.add_format({'border': 1, 'align': 'left', 'valign': 'vcenter'})
        highlight_format = workbook.add_format({'bg_color': '#FFC7CE', 'border': 1})
        
        overview_data = []
        overview_data.append(['医院检验样本时效看板报告', ''])
        overview_data.append(['生成时间', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        overview_data.append(['', ''])
        overview_data.append(['【时间窗口】', ''])
        if start_date:
            overview_data.append(['开始时间', start_date.strftime('%Y-%m-%d %H:%M:%S') if hasattr(start_date, 'strftime') else str(start_date)])
        if end_date:
            overview_data.append(['结束时间', end_date.strftime('%Y-%m-%d %H:%M:%S') if hasattr(end_date, 'strftime') else str(end_date)])
        overview_data.append(['', ''])
        overview_data.append(['【样本量统计】', ''])
        overview_data.append(['总样本数', len(df)])
        overview_data.append(['急诊样本数', len(df[df['priority'] == 'emergency']) if 'priority' in df.columns else 0])
        overview_data.append(['常规样本数', len(df[df['priority'] == 'routine']) if 'priority' in df.columns else 0])
        overview_data.append(['超时样本数', int(df['any_timeout'].sum()) if 'any_timeout' in df.columns else 0])
        overview_data.append(['退回样本数', int(df['has_return'].sum()) if 'has_return' in df.columns else 0])
        overview_data.append(['', ''])
        overview_data.append(['【筛选口径】', ''])
        filter_desc = build_filter_description(start_date, end_date, sample_types, priorities, 
                                               departments, only_timeout, only_returned)
        overview_data.append(['筛选条件', filter_desc])
        
        overview_df = pd.DataFrame(overview_data, columns=['项目', '内容'])
        overview_df.to_excel(writer, sheet_name='报告概览', index=False, header=False)
        
        ws = writer.sheets['报告概览']
        ws.set_column('A:A', 20)
        ws.set_column('B:B', 80)
        ws.merge_range('A1:B1', '医院检验样本时效看板报告', title_format)
        for row_num in range(1, len(overview_data)):
            for col_num in range(2):
                cell_value = overview_data[row_num][col_num]
                cell_format = title_format if (row_num in [3, 8, 15]) else normal_format
                ws.write(row_num, col_num, cell_value, cell_format)
        
        detail_cols = [
            'sample_id', 'sample_type_name', 'priority_name', 'requesting_department',
            'collected_at', 'dispatched_at', 'received_at', 'tested_at', 
            'reviewed_at', 'reported_at', 'total_duration_minutes',
            'any_timeout', 'timeout_stages', 'has_return', 'return_reason'
        ]
        available_detail_cols = [c for c in detail_cols if c in df.columns]
        detail_df = df[available_detail_cols].copy()
        
        col_name_mapping = {
            'sample_id': '样本编号',
            'sample_type_name': '样本类型',
            'priority_name': '优先级',
            'requesting_department': '申请科室',
            'collected_at': '采样时间',
            'dispatched_at': '送检时间',
            'received_at': '接收时间',
            'tested_at': '检测时间',
            'reviewed_at': '复核时间',
            'reported_at': '报告发布时间',
            'total_duration_minutes': '总耗时(分钟)',
            'any_timeout': '是否超时',
            'timeout_stages': '超时环节',
            'has_return': '是否退回',
            'return_reason': '退回原因'
        }
        detail_df = detail_df.rename(columns=col_name_mapping)
        
        for col in ['采样时间', '送检时间', '接收时间', '检测时间', '复核时间', '报告发布时间']:
            if col in detail_df.columns:
                detail_df[col] = detail_df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        if '超时环节' in detail_df.columns:
            detail_df['超时环节'] = detail_df['超时环节'].apply(
                lambda x: ', '.join(x) if isinstance(x, list) and len(x) > 0 else ''
            )
        
        detail_df.to_excel(writer, sheet_name='样本明细', index=False)
        ws_detail = writer.sheets['样本明细']
        for col_num, value in enumerate(detail_df.columns.values):
            ws_detail.write(0, col_num, value, header_format)
            ws_detail.set_column(col_num, col_num, 18)
        for row_num in range(1, len(detail_df) + 1):
            for col_num in range(len(detail_df.columns)):
                cell_value = detail_df.iloc[row_num - 1, col_num]
                ws_detail.write(row_num, col_num, str(cell_value) if pd.notna(cell_value) else '', normal_format)
        
        timeout_stats = []
        for stage_key, stage_name in STAGE_NAMES.items():
            duration_col = f'{stage_key}_minutes'
            timeout_col = f'{stage_key}_timeout'
            if duration_col in df.columns and timeout_col in df.columns:
                valid_data = df[df[duration_col].notna()]
                total = len(valid_data)
                timed_out = int(valid_data[timeout_col].sum())
                rate = round(timed_out / total * 100, 2) if total > 0 else 0
                avg_dur = round(valid_data[duration_col].mean(), 2)
                median_dur = round(valid_data[duration_col].median(), 2)
                max_dur = round(valid_data[duration_col].max(), 2)
                
                timeout_stats.append({
                    '环节': stage_name,
                    '样本数': total,
                    '超时数': timed_out,
                    '超时率(%)': rate,
                    '平均耗时(分钟)': avg_dur,
                    '中位数耗时(分钟)': median_dur,
                    '最大耗时(分钟)': max_dur
                })
        
        if timeout_stats:
            timeout_df = pd.DataFrame(timeout_stats)
            timeout_df.to_excel(writer, sheet_name='超时统计', index=False)
            ws_to = writer.sheets['超时统计']
            for col_num, value in enumerate(timeout_df.columns.values):
                ws_to.write(0, col_num, value, header_format)
                ws_to.set_column(col_num, col_num, 18)
            for row_num in range(1, len(timeout_df) + 1):
                for col_num in range(len(timeout_df.columns)):
                    cell_value = timeout_df.iloc[row_num - 1, col_num]
                    ws_to.write(row_num, col_num, cell_value, normal_format)
        
        from src.utils.data_processor import get_department_comparison
        dept_comp_df = get_department_comparison(df)
        if not dept_comp_df.empty:
            dept_comp_df = dept_comp_df.rename(columns={
                'department': '科室',
                'sample_count': '样本数',
                'avg_total_duration_minutes': '平均总耗时(分钟)',
                'timeout_count': '超时数',
                'timeout_rate': '超时率(%)',
                'return_count': '退回数',
                'return_rate': '退回率(%)'
            })
            dept_comp_df.to_excel(writer, sheet_name='科室对比', index=False)
            ws_dept = writer.sheets['科室对比']
            for col_num, value in enumerate(dept_comp_df.columns.values):
                ws_dept.write(0, col_num, value, header_format)
                ws_dept.set_column(col_num, col_num, 18)
            for row_num in range(1, len(dept_comp_df) + 1):
                for col_num in range(len(dept_comp_df.columns)):
                    cell_value = dept_comp_df.iloc[row_num - 1, col_num]
                    ws_dept.write(row_num, col_num, cell_value, normal_format)
        
        if returns_df is not None and not returns_df.empty:
            return_cols = ['sample_id', 'return_time', 'return_reason', 'responsible_department', 'returned_by', 'notes']
            available_return_cols = [c for c in return_cols if c in returns_df.columns]
            returns_export_df = returns_df[available_return_cols].copy()
            returns_export_df = returns_export_df.rename(columns={
                'sample_id': '样本编号',
                'return_time': '退回时间',
                'return_reason': '退回原因',
                'responsible_department': '责任科室',
                'returned_by': '退回人',
                'notes': '备注'
            })
            if '退回时间' in returns_export_df.columns:
                returns_export_df['退回时间'] = pd.to_datetime(returns_export_df['退回时间']).dt.strftime('%Y-%m-%d %H:%M:%S')
            
            returns_export_df.to_excel(writer, sheet_name='退回记录', index=False)
            ws_ret = writer.sheets['退回记录']
            for col_num, value in enumerate(returns_export_df.columns.values):
                ws_ret.write(0, col_num, value, header_format)
                ws_ret.set_column(col_num, col_num, 20)
            for row_num in range(1, len(returns_export_df) + 1):
                for col_num in range(len(returns_export_df.columns)):
                    cell_value = returns_export_df.iloc[row_num - 1, col_num]
                    ws_ret.write(row_num, col_num, str(cell_value) if pd.notna(cell_value) else '', normal_format)
        
        if thresholds_df is not None and not thresholds_df.empty:
            th_export = thresholds_df.copy()
            th_export = th_export[[
                'sample_type_name', 'priority_name', 'stage_display_name', 
                'threshold_minutes', 'description'
            ]].rename(columns={
                'sample_type_name': '样本类型',
                'priority_name': '优先级',
                'stage_display_name': '环节',
                'threshold_minutes': '阈值(分钟)',
                'description': '说明'
            })
            th_export.to_excel(writer, sheet_name='阈值配置', index=False)
            ws_th = writer.sheets['阈值配置']
            for col_num, value in enumerate(th_export.columns.values):
                ws_th.write(0, col_num, value, header_format)
                ws_th.set_column(col_num, col_num, 20)
            for row_num in range(1, len(th_export) + 1):
                for col_num in range(len(th_export.columns)):
                    cell_value = th_export.iloc[row_num - 1, col_num]
                    ws_th.write(row_num, col_num, cell_value, normal_format)
    
    output.seek(0)
    return output
