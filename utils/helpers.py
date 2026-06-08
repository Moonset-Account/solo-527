import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from config import MIN_SAMPLE_SIZE, BAYESIAN_PRIOR_SCORE, BAYESIAN_PRIOR_WEIGHT


def bayesian_score(n, avg_score, prior_weight=BAYESIAN_PRIOR_WEIGHT, prior_score=BAYESIAN_PRIOR_SCORE):
    if n is None or n == 0:
        return prior_score
    return round((n * avg_score + prior_weight * prior_score) / (n + prior_weight), 3)


def is_sample_sufficient(count, threshold=MIN_SAMPLE_SIZE):
    return count is not None and count >= threshold


def format_pct(value, decimals=1):
    if value is None:
        return "N/A"
    return f"{value:.{decimals}f}%"


def format_currency(value, decimals=2):
    if value is None:
        return "N/A"
    return f"¥{value:,.{decimals}f}"


def severity_color(severity):
    return {"critical": "#e74c3c", "warning": "#f39c12", "info": "#3498db"}.get(severity, "#95a5a6")


def score_to_color(score, scale=5):
    ratio = max(0, min(1, score / scale))
    if ratio >= 0.7:
        return "#27ae60"
    elif ratio >= 0.5:
        return "#f39c12"
    else:
        return "#e74c3c"


def cost_range_label(cost_price):
    if cost_price < 4:
        return "低价 (0-4元)"
    elif cost_price < 7:
        return "中价 (4-7元)"
    else:
        return "高价 (7元+)"


COST_RANGES = [
    {"label": "低价 (0-4元)", "min": 0, "max": 4},
    {"label": "中价 (4-7元)", "min": 4, "max": 7},
    {"label": "高价 (7元+)", "min": 7, "max": 999},
]
