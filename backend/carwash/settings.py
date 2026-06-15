import os
from pathlib import Path
import environ

env = environ.Env(
    DEBUG=(bool, False),
    ENVIRONMENT=(str, 'development')
)

BASE_DIR = Path(__file__).resolve().parent.parent

environ.Env.read_env(os.path.join(BASE_DIR.parent, '.env'))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ENVIRONMENT = env('ENVIRONMENT')

ALLOWED_HOSTS = env('ALLOWED_HOSTS').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'django_extensions',
    
    'apps.accounts',
    'apps.membership',
    'apps.services',
    'apps.bookings',
    'apps.payments',
    'apps.conversion',
    'apps.dashboard',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'carwash.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'carwash.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

CORS_ALLOW_ALL_ORIGINS = DEBUG
if not DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]

CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

SHOW_DEMO_DATA = ENVIRONMENT == 'development'

CELERY_BEAT_SCHEDULE = {
    'batch-send-reminders-every-5-minutes': {
        'task': 'apps.bookings.tasks.batch_send_due_reminders',
        'schedule': timedelta(minutes=5),
    },
    'create-reminders-daily-at-8am': {
        'task': 'apps.bookings.tasks.create_automatic_reminders',
        'schedule': timedelta(hours=24),
    },
    'check-no-show-every-15-minutes': {
        'task': 'apps.bookings.tasks.check_no_show_bookings',
        'schedule': timedelta(minutes=15),
    },
    'auto-confirm-bookings-every-30-minutes': {
        'task': 'apps.bookings.tasks.auto_confirm_bookings',
        'schedule': timedelta(minutes=30),
    },
    'check-pending-payments-every-10-minutes': {
        'task': 'apps.payments.tasks.check_pending_payments',
        'schedule': timedelta(minutes=10),
    },
    'auto-close-shifts-daily-at-midnight': {
        'task': 'apps.payments.tasks.auto_close_shift',
        'schedule': timedelta(hours=24),
    },
    'check-unresolved-discrepancies-daily': {
        'task': 'apps.payments.tasks.check_unresolved_discrepancies',
        'schedule': timedelta(hours=12),
    },
    'generate-daily-report-every-night': {
        'task': 'apps.conversion.tasks.generate_daily_report',
        'schedule': timedelta(hours=24),
    },
    'generate-weekly-report-every-monday': {
        'task': 'apps.conversion.tasks.generate_weekly_report',
        'schedule': timedelta(days=7),
    },
    'generate-monthly-report-every-month': {
        'task': 'apps.conversion.tasks.generate_monthly_report',
        'schedule': timedelta(days=30),
    },
    'update-store-performance-daily': {
        'task': 'apps.conversion.tasks.update_store_performance',
        'schedule': timedelta(hours=24),
    },
    'check-conversion-reminders-every-10-minutes': {
        'task': 'apps.conversion.tasks.check_pending_conversion_reminders',
        'schedule': timedelta(minutes=10),
    },
    'create-follow-up-reminders-daily': {
        'task': 'apps.conversion.tasks.create_follow_up_reminders',
        'schedule': timedelta(hours=24),
    },
    'check-expiring-memberships-daily': {
        'task': 'apps.conversion.tasks.check_expiring_memberships',
        'schedule': timedelta(days=1),
    },
}
