"""
数据库结构同步脚本 - 补齐以下列：
  1. apartments.remark     （房源备注）
  2. contract_risks.remark （合同风险备注）
  3. attachments.entity_type / attachments.entity_id  （附件多态关联，兼容 apartment_id）

用法：
    python3 scripts/migrate_schema.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

STATEMENTS = [
    # 房源备注
    "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS remark TEXT;",

    # 合同风险备注
    "ALTER TABLE contract_risks ADD COLUMN IF NOT EXISTS remark TEXT;",

    # 附件多态关联（支持 deposits / risks / apartments / appointments 等）
    "ALTER TABLE attachments ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);",
    "ALTER TABLE attachments ADD COLUMN IF NOT EXISTS entity_id INTEGER;",

    # 把已有 apartment_id 同步到 entity_type / entity_id，保证历史数据可用
    "UPDATE attachments SET entity_type = 'apartment', entity_id = apartment_id "
    "WHERE entity_type IS NULL AND apartment_id IS NOT NULL;",
]


def main():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            for sql in STATEMENTS:
                print(f"  => {sql.split(';')[0][:80]}")
                conn.execute(text(sql))
            trans.commit()
            print("✅ 数据库迁移完成")
        except Exception as e:
            trans.rollback()
            print(f"❌ 迁移失败: {e}")
            raise


if __name__ == "__main__":
    main()
