import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine, Base, AsyncSessionLocal
from app.models import (
    User, RoleEnum, Ticket, TicketStatus, TicketPriority,
    KnowledgeBaseCategory, KnowledgeBaseArticle, KBVersionHistory,
    CustomerFeedback, RiskSample, RiskLevel, ResolutionType,
    TicketNote, TicketTimeline, Attachment
)
from app.auth import get_password_hash


async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing_users = await db.execute(User.__table__.select().limit(1))
        if existing_users.first():
            print("数据已存在，跳过初始化")
            return

        print("开始初始化种子数据...")

        users = [
            User(
                username="admin",
                email="admin@qinghe.com",
                hashed_password=get_password_hash("admin123"),
                full_name="系统管理员",
                role=RoleEnum.ADMIN,
                is_active=True,
            ),
            User(
                username="supervisor",
                email="supervisor@qinghe.com",
                hashed_password=get_password_hash("super123"),
                full_name="李主管",
                role=RoleEnum.SUPERVISOR,
                is_active=True,
            ),
            User(
                username="agent01",
                email="agent01@qinghe.com",
                hashed_password=get_password_hash("agent123"),
                full_name="王客服",
                role=RoleEnum.AGENT,
                is_active=True,
            ),
            User(
                username="agent02",
                email="agent02@qinghe.com",
                hashed_password=get_password_hash("agent123"),
                full_name="张客服",
                role=RoleEnum.AGENT,
                is_active=True,
            ),
            User(
                username="customer01",
                email="cust01@example.com",
                hashed_password=get_password_hash("cust123"),
                full_name="客户赵先生",
                role=RoleEnum.CUSTOMER,
                is_active=True,
            ),
            User(
                username="customer02",
                email="cust02@example.com",
                hashed_password=get_password_hash("cust123"),
                full_name="客户钱女士",
                role=RoleEnum.CUSTOMER,
                is_active=True,
            ),
        ]
        db.add_all(users)
        await db.flush()

        user_map = {u.username: u.id for u in users}

        categories = [
            KnowledgeBaseCategory(name="账号管理", description="账号注册、登录、密码重置等问题"),
            KnowledgeBaseCategory(name="支付问题", description="支付方式、退款、发票等问题"),
            KnowledgeBaseCategory(name="产品使用", description="产品功能操作指南"),
            KnowledgeBaseCategory(name="常见问题", description="高频FAQ汇总"),
        ]
        db.add_all(categories)
        await db.flush()
        cat_map = {c.name: c.id for c in categories}

        articles = [
            KnowledgeBaseArticle(
                title="如何重置登录密码？",
                content="## 重置密码步骤\n\n1. 点击登录页的「忘记密码」\n2. 输入注册邮箱\n3. 查收重置邮件并点击链接\n4. 设置新密码并确认\n\n**注意**：重置链接有效期为24小时。如未收到邮件，请检查垃圾邮件文件夹。",
                version=1,
                category_id=cat_map["账号管理"],
                author_id=user_map["supervisor"],
                is_published=True,
                keywords=["密码", "重置", "忘记密码", "登录"],
                view_count=156,
                helpful_count=89,
            ),
            KnowledgeBaseArticle(
                title="支持哪些支付方式？",
                content="## 支付方式\n\n我们目前支持以下支付方式：\n- 微信支付\n- 支付宝\n- 银联卡\n- 对公转账（企业用户）\n\n## 发票申请\n\n支付完成后，可在「订单详情」页面申请电子发票，发票将在3个工作日内发送至您的邮箱。",
                version=2,
                category_id=cat_map["支付问题"],
                author_id=user_map["agent01"],
                is_published=True,
                keywords=["支付", "微信", "支付宝", "发票"],
                view_count=243,
                helpful_count=156,
            ),
            KnowledgeBaseArticle(
                title="如何批量导入数据？",
                content="## 数据导入功能\n\n### 支持的格式\n- Excel (.xlsx, .xls)\n- CSV (UTF-8编码)\n\n### 操作步骤\n1. 进入「数据管理」-「导入数据」\n2. 下载模板文件并按照格式填写\n3. 上传填写好的文件\n4. 预览并确认导入\n\n**提示**：单次导入不超过10,000条记录，如有大量数据请分批导入。",
                version=1,
                category_id=cat_map["产品使用"],
                author_id=user_map["agent02"],
                is_published=True,
                keywords=["导入", "数据", "Excel", "批量"],
                view_count=87,
                helpful_count=45,
            ),
            KnowledgeBaseArticle(
                title="产品更新日志",
                content="## 2024年1月更新\n\n### 新功能\n- ✨ 新增智能客服机器人\n- ✨ 支持数据可视化报表\n- ✨ 工单批量处理功能\n\n### 优化\n- ⚡ 页面加载速度提升50%\n- ⚡ 搜索结果更精准\n\n### Bug修复\n- 🐛 修复附件上传失败问题\n- 🐛 修复移动端显示异常",
                version=3,
                category_id=cat_map["产品使用"],
                author_id=user_map["admin"],
                is_published=True,
                keywords=["更新", "版本", "新功能"],
                view_count=512,
                helpful_count=324,
            ),
            KnowledgeBaseArticle(
                title="账号被锁定怎么办？",
                content="## 锁定原因\n\n连续5次输入错误密码将导致账号被锁定30分钟。\n\n## 解锁方式\n\n1. 等待30分钟自动解锁\n2. 使用「忘记密码」功能重置密码后立即解锁\n3. 联系客服人工解锁（需验证身份）",
                version=1,
                category_id=cat_map["常见问题"],
                author_id=user_map["supervisor"],
                is_published=True,
                keywords=["锁定", "解锁", "密码错误"],
                view_count=78,
                helpful_count=34,
            ),
        ]
        db.add_all(articles)
        await db.flush()

        for art in articles:
            version = KBVersionHistory(
                article_id=art.id,
                version=art.version,
                title=art.title,
                content=art.content,
                changed_by=art.author_id,
                change_summary=f"版本 v{art.version} 发布"
            )
            db.add(version)

        now = datetime.utcnow()
        tickets_data = [
            {
                "title": "无法登录系统，提示密码错误",
                "description": "今天早上开始无法登录，密码是正确的，但一直提示错误，已经尝试了3次了，担心账号被锁。",
                "status": TicketStatus.RESOLVED,
                "priority": TicketPriority.HIGH,
                "category": "账号管理",
                "created_by": user_map["customer01"],
                "assigned_to": user_map["agent01"],
                "created_at": now - timedelta(days=5),
                "first_response_at": now - timedelta(days=5, hours=-2),
                "resolved_at": now - timedelta(days=4),
                "resolution_type": ResolutionType.KB_SOLUTION,
                "resolution_summary": "已指导用户重置密码，问题解决。",
                "kb_article_id": articles[0].id,
            },
            {
                "title": "支付后没有收到发票",
                description": "上周三支付了订单金额，申请了发票但至今未收到邮件，麻烦帮忙查询一下。订单号：20240115001",
                "status": TicketStatus.PROCESSING,
                "priority": TicketPriority.MEDIUM,
                "category": "支付问题",
                "created_by": user_map["customer02"],
                "assigned_to": user_map["agent02"],
                "created_at": now - timedelta(days=2),
                "first_response_at": now - timedelta(days=2, hours=-4),
            },
            {
                "title": "批量导入数据时一直报错",
                description": "按照模板填写后导入，一直提示「格式错误」，已经检查了好几遍格式，确认没问题。总共500条数据。",
                "status": TicketStatus.PENDING,
                "priority": TicketPriority.URGENT,
                "category": "产品使用",
                "created_by": user_map["customer01"],
                "assigned_to": None,
                "created_at": now - timedelta(hours=3),
            },
            {
                "title": "希望增加数据导出功能",
                description": "目前只能手动复制数据，希望能增加一键导出Excel的功能，方便做报表。",
                "status": TicketStatus.CLOSED,
                "priority": TicketPriority.LOW,
                "category": "产品建议",
                "created_by": user_map["customer02"],
                "assigned_to": user_map["supervisor"],
                "created_at": now - timedelta(days=10),
                "first_response_at": now - timedelta(days=10, hours=-5),
                "resolved_at": now - timedelta(days=8),
                "resolution_type": ResolutionType.OTHER,
                "resolution_summary": "需求已记录，将在下个版本中规划实现。",
            },
            {
                "title": "密码重置后还是无法登录",
                description": "按照之前客服的指导重置了密码，但还是无法登录，和之前问题一模一样。",
                "status": TicketStatus.PROCESSING,
                "priority": TicketPriority.HIGH,
                "category": "账号管理",
                "created_by": user_map["customer01"],
                "assigned_to": user_map["agent01"],
                "created_at": now - timedelta(hours=8),
                "first_response_at": now - timedelta(hours=6),
                "is_duplicate": False,
            },
            {
                "title": "移动端页面显示错乱",
                description": "用手机访问时，部分页面排版错乱，按钮无法点击。浏览器是微信内置浏览器。",
                "status": TicketStatus.PROCESSING,
                "priority": TicketPriority.MEDIUM,
                "category": "产品使用",
                "created_by": user_map["customer02"],
                "assigned_to": user_map["agent02"],
                "created_at": now - timedelta(days=1),
                "first_response_at": now - timedelta(days=1, hours=-3),
            },
        ]

        tickets = []
        for td in tickets_data:
            t = Ticket(**td)
            t.sla_deadline = t.created_at + timedelta(
                hours={TicketPriority.URGENT: 2, TicketPriority.HIGH: 8,
                       TicketPriority.MEDIUM: 24, TicketPriority.LOW: 72}.get(t.priority, 24)
            )
            if t.first_response_at and not t.response_time_seconds:
                t.response_time_seconds = int((t.first_response_at - t.created_at).total_seconds())
            if t.resolved_at and not t.resolution_time_seconds:
                t.resolution_time_seconds = int((t.resolved_at - t.created_at).total_seconds())
            if t.sla_deadline < now and t.status in [TicketStatus.PENDING, TicketStatus.PROCESSING]:
                t.has_overdue_risk = True
            tickets.append(t)

        db.add_all(tickets)
        await db.flush()

        for i, t in enumerate(tickets):
            tl_created = TicketTimeline(
                ticket_id=t.id, event_type="created",
                description="工单已创建", created_by=t.created_by,
                created_at=t.created_at
            )
            db.add(tl_created)

            if t.assigned_to:
                tl_assigned = TicketTimeline(
                    ticket_id=t.id, event_type="assigned",
                    description=f"工单已分配给客服", created_by=t.assigned_to,
                    created_at=t.created_at + timedelta(minutes=15)
                )
                db.add(tl_assigned)

        notes = [
            TicketNote(
                ticket_id=tickets[0].id,
                content="用户确认重置密码后可以正常登录，已告知用户注意密码大小写。",
                created_by=user_map["agent01"],
                is_internal=False,
            ),
            TicketNote(
                ticket_id=tickets[1].id,
                content="已联系财务查询发票状态，今天会重新发送。",
                created_by=user_map["agent02"],
                is_internal=True,
            ),
            TicketNote(
                ticket_id=tickets[2].id,
                content="这个用户之前也提交过类似的导入问题，检查下是不是Excel格式兼容性问题。",
                created_by=user_map["supervisor"],
                is_internal=True,
            ),
        ]
        db.add_all(notes)

        feedbacks = [
            CustomerFeedback(
                ticket_id=tickets[0].id,
                rating=5,
                comment="客服响应很快，问题很快就解决了，非常感谢！",
                submitted_at=tickets[0].resolved_at + timedelta(hours=2),
                reviewed_by=user_map["supervisor"],
                review_note="服务态度好，响应及时，继续保持。",
                reviewed_at=tickets[0].resolved_at + timedelta(hours=4),
            ),
            CustomerFeedback(
                ticket_id=tickets[3].id,
                rating=4,
                comment="虽然功能还没加，但客服很耐心地记录了需求，期待后续更新。",
                submitted_at=tickets[3].resolved_at + timedelta(hours=6),
            ),
        ]
        db.add_all(feedbacks)

        risks = [
            RiskSample(
                ticket_id=tickets[2].id,
                risk_level=RiskLevel.HIGH,
                risk_type="urgent_unassigned",
                description="紧急工单超过3小时未分配处理人",
                detected_at=now,
                detected_by=user_map["supervisor"],
                is_verified=False,
            ),
            RiskSample(
                ticket_id=tickets[4].id,
                risk_level=RiskLevel.MEDIUM,
                risk_type="repeat_issue",
                description="用户重复提交同类问题，可能存在知识库覆盖不足",
                detected_at=now,
                detected_by=user_map["supervisor"],
                is_verified=True,
                verified_by=user_map["supervisor"],
                verified_at=now,
                mitigation_note="已指派资深客服跟进，并评估是否需要补充知识库文章。",
            ),
        ]
        db.add_all(risks)

        await db.commit()
        print("种子数据初始化完成！")
        print(f"  - 用户: {len(users)} 个")
        print(f"  - 知识库分类: {len(categories)} 个")
        print(f"  - 知识库文章: {len(articles)} 篇")
        print(f"  - 工单: {len(tickets)} 个")
        print(f"  - 客户反馈: {len(feedbacks)} 条")
        print(f"  - 风险样本: {len(risks)} 条")


if __name__ == "__main__":
    asyncio.run(seed_data())
