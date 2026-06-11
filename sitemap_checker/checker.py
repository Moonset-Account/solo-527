from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime
from typing import Callable, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from .config import CheckerConfig, RuntimeState
from .fetcher import AsyncFetcher, FetchError, FetchResult
from .models import (
    CheckResult,
    FixPlan,
    FixSuggestion,
    Issue,
    LinkReference,
    LinkType,
    PageMeta,
    ScanReport,
)
from .parser import classify_link, normalize_url, parse_html, parse_sitemap


ProgressCallback = Callable[[str, int, int], None]


def _check_status_and_redirects(
    url: str,
    fetch: FetchResult,
    config: CheckerConfig,
) -> List[Issue]:
    issues: List[Issue] = []
    chain = fetch.redirect_chain
    seen_redirects: set = set()
    has_loop = False
    for step in chain:
        if step.url in seen_redirects:
            has_loop = True
            break
        seen_redirects.add(step.url)

    if has_loop:
        issues.append(Issue.redirect_loop(url))

    if len(chain) > config.max_redirects:
        issues.append(Issue.redirect_chain(url, chain, config.max_redirects))

    status = fetch.status_code
    if status == 0:
        pass
    elif status == 404:
        issues.append(Issue.not_found(url))
    elif status == 410:
        issues.append(Issue.not_found(url))
    elif 500 <= status < 600:
        issues.append(Issue.server_error(url, status))

    return issues


def _check_page_meta(
    url: str,
    page_meta: PageMeta,
    config: CheckerConfig,
) -> List[Issue]:
    issues: List[Issue] = []
    if not config.check_title and not config.check_canonical:
        return issues

    if config.check_title:
        if page_meta.title is None:
            issues.append(Issue.title_missing(url))
        elif not page_meta.title.strip():
            issues.append(Issue.title_empty(url))

    if config.check_canonical:
        if page_meta.canonical is None:
            issues.append(Issue.canonical_missing(url))
        else:
            normalized_canonical = normalize_url(page_meta.canonical)
            normalized_actual = normalize_url(page_meta.final_url or url)
            if normalized_canonical != normalized_actual:
                issues.append(Issue.canonical_conflict(
                    url,
                    page_meta.canonical,
                    page_meta.final_url or url,
                ))

    return issues


def _build_fix_plan(
    results: List[CheckResult],
    state: RuntimeState,
) -> FixPlan:
    internal: List[FixSuggestion] = []
    external: List[FixSuggestion] = []
    images: List[FixSuggestion] = []

    internal_404 = [r for r in results if r.link_type == LinkType.INTERNAL and any(
        i.issue_type.value == "not_found_404" for i in r.issues
    )]
    external_404 = [r for r in results if r.link_type == LinkType.EXTERNAL and any(
        i.issue_type.value == "not_found_404" for i in r.issues
    )]
    image_404 = [r for r in results if r.link_type == LinkType.IMAGE and any(
        i.issue_type.value == "not_found_404" for i in r.issues
    )]

    redirects = [r for r in results if any(i.issue_type.value in ("redirect_chain", "redirect_loop") for i in r.issues)]

    for r in internal_404:
        internal.append(FixSuggestion(
            action="REMOVE_OR_UPDATE",
            from_url=r.url,
            to_url=None,
            reason="内部链接返回 404，请检查目标页面是否存在或已迁移",
            confidence=0.95,
        ))

    for r in external_404:
        external.append(FixSuggestion(
            action="REVIEW_REMOVE",
            from_url=r.url,
            to_url=None,
            reason="外部链接返回 404，需人工确认是否存在可用替代地址或直接移除",
            confidence=0.7,
        ))

    for r in image_404:
        images.append(FixSuggestion(
            action="REPLACE_OR_REMOVE",
            from_url=r.url,
            to_url=None,
            reason="图片资源返回 404，请检查路径或重新上传图片",
            confidence=0.9,
        ))

    for r in redirects:
        if r.page_meta and r.page_meta.final_url and r.page_meta.final_url != r.url:
            suggestion = FixSuggestion(
                action="UPDATE_TO_FINAL",
                from_url=r.url,
                to_url=r.page_meta.final_url,
                reason=f"重定向链过长，建议直接使用最终地址 {r.page_meta.final_url}",
                confidence=0.85,
            )
            if r.link_type == LinkType.INTERNAL:
                internal.append(suggestion)
            elif r.link_type == LinkType.IMAGE:
                images.append(suggestion)
            else:
                external.append(suggestion)

    return FixPlan(
        internal_links=internal,
        external_links=external,
        images=images,
        requires_confirmation=True,
    )


