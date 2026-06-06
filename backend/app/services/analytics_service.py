from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, extract
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models import Order, ReturnRequest, Inspection, Refund, ReturnLogistics, CustomerService
from decimal import Decimal


def build_filter_query(db: Session, filters: Dict[str, Any]):
    query = db.query(ReturnRequest).join(Order, ReturnRequest.order_id == Order.id)

    conditions = []

    if filters.get("start_date"):
        start_date = datetime.strptime(filters["start_date"], "%Y-%m-%d")
        conditions.append(ReturnRequest.apply_time >= start_date)
    if filters.get("end_date"):
        end_date = datetime.strptime(filters["end_date"], "%Y-%m-%d") + timedelta(days=1)
        conditions.append(ReturnRequest.apply_time < end_date)
    if filters.get("store_ids"):
        conditions.append(Order.store_id.in_(filters["store_ids"]))
    if filters.get("product_ids"):
        conditions.append(Order.product_id.in_(filters["product_ids"]))
    if filters.get("product_categories"):
        conditions.append(Order.product_category.in_(filters["product_categories"]))
    if filters.get("warehouse_ids"):
        conditions.append(Order.warehouse_id.in_(filters["warehouse_ids"]))
    if filters.get("logistics_providers"):
        conditions.append(Order.logistics_provider.in_(filters["logistics_providers"]))
    if filters.get("return_reasons_level1"):
        conditions.append(ReturnRequest.return_reason_level1.in_(filters["return_reasons_level1"]))
    if filters.get("return_reasons_level2"):
        conditions.append(ReturnRequest.return_reason_level2.in_(filters["return_reasons_level2"]))
    if filters.get("status"):
        conditions.append(ReturnRequest.status.in_(filters["status"]))

    if conditions:
        query = query.filter(and_(*conditions))

    return query


def get_overview_stats(db: Session, filters: Dict[str, Any]) -> Dict[str, Any]:
    base_query = build_filter_query(db, filters)

    total_returns = base_query.count()

    total_amount = base_query.with_entities(
        func.coalesce(func.sum(ReturnRequest.return_amount), 0)
    ).scalar()

    orders_query = db.query(Order)
    if filters.get("start_date"):
        start_date = datetime.strptime(filters["start_date"], "%Y-%m-%d")
        orders_query = orders_query.filter(Order.created_at >= start_date)
    if filters.get("end_date"):
        end_date = datetime.strptime(filters["end_date"], "%Y-%m-%d") + timedelta(days=1)
        orders_query = orders_query.filter(Order.created_at < end_date)
    if filters.get("store_ids"):
        orders_query = orders_query.filter(Order.store_id.in_(filters["store_ids"]))
    if filters.get("product_ids"):
        orders_query = orders_query.filter(Order.product_id.in_(filters["product_ids"]))
    if filters.get("product_categories"):
        orders_query = orders_query.filter(Order.product_category.in_(filters["product_categories"]))
    if filters.get("warehouse_ids"):
        orders_query = orders_query.filter(Order.warehouse_id.in_(filters["warehouse_ids"]))

    total_orders = orders_query.count()
    return_rate = (total_returns / total_orders * 100) if total_orders > 0 else 0

    avg_cycle = db.query(
        func.avg(
            func.extract('epoch', Refund.refund_time - ReturnRequest.apply_time) / 86400
        )
    ).join(ReturnRequest, Refund.return_request_id == ReturnRequest.id)

    avg_cycle = build_filter_query(db, filters).join(
        Refund, ReturnRequest.id == Refund.return_request_id
    ).with_entities(
        func.avg(
            func.extract('epoch', Refund.refund_time - ReturnRequest.apply_time) / 86400
        )
    ).scalar() or 0

    avg_service = build_filter_query(db, filters).join(
        CustomerService, ReturnRequest.id == CustomerService.return_request_id
    ).with_entities(
        func.avg(CustomerService.handling_duration)
    ).scalar() or 0

    repeat_users = build_filter_query(db, filters).with_entities(
        ReturnRequest.user_hash,
        func.count(ReturnRequest.id).label('return_count')
    ).group_by(ReturnRequest.user_hash).having(
        func.count(ReturnRequest.id) >= 2
    ).count()

    return {
        "total_returns": total_returns,
        "total_return_amount": float(total_amount or 0),
        "return_rate": round(return_rate, 2),
        "avg_refund_cycle_days": round(avg_cycle, 1),
        "avg_service_duration_hours": round(avg_service, 1),
        "repeat_return_user_count": repeat_users
    }


