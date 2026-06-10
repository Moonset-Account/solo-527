use thiserror::Error;

#[derive(Debug, Error)]
pub enum Note2TaskError {
    #[error("IO错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("路径无效: {path}")]
    InvalidPath { path: String },

    #[error("未找到Markdown文件: {0}")]
    NoMarkdownFiles(String),

    #[error("日期格式错误: {input}, 应为 YYYY-MM-DD")]
    InvalidDateFormat { input: String },

    #[error("解析错误: {message} (文件: {file}, 行: {line})")]
    ParseError {
        message: String,
        file: String,
        line: usize,
    },

    #[error("导出格式不支持: {0}")]
    UnsupportedExportFormat(String),

    #[error("标签格式错误: {0}, 标签不应包含空格或特殊字符")]
    InvalidTagFormat(String),

    #[error("写入文件失败: {path}, 原因: {reason}")]
    WriteError { path: String, reason: String },

    #[error("读取文件失败: {path}, 原因: {reason}")]
    ReadError { path: String, reason: String },

    #[error("JSON序列化错误: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Shell补全生成失败: {0}")]
    CompletionError(String),

    #[error("未知错误: {0}")]
    Other(String),
}

pub type Result<T> = std::result::Result<T, Note2TaskError>;

pub fn exit_code(err: &Note2TaskError) -> i32 {
    match err {
        Note2TaskError::Io(_) => 1,
        Note2TaskError::InvalidPath { .. } => 2,
        Note2TaskError::NoMarkdownFiles(_) => 3,
        Note2TaskError::InvalidDateFormat { .. } => 4,
        Note2TaskError::ParseError { .. } => 5,
        Note2TaskError::UnsupportedExportFormat(_) => 6,
        Note2TaskError::InvalidTagFormat(_) => 7,
        Note2TaskError::WriteError { .. } => 8,
        Note2TaskError::ReadError { .. } => 9,
        Note2TaskError::JsonError(_) => 10,
        Note2TaskError::CompletionError(_) => 11,
        Note2TaskError::Other(_) => 99,
    }
}

pub const EXIT_SUCCESS: i32 = 0;
pub const EXIT_NOTHING_TO_DO: i32 = 0;
