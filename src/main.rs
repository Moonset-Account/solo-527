use clap::Parser;
use license_audit::cli::{Cli, Commands, OutputFormatCli};
use license_audit::config::{OutputFormat, ScanOptions};
use license_audit::report::{write_report, ReportFormat};
use license_audit::scanner::Scanner;
use anyhow::Result;
use std::process::ExitCode;

fn main() -> Result<ExitCode> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Scan(args) => run_scan(args),
        Commands::Licenses => {
            run_licenses();
            Ok(ExitCode::SUCCESS)
        }
        Commands::InitConfig(args) => run_init_config(args),
    }
}

fn run_scan(args: license_audit::cli::ScanArgs) -> Result<ExitCode> {
    let options = ScanOptions {
        paths: args.path,
        workspace: args.workspace,
        output_format: OutputFormat::from(args.format),
        output_path: args.output.clone(),
        config_path: args.config.clone(),
        allow_licenses: args.allow.clone(),
        deny_licenses: args.deny.clone(),
        include_dev: args.include_dev,
        recursive: args.recursive,
    };

    let scanner = Scanner::new(options);
    let result = scanner.scan()?;

    let report_format = match args.format {
        OutputFormatCli::Json => ReportFormat::Json,
        OutputFormatCli::Html => ReportFormat::Html,
        OutputFormatCli::Table => ReportFormat::Table,
    };

    let config = scanner.config();
    let output = write_report(&result, config, report_format, args.output.as_deref())?;

    if args.output.is_none() {
        println!("{}", output);
    } else {
        let path = args.output.as_ref().unwrap();
        eprintln!("报告已生成: {}", path.display());
    }

    let should_fail = (args.fail_on_high && result.high_risk_count > 0)
        || (args.fail_on_critical && result.critical_risk_count > 0)
        || (args.fail_on_unknown && result.unknown_license_count > 0);

    if should_fail {
        eprintln!("\n⚠️  检测到不符合策略的依赖");
        if result.critical_risk_count > 0 {
            eprintln!("   - {} 个严重风险依赖", result.critical_risk_count);
        }
        if result.high_risk_count > 0 {
            eprintln!("   - {} 个高风险依赖", result.high_risk_count);
        }
        if result.unknown_license_count > 0 {
            eprintln!("   - {} 个未知许可证依赖", result.unknown_license_count);
        }
        if result.needs_review_count > 0 {
            eprintln!("   - {} 个需人工复核", result.needs_review_count);
        }
        Ok(ExitCode::from(1))
    } else {
        eprintln!("\n✓ 所有依赖均符合策略要求");
        Ok(ExitCode::SUCCESS)
    }
}

fn run_licenses() {
    println!("=== 支持的许可证风险分级 ===\n");

    let categories = vec![
        ("低风险 - 宽松许可", vec![
            "MIT", "MIT-0", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause",
            "ISC", "0BSD", "Zlib", "Unlicense", "CC0-1.0", "WTFPL",
            "PostgreSQL", "Python-2.0", "OpenSSL", "Artistic-2.0",
        ]),
        ("中风险 - 弱Copyleft", vec![
            "LGPL-2.1", "LGPL-2.1-only", "LGPL-2.1-or-later",
            "LGPL-3.0", "LGPL-3.0-only", "LGPL-3.0-or-later",
            "MPL-2.0", "MPL-1.1", "EPL-2.0", "EPL-1.0",
            "CDDL-1.0", "CDDL-1.1", "MS-PL", "MS-RL", "BSL-1.0",
        ]),
        ("高风险 - 强Copyleft", vec![
            "GPL-2.0", "GPL-2.0-only", "GPL-2.0-or-later",
            "GPL-3.0", "GPL-3.0-only", "GPL-3.0-or-later",
            "CPL-1.0", "SSPL-1.0",
        ]),
        ("严重风险 - AGPL / 商业", vec![
            "AGPL-3.0", "AGPL-3.0-only", "AGPL-3.0-or-later",
            "AGPL-1.0", "PROPRIETARY", "Commercial", "Proprietary",
        ]),
    ];

    for (category, licenses) in categories {
        println!("{}", category);
        for lic in licenses {
            println!("  - {}", lic);
        }
        println!();
    }

    println!("=== 说明 ===");
    println!("- 未知许可证: 无法自动识别，进入人工复核队列");
    println!("- 未知来源: 缺少 source URL，进入人工复核队列");
    println!("- 白名单中的许可证会强制降级为低风险");
    println!("- 黑名单中的许可证会强制升级为严重风险");
    println!("- 重复依赖按最高风险等级展示");
}

fn run_init_config(args: license_audit::cli::InitConfigArgs) -> Result<ExitCode> {
    let content = match args.format {
        license_audit::cli::ConfigFormat::Toml => TEMPLATE_TOML.to_string(),
        license_audit::cli::ConfigFormat::Json => TEMPLATE_JSON.to_string(),
    };

    if let Some(parent) = args.output.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent)?;
        }
    }

    std::fs::write(&args.output, content)?;
    eprintln!("配置文件已生成: {}", args.output.display());
    Ok(ExitCode::SUCCESS)
}

const TEMPLATE_TOML: &str = r#"# license-audit 配置文件

# 白名单 - 这些许可证被视为低风险
allow_list = [
    "MIT",
    "Apache-2.0",
    "BSD-3-Clause",
    "BSD-2-Clause",
    "ISC",
    "0BSD",
    "Unlicense",
    "CC0-1.0",
]

# 黑名单 - 这些许可证被视为严重风险
deny_list = [
    "AGPL-3.0",
    "AGPL-3.0-only",
    "AGPL-3.0-or-later",
    "SSPL-1.0",
]

# 可信源列表
trusted_sources = [
    "https://registry.npmjs.org/",
    "https://proxy.golang.org/",
    "https://crates.io/",
]

# 是否扫描工作区
workspace = false

# 许可证风险等级覆盖
[risk_overrides]
# "SomeLicense" = "medium"

# 失败条件
fail_on_high = false
fail_on_critical = true
fail_on_unknown = false
"#;

const TEMPLATE_JSON: &str = r#"{
  "allow_list": [
    "MIT",
    "Apache-2.0",
    "BSD-3-Clause",
    "BSD-2-Clause",
    "ISC",
    "0BSD",
    "Unlicense",
    "CC0-1.0"
  ],
  "deny_list": [
    "AGPL-3.0",
    "AGPL-3.0-only",
    "AGPL-3.0-or-later",
    "SSPL-1.0"
  ],
  "trusted_sources": [
    "https://registry.npmjs.org/",
    "https://proxy.golang.org/",
    "https://crates.io/"
  ],
  "workspace": false,
  "risk_overrides": {},
  "fail_on_high": false,
  "fail_on_critical": true,
  "fail_on_unknown": false
}
"#;
