pub mod npm;
pub mod go;
pub mod cargo;

use crate::models::Dependency;
use crate::config::ScanOptions;
use std::path::Path;
use anyhow::Result;

pub trait PackageParser {
    fn can_parse(&self, path: &Path) -> bool;
    fn parse(&self, path: &Path, options: &ScanOptions) -> Result<Vec<Dependency>>;
    fn name(&self) -> &'static str;
}

pub fn get_all_parsers() -> Vec<Box<dyn PackageParser + Send + Sync>> {
    vec![
        Box::new(npm::NpmParser),
        Box::new(go::GoParser),
        Box::new(cargo::CargoParser),
    ]
}
