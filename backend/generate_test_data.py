import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app.models import Order, ReturnRequest, Inspection, Refund, ReturnLogistics, CustomerService
from datetime import datetime, timedelta
import random
from decimal import Decimal
import hashlib

Base.metadata.create_all(bind=engine)
db = SessionLocal()

stores = [
    (1, "官方旗舰店"),
    (2, "品牌专卖店"),
    (3, "奥莱折扣店"),
    (4, "跨境专营店"),
]

warehouses = [
    (1, "华东仓"),
    (2, "华南仓"),
    (3, "华北仓"),
    (4, "西南仓"),
]

logistics_providers = ["顺丰速运", "京东物流", "中通快递", "圆通速递", "韵达快递"]

categories = ["男装", "女装", "鞋靴", "箱包", "数码配件", "家居用品", "美妆护肤"]

products = []
for i in range(1, 51):
    cat = random.choice(categories)
    products.append((i, f"{cat}商品{i}", cat, f"SKU{i:06d}"))

reasons_level1 = ["商品质量问题", "商品与描述不符", "大小/尺寸不合适", "发错货/漏发货", "物流问题", "不想要了/拍错了", "其他"]
reasons_level2_map = {
    "商品质量问题": ["做工瑕疵", "面料问题", "配件缺失", "破损/变形", "功能故障"],
    "商品与描述不符": ["颜色不符", "款式不符", "材质不符", "参数不符"],
    "大小/尺寸不合适": ["偏大", "偏小", "版型不合适"],
    "发错货/漏发货": ["商品错发", "配件漏发", "数量不足"],
    "物流问题": ["配送延迟", "包装破损", "包裹丢失"],
    "不想要了/拍错了": ["拍错规格", "不喜欢了", "价格原因", "重复下单"],
    "其他": ["其他原因"]
}
reasons_level3_map = {
    "做工瑕疵": ["线头过多", "缝合问题", "染色不均"],
    "面料问题": ["起球", "掉色", "有异味"],
    "破损/变形": ["运输破损", "出厂破损"],
}

agents = ["张客服", "李客服", "王客服", "赵客服", "陈客服", "刘客服"]

def hash_user(user_id):
    return hashlib.md5(f"user_{user_id}_salt_2024".encode()).hexdigest()[:16]

print("开始生成测试数据...")

order_count = 0
for day_offset in range(60):
    base_date = datetime.now() - timedelta(days=day_offset)
    orders_per_day = random.randint(50, 150)

    for _ in range(orders_per_day):
        order_count += 1
        user_id = random.randint(1, 5000)
        store = random.choice(stores)
        warehouse = random.choice(warehouses)
        product = random.choice(products)
        logistics = random.choice(logistics_providers)
        qty = random.randint(1, 3)
        amount = Decimal(random.uniform(50, 2000) * qty).quantize(Decimal('0.01'))

        order = Order(
            order_no=f"ORD{base_date.strftime('%Y%m%d')}{order_count:06d}",
            user_id=user_id,
            user_hash=hash_user(user_id),
            store_id=store[0],
            store_name=store[1],
            product_id=product[0],
            product_name=product[1],
            product_category=product[2],
            sku=product[3],
            quantity=qty,
            amount=amount,
            warehouse_id=warehouse[0],
            warehouse_name=warehouse[1],
            logistics_provider=logistics,
            created_at=base_date + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59)),
            paid_at=base_date + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59)),
            shipped_at=base_date + timedelta(days=random.randint(0, 2), hours=random.randint(0, 23)),
            delivered_at=base_date + timedelta(days=random.randint(2, 5), hours=random.randint(0, 23))
        )
        db.add(order)
        db.flush()

        if random.random() < 0.12:
            return_count = random.randint(1, 2) if random.random() < 0.05 else 1
            for rr in range(return_count):
                r1 = random.choice(reasons_level1)
                r2 = random.choice(reasons_level2_map[r1])
                r3 = random.choice(reasons_level3_map.get(r2, [None]))

                apply_time = order.delivered_at + timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
                return_amount = Decimal(float(amount) * random.uniform(0.8, 1.0)).quantize(Decimal('0.01'))

                return_req = ReturnRequest(
                    return_no=f"RET{base_date.strftime('%Y%m%d')}{order_count:04d}{rr:02d}",
                    order_id=order.id,
                    order_no=order.order_no,
                    user_id=user_id,
                    user_hash=hash_user(user_id),
                    return_reason_level1=r1,
                    return_reason_level2=r2,
                    return_reason_level3=r3,
                    return_amount=return_amount,
                    return_quantity=qty,
                    apply_time=apply_time,
                    status=random.choice(["completed", "completed", "completed", "processing", "rejected"])
                )
                db.add(return_req)
                db.flush()

                if return_req.status in ["completed", "processing"]:
                    inspection = Inspection(
                        return_request_id=return_req.id,
                        inspector=random.choice(agents),
                        inspect_time=apply_time + timedelta(days=random.randint(1, 3), hours=random.randint(0, 23)),
                        inspect_result=random.choice(["pass", "pass", "pass", "conditional"]),
                        damage_level=random.choice(["none", "minor", "none", "none"]),
                        is_quality_issue=r1 == "商品质量问题"
                    )
                    db.add(inspection)

                    refund_days = random.randint(1, 20)
                    refund = Refund(
                        return_request_id=return_req.id,
                        refund_no=f"RF{return_req.return_no}",
                        refund_amount=return_amount,
                        refund_method=random.choice(["原路退回", "余额退款"]),
                        apply_time=apply_time,
                        audit_time=apply_time + timedelta(days=random.randint(0, 2), hours=random.randint(0, 23)),
                        refund_time=apply_time + timedelta(days=refund_days, hours=random.randint(0, 23)) if return_req.status == "completed" else None,
                        status="completed" if return_req.status == "completed" else "processing",
                        auditor=random.choice(agents)
                    )
                    db.add(refund)

                    logistics = ReturnLogistics(
                        return_request_id=return_req.id,
                        tracking_no=f"TRK{return_req.return_no}",
                        logistics_provider=random.choice(logistics_providers),
                        shipped_at=apply_time + timedelta(hours=random.randint(0, 48)),
                        received_at=apply_time + timedelta(days=random.randint(2, 5), hours=random.randint(0, 23)),
                        status=random.choice(["received", "received", "in_transit"]),
                        warehouse_id=warehouse[0],
                        warehouse_name=warehouse[1]
                    )
                    db.add(logistics)

                    handling_hours = random.uniform(0.5, 48)
                    cs = CustomerService(
                        return_request_id=return_req.id,
                        agent_id=random.randint(1, 10),
                        agent_name=random.choice(agents),
                        first_response_time=apply_time + timedelta(minutes=random.randint(5, 120)),
                        resolved_time=apply_time + timedelta(hours=handling_hours),
                        handling_duration=handling_hours,
                        communication_count=random.randint(1, 8),
                        escalation_flag=random.random() < 0.08,
                        satisfaction_score=random.choice([5, 5, 4, 4, 3, None])
                    )
                    db.add(cs)

    if day_offset % 10 == 0:
        db.commit()
        print(f"已生成 {order_count} 条订单数据...")

db.commit()
print(f"数据生成完成！共生成 {order_count} 条订单")
db.close()
