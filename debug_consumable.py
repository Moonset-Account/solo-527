import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'makerspace.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from consumables.models import Consumable, ConsumableUsage
from consumables.services import ConsumableUsageService

User = get_user_model()
user = User.objects.get(email='member@makerspace.com')
consumable = Consumable.objects.filter(current_stock__gt=0).first()

print(f'用户: {user}')
print(f'耗材: {consumable.name}, 库存: {consumable.current_stock}')
print(f'当前使用记录数: {ConsumableUsage.objects.count()}')

try:
    service = ConsumableUsageService(user)
    usage = service.record_usage(
        consumable=consumable,
        user=user,
        quantity=1,
        notes='测试调试领用'
    )
    print(f'✅ 领用成功!')
    print(f'   使用记录ID: {usage.id}')
    print(f'   数量: {usage.quantity}')
    print(f'   总费用: {usage.total_cost}')
    print(f'   更新后库存: {consumable.current_stock}')
    print(f'   当前使用记录数: {ConsumableUsage.objects.count()}')
except Exception as e:
    print(f'❌ 领用失败: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
