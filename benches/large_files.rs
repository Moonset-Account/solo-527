use criterion::{criterion_group, criterion_main, Criterion, Throughput};
use oas_checker::*;
use std::collections::BTreeMap;

fn generate_large_spec(num_endpoints: usize, schema_depth: usize) -> OpenAPISpec {
    use oas_checker::types::*;
    use indexmap::IndexMap;

    let mut paths: BTreeMap<String, PathItem> = BTreeMap::new();
    let mut schemas: BTreeMap<String, Schema> = BTreeMap::new();

    schemas.insert("SimpleUser".to_string(), Schema {
        schema_type: Some(SchemaType::Single("object".to_string())),
        required: vec!["id".to_string(), "name".to_string(), "email".to_string()],
        properties: Some({
            let mut m = IndexMap::new();
            m.insert("id".to_string(), Schema {
                schema_type: Some(SchemaType::Single("string".to_string())),
                format: Some("uuid".to_string()),
                ..Default::default()
            });
            m.insert("name".to_string(), Schema {
                schema_type: Some(SchemaType::Single("string".to_string())),
                ..Default::default()
            });
            m.insert("email".to_string(), Schema {
                schema_type: Some(SchemaType::Single("string".to_string())),
                format: Some("email".to_string()),
                ..Default::default()
            });
            m.insert("age".to_string(), Schema {
                schema_type: Some(SchemaType::Single("integer".to_string())),
                minimum: Some(0.0),
                maximum: Some(150.0),
                ..Default::default()
            });
            m.insert("role".to_string(), Schema {
                schema_type: Some(SchemaType::Single("string".to_string())),
                enum_values: Some(vec![
                    serde_json::Value::String("admin".to_string()),
                    serde_json::Value::String("user".to_string()),
                    serde_json::Value::String("guest".to_string()),
                ]),
                ..Default::default()
            });
            m.insert("tags".to_string(), Schema {
                schema_type: Some(SchemaType::Single("array".to_string())),
                items: Some(Box::new(Schema {
                    schema_type: Some(SchemaType::Single("string".to_string())),
                    ..Default::default()
                })),
                ..Default::default()
            });
            m
        }),
        ..Default::default()
    });

    fn build_nested(depth: usize) -> Schema {
        use oas_checker::types::*;
        use indexmap::IndexMap;
        if depth == 0 {
            return Schema {
                schema_type: Some(SchemaType::Single("string".to_string())),
                ..Default::default()
            };
        }
        let mut props = IndexMap::new();
        props.insert("field_a".to_string(), Schema {
            schema_type: Some(SchemaType::Single("integer".to_string())),
            ..Default::default()
        });
        props.insert("field_b".to_string(), Schema {
            schema_type: Some(SchemaType::Single("boolean".to_string())),
            ..Default::default()
        });
        props.insert("field_c".to_string(), build_nested(depth - 1));
        Schema {
            schema_type: Some(SchemaType::Single("object".to_string())),
            properties: Some(props),
            required: vec!["field_a".to_string()],
            ..Default::default()
        }
    }

    schemas.insert("NestedData".to_string(), build_nested(schema_depth));

    for i in 0..num_endpoints {
        let path = format!("/api/v1/resource-{}/{{id}}", i);

        let list_path = format!("/api/v1/resource-{}", i);
        paths.insert(
            list_path.clone(),
            PathItem {
                get: Some(Operation {
                    operation_id: Some(format!("listResource{}", i)),
                    tags: vec![format!("Resource{}", i)],
                    parameters: vec![
                        Parameter {
                            name: "page".to_string(),
                            location: "query".to_string(),
                            required: false,
                            schema: Some(Schema {
                                schema_type: Some(SchemaType::Single("integer".to_string())),
                                minimum: Some(1.0),
                                ..Default::default()
                            }),
                            ..Default::default()
                        },
                        Parameter {
                            name: "limit".to_string(),
                            location: "query".to_string(),
                            required: false,
                            schema: Some(Schema {
                                schema_type: Some(SchemaType::Single("integer".to_string())),
                                minimum: Some(1.0),
                                maximum: Some(100.0),
                                ..Default::default()
                            }),
                            ..Default::default()
                        },
                    ],
                    responses: {
                        let mut m = BTreeMap::new();
                        m.insert("200".to_string(), Response {
                            description: "OK".to_string(),
                            content: {
                                let mut cm = BTreeMap::new();
                                cm.insert("application/json".to_string(), MediaType {
                                    schema: Some(Schema {
                                        schema_type: Some(SchemaType::Single("object".to_string())),
                                        properties: Some({
                                            let mut m = IndexMap::new();
                                            m.insert("data".to_string(), Schema {
                                                schema_type: Some(SchemaType::Single("array".to_string())),
                                                items: Some(Box::new(Schema {
                                                    ref_path: Some("#/components/schemas/SimpleUser".to_string()),
                                                    ..Default::default()
                                                })),
                                                ..Default::default()
                                            });
                                            m.insert("nested".to_string(), Schema {
                                                ref_path: Some("#/components/schemas/NestedData".to_string()),
                                                ..Default::default()
                                            });
                                            m.insert("total".to_string(), Schema {
                                                schema_type: Some(SchemaType::Single("integer".to_string())),
                                                ..Default::default()
                                            });
                                            m
                                        }),
                                        required: vec!["data".to_string(), "total".to_string()],
                                        ..Default::default()
                                    }),
                                    ..Default::default()
                                });
                                cm
                            },
                            ..Default::default()
                        });
                        m.insert("401".to_string(), Response {
                            description: "Unauthorized".to_string(),
                            ..Default::default()
                        });
                        m.insert("429".to_string(), Response {
                            description: "Too Many Requests".to_string(),
                            ..Default::default()
                        });
                        m.insert("500".to_string(), Response {
                            description: "Internal Server Error".to_string(),
                            ..Default::default()
                        });
                        m
                    },
                    ..Default::default()
                }),
                post: Some(Operation {
                    operation_id: Some(format!("createResource{}", i)),
                    tags: vec![format!("Resource{}", i)],
                    request_body: Some(RequestBody {
                        required: true,
                        content: {
                            let mut cm = BTreeMap::new();
                            cm.insert("application/json".to_string(), MediaType {
                                schema: Some(Schema {
                                    ref_path: Some("#/components/schemas/SimpleUser".to_string()),
                                    ..Default::default()
                                }),
                                ..Default::default()
                            });
                            cm
                        },
                        ..Default::default()
                    }),
                    responses: {
                        let mut m = BTreeMap::new();
                        m.insert("201".to_string(), Response {
                            description: "Created".to_string(),
                            ..Default::default()
                        });
                        m.insert("400".to_string(), Response {
                            description: "Bad Request".to_string(),
                            ..Default::default()
                        });
                        m.insert("401".to_string(), Response {
                            description: "Unauthorized".to_string(),
                            ..Default::default()
                        });
                        m
                    },
                    ..Default::default()
                }),
                ..Default::default()
            },
        );

        paths.insert(
            path.clone(),
            PathItem {
                get: Some(Operation {
                    operation_id: Some(format!("getResource{}", i)),
                    tags: vec![format!("Resource{}", i)],
                    parameters: vec![Parameter {
                        name: "id".to_string(),
                        location: "path".to_string(),
                        required: true,
                        schema: Some(Schema {
                            schema_type: Some(SchemaType::Single("string".to_string())),
                            format: Some("uuid".to_string()),
                            ..Default::default()
                        }),
                        ..Default::default()
                    }],
                    responses: {
                        let mut m = BTreeMap::new();
                        m.insert("200".to_string(), Response {
                            description: "OK".to_string(),
                            content: {
                                let mut cm = BTreeMap::new();
                                cm.insert("application/json".to_string(), MediaType {
                                    schema: Some(Schema {
                                        ref_path: Some("#/components/schemas/SimpleUser".to_string()),
                                        ..Default::default()
                                    }),
                                    ..Default::default()
                                });
                                cm
                            },
                            ..Default::default()
                        });
                        m.insert("401".to_string(), Response {
                            description: "Unauthorized".to_string(),
                            ..Default::default()
                        });
                        m.insert("404".to_string(), Response {
                            description: "Not Found".to_string(),
                            ..Default::default()
                        });
                        m
                    },
                    ..Default::default()
                }),
                put: Some(Operation {
                    operation_id: Some(format!("updateResource{}", i)),
                    tags: vec![format!("Resource{}", i)],
                    parameters: vec![Parameter {
                        name: "id".to_string(),
                        location: "path".to_string(),
                        required: true,
                        schema: Some(Schema {
                            schema_type: Some(SchemaType::Single("string".to_string())),
                            format: Some("uuid".to_string()),
                            ..Default::default()
                        }),
                        ..Default::default()
                    }],
                    request_body: Some(RequestBody {
                        required: true,
                        content: {
                            let mut cm = BTreeMap::new();
                            cm.insert("application/json".to_string(), MediaType {
                                schema: Some(Schema {
                                    ref_path: Some("#/components/schemas/SimpleUser".to_string()),
                                    ..Default::default()
                                }),
                                ..Default::default()
                            });
                            cm
                        },
                        ..Default::default()
                    }),
                    responses: {
                        let mut m = BTreeMap::new();
                        m.insert("200".to_string(), Response {
                            description: "OK".to_string(),
                            ..Default::default()
                        });
                        m.insert("400".to_string(), Response {
                            description: "Bad Request".to_string(),
                            ..Default::default()
                        });
                        m.insert("401".to_string(), Response {
                            description: "Unauthorized".to_string(),
                            ..Default::default()
                        });
                        m.insert("404".to_string(), Response {
                            description: "Not Found".to_string(),
                            ..Default::default()
                        });
                        m
                    },
                    ..Default::default()
                }),
                delete: Some(Operation {
                    operation_id: Some(format!("deleteResource{}", i)),
                    tags: vec![format!("Resource{}", i)],
                    parameters: vec![Parameter {
                        name: "id".to_string(),
                        location: "path".to_string(),
                        required: true,
                        schema: Some(Schema {
                            schema_type: Some(SchemaType::Single("string".to_string())),
                            format: Some("uuid".to_string()),
                            ..Default::default()
                        }),
                        ..Default::default()
                    }],
                    responses: {
                        let mut m = BTreeMap::new();
                        m.insert("204".to_string(), Response {
                            description: "No Content".to_string(),
                            ..Default::default()
                        });
                        m.insert("401".to_string(), Response {
                            description: "Unauthorized".to_string(),
                            ..Default::default()
                        });
                        m.insert("404".to_string(), Response {
                            description: "Not Found".to_string(),
                            ..Default::default()
                        });
                        m
                    },
                    ..Default::default()
                }),
                ..Default::default()
            },
        );
    }

    OpenAPISpec {
        openapi: "3.0.3".to_string(),
        info: Info {
            title: "Large Benchmark API".to_string(),
            version: "1.0.0".to_string(),
            description: None,
            contact: None,
        },
        servers: vec![Server {
            url: "https://bench.api.example.com".to_string(),
            description: None,
        }],
        paths,
        components: Some(Components {
            schemas,
            ..Default::default()
        }),
        tags: vec![],
    }
}

