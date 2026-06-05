"""
测试配置 - 使用 SQLite 数据库，用于快速验证权限逻辑
"""
from .settings import *  # noqa

ALLOWED_HOSTS = ['*', 'testserver']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'test_db.sqlite3',
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# 禁用 Celery 任务
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False

# 使用测试 broker，不实际发送任务
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'
