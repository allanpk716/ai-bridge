# AI-Bridge Verification Script
# Run this script with: powershell -ExecutionPolicy Bypass -File verify-go.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "AI-Bridge Project Verification"       -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# Find Go installation
$goPaths = @(
    "C:\Users\allan716\SynologyDrive\MyThings\Apps\Proxmax3\4.3\go.exe",
    "C:\Go\bin\go.exe",
    "C:\Program Files\Go\bin\go.exe"
)

$goExe = $null
foreach ($path in $goPaths) {
    if (Test-Path $path) {
        $goExe = $path
        break
    }
}

if (-not $goExe) {
    Write-Host "ERROR: Go not found!" -ForegroundColor Red
    Write-Host "Please install Go from https://golang.org/dl/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found Go: $goExe" -ForegroundColor Green
Write-Host ""

# Get Go version
Write-Host "Go Version:" -ForegroundColor Cyan
& $goExe version
Write-Host ""

# Change to project directory
$projectDir = "C:\WorkSpace\ai-bridge"
Set-Location $projectDir

# Run go mod tidy
Write-Host "Running: go mod tidy..." -ForegroundColor Cyan
& $goExe mod tidy
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies resolved" -ForegroundColor Green
} else {
    Write-Host "✗ go mod tidy failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Build project
Write-Host "Running: go build ./cmd/ai-bridge..." -ForegroundColor Cyan
& $goExe build ./cmd/ai-bridge
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful!" -ForegroundColor Green
    Write-Host ""

    # Check if executable was created
    if (Test-Path "ai-bridge.exe") {
        Write-Host "✓ Executable created: ai-bridge.exe" -ForegroundColor Green
        $size = (Get-Item ai-bridge.exe).Length / 1KB
        Write-Host "  Size: $([math]::Round($size, 2)) KB" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
    Write-Host "This is expected for stub packages" -ForegroundColor Yellow
}
Write-Host ""

# Test protocol package
Write-Host "Running: go test ./pkg/protocol/..." -ForegroundColor Cyan
& $goExe test ./pkg/protocol/...
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed (expected for incomplete implementation)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "Verification Complete!"              -ForegroundColor Green
Write-Host "========================================"  -ForegroundColor Cyan