fn modify_spec_for_diff(spec: &OpenAPISpec) -> OpenAPISpec {
    let mut modified = spec.clone();
    modified.info.version = "2.0.0".to_string();

    for (i, (_path, item)) in modified.paths.iter_mut().enumerate() {
        if i % 3 == 0 {
            if let Some(op) = &mut item.get {
                if let Some(first_param) = op.parameters.first_mut() {
                    first_param.required = true;
                }
                op.responses.remove("500");
                op.responses.insert(
                    "422".to_string(),
                    types::Response {
                        description: "Unprocessable Entity".to_string(),
                        ..Default::default()
                    },
                );
            }
        }
        if i % 5 == 0 {
            item.delete = None;
        }
    }

    if let Some(ref mut comp) = modified.components {
        if let Some(user_schema) = comp.schemas.get_mut("SimpleUser") {
            if let Some(ref mut props) = user_schema.properties {
                props.shift_remove("age");
                if let Some(role_schema) = props.get_mut("role") {
                    role_schema.enum_values = Some(vec![
                        serde_json::Value::String("admin".to_string()),
                        serde_json::Value::String("user".to_string()),
                    ]);
                }
            }
            user_schema.required.push("tags".to_string());
        }
    }

    modified
}

fn bench_small(c: &mut Criterion) {
    let old = generate_large_spec(10, 3);
    let new = modify_spec_for_diff(&old);

    let mut group = c.benchmark_group("small_specs");
    group.throughput(Throughput::Elements(1));
    group.bench_function("diff_10_endpoints", |b| {
        let detector = ChangeDetector::with_default_config();
        b.iter(|| detector.detect(&old, &new))
    });
    group.finish();
}

