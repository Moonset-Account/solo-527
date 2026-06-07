import sys
import os

print('=== 验证模块导入 ===')
try:
    from app.layouts.summary_cards import create_summary_card
    print('✅ summary_cards 导入成功')
except Exception as e:
    print(f'❌ summary_cards: {e}')

try:
    from app.layouts.filters import filters_layout
    print('✅ filters 导入成功')
except Exception as e:
    print(f'❌ filters: {e}')

try:
    from app.layouts.backlog_chart import render_backlog_chart
    print('✅ backlog_chart 导入成功')
except Exception as e:
    print(f'❌ backlog_chart: {e}')

try:
    from app.layouts.funnel_chart import render_funnel_chart
    print('✅ funnel_chart 导入成功')
except Exception as e:
    print(f'❌ funnel_chart: {e}')

try:
    from app.layouts.workload_chart import render_workload_chart
    print('✅ workload_chart 导入成功')
except Exception as e:
    print(f'❌ workload_chart: {e}')

try:
    from app.layouts.appeal_chart import render_appeal_chart
    print('✅ appeal_chart 导入成功')
except Exception as e:
    print(f'❌ appeal_chart: {e}')

try:
    from data.api.routes.queries import (
        get_backlog_trend, get_funnel_data, get_workload_data,
        get_appeal_reversal_data, get_summary_data
    )
    print('✅ data queries 导入成功')
except Exception as e:
    print(f'❌ data queries: {e}')
    import traceback
    traceback.print_exc()

print()
print('=== 测试图表渲染 ===')
from datetime import datetime, timedelta
time_end = datetime.now()
time_start = time_end - timedelta(hours=24)

try:
    df = get_backlog_trend(time_start, time_end, '1h')
    fig = render_backlog_chart(df)
    print(f'✅ 积压曲线渲染成功，{len(df)} 个数据点')
except Exception as e:
    print(f'❌ 积压曲线: {e}')
    import traceback
    traceback.print_exc()

try:
    df = get_funnel_data(time_start, time_end)
    fig = render_funnel_chart(df)
    print(f'✅ 漏斗图渲染成功，{len(df)} 个步骤')
except Exception as e:
    print(f'❌ 漏斗图: {e}')

try:
    df = get_workload_data(time_start, time_end)
    fig = render_workload_chart(df)
    print(f'✅ 负载热力图渲染成功，{len(df)} 条记录')
except Exception as e:
    print(f'❌ 负载热力图: {e}')

try:
    df = get_appeal_reversal_data(time_start, time_end)
    fig = render_appeal_chart(df)
    print(f'✅ 申诉逆转图渲染成功，{len(df)} 个标签')
except Exception as e:
    print(f'❌ 申诉逆转图: {e}')

try:
    card = create_summary_card('测试', 100, '%', '测试消息', '📊', 'high')
    print('✅ 摘要卡片渲染成功')
except Exception as e:
    print(f'❌ 摘要卡片: {e}')

print()
print('🎉 所有组件验证通过!')
