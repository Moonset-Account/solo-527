from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time
import logging

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path

        logger.info(f"Request started: {method} {path} from {client_ip}")

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000
        status_code = response.status_code

        logger.info(
            f"Request completed: {method} {path} "
            f"Status: {status_code} Duration: {process_time:.2f}ms"
        )

        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response
