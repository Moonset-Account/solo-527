from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'invoice-config', views.InvoiceConfigView, basename='invoice-config')
router.register(r'prepaid-config', views.PrepaidConfigView, basename='prepaid-config')
router.register(r'cash-forecast-config', views.CashForecastConfigView, basename='cash-forecast-config')
router.register(r'config-changelog', views.ConfigChangelogView, basename='config-changelog')

urlpatterns = router.urls
