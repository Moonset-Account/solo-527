import sqlite3
import sys
sys.path.insert(0, '.')
from app import get_rework_reasons

DB_PATH = 'data/transfer_orders.db'
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print('=== 缺失附件统计 ===')
cursor.execute('SELECT COUNT(*) FROM transfer_orders WHERE missing_attachment = 1')
print(f'缺失附件标记的单据: {cursor.fetchone()[0]}')

print('\n=== 证据记录中空附件名 ===')
cursor.execute("SELECT COUNT(*) FROM evidence_records WHERE evidence_name IS NULL OR evidence_name = ''")
empty_evidence = cursor.fetchone()[0]
print(f'空附件名的证据记录: {empty_evidence}')

print('\n=== 审计中单据统计 ===')
cursor.execute('SELECT COUNT(*) FROM transfer_orders WHERE is_auditing = 1')
auditing_count = cursor.fetchone()[0]
print(f'审计中单据: {auditing_count}')

print('\n=== 验证空附件名的单据是否都标记了缺失附件 ===')
cursor.execute('''
    SELECT COUNT(DISTINCT t.order_id) 
    FROM transfer_orders t
    JOIN evidence_records e ON t.order_id = e.order_id
    WHERE (e.evidence_name IS NULL OR e.evidence_name = '')
    AND t.missing_attachment = 1
''')
print(f'空附件名且正确标记缺失附件: {cursor.fetchone()[0]}')

cursor.execute('''
    SELECT COUNT(DISTINCT t.order_id) 
    FROM transfer_orders t
    JOIN evidence_records e ON t.order_id = e.order_id
    WHERE (e.evidence_name IS NULL OR e.evidence_name = '')
    AND t.missing_attachment = 0
''')
missed = cursor.fetchone()[0]
print(f'空附件名但未标记缺失附件（应该为0）: {missed}')

print('\n=== 验证缺证原因筛选联动 ===')
all_reasons = get_rework_reasons()
print(f'全库返工原因类型数: {len(all_reasons)}')

filtered_reasons = get_rework_reasons(source_wh='华东仓')
print(f'华东仓返工原因类型数: {len(filtered_reasons)}')
print(f'全库总数: {all_reasons["count"].sum()}, 华东仓总数: {filtered_reasons["count"].sum()}')

print('\n=== 验证导出排除审计中单据 ===')
cursor.execute('SELECT COUNT(*) FROM transfer_orders WHERE is_auditing = 0')
non_auditing = cursor.fetchone()[0]
print(f'非审计中单据: {non_auditing} (导出时应只包含这些)')

conn.close()

if missed == 0:
    print('\n✅ 所有修复验证通过!')
else:
    print(f'\n❌ 还有 {missed} 条空附件名未标记')
