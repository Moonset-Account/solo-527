import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pandas as pd
import logging
from datetime import datetime

from data.db.models import db_manager, ReviewLog, AppealLog
from data.cleaning.mock_data_generator import generate_review_logs, generate_appeal_logs
from data.cache.redis_client import cache_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_database(force: bool = False) -> bool:
    if not db_manager.is_connected:
        logger.warning("⚠️  数据库未连接，跳过初始化")
        return False

    logger.info("🔧 开始初始化数据库...")

    if force:
        logger.info("🗑️  清空现有数据...")
        with db_manager.get_session() as session:
            session.execute("TRUNCATE TABLE review_logs CASCADE")
            session.execute("TRUNCATE TABLE appeal_logs CASCADE")
            session.commit()

    db_manager.create_tables()
    return True


def import_mock_data(hours: int = 72, count_per_hour: int = 400) -> bool:
    if not db_manager.is_connected:
        logger.warning("⚠️  数据库未连接，跳过数据导入")
        return False

    logger.info(f"📊 生成模拟数据（{hours}小时，{count_per_hour}条/小时）...")
    review_logs = generate_review_logs(hours=hours, count_per_hour=count_per_hour)
    appeal_logs = generate_appeal_logs(review_logs)

    logger.info(f"📥 导入审核日志: {len(review_logs)} 条")
    _import_review_logs(review_logs)

    logger.info(f"📥 导入申诉日志: {len(appeal_logs)} 条")
    _import_appeal_logs(appeal_logs)

    cache_client.clear()
    logger.info("✅ 数据导入完成，缓存已清空")
    return True


def _import_review_logs(df: pd.DataFrame, batch_size: int = 1000):
    with db_manager.get_session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            records = []
            for _, row in batch.iterrows():
                record = ReviewLog(
                    video_id=row["video_id"],
                    source=row["source"],
                    queue_type=row["queue_type"],
                    enqueue_time=row["enqueue_time"],
                    machine_risk_tags=row["machine_risk_tags"].tolist() if isinstance(row["machine_risk_tags"], pd.Series) else row["machine_risk_tags"],
                    machine_decision_time=row["machine_decision_time"] if pd.notna(row["machine_decision_time"]) else None,
                    reviewer_id=row["reviewer_id"] if pd.notna(row["reviewer_id"]) else None,
                    reviewer_start_time=row["reviewer_start_time"] if pd.notna(row["reviewer_start_time"]) else None,
                    reviewer_end_time=row["reviewer_end_time"] if pd.notna(row["reviewer_end_time"]) else None,
                    reviewer_decision=row["reviewer_decision"] if pd.notna(row["reviewer_decision"]) else None,
                    final_risk_tags=row["final_risk_tags"].tolist() if isinstance(row["final_risk_tags"], pd.Series) and pd.notna(row["final_risk_tags"]) else row["final_risk_tags"] if pd.notna(row["final_risk_tags"]) else [],
                    shift=row["shift"] if pd.notna(row["shift"]) else None,
                )
                records.append(record)
            session.bulk_save_objects(records)
            session.commit()
            logger.info(f"   已导入 {min(i + batch_size, len(df))}/{len(df)} 条审核日志")


def _import_appeal_logs(df: pd.DataFrame, batch_size: int = 500):
    with db_manager.get_session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            records = []
            for _, row in batch.iterrows():
                record = AppealLog(
                    appeal_id=str(row["appeal_id"]),
                    video_id=row["video_id"],
                    appeal_time=row["appeal_time"],
                    appeal_reason=row.get("appeal_reason"),
                    appeal_decision_time=row["appeal_decision_time"] if pd.notna(row["appeal_decision_time"]) else None,
                    appeal_result=row["appeal_result"],
                    appeal_reviewer=row.get("appeal_reviewer"),
                    original_risk_tags=row["original_risk_tags"].tolist() if isinstance(row["original_risk_tags"], pd.Series) else row["original_risk_tags"],
                    source=row.get("source"),
                    shift=row.get("shift"),
                    original_reviewer_id=row.get("original_reviewer_id"),
                    original_queue_type=row.get("original_queue_type"),
                )
                records.append(record)
            session.bulk_save_objects(records)
            session.commit()
            logger.info(f"   已导入 {min(i + batch_size, len(df))}/{len(df)} 条申诉日志")


def get_db_stats() -> dict:
    if not db_manager.is_connected:
        return {"connected": False}

    with db_manager.get_session() as session:
        review_count = session.query(ReviewLog).count()
        appeal_count = session.query(AppealLog).count()

        from sqlalchemy import func
        min_time = session.query(func.min(ReviewLog.enqueue_time)).scalar()
        max_time = session.query(func.max(ReviewLog.enqueue_time)).scalar()

    return {
        "connected": True,
        "review_logs_count": review_count,
        "appeal_logs_count": appeal_count,
        "time_range": {
            "start": min_time.isoformat() if min_time else None,
            "end": max_time.isoformat() if max_time else None,
        }
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="初始化 TimescaleDB 数据库")
    parser.add_argument("--force", action="store_true", help="清空现有数据重新导入")
    parser.add_argument("--hours", type=int, default=72, help="模拟数据小时数")
    parser.add_argument("--count", type=int, default=400, help="每小时数据条数")

    args = parser.parse_args()

    if init_database(force=args.force):
        import_mock_data(hours=args.hours, count_per_hour=args.count)
        stats = get_db_stats()
        print(f"\n📈 数据库统计: {stats}")
    else:
        print("❌ 数据库初始化失败，请检查连接配置")
        sys.exit(1)
