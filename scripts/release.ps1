#!/usr/bin/env pwsh
#
# git-brclean Windows 发布脚本
# 用法: .\scripts\release.ps1 -Version 0.1.0

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $ProjectDir "dist"
$BinaryName = "git-brclean"

Write-Host "=== Building $BinaryName v$Version ==="
Write-Host "Project: $ProjectDir"
Write-Host "Output:  $DistDir"
Write-Host ""

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir | Out-Null
}

Write-Host "Building release binary..."
cargo build --release

$ArchiveName = "$BinaryName-$Version-x86_64-windows"
$ArchiveDir = Join-Path $DistDir $ArchiveName

if (Test-Path $ArchiveDir) {
    Remove-Item -Recurse -Force $ArchiveDir
}
New-Item -ItemType Directory -Path $ArchiveDir | Out-Null

Copy-Item "target\release\$BinaryName.exe" (Join-Path $ArchiveDir "$BinaryName.exe")
if (Test-Path (Join-Path $ProjectDir "README.md")) {
    Copy-Item (Join-Path $ProjectDir "README.md") (Join-Path $ArchiveDir "README.md")
}
if (Test-Path (Join-Path $ProjectDir "LICENSE")) {
    Copy-Item (Join-Path $ProjectDir "LICENSE") (Join-Path $ArchiveDir "LICENSE")
}

$ZipPath = Join-Path $DistDir "$ArchiveName.zip"
if (Test-Path $ZipPath) {
    Remove-Item -Force $ZipPath
}
Compress-Archive -Path $ArchiveDir -DestinationPath $ZipPath

Write-Host ""
Write-Host "=== Verification ==="
& "target\release\$BinaryName.exe" --version

Write-Host ""
Write-Host "Release artifacts in: $DistDir"
Get-ChildItem $DistDir | Format-Table Name, Length

Write-Host ""
Write-Host "Done."
