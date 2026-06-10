use oas_checker::*;
use pretty_assertions::assert_eq;
use std::path::PathBuf;

fn fixture(name: &str) -> PathBuf {
    let mut d = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    d.push("tests/fixtures");
    d.push(name);
    d
}

#[test]
fn test_parser_loads_old_fixture() {
    let spec = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    assert_eq!(spec.info.title, "User Management API");
    assert_eq!(spec.info.version, "1.0.0");
    assert_eq!(spec.paths.len(), 5);
    assert!(spec.paths.contains_key("/users"));
    assert!(spec.paths.contains_key("/users/{userId}"));
    assert!(spec.paths.contains_key("/orders"));
    assert!(spec.paths.contains_key("/orders/{orderId}"));
    assert!(spec.paths.contains_key("/health"));
}

#[test]
fn test_parser_loads_new_fixture() {
    let spec = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();
    assert_eq!(spec.info.version, "2.0.0");
    assert_eq!(spec.paths.len(), 5);
    assert!(spec.paths.contains_key("/billing/subscriptions"));
    assert!(!spec.paths.contains_key("/health"));
}

#[test]
fn test_diff_detects_path_changes() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let path_added = result
        .changes
        .iter()
        .find(|c| matches!(c.change_type, diff::ChangeType::PathAdded));
    assert!(path_added.is_some());
    assert_eq!(path_added.unwrap().path, "/billing/subscriptions");

    let path_removed = result
        .changes
        .iter()
        .find(|c| matches!(c.change_type, diff::ChangeType::PathRemoved));
    assert!(path_removed.is_some());
    assert_eq!(path_removed.unwrap().path, "/health");
}

#[test]
fn test_diff_detects_response_code_changes() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let has_403_added = result.changes.iter().any(|c| {
        matches!(c.change_type, diff::ChangeType::ResponseCodeAdded)
            && c.new_value.as_deref() == Some("403")
            && c.path == "/users"
    });
    assert!(has_403_added, "Should detect 403 added to GET /users");

    let has_500_removed = result.changes.iter().any(|c| {
        matches!(c.change_type, diff::ChangeType::ResponseCodeRemoved)
            && c.old_value.as_deref() == Some("500")
            && c.path == "/users"
    });
    assert!(has_500_removed, "Should detect 500 removed from GET /users");
}

#[test]
fn test_diff_detects_breaking_changes_count() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    assert!(
        result.has_breaking_changes(),
        "Expected breaking changes between v1 and v2"
    );
    assert!(
        result.breaking_count >= 5,
        "Expected at least 5 breaking changes, got {}",
        result.breaking_count
    );
    println!(
        "Detected: {} breaking, {} warnings, {} info, {} ignored",
        result.breaking_count, result.warning_count, result.info_count, result.ignored_count
    );
    println!("Affected endpoints: {:?}", result.affected_endpoints);
}

#[test]
fn test_diff_detects_property_removed() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let has_deletedAt_removed = result.changes.iter().any(|c| {
        matches!(c.change_type, diff::ChangeType::PropertyRemoved)
            && c.field.as_deref().map(|f| f.contains("deletedAt")).unwrap_or(false)
    });
    assert!(has_deletedAt_removed, "Should detect deletedAt removed from User");

    let has_firstName_removed = result.changes.iter().any(|c| {
        matches!(c.change_type, diff::ChangeType::PropertyRemoved)
            && c.field.as_deref().map(|f| f.contains("firstName")).unwrap_or(false)
    });
    assert!(has_firstName_removed, "Should detect firstName removed from User");
}

#[test]
fn test_diff_detects_required_change() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let page_required = result.changes.iter().find(|c| {
        matches!(c.change_type, diff::ChangeType::ParameterRequiredChanged)
            && c.field.as_deref() == Some("page")
    });
    assert!(page_required.is_some(), "Should detect page required: false -> true");
    let p = page_required.unwrap();
    assert_eq!(p.old_value.as_deref(), Some("false"));
    assert_eq!(p.new_value.as_deref(), Some("true"));
}

#[test]
fn test_diff_detects_enum_changes() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let user_status_enum = result.changes.iter().find(|c| {
        matches!(c.change_type, diff::ChangeType::PropertyEnumChanged)
            && c.field.as_deref().map(|f| f.contains("status")).unwrap_or(false)
            && c.message.contains("inactive")
    });
    assert!(
        user_status_enum.is_some(),
        "Should detect User.status enum removal of inactive/pending"
    );
}

