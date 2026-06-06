import os
from typing import Optional

# ========================================
# 仓库SKU周转与滞销分析 - Superset配置
# ========================================

SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY', 'inventory-analysis-superset-secret-key-change-me')

APP_NAME = '仓库库存分析工作台'
APP_ICON = '/static/assets/images/superset-logo-horiz.png'
LOGO_TARGET_PATH = '/superset/dashboard/inventory-analysis/'

# 数据库配置
SQLALCHEMY_DATABASE_URI = os.environ.get(
    'SUPERSET_META_DATABASE_URI',
    'postgresql+psycopg2://superset:superset@postgres:5432/superset'
)

# ClickHouse数据源配置（在Superset UI中添加，或通过API初始化）
# clickhouse://clickhouse:clickhouse@clickhouse:8123/inventory_analysis

# 语言配置
BABEL_DEFAULT_LOCALE = 'zh'
LANGUAGES = {
    'zh': {'flag': 'cn', 'name': 'Chinese'},
    'en': {'flag': 'us', 'name': 'English'},
}

# 安全配置
SESSION_COOKIE_SAMESITE = 'Lax'
WTF_CSRF_ENABLED = True
WTF_CSRF_EXEMPT_LIST = []

# 功能开关
FEATURE_FLAGS = {
    'ENABLE_TEMPLATE_PROCESSING': True,
    'ENABLE_EXPLORE_JSON_CSRF_PROTECTION': False,
    'VERSIONED_EXPORT': True,
    'HORIZONTAL_FILTER_BAR': True,
    'DASHBOARD_NATIVE_FILTERS': True,
    'DASHBOARD_CROSS_FILTERS': True,
    'DASHBOARD_FILTERS_EXPERIMENTAL': True,
    'DASHBOARD_RBAC': True,
    'ALERT_REPORTS': True,
    'THUMBNAILS': True,
    'SCHEDULED_QUERIES': True,
    'HANDLE_BAR_CHART_TOTAL_LABELS': True,
    'DRILL_TO_DETAIL': True,
    'DRILL_BY': True,
}

# 缓存配置
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_cache_',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL', 'redis://redis:6379/0'),
}

DATA_CACHE_CONFIG = {**CACHE_CONFIG, 'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 2}
FILTER_STATE_CACHE_CONFIG = {**CACHE_CONFIG, 'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 24}
EXPLORE_FORM_DATA_CACHE_CONFIG = {**CACHE_CONFIG, 'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 24 * 7}

# 截图和导出配置
SCREENSHOT_LOCATE_WAIT = 3
SCREENSHOT_LOAD_WAIT = 10
WEBDRIVER_TYPE = 'firefox'
WEBDRIVER_OPTION_ARGS = [
    '--headless',
    '--marionette',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
]

# 告警和报表配置
ALERT_REPORTS_NOTIFICATION_DRY_RUN = False
SMTP_HOST = os.environ.get('SMTP_HOST', 'localhost')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 25))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_MAIL_FROM = os.environ.get('SMTP_MAIL_FROM', 'superset@example.com')

# 上传配置
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx', 'json', 'parquet'}
CSV_EXPORT = {
    'encoding': 'utf-8-sig',
}

# 行数限制
ROW_LIMIT = 100000
VIZ_ROW_LIMIT = 10000
SAMPLES_ROW_LIMIT = 1000
DISPLAY_MAX_ROW = 10000

# 异步任务
CELERY_CONFIG = {
    'broker_url': os.environ.get('REDIS_URL', 'redis://redis:6379/1'),
    'result_backend': os.environ.get('REDIS_URL', 'redis://redis:6379/2'),
    'worker_prefetch_multiplier': 1,
    'task_acks_late': True,
    'task_default_queue': 'superset',
    'task_default_exchange': 'superset',
    'task_default_routing_key': 'superset',
    'worker_send_task_events': True,
}

# 结果后端
RESULTS_BACKEND = {
    'type': 'S3FileSystem' if os.environ.get('S3_BUCKET') else 'LocalFileSystem',
    'CONFIG_PREFIX': 'DATASET_IMPORT',
}

# 认证
AUTH_TYPE = 1
AUTH_USER_REGISTRATION = False
AUTH_USER_REGISTRATION_ROLE = 'Gamma'

# 自定义CSS
CUSTOM_CSS = '''
.dashboard-header .header-title {
    font-size: 20px;
    font-weight: 600;
}
.filter_box .filter_name {
    font-weight: 500;
    color: #333;
}
.slice_container {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.alert-high {
    background-color: #ffebee;
    border-left: 4px solid #f44336;
}
.alert-medium {
    background-color: #fff3e0;
    border-left: 4px solid #ff9800;
}
'''
