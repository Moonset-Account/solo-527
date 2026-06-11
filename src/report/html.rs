use super::ReportGenerator;
use crate::config::AuditConfig;
use crate::models::{RiskLevel, ScanResult};
use anyhow::Result;

pub struct HtmlReport;

impl ReportGenerator for HtmlReport {
    fn generate(&self, result: &ScanResult, config: &AuditConfig) -> Result<String> {
        let html = format!(
            r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>依赖许可证审计报告</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            padding: 24px;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        h1 {{ font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }}
        h2 {{ font-size: 20px; font-weight: 600; margin: 24px 0 16px; color: #1e293b; }}
        .subtitle {{ color: #64748b; margin-bottom: 32px; }}
        .summary-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }}
        .summary-card {{
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #3b82f6;
        }}
        .summary-card.critical {{ border-left-color: #ef4444; }}
        .summary-card.high {{ border-left-color: #f97316; }}
        .summary-card.medium {{ border-left-color: #eab308; }}
        .summary-card.warning {{ border-left-color: #6b7280; }}
        .summary-value {{ font-size: 32px; font-weight: 700; color: #0f172a; }}
        .summary-label {{ font-size: 14px; color: #64748b; margin-top: 4px; }}
        .section {{
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 24px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }}
        th, td {{
            text-align: left;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
        }}
        th {{
            background: #f1f5f9;
            font-weight: 600;
            color: #475569;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        tr:hover {{ background: #f8fafc; }}
        .risk-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
        }}
        .risk-low {{ background: #22c55e; }}
        .risk-medium {{ background: #eab308; color: #713f12; }}
        .risk-high {{ background: #f97316; }}
        .risk-critical {{ background: #ef4444; }}
        .risk-unknown {{ background: #6b7280; }}
        .pm-badge {{
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            background: #e0e7ff;
            color: #3730a3;
        }}
        .review-item {{
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
        }}
        .review-item h3 {{
            font-size: 14px;
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 4px;
        }}
        .review-item p {{
            font-size: 13px;
            color: #7f1d1d;
        }}
        .config-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }}
        .config-tag {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
        }}
        .tag-allow {{ background: #dcfce7; color: #166534; }}
        .tag-deny {{ background: #fee2e2; color: #991b1b; }}
        .tag-trusted {{ background: #dbeafe; color: #1e40af; }}
        footer {{
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }}
        a {{ color: #3b82f6; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        .tabs {{
            display: flex;
            gap: 4px;
            margin-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
        }}
        .tab {{
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 500;
            color: #64748b;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
        }}
        .tab.active {{
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }}
        .tab-content {{ display: none; }}
        .tab-content.active {{ display: block; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>依赖许可证审计报告</h1>
        <p class="subtitle">扫描了 {} 个项目，发现 {} 个唯一依赖</p>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">{}</div>
                <div class="summary-label">总依赖数</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{}</div>
                <div class="summary-label">唯一依赖</div>
            </div>
            <div class="summary-card critical">
                <div class="summary-value">{}</div>
                <div class="summary-label">严重风险</div>
            </div>
            <div class="summary-card high">
                <div class="summary-value">{}</div>
                <div class="summary-label">高风险</div>
            </div>
            <div class="summary-card warning">
                <div class="summary-value">{}</div>
                <div class="summary-label">未知许可证</div>
            </div>
            <div class="summary-card warning">
                <div class="summary-value">{}</div>
                <div class="summary-label">需人工复核</div>
            </div>
        </div>

        <div class="section">
            <h2>人工复核队列</h2>
            {}
        </div>

        <div class="section">
            <div class="tabs">
                <div class="tab active" onclick="switchTab('all')">全部依赖</div>
                <div class="tab" onclick="switchTab('review')">待复核</div>
                <div class="tab" onclick="switchTab('high')">高/严重风险</div>
            </div>

            <div id="tab-all" class="tab-content active">
                <table>
                    <thead>
                        <tr>
                            <th>包名</th>
                            <th>版本</th>
                            <th>包管理器</th>
                            <th>许可证</th>
                            <th>风险等级</th>
                            <th>来源</th>
                            <th>直接依赖</th>
                        </tr>
                    </thead>
                    <tbody>
                        {}
                    </tbody>
                </table>
            </div>

            <div id="tab-review" class="tab-content">
                <table>
                    <thead>
                        <tr>
                            <th>包名</th>
                            <th>版本</th>
                            <th>许可证</th>
                            <th>风险等级</th>
                            <th>复核原因</th>
                        </tr>
                    </thead>
                    <tbody>
                        {}
                    </tbody>
                </table>
            </div>

            <div id="tab-high" class="tab-content">
                <table>
                    <thead>
                        <tr>
                            <th>包名</th>
                            <th>版本</th>
                            <th>许可证</th>
                            <th>风险等级</th>
                            <th>复核原因</th>
                        </tr>
                    </thead>
                    <tbody>
                        {}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <h2>配置信息</h2>
            <div>
                <strong>白名单（允许）：</strong>
                <div class="config-list">
                    {}
                </div>
            </div>
            <div style="margin-top: 16px;">
                <strong>黑名单（禁止）：</strong>
                <div class="config-list">
                    {}
                </div>
            </div>
            <div style="margin-top: 16px;">
                <strong>可信源：</strong>
                <div class="config-list">
                    {}
                </div>
            </div>
        </div>

        <footer>
            由 license-audit 生成 | 扫描路径：{}
        </footer>
    </div>

    <script>
        function switchTab(tabName) {{
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('tab-' + tabName).classList.add('active');
        }}
    </script>
</body>
</html>"#,
            result.scanned_paths.len(),
            result.unique_count,
            result.total_count,
            result.unique_count,
            result.critical_risk_count,
            result.high_risk_count,
            result.unknown_license_count,
            result.needs_review_count,
            render_review_queue(result),
            render_all_deps_table(result),
            render_review_table(result),
            render_high_risk_table(result),
            render_allow_list(config),
            render_deny_list(config),
            render_trusted_sources(config),
            render_scanned_paths(result),
        );

        Ok(html)
    }

    fn format_name(&self) -> &'static str {
        "html"
    }
}

fn render_review_queue(result: &ScanResult) -> String {
    if result.review_queue.is_empty() {
        return "<p style='color: #22c55e; font-weight: 500;'>✓ 没有需要人工复核的依赖项</p>".to_string();
    }

    result
        .review_queue
        .iter()
        .map(|r| {
            format!(
                r#"<div class="review-item">
                    <h3>{} <span style="font-weight: normal; color: #b91c1c;">v{}</span>
                    <span class="pm-badge" style="margin-left: 8px;">{}</span>
                    </h3>
                    <p>许可证：{} | 风险：{} | 类别：{} | 原因：{}</p>
                </div>"#,
                r.dependency.name,
                r.dependency.version,
                r.dependency.package_manager,
                r.dependency.license,
                r.dependency.risk_level,
                r.category,
                r.reason
            )
        })
        .collect()
}

fn risk_class(level: RiskLevel) -> &'static str {
    match level {
        RiskLevel::Low => "risk-low",
        RiskLevel::Medium => "risk-medium",
        RiskLevel::High => "risk-high",
        RiskLevel::Critical => "risk-critical",
        RiskLevel::Unknown => "risk-unknown",
    }
}

fn render_all_deps_table(result: &ScanResult) -> String {
    result
        .dependencies
        .iter()
        .map(|d| {
            let source_link = match &d.source_url {
                Some(url) => format!("<a href='{}' target='_blank'>{}</a>", url, shorten_url(url)),
                None => "<span style='color: #94a3b8;'>未知</span>".to_string(),
            };

            format!(
                r#"<tr>
                    <td><strong>{}</strong></td>
                    <td>{}</td>
                    <td><span class="pm-badge">{}</span></td>
                    <td>{}</td>
                    <td><span class="risk-badge {}">{}</span></td>
                    <td>{}</td>
                    <td>{}</td>
                </tr>"#,
                d.name,
                d.version,
                d.package_manager,
                d.license,
                risk_class(d.risk_level),
                d.risk_level,
                source_link,
                if d.is_direct { "是" } else { "否" }
            )
        })
        .collect()
}

fn render_review_table(result: &ScanResult) -> String {
    if result.review_queue.is_empty() {
        return "<tr><td colspan='5' style='text-align: center; color: #94a3b8; padding: 32px;'>没有需要复核的依赖</td></tr>".to_string();
    }

    result
        .review_queue
        .iter()
        .map(|r| {
            format!(
                r#"<tr>
                    <td><strong>{}</strong></td>
                    <td>{}</td>
                    <td>{}</td>
                    <td><span class="risk-badge {}">{}</span></td>
                    <td>{}</td>
                </tr>"#,
                r.dependency.name,
                r.dependency.version,
                r.dependency.license,
                risk_class(r.dependency.risk_level),
                r.dependency.risk_level,
                r.reason
            )
        })
        .collect()
}

fn render_high_risk_table(result: &ScanResult) -> String {
    let high_deps: Vec<_> = result
        .dependencies
        .iter()
        .filter(|d| d.risk_level >= RiskLevel::High)
        .collect();

    if high_deps.is_empty() {
        return "<tr><td colspan='5' style='text-align: center; color: #94a3b8; padding: 32px;'>没有高或严重风险的依赖</td></tr>".to_string();
    }

    high_deps
        .iter()
        .map(|d| {
            format!(
                r#"<tr>
                    <td><strong>{}</strong></td>
                    <td>{}</td>
                    <td>{}</td>
                    <td><span class="risk-badge {}">{}</span></td>
                    <td>{}</td>
                </tr>"#,
                d.name,
                d.version,
                d.license,
                risk_class(d.risk_level),
                d.risk_level,
                d.review_reason.as_deref().unwrap_or("-")
            )
        })
        .collect()
}

fn shorten_url(url: &str) -> String {
    if url.len() > 50 {
        format!("{}...", &url[..47])
    } else {
        url.to_string()
    }
}

fn render_allow_list(config: &AuditConfig) -> String {
    if config.allow_list.is_empty() {
        return "<span style='color: #94a3b8;'>未配置</span>".to_string();
    }
    config
        .allow_list
        .iter()
        .map(|l| format!("<span class='config-tag tag-allow'>{}</span>", l))
        .collect()
}

fn render_deny_list(config: &AuditConfig) -> String {
    if config.deny_list.is_empty() {
        return "<span style='color: #94a3b8;'>未配置</span>".to_string();
    }
    config
        .deny_list
        .iter()
        .map(|l| format!("<span class='config-tag tag-deny'>{}</span>", l))
        .collect()
}

fn render_trusted_sources(config: &AuditConfig) -> String {
    config
        .trusted_sources
        .iter()
        .map(|s| format!("<span class='config-tag tag-trusted'>{}</span>", s))
        .collect()
}

fn render_scanned_paths(result: &ScanResult) -> String {
    result
        .scanned_paths
        .iter()
        .map(|p| p.display().to_string())
        .collect::<Vec<_>>()
        .join(", ")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Dependency, PackageManager};
    use std::path::PathBuf;

    fn make_test_result() -> ScanResult {
        let dep = Dependency {
            name: "test-pkg".to_string(),
            version: "1.0.0".to_string(),
            license: "MIT".to_string(),
            license_spdx: Some("MIT".to_string()),
            source: Some("registry".to_string()),
            source_url: Some("https://example.com/pkg".to_string()),
            package_manager: PackageManager::Npm,
            manifest_path: PathBuf::from("/test/package.json"),
            risk_level: RiskLevel::Low,
            needs_review: false,
            review_reason: None,
            is_direct: true,
        };

        ScanResult {
            dependencies: vec![dep],
            total_count: 1,
            unique_count: 1,
            high_risk_count: 0,
            critical_risk_count: 0,
            unknown_license_count: 0,
            needs_review_count: 0,
            review_queue: vec![],
            scanned_paths: vec![PathBuf::from("/test")],
            package_managers: vec![PackageManager::Npm],
        }
    }

    #[test]
    fn test_html_report_generation() {
        let result = make_test_result();
        let config = AuditConfig::default();
        let report = HtmlReport.generate(&result, &config).unwrap();
        assert!(report.contains("<!DOCTYPE html>"));
        assert!(report.contains("test-pkg"));
        assert!(report.contains("MIT"));
        assert!(report.contains("依赖许可证审计报告"));
    }
}