#[test]
fn test_diff_detects_type_narrowing() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let constraint = result.changes.iter().find(|c| {
        matches!(c.change_type, diff::ChangeType::SchemaConstraintTightened)
            && c.message.contains("minimum: 0 -> 18")
    });
    assert!(constraint.is_some(), "Should detect age minimum 0->18 tightened");
}

#[test]
fn test_ignore_rules_work() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let config = RulesConfig::from_file(fixture("example_rules.yaml")).unwrap();
    let detector = ChangeDetector::new(config);
    let result_with_ignore = detector.detect(&old, &new);

    let detector_no_ignore = ChangeDetector::with_default_config();
    let result_no_ignore = detector_no_ignore.detect(&old, &new);

    assert!(
        result_with_ignore.ignored_count > 0,
        "Expected some changes to be ignored"
    );
    assert!(
        result_with_ignore.total_changes < result_no_ignore.total_changes,
        "Expected fewer changes after applying ignore rules"
    );
    println!(
        "Ignore rules: {} changes ignored (was {} total)",
        result_with_ignore.ignored_count, result_no_ignore.total_changes
    );
}

#[test]
fn test_affected_endpoints_listed() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    assert!(
        !result.affected_endpoints.is_empty(),
        "Should have affected endpoints"
    );
    for ep in &result.affected_endpoints {
        println!("Affected: {}", ep);
    }
    assert!(
        result.affected_endpoints.iter().any(|e| e.contains("GET /users")),
        "GET /users should be affected"
    );
    assert!(
        result.affected_endpoints.iter().any(|e| e.contains("POST /orders")),
        "POST /orders should be affected"
    );
}

#[test]
fn test_report_formats_all_render() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let md = ReportGenerator::generate(&result, ReportFormat::Markdown);
    assert!(md.contains("# API Contract Change Report"));
    assert!(md.contains("## Affected Endpoints"));
    assert!(md.contains("Breaking Changes"));

    let json = ReportGenerator::generate(&result, ReportFormat::Json);
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed["old_version"], "1.0.0");
    assert_eq!(parsed["new_version"], "2.0.0");
    assert!(parsed["breaking_count"].as_u64().unwrap() > 0);

    let pjson = ReportGenerator::generate(&result, ReportFormat::PrettyJson);
    assert!(pjson.contains('\n'));

    let text = ReportGenerator::generate(&result, ReportFormat::Text);
    assert!(text.contains("API CONTRACT CHANGE REPORT"));
    assert!(text.contains("BREAKING CHANGES DETECTED"));
}

#[test]
fn test_empty_diff_when_same_spec() {
    let spec = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&spec, &spec);

    assert_eq!(result.breaking_count, 0);
    assert_eq!(result.warning_count, 0);
    assert_eq!(result.info_count, 0);
    assert!(!result.has_breaking_changes());
}

#[test]
fn test_operation_deprecated_detected() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let deprecated = result.changes.iter().find(|c| {
        matches!(c.change_type, diff::ChangeType::OperationDeprecated)
            && c.method.as_deref() == Some("PUT")
            && c.path == "/users/{userId}"
    });
    assert!(deprecated.is_some(), "Should detect PUT /users/[userId] deprecated");
}

#[test]
fn test_request_body_required_changes() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let has_payment_required = result.changes.iter().any(|c| {
        matches!(
            c.change_type,
            diff::ChangeType::PropertyRequiredChanged | diff::ChangeType::PropertyAdded
        ) && c.field.as_deref().map(|f| f.contains("paymentMethodId")).unwrap_or(false)
    });
    assert!(
        has_payment_required,
        "Should detect paymentMethodId added as required to CreateOrderRequest"
    );
}

#[test]
fn test_version_metadata_change() {
    let old = OpenAPIParser::parse_file(fixture("users_api_old.yaml")).unwrap();
    let new = OpenAPIParser::parse_file(fixture("users_api_new.yaml")).unwrap();

    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    assert_eq!(result.old_version, "1.0.0");
    assert_eq!(result.new_version, "2.0.0");

    let version_change = result.changes.iter().find(|c| {
        matches!(c.change_type, diff::ChangeType::MetadataChanged)
            && c.field.as_deref() == Some("info.version")
    });
    assert!(version_change.is_some());
}
