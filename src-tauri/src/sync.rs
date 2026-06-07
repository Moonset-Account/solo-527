use crate::db::DbPool;
use crate::models::*;
use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::Manager;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncRecord {
    pub table_name: String,
    pub record_id: Uuid,
    pub operation: String,
    pub timestamp: DateTime<Utc>,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncBundle {
    pub sync_id: Uuid,
    pub generated_at: DateTime<Utc>,
    pub records: Vec<SyncRecord>,
}

pub fn get_sync_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| anyhow::anyhow!("无法获取应用数据目录"))?;
    let sync_dir = app_dir.join("offline_sync");
    std::fs::create_dir_all(&sync_dir)?;
    Ok(sync_dir)
}

pub async fn export_offline_bundle(app_handle: tauri::AppHandle, pool: &PgPool) -> Result<PathBuf> {
    let volunteers: Vec<Volunteer> = sqlx::query_as!(Volunteer, "SELECT * FROM volunteers")
        .fetch_all(pool)
        .await?;
    let samples: Vec<SampleRecord> = sqlx::query_as!(SampleRecord, "SELECT * FROM sample_records")
        .fetch_all(pool)
        .await?;
    let resamples: Vec<ResampleRecord> = sqlx::query_as!(ResampleRecord, "SELECT * FROM resample_records")
        .fetch_all(pool)
        .await?;
    let screenshots: Vec<ExceptionScreenshot> = sqlx::query_as!(ExceptionScreenshot, "SELECT * FROM exception_screenshots")
        .fetch_all(pool)
        .await?;
    let reviews: Vec<SecondReview> = sqlx::query_as!(SecondReview, "SELECT * FROM second_reviews")
        .fetch_all(pool)
        .await?;

    let mut records = Vec::new();
    for v in volunteers {
        records.push(SyncRecord {
            table_name: "volunteers".to_string(),
            record_id: v.id,
            operation: "upsert".to_string(),
            timestamp: Utc::now(),
            data: serde_json::to_value(v)?,
        });
    }
    for s in samples {
        records.push(SyncRecord {
            table_name: "sample_records".to_string(),
            record_id: s.id,
            operation: "upsert".to_string(),
            timestamp: Utc::now(),
            data: serde_json::to_value(s)?,
        });
    }
    for r in resamples {
        records.push(SyncRecord {
            table_name: "resample_records".to_string(),
            record_id: r.id,
            operation: "upsert".to_string(),
            timestamp: Utc::now(),
            data: serde_json::to_value(r)?,
        });
    }
    for s in screenshots {
        records.push(SyncRecord {
            table_name: "exception_screenshots".to_string(),
            record_id: s.id,
            operation: "upsert".to_string(),
            timestamp: Utc::now(),
            data: serde_json::to_value(s)?,
        });
    }
    for r in reviews {
        records.push(SyncRecord {
            table_name: "second_reviews".to_string(),
            record_id: r.id,
            operation: "upsert".to_string(),
            timestamp: Utc::now(),
            data: serde_json::to_value(r)?,
        });
    }

    let bundle = SyncBundle {
        sync_id: Uuid::new_v4(),
        generated_at: Utc::now(),
        records,
    };

    let sync_dir = get_sync_dir(&app_handle)?;
    let filename = format!("sync_bundle_{}.json", bundle.generated_at.format("%Y%m%d_%H%M%S"));
    let file_path = sync_dir.join(&filename);
    
    let json_str = serde_json::to_string_pretty(&bundle)?;
    std::fs::write(&file_path, json_str)?;
    
    Ok(file_path)
}

