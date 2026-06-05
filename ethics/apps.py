from django.apps import AppConfig


class EthicsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ethics'
    verbose_name = '伦理审查管理'

    def ready(self):
        import ethics.signals  # noqa: F401
