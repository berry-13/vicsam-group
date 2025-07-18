# Build script for Vicsam Group (PowerShell version)

Write-Host "Building Vicsam Group..." -ForegroundColor Green

try {
    # Generate build info
    Write-Host "Generating build information..." -ForegroundColor Yellow
    npm run build:info
    
    # Build client
    Set-Location client
    npm run build:fast
    Set-Location ..
    
    Write-Host "Build completed!" -ForegroundColor Green
    
    # Show version info
    Write-Host "Version info:" -ForegroundColor Cyan
    npm run version:info
    
    # Show build size
    if (Test-Path "client/dist") {
        $size = (Get-ChildItem -Recurse client/dist | Measure-Object -Property Length -Sum).Sum
        $sizeInMB = [math]::Round($size / 1MB, 2)
        Write-Host "Build size: $sizeInMB MB" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Build failed: $_" -ForegroundColor Red
    exit 1
}
