use crate::config::RulesConfig;
use crate::types::*;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ChangeSeverity {
    Breaking,
    Warning,
    Info,
}

impl ChangeSeverity {
    pub fn is_breaking(&self) -> bool {
        matches!(self, ChangeSeverity::Breaking)
    }

    pub fn label(&self) -> &'static str {
        match self {
            ChangeSeverity::Breaking => "BREAKING",
            ChangeSeverity::Warning => "WARNING",
            ChangeSeverity::Info => "INFO",
        }
    }

    pub fn emoji(&self) -> &'static str {
        match self {
            ChangeSeverity::Breaking => "🔴",
            ChangeSeverity::Warning => "🟡",
            ChangeSeverity::Info => "🔵",
        }
    }
}

impl std::fmt::Display for ChangeSeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.label())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ChangeType {
    PathAdded,
    PathRemoved,
    OperationAdded,
    OperationRemoved,
    OperationDeprecated,
    ParameterAdded,
    ParameterRemoved,
    ParameterRequiredChanged,
    ParameterTypeChanged,
    ParameterEnumChanged,
    ParameterLocationChanged,
    PropertyAdded,
    PropertyRemoved,
    PropertyRequiredChanged,
    PropertyTypeNarrowed,
    PropertyTypeChanged,
    PropertyEnumChanged,
    PropertyFormatChanged,
    PropertyNullableChanged,
    SchemaConstraintTightened,
    RequestBodyAdded,
    RequestBodyRemoved,
    RequestBodyRequiredChanged,
    RequestBodyMediaTypeChanged,
    ResponseCodeAdded,
    ResponseCodeRemoved,
    ResponseMediaTypeChanged,
    ResponseHeaderAdded,
    ResponseHeaderRemoved,
    ResponseBodyChanged,
    SecuritySchemeChanged,
    ServerChanged,
    MetadataChanged,
}

impl ChangeType {
    pub fn default_severity(&self) -> ChangeSeverity {
        match self {
            ChangeType::PathRemoved
            | ChangeType::OperationRemoved
            | ChangeType::ParameterRemoved
            | ChangeType::ParameterRequiredChanged
            | ChangeType::ParameterLocationChanged
            | ChangeType::PropertyRemoved
            | ChangeType::PropertyRequiredChanged
            | ChangeType::PropertyTypeNarrowed
            | ChangeType::PropertyEnumChanged
            | ChangeType::RequestBodyRemoved
            | ChangeType::RequestBodyRequiredChanged
            | ChangeType::RequestBodyMediaTypeChanged
            | ChangeType::ResponseCodeRemoved
            | ChangeType::ResponseMediaTypeChanged
            | ChangeType::ResponseHeaderRemoved
            | ChangeType::ResponseBodyChanged
            | ChangeType::SchemaConstraintTightened
            | ChangeType::ParameterTypeChanged
            | ChangeType::ParameterEnumChanged
            | ChangeType::PropertyTypeChanged
            | ChangeType::SecuritySchemeChanged => ChangeSeverity::Breaking,

            ChangeType::OperationDeprecated
            | ChangeType::PropertyFormatChanged
            | ChangeType::PropertyNullableChanged
            | ChangeType::ResponseHeaderAdded
            | ChangeType::ServerChanged
            | ChangeType::MetadataChanged => ChangeSeverity::Warning,

            ChangeType::PathAdded
            | ChangeType::OperationAdded
            | ChangeType::ParameterAdded
            | ChangeType::PropertyAdded
            | ChangeType::RequestBodyAdded
            | ChangeType::ResponseCodeAdded => ChangeSeverity::Info,
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            ChangeType::PathAdded => "Path Added",
            ChangeType::PathRemoved => "Path Removed",
            ChangeType::OperationAdded => "Operation Added",
            ChangeType::OperationRemoved => "Operation Removed",
            ChangeType::OperationDeprecated => "Operation Deprecated",
            ChangeType::ParameterAdded => "Parameter Added",
            ChangeType::ParameterRemoved => "Parameter Removed",
            ChangeType::ParameterRequiredChanged => "Parameter Required Changed",
            ChangeType::ParameterTypeChanged => "Parameter Type Changed",
            ChangeType::ParameterEnumChanged => "Parameter Enum Changed",
            ChangeType::ParameterLocationChanged => "Parameter Location Changed",
            ChangeType::PropertyAdded => "Property Added",
            ChangeType::PropertyRemoved => "Property Removed",
            ChangeType::PropertyRequiredChanged => "Property Required Changed",
            ChangeType::PropertyTypeNarrowed => "Property Type Narrowed",
            ChangeType::PropertyTypeChanged => "Property Type Changed",
            ChangeType::PropertyEnumChanged => "Property Enum Changed",
            ChangeType::PropertyFormatChanged => "Property Format Changed",
            ChangeType::PropertyNullableChanged => "Property Nullable Changed",
            ChangeType::SchemaConstraintTightened => "Schema Constraint Tightened",
            ChangeType::RequestBodyAdded => "Request Body Added",
            ChangeType::RequestBodyRemoved => "Request Body Removed",
            ChangeType::RequestBodyRequiredChanged => "Request Body Required Changed",
            ChangeType::RequestBodyMediaTypeChanged => "Request Body Media Type Changed",
            ChangeType::ResponseCodeAdded => "Response Code Added",
            ChangeType::ResponseCodeRemoved => "Response Code Removed",
            ChangeType::ResponseMediaTypeChanged => "Response Media Type Changed",
            ChangeType::ResponseHeaderAdded => "Response Header Added",
            ChangeType::ResponseHeaderRemoved => "Response Header Removed",
            ChangeType::ResponseBodyChanged => "Response Body Changed",
            ChangeType::SecuritySchemeChanged => "Security Scheme Changed",
            ChangeType::ServerChanged => "Server Changed",
            ChangeType::MetadataChanged => "Metadata Changed",
        }
    }
}

