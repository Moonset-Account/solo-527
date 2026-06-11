use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("JUnit XML parse error in {path}: {message}")]
    JunitParse { path: String, message: String },

    #[error("Screenshot directory not found: {path}")]
    ScreenshotDirMissing { path: String },

    #[error("History file read error in {path}: {message}")]
    HistoryRead { path: String, message: String },

    #[error("History file parse error in {path}: {message}")]
    HistoryParse { path: String, message: String },

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Walk error: {0}")]
    Walk(#[from] walkdir::Error),

    #[error("No JUnit XML files found in {path}")]
    NoJunitFiles { path: String },
}

impl AppError {
    pub fn is_severe(&self) -> bool {
        matches!(
            self,
            AppError::JunitParse { .. }
                | AppError::NoJunitFiles { .. }
                | AppError::Io(_)
                | AppError::Walk(_)
        )
    }
}
