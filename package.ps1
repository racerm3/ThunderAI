$source = $PSScriptRoot
$output = Join-Path $source "ThunderAI.zip"

$excludePatterns = @(
    "*.md",
    ".gitignore",
    "*.zip"
)

Add-Type -AssemblyName System.IO.Compression

$fileList = Get-ChildItem $source -Recurse -File |
    Where-Object {
        $name = $_.Name
        $excluded = $false
        foreach ($pattern in $excludePatterns) { if ($name -like $pattern) { $excluded = $true; break } }
        -not $excluded
    } |
    Where-Object { $_.FullName -notmatch "\\\.[^\\]+\\" }

$sourceLen = $source.Length + 1
$stream = [System.IO.File]::Open($output, [System.IO.FileMode]::Create)
$zip = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)

foreach ($file in $fileList) {
    $rel = $file.FullName.Substring($sourceLen) -replace '\\', '/'
    $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileBytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $entryStream.Write($fileBytes, 0, $fileBytes.Length)
    $entryStream.Close()
}

$zip.Dispose()
$stream.Close()

Write-Host "Created $output"
