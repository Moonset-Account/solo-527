from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Callable, List, Optional, Tuple

import aiometer
import httpx
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from .config import CheckerConfig
from .models import Issue, RedirectStep


class FetchError(Exception):
    def __init__(self, issue: Issue):
        self.issue = issue
        super().__init__(issue.message)


@dataclass
class FetchResult:
    url: str
    final_url: str
    status_code: int
    content: Optional[str]
    headers: dict
    redirect_chain: List[RedirectStep]
    content_type: Optional[str]
    response_time_ms: float
    used_head: bool = False


class RateLimiter:
    def __init__(self, max_per_second: int):
        self.max_per_second = max_per_second
        self._tokens = max_per_second
        self._last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_refill
            self._tokens = min(
                self.max_per_second,
                self._tokens + elapsed * self.max_per_second,
            )
            self._last_refill = now
            while self._tokens < 1:
                await asyncio.sleep(1.0 / self.max_per_second)
                now = time.monotonic()
                elapsed = now - self._last_refill
                self._tokens = min(
                    self.max_per_second,
                    self._tokens + elapsed * self.max_per_second,
                )
                self._last_refill = now
            self._tokens -= 1


class AsyncFetcher:
    def __init__(self, config: CheckerConfig):
        self.config = config
        self.rate_limiter = RateLimiter(config.rate_limit_per_second)
        self._client: Optional[httpx.AsyncClient] = None
        self._semaphore = asyncio.Semaphore(config.max_concurrent)

    async def __aenter__(self) -> "AsyncFetcher":
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.config.request_timeout),
            verify=self.config.verify_ssl,
            follow_redirects=False,
            headers={"User-Agent": self.config.user_agent},
        )
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def fetch(
        self,
        url: str,
        *,
        use_head: bool = False,
        allow_partial: bool = False,
    ) -> FetchResult:
        assert self._client is not None, "Fetcher not initialized"

        async with self._semaphore:
            return await self._do_fetch(url, use_head=use_head, allow_partial=allow_partial)

    async def _do_fetch(
        self,
        url: str,
        *,
        use_head: bool = False,
        allow_partial: bool = False,
    ) -> FetchResult:
        assert self._client is not None
        start = time.monotonic()
        method = "HEAD" if use_head else "GET"

        redirect_chain: List[RedirectStep] = []
        current_url = url
        max_hops = self.config.max_redirects + 2
        response = None

        for _hop in range(max_hops):
            await self.rate_limiter.acquire()
            try:
                async for _ in AsyncRetrying(
                    stop=stop_after_attempt(max(1, self.config.retries + 1)),
                    wait=wait_exponential(multiplier=self.config.retry_backoff, min=0.5, max=10),
                    retry=retry_if_exception_type((
                        httpx.ConnectTimeout,
                        httpx.ReadTimeout,
                        httpx.WriteTimeout,
                        httpx.PoolTimeout,
                        ConnectionError,
                    )),
                    reraise=True,
                ):
                    response = await self._client.request(
                        method,
                        current_url,
                        follow_redirects=False,
                    )
            except httpx.ConnectTimeout as e:
                raise FetchError(Issue.timeout(url, self.config.request_timeout)) from e
            except httpx.ReadTimeout as e:
                raise FetchError(Issue.timeout(url, self.config.request_timeout)) from e
            except httpx.SSLError as e:
                raise FetchError(Issue.ssl_error(url, str(e))) from e
            except httpx.ConnectError as e:
                msg = str(e).lower()
                if "dns" in msg or "name or service not known" in msg or "nodename" in msg:
                    raise FetchError(Issue.dns_error(url)) from e
                raise FetchError(Issue.network_error(url, str(e))) from e
            except (httpx.RemoteProtocolError, httpx.DecodingError, ConnectionError) as e:
                raise FetchError(Issue.network_error(url, str(e))) from e
            except httpx.HTTPError as e:
                raise FetchError(Issue.network_error(url, str(e))) from e

            status_code = response.status_code

            if 300 <= status_code < 400 and status_code != 304:
                redirect_to = response.headers.get("location")
                redirect_chain.append(RedirectStep(
                    url=current_url,
                    status_code=status_code,
                    redirect_to=redirect_to,
                ))
                if redirect_to:
                    from urllib.parse import urljoin
                    current_url = urljoin(current_url, redirect_to)
                    continue
            break

        if response is None:
            elapsed_ms = (time.monotonic() - start) * 1000
            return FetchResult(
                url=url,
                final_url=current_url,
                status_code=0,
                content=None,
                headers={},
                redirect_chain=redirect_chain,
                content_type=None,
                response_time_ms=elapsed_ms,
                used_head=use_head,
            )

        status_code = response.status_code
        headers = dict(response.headers)
        content_type = response.headers.get("content-type")

        content: Optional[str] = None
        if not use_head and status_code != 304:
            try:
                if content_type and ("text" in content_type or "html" in content_type or "xml" in content_type):
                    content = response.text
            except Exception:
                content = None

        elapsed_ms = (time.monotonic() - start) * 1000
        return FetchResult(
            url=url,
            final_url=current_url,
            status_code=status_code,
            content=content,
            headers=headers,
            redirect_chain=redirect_chain,
            content_type=content_type,
            response_time_ms=elapsed_ms,
            used_head=use_head,
        )

    async def fetch_many(
        self,
        urls: List[str],
        *,
        use_head: bool = False,
        progress_cb: Optional[Callable[[int, int], None]] = None,
    ) -> List[Tuple[str, Optional[FetchResult], Optional[FetchError]]]:
        results: List[Tuple[str, Optional[FetchResult], Optional[FetchError]]] = []
        total = len(urls)
        done_count = 0
        lock = asyncio.Lock()

        async def _fetch_one(url: str) -> Tuple[str, Optional[FetchResult], Optional[FetchError]]:
            nonlocal done_count
            try:
                result = await self.fetch(url, use_head=use_head)
                return (url, result, None)
            except FetchError as e:
                return (url, None, e)
            except Exception as e:
                return (url, None, FetchError(Issue.network_error(url, str(e))))
            finally:
                if progress_cb:
                    async with lock:
                        done_count += 1
                        progress_cb(done_count, total)

        async with aiometer.amap(
            _fetch_one,
            urls,
            max_at_once=self.config.max_concurrent,
            max_per_second=self.config.rate_limit_per_second,
        ) as streamed:
            async for item in streamed:
                results.append(item)

        return results
