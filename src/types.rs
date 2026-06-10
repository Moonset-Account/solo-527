use serde::{Deserialize, Serialize};
use indexmap::IndexMap;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OpenAPISpec {
    #[serde(default)]
    pub openapi: String,
    #[serde(default)]
    pub info: Info,
    #[serde(default)]
    pub servers: Vec<Server>,
    #[serde(default)]
    pub paths: BTreeMap<String, PathItem>,
    #[serde(default)]
    pub components: Option<Components>,
    #[serde(default)]
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Info {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub version: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub contact: Option<Contact>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Contact {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Server {
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Tag {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PathItem {
    #[serde(default)]
    pub get: Option<Operation>,
    #[serde(default)]
    pub put: Option<Operation>,
    #[serde(default)]
    pub post: Option<Operation>,
    #[serde(default)]
    pub delete: Option<Operation>,
    #[serde(default)]
    pub options: Option<Operation>,
    #[serde(default)]
    pub head: Option<Operation>,
    #[serde(default)]
    pub patch: Option<Operation>,
    #[serde(default)]
    pub trace: Option<Operation>,
    #[serde(default)]
    pub parameters: Vec<Parameter>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

impl PathItem {
    pub fn operations(&self) -> Vec<(&str, &Operation)> {
        let mut ops = Vec::new();
        if let Some(op) = &self.get { ops.push(("GET", op)); }
        if let Some(op) = &self.put { ops.push(("PUT", op)); }
        if let Some(op) = &self.post { ops.push(("POST", op)); }
        if let Some(op) = &self.delete { ops.push(("DELETE", op)); }
        if let Some(op) = &self.options { ops.push(("OPTIONS", op)); }
        if let Some(op) = &self.head { ops.push(("HEAD", op)); }
        if let Some(op) = &self.patch { ops.push(("PATCH", op)); }
        if let Some(op) = &self.trace { ops.push(("TRACE", op)); }
        ops
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Operation {
    #[serde(default, rename = "operationId")]
    pub operation_id: Option<String>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub parameters: Vec<Parameter>,
    #[serde(default, rename = "requestBody")]
    pub request_body: Option<RequestBody>,
    #[serde(default)]
    pub responses: BTreeMap<String, Response>,
    #[serde(default)]
    pub deprecated: bool,
    #[serde(default)]
    pub security: Vec<BTreeMap<String, Vec<String>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Parameter {
    #[serde(default)]
    pub name: String,
    #[serde(default, rename = "in")]
    pub location: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub deprecated: bool,
    #[serde(default)]
    pub schema: Option<Schema>,
    #[serde(default, rename = "type")]
    pub param_type: Option<String>,
    #[serde(default, rename = "enum")]
    pub enum_values: Option<Vec<serde_json::Value>>,
}

impl Parameter {
    pub fn unique_key(&self) -> String {
        format!("{}:{}", self.location, self.name)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RequestBody {
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub content: BTreeMap<String, MediaType>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaType {
    #[serde(default)]
    pub schema: Option<Schema>,
    #[serde(default)]
    pub example: Option<serde_json::Value>,
    #[serde(default)]
    pub examples: BTreeMap<String, Example>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Example {
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub value: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Response {
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub headers: BTreeMap<String, Header>,
    #[serde(default)]
    pub content: BTreeMap<String, MediaType>,
    #[serde(default)]
    pub links: BTreeMap<String, Link>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Header {
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub deprecated: bool,
    #[serde(default)]
    pub schema: Option<Schema>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Link {
    #[serde(default, rename = "operationRef")]
    pub operation_ref: Option<String>,
    #[serde(default, rename = "operationId")]
    pub operation_id: Option<String>,
    #[serde(default)]
    pub parameters: BTreeMap<String, serde_json::Value>,
    #[serde(default, rename = "requestBody")]
    pub request_body: Option<serde_json::Value>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Components {
    #[serde(default)]
    pub schemas: BTreeMap<String, Schema>,
    #[serde(default)]
    pub responses: BTreeMap<String, Response>,
    #[serde(default)]
    pub parameters: BTreeMap<String, Parameter>,
    #[serde(default)]
    pub headers: BTreeMap<String, Header>,
    #[serde(default, rename = "requestBodies")]
    pub request_bodies: BTreeMap<String, RequestBody>,
    #[serde(default, rename = "securitySchemes")]
    pub security_schemes: BTreeMap<String, SecurityScheme>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SecurityScheme {
    #[serde(default, rename = "type")]
    pub scheme_type: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    #[serde(rename = "in")]
    pub location: Option<String>,
    #[serde(default)]
    pub scheme: Option<String>,
    #[serde(default, rename = "bearerFormat")]
    pub bearer_format: Option<String>,
    #[serde(default)]
    pub flows: Option<OAuthFlows>,
    #[serde(default, rename = "openIdConnectUrl")]
    pub open_id_connect_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OAuthFlows {
    #[serde(default)]
    pub implicit: Option<OAuthFlow>,
    #[serde(default)]
    pub password: Option<OAuthFlow>,
    #[serde(default)]
    pub client_credentials: Option<OAuthFlow>,
    #[serde(default)]
    pub authorization_code: Option<OAuthFlow>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OAuthFlow {
    #[serde(default, rename = "authorizationUrl")]
    pub authorization_url: String,
    #[serde(default, rename = "tokenUrl")]
    pub token_url: String,
    #[serde(default, rename = "refreshUrl")]
    pub refresh_url: Option<String>,
    #[serde(default)]
    pub scopes: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Schema {
    #[serde(default, rename = "type")]
    pub schema_type: Option<SchemaType>,
    #[serde(default, rename = "allOf")]
    pub all_of: Option<Vec<Schema>>,
    #[serde(default, rename = "oneOf")]
    pub one_of: Option<Vec<Schema>>,
    #[serde(default, rename = "anyOf")]
    pub any_of: Option<Vec<Schema>>,
    #[serde(default)]
    pub not: Option<Box<Schema>>,
    #[serde(default)]
    pub items: Option<Box<Schema>>,
    #[serde(default)]
    pub properties: Option<IndexMap<String, Schema>>,
    #[serde(default)]
    pub required: Vec<String>,
    #[serde(default, rename = "enum")]
    pub enum_values: Option<Vec<serde_json::Value>>,
    #[serde(default)]
    pub format: Option<String>,
    #[serde(default, rename = "$ref")]
    pub ref_path: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub nullable: Option<bool>,
    #[serde(default)]
    pub deprecated: Option<bool>,
    #[serde(default)]
    pub minimum: Option<f64>,
    #[serde(default)]
    pub maximum: Option<f64>,
    #[serde(default, rename = "exclusiveMinimum")]
    pub exclusive_minimum: Option<bool>,
    #[serde(default, rename = "exclusiveMaximum")]
    pub exclusive_maximum: Option<bool>,
    #[serde(default, rename = "minLength")]
    pub min_length: Option<u64>,
    #[serde(default, rename = "maxLength")]
    pub max_length: Option<u64>,
    #[serde(default)]
    pub pattern: Option<String>,
    #[serde(default, rename = "minItems")]
    pub min_items: Option<u64>,
    #[serde(default, rename = "maxItems")]
    pub max_items: Option<u64>,
    #[serde(default, rename = "uniqueItems")]
    pub unique_items: Option<bool>,
    #[serde(default, rename = "minProperties")]
    pub min_properties: Option<u64>,
    #[serde(default, rename = "maxProperties")]
    pub max_properties: Option<u64>,
    #[serde(default, rename = "additionalProperties")]
    pub additional_properties: Option<serde_json::Value>,
    #[serde(default)]
    pub default: Option<serde_json::Value>,
    #[serde(default)]
    pub example: Option<serde_json::Value>,
    #[serde(default)]
    pub discriminator: Option<Discriminator>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(untagged)]
pub enum SchemaType {
    Single(String),
    Array(Vec<String>),
}

impl SchemaType {
    pub fn contains(&self, t: &str) -> bool {
        match self {
            SchemaType::Single(s) => s == t,
            SchemaType::Array(arr) => arr.iter().any(|s| s == t),
        }
    }

    pub fn as_vec(&self) -> Vec<String> {
        match self {
            SchemaType::Single(s) => vec![s.clone()],
            SchemaType::Array(arr) => arr.clone(),
        }
    }

    pub fn is_narrower_than(&self, other: &SchemaType) -> bool {
        let self_types = self.as_vec();
        let other_types = other.as_vec();
        self_types.iter().all(|t| other_types.contains(t)) && self_types.len() < other_types.len()
    }
}

impl std::fmt::Display for SchemaType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SchemaType::Single(s) => write!(f, "{}", s),
            SchemaType::Array(arr) => write!(f, "[{}]", arr.join(", ")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Discriminator {
    #[serde(default, rename = "propertyName")]
    pub property_name: String,
    #[serde(default)]
    pub mapping: Option<BTreeMap<String, String>>,
}