def get_reason_tree(db: Session, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    base_query = build_filter_query(db, filters)

    level1_data = base_query.with_entities(
        ReturnRequest.return_reason_level1,
        func.count(ReturnRequest.id),
        func.coalesce(func.sum(ReturnRequest.return_amount), 0)
    ).group_by(ReturnRequest.return_reason_level1).all()

    result = []
    for l1_name, l1_count, l1_amount in level1_data:
        if not l1_name:
            continue

        level2_data = base_query.filter(
            ReturnRequest.return_reason_level1 == l1_name
        ).with_entities(
            ReturnRequest.return_reason_level2,
            func.count(ReturnRequest.id),
            func.coalesce(func.sum(ReturnRequest.return_amount), 0)
        ).group_by(ReturnRequest.return_reason_level2).all()

        children_l2 = []
        for l2_name, l2_count, l2_amount in level2_data:
            if not l2_name:
                continue

            level3_data = base_query.filter(
                ReturnRequest.return_reason_level1 == l1_name,
                ReturnRequest.return_reason_level2 == l2_name
            ).with_entities(
                ReturnRequest.return_reason_level3,
                func.count(ReturnRequest.id),
                func.coalesce(func.sum(ReturnRequest.return_amount), 0)
            ).group_by(ReturnRequest.return_reason_level3).all()

            children_l3 = []
            for l3_name, l3_count, l3_amount in level3_data:
                if l3_name:
                    children_l3.append({
                        "name": l3_name,
                        "value": l3_count,
                        "amount": float(l3_amount or 0)
                    })

            children_l2.append({
                "name": l2_name,
                "value": l2_count,
                "amount": float(l2_amount or 0),
                "children": children_l3 if children_l3 else None
            })

        result.append({
            "name": l1_name,
            "value": l1_count,
            "amount": float(l1_amount or 0),
            "children": children_l2 if children_l2 else None
        })

    return result


def get_cycle_distribution(db: Session, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    base_query = build_filter_query(db, filters).join(
        Refund, ReturnRequest.id == Refund.return_request_id
    )

    cycle_expr = func.extract('epoch', Refund.refund_time - ReturnRequest.apply_time) / 86400

    buckets = [
        ("0-1天", 0, 1),
        ("1-3天", 1, 3),
        ("3-7天", 3, 7),
        ("7-15天", 7, 15),
        ("15-30天", 15, 30),
        ("30天以上", 30, 9999),
    ]

    result = []
    for bucket_name, min_days, max_days in buckets:
        count = base_query.filter(
            cycle_expr >= min_days,
            cycle_expr < max_days
        ).count()

        avg = base_query.filter(
            cycle_expr >= min_days,
            cycle_expr < max_days
        ).with_entities(func.avg(cycle_expr)).scalar() or 0

        result.append({
            "bucket": bucket_name,
            "count": count,
            "avg_days": round(avg, 1)
        })

    return result


def get_product_ranking(db: Session, filters: Dict[str, Any], top_n: int = 20) -> List[Dict[str, Any]]:
    base_query = build_filter_query(db, filters)

    product_stats = base_query.with_entities(
        Order.product_id,
        Order.product_name,
        func.count(ReturnRequest.id).label('return_count'),
        func.coalesce(func.sum(ReturnRequest.return_amount), 0).label('return_amount')
    ).group_by(Order.product_id, Order.product_name).order_by(
        func.count(ReturnRequest.id).desc()
    ).limit(top_n).all()

    order_counts = db.query(
        Order.product_id,
        func.count(Order.id).label('order_count')
    ).group_by(Order.product_id).subquery()

    result = []
    for product_id, product_name, return_count, return_amount in product_stats:
        order_count = db.query(order_counts.c.order_count).filter(
            order_counts.c.product_id == product_id
        ).scalar() or 1

        result.append({
            "product_id": product_id,
            "product_name": product_name or f"商品{product_id}",
            "return_count": return_count,
            "return_rate": round(return_count / order_count * 100, 2),
            "return_amount": float(return_amount or 0)
        })

    return result


def get_service_duration_stats(db: Session, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    base_query = build_filter_query(db, filters).join(
        CustomerService, ReturnRequest.id == CustomerService.return_request_id
    )

    stats = base_query.with_entities(
        CustomerService.agent_name,
        func.count(ReturnRequest.id).label('case_count'),
        func.avg(CustomerService.handling_duration).label('avg_duration'),
        func.percentile_cont(0.5).within_group(
            CustomerService.handling_duration
        ).label('median_duration')
    ).group_by(CustomerService.agent_name).order_by(
        func.count(ReturnRequest.id).desc()
    ).all()

    result = []
    for agent_name, case_count, avg_duration, median_duration in stats:
        result.append({
            "agent_name": agent_name or "未分配",
            "avg_duration": round(float(avg_duration or 0), 1),
            "median_duration": round(float(median_duration or 0), 1),
            "case_count": case_count
        })

    return result


def get_dimension_stats(db: Session, filters: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
    dimensions = {
        "store": (Order.store_id, Order.store_name),
        "warehouse": (Order.warehouse_id, Order.warehouse_name),
        "logistics": (Order.logistics_provider, Order.logistics_provider),
        "category": (Order.product_category, Order.product_category),
    }

    result = {}
    base_query = build_filter_query(db, filters)

    for dim_name, (id_col, name_col) in dimensions.items():
        stats = base_query.outerjoin(
            Refund, ReturnRequest.id == Refund.return_request_id
        ).with_entities(
            id_col,
            name_col,
            func.count(ReturnRequest.id).label('count'),
            func.coalesce(func.sum(ReturnRequest.return_amount), 0).label('amount'),
            func.avg(
                func.extract('epoch', Refund.refund_time - ReturnRequest.apply_time) / 86400
            ).label('avg_cycle')
        ).group_by(id_col, name_col).all()

        result[dim_name] = [
            {
                "dimension": dim_name,
                "id": id_val,
                "name": str(name_val) if name_val else f"未知{dim_name}",
                "count": count,
                "amount": float(amount or 0),
                "avg_cycle_days": round(float(avg_cycle or 0), 1)
            }
            for id_val, name_val, count, amount, avg_cycle in stats
        ]

    return result


def get_dimension_options(db: Session) -> Dict[str, List[Dict[str, Any]]]:
    stores = db.query(Order.store_id, Order.store_name).distinct().all()
    warehouses = db.query(Order.warehouse_id, Order.warehouse_name).distinct().all()
    logistics = db.query(Order.logistics_provider).distinct().all()
    categories = db.query(Order.product_category).distinct().all()
    products = db.query(Order.product_id, Order.product_name).distinct().limit(200).all()
    reasons_l1 = db.query(ReturnRequest.return_reason_level1).distinct().all()

    return {
        "stores": [{"id": sid, "name": sname or f"店铺{sid}"} for sid, sname in stores if sid],
        "warehouses": [{"id": wid, "name": wname or f"仓库{wid}"} for wid, wname in warehouses if wid],
        "logistics_providers": [{"name": lp[0]} for lp in logistics if lp[0]],
        "product_categories": [{"name": cat[0]} for cat in categories if cat[0]],
        "products": [{"id": pid, "name": pname or f"商品{pid}"} for pid, pname in products if pid],
        "return_reasons_level1": [{"name": r[0]} for r in reasons_l1 if r[0]],
    }
