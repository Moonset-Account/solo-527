from fastapi import Request
from typing import Optional


def is_htmx(request: Request) -> bool:
    return request.headers.get("HX-Request", "").lower() == "true"


def htmx_trigger(request: Request) -> Optional[str]:
    return request.headers.get("HX-Trigger")


def htmx_target(request: Request) -> Optional[str]:
    return request.headers.get("HX-Target")


def get_page(request: Request) -> int:
    try:
        return int(request.query_params.get("page", 1))
    except (ValueError, TypeError):
        return 1
