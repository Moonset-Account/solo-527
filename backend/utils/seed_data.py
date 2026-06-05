from datetime import datetime, timedelta, date
from app import db
from models import User, MemberLevel, Member, Film, Hall

def seed_database():
    if User.query.count() == 0:
        admin = User(username='admin', email='admin@cinema.com', role='admin')
        admin.set_password('admin123')
        
        curator = User(username='curator', email='curator@cinema.com', role='curator')
        curator.set_password('curator123')
        
        frontdesk = User(username='frontdesk', email='frontdesk@cinema.com', role='frontdesk')
        frontdesk.set_password('frontdesk123')
        
        finance = User(username='finance', email='finance@cinema.com', role='finance')
        finance.set_password('finance123')
        
        db.session.add_all([admin, curator, frontdesk, finance])
        db.session.commit()
    
    if MemberLevel.query.count() == 0:
        basic = MemberLevel(
            name='基础会员',
            description='基础会员等级，享受基本观影权益',
            price=0,
            max_bookings_per_screening=1,
            priority=0,
            booking_window_days=3,
            benefits=['会员专属场次报名', '购票优惠5%']
        )
        
        premium = MemberLevel(
            name='高级会员',
            description='高级会员等级，享受更多权益',
            price=365,
            max_bookings_per_screening=2,
            priority=5,
            booking_window_days=7,
            benefits=['提前7天报名', '每场可报2人', '专属座位保留', '购票优惠15%', '会员专属活动']
        )
        
        vip = MemberLevel(
            name='VIP会员',
            description='VIP会员等级，最高等级权益',
            price=1999,
            max_bookings_per_screening=4,
            priority=10,
            booking_window_days=14,
            benefits=['提前14天报名', '每场可报4人', 'VIP休息室', '优先候补', '免费退票', '邀请嘉宾活动', '专属策展人服务']
        )
        
        db.session.add_all([basic, premium, vip])
        db.session.commit()
    
    if Member.query.count() == 0:
        levels = MemberLevel.query.all()
        level_map = {l.name: l for l in levels}
        
        members = [
            Member(member_no='M000001', name='张三', phone='13800138001', email='zhang@example.com', level_id=level_map['基础会员'].id, join_date=date(2024, 1, 1), expiry_date=date(2025, 12, 31)),
            Member(member_no='M000002', name='李四', phone='13800138002', email='li@example.com', level_id=level_map['高级会员'].id, join_date=date(2024, 3, 15), expiry_date=date(2025, 3, 14)),
            Member(member_no='M000003', name='王五', phone='13800138003', email='wang@example.com', level_id=level_map['VIP会员'].id, join_date=date(2024, 2, 1), expiry_date=date(2025, 1, 31)),
            Member(member_no='M000004', name='赵六', phone='13800138004', email='zhao@example.com', level_id=level_map['基础会员'].id, join_date=date(2024, 4, 1), expiry_date=date(2025, 3, 31)),
            Member(member_no='M000005', name='钱七', phone='13800138005', email='qian@example.com', level_id=level_map['高级会员'].id, join_date=date(2024, 5, 10), expiry_date=date(2025, 5, 9)),
        ]
        
        db.session.add_all(members)
        db.session.commit()
    
    if Film.query.count() == 0:
        today = date.today()
        films = [
            Film(
                title='放牛班的春天',
                original_title='Les Choristes',
                director='克里斯托夫·巴拉蒂',
                year=2004,
                duration=97,
                country='法国',
                language='法语',
                synopsis='世界著名指挥家皮埃尔·莫昂克重回法国故地出席母亲的葬礼，他的旧友佩皮诺送给他一本陈旧的日记，看着这本当年音乐启蒙老师克莱门特·马修遗下的日记，皮埃尔慢慢细味着老师当年的心境，一幕幕童年的回忆也浮出自己记忆的深潭。',
                license_start_date=today - timedelta(days=30),
                license_end_date=today + timedelta(days=180),
                distributor='法国高蒙电影公司',
                license_number='FR-2024-001',
                status='active'
            ),
            Film(
                title='天堂电影院',
                original_title='Nuovo Cinema Paradiso',
                director='朱塞佩·托纳多雷',
                year=1988,
                duration=155,
                country='意大利',
                language='意大利语',
                synopsis='意大利南部小镇，古灵精怪的小男孩多多喜欢看电影，更喜欢看放映师艾佛特放电影，他和艾佛特成为了忘年之交，在胶片中找到了童年生活的乐趣。',
                license_start_date=today - timedelta(days=60),
                license_end_date=today + timedelta(days=90),
                distributor='意大利电影公司',
                license_number='IT-2024-002',
                status='active'
            ),
            Film(
                title='海上钢琴师',
                original_title='La leggenda del pianista sull\'oceano',
                director='朱塞佩·托纳多雷',
                year=1998,
                duration=165,
                country='意大利',
                language='英语',
                synopsis='1900年，Virginian号豪华邮轮上，一个孤儿被遗弃在头等舱，由船上的水手抚养长大，取名1900。1900慢慢长大，显示出了无师自通的非凡钢琴天赋，在船上的乐队表演钢琴，每个听过他演奏的人，都被深深打动。',
                license_start_date=today - timedelta(days=10),
                license_end_date=today + timedelta(days=60),
                distributor='意大利电影公司',
                license_number='IT-2024-003',
                status='active'
            ),
            Film(
                title='肖申克的救赎',
                original_title='The Shawshank Redemption',
                director='弗兰克·德拉邦特',
                year=1994,
                duration=142,
                country='美国',
                language='英语',
                synopsis='一场谋杀案使银行家安迪蒙冤入狱，谋杀妻子及其情人的指控将囚禁他终生。在肖申克监狱里，希望似乎虚无缥缈，终身监禁的惩罚无法挽回。',
                license_start_date=today + timedelta(days=30),
                license_end_date=today + timedelta(days=210),
                distributor='美国华纳兄弟',
                license_number='US-2024-004',
                status='active'
            ),
            Film(
                title='霸王别姬',
                original_title='霸王别姬',
                director='陈凯歌',
                year=1993,
                duration=171,
                country='中国',
                language='普通话',
                synopsis='段小楼与程蝶衣是一对打小一起长大的师兄弟，两人一个演生，一个饰旦，一向配合天衣无缝，尤其一出《霸王别姬》，更是誉满京城。',
                license_start_date=today - timedelta(days=90),
                license_end_date=today - timedelta(days=1),
                distributor='中国电影公司',
                license_number='CN-2024-005',
                status='expired'
            )
        ]
        
        db.session.add_all(films)
        db.session.commit()
    
    if Hall.query.count() == 0:
        halls = [
            Hall(
                name='1号厅 - 经典厅',
                capacity=120,
                seat_map={'rows': 10, 'cols': 12, 'layout': 'standard'},
                facilities=['35mm胶片放映', '杜比环绕声', '舒适座椅'],
                description='经典艺术影厅，配备专业胶片放映设备'
            ),
            Hall(
                name='2号厅 - 学术厅',
                capacity=80,
                seat_map={'rows': 8, 'cols': 10, 'layout': 'academic'},
                facilities=['4K激光投影', '舞台区域', '交流讨论区'],
                description='适合学术放映和映后交流活动'
            ),
            Hall(
                name='3号厅 - VIP厅',
                capacity=30,
                seat_map={'rows': 5, 'cols': 6, 'layout': 'vip'},
                facilities=['真皮沙发座椅', '独立休息室', '茶点服务'],
                description='VIP会员专属影厅，提供高端观影体验'
            ),
            Hall(
                name='4号厅 - 实验厅',
                capacity=50,
                seat_map={'rows': 5, 'cols': 10, 'layout': 'flexible'},
                facilities=['可移动座椅', '多屏放映', '实验音响系统'],
                description='支持多种放映形式的实验性影厅'
            )
        ]
        
        db.session.add_all(halls)
        db.session.commit()
