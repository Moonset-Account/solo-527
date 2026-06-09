"""backend/scripts/_cleanup_polluted_db.py — 只清理临时测试数据(vA/vB)，不删任何生产数据
运行：cd backend && python3 scripts/_cleanup_polluted_db.py
作用：从 app/data/app.db 的 model_versions 表删除 version 以 'v0.9.0-A' / 'v0.7.0-B' 开头的临时记录
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 必须先让 Base.metadata 注册所有 ORM 表，否则外键约束检测失败
from app.models import user, department, time_slot, appointment, model_version, risk_score, sms, callback, feedback
from app.core.database import SessionLocal
from app.models.model_version import ModelVersion

DB_POLLUTED_VERSIONS = {"v0.9.0-A", "v0.7.0-B"}

def main():
    db = SessionLocal()
    try:
        q = db.query(ModelVersion).filter(ModelVersion.version.in_(DB_POLLUTED_VERSIONS))
        count = q.count()
        if count == 0:
            print("✅ app.db 中没有检测到临时 vA/vB 脏数据，无需清理")
            return 0
        rows = q.all()
        for r in rows:
            print(f"  - 将删除: id={r.id} version={r.version} audit_log={str(r.audit_log)[:80]}")
        for r in rows:
            db.delete(r)
        db.commit()
        print(f"✅ 已从 app.db 的 model_versions 表删除 {count} 条临时测试记录")
        print(f"   保留所有用户/科室/模板/反馈/预约/评分等生产数据")
        return 0
    except Exception as e:
        print(f"❌ 清理失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    sys.exit(main())
