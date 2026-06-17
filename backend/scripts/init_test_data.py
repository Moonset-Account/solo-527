import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ticket_center.settings')
django.setup()

from apps.accounts.models import User
from apps.tickets.models import Ticket, TicketNote, TicketHistory
from apps.knowledge.models import KnowledgeItem, KnowledgeQuery
from apps.operations.models import QualityCheck, ImprovementAction, ExportRecord
from apps.tickets.services import TicketService


def create_test_users():
    print('Creating test users...')
    
    users_data = [
        {'username': 'admin', 'name': '系统管理员', 'role': 'admin', 'email': 'admin@example.com', 'password': 'admin123'},
        {'username': 'manager', 'name': '张经理', 'role': 'manager', 'email': 'manager@example.com', 'password': 'manager123'},
        {'username': 'operator', 'name': '李运营', 'role': 'operator', 'email': 'operator@example.com', 'password': 'operator123'},
        {'username': 'agent1', 'name': '王客服', 'role': 'agent', 'email': 'agent1@example.com', 'password': 'agent123'},
        {'username': 'agent2', 'name': '刘客服', 'role': 'agent', 'email': 'agent2@example.com', 'password': 'agent123'},
    ]
    
    users = {}
    for data in users_data:
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                name=data['name'],
                role=data['role'],
                phone=f'138{random.randint(10000000, 99999999)}'
            )
            users[data['username']] = user
            print(f'  Created user: {data["username"]} ({data["name"]})')
        except Exception as e:
            print(f'  User {data["username"]} may already exist: {e}')
            users[data['username']] = User.objects.get(username=data['username'])
    
    return users


def create_test_tickets(users):
    print('\nCreating test tickets...')
    
    ticket_types = ['refund', 'exchange', 'complaint', 'consult', 'other']
    ticket_statuses = ['pending', 'processing', 'escalated', 'resolved', 'closed']
    ticket_priorities = ['low', 'medium', 'high', 'urgent']
    
    customer_names = ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十', '孙十一', '钱十二']
    product_names = ['iPhone 15 Pro', 'MacBook Air M3', 'AirPods Pro 2', 'iPad Air', 'Apple Watch Series 9', 
                     '华为Mate 60 Pro', '小米14 Ultra', 'OPPO Find X7', 'vivo X100', '三星S24 Ultra']
    
    ticket_titles = [
        '商品破损要求退换',
        '订单超时未发货',
        '申请退款处理',
        '商品与描述不符投诉',
        '使用方法咨询',
        '物流信息查询',
        '发票申请',
        '账号问题咨询',
        '质量问题投诉',
        '促销活动咨询',
        '售后服务申请',
        '商品安装指导',
        '维修服务预约',
        '会员权益咨询',
        '评价投诉处理'
    ]
    
    tickets = []
    for i in range(30):
        days_ago = random.randint(0, 30)
        created_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
        
        status = random.choice(ticket_statuses) if i < 25 else 'closed'
        priority = random.choice(ticket_priorities)
        ticket_type = random.choice(ticket_types)
        assignee = random.choice([users['agent1'], users['agent2']]) if status != 'pending' else None
        
        sla_hours = {'low': 72, 'medium': 48, 'high': 24, 'urgent': 4}[priority]
        sla_deadline = created_at + timedelta(hours=sla_hours)
        
        first_response_at = None
        resolved_at = None
        escalation_reason = None
        escalated_to = None
        escalated_at = None
        
        if status in ['processing', 'escalated', 'resolved', 'closed']:
            first_response_at = created_at + timedelta(minutes=random.randint(5, 120))
        
        if status in ['resolved', 'closed']:
            resolved_at = first_response_at + timedelta(hours=random.randint(1, 48))
        
        if status == 'escalated':
            escalated_to = random.choice([users['manager'], users['operator']])
            escalated_at = first_response_at + timedelta(hours=random.randint(1, 24))
            escalation_reason = random.choice([
                '客户要求升级处理',
                '问题复杂需要技术支持',
                '涉及金额较大',
                '客户投诉情绪激动'
            ])
        
        ticket_data = {
            'ticket_no': f'TK{timezone.now().year}{i+1:06d}',
            'title': random.choice(ticket_titles),
            'description': f'这是一个测试工单，用于演示系统功能。客户反馈的具体问题需要客服人员及时处理。\n\n详细描述：客户购买的{random.choice(product_names)}出现问题，希望能够尽快得到解决。',
            'type': ticket_type,
            'status': status,
            'priority': priority,
            'customer_name': random.choice(customer_names),
            'customer_phone': f'139{random.randint(10000000, 99999999)}',
            'order_no': f'ORD{random.randint(100000, 999999)}',
            'product_name': random.choice(product_names),
            'assignee': assignee,
            'creator': random.choice([users['operator'], users['agent1'], users['agent2']]),
            'escalated_to': escalated_to,
            'escalated_at': escalated_at,
            'escalation_reason': escalation_reason,
            'first_response_at': first_response_at,
            'resolved_at': resolved_at,
            'resolution': '已联系客户，问题已解决，客户满意。' if status in ['resolved', 'closed'] else None,
            'sla_deadline': sla_deadline,
        }
        
        ticket = Ticket.objects.create(**ticket_data)
        ticket.created_at = created_at
        ticket.updated_at = created_at
        ticket.save()
        
        TicketHistory.objects.create(
            ticket=ticket,
            action='创建工单',
            actor=ticket.creator,
            description=f'创建工单，状态：{ticket.get_status_display()}'
        )
        
        if assignee:
            TicketHistory.objects.create(
                ticket=ticket,
                action='分派工单',
                actor=users['operator'],
                description=f'分派给 {assignee.name} 处理'
            )
        
        if status == 'escalated' and escalated_to:
            TicketHistory.objects.create(
                ticket=ticket,
                action='工单升级',
                actor=assignee,
                description=f'升级给 {escalated_to.name}，原因：{escalation_reason}'
            )
        
        tickets.append(ticket)
        print(f'  Created ticket: {ticket.ticket_no} - {ticket.title}')
    
    return tickets