class SitemapChecker:
    def __init__(self, config: CheckerConfig, state: RuntimeState):
        self.config = config
        self.state = state
        self.results: List[CheckResult] = []
        self.results_by_url: Dict[str, CheckResult] = {}
        self.link_sources: Dict[str, List[str]] = defaultdict(list)

    def _track_link(self, ref: LinkReference) -> None:
        if ref.source_url:
            self.link_sources[ref.url].append(ref.source_url)

    async def scan(
        self,
        sitemap_urls: List[str],
        *,
        progress_cb: Optional[ProgressCallback] = None,
    ) -> ScanReport:
        started = datetime.utcnow()
        report = ScanReport(
            started_at=started,
            base_domain=self.state.base_domain,
            config_summary=self.config.to_summary_dict(),
        )

        seed_urls: List[str] = list(dict.fromkeys(
            list(sitemap_urls) + list(self.state.sitemap_urls) + list(self.state.exported_pages)
        ))
        normalized_seeds = [normalize_url(u) for u in seed_urls]

        to_check_pages: List[Tuple[str, int]] = [(u, 0) for u in normalized_seeds]
        checked_pages: set = set()
        discovered_links: Dict[str, LinkType] = {}

        async with AsyncFetcher(self.config) as fetcher:
            current_batch = to_check_pages
            depth = 0
            while current_batch and depth <= self.config.max_depth:
                batch_urls = [u for u, d in current_batch if u not in checked_pages]
                batch_urls = list(dict.fromkeys(batch_urls))
                if not batch_urls:
                    break

                total = len(batch_urls)
                done = 0

                def _progress(d: int, t: int) -> None:
                    if progress_cb:
                        progress_cb(f"深度 {depth}/{self.config.max_depth}", d, t)

                fetch_tasks = []
                for url in batch_urls:
                    link_type = classify_link(url, self.state.base_domain)
                    is_internal = link_type == LinkType.INTERNAL
                    use_head = not is_internal or (not self.config.check_title and not self.config.check_canonical)
                    fetch_tasks.append((url, use_head))

                results_map: Dict[str, Tuple[Optional[FetchResult], Optional[FetchError]]] = {}

                async def _process_one(url: str, use_head: bool):
                    nonlocal done
                    try:
                        res = await fetcher.fetch(url, use_head=use_head)
                        results_map[url] = (res, None)
                    except FetchError as e:
                        results_map[url] = (None, e)
                    done += 1
                    if progress_cb:
                        progress_cb(f"深度 {depth}/{self.config.max_depth}", done, total)

                tasks = [_process_one(u, uh) for u, uh in fetch_tasks]
                await asyncio.gather(*tasks, return_exceptions=False)

                for url in batch_urls:
                    checked_pages.add(url)
                    link_type = classify_link(url, self.state.base_domain)
                    fetch_result, fetch_error = results_map.get(url, (None, None))

                    is_whitelisted = self.state.is_whitelisted(url)

                    check_result = CheckResult(
                        url=url,
                        link_type=link_type,
                        is_whitelisted=is_whitelisted,
                        depth=depth,
                    )

                    if is_whitelisted:
                        self.results.append(check_result)
                        self.results_by_url[url] = check_result
                        continue

                    if fetch_error:
                        check_result.issues.append(fetch_error.issue)
                        self.results.append(check_result)
                        self.results_by_url[url] = check_result
                        continue

                    if fetch_result is None:
                        self.results.append(check_result)
                        self.results_by_url[url] = check_result
                        continue

                    page_meta = PageMeta(
                        url=url,
                        status_code=fetch_result.status_code,
                        final_url=fetch_result.final_url,
                        redirect_chain=fetch_result.redirect_chain,
                        content_type=fetch_result.content_type,
                        response_time_ms=fetch_result.response_time_ms,
                    )

                    issues = _check_status_and_redirects(url, fetch_result, self.config)

                    is_html = fetch_result.content and fetch_result.content_type and (
                        "text/html" in fetch_result.content_type.lower()
                        or "application/xhtml" in fetch_result.content_type.lower()
                    )

                    links_for_next: List[LinkReference] = []
                    if is_html and not fetch_result.used_head:
                        try:
                            parsed_meta, links = parse_html(
                                fetch_result.content,
                                fetch_result.final_url or url,
                                self.state.base_domain,
                                check_images=self.config.check_images,
                            )
                            page_meta.title = parsed_meta.title
                            page_meta.canonical = parsed_meta.canonical
                            page_meta.url = url
                            for link in links:
                                self._track_link(link)
                                discovered_links[link.url] = link.link_type
                                if link.link_type in (LinkType.INTERNAL, LinkType.IMAGE) and depth < self.config.max_depth:
                                    links_for_next.append(link)
                        except Exception as e:
                            issues.append(Issue.network_error(url, f"HTML 解析失败: {e}"))

                    meta_issues = _check_page_meta(url, page_meta, self.config)
                    issues.extend(meta_issues)

                    check_result.page_meta = page_meta
                    check_result.issues = issues

                    self.results.append(check_result)
                    self.results_by_url[url] = check_result

                next_batch: List[Tuple[str, int]] = []
                next_depth = depth + 1
                if next_depth <= self.config.max_depth:
                    seen = set(u for u, _ in current_batch)
                    for link in links_for_next:
                        nurl = normalize_url(link.url)
                        if nurl not in seen and nurl not in checked_pages:
                            next_batch.append((nurl, next_depth))
                            seen.add(nurl)

                current_batch = next_batch
                depth += 1

            external_links_to_check: List[str] = [
                url for url, ltype in discovered_links.items()
                if ltype == LinkType.EXTERNAL and self.config.follow_external and url not in self.results_by_url
            ]
            if external_links_to_check:
                total_ext = len(external_links_to_check)
                done_ext = 0

                def _progress_ext(d: int, t: int) -> None:
                    if progress_cb:
                        progress_cb("检查外部链接", d, t)

                async def _check_ext(url: str):
                    nonlocal done_ext
                    try:
                        res = await fetcher.fetch(url, use_head=True)
                        done_ext += 1
                        if progress_cb:
                            progress_cb("检查外部链接", done_ext, total_ext)
                        return (url, res, None)
                    except FetchError as e:
                        done_ext += 1
                        if progress_cb:
                            progress_cb("检查外部链接", done_ext, total_ext)
                        return (url, None, e)

                ext_results = await asyncio.gather(
                    *[_check_ext(u) for u in external_links_to_check],
                    return_exceptions=False,
                )

                for url, fetch_result, fetch_error in ext_results:
                    link_type = LinkType.EXTERNAL
                    is_whitelisted = self.state.is_whitelisted(url)
                    check_result = CheckResult(
                        url=url,
                        link_type=link_type,
                        is_whitelisted=is_whitelisted,
                        depth=0,
                    )
                    if is_whitelisted:
                        self.results.append(check_result)
                        self.results_by_url[url] = check_result
                        continue

                    if fetch_error:
                        check_result.issues.append(fetch_error.issue)
                        self.results.append(check_result)
                        self.results_by_url[url] = check_result
                        continue

                    if fetch_result is None:
                        self.results.append(check_result)
                        self.results_by_url[url] = check_result
                        continue

                    page_meta = PageMeta(
                        url=url,
                        status_code=fetch_result.status_code,
                        final_url=fetch_result.final_url,
                        redirect_chain=fetch_result.redirect_chain,
                        content_type=fetch_result.content_type,
                        response_time_ms=fetch_result.response_time_ms,
                    )
                    issues = _check_status_and_redirects(url, fetch_result, self.config)
                    check_result.page_meta = page_meta
                    check_result.issues = issues
                    self.results.append(check_result)
                    self.results_by_url[url] = check_result

        report.results = self.results
        report.pages_checked = sum(1 for r in self.results if r.link_type in (LinkType.INTERNAL, LinkType.SITEMAP))
        report.links_checked = len(self.results)
        report.total_pages = report.pages_checked
        report.total_links = report.links_checked
        report.fix_plan = _build_fix_plan(self.results, self.state)
        report.finished_at = datetime.utcnow()

        return report
