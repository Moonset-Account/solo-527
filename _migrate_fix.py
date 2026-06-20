from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print('=== 当前 api_status 表约束 ===')
    result = conn.execute(text("""
        SELECT conname, contype, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'api_status'::regclass
    """))
    for r in result:
        print(r)
    
    print()
    print('=== 删除旧约束 ===')
    try:
        conn.execute(text("ALTER TABLE api_status DROP CONSTRAINT IF EXISTS api_status_endpoint_key"))
        conn.commit()
        print('OK')
    except Exception as e:
        print(f'Error: {e}')
        conn.rollback()
    
    print()
    print('=== 添加 method+endpoint 联合唯一约束 ===')
    try:
        conn.execute(text("ALTER TABLE api_status ADD CONSTRAINT uq_api_status_method_endpoint UNIQUE (method, endpoint)"))
        conn.commit()
        print('OK')
    except Exception as e:
        print(f'Error: {e}')
        conn.rollback()
    
    print()
    print('=== 修复 NULL method ===')
    try:
        conn.execute(text("UPDATE api_status SET method = 'GET' WHERE method IS NULL OR method = ''"))
        conn.commit()
        print('OK')
    except Exception as e:
        print(f'Error: {e}')
        conn.rollback()

print()
print('=== 最终约束 ===')
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'api_status'::regclass
    """))
    for r in result:
        print(r)
