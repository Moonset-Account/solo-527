from pathlib import Path
import pytest

from sitemap_checker.models import (
    CheckResult,
    FixPlan,
    FixSuggestion,
    Issue,
    IssueType,
    LinkType,
    PageMeta,
    RedirectStep,
    ScanReport,
    Severity,
)
from sitemap_checker.parser import (
    classify_link,
    is_image_url,
    normalize_url,
    parse_html,
    parse_sitemap,
)


def test_issue_not_found():
    issue = Issue.not_found("https://example.com/broken")
    assert issue.issue_type == IssueType.NOT_FOUND_404
    assert issue.severity == Severity.CRITICAL
    assert "404" in issue.message


def test_issue_network_error_needs_review():
    issue = Issue.network_error("https://example.com", "connection refused")
    assert issue.details.get("needs_manual_review") is True


def test_issue_timeout_needs_review():
    issue = Issue.timeout("https://example.com", 15.0)
    assert issue.details.get("needs_manual_review") is True


def test_check_result_is_ok():
    ok = CheckResult(url="https://example.com", link_type=LinkType.INTERNAL)
    assert ok.is_ok is True

    bad = CheckResult(
        url="https://example.com",
        link_type=LinkType.INTERNAL,
        issues=[Issue.not_found("https://example.com")],
    )
    assert bad.is_ok is False


def test_normalize_url_strips_fragment():
    result = normalize_url("https://example.com/page#section")
    assert "#" not in result


def test_normalize_url_lowercase_host():
    result = normalize_url("HTTPS://Example.COM/Page")
    assert result.startswith("https://example.com/")


def test_normalize_url_with_base():
    result = normalize_url("/about", "https://example.com/products")
    assert result == "https://example.com/about"


def test_is_image_url():
    assert is_image_url("https://example.com/logo.png")
    assert is_image_url("https://example.com/photos/pic.JPG")
    assert not is_image_url("https://example.com/page.html")


def test_classify_link_internal():
    assert classify_link("https://example.com/page", "example.com") == LinkType.INTERNAL
    assert classify_link("/page", "example.com") == LinkType.INTERNAL
    assert classify_link("https://sub.example.com/page", "example.com") == LinkType.INTERNAL


def test_classify_link_external():
    assert classify_link("https://other.com/page", "example.com") == LinkType.EXTERNAL


def test_classify_link_image():
    assert classify_link("https://example.com/img.png", "example.com") == LinkType.IMAGE


def test_classify_link_sitemap():
    assert classify_link("https://example.com/sitemap.xml", "example.com") == LinkType.SITEMAP


def test_parse_sitemap_basic():
    xml = """<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://example.com/a</loc></url>
      <url><loc>https://example.com/b</loc></url>
    </urlset>"""
    urls = parse_sitemap(xml, "https://example.com")
    assert "https://example.com/a" in urls
    assert "https://example.com/b" in urls


def test_parse_html_extracts_title_canonical_links():
    html = """<html>
    <head>
        <title>Test Page</title>
        <link rel="canonical" href="https://example.com/canonical">
    </head>
    <body>
        <a href="/about">About Us</a>
        <a href="https://other.com/external">External</a>
        <img src="/img/logo.png" alt="Logo">
    </body></html>"""
    meta, links = parse_html(html, "https://example.com/page", "example.com")
    assert meta.title == "Test Page"
    assert meta.canonical == "https://example.com/canonical"
    link_urls = {l.url for l in links}
    assert "https://example.com/about" in link_urls
    assert "https://other.com/external" in link_urls
    assert "https://example.com/img/logo.png" in link_urls
    types = {l.link_type for l in links}
    assert LinkType.INTERNAL in types
    assert LinkType.EXTERNAL in types
    assert LinkType.IMAGE in types


def test_scan_report_critical_issues():
    report = ScanReport(started_at=__import__("datetime").datetime.utcnow())
    report.results.append(CheckResult(
        url="https://example.com/broken",
        link_type=LinkType.INTERNAL,
        issues=[Issue.not_found("https://example.com/broken")],
    ))
    report.results.append(CheckResult(
        url="https://example.com/ok",
        link_type=LinkType.INTERNAL,
    ))
    assert len(report.get_critical_issues()) == 1
    assert len(report.get_warning_issues()) == 0


def test_fix_plan_separates_internal_external_images():
    plan = FixPlan(
        internal_links=[FixSuggestion(action="UPDATE", from_url="/old", to_url="/new", reason="moved", confidence=0.9)],
        external_links=[FixSuggestion(action="REMOVE", from_url="https://dead.com", to_url=None, reason="404", confidence=0.7)],
        images=[FixSuggestion(action="REPLACE", from_url="/img/x.png", to_url="/img/y.png", reason="404", confidence=0.85)],
    )
    assert len(plan.internal_links) == 1
    assert len(plan.external_links) == 1
    assert len(plan.images) == 1
    assert plan.requires_confirmation is True
