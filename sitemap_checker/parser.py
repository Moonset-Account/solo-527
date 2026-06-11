from __future__ import annotations

import mimetypes
from typing import List, Optional, Tuple
from urllib.parse import ParseResult, urljoin, urlparse, urlunparse
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup
from url_normalize import url_normalize

from .models import LinkReference, LinkType, PageMeta, RedirectStep


SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff", ".avif"}
ASSET_EXTENSIONS = {".css", ".js", ".json", ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".eot"}


def normalize_url(url: str, base: Optional[str] = None) -> str:
    if base:
        url = urljoin(base, url)
    try:
        normalized = url_normalize(url)
    except Exception:
        normalized = url
    parsed = urlparse(normalized)
    cleaned = ParseResult(
        scheme=parsed.scheme.lower() if parsed.scheme else "",
        netloc=parsed.netloc.lower(),
        path=parsed.path,
        params=parsed.params,
        query=parsed.query,
        fragment="",
    )
    return urlunparse(cleaned)


def is_image_url(url: str) -> bool:
    parsed = urlparse(url)
    path_lower = parsed.path.lower()
    for ext in IMAGE_EXTENSIONS:
        if path_lower.endswith(ext):
            return True
    return False


def is_asset_url(url: str) -> bool:
    parsed = urlparse(url)
    path_lower = parsed.path.lower()
    for ext in ASSET_EXTENSIONS:
        if path_lower.endswith(ext):
            return True
    mime, _ = mimetypes.guess_type(parsed.path)
    if mime:
        return not (mime.startswith("text/html") or mime.startswith("application/xhtml"))
    return False


def classify_link(url: str, base_domain: Optional[str]) -> LinkType:
    parsed = urlparse(url)
    if parsed.path.endswith(".xml") or parsed.path.endswith(".xml.gz") or "sitemap" in parsed.path.lower():
        return LinkType.SITEMAP
    if is_image_url(url):
        return LinkType.IMAGE
    if is_asset_url(url):
        return LinkType.ASSET
    if base_domain and (parsed.netloc == base_domain or parsed.netloc.endswith("." + base_domain)):
        return LinkType.INTERNAL
    if not parsed.netloc:
        return LinkType.INTERNAL
    return LinkType.EXTERNAL


def parse_sitemap(xml_content: str, base_url: str) -> List[str]:
    urls: List[str] = []
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError:
        return urls

    local_ns = ""
    if root.tag.startswith("{"):
        end = root.tag.find("}")
        if end > 0:
            local_ns = root.tag[1:end]

    ns = {}
    if local_ns:
        ns["sm"] = local_ns

    url_tags = ["url", "sitemap"]
    for tag in url_tags:
        search = f".//sm:{tag}/sm:loc" if ns else f".//{tag}/loc"
        for loc in root.findall(search, ns):
            if loc.text and loc.text.strip():
                urls.append(urljoin(base_url, loc.text.strip()))

    if not urls:
        for loc in root.iter():
            if loc.tag.endswith("loc") and loc.text and loc.text.strip():
                urls.append(urljoin(base_url, loc.text.strip()))

    return list(dict.fromkeys(urls))


def parse_html(
    html_content: str,
    page_url: str,
    base_domain: Optional[str],
    *,
    check_images: bool = True,
) -> Tuple[PageMeta, List[LinkReference]]:
    soup = BeautifulSoup(html_content, "lxml")

    title_tag = soup.find("title")
    title: Optional[str] = None
    if title_tag and title_tag.string:
        title = title_tag.string.strip()

    canonical: Optional[str] = None
    canonical_tag = soup.find("link", attrs={"rel": "canonical"})
    if canonical_tag and canonical_tag.get("href"):
        canonical = urljoin(page_url, canonical_tag["href"].strip())

    page_meta = PageMeta(
        url=page_url,
        title=title,
        canonical=canonical,
    )

    links: List[LinkReference] = []
    seen: set = set()

    for a_tag in soup.find_all("a", href=True):
        href = a_tag.get("href", "").strip()
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:", "ftp:")):
            continue
        try:
            full_url = normalize_url(href, page_url)
        except Exception:
            continue
        if full_url in seen:
            continue
        seen.add(full_url)
        link_type = classify_link(full_url, base_domain)
        anchor_text = a_tag.get_text(strip=True) or None
        links.append(LinkReference(
            url=full_url,
            anchor_text=anchor_text,
            link_type=link_type,
            source_url=page_url,
            raw_html=str(a_tag),
        ))

    if check_images:
        for img_tag in soup.find_all("img", src=True):
            src = img_tag.get("src", "").strip()
            if not src or src.startswith(("data:", "javascript:")):
                continue
            try:
                full_url = normalize_url(src, page_url)
            except Exception:
                continue
            if full_url in seen:
                continue
            seen.add(full_url)
            alt = img_tag.get("alt")
            links.append(LinkReference(
                url=full_url,
                anchor_text=alt if alt else None,
                link_type=LinkType.IMAGE,
                source_url=page_url,
                raw_html=str(img_tag),
            ))

    return page_meta, links
