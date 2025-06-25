# Build script for VicSam Group (PowerShell version)

Write-Host "Building VicSam Group..." -ForegroundColor Green

try {
    # Build client
    Set-Location client
    npm run build:fast
    Set-Location ..
    
    Write-Host "Build completed!" -ForegroundColor Green
    
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
