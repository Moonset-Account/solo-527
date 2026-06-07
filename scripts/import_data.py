import sqlite3
import pandas as pd
import os
from datetime import datetime
import hashlib

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'transfer_orders.db')


def clean_data(df):
    total_records = len(df)
    
    df['order_id'] = df['order_id'].astype(str).str.strip()
    
    duplicates_mask = df.duplicated(subset=['order_id'], keep='last')
    duplicates_removed = duplicates_mask.sum()
    df = df[~duplicates_mask].copy()
    
    for col in ['missing_attachment', 'manual_entry']:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = df[col].fillna(0).astype(int)
    
    if 'evidence_name' in df.columns:
        df['evidence_name'] = df['evidence_name'].astype(str).str.strip()
        empty_evidence_mask = (df['evidence_name'].isna()) | (df['evidence_name'] == '') | (df['evidence_name'] == 'nan')
        df.loc[empty_evidence_mask, 'missing_attachment'] = 1
    
    missing_attachment_count = df['missing_attachment'].sum()
    manual_entry_count = df['manual_entry'].sum()
    
    for col in ['source_warehouse', 'target_warehouse', 'carrier', 'evidence_type', 'handler']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    
    if 'status' in df.columns:
        df['status'] = df['status'].astype(str).str.strip()
        valid_statuses = ['正常', '返工', '审计中', '已完成']
        df['status'] = df['status'].apply(lambda x: x if x in valid_statuses else '正常')
    
    df['is_rework'] = df['status'].apply(lambda x: 1 if x == '返工' else 0)
    df['is_auditing'] = df['status'].apply(lambda x: 1 if x == '审计中' else 0)
    
    for col in ['create_time', 'complete_time']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    if 'create_time' in df.columns and 'complete_time' in df.columns:
        df['processing_hours'] = df.apply(
            lambda row: (row['complete_time'] - row['create_time']).total_seconds() / 3600
            if pd.notna(row['create_time']) and pd.notna(row['complete_time'])
            else None,
            axis=1
        )
    
    for col in ['create_time', 'complete_time', 'rework_time', 'evidence_upload_time']:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None)
    
    return df, total_records, duplicates_removed, missing_attachment_count, manual_entry_count


def import_data(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format. Use CSV or Excel.")
    
    cleaned_df, total_records, duplicates_removed, missing_attachment_count, manual_entry_count = clean_data(df)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    imported_count = 0
    for _, row in cleaned_df.iterrows():
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO transfer_orders 
                (order_id, source_warehouse, target_warehouse, carrier, evidence_type, 
                 handler, status, create_time, complete_time, processing_hours,
                 is_rework, is_auditing, missing_attachment, manual_entry)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row['order_id'],
                row.get('source_warehouse', ''),
                row.get('target_warehouse', ''),
                row.get('carrier', ''),
                row.get('evidence_type', ''),
                row.get('handler', ''),
                row.get('status', '正常'),
                row.get('create_time'),
                row.get('complete_time'),
                row.get('processing_hours'),
                row.get('is_rework', 0),
                row.get('is_auditing', 0),
                row.get('missing_attachment', 0),
                row.get('manual_entry', 0)
            ))
            imported_count += 1
            
            if 'evidence_name' in row.index and pd.notna(row.get('evidence_name')):
                cursor.execute('''
                    INSERT INTO evidence_records (order_id, evidence_name, evidence_status, upload_time)
                    VALUES (?, ?, ?, ?)
                ''', (
                    row['order_id'],
                    row.get('evidence_name'),
                    row.get('evidence_status', '已上传'),
                    row.get('evidence_upload_time')
                ))
            
            if 'rework_reason' in row.index and pd.notna(row.get('rework_reason')):
                cursor.execute('''
                    INSERT INTO rework_records (order_id, rework_reason, rework_time, handler, remark)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    row['order_id'],
                    row.get('rework_reason'),
                    row.get('rework_time', datetime.now()),
                    row.get('rework_handler'),
                    row.get('remark')
                ))
                
        except Exception as e:
            print(f"Error importing order {row.get('order_id')}: {e}")
    
    cursor.execute('''
        INSERT INTO import_logs 
        (source_file, total_records, duplicates_removed, missing_attachment_count, manual_entry_count, imported_count)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        os.path.basename(file_path),
        total_records,
        duplicates_removed,
        missing_attachment_count,
        manual_entry_count,
        imported_count
    ))
    
    conn.commit()
    conn.close()
    
    print(f"Import completed:")
    print(f"  Total records: {total_records}")
    print(f"  Duplicates removed: {duplicates_removed}")
    print(f"  Missing attachment flagged: {missing_attachment_count}")
    print(f"  Manual entry flagged: {manual_entry_count}")
    print(f"  Successfully imported: {imported_count}")


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        import_data(sys.argv[1])
    else:
        print("Usage: python import_data.py <file_path>")
