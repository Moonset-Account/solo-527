from fastapi.templating import Jinja2Templates


def _format_date(value):
    if not value:
        return '-'
    return value.strftime('%Y-%m-%d %H:%M') if hasattr(value, 'strftime') else str(value)[:16]


def _format_date_short(value):
    if not value:
        return '-'
    return value.strftime('%Y-%m-%d') if hasattr(value, 'strftime') else str(value)[:10]


def _format_money(value):
    if value is None:
        return '0.00'
    return f"{float(value):.2f}"


templates = Jinja2Templates(directory="app/templates")
templates.env.filters["format_date"] = _format_date
templates.env.filters["format_date_short"] = _format_date_short
templates.env.filters["format_money"] = _format_money
templates.env.globals["format_date"] = _format_date
templates.env.globals["format_date_short"] = _format_date_short
templates.env.globals["format_money"] = _format_money
