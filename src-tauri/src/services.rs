use crate::models::*;
use sqlx::{postgres::PgPool, types::Json};
use anyhow::Result;

const MIN_SAMPLE_THRESHOLD: i64 = 30;

pub async fn get_batch_pass_rates(pool: &PgPool, include_dirty: bool) -> Result<Vec<BatchPassRate>> {
    let rows = sqlx::query!(
        r#"
        SELECT 
            batch_code,
            COUNT(*) as total_count,
            SUM(CASE WHEN initial_status = 'pass' THEN 1 ELSE 0 END) as pass_count
        FROM sample_records
        WHERE ($1 OR NOT is_dirty)
        GROUP BY batch_code
        ORDER BY batch_code DESC
        "#,
        include_dirty
    )
    .fetch_all(pool)
    .await?;

    let mut result = Vec::new();
    for row in rows {
        let total_count = row.total_count.unwrap_or(0);
        let pass_count = row.pass_count.unwrap_or(0);
        let pass_rate = if total_count > 0 {
            pass_count as f64 / total_count as f64
        } else {
            0.0
        };
        result.push(BatchPassRate {
            batch_code: row.batch_code,
            total_count,
            pass_count,
            pass_rate,
            is_pending: total_count < MIN_SAMPLE_THRESHOLD,
        });
    }
    Ok(result)
}

pub async fn get_resample_reason_stats(pool: &PgPool) -> Result<Vec<ResampleReasonStat>> {
    let total: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM resample_records")
        .fetch_one(pool)
        .await?
        .unwrap_or(0);

    let rows = sqlx::query!(
        r#"
        SELECT reason_category, COUNT(*) as count
        FROM resample_records
        GROUP BY reason_category
        ORDER BY count DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    let mut result = Vec::new();
    for row in rows {
        let count = row.count.unwrap_or(0);
        let percentage = if total > 0 {
            count as f64 / total as f64 * 100.0
        } else {
            0.0
        };
        result.push(ResampleReasonStat {
            reason_category: row.reason_category,
            count,
            percentage,
        });
    }
    Ok(result)
}

pub async fn get_backlog_stats(pool: &PgPool) -> Result<BacklogStat> {
    let row = sqlx::query!(
        r#"
        SELECT 
            COUNT(*) as total_pending,
            SUM(CASE 
                WHEN NOW() - first_review_time > INTERVAL '24 hours' 
                AND NOW() - first_review_time <= INTERVAL '72 hours'
                THEN 1 ELSE 0 
            END) as pending_over_24h,
            SUM(CASE 
                WHEN NOW() - first_review_time > INTERVAL '72 hours' 
                THEN 1 ELSE 0 
            END) as pending_over_72h
        FROM second_reviews
        WHERE status = 'pending'
        "#
    )
    .fetch_one(pool)
    .await?;

    Ok(BacklogStat {
        total_pending: row.total_pending.unwrap_or(0),
        pending_over_24h: row.pending_over_24h.unwrap_or(0),
        pending_over_72h: row.pending_over_72h.unwrap_or(0),
    })
}

pub async fn get_sample_evidence(pool: &PgPool, sample_id: &str) -> Result<Option<SampleEvidence>> {
    use uuid::Uuid;
    let sample_uuid = Uuid::parse_str(sample_id)?;

    let sample = sqlx::query_as!(SampleRecord,
        "SELECT * FROM sample_records WHERE id = $1", sample_uuid
    )
    .fetch_optional(pool)
    .await?;

    if sample.is_none() {
        return Ok(None);
    }
    let sample = sample.unwrap();

    let volunteer = sqlx::query_as!(Volunteer,
        "SELECT * FROM volunteers WHERE id = $1", sample.volunteer_id
    )
    .fetch_one(pool)
    .await?;

    let resamples = sqlx::query_as!(ResampleRecord,
        "SELECT * FROM resample_records WHERE original_sample_id = $1 OR new_sample_id = $1", sample_uuid
    )
    .fetch_all(pool)
    .await?;

    let screenshots = sqlx::query_as!(ExceptionScreenshot,
        "SELECT * FROM exception_screenshots WHERE sample_id = $1 ORDER BY uploaded_at DESC", sample_uuid
    )
    .fetch_all(pool)
    .await?;

    let review_history = sqlx::query_as!(SecondReview,
        "SELECT * FROM second_reviews WHERE sample_id = $1 ORDER BY created_at DESC", sample_uuid
    )
    .fetch_all(pool)
    .await?;

    Ok(Some(SampleEvidence {
        sample,
        volunteer,
        resamples,
        screenshots,
        review_history,
    }))
}

pub async fn mark_sample_dirty(pool: &PgPool, sample_id: &str, reason: &str) -> Result<()> {
    use uuid::Uuid;
    let sample_uuid = Uuid::parse_str(sample_id)?;
    
    sqlx::query!(
        "UPDATE sample_records SET is_dirty = true, dirty_reason = $1, updated_at = NOW() WHERE id = $2",
        reason, sample_uuid
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_pending_second_reviews(pool: &PgPool, only_overdue: bool) -> Result<Vec<SecondReview>> {
    let query = if only_overdue {
        sqlx::query_as!(SecondReview,
            r#"
            SELECT * FROM second_reviews 
            WHERE status = 'pending' 
            AND NOW() - first_review_time > INTERVAL '24 hours'
            ORDER BY first_review_time ASC
            "#
        )
    } else {
        sqlx::query_as!(SecondReview,
            r#"
            SELECT * FROM second_reviews 
            WHERE status = 'pending'
            ORDER BY first_review_time ASC
            "#
        )
    };
    let results = query.fetch_all(pool).await?;
    Ok(results)
}
