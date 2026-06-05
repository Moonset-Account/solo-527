import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookstore.settings')
django.setup()

from django.db import models
from apps.books.models import Book
from apps.members.models import Member, PointsRecord
from apps.reservations.models import Reservation, ReservationItem
from apps.events.models import Event, EventRegistration
from apps.sales.models import SaleOrder


def run_validation():
    print("=" * 60)
    print("  独立书店系统 - 数据约束验证报告")
    print("=" * 60)
    print()
    
    results = []
    
    print("1. 图书 ISBN 唯一性检查")
    duplicate_isbns = Book.objects.values('isbn').annotate(
        count=models.Count('id')
    ).filter(count__gt=1, is_active=True)
    if duplicate_isbns.exists():
        print(f"   ❌ 发现 {duplicate_isbns.count()} 个重复的 ISBN")
        for item in duplicate_isbns:
            print(f"      - ISBN: {item['isbn']}, 数量: {item['count']}")
        results.append(('ISBN 唯一性', False, f'{duplicate_isbns.count()} 个重复'))
    else:
        print("   ✅ 所有图书 ISBN 唯一")
        results.append(('ISBN 唯一性', True, '通过'))
    print()
    
    print("2. 库存数量非负检查")
    negative_stock = Book.objects.filter(stock_quantity__lt=0, is_active=True)
    if negative_stock.exists():
        print(f"   ❌ 发现 {negative_stock.count()} 本图书库存为负数")
        for book in negative_stock:
            print(f"      - {book.title} (ISBN: {book.isbn}): {book.stock_quantity}")
        results.append(('库存非负', False, f'{negative_stock.count()} 个异常'))
    else:
        print("   ✅ 所有图书库存数量非负")
        results.append(('库存非负', True, '通过'))
    print()
    
    print("3. 预留数量不超过库存检查")
    invalid_reservations = []
    for book in Book.objects.filter(is_active=True):
        if book.reserved_quantity > book.stock_quantity:
            invalid_reservations.append(book)
    if invalid_reservations:
        print(f"   ❌ 发现 {len(invalid_reservations)} 本图书预留数量超过库存")
        for book in invalid_reservations:
            print(f"      - {book.title}: 库存={book.stock_quantity}, 预留={book.reserved_quantity}")
        results.append(('预留数量约束', False, f'{len(invalid_reservations)} 个异常'))
    else:
        print("   ✅ 所有图书预留数量不超过库存")
        results.append(('预留数量约束', True, '通过'))
    print()
    
    print("4. 会员手机号唯一性检查")
    duplicate_phones = Member.objects.values('phone').annotate(
        count=models.Count('id')
    ).filter(count__gt=1, is_active=True)
    if duplicate_phones.exists():
        print(f"   ❌ 发现 {duplicate_phones.count()} 个重复的手机号")
        for item in duplicate_phones:
            print(f"      - 手机号: {item['phone']}, 数量: {item['count']}")
        results.append(('会员手机号唯一', False, f'{duplicate_phones.count()} 个重复'))
    else:
        print("   ✅ 所有会员手机号唯一")
        results.append(('会员手机号唯一', True, '通过'))
    print()
    
    print("5. 会员积分余额非负检查")
    negative_points = Member.objects.filter(available_points__lt=0, is_active=True)
    if negative_points.exists():
        print(f"   ❌ 发现 {negative_points.count()} 个会员积分为负数")
        for member in negative_points:
            print(f"      - {member.name} ({member.member_no}): {member.available_points}")
        results.append(('积分非负', False, f'{negative_points.count()} 个异常'))
    else:
        print("   ✅ 所有会员积分余额非负")
        results.append(('积分非负', True, '通过'))
    print()
    
    print("6. 活动报名人数不超过最大人数检查")
    invalid_events = []
    for event in Event.objects.filter(is_active=True):
        if event.registered_count > event.max_participants:
            invalid_events.append(event)
    if invalid_events:
        print(f"   ❌ 发现 {len(invalid_events)} 个活动报名人数超过上限")
        for event in invalid_events:
            print(f"      - {event.title}: 上限={event.max_participants}, 已报名={event.registered_count}")
        results.append(('活动报名约束', False, f'{len(invalid_events)} 个异常'))
    else:
        print("   ✅ 所有活动报名人数不超过上限")
        results.append(('活动报名约束', True, '通过'))
    print()
    
    print("7. 预留单状态一致性检查")
    pending_expired = Reservation.objects.filter(
        status__in=['pending', 'confirmed'],
        expire_at__lte=django.utils.timezone.now()
    )
    if pending_expired.exists():
        print(f"   ⚠️  发现 {pending_expired.count()} 个预留单已过期但未标记")
        for res in pending_expired:
            print(f"      - {res.reservation_no}: 过期时间={res.expire_at}")
        results.append(('预留状态一致性', False, f'{pending_expired.count()} 个待处理'))
    else:
        print("   ✅ 预留单状态一致")
        results.append(('预留状态一致性', True, '通过'))
    print()
    
    print("8. 数据统计")
    print(f"   - 图书总数: {Book.objects.filter(is_active=True).count()}")
    print(f"   - 会员总数: {Member.objects.filter(is_active=True).count()}")
    print(f"   - 活动总数: {Event.objects.filter(is_active=True).count()}")
    print(f"   - 预留单总数: {Reservation.objects.count()}")
    print(f"   - 销售订单总数: {SaleOrder.objects.count()}")
    print(f"   - 活动报名总数: {EventRegistration.objects.count()}")
    print()
    
    print("=" * 60)
    print("  验证结果汇总")
    print("=" * 60)
    passed = sum(1 for r in results if r[1])
    failed = len(results) - passed
    print(f"  通过: {passed}/{len(results)} 项")
    if failed > 0:
        print(f"  失败: {failed}/{len(results)} 项")
        print()
        print("  需要处理的问题:")
        for name, passed, detail in results:
            if not passed:
                print(f"    - {name}: {detail}")
    else:
        print("  ✅ 所有数据约束验证通过！")
    print()
    
    return results


if __name__ == '__main__':
    run_validation()
