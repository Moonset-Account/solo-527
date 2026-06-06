#!/usr/bin/env python3
# ========================================
# 仓库SKU周转与滞销分析 - Airflow DAG
# 日终库存结算 + 数据同步 + 报表生成
# ========================================

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.email import EmailOperator
from airflow.sensors.date_time import DateTimeSensor

default_args = {
    'owner': 'supply_chain',
    'depends_on_past': False,
    'email': ['sc-analytics@example.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'daily_inventory_analysis',
    default_args=default_args,
    description='仓库库存分析日终任务：日结→同步→预警→报表',
    schedule_interval='0 2 * * *',  # 每天凌晨2点
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['inventory', 'supply_chain', 'daily'],
    max_active_runs=1,
) as dag:

    # 1. 等待日结时间
    wait_for_midnight = DateTimeSensor(
        task_id='wait_for_midnight',
        target_time="{{ execution_date.add(hours=2) }}",
        mode='reschedule',
    )

    # 2. 执行库存日结（PostgreSQL存储过程）
    run_inventory_closing = BashOperator(
        task_id='run_inventory_closing',
        bash_command="""
            PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE \
                -c "SELECT fn_inventory_closing('{{ ds }}'::DATE);"
        """,
        env={
            'PG_HOST': '{{ var.value.pg_host }}',
            'PG_PORT': '{{ var.value.pg_port }}',
            'PG_DATABASE': '{{ var.value.pg_database }}',
            'PG_USER': '{{ var.value.pg_user }}',
            'PG_PASSWORD': '{{ var.value.pg_password }}',
        },
    )

    # 3. 增量同步到ClickHouse
    sync_to_clickhouse = BashOperator(
        task_id='sync_to_clickhouse',
        bash_command="cd /opt/airflow/dags/scripts && python full_load.py incremental 3",
    )

    # 4. 刷新ClickHouse物化视图
    refresh_materialized_views = BashOperator(
        task_id='refresh_materialized_views',
        bash_command="""
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "OPTIMIZE TABLE dws_sku_inventory_daily FINAL;"
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "OPTIMIZE TABLE dws_inventory_age_summary FINAL;"
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "OPTIMIZE TABLE dws_batch_inventory_daily FINAL;"
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "OPTIMIZE TABLE dws_sku_turnover_monthly FINAL;"
        """,
        env={
            'CH_HOST': '{{ var.value.ch_host }}',
            'CH_PORT': '{{ var.value.ch_port }}',
            'CH_DATABASE': '{{ var.value.ch_database }}',
        },
    )

    # 5. 生成近效期预警
    generate_expiry_alerts = BashOperator(
        task_id='generate_expiry_alerts',
        bash_command="""
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "
                    SELECT
                        sku_code,
                        sku_name,
                        batch_no,
                        expiry_date,
                        days_to_expiry,
                        closing_qty,
                        warehouse_name
                    FROM ads_inventory_alerts
                    WHERE snapshot_date = '{{ ds }}'
                      AND expiry_status IN ('临期(7天内)', '近效期(30天内)')
                    ORDER BY days_to_expiry ASC
                    INTO OUTFILE '/tmp/expiry_alerts_{{ ds }}.csv'
                    FORMAT CSVWithNames
                "
        """,
        env={
            'CH_HOST': '{{ var.value.ch_host }}',
            'CH_PORT': '{{ var.value.ch_port }}',
            'CH_DATABASE': '{{ var.value.ch_database }}',
        },
    )

    # 6. 生成滞销预警
    generate_slow_moving_alerts = BashOperator(
        task_id='generate_slow_moving_alerts',
        bash_command="""
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "
                    SELECT
                        sku_code,
                        sku_name,
                        category_l1,
                        category_l2,
                        warehouse_name,
                        closing_qty,
                        inventory_age_days,
                        last_30d_outbound
                    FROM ads_inventory_alerts
                    WHERE snapshot_date = '{{ ds }}'
                      AND slow_moving_status != '正常'
                    ORDER BY inventory_age_days DESC
                    INTO OUTFILE '/tmp/slow_moving_alerts_{{ ds }}.csv'
                    FORMAT CSVWithNames
                "
        """,
        env={
            'CH_HOST': '{{ var.value.ch_host }}',
            'CH_PORT': '{{ var.value.ch_port }}',
            'CH_DATABASE': '{{ var.value.ch_database }}',
        },
    )

    # 7. 生成补货建议
    generate_replenishment_report = BashOperator(
        task_id='generate_replenishment_report',
        bash_command="""
            clickhouse-client -h $CH_HOST --port $CH_PORT -d $CH_DATABASE \
                -q "
                    SELECT *
                    FROM ads_replenishment_suggestion
                    WHERE stock_status IN ('严重缺货', '建议补货')
                    ORDER BY stock_status, days_of_supply ASC
                    INTO OUTFILE '/tmp/replenishment_{{ ds }}.csv'
                    FORMAT CSVWithNames
                "
        """,
        env={
            'CH_HOST': '{{ var.value.ch_host }}',
            'CH_PORT': '{{ var.value.ch_port }}',
            'CH_DATABASE': '{{ var.value.ch_database }}',
        },
    )

    # 8. 发送预警邮件
    send_alert_email = EmailOperator(
        task_id='send_alert_email',
        to=[
            'sc-analysts@example.com',
            'warehouse-manager@example.com',
            'purchasing@example.com',
        ],
        subject='【库存预警】{{ ds }} 日终库存分析报告',
        html_content="""
            <h3>{{ ds }} 日终库存分析报告</h3>
            <p>附件包含：</p>
            <ul>
                <li>近效期预警清单</li>
                <li>滞销SKU预警清单</li>
                <li>补货建议清单</li>
            </ul>
            <p>请及时查看并处理相关异常。</p>
            <p>仪表盘链接：<a href="http://superset:8088/superset/dashboard/inventory-analysis/">
                库存分析工作台
            </a></p>
        """,
        files=[
            '/tmp/expiry_alerts_{{ ds }}.csv',
            '/tmp/slow_moving_alerts_{{ ds }}.csv',
            '/tmp/replenishment_{{ ds }}.csv',
        ],
    )

    # 9. 周一生成周报表
    @task.branch(task_id="is_monday")
    def is_monday(**context):
        execution_date = context['execution_date']
        return 'generate_weekly_report' if execution_date.weekday() == 0 else 'end'

    generate_weekly_report = BashOperator(
        task_id='generate_weekly_report',
        bash_command="""
            echo "Generating weekly report..."
            # 此处可调用Superset API导出PDF周报
        """,
    )

    # 任务编排
    wait_for_midnight >> run_inventory_closing >> sync_to_clickhouse >> refresh_materialized_views

    refresh_materialized_views >> [
        generate_expiry_alerts,
        generate_slow_moving_alerts,
        generate_replenishment_report,
    ]

    [
        generate_expiry_alerts,
        generate_slow_moving_alerts,
        generate_replenishment_report,
    ] >> send_alert_email

    send_alert_email >> is_monday() >> generate_weekly_report
