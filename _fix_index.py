from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print('=== 删除旧的唯一索引 ix_api_status_endpoint ===')
    try:
        conn.execute(text("DROP INDEX IF EXISTS ix_api_status_endpoint"))
        conn.commit()
        print('OK')
    except Exception as e:
        print(f'Error: {e}')
        conn.rollback()

print()
print('=== 最终所有索引和约束 ===')
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'api_status'
        UNION ALL
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'api_status'::regclass
    """))
    for r in result:
        print(r)