def create_test_notes(tickets, users):
    print('\nCreating test ticket notes...')
    
    for ticket in random.sample(tickets, min(15, len(tickets))):
        for i in range(random.randint(1, 3)):
            TicketNote.objects.create(
                ticket=ticket,
                author=random.choice([users['agent1'], users['agent2'], users['operator']]),
                content=random.choice([
                    '已联系客户，正在核实情况。',
                    '已协调仓储部门处理。',
                    '客户同意解决方案。',
                    '已安排退款，预计3-5个工作日到账。',
                    '需要进一步核实订单信息。',
                    '客户情绪比较激动，需要耐心安抚。'
                ]),
                is_internal=random.choice([True, False])
            )
    
    print(f'  Created notes for {min(15, len(tickets))} tickets')


def create_test_knowledge(users):
    print('\nCreating test knowledge items...')
    
    categories = ['product', 'service', 'faq', 'troubleshooting', 'policy', 'other']
    
    knowledge_data = [
        ('如何申请退款', '退款申请流程：登录账户 → 进入订单详情 → 点击申请退款 → 填写退款原因 → 提交申请 → 等待审核 → 审核通过后退款将在3-5个工作日内原路返回。', 'faq', True),
        ('商品退换货政策', '自签收之日起7天内，商品完好可无理由退换；30天内出现质量问题可免费退换。退换货请保持商品原包装完好，并提供购买凭证。', 'policy', False),
        ('物流信息查询方法', '方法一：在订单详情页查看物流信息；方法二：复制快递单号到快递公司官网查询；方法三：联系在线客服查询。', 'service', False),
        ('常见质量问题处理', '1. 商品破损：拍照留存，联系客服退换货；2. 功能故障：在保修期内可免费维修；3. 描述不符：申请退换货并提供对比照片。', 'troubleshooting', True),
        ('会员权益说明', '普通会员：购物积分、生日优惠；银卡会员：95折优惠、优先发货；金卡会员：9折优惠、专属客服、免费上门取件。', 'service', False),
        ('发票开具指南', '下单时勾选"需要发票"，填写发票抬头和税号。电子发票将在订单完成后发送到您的邮箱。如需纸质发票请联系客服。', 'faq', False),
        ('iPhone 15 Pro使用教程', '本教程详细介绍iPhone 15 Pro的各项功能使用方法，包括灵动岛交互、Action Button自定义、相机系统等新功能。', 'product', True),
        ('售后服务流程', '1. 提交售后申请；2. 客服审核（1-2个工作日）；3. 寄回商品（如有需要）；4. 商家处理（3-5个工作日）；5. 退款/换货完成。', 'service', False),
        ('促销活动规则', '促销活动期间订单量大，发货可能延迟1-2天，请谅解。活动商品不支持7天无理由退换，质量问题除外。', 'policy', False),
        ('账号安全保护', '建议定期修改密码，开启二次验证，不要在公共设备上登录账号。如发现异常登录请及时联系客服。', 'troubleshooting', False),
    ]
    
    items = []
    for title, content, category, is_tutorial in knowledge_data:
        item = KnowledgeItem.objects.create(
            title=title,
            content=content,
            category=category,
            status='published',
            hit_count=random.randint(10, 500),
            is_tutorial=is_tutorial,
            tags=','.join(random.sample(['售后', '客服', '退款', '物流', '会员', '发票', '质量', '安全'], 3)),
            created_by=users['manager'],
            updated_by=users['manager']
        )
        items.append(item)
        print(f'  Created knowledge: {title}')
    
    return items


