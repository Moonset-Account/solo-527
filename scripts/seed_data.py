#!/usr/bin/env python
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.ticket_service import CategoryService, TicketService
from app.schemas.ticket import CategoryCreate, TicketCreate


def seed_categories(db):
    cats = [
        ("PAY_001", "支付问题", None, "支付失败、扣款未到账等"),
        ("PAY_002", "退款问题", None, "退款申请、退款进度查询"),
        ("ORD_001", "订单问题", None, "订单创建、修改、取消"),
        ("ORD_002", "物流问题", None, "物流进度、配送异常"),
        ("PRD_001", "商品咨询", None, "商品参数、库存、规格"),
        ("PRD_002", "售后问题", None, "退换货、维修服务"),
        ("ACC_001", "账户问题", None, "登录、注册、密码找回"),
        ("ACC_002", "权益问题", None, "会员权益、优惠券、积分"),
        ("APP_001", "APP故障", None, "App崩溃、闪退、功能异常"),
        ("APP_002", "功能建议", None, "产品需求、体验改进"),
        ("CUS_001", "投诉建议", None, "服务投诉、体验反馈"),
        ("OTH_001", "其他咨询", None, "无法分类的其他问题"),
    ]
    created = 0
    for code, name, parent_code, desc in cats:
        if CategoryService.get_by_code(db, code):
            continue
        parent_id = None
        if parent_code:
            p = CategoryService.get_by_code(db, parent_code)
            parent_id = p.id if p else None
        CategoryService.create(db, CategoryCreate(
            name=name, code=code, parent_id=parent_id, description=desc,
        ))
        created += 1
    print(f"Created {created} categories")
    return created


def seed_tickets(db):
    import random
    channels = ["web", "app", "wechat", "phone", "email"]
    refund_statuses = ["none", "none", "none", "requested", "approved"]
    sample_texts = [
        ("支付失败怎么办", "我在下单时支付了两次，第一次扣款成功但是订单没有生成，第二次才成功。请帮我查看第一次的扣款什么时候能退回？已经三天了。"),
        ("商品迟迟未发货", "我在大促当天下单的订单，都过去5天了还没有发货，客服也联系不上，请问是什么情况？订单号在后台可以看到。"),
        ("优惠券无法使用", "我领取的满200减30的优惠券为什么不能用？结账时没有显示可用。我确认过商品是符合条件的。"),
        ("App一直闪退", "更新到最新版本之后，打开App就闪退，卸载重装也不行。我用的是iPhone 14 iOS 17。"),
        ("退款多久到账", "我申请的退货退款已经显示商家签收，请问退款什么时候能到我的银行卡？"),
        ("想修改收货地址", "订单刚下了半小时，可以帮我修改一下收货地址吗？原来的地址下周就没人了。"),
        ("咨询商品尺寸", "请问这款衣服的L码肩宽是多少？我身高175体重140应该选什么码？有没有尺码表可以参考？"),
        ("登录收不到验证码", "我在登录时点击了获取验证码，但是等了10分钟都没收到短信。检查了手机号没错，也没有屏蔽。"),
        ("会员积分异常", "我昨天下单应该有500积分，但是账户里只增加了200，请问积分规则是什么？请帮我核实一下。"),
        ("投诉客服态度差", "我今天上午拨打热线反映问题，接电话的客服态度非常恶劣，还直接挂了我的电话，要求投诉并给予回复。"),
        ("想申请价保", "我上周买的商品今天降价了100块，记得你们有7天价保的，请问怎么申请退还差价？"),
        ("售后维修进度", "我2周前寄回去维修的手机，现在还没有收到任何消息。请问维修进度如何？还要等多久？"),
        ("快递显示签收但没收到", "物流显示昨天就已经签收，但是我根本没有收到，快递员电话也打不通。请帮忙联系物流核实。"),
        ("想取消订单", "我拍错了商品，还没有发货，可以帮我取消订单吗？货款什么时候能退回来？"),
        ("发票申请问题", "我上月买的东西想申请电子发票，但是在订单详情里找不到开票入口了，麻烦帮我处理一下。"),
    ]
    existing = db.query(TicketService.get_by_no.__wrapped__).count() if False else 0
    created = 0
    for i in range(50):
        ticket_no = f"TK{datetime.utcnow().strftime('%Y%m%d')}{10000 + i}"
        if TicketService.get_by_no(db, ticket_no):
            continue
        sample = random.choice(sample_texts)
        TicketService.create(db, TicketCreate(
            ticket_no=ticket_no,
            title=sample[0],
            content=sample[1],
            channel=random.choice(channels),
            refund_status=random.choice(refund_statuses),
        ))
        created += 1
    print(f"Created {created} tickets")
    return created


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_categories(db)
        seed_tickets(db)
        print("Seed done.")
    finally:
        db.close()
