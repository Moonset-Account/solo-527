import hashlib
import uuid
from datetime import datetime, timedelta
import pytz


def generate_unique_id():
    return uuid.uuid4().hex


def generate_token(content):
    return hashlib.md5(content.encode()).hexdigest()


def get_current_time():
    return datetime.now(pytz.timezone('Asia/Shanghai'))


def format_datetime(dt):
    if not dt:
        return ''
    return dt.strftime('%Y-%m-%d %H:%M:%S')


def get_date_range(days=7):
    end = get_current_time()
    start = end - timedelta(days=days)
    return start, end