def create_test_queries(users, knowledge_items):
    print('\nCreating test knowledge queries...')
    
    query_texts = [
        '怎么退款',
        '退换货规则',
        '物流怎么查',
        '质量问题怎么办',
        '会员有什么优惠',
        '怎么开发票',
        'iPhone使用教程',
        '售后流程',
        '活动规则',
        '账号安全'
    ]
    
    for text in query_texts:
        matched = random.choice(knowledge_items) if random.random() > 0.2 else None
        KnowledgeQuery.objects.create(
            query_text=text,
            user=random.choice([users['manager'], users['agent1'], users['agent2']]),
            matched_item=matched,
            match_score=random.uniform(0.5, 0.99) if matched else None,
            has_reminder=random.choice([True, False])
        )
    
    print(f'  Created {len(query_texts)} knowledge queries')


def create_test_quality_checks(tickets, users):
    print('\nCreating test quality checks...')
    
    check_items_template = {
        'greeting': True,
        'listening': True,
        'solution': True,
        'courtesy': True,
        'follow_up': False
    }
    
    for ticket in random.sample([t for t in tickets if t.status in ['resolved', 'closed']], min(10, len([t for t in tickets if t.status in ['resolved', 'closed']]))):
        QualityCheck.objects.create(
            ticket=ticket,
            checker=random.choice([users['manager'], users['operator']]),
            status=random.choice(['passed', 'passed', 'failed']),
            score=random.randint(60, 100),
            check_items=check_items_template,
            issues_found=random.choice(['', '响应速度有待提高', '解决方案不够专业']),
            suggestions=random.choice(['', '建议加强产品知识培训', '建议优化沟通话术']),
            checked_at=timezone.now()
        )
    
    print(f'  Created quality checks')


def create_test_improvements(users, tickets):
    print('\nCreating test improvement actions...')
    
    improvements = [
        ('优化退款流程', '当前退款流程繁琐，客户等待时间长，建议优化系统自动审核机制。'),
        ('加强客服培训', '部分客服对产品知识不熟悉，导致解答不准确，需要定期培训。'),
        ('改进物流查询体验', '物流信息更新不及时，建议对接更稳定的物流API。'),
        ('增加自助服务功能', '常见问题可以增加机器人自动回复，减少人工客服压力。'),
        ('优化移动端体验', '移动端操作不够便捷，需要优化界面设计。'),
    ]
    
    statuses = ['pending', 'in_progress', 'completed', 'in_progress']
    
    for i, (title, desc) in enumerate(improvements):
        related_ticket = random.choice(tickets) if i < 3 else None
        status = random.choice(statuses)
        progress = 0 if status == 'pending' else random.randint(10, 100) if status == 'in_progress' else 100
        
        ImprovementAction.objects.create(
            title=title,
            description=desc,
            related_ticket=related_ticket,
            assignee=random.choice([users['operator'], users['manager']]),
            status=status,
            priority=random.choice(['low', 'medium', 'high']),
            due_date=timezone.now().date() + timedelta(days=random.randint(7, 60)),
            progress=progress,
            created_by=users['manager']
        )
        print(f'  Created improvement: {title}')


def main():
    print('=' * 50)
    print('Initializing test data for Ticket Center System')
    print('=' * 50)
    
    users = create_test_users()
    tickets = create_test_tickets(users)
    create_test_notes(tickets, users)
    knowledge_items = create_test_knowledge(users)
    create_test_queries(users, knowledge_items)
    create_test_quality_checks(tickets, users)
    create_test_improvements(users, tickets)
    
    print('\n' + '=' * 50)
    print('Test data initialization completed!')
    print('=' * 50)
    print('\nDefault accounts:')
    print('  admin / admin123 (管理员)')
    print('  manager / manager123 (售后经理)')
    print('  operator / operator123 (运营)')
    print('  agent1 / agent123 (客服)')
    print('  agent2 / agent123 (客服)')


if __name__ == '__main__':
    main()
