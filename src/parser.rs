use crate::types::OpenAPISpec;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ParserError {
    #[error("Failed to read file: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Failed to parse YAML: {0}")]
    YamlError(#[from] serde_yaml::Error),
    #[error("Failed to parse JSON: {0}")]
    JsonError(#[from] serde_json::Error),
    #[error("Unsupported file format: {0}")]
    UnsupportedFormat(String),
    #[error("Invalid OpenAPI spec: missing required field '{0}'")]
    InvalidSpec(String),
}

pub struct OpenAPIParser;

impl OpenAPIParser {
    pub fn parse_file<P: AsRef<Path>>(path: P) -> Result<OpenAPISpec, ParserError> {
        let path = path.as_ref();
        let content = std::fs::read_to_string(path)?;
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|s| s.to_lowercase());

        match ext.as_deref() {
            Some("yaml") | Some("yml") => Self::parse_yaml(&content),
            Some("json") => Self::parse_json(&content),
            _ => Self::parse_auto(&content),
        }
    }

    pub fn parse_yaml(content: &str) -> Result<OpenAPISpec, ParserError> {
        let spec: OpenAPISpec = serde_yaml::from_str(content)?;
        Self::validate(&spec)?;
        Ok(spec)
    }

    pub fn parse_json(content: &str) -> Result<OpenAPISpec, ParserError> {
        let spec: OpenAPISpec = serde_json::from_str(content)?;
        Self::validate(&spec)?;
        Ok(spec)
    }

    pub fn parse_auto(content: &str) -> Result<OpenAPISpec, ParserError> {
        if content.trim_start().starts_with('{') {
            Self::parse_json(content)
        } else {
            Self::parse_yaml(content)
        }
    }

    fn validate(spec: &OpenAPISpec) -> Result<(), ParserError> {
        if spec.openapi.is_empty() {
            return Err(ParserError::InvalidSpec("openapi".to_string()));
        }
        if spec.info.title.is_empty() {
            return Err(ParserError::InvalidSpec("info.title".to_string()));
        }
        if spec.info.version.is_empty() {
            return Err(ParserError::InvalidSpec("info.version".to_string()));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const MINIMAL_YAML: &str = r#"
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths: {}
"#;

    const MINIMAL_JSON: &str = r#"
{
  "openapi": "3.0.0",
  "info": {
    "title": "Test API",
    "version": "1.0.0"
  },
  "paths": {}
}
"#;

    #[test]
    fn test_parse_yaml() {
        let spec = OpenAPIParser::parse_yaml(MINIMAL_YAML).unwrap();
        assert_eq!(spec.openapi, "3.0.0");
        assert_eq!(spec.info.title, "Test API");
        assert_eq!(spec.info.version, "1.0.0");
    }

    #[test]
    fn test_parse_json() {
        let spec = OpenAPIParser::parse_json(MINIMAL_JSON).unwrap();
        assert_eq!(spec.openapi, "3.0.0");
        assert_eq!(spec.info.title, "Test API");
        assert_eq!(spec.info.version, "1.0.0");
    }

    #[test]
    fn test_parse_auto() {
        let spec = OpenAPIParser::parse_auto(MINIMAL_YAML).unwrap();
        assert_eq!(spec.info.title, "Test API");
        let spec = OpenAPIParser::parse_auto(MINIMAL_JSON).unwrap();
        assert_eq!(spec.info.title, "Test API");
    }

    #[test]
    fn test_invalid_spec_missing_title() {
        let yaml = r#"
openapi: "3.0.0"
info:
  version: "1.0.0"
paths: {}
"#;
        let result = OpenAPIParser::parse_yaml(yaml);
        assert!(result.is_err());
    }
}
