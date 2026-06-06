from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
import pandas as pd
from datetime import datetime
from app.database import get_db
from app.schemas import ReportExportRequest
from app.services.analytics_service import (
    get_overview_stats, get_reason_tree, get_cycle_distribution,
    get_product_ranking, get_service_duration_stats,
    get_dimension_stats, build_filter_query
)
from app.models import ReturnRequest, Order, Refund, CustomerService

router = APIRouter(prefix="/api/export", tags=["export"])


def flatten_reason_tree(tree, parent_path=""):
    rows = []
    for node in tree:
        current_path = f"{parent_path} > {node['name']}" if parent_path else node['name']
        rows.append({
            "原因层级": current_path,
            "退货数量": node['value'],
            "退货金额(元)": round(node['amount'], 2)
        })
        if node.get('children'):
            rows.extend(flatten_reason_tree(node['children'], current_path))
    return rows


@router.post("/report")
def export_report(request: ReportExportRequest, db: Session = Depends(get_db)):
    filters = request.filters

    overview = get_overview_stats(db, filters)
    reason_tree = get_reason_tree(db, filters)
    cycle_dist = get_cycle_distribution(db, filters)
    product_rank = get_product_ranking(db, filters)
    service_dur = get_service_duration_stats(db, filters)
    dim_stats = get_dimension_stats(db, filters)

    output = BytesIO()

    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        overview_df = pd.DataFrame([{
            "指标": "总退货单数",
            "数值": overview['total_returns']
        }, {
            "指标": "总退货金额(元)",
            "数值": round(overview['total_return_amount'], 2)
        }, {
            "指标": "退货率(%)",
            "数值": overview['return_rate']
        }, {
            "指标": "平均退款周期(天)",
            "数值": overview['avg_refund_cycle_days']
        }, {
            "指标": "平均客服处理时长(小时)",
            "数值": overview['avg_service_duration_hours']
        }, {
            "指标": "重复退货用户数",
            "数值": overview['repeat_return_user_count']
        }])
        overview_df.to_excel(writer, sheet_name='概览', index=False)

        reason_df = pd.DataFrame(flatten_reason_tree(reason_tree))
        reason_df.to_excel(writer, sheet_name='退货原因', index=False)

        cycle_df = pd.DataFrame([{
            "周期区间": item['bucket'],
            "退货单数": item['count'],
            "平均天数": item['avg_days']
        } for item in cycle_dist])
        cycle_df.to_excel(writer, sheet_name='退款周期分布', index=False)

        product_df = pd.DataFrame([{
            "商品ID": item['product_id'],
            "商品名称": item['product_name'],
            "退货数量": item['return_count'],
            "退货率(%)": item['return_rate'],
            "退货金额(元)": round(item['return_amount'], 2)
        } for item in product_rank])
        product_df.to_excel(writer, sheet_name='商品排行', index=False)

        service_df = pd.DataFrame([{
            "客服人员": item['agent_name'],
            "处理工单数量": item['case_count'],
            "平均处理时长(小时)": item['avg_duration'],
            "中位处理时长(小时)": item['median_duration']
        } for item in service_dur])
        service_df.to_excel(writer, sheet_name='客服处理时长', index=False)

        for dim_name, stats in dim_stats.items():
            dim_df = pd.DataFrame([{
                "名称": item['name'],
                "退货数量": item['count'],
                "退货金额(元)": round(item['amount'], 2),
                "平均退款周期(天)": item['avg_cycle_days']
            } for item in stats])
            sheet_name = {"store": "店铺维度", "warehouse": "仓库维度",
                         "logistics": "物流商维度", "category": "品类维度"}.get(dim_name, dim_name)
            dim_df.to_excel(writer, sheet_name=sheet_name, index=False)

        filters_df = pd.DataFrame([{
            "筛选条件": k,
            "值": str(v)
        } for k, v in filters.items()])
        filters_df.to_excel(writer, sheet_name='筛选条件', index=False)

    output.seek(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"退货分析报告_{timestamp}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/details")
def export_details(filters: dict, db: Session = Depends(get_db)):
    base_query = build_filter_query(db, filters).join(
        Order, ReturnRequest.order_id == Order.id
    ).outerjoin(
        Refund, ReturnRequest.id == Refund.return_request_id
    ).outerjoin(
        CustomerService, ReturnRequest.id == CustomerService.return_request_id
    )

    data = base_query.with_entities(
        ReturnRequest.return_no,
        Order.order_no,
        Order.store_name,
        Order.product_name,
        Order.product_category,
        ReturnRequest.return_reason_level1,
        ReturnRequest.return_reason_level2,
        ReturnRequest.return_amount,
        ReturnRequest.apply_time,
        Refund.refund_time,
        CustomerService.handling_duration,
        ReturnRequest.status
    ).all()

    df = pd.DataFrame(data, columns=[
        "退货单号", "订单号", "店铺", "商品名称", "品类",
        "一级原因", "二级原因", "退货金额", "申请时间",
        "退款时间", "客服处理时长(小时)", "状态"
    ])

    output = BytesIO()
    df.to_excel(output, index=False, engine='openpyxl')
    output.seek(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"退货明细_{timestamp}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
