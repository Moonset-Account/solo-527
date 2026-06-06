#!/usr/bin/env python3
# ========================================
# 仓库SKU周转与滞销分析 - 数据质量检查脚本
# 验收时用于检查缺失值、异常点、样本量
# ========================================

import sys
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict, Any

import clickhouse_connect
import click

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
ENDC = '\033[0m'

@dataclass
class CheckResult:
    check_name: str
    passed: bool
    severity: str  # high/medium/low
    message: str
    actual_value: Any = None
    expected_value: Any = None


class DataQualityChecker:
    def __init__(self, host='clickhouse', port=8123, database='inventory_analysis'):
        self.client = clickhouse_connect.get_client(
            host=host, port=port, database=database
        )
        self.results: List[CheckResult] = []

    def run_check(self, result: CheckResult):
        self.results.append(result)
        status = f"{GREEN}✓ PASS{ENDC}" if result.passed else f"{RED}✗ FAIL{ENDC}"
        severity = f"[{result.severity.upper()}]" if not result.passed else ""
        logger.info(f"{status} {severity} {result.check_name}: {result.message}")
        if not result.passed and result.actual_value is not None:
            logger.info(f"       实际值: {result.actual_value}, 期望值: {result.expected_value}")

    # ========================================
    # 1. 样本量检查
    # ========================================
    def check_sample_size(self, table_name: str, min_rows: int = 100):
        result = self.client.query(f"SELECT count(*) FROM {table_name}")
        row_count = result.result_rows[0][0]
        passed = row_count >= min_rows
        self.run_check(CheckResult(
            check_name=f"样本量检查 - {table_name}",
            passed=passed,
            severity='high' if not passed else 'low',
            message=f"表数据量 {'达标' if passed else '不足'}",
            actual_value=row_count,
            expected_value=f">= {min_rows}",
        ))

    # ========================================
    # 2. 缺失值检查
    # ========================================
    def check_missing_values(self, table_name: str, columns: List[str], max_missing_pct: float = 1.0):
        for col in columns:
            result = self.client.query(f"""
                SELECT
                    count(*) AS total,
                    countIf({col} IS NULL) AS missing
                FROM {table_name}
            """)
            total, missing = result.result_rows[0]
            missing_pct = (missing / total * 100) if total > 0 else 0
            passed = missing_pct <= max_missing_pct
            self.run_check(CheckResult(
                check_name=f"缺失值检查 - {table_name}.{col}",
                passed=passed,
                severity='high' if missing_pct > 10 else 'medium' if missing_pct > 1 else 'low',
                message=f"缺失率 {missing_pct:.2f}% {'在允许范围内' if passed else '超出阈值'}",
                actual_value=f"{missing_pct:.2f}%",
                expected_value=f"<= {max_missing_pct}%",
            ))

    # ========================================
    # 3. 异常值检查
    # ========================================
    def check_negative_inventory(self):
        result = self.client.query("""
            SELECT count(*) FROM ods_inventory_detail
            WHERE closing_qty < 0
        """)
        negative_count = result.result_rows[0][0]
        passed = negative_count == 0
        self.run_check(CheckResult(
            check_name="异常值检查 - 负库存",
            passed=passed,
            severity='high',
            message=f"发现 {negative_count} 条负库存记录",
            actual_value=negative_count,
            expected_value=0,
        ))

    def check_inventory_balance(self, check_date: str = None):
        if not check_date:
            check_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

        result = self.client.query(f"""
            SELECT
                sum(opening_qty) AS opening,
                sum(inbound_qty) AS inbound,
                sum(outbound_qty) AS outbound,
                sum(return_in_qty - return_out_qty) AS return_net,
                sum(closing_qty) AS closing
            FROM ods_inventory_detail
            WHERE snapshot_date = '{check_date}'
        """)
        opening, inbound, outbound, return_net, closing = result.result_rows[0]
        expected_closing = opening + inbound - outbound + return_net
        diff = abs(closing - expected_closing)
        passed = diff < 0.01  # 允许浮点误差
        self.run_check(CheckResult(
            check_name=f"库存平衡检查 - {check_date}",
            passed=passed,
            severity='high',
            message=f"期初{opening} + 入库{inbound} - 出库{outbound} + 净退货{return_net} {'=' if passed else '≠'} 期末{closing}",
            actual_value=closing,
            expected_value=expected_closing,
        ))

    def check_duplicate_batch(self, check_date: str = None):
        if not check_date:
            check_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

        result = self.client.query(f"""
            SELECT count(*) FROM (
                SELECT sku_id, warehouse_id, location_id, batch_no, count(*) AS cnt
                FROM ods_inventory_detail
                WHERE snapshot_date = '{check_date}'
                GROUP BY sku_id, warehouse_id, location_id, batch_no
                HAVING cnt > 1
            )
        """)
        dup_count = result.result_rows[0][0]
        passed = dup_count == 0
        self.run_check(CheckResult(
            check_name=f"批次去重检查 - {check_date}",
            passed=passed,
            severity='medium',
            message=f"发现 {dup_count} 组重复批次记录",
            actual_value=dup_count,
            expected_value=0,
        ))

    # ========================================
    # 4. 数据一致性检查
    # ========================================
    def check_data_consistency(self):
        result = self.client.query("""
            SELECT
                (SELECT max(snapshot_date) FROM ods_inventory_detail) AS inv_max_date,
                (SELECT max(order_date) FROM ods_inbound_detail) AS inbound_max_date,
                (SELECT max(order_date) FROM ods_outbound_detail) AS outbound_max_date
        """)
        inv_max, inbound_max, outbound_max = result.result_rows[0]
        today = datetime.now().date()
        inv_lag = (today - inv_max).days if inv_max else 999
        passed = inv_lag <= 2
        self.run_check(CheckResult(
            check_name="数据新鲜度检查",
            passed=passed,
            severity='high' if inv_lag > 7 else 'medium',
            message=f"库存数据最新到 {inv_max}, 延迟 {inv_lag} 天",
            actual_value=f"{inv_lag}天",
            expected_value="<= 2天",
        ))

    def check_sku_consistency(self):
        result = self.client.query("""
            SELECT
                count(DISTINCT sku_id) AS inv_skus,
                (SELECT count(DISTINCT sku_id) FROM ods_inbound_detail) AS inbound_skus,
                (SELECT count(DISTINCT sku_id) FROM ods_outbound_detail) AS outbound_skus
            FROM ods_inventory_detail
        """)
        inv_skus, inbound_skus, outbound_skus = result.result_rows[0]
        passed = inv_skus > 0 and inbound_skus > 0 and outbound_skus > 0
        self.run_check(CheckResult(
            check_name="SKU一致性检查",
            passed=passed,
            severity='medium',
            message=f"库存表{inv_skus}个SKU, 入库表{inbound_skus}个, 出库表{outbound_skus}个",
        ))

    # ========================================
    # 5. 指标合理性检查
    # ========================================
    def check_metric_reasonableness(self):
        result = self.client.query("""
            SELECT
                avg(turnover_days) AS avg_turnover_days,
                max(turnover_days) AS max_turnover_days,
                min(turnover_days) AS min_turnover_days
            FROM ads_turnover_ranking
        """)
        avg_turnover, max_turnover, min_turnover = result.result_rows[0]
        passed = 0 < avg_turnover < 365
        self.run_check(CheckResult(
            check_name="周转天数合理性",
            passed=passed,
            severity='medium',
            message=f"平均周转天数 {avg_turnover:.1f} 天 (范围: {min_turnover:.0f} ~ {max_turnover:.0f})",
            actual_value=avg_turnover,
            expected_value="0 ~ 365天",
        ))

    # ========================================
    # 运行全部检查
    # ========================================
    def run_all_checks(self):
        logger.info("=" * 70)
        logger.info("开始数据质量检查")
        logger.info("=" * 70)

        # 1. 样本量
        logger.info("\n--- 1. 样本量检查 ---")
        self.check_sample_size('ods_inventory_detail', min_rows=100)
        self.check_sample_size('ods_inbound_detail', min_rows=50)
        self.check_sample_size('ods_outbound_detail', min_rows=50)
        self.check_sample_size('ods_return_detail', min_rows=10)

        # 2. 缺失值
        logger.info("\n--- 2. 缺失值检查 ---")
        self.check_missing_values('ods_inventory_detail',
            ['sku_id', 'sku_code', 'warehouse_id', 'batch_no', 'snapshot_date', 'closing_qty'])
        self.check_missing_values('ods_inbound_detail',
            ['inbound_no', 'sku_id', 'order_date', 'actual_qty'])
        self.check_missing_values('ods_outbound_detail',
            ['outbound_no', 'sku_id', 'order_date', 'actual_qty'])

        # 3. 异常值
        logger.info("\n--- 3. 异常值检查 ---")
        self.check_negative_inventory()
        self.check_inventory_balance()
        self.check_duplicate_batch()

        # 4. 一致性
        logger.info("\n--- 4. 数据一致性检查 ---")
        self.check_data_consistency()
        self.check_sku_consistency()

        # 5. 指标合理性
        logger.info("\n--- 5. 指标合理性检查 ---")
        self.check_metric_reasonableness()

        # 汇总
        logger.info("\n" + "=" * 70)
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        high_severity = sum(1 for r in self.results if not r.passed and r.severity == 'high')

        logger.info(f"检查汇总: {GREEN}{passed} 通过{ENDC}, {RED}{failed} 失败{ENDC} ({YELLOW}{high_severity} 高危{ENDC})")
        logger.info("=" * 70)

        return self.results


@click.command()
@click.option('--host', default='clickhouse', help='ClickHouse host')
@click.option('--port', default=8123, type=int, help='ClickHouse port')
@click.option('--database', default='inventory_analysis', help='ClickHouse database')
def main(host, port, database):
    checker = DataQualityChecker(host=host, port=port, database=database)
    results = checker.run_all_checks()

    # 有高危失败则退出码非0
    has_high_severity = any(not r.passed and r.severity == 'high' for r in results)
    sys.exit(1 if has_high_severity else 0)


if __name__ == '__main__':
    main()
