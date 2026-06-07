use crate::services::*;
use crate::models::*;
use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportFilterParams {
    pub batch_codes: Option<Vec<String>>,
    pub status_filter: Option<String>,
    pub include_dirty: bool,
    pub date_range_start: Option<String>,
    pub date_range_end: Option<String>,
    pub min_sample_threshold: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportReport {
    pub generated_at: String,
    pub filter_params: ExportFilterParams,
    pub batch_pass_rates: Vec<BatchPassRate>,
    pub resample_reason_stats: Vec<ResampleReasonStat>,
    pub backlog_stats: BacklogStat,
    pub samples: Vec<SampleExport>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SampleExport {
    pub sample_code: String,
    pub batch_code: String,
    pub volunteer_code: String,
    pub volunteer_name: String,
    pub sample_type: String,
    pub initial_status: String,
    pub collection_time: String,
    pub is_dirty: bool,
    pub dirty_reason: Option<String>,
    pub has_resample: bool,
    pub review_status: Option<String>,
}

pub async fn export_csv_report(
    pool: &PgPool,
    filter_params: ExportFilterParams,
    file_path: &PathBuf,
) -> Result<usize> {
    let mut query = String::from(
        r#"
        SELECT 
            s.sample_code,
            s.batch_code,
            v.volunteer_code,
            v.name as volunteer_name,
            s.sample_type,
            s.initial_status,
            s.collection_time::text as collection_time,
            s.is_dirty,
            s.dirty_reason,
            EXISTS(SELECT 1 FROM resample_records r WHERE r.original_sample_id = s.id) as has_resample,
            sr.status as review_status
        FROM sample_records s
        JOIN volunteers v ON s.volunteer_id = v.id
        LEFT JOIN second_reviews sr ON sr.sample_id = s.id
        WHERE 1=1
        "#,
    );

    if !filter_params.include_dirty {
        query.push_str(" AND NOT s.is_dirty");
    }
    if let Some(batches) = &filter_params.batch_codes {
        if !batches.is_empty() {
            let placeholders: Vec<String> = batches.iter().map(|_| format!("'{}'", _)).collect();
            query.push_str(&format!(" AND s.batch_code IN ({})", placeholders.join(", ")));
        }
    }
    if let Some(status) = &filter_params.status_filter {
        query.push_str(&format!(" AND s.initial_status = '{}'", status));
    }
    if let Some(start) = &filter_params.date_range_start {
        query.push_str(&format!(" AND s.collection_time >= '{}'", start));
    }
    if let Some(end) = &filter_params.date_range_end {
        query.push_str(&format!(" AND s.collection_time <= '{}'", end));
    }

    query.push_str(" ORDER BY s.batch_code, s.sample_code");

    let samples: Vec<SampleExport> = sqlx::query_as(&query).fetch_all(pool).await?;

    let batch_pass_rates = get_batch_pass_rates(pool, filter_params.include_dirty).await?;
    let resample_reason_stats = get_resample_reason_stats(pool).await?;
    let backlog_stats = get_backlog_stats(pool).await?;

    let report = ExportReport {
        generated_at: Utc::now().to_rfc3339(),
        filter_params,
        batch_pass_rates,
        resample_reason_stats,
        backlog_stats,
        samples: samples.clone(),
    };

    let mut wtr = csv::Writer::from_path(file_path)?;
    
    wtr.write_record([
        "报告生成时间",
        &report.generated_at,
        "", "", "", "", "", "", "", "", "", ""
    ])?;
    wtr.write_record([
        "筛选参数",
        &serde_json::to_string(&report.filter_params)?,
        "", "", "", "", "", "", "", "", "", ""
    ])?;
    wtr.write_record([])?;
    
    wtr.write_record(["=== 批次通过率统计 ==="])?;
    wtr.write_record(["批次号", "样本总数", "通过数", "通过率", "状态"])?;
    for b in &report.batch_pass_rates {
        let status = if b.is_pending { "待观察" } else { "正常" };
        wtr.write_record([
            &b.batch_code,
            &b.total_count.to_string(),
            &b.pass_count.to_string(),
            &format!("{:.2}%", b.pass_rate * 100.0),
            status,
        ])?;
    }
    wtr.write_record([])?;

    wtr.write_record(["=== 补样原因统计 ==="])?;
    wtr.write_record(["原因分类", "数量", "占比"])?;
    for r in &report.resample_reason_stats {
        wtr.write_record([
            &r.reason_category,
            &r.count.to_string(),
            &format!("{:.2}%", r.percentage),
        ])?;
    }
    wtr.write_record([])?;

    wtr.write_record(["=== 二审积压统计 ==="])?;
    wtr.write_record(["待二审总数", "超24小时", "超72小时"])?;
    wtr.write_record([
        &report.backlog_stats.total_pending.to_string(),
        &report.backlog_stats.pending_over_24h.to_string(),
        &report.backlog_stats.pending_over_72h.to_string(),
    ])?;
    wtr.write_record([])?;

    wtr.write_record(["=== 样本明细 ==="])?;
    wtr.write_record([
        "样本编号", "批次号", "志愿者编号", "姓名", "样本类型",
        "初检状态", "采集时间", "是否脏数据", "脏数据原因", "是否补样", "二审状态"
    ])?;
    for s in &samples {
        wtr.write_record([
            &s.sample_code,
            &s.batch_code,
            &s.volunteer_code,
            &s.volunteer_name,
            &s.sample_type,
            &s.initial_status,
            &s.collection_time,
            &s.is_dirty.to_string(),
            s.dirty_reason.as_deref().unwrap_or(""),
            &s.has_resample.to_string(),
            s.review_status.as_deref().unwrap_or(""),
        ])?;
    }
    wtr.flush()?;

    Ok(samples.len())
}
