import pandas as pd
import numpy as np
from datetime import datetime, timedelta, time
import random

WINDOW_CONFIGS = [
    {'id': 1, 'name': '一楼-川湘窗口', 'floor': 1, 'canteen': '一食堂', 'category': '中餐', 'capacity': 2},
    {'id': 2, 'name': '一楼-清真窗口', 'floor': 1, 'canteen': '一食堂', 'category': '清真', 'capacity': 1},
    {'id': 3, 'name': '一楼-面食窗口', 'floor': 1, 'canteen': '一食堂', 'category': '面食', 'capacity': 2},
    {'id': 4, 'name': '二楼-自选快餐', 'floor': 2, 'canteen': '一食堂', 'category': '快餐', 'capacity': 3},
    {'id': 5, 'name': '二楼-日韩料理', 'floor': 2, 'canteen': '一食堂', 'category': '日韩', 'capacity': 1},
    {'id': 6, 'name': '二楼-地方小吃', 'floor': 2, 'canteen': '一食堂', 'category': '小吃', 'capacity': 2},
    {'id': 7, 'name': '三楼-西餐厅', 'floor': 3, 'canteen': '一食堂', 'category': '西餐', 'capacity': 2},
    {'id': 8, 'name': '三楼-养生汤品', 'floor': 3, 'canteen': '一食堂', 'category': '汤品', 'capacity': 1},
]

DISH_CONFIGS = [
    {'id': 1, 'name': '鱼香肉丝', 'window_id': 1, 'price': 12, 'category': '热菜', 'avg_prep_time': 5},
    {'id': 2, 'name': '宫保鸡丁', 'window_id': 1, 'price': 14, 'category': '热菜', 'avg_prep_time': 6},
    {'id': 3, 'name': '麻辣香锅', 'window_id': 1, 'price': 18, 'category': '热菜', 'avg_prep_time': 10},
    {'id': 4, 'name': '新疆拌面', 'window_id': 2, 'price': 15, 'category': '面食', 'avg_prep_time': 8},
    {'id': 5, 'name': '手抓饭', 'window_id': 2, 'price': 16, 'category': '主食', 'avg_prep_time': 7},
    {'id': 6, 'name': '兰州拉面', 'window_id': 3, 'price': 10, 'category': '面食', 'avg_prep_time': 4},
    {'id': 7, 'name': '刀削面', 'window_id': 3, 'price': 11, 'category': '面食', 'avg_prep_time': 5},
    {'id': 8, 'name': '红烧肉套餐', 'window_id': 4, 'price': 15, 'category': '套餐', 'avg_prep_time': 3},
    {'id': 9, 'name': '鸡腿套餐', 'window_id': 4, 'price': 14, 'category': '套餐', 'avg_prep_time': 3},
    {'id': 10, 'name': '寿司拼盘', 'window_id': 5, 'price': 25, 'category': '日料', 'avg_prep_time': 12},
    {'id': 11, 'name': '石锅拌饭', 'window_id': 5, 'price': 18, 'category': '韩餐', 'avg_prep_time': 10},
    {'id': 12, 'name': '生煎包', 'window_id': 6, 'price': 8, 'category': '小吃', 'avg_prep_time': 6},
    {'id': 13, 'name': '煎饼果子', 'window_id': 6, 'price': 7, 'category': '小吃', 'avg_prep_time': 4},
    {'id': 14, 'name': '黑椒牛排', 'window_id': 7, 'price': 38, 'category': '西餐', 'avg_prep_time': 15},
    {'id': 15, 'name': '意大利面', 'window_id': 7, 'price': 28, 'category': '西餐', 'avg_prep_time': 12},
    {'id': 16, 'name': '老母鸡汤', 'window_id': 8, 'price': 12, 'category': '汤品', 'avg_prep_time': 5},
    {'id': 17, 'name': '银耳莲子羹', 'window_id': 8, 'price': 8, 'category': '甜品', 'avg_prep_time': 3},
]

NEGATIVE_KEYWORDS = ['太慢', '排队久', '等不及', '口味差', '太咸', '太淡', '不新鲜', '量少', 
                     '价格贵', '服务差', '冷了', '没熟', '卫生差', '态度差', '等太久', 
                     '出餐慢', '难吃', '不好吃', '不热', '没味道']

POSITIVE_KEYWORDS = ['好吃', '快', '便宜', '量大', '新鲜', '美味', '服务好', '干净', 
                     '划算', '推荐', '棒', '赞', '满意', '喜欢', '香', '入味', '酥脆', 
                     '嫩', '鲜', '实惠']

REVIEW_TEMPLATES = {
    'positive': [
        '味道真的{keyword}，下次还来！',
        '出餐速度很{keyword}，不用等太久',
        '这个窗口真的很{keyword}，推荐大家试试',
        '{keyword}，今天吃得很满足',
        '服务态度{keyword}，环境也不错'
    ],
    'negative': [
        '实在是{keyword}，等了好久才吃上',
        '今天的菜有点{keyword}，不推荐',
        '{keyword}，以后不会再来了',
        '排队排得{keyword}，下次换个窗口',
        '感觉有点{keyword}，不值这个价'
    ]
}


