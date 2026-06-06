import random
import string
from datetime import datetime

def generate_order_no():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.digits, k=4))
    return f'ORD{timestamp}{random_str}'

def generate_refund_no():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.digits, k=4))
    return f'REF{timestamp}{random_str}'

def generate_bag_no(building_id):
    timestamp = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.digits, k=3))
    return f'BAG{building_id:03d}{timestamp}{random_str}'

def generate_pickup_code():
    return ''.join(random.choices(string.digits, k=6))
