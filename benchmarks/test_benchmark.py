"""性能基准测试。

用于验证csv-validator在不同数据规模下的性能表现，
确保日常使用和CI环境中不会引入明显的性能问题。

运行方式:
    pytest benchmarks/test_benchmark.py --benchmark-autosave
    python benchmarks/test_benchmark.py
"""

from __future__ import annotations

import csv
import io
import time
from typing import Callable, List, Tuple

from csv_validator.schema import SchemaLoader
from csv_validator.validator import CSVValidator


BENCHMARK_SCHEMA_DICT = {
    "description": "性能基准测试Schema",
    "fields": [
        {"name": "id", "type": "integer", "required": True, "unique": True},
        {"name": "user_id", "type": "integer", "required": True},
        {"name": "product", "type": "string", "required": True},
        {"name": "quantity", "type": "integer", "min_value": 1, "max_value": 9999},
        {"name": "amount", "type": "float", "min_value": 0.01},
        {"name": "status", "type": "string", "enum": ["pending", "paid", "shipped", "delivered", "cancelled"]},
        {"name": "order_date", "type": "date", "format": "%Y-%m-%d"},
        {"name": "remark", "type": "string"},
    ],
    "unique_keys": [["user_id", "order_date"]],
}


def generate_csv(rows: int, error_rate: float = 0.0) -> str:
    """生成指定行数和错误率的测试CSV数据。"""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "user_id", "product", "quantity", "amount",
        "status", "order_date", "remark",
    ])
    statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
    for i in range(1, rows + 1):
        has_error = error_rate > 0 and (i % max(1, int(1 / error_rate))) == 0
        if has_error:
            writer.writerow([
                i, "NaN", "SKU" + str(i % 100), 0, -1.0,
                "unknown", "bad-date", "bad " * 10,
            ])
        else:
            writer.writerow([
                i, 1000 + (i % 500), "SKU" + str(i % 100),
                1 + (i % 10), round(9.99 + (i % 1000) * 0.5, 2),
                statuses[i % len(statuses)],
                f"2025-{1 + (i % 12):02d}-{1 + (i % 28):02d}",
                f"remark-{i}",
            ])
    return buf.getvalue()


def run_benchmark(
    validator_factory: Callable[[], CSVValidator],
    csv_data: str,
    iterations: int = 5,
) -> Tuple[float, float, List[float]]:
    """执行基准测试，返回 (平均耗时, 最小耗时, 所有耗时)。"""
    times: List[float] = []
    for _ in range(iterations):
        validator = validator_factory()
        start = time.perf_counter()
        result = validator.validate_string(csv_data)
        elapsed = time.perf_counter() - start
        times.append(elapsed)
        _ = result
    return sum(times) / len(times), min(times), times


def benchmark_cases():
    """标准性能基准用例。"""
    schema = SchemaLoader.from_dict(BENCHMARK_SCHEMA_DICT)
    cases = [
        ("100行-无错误", 100, 0.0),
        ("1000行-无错误", 1000, 0.0),
        ("1000行-10%错误", 1000, 0.1),
        ("10000行-无错误", 10000, 0.0),
        ("10000行-5%错误", 10000, 0.05),
    ]

    print("csv-validator 性能基准测试")
    print("=" * 70)
    print(f"{'场景':<20} {'平均(秒)':>10} {'最小(秒)':>10} {'行/秒':>12}")
    print("-" * 70)

    for name, rows, err_rate in cases:
        csv_data = generate_csv(rows, err_rate)
        avg, mn, _ = run_benchmark(
            lambda: CSVValidator(schema=schema),
            csv_data,
            iterations=3,
        )
        rps = rows / avg if avg > 0 else 0
        print(f"{name:<20} {avg:>10.4f} {mn:>10.4f} {rps:>12,.0f}")


try:
    import pytest

    def test_benchmark_small(benchmark):
        schema = SchemaLoader.from_dict(BENCHMARK_SCHEMA_DICT)
        csv_data = generate_csv(100, 0.0)
        v = CSVValidator(schema=schema)
        result = benchmark(v.validate_string, csv_data)
        assert result.total_rows == 100

    def test_benchmark_large(benchmark):
        schema = SchemaLoader.from_dict(BENCHMARK_SCHEMA_DICT)
        csv_data = generate_csv(10000, 0.02)
        v = CSVValidator(schema=schema)
        result = benchmark(v.validate_string, csv_data)
        assert result.total_rows == 10000
except ImportError:
    pass


if __name__ == "__main__":
    benchmark_cases()
