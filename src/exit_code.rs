pub enum ExitCode {
    Success = 0,
    PartialFailure = 1,
    FatalError = 2,
}

impl From<ExitCode> for i32 {
    fn from(code: ExitCode) -> i32 {
        code as i32
    }
}

impl ExitCode {
    pub fn from_results(_success: usize, failed: usize) -> Self {
        if failed == 0 {
            ExitCode::Success
        } else {
            ExitCode::PartialFailure
        }
    }
}
