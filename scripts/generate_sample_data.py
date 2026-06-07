import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os


def generate_sample_data(output_path=None):
    np.random.seed(42)
    
    n_records = 500
    
    source_warehouses = ['华东仓', '华南仓', '华北仓', '西南仓', '华中仓']
    target_warehouses = ['华东仓', '华南仓', '华北仓', '西南仓', '华中仓']
    carriers = ['顺丰速运', '京东物流', '中通快递', '圆通速递', '韵达快递', '极兔速递']
    evidence_types = ['签收单', '物流底单', '拍照凭证', 'GPS轨迹', '重量单']
    handlers = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
    statuses = ['正常', '返工', '审计中', '已完成']
    rework_reasons = [
        '附件缺失', '单据信息不完整', '签收人不符', '重量异常',
        '地址错误', '时间冲突', '人工补录错误', '其他'
    ]
    evidence_statuses = ['已上传', '缺失', '无效', '待审核']
    
    order_ids = [f'TR{202500000 + i}' for i in range(n_records)]
    
    duplicated_indices = np.random.choice(n_records, 20, replace=False)
    for idx in duplicated_indices:
        order_ids[idx] = order_ids[(idx + 50) % n_records]
    
    base_date = datetime(2025, 1, 1)
    create_times = [base_date + timedelta(days=np.random.randint(0, 180)) for _ in range(n_records)]
    
    data = {
        'order_id': order_ids,
        'source_warehouse': np.random.choice(source_warehouses, n_records),
        'target_warehouse': np.random.choice(target_warehouses, n_records),
        'carrier': np.random.choice(carriers, n_records),
        'evidence_type': np.random.choice(evidence_types, n_records),
        'handler': np.random.choice(handlers, n_records),
        'status': np.random.choice(statuses, n_records, p=[0.65, 0.2, 0.05, 0.1]),
        'create_time': create_times,
        'complete_time': [
            ct + timedelta(hours=np.random.randint(1, 72)) 
            if np.random.random() > 0.1 else None 
            for ct in create_times
        ],
        'missing_attachment': np.random.choice([0, 1], n_records, p=[0.85, 0.15]),
        'manual_entry': np.random.choice([0, 1], n_records, p=[0.9, 0.1]),
        'evidence_name': [f'证据_{i:04d}.jpg' if np.random.random() > 0.15 else None for i in range(n_records)],
        'evidence_status': np.random.choice(evidence_statuses, n_records, p=[0.75, 0.1, 0.08, 0.07]),
        'rework_reason': [
            np.random.choice(rework_reasons) if np.random.random() > 0.8 else None 
            for _ in range(n_records)
        ],
        'remark': [
            f'需要补充{i}号凭证' if np.random.random() > 0.9 else None 
            for i in range(n_records)
        ]
    }
    
    df = pd.DataFrame(data)
    
    if output_path is None:
        output_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data',
            'sample_transfer_orders.csv'
        )
    
    df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"Sample data generated at: {output_path}")
    print(f"Total records: {len(df)}")
    return output_path


if __name__ == '__main__':
    generate_sample_data()