impl std::fmt::Display for ChangeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.label())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Change {
    pub change_type: ChangeType,
    pub severity: ChangeSeverity,
    pub path: String,
    #[serde(default)]
    pub method: Option<String>,
    #[serde(default)]
    pub field: Option<String>,
    pub message: String,
    #[serde(default)]
    pub old_value: Option<String>,
    #[serde(default)]
    pub new_value: Option<String>,
    #[serde(default)]
    pub ignore_rule_id: Option<String>,
}

impl Change {
    pub fn endpoint(&self) -> String {
        match &self.method {
            Some(m) => format!("{} {}", m.to_uppercase(), self.path),
            None => self.path.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub old_version: String,
    pub new_version: String,
    pub changes: Vec<Change>,
    pub total_changes: usize,
    pub breaking_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
    pub ignored_count: usize,
    pub affected_endpoints: Vec<String>,
}

impl DiffResult {
    pub fn has_breaking_changes(&self) -> bool {
        self.breaking_count > 0
    }
}

pub struct ChangeDetector {
    config: RulesConfig,
}

impl ChangeDetector {
    pub fn new(config: RulesConfig) -> Self {
        Self { config }
    }

    pub fn with_default_config() -> Self {
        Self {
            config: RulesConfig::default(),
        }
    }

    pub fn detect(&self, old: &OpenAPISpec, new: &OpenAPISpec) -> DiffResult {
        let mut changes = Vec::new();
        let mut ignored_count = 0;
        let mut endpoints = HashSet::new();

        self.detect_metadata_changes(old, new, &mut changes, &mut ignored_count, &mut endpoints);
        self.detect_server_changes(old, new, &mut changes, &mut ignored_count, &mut endpoints);
        self.detect_path_changes(old, new, &mut changes, &mut ignored_count, &mut endpoints);
        self.detect_component_schema_changes(old, new, &mut changes, &mut ignored_count, &mut endpoints);

        let breaking_count = changes
            .iter()
            .filter(|c| c.severity.is_breaking())
            .count();
        let warning_count = changes
            .iter()
            .filter(|c| c.severity == ChangeSeverity::Warning)
            .count();
        let info_count = changes
            .iter()
            .filter(|c| c.severity == ChangeSeverity::Info)
            .count();

        let mut affected_endpoints: Vec<String> = endpoints.into_iter().collect();
        affected_endpoints.sort();

        let total_changes = changes.len();

        DiffResult {
            old_version: old.info.version.clone(),
            new_version: new.info.version.clone(),
            changes,
            total_changes,
            breaking_count,
            warning_count,
            info_count,
            ignored_count,
            affected_endpoints,
        }
    }

    fn add_change(
        &self,
        change_type: ChangeType,
        path: &str,
        method: Option<&str>,
        field: Option<&str>,
        message: String,
        old_value: Option<String>,
        new_value: Option<String>,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        if self.config.is_ignored(
            path,
            field,
            change_type,
            method,
        ) {
            *ignored_count += 1;
            return;
        }

        let default_severity = change_type.default_severity();
        let severity = self
            .config
            .override_severity(change_type, path, default_severity);

        if let Some(m) = method {
            endpoints.insert(format!("{} {}", m.to_uppercase(), path));
        } else {
            endpoints.insert(path.to_string());
        }

        changes.push(Change {
            change_type,
            severity,
            path: path.to_string(),
            method: method.map(|s| s.to_string()),
            field: field.map(|s| s.to_string()),
            message,
            old_value,
            new_value,
            ignore_rule_id: None,
        });
    }

    fn detect_metadata_changes(
        &self,
        old: &OpenAPISpec,
        new: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        if old.info.version != new.info.version {
            self.add_change(
                ChangeType::MetadataChanged,
                "/",
                None,
                Some("info.version"),
                format!("API version changed from {} to {}", old.info.version, new.info.version),
                Some(old.info.version.clone()),
                Some(new.info.version.clone()),
                changes,
                ignored_count,
                endpoints,
            );
        }
        if old.openapi != new.openapi {
            self.add_change(
                ChangeType::MetadataChanged,
                "/",
                None,
                Some("openapi"),
                format!("OpenAPI version changed from {} to {}", old.openapi, new.openapi),
                Some(old.openapi.clone()),
                Some(new.openapi.clone()),
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn detect_server_changes(
        &self,
        old: &OpenAPISpec,
        new: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_urls: HashSet<&str> = old.servers.iter().map(|s| s.url.as_str()).collect();
        let new_urls: HashSet<&str> = new.servers.iter().map(|s| s.url.as_str()).collect();

        for removed in old_urls.difference(&new_urls) {
            self.add_change(
                ChangeType::ServerChanged,
                "/",
                None,
                Some("servers"),
                format!("Server URL removed: {}", removed),
                Some(removed.to_string()),
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }
        for added in new_urls.difference(&old_urls) {
            self.add_change(
                ChangeType::ServerChanged,
                "/",
                None,
                Some("servers"),
                format!("Server URL added: {}", added),
                None,
                Some(added.to_string()),
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn detect_path_changes(
        &self,
        old: &OpenAPISpec,
        new: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_paths: HashSet<&String> = old.paths.keys().collect();
        let new_paths: HashSet<&String> = new.paths.keys().collect();

        for removed in old_paths.difference(&new_paths) {
            self.add_change(
                ChangeType::PathRemoved,
                removed,
                None,
                None,
                format!("Path removed: {}", removed),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for added in new_paths.difference(&old_paths) {
            self.add_change(
                ChangeType::PathAdded,
                added,
                None,
                None,
                format!("Path added: {}", added),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for common_path in old_paths.intersection(&new_paths) {
            let old_item = old.paths.get(*common_path).unwrap();
            let new_item = new.paths.get(*common_path).unwrap();
            self.detect_operation_changes(
                common_path,
                old_item,
                new_item,
                old,
                new,
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn detect_operation_changes(
        &self,
        path: &str,
        old_item: &PathItem,
        new_item: &PathItem,
        old_spec: &OpenAPISpec,
        new_spec: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_ops: BTreeMap<&str, &Operation> =
            old_item.operations().into_iter().collect();
        let new_ops: BTreeMap<&str, &Operation> =
            new_item.operations().into_iter().collect();

        let old_methods: HashSet<&str> = old_ops.keys().copied().collect();
        let new_methods: HashSet<&str> = new_ops.keys().copied().collect();

        for removed in old_methods.difference(&new_methods) {
            self.add_change(
                ChangeType::OperationRemoved,
                path,
                Some(removed),
                None,
                format!("Operation {} {} removed", removed.to_uppercase(), path),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for added in new_methods.difference(&old_methods) {
            self.add_change(
                ChangeType::OperationAdded,
                path,
                Some(added),
                None,
                format!("Operation {} {} added", added.to_uppercase(), path),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for method in old_methods.intersection(&new_methods) {
            let old_op = old_ops.get(method).copied().unwrap();
            let new_op = new_ops.get(method).copied().unwrap();

            if new_op.deprecated && !old_op.deprecated {
                self.add_change(
                    ChangeType::OperationDeprecated,
                    path,
                    Some(method),
                    None,
                    format!("Operation {} {} is now deprecated", method.to_uppercase(), path),
                    Some("false".to_string()),
                    Some("true".to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }

            self.detect_parameter_changes(
                path,
                method,
                old_op,
                new_op,
                changes,
                ignored_count,
                endpoints,
            );

            self.detect_request_body_changes(
                path,
                method,
                old_op,
                new_op,
                old_spec,
                new_spec,
                changes,
                ignored_count,
                endpoints,
            );

            self.detect_response_changes(
                path,
                method,
                old_op,
                new_op,
                old_spec,
                new_spec,
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn detect_parameter_changes(
        &self,
        path: &str,
        method: &str,
        old_op: &Operation,
        new_op: &Operation,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_params: BTreeMap<String, &Parameter> = old_op
            .parameters
            .iter()
            .map(|p| (p.unique_key(), p))
            .collect();
        let new_params: BTreeMap<String, &Parameter> = new_op
            .parameters
            .iter()
            .map(|p| (p.unique_key(), p))
            .collect();

        let old_keys: HashSet<&String> = old_params.keys().collect();
        let new_keys: HashSet<&String> = new_params.keys().collect();

        for removed in old_keys.difference(&new_keys) {
            let param = old_params.get(*removed).unwrap();
            self.add_change(
                ChangeType::ParameterRemoved,
                path,
                Some(method),
                Some(&param.name),
                format!(
                    "{} parameter '{}' removed",
                    param.location, param.name
                ),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for added in new_keys.difference(&old_keys) {
            let param = new_params.get(*added).unwrap();
            let severity_ct = if param.required {
                ChangeType::ParameterRequiredChanged
            } else {
                ChangeType::ParameterAdded
            };
            self.add_change(
                severity_ct,
                path,
                Some(method),
                Some(&param.name),
                format!(
                    "{} parameter '{}' added{}",
                    param.location,
                    param.name,
                    if param.required { " (required)" } else { "" }
                ),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for key in old_keys.intersection(&new_keys) {
            let old_p = old_params.get(*key).unwrap();
            let new_p = new_params.get(*key).unwrap();

            if old_p.required != new_p.required {
                self.add_change(
                    ChangeType::ParameterRequiredChanged,
                    path,
                    Some(method),
                    Some(&old_p.name),
                    format!(
                        "Parameter '{}' required changed from {} to {}",
                        old_p.name, old_p.required, new_p.required
                    ),
                    Some(old_p.required.to_string()),
                    Some(new_p.required.to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }

            if old_p.location != new_p.location {
                self.add_change(
                    ChangeType::ParameterLocationChanged,
                    path,
                    Some(method),
                    Some(&old_p.name),
                    format!(
                        "Parameter '{}' location changed from {} to {}",
                        old_p.name, old_p.location, new_p.location
                    ),
                    Some(old_p.location.clone()),
                    Some(new_p.location.clone()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }

            self.compare_parameter_types(
                path, method, old_p, new_p, changes, ignored_count, endpoints,
            );

            self.compare_enums(
                path, method, Some(&old_p.name),
                &old_p.enum_values, &new_p.enum_values,
                ChangeType::ParameterEnumChanged,
                changes, ignored_count, endpoints,
            );
        }
    }

    fn compare_parameter_types(
        &self,
        path: &str,
        method: &str,
        old_p: &Parameter,
        new_p: &Parameter,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_type = old_p
            .schema
            .as_ref()
            .and_then(|s| s.schema_type.as_ref())
            .map(|t| t.to_string())
            .or_else(|| old_p.param_type.clone());
        let new_type = new_p
            .schema
            .as_ref()
            .and_then(|s| s.schema_type.as_ref())
            .map(|t| t.to_string())
            .or_else(|| new_p.param_type.clone());

        if old_type != new_type {
            let is_narrowing = old_p
                .schema
                .as_ref()
                .and_then(|s| s.schema_type.as_ref())
                .zip(new_p.schema.as_ref().and_then(|s| s.schema_type.as_ref()))
                .map(|(o, n)| n.is_narrower_than(o))
                .unwrap_or(false);

            let ct = if is_narrowing {
                ChangeType::PropertyTypeNarrowed
            } else {
                ChangeType::ParameterTypeChanged
            };

            self.add_change(
                ct,
                path,
                Some(method),
                Some(&old_p.name),
                format!(
                    "Parameter '{}' type changed from {} to {}",
                    old_p.name,
                    old_type.as_deref().unwrap_or("(none)"),
                    new_type.as_deref().unwrap_or("(none)")
                ),
                old_type,
                new_type,
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn compare_enums(
        &self,
        path: &str,
        method: &str,
        field: Option<&str>,
        old_enum: &Option<Vec<serde_json::Value>>,
        new_enum: &Option<Vec<serde_json::Value>>,
        change_type: ChangeType,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        match (old_enum, new_enum) {
            (Some(old_vals), Some(new_vals)) => {
                let old_set: HashSet<&serde_json::Value> = old_vals.iter().collect();
                let new_set: HashSet<&serde_json::Value> = new_vals.iter().collect();

                let removed: Vec<&serde_json::Value> =
                    old_set.difference(&new_set).copied().collect();
                let added: Vec<&serde_json::Value> =
                    new_set.difference(&old_set).copied().collect();

                if !removed.is_empty() || !added.is_empty() {
                    let mut msg_parts = Vec::new();
                    if !removed.is_empty() {
                        msg_parts.push(format!(
                            "removed: [{}]",
                            removed
                                .iter()
                                .map(|v| v.to_string())
                                .collect::<Vec<_>>()
                                .join(", ")
                        ));
                    }
                    if !added.is_empty() {
                        msg_parts.push(format!(
                            "added: [{}]",
                            added
                                .iter()
                                .map(|v| v.to_string())
                                .collect::<Vec<_>>()
                                .join(", ")
                        ));
                    }
                    let field_name = field.unwrap_or("(unknown)");
                    self.add_change(
                        change_type,
                        path,
                        Some(method),
                        field,
                        format!("Enum for '{}' {}", field_name, msg_parts.join("; ")),
                        Some(format!("{:?}", old_vals)),
                        Some(format!("{:?}", new_vals)),
                        changes,
                        ignored_count,
                        endpoints,
                    );
                }
            }
            (Some(_), None) => {
                self.add_change(
                    change_type,
                    path,
                    Some(method),
                    field,
                    format!("Enum constraint removed from '{}'", field.unwrap_or("field")),
                    Some("enum present".to_string()),
                    Some("enum removed".to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            (None, Some(_)) => {
                self.add_change(
                    change_type,
                    path,
                    Some(method),
                    field,
                    format!("Enum constraint added to '{}'", field.unwrap_or("field")),
                    Some("no enum".to_string()),
                    Some("enum added".to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            _ => {}
        }
    }

    fn detect_request_body_changes(
        &self,
        path: &str,
        method: &str,
        old_op: &Operation,
        new_op: &Operation,
        old_spec: &OpenAPISpec,
        new_spec: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        match (&old_op.request_body, &new_op.request_body) {
            (None, Some(new_rb)) => {
                let ct = if new_rb.required {
                    ChangeType::RequestBodyRequiredChanged
                } else {
                    ChangeType::RequestBodyAdded
                };
                self.add_change(
                    ct,
                    path,
                    Some(method),
                    None,
                    format!(
                        "Request body added to {} {}{}",
                        method.to_uppercase(),
                        path,
                        if new_rb.required { " (required)" } else { "" }
                    ),
                    None,
                    None,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            (Some(_), None) => {
                self.add_change(
                    ChangeType::RequestBodyRemoved,
                    path,
                    Some(method),
                    None,
                    format!("Request body removed from {} {}", method.to_uppercase(), path),
                    None,
                    None,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            (Some(old_rb), Some(new_rb)) => {
                if old_rb.required != new_rb.required {
                    self.add_change(
                        ChangeType::RequestBodyRequiredChanged,
                        path,
                        Some(method),
                        None,
                        format!(
                            "Request body required changed from {} to {}",
                            old_rb.required, new_rb.required
                        ),
                        Some(old_rb.required.to_string()),
                        Some(new_rb.required.to_string()),
                        changes,
                        ignored_count,
                        endpoints,
                    );
                }

                let old_types: HashSet<&String> = old_rb.content.keys().collect();
                let new_types: HashSet<&String> = new_rb.content.keys().collect();

                for removed in old_types.difference(&new_types) {
                    self.add_change(
                        ChangeType::RequestBodyMediaTypeChanged,
                        path,
                        Some(method),
                        None,
                        format!("Request media type removed: {}", removed),
                        Some(removed.to_string()),
                        None,
                        changes,
                        ignored_count,
                        endpoints,
                    );
                }
                for added in new_types.difference(&old_types) {
                    self.add_change(
                        ChangeType::RequestBodyMediaTypeChanged,
                        path,
                        Some(method),
                        None,
                        format!("Request media type added: {}", added),
                        None,
                        Some(added.to_string()),
                        changes,
                        ignored_count,
                        endpoints,
                    );
                }

                for mt in old_types.intersection(&new_types) {
                    let old_schema = old_rb.content.get(*mt).and_then(|c| c.schema.as_ref());
                    let new_schema = new_rb.content.get(*mt).and_then(|c| c.schema.as_ref());
                    self.compare_schemas(
                        path,
                        method,
                        Some("requestBody"),
                        old_schema,
                        new_schema,
                        old_spec,
                        new_spec,
                        changes,
                        ignored_count,
                        endpoints,
                    );
                }
            }
            _ => {}
        }
    }

    fn detect_response_changes(
        &self,
        path: &str,
        method: &str,
        old_op: &Operation,
        new_op: &Operation,
        old_spec: &OpenAPISpec,
        new_spec: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_codes: HashSet<&String> = old_op.responses.keys().collect();
        let new_codes: HashSet<&String> = new_op.responses.keys().collect();

        for removed in old_codes.difference(&new_codes) {
            self.add_change(
                ChangeType::ResponseCodeRemoved,
                path,
                Some(method),
                None,
                format!(
                    "Response code {} removed from {} {}",
                    removed,
                    method.to_uppercase(),
                    path
                ),
                Some(removed.to_string()),
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for added in new_codes.difference(&old_codes) {
            self.add_change(
                ChangeType::ResponseCodeAdded,
                path,
                Some(method),
                None,
                format!(
                    "Response code {} added to {} {}",
                    added,
                    method.to_uppercase(),
                    path
                ),
                None,
                Some(added.to_string()),
                changes,
                ignored_count,
                endpoints,
            );
        }

        for code in old_codes.intersection(&new_codes) {
            let old_resp = old_op.responses.get(*code).unwrap();
            let new_resp = new_op.responses.get(*code).unwrap();

            self.detect_response_header_changes(
                path, method, code, old_resp, new_resp, changes, ignored_count, endpoints,
            );

            let old_mts: HashSet<&String> = old_resp.content.keys().collect();
            let new_mts: HashSet<&String> = new_resp.content.keys().collect();

            for removed in old_mts.difference(&new_mts) {
                self.add_change(
                    ChangeType::ResponseMediaTypeChanged,
                    path,
                    Some(method),
                    Some(format!("response.{}.content", code).as_str()),
                    format!("Response media type {} removed for code {}", removed, code),
                    Some(removed.to_string()),
                    None,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            for added in new_mts.difference(&old_mts) {
                self.add_change(
                    ChangeType::ResponseMediaTypeChanged,
                    path,
                    Some(method),
                    Some(format!("response.{}.content", code).as_str()),
                    format!("Response media type {} added for code {}", added, code),
                    None,
                    Some(added.to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }

            for mt in old_mts.intersection(&new_mts) {
                let old_schema = old_resp.content.get(*mt).and_then(|c| c.schema.as_ref());
                let new_schema = new_resp.content.get(*mt).and_then(|c| c.schema.as_ref());
                let field_prefix = format!("response.{}.{}", code, mt);
                self.compare_schemas(
                    path,
                    method,
                    Some(field_prefix.as_str()),
                    old_schema,
                    new_schema,
                    old_spec,
                    new_spec,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
        }
    }

    fn detect_response_header_changes(
        &self,
        path: &str,
        method: &str,
        code: &str,
        old_resp: &Response,
        new_resp: &Response,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_headers: HashSet<&String> = old_resp.headers.keys().collect();
        let new_headers: HashSet<&String> = new_resp.headers.keys().collect();

        for removed in old_headers.difference(&new_headers) {
            self.add_change(
                ChangeType::ResponseHeaderRemoved,
                path,
                Some(method),
                Some(format!("response.{}.headers.{}", code, removed).as_str()),
                format!("Response header '{}' removed for code {}", removed, code),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }
        for added in new_headers.difference(&old_headers) {
            self.add_change(
                ChangeType::ResponseHeaderAdded,
                path,
                Some(method),
                Some(format!("response.{}.headers.{}", code, added).as_str()),
                format!("Response header '{}' added for code {}", added, code),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn compare_schemas(
        &self,
        path: &str,
        method: &str,
        field_prefix: Option<&str>,
        old_schema: Option<&Schema>,
        new_schema: Option<&Schema>,
        old_spec: &OpenAPISpec,
        new_spec: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_resolved = old_schema.and_then(|s| self.resolve_schema(s, old_spec));
        let new_resolved = new_schema.and_then(|s| self.resolve_schema(s, new_spec));

        match (old_resolved.as_ref(), new_resolved.as_ref()) {
            (None, None) => {}
            (Some(_), None) | (None, Some(_)) => {}
            (Some(old_s), Some(new_s)) => {
                self.compare_schema_properties(
                    path, method, field_prefix, old_s, new_s, old_spec, new_spec,
                    changes, ignored_count, endpoints,
                );
                self.compare_schema_type_and_enum(
                    path, method, field_prefix, old_s, new_s,
                    changes, ignored_count, endpoints,
                );
                self.compare_schema_constraints(
                    path, method, field_prefix, old_s, new_s,
                    changes, ignored_count, endpoints,
                );
            }
        }
    }

    fn resolve_schema<'a>(&self, schema: &'a Schema, spec: &'a OpenAPISpec) -> Option<&'a Schema> {
        if let Some(ref_path) = &schema.ref_path {
            if let Some(rest) = ref_path.strip_prefix("#/components/schemas/") {
                if let Some(components) = &spec.components {
                    return components.schemas.get(rest);
                }
            }
        }
        Some(schema)
    }

    fn compare_schema_properties(
        &self,
        path: &str,
        method: &str,
        field_prefix: Option<&str>,
        old_s: &Schema,
        new_s: &Schema,
        old_spec: &OpenAPISpec,
        new_spec: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_props = old_s.properties.as_ref();
        let new_props = new_s.properties.as_ref();

        let old_keys: HashSet<String> = old_props
            .map(|m| m.keys().cloned().collect())
            .unwrap_or_default();
        let new_keys: HashSet<String> = new_props
            .map(|m| m.keys().cloned().collect())
            .unwrap_or_default();

        for removed in old_keys.difference(&new_keys) {
            let field_name = match field_prefix {
                Some(p) => format!("{}.{}", p, removed),
                None => removed.clone(),
            };
            self.add_change(
                ChangeType::PropertyRemoved,
                path,
                Some(method),
                Some(&field_name),
                format!("Property '{}' removed", field_name),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for added in new_keys.difference(&old_keys) {
            let field_name = match field_prefix {
                Some(p) => format!("{}.{}", p, added),
                None => added.clone(),
            };
            let is_required = new_s.required.contains(added);
            self.add_change(
                if is_required {
                    ChangeType::PropertyRequiredChanged
                } else {
                    ChangeType::PropertyAdded
                },
                path,
                Some(method),
                Some(&field_name),
                format!(
                    "Property '{}' added{}",
                    field_name,
                    if is_required { " (required)" } else { "" }
                ),
                None,
                None,
                changes,
                ignored_count,
                endpoints,
            );
        }

        for common in old_keys.intersection(&new_keys) {
            let old_prop = old_props.and_then(|m| m.get(common));
            let new_prop = new_props.and_then(|m| m.get(common));

            let was_required = old_s.required.contains(common);
            let is_required = new_s.required.contains(common);
            if was_required != is_required {
                let field_name = match field_prefix {
                    Some(p) => format!("{}.{}", p, common),
                    None => common.clone(),
                };
                self.add_change(
                    ChangeType::PropertyRequiredChanged,
                    path,
                    Some(method),
                    Some(&field_name),
                    format!(
                        "Property '{}' required changed from {} to {}",
                        field_name, was_required, is_required
                    ),
                    Some(was_required.to_string()),
                    Some(is_required.to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }

            let field_name = match field_prefix {
                Some(p) => format!("{}.{}", p, common),
                None => common.clone(),
            };

            self.compare_property_type(
                path, method, &field_name, old_prop, new_prop,
                changes, ignored_count, endpoints,
            );

            let old_enum = old_prop.and_then(|p| p.enum_values.as_ref());
            let new_enum = new_prop.and_then(|p| p.enum_values.as_ref());
            self.compare_enums(
                path, method, Some(&field_name),
                &old_enum.cloned(), &new_enum.cloned(),
                ChangeType::PropertyEnumChanged,
                changes, ignored_count, endpoints,
            );

            self.compare_property_nullable(
                path, method, &field_name, old_prop, new_prop,
                changes, ignored_count, endpoints,
            );

            self.compare_property_format(
                path, method, &field_name, old_prop, new_prop,
                changes, ignored_count, endpoints,
            );

            if let (Some(old_p), Some(new_p)) = (old_prop, new_prop) {
                self.compare_schemas(
                    path,
                    method,
                    Some(&field_name),
                    Some(old_p),
                    Some(new_p),
                    old_spec,
                    new_spec,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
        }

        if let Some(items) = &old_s.items {
            if let Some(new_items) = &new_s.items {
                let field_name = match field_prefix {
                    Some(p) => format!("{}.items", p),
                    None => "items".to_string(),
                };
                self.compare_schemas(
                    path, method, Some(&field_name),
                    Some(items), Some(new_items),
                    old_spec, new_spec,
                    changes, ignored_count, endpoints,
                );
            }
        }
    }

    fn compare_property_type(
        &self,
        path: &str,
        method: &str,
        field_name: &str,
        old_prop: Option<&Schema>,
        new_prop: Option<&Schema>,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_type = old_prop.and_then(|p| p.schema_type.as_ref());
        let new_type = new_prop.and_then(|p| p.schema_type.as_ref());

        match (old_type, new_type) {
            (Some(o), Some(n)) if o != n => {
                let is_narrowing = n.is_narrower_than(o);
                let ct = if is_narrowing {
                    ChangeType::PropertyTypeNarrowed
                } else {
                    ChangeType::PropertyTypeChanged
                };
                self.add_change(
                    ct,
                    path,
                    Some(method),
                    Some(field_name),
                    format!(
                        "Property '{}' type changed from {} to {}",
                        field_name, o, n
                    ),
                    Some(o.to_string()),
                    Some(n.to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            (Some(o), None) => {
                self.add_change(
                    ChangeType::PropertyTypeChanged,
                    path,
                    Some(method),
                    Some(field_name),
                    format!(
                        "Property '{}' type removed (was {})",
                        field_name, o
                    ),
                    Some(o.to_string()),
                    None,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            (None, Some(n)) => {
                self.add_change(
                    ChangeType::PropertyTypeChanged,
                    path,
                    Some(method),
                    Some(field_name),
                    format!(
                        "Property '{}' type added: {}",
                        field_name, n
                    ),
                    None,
                    Some(n.to_string()),
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
            _ => {}
        }
    }

    fn compare_property_nullable(
        &self,
        path: &str,
        method: &str,
        field_name: &str,
        old_prop: Option<&Schema>,
        new_prop: Option<&Schema>,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_nullable = old_prop.and_then(|p| p.nullable).unwrap_or(false);
        let new_nullable = new_prop.and_then(|p| p.nullable).unwrap_or(false);

        if old_nullable != new_nullable {
            let severity_ct = if old_nullable && !new_nullable {
                ChangeType::PropertyNullableChanged
            } else {
                ChangeType::PropertyNullableChanged
            };
            self.add_change(
                severity_ct,
                path,
                Some(method),
                Some(field_name),
                format!(
                    "Property '{}' nullable changed from {} to {}",
                    field_name, old_nullable, new_nullable
                ),
                Some(old_nullable.to_string()),
                Some(new_nullable.to_string()),
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn compare_property_format(
        &self,
        path: &str,
        method: &str,
        field_name: &str,
        old_prop: Option<&Schema>,
        new_prop: Option<&Schema>,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let old_fmt = old_prop.and_then(|p| p.format.as_ref());
        let new_fmt = new_prop.and_then(|p| p.format.as_ref());

        if old_fmt != new_fmt {
            self.add_change(
                ChangeType::PropertyFormatChanged,
                path,
                Some(method),
                Some(field_name),
                format!(
                    "Property '{}' format changed from {} to {}",
                    field_name,
                    old_fmt.map(|s| s.as_str()).unwrap_or("(none)"),
                    new_fmt.map(|s| s.as_str()).unwrap_or("(none)")
                ),
                old_fmt.map(|s| s.to_string()),
                new_fmt.map(|s| s.to_string()),
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn compare_schema_type_and_enum(
        &self,
        path: &str,
        method: &str,
        field_prefix: Option<&str>,
        old_s: &Schema,
        new_s: &Schema,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let field = field_prefix.unwrap_or("schema");
        self.compare_enums(
            path, method, Some(field),
            &old_s.enum_values, &new_s.enum_values,
            ChangeType::PropertyEnumChanged,
            changes, ignored_count, endpoints,
        );
    }

    fn compare_schema_constraints(
        &self,
        path: &str,
        method: &str,
        field_prefix: Option<&str>,
        old_s: &Schema,
        new_s: &Schema,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        let field = field_prefix.unwrap_or("schema");
        let mut tightened_constraints = Vec::new();

        if let (Some(old_min), Some(new_min)) = (old_s.minimum, new_s.minimum) {
            if new_min > old_min {
                tightened_constraints.push(format!("minimum: {} -> {}", old_min, new_min));
            }
        }
        if let (Some(old_max), Some(new_max)) = (old_s.maximum, new_s.maximum) {
            if new_max < old_max {
                tightened_constraints.push(format!("maximum: {} -> {}", old_max, new_max));
            }
        }
        if let (Some(old_len), Some(new_len)) = (old_s.min_length, new_s.min_length) {
            if new_len > old_len {
                tightened_constraints.push(format!("minLength: {} -> {}", old_len, new_len));
            }
        }
        if let (Some(old_len), Some(new_len)) = (old_s.max_length, new_s.max_length) {
            if new_len < old_len {
                tightened_constraints.push(format!("maxLength: {} -> {}", old_len, new_len));
            }
        }
        if let (Some(old_items), Some(new_items)) = (old_s.min_items, new_s.min_items) {
            if new_items > old_items {
                tightened_constraints.push(format!("minItems: {} -> {}", old_items, new_items));
            }
        }
        if let (Some(old_items), Some(new_items)) = (old_s.max_items, new_s.max_items) {
            if new_items < old_items {
                tightened_constraints.push(format!("maxItems: {} -> {}", old_items, new_items));
            }
        }
        if let (Some(old_props), Some(new_props)) = (old_s.min_properties, new_s.min_properties) {
            if new_props > old_props {
                tightened_constraints.push(format!(
                    "minProperties: {} -> {}",
                    old_props, new_props
                ));
            }
        }
        if let (Some(old_props), Some(new_props)) = (old_s.max_properties, new_s.max_properties) {
            if new_props < old_props {
                tightened_constraints.push(format!(
                    "maxProperties: {} -> {}",
                    old_props, new_props
                ));
            }
        }

        if !tightened_constraints.is_empty() {
            self.add_change(
                ChangeType::SchemaConstraintTightened,
                path,
                Some(method),
                Some(field),
                format!(
                    "Schema '{}' constraints tightened: {}",
                    field,
                    tightened_constraints.join(", ")
                ),
                None,
                Some(tightened_constraints.join(", ")),
                changes,
                ignored_count,
                endpoints,
            );
        }
    }

    fn detect_component_schema_changes(
        &self,
        old: &OpenAPISpec,
        new: &OpenAPISpec,
        changes: &mut Vec<Change>,
        ignored_count: &mut usize,
        endpoints: &mut HashSet<String>,
    ) {
        if let (Some(old_comp), Some(new_comp)) = (&old.components, &new.components) {
            let old_names: HashSet<&String> = old_comp.schemas.keys().collect();
            let new_names: HashSet<&String> = new_comp.schemas.keys().collect();

            for name in old_names.intersection(&new_names) {
                let old_s = old_comp.schemas.get(*name).unwrap();
                let new_s = new_comp.schemas.get(*name).unwrap();
                let path = format!("#/components/schemas/{}", name);
                self.compare_schema_properties(
                    &path,
                    "",
                    None,
                    old_s,
                    new_s,
                    old,
                    new,
                    changes,
                    ignored_count,
                    endpoints,
                );
                self.compare_schema_type_and_enum(
                    &path,
                    "",
                    None,
                    old_s,
                    new_s,
                    changes,
                    ignored_count,
                    endpoints,
                );
                self.compare_schema_constraints(
                    &path,
                    "",
                    None,
                    old_s,
                    new_s,
                    changes,
                    ignored_count,
                    endpoints,
                );
            }
        }
    }
}
