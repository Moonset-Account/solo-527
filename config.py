import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "canteen_analytics")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

CACHE_TYPE = "SimpleCache"
CACHE_DEFAULT_TIMEOUT = 300

MIN_SAMPLE_SIZE = 10
BAYESIAN_PRIOR_SCORE = 3.0
BAYESIAN_PRIOR_WEIGHT = 5

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")

WINDOW_NAMES = ["川味窗口", "粤菜窗口", "面食窗口", "快餐窗口", "特色小炒", "清真窗口"]
CUISINE_TYPES = ["川菜", "粤菜", "面食", "快餐", "小炒", "清真"]
MEAL_PERIODS = ["早餐", "午餐", "晚餐"]
CANCEL_REASONS = ["口味不佳", "分量不足", "食材不新鲜", "等待时间过长", "价格偏高", "其他"]

WEATHER_TYPES = ["晴天", "多云", "阴天", "小雨", "中雨", "大雨", "雪"]