pub async fn import_offline_bundle(pool: &PgPool, file_path: &Path) -> Result<usize> {
    let content = std::fs::read_to_string(file_path)?;
    let bundle: SyncBundle = serde_json::from_str(&content)?;
    
    let mut count = 0;
    for record in bundle.records {
        match record.table_name.as_str() {
            "volunteers" => {
                let v: Volunteer = serde_json::from_value(record.data)?;
                sqlx::query!(
                    r#"
                    INSERT INTO volunteers (id, volunteer_code, name, gender, age, phone, created_at, updated_at, is_dirty, dirty_reason)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (id) DO UPDATE SET
                        volunteer_code = EXCLUDED.volunteer_code,
                        name = EXCLUDED.name,
                        gender = EXCLUDED.gender,
                        age = EXCLUDED.age,
                        phone = EXCLUDED.phone,
                        updated_at = EXCLUDED.updated_at,
                        is_dirty = EXCLUDED.is_dirty,
                        dirty_reason = EXCLUDED.dirty_reason
                    "#,
                    v.id, v.volunteer_code, v.name, v.gender, v.age, v.phone, v.created_at, v.updated_at, v.is_dirty, v.dirty_reason
                ).execute(pool).await?;
                count += 1;
            }
            "sample_records" => {
                let s: SampleRecord = serde_json::from_value(record.data)?;
                sqlx::query!(
                    r#"
                    INSERT INTO sample_records (id, sample_code, batch_code, volunteer_id, sample_type, collection_time, initial_result, initial_status, reviewer_id, review_time, created_at, updated_at, is_dirty, dirty_reason)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (id) DO UPDATE SET
                        sample_code = EXCLUDED.sample_code,
                        batch_code = EXCLUDED.batch_code,
                        volunteer_id = EXCLUDED.volunteer_id,
                        sample_type = EXCLUDED.sample_type,
                        collection_time = EXCLUDED.collection_time,
                        initial_result = EXCLUDED.initial_result,
                        initial_status = EXCLUDED.initial_status,
                        reviewer_id = EXCLUDED.reviewer_id,
                        review_time = EXCLUDED.review_time,
                        updated_at = EXCLUDED.updated_at,
                        is_dirty = EXCLUDED.is_dirty,
                        dirty_reason = EXCLUDED.dirty_reason
                    "#,
                    s.id, s.sample_code, s.batch_code, s.volunteer_id, s.sample_type, s.collection_time, s.initial_result, s.initial_status, s.reviewer_id, s.review_time, s.created_at, s.updated_at, s.is_dirty, s.dirty_reason
                ).execute(pool).await?;
                count += 1;
            }
            "resample_records" => {
                let r: ResampleRecord = serde_json::from_value(record.data)?;
                sqlx::query!(
                    r#"
                    INSERT INTO resample_records (id, original_sample_id, new_sample_id, reason, reason_category, operator, resample_time, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (id) DO UPDATE SET
                        original_sample_id = EXCLUDED.original_sample_id,
                        new_sample_id = EXCLUDED.new_sample_id,
                        reason = EXCLUDED.reason,
                        reason_category = EXCLUDED.reason_category,
                        operator = EXCLUDED.operator,
                        resample_time = EXCLUDED.resample_time,
                        updated_at = EXCLUDED.updated_at
                    "#,
                    r.id, r.original_sample_id, r.new_sample_id, r.reason, r.reason_category, r.operator, r.resample_time, r.created_at, r.updated_at
                ).execute(pool).await?;
                count += 1;
            }
            "exception_screenshots" => {
                let s: ExceptionScreenshot = serde_json::from_value(record.data)?;
                sqlx::query!(
                    r#"
                    INSERT INTO exception_screenshots (id, sample_id, screenshot_path, description, uploaded_by, uploaded_at, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO UPDATE SET
                        sample_id = EXCLUDED.sample_id,
                        screenshot_path = EXCLUDED.screenshot_path,
                        description = EXCLUDED.description,
                        uploaded_by = EXCLUDED.uploaded_by,
                        uploaded_at = EXCLUDED.uploaded_at
                    "#,
                    s.id, s.sample_id, s.screenshot_path, s.description, s.uploaded_by, s.uploaded_at, s.created_at
                ).execute(pool).await?;
                count += 1;
            }
            "second_reviews" => {
                let r: SecondReview = serde_json::from_value(record.data)?;
                sqlx::query!(
                    r#"
                    INSERT INTO second_reviews (id, sample_id, first_reviewer, first_review_result, first_review_time, second_reviewer, second_review_result, second_review_time, status, comment, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (id) DO UPDATE SET
                        sample_id = EXCLUDED.sample_id,
                        first_reviewer = EXCLUDED.first_reviewer,
                        first_review_result = EXCLUDED.first_review_result,
                        first_review_time = EXCLUDED.first_review_time,
                        second_reviewer = EXCLUDED.second_reviewer,
                        second_review_result = EXCLUDED.second_review_result,
                        second_review_time = EXCLUDED.second_review_time,
                        status = EXCLUDED.status,
                        comment = EXCLUDED.comment,
                        updated_at = EXCLUDED.updated_at
                    "#,
                    r.id, r.sample_id, r.first_reviewer, r.first_review_result, r.first_review_time, r.second_reviewer, r.second_review_result, r.second_review_time, r.status, r.comment, r.created_at, r.updated_at
                ).execute(pool).await?;
                count += 1;
            }
            _ => {}
        }
    }
    Ok(count)
}
