import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookstore.settings')
django.setup()

from django.db import transaction
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from apps.core.models import User
from apps.books.models import Book, Category, Supplier
from apps.members.models import Member, MemberLevel, PointsRecord
from apps.events.models import Event, EventType
from apps.reservations.models import Reservation, ReservationItem
from apps.sales.models import SaleOrder, SaleOrderItem


@transaction.atomic
def create_test_data():
    print('正在创建测试数据...')
    
    if User.objects.filter(username='admin').exists():
        print('测试数据已存在，跳过创建')
        return
    
    admin = User.objects.create(
        username='admin',
        email='admin@example.com',
        first_name='系统',
        last_name='管理员',
        role=User.ROLE_ADMIN,
        is_superuser=True,
        is_staff=True,
        phone='13800000001'
    )
    admin.password = make_password('admin123')
    admin.save()
    print(f'创建管理员账号: admin / admin123')
    
    manager = User.objects.create(
        username='manager',
        email='manager@example.com',
        first_name='店',
        last_name='长',
        role=User.ROLE_MANAGER,
        is_staff=True,
        phone='13800000002'
    )
    manager.password = make_password('manager123')
    manager.save()
    print(f'创建店长账号: manager / manager123')
    
    staff = User.objects.create(
        username='staff',
        email='staff@example.com',
        first_name='员',
        last_name='工',
        role=User.ROLE_STAFF,
        is_staff=True,
        phone='13800000003'
    )
    staff.password = make_password('staff123')
    staff.save()
    print(f'创建员工账号: staff / staff123')
    
    level1 = MemberLevel.objects.create(
        name='普通会员',
        level=1,
        min_points=0,
        discount=Decimal('1.00'),
        points_multiplier=Decimal('1.00'),
        benefits='积分累计，活动优先报名',
        color='#999999'
    )
    level2 = MemberLevel.objects.create(
        name='银卡会员',
        level=2,
        min_points=1000,
        discount=Decimal('0.95'),
        points_multiplier=Decimal('1.20'),
        benefits='95折优惠，积分1.2倍，生日礼包',
        color='#C0C0C0'
    )
    level3 = MemberLevel.objects.create(
        name='金卡会员',
        level=3,
        min_points=5000,
        discount=Decimal('0.90'),
        points_multiplier=Decimal('1.50'),
        benefits='9折优惠，积分1.5倍，专属活动，免费咖啡',
        color='#FFD700'
    )
    level4 = MemberLevel.objects.create(
        name='钻石会员',
        level=4,
        min_points=20000,
        discount=Decimal('0.85'),
        points_multiplier=Decimal('2.00'),
        benefits='85折优惠，积分2倍，专属顾问，免费寄存',
        color='#00CED1'
    )
    print('创建会员等级完成')
    
    supplier1 = Supplier.objects.create(
        name='新华书店发行集团',
        contact_person='张经理',
        phone='010-12345678',
        email='zhang@xinhua.com',
        address='北京市西城区北礼士路54号'
    )
    supplier2 = Supplier.objects.create(
        name='上海世纪出版集团',
        contact_person='李主管',
        phone='021-87654321',
        email='li@shanghai.com',
        address='上海市闵行区号景路159弄'
    )
    supplier3 = Supplier.objects.create(
        name='中国图书进出口总公司',
        contact_person='王总',
        phone='010-65874321',
        email='wang@cnpiec.com',
        address='北京市朝阳区工体东路16号'
    )
    print('创建供应商完成')
    
    cat_literature = Category.objects.create(name='文学', sort_order=1)
    cat_history = Category.objects.create(name='历史', sort_order=2)
    cat_philosophy = Category.objects.create(name='哲学', sort_order=3)
    cat_science = Category.objects.create(name='科学', sort_order=4)
    cat_art = Category.objects.create(name='艺术', sort_order=5)
    cat_business = Category.objects.create(name='商业', sort_order=6)
    cat_children = Category.objects.create(name='童书', sort_order=7)
    print('创建图书分类完成')
    
    books_data = [
        {
            'isbn': '9787020024759',
            'title': '活着',
            'author': '余华',
            'publisher': '人民文学出版社',
            'publish_date': '2012-08-01',
            'category': cat_literature,
            'supplier': supplier1,
            'price': 39.00,
            'cost_price': 19.50,
            'pages': 191,
            'binding': '平装',
            'summary': '《活着》是作家余华的代表作之一，讲述了在大时代背景下，随着内战、三反五反、大跃进、文化大革命等社会变革，徐福贵的人生和家庭不断经受着苦难，到了最后所有亲人都先后离他而去，仅剩下年老的他和一头老牛相依为命。',
            'stock_quantity': 50,
            'low_stock_threshold': 10,
            'location': 'A-01-01'
        },
        {
            'isbn': '9787544270878',
            'title': '百年孤独',
            'author': '加西亚·马尔克斯',
            'translator': '范晔',
            'publisher': '南海出版公司',
            'publish_date': '2017-08-01',
            'category': cat_literature,
            'supplier': supplier1,
            'price': 55.00,
            'cost_price': 27.50,
            'pages': 360,
            'binding': '精装',
            'summary': '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰，反映了拉丁美洲一个世纪以来风云变幻的历史。',
            'stock_quantity': 30,
            'low_stock_threshold': 5,
            'location': 'A-01-02'
        },
        {
            'isbn': '9787508665689',
            'title': '人类简史',
            'author': '尤瓦尔·赫拉利',
            'translator': '林俊宏',
            'publisher': '中信出版社',
            'publish_date': '2017-02-01',
            'category': cat_history,
            'supplier': supplier2,
            'price': 68.00,
            'cost_price': 34.00,
            'pages': 440,
            'binding': '平装',
            'summary': '从十万年前有生命迹象开始到21世纪资本、科技交织的人类发展史。十万年前，地球上至少有六个人种，为何今天却只剩下了我们自己？我们曾经只是非洲角落一个毫不起眼的族群，对地球上生态的影响力和萤火虫、猩猩或者水母相差无几。为何我们能登上生物链的顶端，最终成为地球的主宰？',
            'stock_quantity': 45,
            'low_stock_threshold': 8,
            'location': 'B-01-01'
        },
        {
            'isbn': '9787100091138',
            'title': '万历十五年',
            'author': '黄仁宇',
            'publisher': '商务印书馆',
            'publish_date': '2014-08-01',
            'category': cat_history,
            'supplier': supplier2,
            'price': 36.00,
            'cost_price': 18.00,
            'pages': 288,
            'binding': '平装',
            'summary': '《万历十五年》是黄仁宇的成名之作，也是他的代表作之一。这本书融会了他数十年人生经历与治学体会，首次以“大历史观”分析明代社会之症结，观察现代中国之来路，给人启发良多。',
            'stock_quantity': 25,
            'low_stock_threshold': 5,
            'location': 'B-01-02'
        },
        {
            'isbn': '9787544258609',
            'title': '苏菲的世界',
            'author': '乔斯坦·贾德',
            'translator': '萧宝森',
            'publisher': '作家出版社',
            'publish_date': '2017-08-01',
            'category': cat_philosophy,
            'supplier': supplier1,
            'price': 45.00,
            'cost_price': 22.50,
            'pages': 535,
            'binding': '平装',
            'summary': '《苏菲的世界》是挪威作家乔斯坦·贾德创作的一本关于西方哲学史的长篇小说，它以小说的形式，通过一名哲学导师向一个叫苏菲的女孩传授哲学知识的经过，揭示了西方哲学史发展的历程。',
            'stock_quantity': 20,
            'low_stock_threshold': 5,
            'location': 'C-01-01'
        },
        {
            'isbn': '9787535794376',
            'title': '时间简史',
            'author': '史蒂芬·霍金',
            'translator': '许明贤、吴忠超',
            'publisher': '湖南科学技术出版社',
            'publish_date': '2018-01-01',
            'category': cat_science,
            'supplier': supplier3,
            'price': 49.00,
            'cost_price': 24.50,
            'pages': 245,
            'binding': '精装',
            'summary': '《时间简史》是英国物理学家斯蒂芬·霍金创作的科学著作，首次出版于1988年。全书共十二章，讲的全都是关于宇宙本性的最前沿知识，包括：我们的宇宙图像、空间和时间、膨胀的宇宙、不确定性原理、黑洞、宇宙的起源和命运等内容。',
            'stock_quantity': 35,
            'low_stock_threshold': 8,
            'location': 'D-01-01'
        },
        {
            'isbn': '9787550215658',
            'title': '艺术的故事',
            'author': '贡布里希',
            'translator': '范景中、杨成凯',
            'publisher': '广西美术出版社',
            'publish_date': '2015-11-01',
            'category': cat_art,
            'supplier': supplier3,
            'price': 280.00,
            'cost_price': 140.00,
            'pages': 688,
            'binding': '精装',
            'summary': '《艺术的故事》是有关艺术的书籍中最著名、最流行的著作之一。它概括地叙述了从最早的洞窟绘画到当今的实验艺术的发展历程，以阐明艺术史是“各种传统不断迂回、不断改变的历史，每一件作品在这历史中都既回顾过去又导向未来”。',
            'stock_quantity': 15,
            'low_stock_threshold': 3,
            'location': 'E-01-01'
        },
        {
            'isbn': '9787508657463',
            'title': '穷查理宝典',
            'author': '查理·芒格',
            'translator': '李继宏',
            'publisher': '中信出版社',
            'publish_date': '2016-08-01',
            'category': cat_business,
            'supplier': supplier2,
            'price': 168.00,
            'cost_price': 84.00,
            'pages': 552,
            'binding': '精装',
            'summary': '《穷查理宝典》收录了查理过去20年来主要的公开演讲。除简单而权威的查理传略外，其后的《芒格的生活、学习和决策方法》以及《芒格主义：查理的即席谈话》整理了芒格最精华的思维与决策方式和以往在伯克希尔·哈撒韦公司和西科金融公司年会上犀利和幽默的评论。',
            'stock_quantity': 18,
            'low_stock_threshold': 5,
            'location': 'F-01-01'
        },
        {
            'isbn': '9787544291189',
            'title': '小王子',
            'author': '圣埃克苏佩里',
            'translator': '李继宏',
            'publisher': '天津人民出版社',
            'publish_date': '2018-03-01',
            'category': cat_children,
            'supplier': supplier1,
            'price': 32.00,
            'cost_price': 16.00,
            'pages': 97,
            'binding': '精装',
            'summary': '《小王子》是法国作家安托万·德·圣·埃克苏佩里于1942年写成的著名儿童文学短篇小说。本书的主人公是来自外星球的小王子。书中以一位飞行员作为故事叙述者，讲述了小王子从自己星球出发前往地球的过程中，所经历的各种历险。',
            'stock_quantity': 60,
            'low_stock_threshold': 15,
            'location': 'G-01-01'
        },
        {
            'isbn': '9787530216156',
            'title': '三体',
            'author': '刘慈欣',
            'publisher': '北京十月文艺出版社',
            'publish_date': '2016-06-01',
            'category': cat_science,
            'supplier': supplier1,
            'price': 93.00,
            'cost_price': 46.50,
            'pages': 302,
            'binding': '平装',
            'summary': '《三体》是刘慈欣创作的系列长篇科幻小说，由《三体》、《三体Ⅱ·黑暗森林》、《三体Ⅲ·死神永生》组成，第一部于2006年5月起在《科幻世界》杂志上连载，讲述了地球人类文明和三体文明的信息交流、生死搏杀及两个文明在宇宙中的兴衰历程。',
            'stock_quantity': 80,
            'low_stock_threshold': 20,
            'location': 'D-01-02'
        },
    ]
    
    for book_data in books_data:
        Book.objects.create(**book_data)
    print(f'创建 {len(books_data)} 本图书完成')
    
    members_data = [
        {'name': '张三', 'gender': 'male', 'phone': '13900000001', 'email': 'zhangsan@example.com', 'level': level3},
        {'name': '李四', 'gender': 'female', 'phone': '13900000002', 'email': 'lisi@example.com', 'level': level2},
        {'name': '王五', 'gender': 'male', 'phone': '13900000003', 'email': 'wangwu@example.com', 'level': level1},
        {'name': '赵六', 'gender': 'female', 'phone': '13900000004', 'email': 'zhaoliu@example.com', 'level': level4},
        {'name': '孙七', 'gender': 'male', 'phone': '13900000005', 'email': 'sunqi@example.com', 'level': level2},
        {'name': '周八', 'gender': 'female', 'phone': '13900000006', 'email': 'zhouba@example.com', 'level': level1},
    ]
    
    for member_data in members_data:
        member = Member.objects.create(**member_data, available_points=500, total_points=1500)
        PointsRecord.objects.create(
            member=member,
            type='earn',
            points=1500,
            balance_after=1500,
            source='注册赠送'
        )
    print(f'创建 {len(members_data)} 个会员完成')
    
    event_type1 = EventType.objects.create(name='读书会', description='定期举办的读书分享活动', color='#1890ff')
    event_type2 = EventType.objects.create(name='作家见面会', description='邀请作家与读者面对面交流', color='#52c41a')
    event_type3 = EventType.objects.create(name='主题讲座', description='各类文化主题讲座', color='#fa8c16')
    event_type4 = EventType.objects.create(name='亲子阅读', description='面向家长和孩子的阅读活动', color='#eb2f96')
    print('创建活动类型完成')
    
    events_data = [
        {
            'title': '《活着》读书分享会',
            'event_type': event_type1,
            'description': '一起共读余华经典作品《活着》，分享各自的阅读感悟，探讨生命的意义。',
            'start_time': timezone.now() + timedelta(days=3),
            'end_time': timezone.now() + timedelta(days=3, hours=2),
            'location': '二楼阅读空间',
            'host': '独立书店',
            'speaker': '资深读者 李明',
            'max_participants': 30,
            'fee': 0,
            'points_reward': 50,
            'status': Event.STATUS_REGISTRATION_OPEN,
            'registration_deadline': timezone.now() + timedelta(days=2),
        },
        {
            'title': '科幻文学的魅力——《三体》解读',
            'event_type': event_type3,
            'description': '邀请科幻文学研究者深度解读刘慈欣代表作《三体》，带你走进硬科幻的世界。',
            'start_time': timezone.now() + timedelta(days=7),
            'end_time': timezone.now() + timedelta(days=7, hours=3),
            'location': '一楼活动大厅',
            'host': '独立书店',
            'speaker': '科幻文学研究者 王教授',
            'max_participants': 50,
            'fee': 39.00,
            'points_reward': 100,
            'status': Event.STATUS_REGISTRATION_OPEN,
            'registration_deadline': timezone.now() + timedelta(days=5),
        },
        {
            'title': '亲子阅读时光——《小王子》',
            'event_type': event_type4,
            'description': '适合4-12岁儿童及家长参加的亲子阅读活动，一起走进小王子的世界。',
            'start_time': timezone.now() + timedelta(days=10),
            'end_time': timezone.now() + timedelta(days=10, hours=2),
            'location': '三楼亲子区',
            'host': '独立书店',
            'speaker': '儿童阅读推广人 张老师',
            'max_participants': 20,
            'fee': 0,
            'points_reward': 30,
            'status': Event.STATUS_PUBLISHED,
            'registration_deadline': timezone.now() + timedelta(days=8),
        },
    ]
    
    for event_data in events_data:
        Event.objects.create(**event_data)
    print(f'创建 {len(events_data)} 个活动完成')
    
    book1 = Book.objects.get(isbn='9787020024759')
    book2 = Book.objects.get(isbn='9787544270878')
    member1 = Member.objects.get(phone='13900000001')
    member2 = Member.objects.get(phone='13900000002')
    
    reservation1 = Reservation.objects.create(
        member=member1,
        contact_name=member1.name,
        contact_phone=member1.phone,
        status=Reservation.STATUS_CONFIRMED,
        confirmed_at=timezone.now(),
        expire_at=timezone.now() + timedelta(hours=24)
    )
    ReservationItem.objects.create(
        reservation=reservation1,
        book=book1,
        quantity=2,
        price=book1.price,
        subtotal=book1.price * 2
    )
    book1.reserved_quantity += 2
    book1.save()
    
    reservation2 = Reservation.objects.create(
        member=member2,
        contact_name=member2.name,
        contact_phone=member2.phone,
        status=Reservation.STATUS_PENDING,
        expire_at=timezone.now() + timedelta(hours=48)
    )
    ReservationItem.objects.create(
        reservation=reservation2,
        book=book2,
        quantity=1,
        price=book2.price,
        subtotal=book2.price * 1
    )
    book2.reserved_quantity += 1
    book2.save()
    print('创建 2 个预留单完成')
    
    order1 = SaleOrder.objects.create(
        member=member1,
        status=SaleOrder.STATUS_COMPLETED,
        payment_method=SaleOrder.PAYMENT_WECHAT,
        total_quantity=3,
        subtotal=Decimal('143.00'),
        total_amount=Decimal('143.00'),
        paid_amount=Decimal('143.00'),
        points_earned=143,
        sale_date=timezone.now() - timedelta(days=1),
        paid_at=timezone.now() - timedelta(days=1)
    )
    SaleOrderItem.objects.create(
        order=order1,
        book=book1,
        quantity=1,
        price=book1.price,
        discount=Decimal('1.00'),
        subtotal=book1.price,
        points_earned=39
    )
    SaleOrderItem.objects.create(
        order=order1,
        book=book2,
        quantity=1,
        price=book2.price,
        discount=Decimal('0.90'),
        subtotal=book2.price * Decimal('0.90'),
        points_earned=49
    )
    book1.stock_quantity -= 1
    book1.save()
    book2.stock_quantity -= 1
    book2.save()
    print('创建示例销售订单完成')
    
    print('\n' + '='*50)
    print('测试数据创建完成！')
    print('='*50)
    print('\n测试账号：')
    print('  管理员: admin / admin123')
    print('  店长:   manager / manager123')
    print('  员工:   staff / staff123')
    print('\n会员手机号（可用于测试）：')
    print('  13900000001 - 张三 (金卡)')
    print('  13900000002 - 李四 (银卡)')
    print('  13900000003 - 王五 (普通)')
    print('  13900000004 - 赵六 (钻石)')


if __name__ == '__main__':
    create_test_data()
