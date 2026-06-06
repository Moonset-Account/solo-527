"""
初始化演示数据脚本
用于验证家长端数据隔离（只能看自家借阅、活动报名、押金流水）
以及破损绘本暂停借出、候补转正、押金申诉功能

运行方式: python manage.py shell < scripts/init_demo_data.py
"""
import django
import os
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'library_system.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from members.models import Member, MemberRole
from books.models import Book, BookStatus
from borrows.models import Borrow
from activities.models import Activity, ActivityStatus
from deposits.models import DepositAccount, TransactionType, TransactionStatus
from repairs.models import RepairRecord, DamageLevel

print("=" * 60)
print("开始初始化演示数据...")
print("=" * 60)

# 1. 创建用户和会员
print("\n1. 创建用户和会员...")

user_librarian, _ = User.objects.get_or_create(
    username='librarian',
    defaults={'is_staff': True, 'is_superuser': True}
)
user_librarian.set_password('123456')
user_librarian.save()

member_librarian, _ = Member.objects.get_or_create(
    user=user_librarian,
    defaults={
        'role': MemberRole.LIBRARIAN,
        'family_name': '李馆员',
        'phone': '13800000001'
    }
)
print(f"  馆员账号: librarian / 123456")

# 创建三个家长用户
parents = []
for i in range(3):
    user, _ = User.objects.get_or_create(
        username=f'parent{i+1}',
        defaults={'is_staff': False}
    )
    user.set_password('123456')
    user.save()
    
    member, _ = Member.objects.get_or_create(
        user=user,
        defaults={
            'role': MemberRole.PARENT,
            'family_name': f'{["王", "李", "张"][i]}家长',
            'child_name': f'{["小明", "小红", "小刚"][i]}',
            'child_age': 5 + i,
            'phone': f'138000000{i+1:02d}'
        }
    )
    parents.append(member)
    print(f"  家长账号{i+1}: parent{i+1} / 123456 ({member.family_name} - {member.child_name})")

# 2. 创建绘本
print("\n2. 创建绘本...")
books_data = [
    {'isbn': '9787543460756', 'title': '猜猜我有多爱你', 'author': '山姆·麦克布雷尼'},
    {'isbn': '9787533256210', 'title': '好饿的毛毛虫', 'author': '艾瑞·卡尔'},
    {'isbn': '9787543462363', 'title': '我爸爸', 'author': '安东尼·布朗'},
    {'isbn': '9787539135694', 'title': '不一样的卡梅拉', 'author': '克利斯提昂·约里波瓦'},
    {'isbn': '9787221091956', 'title': '神奇校车', 'author': '乔安娜·柯尔'},
    {'isbn': '9787543462356', 'title': '大卫不可以', 'author': '大卫·香农'},
]

books = []
for book_data in books_data:
    book, _ = Book.objects.get_or_create(
        isbn=book_data['isbn'],
        defaults=book_data
    )
    books.append(book)
    print(f"  绘本: {book.title}")

# 3. 创建借阅记录（每个家长有不同的借阅记录，验证数据隔离）
print("\n3. 创建借阅记录（验证数据隔离）...")
today = timezone.now().date()

# 家长1的借阅
borrow1_1, _ = Borrow.objects.get_or_create(
    book=books[0],
    member=parents[0],
    defaults={
        'due_date': today + timedelta(days=7),
        'status': 'borrowed'
    }
)
books[0].status = BookStatus.BORROWED
books[0].save()

borrow1_2, _ = Borrow.objects.get_or_create(
    book=books[1],
    member=parents[0],
    defaults={
        'due_date': today - timedelta(days=3),
        'status': 'borrowed'
    }
)
books[1].status = BookStatus.BORROWED
books[1].save()
print(f"  {parents[0].family_name} 借阅了: {books[0].title}, {books[1].title}（1本逾期）")

# 家长2的借阅
borrow2_1, _ = Borrow.objects.get_or_create(
    book=books[2],
    member=parents[1],
    defaults={
        'due_date': today + timedelta(days=10),
        'status': 'borrowed'
    }
)
books[2].status = BookStatus.BORROWED
books[2].save()
print(f"  {parents[1].family_name} 借阅了: {books[2].title}")

