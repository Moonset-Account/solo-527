use serde::{Deserialize, Serialize};
use std::fmt;
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
    Unknown,
}

impl fmt::Display for RiskLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RiskLevel::Low => write!(f, "low"),
            RiskLevel::Medium => write!(f, "medium"),
            RiskLevel::High => write!(f, "high"),
            RiskLevel::Critical => write!(f, "critical"),
            RiskLevel::Unknown => write!(f, "unknown"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageManager {
    Npm,
    Go,
    Cargo,
}

impl fmt::Display for PackageManager {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PackageManager::Npm => write!(f, "npm"),
            PackageManager::Go => write!(f, "go"),
            PackageManager::Cargo => write!(f, "cargo"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Dependency {
    pub name: String,
    pub version: String,
    pub license: String,
    pub license_spdx: Option<String>,
    pub source: Option<String>,
    pub source_url: Option<String>,
    pub package_manager: PackageManager,
    pub manifest_path: PathBuf,
    pub risk_level: RiskLevel,
    pub needs_review: bool,
    pub review_reason: Option<String>,
    pub is_direct: bool,
}

impl Dependency {
    pub fn key(&self) -> String {
        format!("{}/{}@{}", self.package_manager, self.name, self.version)
    }

    pub fn name_key(&self) -> String {
        format!("{}/{}", self.package_manager, self.name)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub spdx_id: String,
    pub name: String,
    pub risk_level: RiskLevel,
    pub description: String,
    pub conditions: Vec<String>,
    pub limitations: Vec<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub dependencies: Vec<Dependency>,
    pub total_count: usize,
    pub unique_count: usize,
    pub high_risk_count: usize,
    pub critical_risk_count: usize,
    pub unknown_license_count: usize,
    pub needs_review_count: usize,
    pub scanned_paths: Vec<PathBuf>,
    pub package_managers: Vec<PackageManager>,
}

impl ScanResult {
    pub fn new() -> Self {
        ScanResult {
            dependencies: Vec::new(),
            total_count: 0,
            unique_count: 0,
            high_risk_count: 0,
            critical_risk_count: 0,
            unknown_license_count: 0,
            needs_review_count: 0,
            scanned_paths: Vec::new(),
            package_managers: Vec::new(),
        }
    }
}

impl Default for ScanResult {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewItem {
    pub dependency: Dependency,
    pub reason: String,
    pub category: ReviewCategory,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ReviewCategory {
    UnknownLicense,
    UnknownSource,
    DeniedLicense,
    HighRisk,
}

impl fmt::Display for ReviewCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ReviewCategory::UnknownLicense => write!(f, "unknown_license"),
            ReviewCategory::UnknownSource => write!(f, "unknown_source"),
            ReviewCategory::DeniedLicense => write!(f, "denied_license"),
            ReviewCategory::HighRisk => write!(f, "high_risk"),
        }
    }
}
