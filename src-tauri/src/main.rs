#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;
mod services;
mod sync;
mod export;

use db::DbPool;
use export::ExportFilterParams;
use std::sync::Mutex;
use tauri::State;
use std::path::PathBuf;

struct AppState {
    db_pool: Mutex<Option<DbPool>>,
}

#[tauri::command]
async fn init_database(state: State<'_, AppState>) -> Result<String, String> {
    let database_url = db::get_database_url();
    match db::create_pool(&database_url).await {
        Ok(pool) => {
            *state.db_pool.lock().unwrap() = Some(pool);
            Ok("数据库连接成功".to_string())
        }
        Err(e) => Err(format!("数据库连接失败: {}", e)),
    }
}

#[tauri::command]
async fn get_batch_pass_rates(state: State<'_, AppState>, include_dirty: bool) -> Result<serde_json::Value, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match services::get_batch_pass_rates(pool, include_dirty).await {
        Ok(data) => Ok(serde_json::to_value(data).map_err(|e| e.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_resample_reason_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match services::get_resample_reason_stats(pool).await {
        Ok(data) => Ok(serde_json::to_value(data).map_err(|e| e.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_backlog_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match services::get_backlog_stats(pool).await {
        Ok(data) => Ok(serde_json::to_value(data).map_err(|e| e.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_sample_evidence(state: State<'_, AppState>, sample_id: String) -> Result<serde_json::Value, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match services::get_sample_evidence(pool, &sample_id).await {
        Ok(data) => Ok(serde_json::to_value(data).map_err(|e| e.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn mark_sample_dirty(state: State<'_, AppState>, sample_id: String, reason: String) -> Result<String, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match services::mark_sample_dirty(pool, &sample_id, &reason).await {
        Ok(_) => Ok("标记成功".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_pending_second_reviews(state: State<'_, AppState>, only_overdue: bool) -> Result<serde_json::Value, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match services::get_pending_second_reviews(pool, only_overdue).await {
        Ok(data) => Ok(serde_json::to_value(data).map_err(|e| e.to_string())?),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn export_offline_bundle(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    match sync::export_offline_bundle(app, pool).await {
        Ok(path) => Ok(path.to_string_lossy().to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn import_offline_bundle(state: State<'_, AppState>, file_path: String) -> Result<usize, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    let path = PathBuf::from(file_path);
    match sync::import_offline_bundle(pool, &path).await {
        Ok(count) => Ok(count),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn export_csv_report(state: State<'_, AppState>, filter_params: ExportFilterParams, file_path: String) -> Result<usize, String> {
    let pool_guard = state.db_pool.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("数据库未初始化")?;
    let path = PathBuf::from(file_path);
    match export::export_csv_report(pool, filter_params, &path).await {
        Ok(count) => Ok(count),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            db_pool: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            init_database,
            get_batch_pass_rates,
            get_resample_reason_stats,
            get_backlog_stats,
            get_sample_evidence,
            mark_sample_dirty,
            get_pending_second_reviews,
            export_offline_bundle,
            import_offline_bundle,
            export_csv_report,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
