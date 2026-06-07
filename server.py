"""
内容安全审核积压看板 - 统一启动入口
FastAPI 作为顶层服务，挂载 Dash 和所有 API 接口
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from data.api.main import app as api_app


@api_app.on_event("startup")
async def startup_event():
    logger.info("🚀 服务启动中...")

    try:
        from data.db.models import db_manager
        if db_manager.is_connected:
            logger.info("🔧 初始化数据库...")
            from data.db.init_db import init_database, get_db_stats, import_mock_data
            init_database(force=False)
            stats = get_db_stats()
            if stats.get("review_logs_count", 0) == 0:
                logger.info("📥 数据库为空，正在导入模拟数据...")
                import_mock_data(hours=72, count_per_hour=400)
                stats = get_db_stats()
            logger.info(f"📊 数据库就绪: {stats}")
        else:
            logger.info("ℹ️  数据库未连接，使用内存模拟数据")
    except Exception as e:
        logger.warning(f"⚠️  数据库初始化失败，使用内存数据: {e}")

    try:
        from data.cache.redis_client import cache_client
        if hasattr(cache_client, 'clear'):
            cache_client.clear()
        logger.info("✅ 缓存已清空")
    except Exception as e:
        logger.info(f"ℹ️  缓存初始化跳过: {e}")

    logger.info("🎉 服务启动完成！")
    logger.info("📊 看板地址: http://localhost:8050")
    logger.info("📡 API 文档: http://localhost:8050/docs")


try:
    from app.app import app as dash_app
    api_app.mount("/", WSGIMiddleware(dash_app.server))
    logger.info("✅ Dash 看板已挂载")
except Exception as e:
    logger.warning(f"⚠️  Dash 挂载失败: {e}")


app = api_app


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8050,
        reload=False,
        workers=1,
    )
