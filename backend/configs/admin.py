from django.contrib import admin
from .models import InvoiceConfig, PrepaidConfig, CashForecastConfig, ConfigChangelog

admin.site.register(InvoiceConfig)
admin.site.register(PrepaidConfig)
admin.site.register(CashForecastConfig)
admin.site.register(ConfigChangelog)
