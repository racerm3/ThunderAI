# ThunderAI packaging script for Thunderbird WebExtension
# This script creates an installable .xpi (zip-compressed) file for Thunderbird.

$ErrorActionPreference = "Stop"

# Get current directory
$srcDir = Get-Location

# Path to manifest.json
$manifestPath = Join-Path $srcDir "manifest.json"

if (-not (Test-Path $manifestPath)) {
    Write-Error "manifest.json not found in the current directory!"
    Exit 1
}

# Read version from manifest.json
Write-Host "Reading manifest.json..." -ForegroundColor Cyan
$manifestContent = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifestContent.version

if (-not $version) {
    Write-Error "Could not parse version from manifest.json!"
    Exit 1
}

# Define the package name
$xpiName = "thunderai-$version.xpi"
$xpiPath = Join-Path $srcDir $xpiName

# Clean old packages if they exist
if (Test-Path $xpiPath) { Remove-Item $xpiPath }

# Define files and folders to include
$includes = @(
    "_locales",
    "api_webchat",
    "images",
    "js",
    "options",
    "pages",
    "popup",
    "manifest.json",
    "mzta-background.html",
    "mzta-background.js",
    "LICENSE"
)

# Verify all files exist before zipping
$validIncludes = @()
foreach ($item in $includes) {
    $itemPath = Join-Path $srcDir $item
    if (Test-Path $itemPath) {
        $validIncludes += $item
    } else {
        Write-Warning "Optional file/folder '$item' not found, skipping."
    }
}

# Create a temporary directory to assemble the package
$tempDir = Join-Path $srcDir "temp_build"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Assembling files..." -ForegroundColor Cyan
foreach ($item in $validIncludes) {
    $srcItem = Join-Path $srcDir $item
    $destItem = Join-Path $tempDir $item
    Copy-Item -Path $srcItem -Destination $destItem -Recurse -Force
}

# Compress to xpi (which is a zip archive with .xpi extension)
Write-Host "Creating installable Thunderbird Extension: $xpiName..." -ForegroundColor Green
$tempZipPath = Join-Path $srcDir "temp_archive.zip"
if (Test-Path $tempZipPath) { Remove-Item $tempZipPath }
Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $tempZipPath -Force
Move-Item -Path $tempZipPath -Destination $xpiPath -Force

# Cleanup temp folder
Remove-Item -Recurse -Force $tempDir

Write-Host "Package successfully created!" -ForegroundColor Green
Write-Host "- Thunderbird Extension: $xpiName" -ForegroundColor Gray
