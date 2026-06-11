use std::path::{Path, PathBuf};

pub fn normalize_path(path: &Path) -> PathBuf {
    dunce::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

pub fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub fn config_dir() -> PathBuf {
    if let Some(dir) = std::env::var_os("GIT_BRCLEAN_CONFIG_DIR") {
        PathBuf::from(dir)
    } else if cfg!(windows) {
        if let Some(appdata) = std::env::var_os("APPDATA") {
            PathBuf::from(appdata).join("git-brclean")
        } else {
            PathBuf::from(".").join(".git-brclean")
        }
    } else {
        if let Some(home) = std::env::var_os("HOME") {
            PathBuf::from(home).join(".config").join("git-brclean")
        } else {
            PathBuf::from(".").join(".git-brclean")
        }
    }
}

pub fn cache_dir() -> PathBuf {
    if let Some(dir) = std::env::var_os("GIT_BRCLEAN_CACHE_DIR") {
        PathBuf::from(dir)
    } else if cfg!(windows) {
        if let Some(localappdata) = std::env::var_os("LOCALAPPDATA") {
            PathBuf::from(localappdata).join("git-brclean").join("cache")
        } else {
            PathBuf::from(".").join(".git-brclean").join("cache")
        }
    } else {
        if let Some(cache) = std::env::var_os("XDG_CACHE_HOME") {
            PathBuf::from(cache).join("git-brclean")
        } else if let Some(home) = std::env::var_os("HOME") {
            PathBuf::from(home).join(".cache").join("git-brclean")
        } else {
            PathBuf::from(".").join(".git-brclean").join("cache")
        }
    }
}

pub fn rollback_dir() -> PathBuf {
    cache_dir().join("rollback")
}

pub fn log_dir() -> PathBuf {
    if let Some(dir) = std::env::var_os("GIT_BRCLEAN_LOG_DIR") {
        PathBuf::from(dir)
    } else {
        cache_dir().join("logs")
    }
}

pub fn ensure_dir(path: &Path) -> std::io::Result<()> {
    if !path.exists() {
        std::fs::create_dir_all(path)?;
    }
    Ok(())
}

pub fn is_windows() -> bool {
    cfg!(windows)
}

pub fn is_macos() -> bool {
    cfg!(target_os = "macos")
}

pub fn is_linux() -> bool {
    cfg!(target_os = "linux")
}

pub fn platform_name() -> &'static str {
    if cfg!(windows) {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

pub fn exe_name(name: &str) -> String {
    if cfg!(windows) {
        format!("{}.exe", name)
    } else {
        name.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exe_name() {
        let name = exe_name("git-brclean");
        if cfg!(windows) {
            assert_eq!(name, "git-brclean.exe");
        } else {
            assert_eq!(name, "git-brclean");
        }
    }

    #[test]
    fn test_platform_name() {
        let platform = platform_name();
        assert!(!platform.is_empty());
    }

    #[test]
    fn test_config_dir_returns_something() {
        let dir = config_dir();
        assert!(!dir.as_os_str().is_empty());
    }

    #[test]
    fn test_path_to_string_normalizes_slashes() {
        let path = PathBuf::from("foo\\bar\\baz");
        let s = path_to_string(&path);
        assert!(!s.contains('\\'));
    }
}
