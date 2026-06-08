from api.cache import cached
from api.aggregation import (
    get_anomaly_summary,
    get_satisfaction_matrix,
    get_sales_trend,
    get_cancel_reasons,
    get_cost_margin,
    get_weather_correlation,
)


@cached(ttl=300)
def cached_anomaly_summary(filters=None):
    return get_anomaly_summary(filters)


@cached(ttl=300)
def cached_satisfaction_matrix(filters=None):
    return get_satisfaction_matrix(filters)


@cached(ttl=300)
def cached_sales_trend(filters=None):
    return get_sales_trend(filters)


@cached(ttl=300)
def cached_cancel_reasons(filters=None):
    return get_cancel_reasons(filters)


@cached(ttl=300)
def cached_cost_margin(filters=None):
    return get_cost_margin(filters)


@cached(ttl=300)
def cached_weather_correlation(filters=None):
    return get_weather_correlation(filters)
