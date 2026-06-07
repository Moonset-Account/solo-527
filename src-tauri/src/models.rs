use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Volunteer {
    pub id: Uuid,
    pub volunteer_code: String,
    pub name: String,
    pub gender: Option<String>,
    pub age: Option<i32>,
    pub phone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_dirty: bool,
    pub dirty_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SampleRecord {
    pub id: Uuid,
    pub sample_code: String,
    pub batch_code: String,
    pub volunteer_id: Uuid,
    pub sample_type: String,
    pub collection_time: DateTime<Utc>,
    pub initial_result: Option<String>,
    pub initial_status: String,
    pub reviewer_id: Option<String>,
    pub review_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_dirty: bool,
    pub dirty_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ResampleRecord {
    pub id: Uuid,
    pub original_sample_id: Uuid,
    pub new_sample_id: Uuid,
    pub reason: String,
    pub reason_category: String,
    pub operator: String,
    pub resample_time: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ExceptionScreenshot {
    pub id: Uuid,
    pub sample_id: Uuid,
    pub screenshot_path: String,
    pub description: Option<String>,
    pub uploaded_by: String,
    pub uploaded_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SecondReview {
    pub id: Uuid,
    pub sample_id: Uuid,
    pub first_reviewer: String,
    pub first_review_result: String,
    pub first_review_time: DateTime<Utc>,
    pub second_reviewer: Option<String>,
    pub second_review_result: Option<String>,
    pub second_review_time: Option<DateTime<Utc>>,
    pub status: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchPassRate {
    pub batch_code: String,
    pub total_count: i64,
    pub pass_count: i64,
    pub pass_rate: f64,
    pub is_pending: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResampleReasonStat {
    pub reason_category: String,
    pub count: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacklogStat {
    pub total_pending: i64,
    pub pending_over_24h: i64,
    pub pending_over_72h: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SampleEvidence {
    pub sample: SampleRecord,
    pub volunteer: Volunteer,
    pub resamples: Vec<ResampleRecord>,
    pub screenshots: Vec<ExceptionScreenshot>,
    pub review_history: Vec<SecondReview>,
}