# 家长3无借阅
print(f"  {parents[2].family_name} 无借阅")

# 4. 创建活动和报名（验证候补排位）
print("\n4. 创建活动和报名（验证候补转正）...")

activity, _ = Activity.objects.get_or_create(
    title='周六海洋主题故事会',
    defaults={
        'description': '通过绘本探索神秘的海洋世界',
        'activity_type': 'storytelling',
        'start_time': timezone.now() + timedelta(days=3),
        'end_time': timezone.now() + timedelta(days=3, hours=1),
        'location': '绘本馆活动室A',
        'max_capacity': 2,
        'status': ActivityStatus.UPCOMING
    }
)

# 家长1和家长2报名成功（占满名额）
activity.register(parents[0])
activity.register(parents[1])
print(f"  活动: {activity.title} (名额 {activity.max_capacity})")
print(f"  {parents[0].family_name} 报名成功")
print(f"  {parents[1].family_name} 报名成功")

# 家长3进入候补
activity.register(parents[2])
print(f"  {parents[2].family_name} 进入候补 (排位1)")

# 5. 创建押金账户和流水（验证扣减确认和申诉）
print("\n5. 创建押金账户和流水（验证扣减确认和申诉）...")

for i, parent in enumerate(parents):
    account, _ = DepositAccount.objects.get_or_create(
        member=parent,
        defaults={'balance': Decimal('200.00')}
    )
    
    # 充值记录
    account.add_transaction(
        amount=Decimal('200.00'),
        trans_type=TransactionType.DEPOSIT,
        description='初始押金充值'
    )
    
    # 家长1有扣减记录（可申诉）
    if i == 0:
        trans = account.add_transaction(
            amount=Decimal('50.00'),
            trans_type=TransactionType.DEDUCT,
            description='绘本《好饿的毛毛虫》内页涂鸦扣减'
        )
        trans.status = TransactionStatus.CONFIRMED
        trans.save()
        print(f"  {parent.family_name}: 押金 ¥{account.balance} (有扣减记录，可申诉)")
    else:
        print(f"  {parent.family_name}: 押金 ¥{account.balance}")

# 6. 创建破损绘本（验证暂停借出）
print("\n6. 创建破损绘本（验证暂停借出）...")

# 绘本4设为影响阅读（已下架，不可借阅）
repair1, _ = RepairRecord.objects.get_or_create(
    book=books[3],
    reporter=member_librarian,
    damage_level=DamageLevel.AFFECT_READ,
    description='内页多处涂鸦，影响阅读'
)
print(f"  绘本《{books[3].title}》: 破损程度=影响阅读, 状态={books[3].get_status_display()}, 可借阅={books[3].can_borrow()}")

# 绘本5设为需下架（已下架，不可借阅）
repair2, _ = RepairRecord.objects.get_or_create(
    book=books[4],
    reporter=member_librarian,
    damage_level=DamageLevel.NEED_OFF,
    description='书脊断裂，严重破损'
)
print(f"  绘本《{books[4].title}》: 破损程度=需下架, 状态={books[4].get_status_display()}, 可借阅={books[4].can_borrow()}")

print("\n" + "=" * 60)
print("演示数据初始化完成！")
print("=" * 60)
print("\n验证点说明:")
print("  1. 家长端数据隔离:")
print(f"     - 登录 parent1 (王家长) 只能看到自己的 2 条借阅记录")
print(f"     - 登录 parent2 (李家长) 只能看到自己的 1 条借阅记录")
print(f"     - 登录 parent3 (张家长) 看不到借阅记录")
print("  2. 活动候补排位:")
print(f"     - parent3 (张家长) 可以看到自己的候补排位 #1")
print("  3. 押金扣减确认与申诉:")
print(f"     - parent1 (王家长) 可以看到扣减记录并发起申诉")
print("  4. 破损绘本暂停借出:")
print(f"     - 《不一样的卡梅拉》和《神奇校车》状态为已下架，无法被借阅")
print("\n快速验证命令:")
print("  python manage.py test tests.test_damage_book    # 破损绘本暂停借出")
print("  python manage.py test tests.test_waitlist_promotion  # 候补转正")
print("  python manage.py test tests.test_deposit_appeal  # 押金申诉")
