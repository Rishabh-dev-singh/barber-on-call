# ==============================================================================
# Barber On Call - Fast Deployment Zip Creator
# Creates barberoncall_deploy.zip excluding node_modules and venv
# ==============================================================================

$targetZip = "barberoncall_deploy.zip"
Write-Host "Creating $targetZip (excluding venv and node_modules)..." -ForegroundColor Cyan

if (Test-Path $targetZip) {
    Remove-Item $targetZip -Force
}

# Create temporary staging directory
$tempDir = Join-Path $env:TEMP "barberoncall_staging"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy Backend
robocopy "Backend" "$tempDir\backend" /E /XD "venv" "__pycache__" ".pytest_cache" /XF "*.pyc" "*.sqlite3" | Out-Null

# Copy Frontend
robocopy "frontend" "$tempDir\frontend" /E /XD "node_modules" "dist" ".cache" | Out-Null

# Copy Deploy folder
robocopy "deploy" "$tempDir\deploy" /E | Out-Null

# Compress
Compress-Archive -Path "$tempDir\*" -DestinationPath $targetZip -CompressionLevel Optimal

# Cleanup staging
Remove-Item $tempDir -Recurse -Force

$zipSize = (Get-Item $targetZip).Length / 1MB
Write-Host "Created $targetZip ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
Write-Host "Now upload $targetZip to your VPS at 187.127.143.21 using SCP or Hostinger File Manager!" -ForegroundColor Yellow