fn bench_medium(c: &mut Criterion) {
    let old = generate_large_spec(100, 5);
    let new = modify_spec_for_diff(&old);

    let mut group = c.benchmark_group("medium_specs");
    group.throughput(Throughput::Elements(1));
    group.sample_size(20);
    group.bench_function("diff_100_endpoints", |b| {
        let detector = ChangeDetector::with_default_config();
        b.iter(|| detector.detect(&old, &new))
    });
    group.finish();
}

fn bench_large(c: &mut Criterion) {
    let old = generate_large_spec(500, 5);
    let new = modify_spec_for_diff(&old);

    let mut group = c.benchmark_group("large_specs");
    group.throughput(Throughput::Elements(1));
    group.sample_size(10);
    group.measurement_time(std::time::Duration::from_secs(30));
    group.bench_function("diff_500_endpoints", |b| {
        let detector = ChangeDetector::with_default_config();
        b.iter(|| detector.detect(&old, &new))
    });
    group.finish();
}

fn bench_parse_large_yaml(c: &mut Criterion) {
    let spec = generate_large_spec(500, 5);
    let yaml = serde_yaml::to_string(&spec).unwrap();

    let mut group = c.benchmark_group("parser");
    group.sample_size(20);
    group.bench_function("parse_500_endpoint_yaml", |b| {
        b.iter(|| OpenAPIParser::parse_yaml(&yaml).unwrap())
    });
    group.finish();
}

fn bench_reports(c: &mut Criterion) {
    let old = generate_large_spec(100, 3);
    let new = modify_spec_for_diff(&old);
    let detector = ChangeDetector::with_default_config();
    let result = detector.detect(&old, &new);

    let mut group = c.benchmark_group("reports");
    group.sample_size(20);
    group.bench_function("generate_markdown_report", |b| {
        b.iter(|| ReportGenerator::generate(&result, ReportFormat::Markdown))
    });
    group.bench_function("generate_json_report", |b| {
        b.iter(|| ReportGenerator::generate(&result, ReportFormat::Json))
    });
    group.bench_function("generate_text_report", |b| {
        b.iter(|| ReportGenerator::generate(&result, ReportFormat::Text))
    });
    group.finish();
}

criterion_group!(
    benches,
    bench_small,
    bench_medium,
    bench_large,
    bench_parse_large_yaml,
    bench_reports
);
criterion_main!(benches);
