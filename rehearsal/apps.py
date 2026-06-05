from django.apps import AppConfig


class RehearsalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rehearsal'
    verbose_name = '排练室排期管理'

    def ready(self):
        import rehearsal.signals
