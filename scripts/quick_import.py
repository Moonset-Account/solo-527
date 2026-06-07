import sqlite3
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'transfer_orders.db')

def quick_import():
    if not os.path.exists(DB_PATH):
        from init_db import init_database
        init_database()
    
    np.random.seed(42)
    n_records = 480
    
    source_warehouses = ['华东仓', '华南仓', '华北仓', '西南仓', '华中仓']
    target_warehouses = ['华东仓', '华南仓', '华北仓', '西南仓', '华中仓']
    carriers = ['顺丰速运', '京东物流', '中通快递', '圆通速递', '韵达快递', '极兔速递']
    evidence_types = ['签收单', '物流底单', '拍照凭证', 'GPS轨迹', '重量单']
    handlers = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
    statuses = ['正常', '返工', '审计中', '已完成']
    rework_reasons = ['附件缺失', '单据信息不完整', '签收人不符', '重量异常', '地址错误', '时间冲突', '人工补录错误', '其他']
    evidence_statuses = ['已上传', '缺失', '无效', '待审核']
    
    order_ids = [f'TR{202500000 + i}' for i in range(n_records)]
    base_date = datetime(2025, 1, 1)
    create_times = [base_date + timedelta(days=np.random.randint(0, 180)) for _ in range(n_records)]
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM evidence_records')
    cursor.execute('DELETE FROM rework_records')
    cursor.execute('DELETE FROM transfer_orders')
    cursor.execute('DELETE FROM import_logs')
    
    imported = 0
    for i in range(n_records):
        oid = order_ids[i]
        status = np.random.choice(statuses, p=[0.65, 0.2, 0.05, 0.1])
        ct = create_times[i]
        complete = ct + timedelta(hours=np.random.randint(1, 72)) if np.random.random() > 0.1 else None
        ph = (complete - ct).total_seconds() / 3600 if complete else None
        miss_att = 0
        man_ent = np.random.choice([0, 1], p=[0.9, 0.1])
        is_rw = 1 if status == '返工' else 0
        is_aud = 1 if status == '审计中' else 0
        
        cursor.execute('''
            INSERT OR REPLACE INTO transfer_orders 
            (order_id, source_warehouse, target_warehouse, carrier, evidence_type, 
             handler, status, create_time, complete_time, processing_hours,
             is_rework, is_auditing, missing_attachment, manual_entry)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            oid,
            np.random.choice(source_warehouses),
            np.random.choice(target_warehouses),
            np.random.choice(carriers),
            np.random.choice(evidence_types),
            np.random.choice(handlers),
            status,
            ct.strftime('%Y-%m-%d %H:%M:%S'),
            complete.strftime('%Y-%m-%d %H:%M:%S') if complete else None,
            ph,
            is_rw,
            is_aud,
            miss_att,
            man_ent
        ))
        imported += 1
        
        has_evidence = np.random.random() > 0.15
        if has_evidence:
            ev_status = np.random.choice(evidence_statuses, p=[0.75, 0.1, 0.08, 0.07])
            evidence_name = f'证据_{i:04d}.jpg' if np.random.random() > 0.05 else None
            if evidence_name is None:
                miss_att = 1
                cursor.execute('''
                    UPDATE transfer_orders SET missing_attachment = 1 WHERE order_id = ?
                ''', (oid,))
            cursor.execute('''
                INSERT INTO evidence_records (order_id, evidence_name, evidence_status, upload_time)
                VALUES (?, ?, ?, ?)
            ''', (oid, evidence_name, ev_status if evidence_name else '缺失', (ct + timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S')))
        else:
            miss_att = 1
            cursor.execute('''
                UPDATE transfer_orders SET missing_attachment = 1 WHERE order_id = ?
            ''', (oid,))
        
        if status == '返工' or np.random.random() > 0.9:
            cursor.execute('''
                INSERT INTO rework_records (order_id, rework_reason, rework_time, handler, remark)
                VALUES (?, ?, ?, ?, ?)
            ''', (oid, np.random.choice(rework_reasons), (ct + timedelta(hours=5)).strftime('%Y-%m-%d %H:%M:%S'), 
                  np.random.choice(handlers), f'需要补充{i}号凭证' if np.random.random() > 0.5 else None))
    
    cursor.execute('''
        INSERT INTO import_logs (source_file, total_records, duplicates_removed, missing_attachment_count, manual_entry_count, imported_count)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', ('generated_sample', n_records, 20, 72, 48, imported))
    
    conn.commit()
    conn.close()
    print(f'Imported {imported} records successfully')

if __name__ == '__main__':
    quick_import()
