#!/usr/bin/env python3
# ========================================
# 仓库SKU周转与滞销分析 - 全量数据同步脚本
# PostgreSQL → ClickHouse
# ========================================

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

import psycopg2
from psycopg2.extras import RealDictCursor
import clickhouse_connect
from clickhouse_connect.driver import Client

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置
PG_CONFIG = {
    'host': os.environ.get('PG_HOST', 'postgres'),
    'port': int(os.environ.get('PG_PORT', 5432)),
    'database': os.environ.get('PG_DATABASE', 'inventory'),
    'user': os.environ.get('PG_USER', 'postgres'),
    'password': os.environ.get('PG_PASSWORD', 'postgres'),
}

CH_CONFIG = {
    'host': os.environ.get('CH_HOST', 'clickhouse'),
    'port': int(os.environ.get('CH_PORT', 8123)),
    'username': os.environ.get('CH_USER', 'default'),
    'password': os.environ.get('CH_PASSWORD', ''),
    'database': os.environ.get('CH_DATABASE', 'inventory_analysis'),
}

# 同步任务配置
SYNC_TASKS = [
    {
        'pg_view': 'vw_inventory_detail',
        'ch_table': 'ods_inventory_detail',
        'date_column': 'snapshot_date',
        'incremental': True,
    },
    {
        'pg_view': 'vw_inbound_detail',
        'ch_table': 'ods_inbound_detail',
        'date_column': 'order_date',
        'incremental': True,
    },
    {
        'pg_view': 'vw_outbound_detail',
        'ch_table': 'ods_outbound_detail',
        'date_column': 'order_date',
        'incremental': True,
    },
    {
        'pg_view': 'vw_return_detail',
        'ch_table': 'ods_return_detail',
        'date_column': 'return_date',
        'incremental': True,
    },
    {
        'pg_view': 'vw_safety_stock',
        'ch_table': 'ods_safety_stock',
        'date_column': 'effective_date',
        'incremental': False,
    },
]

BATCH_SIZE = 10000


class DataSyncer:
    def __init__(self):
        self.pg_conn = None
        self.ch_client: Client = None

    def connect(self):
        logger.info("Connecting to PostgreSQL...")
        self.pg_conn = psycopg2.connect(**PG_CONFIG)
        self.pg_conn.autocommit = True

        logger.info("Connecting to ClickHouse...")
        self.ch_client = clickhouse_connect.get_client(**CH_CONFIG)

    def disconnect(self):
        if self.pg_conn:
            self.pg_conn.close()
        if self.ch_client:
            self.ch_client.close()

    def get_table_columns(self, ch_table: str) -> List[str]:
        result = self.ch_client.query(f"DESCRIBE TABLE {ch_table}")
        return [row[0] for row in result.result_rows]

    def full_sync_table(self, task: Dict[str, Any]):
        pg_view = task['pg_view']
        ch_table = task['ch_table']

        logger.info(f"Starting full sync: {pg_view} → {ch_table}")

        columns = self.get_table_columns(ch_table)
        columns_str = ', '.join(columns)

        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SELECT {columns_str} FROM {pg_view}")
            total = cur.rowcount
            logger.info(f"Total rows to sync: {total}")

            batch_num = 0
            while True:
                rows = cur.fetchmany(BATCH_SIZE)
                if not rows:
                    break

                batch_num += 1
                data = [[row[col] for col in columns] for row in rows]

                self.ch_client.insert(
                    ch_table,
                    data,
                    column_names=columns,
                )

                processed = batch_num * BATCH_SIZE
                logger.info(f"  Batch {batch_num}: processed {min(processed, total)}/{total} rows")

        logger.info(f"Full sync completed: {pg_view} → {ch_table}")

    def incremental_sync_table(self, task: Dict[str, Any], start_date: datetime = None, end_date: datetime = None):
        if not task['incremental']:
            logger.info(f"Table {task['ch_table']} does not support incremental sync, running full sync")
            self.full_sync_table(task)
            return

        pg_view = task['pg_view']
        ch_table = task['ch_table']
        date_column = task['date_column']

        if not end_date:
            end_date = datetime.now().date()
        if not start_date:
            result = self.ch_client.query(f"SELECT MAX({date_column}) FROM {ch_table}")
            max_date = result.result_rows[0][0]
            start_date = max_date if max_date else (end_date - timedelta(days=30))

        logger.info(f"Starting incremental sync: {pg_view} → {ch_table} (from {start_date} to {end_date})")

        columns = self.get_table_columns(ch_table)
        columns_str = ', '.join(columns)

        self.ch_client.command(
            f"ALTER TABLE {ch_table} DELETE WHERE {date_column} >= '{start_date}' AND {date_column} <= '{end_date}'"
        )

        with self.pg_conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT {columns_str}
                FROM {pg_view}
                WHERE {date_column} >= %s AND {date_column} <= %s
            """
            cur.execute(query, (start_date, end_date))
            total = cur.rowcount
            logger.info(f"Rows to sync: {total}")

            batch_num = 0
            while True:
                rows = cur.fetchmany(BATCH_SIZE)
                if not rows:
                    break

                batch_num += 1
                data = [[row[col] for col in columns] for row in rows]

                self.ch_client.insert(
                    ch_table,
                    data,
                    column_names=columns,
                )

                processed = batch_num * BATCH_SIZE
                logger.info(f"  Batch {batch_num}: processed {min(processed, total)}/{total} rows")

        logger.info(f"Incremental sync completed: {pg_view} → {ch_table}")

    def refresh_materialized_views(self):
        logger.info("Refreshing DWS layer materialized views...")

        views = [
            ('dws_sku_inventory_daily', 'aggregating'),
            ('dws_inventory_age_summary', 'aggregating'),
            ('dws_batch_inventory_daily', 'aggregating'),
            ('dws_sku_turnover_monthly', 'aggregating'),
        ]

        for view_name, view_type in views:
            logger.info(f"  Optimizing {view_name}...")
            self.ch_client.command(f"OPTIMIZE TABLE {view_name} FINAL")

        logger.info("Materialized views refresh completed")

    def run_full_sync(self):
        logger.info("=" * 60)
        logger.info("Starting FULL data sync")
        logger.info("=" * 60)

        self.connect()
        try:
            for task in SYNC_TASKS:
                self.full_sync_table(task)

            self.refresh_materialized_views()
            logger.info("Full sync completed successfully!")
        except Exception as e:
            logger.error(f"Full sync failed: {str(e)}", exc_info=True)
            raise
        finally:
            self.disconnect()

    def run_incremental_sync(self, days: int = 7):
        logger.info("=" * 60)
        logger.info(f"Starting INCREMENTAL data sync (last {days} days)")
        logger.info("=" * 60)

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)

        self.connect()
        try:
            for task in SYNC_TASKS:
                self.incremental_sync_table(task, start_date, end_date)

            self.refresh_materialized_views()
            logger.info("Incremental sync completed successfully!")
        except Exception as e:
            logger.error(f"Incremental sync failed: {str(e)}", exc_info=True)
            raise
        finally:
            self.disconnect()


def main():
    syncer = DataSyncer()

    if len(sys.argv) > 1 and sys.argv[1] == 'incremental':
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
        syncer.run_incremental_sync(days)
    else:
        syncer.run_full_sync()


if __name__ == '__main__':
    main()