def generate_mock_data(days: int = 7, orders_per_day: int = 800):
    start_date = datetime.now() - timedelta(days=days)
    
    windows_df = pd.DataFrame(WINDOW_CONFIGS)
    dishes_df = pd.DataFrame(DISH_CONFIGS)
    
    all_orders = []
    all_reviews = []
    all_outages = []
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        day_of_week = current_date.weekday()
        
        if day_of_week >= 5:
            day_factor = 0.6
        else:
            day_factor = 1.0
        
        outage_day = random.random() < 0.2
        if outage_day:
            outage_window = random.choice(WINDOW_CONFIGS)
            outage_start = current_date + timedelta(hours=11, minutes=random.randint(0, 30))
            outage_end = outage_start + timedelta(minutes=random.randint(20, 60))
            all_outages.append({
                'id': len(all_outages) + 1,
                'window_id': outage_window['id'],
                'start_time': outage_start,
                'end_time': outage_end,
                'reason': random.choice(['设备故障', '临时补货', '人员临时调整']),
                'is_planned': False,
                'affected_order_count': 0
            })
        
        meal_periods = [
            {'name': 'breakfast', 'start_hour': 7, 'end_hour': 9, 'intensity': 0.3},
            {'name': 'lunch', 'start_hour': 11, 'end_hour': 13, 'intensity': 1.0},
            {'name': 'dinner', 'start_hour': 17, 'end_hour': 19, 'intensity': 0.9},
            {'name': 'night_snack', 'start_hour': 20, 'end_hour': 22, 'intensity': 0.2},
        ]
        
        for meal in meal_periods:
            n_orders = int(orders_per_day * meal['intensity'] * day_factor / 4)
            
            for i in range(n_orders):
                window = random.choice(WINDOW_CONFIGS)
                dish = random.choice([d for d in DISH_CONFIGS if d['window_id'] == window['id']])
                
                minutes_in_period = random.randint(0, (meal['end_hour'] - meal['start_hour']) * 60)
                queue_start = current_date + timedelta(
                    hours=meal['start_hour'],
                    minutes=minutes_in_period
                )
                
                wait_queue = max(1, int(np.random.normal(5, 3)))
                wait_payment = max(0.5, int(np.random.normal(2, 1)))
                
                base_serve_time = dish['avg_prep_time']
                window_load = random.uniform(0.5, 2.0)
                wait_serve = max(1, int(base_serve_time * window_load))
                
                payment_time = queue_start + timedelta(minutes=wait_queue)
                serve_time = payment_time + timedelta(minutes=wait_payment + wait_serve)
                
                total_wait = wait_queue + wait_payment + wait_serve
                
                is_big_break = False
                if meal['name'] == 'lunch' and minutes_in_period >= 60 and minutes_in_period <= 120:
                    is_big_break = random.random() < 0.7
                
                order_no = f"ORD{current_date.strftime('%Y%m%d')}_{meal['name']}_{window['id']}_{i:04d}"
                
                is_abnormal = False
                abnormal_reason = ''
                
                if random.random() < 0.03:
                    is_abnormal = True
                    wait_serve = max(wait_serve, random.randint(20, 45))
                    total_wait = wait_queue + wait_payment + wait_serve
                    serve_time = payment_time + timedelta(minutes=wait_payment + wait_serve)
                    abnormal_reason = 'large_order'
                
                all_orders.append({
                    'id': len(all_orders) + 1,
                    'order_no': order_no,
                    'window_id': window['id'],
                    'dish_id': dish['id'],
                    'student_id': f'STU{random.randint(10000, 99999)}',
                    'queue_start_time': queue_start,
                    'payment_time': payment_time,
                    'serve_time': serve_time,
                    'amount': dish['price'] * random.randint(1, 2),
                    'item_count': random.randint(1, 3),
                    'is_abnormal': is_abnormal,
                    'abnormal_reason': abnormal_reason,
                    'wait_queue': wait_queue,
                    'wait_payment': wait_payment,
                    'wait_serve': wait_serve,
                    'total_wait': total_wait,
                    'time_slot': meal['name'],
                    'floor': window['floor'],
                    'is_big_break': is_big_break,
                    'extra': {}
                })
                
                if random.random() < 0.15:
                    wait_factor = min(1.0, total_wait / 30)
                    base_rating = 5 - wait_factor * 3
                    rating = max(1, min(5, int(np.random.normal(base_rating, 0.8))))
                    
                    if rating <= 2:
                        sentiment = 'negative'
                        keywords = random.sample(NEGATIVE_KEYWORDS, k=min(3, len(NEGATIVE_KEYWORDS)))
                    elif rating >= 4:
                        sentiment = 'positive'
                        keywords = random.sample(POSITIVE_KEYWORDS, k=min(3, len(POSITIVE_KEYWORDS)))
                    else:
                        sentiment = 'neutral'
                        keywords = []
                    
                    if keywords:
                        kw = keywords[0]
                        template = random.choice(REVIEW_TEMPLATES[sentiment] if sentiment != 'neutral' else REVIEW_TEMPLATES['positive'])
                        comment = template.format(keyword=kw)
                    else:
                        comment = '还行吧'
                    
                    all_reviews.append({
                        'id': len(all_reviews) + 1,
                        'order_id': len(all_orders),
                        'window_id': window['id'],
                        'rating': rating,
                        'comment': comment,
                        'create_time': serve_time + timedelta(minutes=random.randint(5, 30)),
                        'sentiment': sentiment,
                        'keywords': keywords
                    })
    
    orders_df = pd.DataFrame(all_orders)
    reviews_df = pd.DataFrame(all_reviews)
    outages_df = pd.DataFrame(all_outages)
    
    if not outages_df.empty:
        for _, outage in outages_df.iterrows():
            mask = (
                (orders_df['window_id'] == outage['window_id']) &
                (orders_df['queue_start_time'] >= outage['start_time']) &
                (orders_df['queue_start_time'] <= outage['end_time'])
            )
            affected_count = mask.sum()
            outages_df.loc[outages_df['id'] == outage['id'], 'affected_order_count'] = affected_count
    
    return orders_df, windows_df, dishes_df, reviews_df, outages_df
