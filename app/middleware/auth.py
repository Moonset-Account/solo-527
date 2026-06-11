from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse
from fastapi import status
import re


class AuthMiddleware(BaseHTTPMiddleware):
    EXCLUDED_PATHS = [
        r"^/$",
        r"^/login$",
        r"^/api/login$",
        r"^/static/.*$",
        r"^/favicon.ico$",
        r"^/docs$",
        r"^/openapi.json$",
        r"^/redoc$"
    ]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        for pattern in self.EXCLUDED_PATHS:
            if re.match(pattern, path):
                return await call_next(request)

        token = request.cookies.get("access_token")

        if not token:
            if request.headers.get("HX-Request"):
                response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
                response.headers["HX-Redirect"] = "/"
                return response
            return RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)

        try:
            from app.utils.security import decode_token
            token = token.replace("Bearer ", "")
            decode_token(token)
        except Exception:
            if request.headers.get("HX-Request"):
                response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
                response.headers["HX-Redirect"] = "/"
                return response
            return RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)

        return await call_next(request)
