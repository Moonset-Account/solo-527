import asyncio
import time
from datetime import datetime
from .database import SessionLocal
from .services import logger, notification_service, redis_service
from .config import settings
from . import crud


async def check_notifications():
    while True:
        try:
            db = SessionLocal()
            try:
                low_stock_count = notification_service.check_low_stock(db)
                if low_stock_count > 0:
                    logger.info(f"检测到 {low_stock_count} 个低库存试剂")
                
                expiry_count = notification_service.check_expiry(db)
                if expiry_count > 0:
                    logger.info(f"检测到 {expiry_count} 个即将过期的试剂批次")
                
                process_offline_sync(db)
                
            finally:
                db.close()
        except Exception as e:
            logger.error(f"通知检查任务错误: {e}")
        
        await asyncio.sleep(settings.NOTIFICATION_CHECK_INTERVAL)


def process_offline_sync(db):
    try:
        pending_records = crud.offline_sync.get_all_pending(db)
        for record in pending_records:
            if record.retry_count >= 3:
                logger.warning(f"离线同步记录 {record.id} 重试次数过多，标记为失败")
                crud.offline_sync.mark_as_failed(
                    db, record_id=record.id, error_message="重试次数过多"
                )
                continue
            
            try:
                sync_data = record.data
                if record.sync_type == "batch_create":
                    from .schemas.reagent import ReagentBatchCreate
                    batch_in = ReagentBatchCreate(**sync_data)
                    crud.reagent_batch.create(db, obj_in=batch_in, created_by=record.user_id)
                elif record.sync_type == "requisition_create":
                    from .schemas.requisition import RequisitionCreate
                    req_in = RequisitionCreate(**sync_data)
                    crud.requisition.create(db, obj_in=req_in, created_by=record.user_id)
                
                crud.offline_sync.mark_as_synced(db, record_id=record.id)
                logger.info(f"离线同步记录 {record.id} 处理成功")
                
            except Exception as e:
                logger.error(f"处理离线同步记录 {record.id} 失败: {e}")
                crud.offline_sync.mark_as_failed(db, record_id=record.id, error_message=str(e))
    
    except Exception as e:
        logger.error(f"处理离线同步队列错误: {e}")


def process_queue():
    while True:
        try:
            item = redis_service.pop_queue("notifications")
            if item:
                logger.info(f"处理队列消息: {item}")
            else:
                time.sleep(1)
        except Exception as e:
            logger.error(f"队列处理错误: {e}")
            time.sleep(5)


async def main():
    logger.info("启动后台工作进程...")
    await check_notifications()


if __name__ == "__main__":
    asyncio.run(main())
