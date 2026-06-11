use crate::error::AppError;
use crate::types::FailedTestCase;
use chrono::{DateTime, Utc};
use quick_xml::events::Event;
use quick_xml::Reader;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
struct RawFailure {
    message: String,
    failure_type: String,
    text: String,
}

#[derive(Debug, Clone)]
struct RawTestCase {
    name: String,
    classname: String,
    timestamp: Option<DateTime<Utc>>,
    failure: Option<RawFailure>,
}

fn parse_junit_dir(dir: &Path) -> Result<Vec<RawTestCase>, AppError> {
    let mut results = Vec::new();
    let xml_files = collect_xml_files(dir)?;

    if xml_files.is_empty() {
        return Err(AppError::NoJunitFiles {
            path: dir.display().to_string(),
        });
    }

    for xml_path in &xml_files {
        match parse_junit_file(xml_path) {
            Ok(cases) => results.extend(cases),
            Err(e) => {
                return Err(AppError::JunitParse {
                    path: xml_path.display().to_string(),
                    message: e.to_string(),
                });
            }
        }
    }

    Ok(results)
}

fn collect_xml_files(dir: &Path) -> Result<Vec<PathBuf>, AppError> {
    let mut files = Vec::new();
    for entry in walkdir::WalkDir::new(dir) {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("xml") {
            files.push(path.to_path_buf());
        }
    }
    files.sort();
    Ok(files)
}

fn parse_junit_file(path: &Path) -> Result<Vec<RawTestCase>, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    let mut reader = Reader::from_str(&content);
    reader.config_mut().trim_text(true);

    let mut cases: Vec<RawTestCase> = Vec::new();
    let mut current_testcase: Option<RawTestCase> = None;
    let mut current_failure: Option<RawFailure> = None;
    let mut in_failure = false;
    let mut failure_text_buf = String::new();
    let mut testsuite_timestamp: Option<DateTime<Utc>> = None;

    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) | Ok(Event::Empty(e)) => {
                let local_name = e.local_name();
                let tag = String::from_utf8_lossy(local_name.as_ref());

                match tag.as_ref() {
                    "testsuite" => {
                        for attr in e.attributes().flatten() {
                            if attr.key.local_name().as_ref() == b"timestamp" {
                                let val = String::from_utf8_lossy(&attr.value);
                                testsuite_timestamp = DateTime::parse_from_rfc3339(&val)
                                    .ok()
                                    .map(|dt| dt.with_timezone(&Utc));
                            }
                        }
                    }
                    "testcase" => {
                        let mut name = String::new();
                        let mut classname = String::new();
                        for attr in e.attributes().flatten() {
                            match attr.key.local_name().as_ref() {
                                b"name" => name = String::from_utf8_lossy(&attr.value).into(),
                                b"classname" => {
                                    classname = String::from_utf8_lossy(&attr.value).into()
                                }
                                _ => {}
                            }
                        }
                        current_testcase = Some(RawTestCase {
                            name,
                            classname,
                            timestamp: testsuite_timestamp,
                            failure: None,
                        });
                    }
                    "failure" | "error" => {
                        let mut message = String::new();
                        let mut failure_type = String::new();
                        for attr in e.attributes().flatten() {
                            match attr.key.local_name().as_ref() {
                                b"message" => {
                                    message = String::from_utf8_lossy(&attr.value).into()
                                }
                                b"type" => {
                                    failure_type = String::from_utf8_lossy(&attr.value).into()
                                }
                                _ => {}
                            }
                        }
                        current_failure = Some(RawFailure {
                            message,
                            failure_type,
                            text: String::new(),
                        });
                        in_failure = true;
                        failure_text_buf.clear();
                    }
                    _ => {}
                }
            }
            Ok(Event::Text(e)) => {
                if in_failure {
                    failure_text_buf.push_str(&e.unescape().unwrap_or_default());
                }
            }
            Ok(Event::End(e)) => {
                let local_name = e.local_name();
                let tag = String::from_utf8_lossy(local_name.as_ref());

                match tag.as_ref() {
                    "failure" | "error" => {
                        if let Some(ref mut f) = current_failure {
                            f.text = failure_text_buf.trim().to_string();
                        }
                        in_failure = false;
                    }
                    "testcase" => {
                        if let Some(mut tc) = current_testcase.take() {
                            tc.failure = current_failure.take();
                            cases.push(tc);
                        }
                    }
                    _ => {}
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(Box::new(e)),
            _ => {}
        }
        buf.clear();
    }

    Ok(cases)
}

pub fn collect_failed_test_cases(
    dir: &Path,
    test_file_base: &Path,
) -> Result<Vec<FailedTestCase>, AppError> {
    let raw_cases = parse_junit_dir(dir)?;

    let failed: Vec<FailedTestCase> = raw_cases
        .into_iter()
        .filter(|c| c.failure.is_some())
        .map(|c| {
            let f = c.failure.unwrap();
            let test_file = derive_test_file_path(&c.classname, &c.name, test_file_base);
            FailedTestCase {
                name: c.name,
                classname: c.classname,
                test_file,
                failure_message: f.message,
                failure_type: f.failure_type,
                failure_text: f.text,
                timestamp: c.timestamp,
                screenshot_paths: Vec::new(),
            }
        })
        .collect();

    Ok(failed)
}

fn derive_test_file_path(classname: &str, name: &str, base: &Path) -> PathBuf {
    let class_path = classname.replace('.', std::path::MAIN_SEPARATOR_STR);
    let mut path = base.join(&class_path);
    let file_name = format!("{}.test.{}", name, "ts");
    path.set_file_name(file_name);
    path
}
