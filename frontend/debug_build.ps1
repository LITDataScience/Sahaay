# Setup JAVA_HOME if needed (Adjust path as per your system or remove if already in PATH)
if ($null -eq $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}

Write-Host "Java Version: $(java -version 2>&1 | Out-String)" -ForegroundColor Green

# Ensure node_modules are up to date
Write-Host "Checking dependencies..." -ForegroundColor Cyan
pnpm install

# Run Expo Prebuild to sync native changes (optional but recommended if app.json changed)
Write-Host "Syncing native files (Prebuild)..." -ForegroundColor Cyan
npx expo prebuild --platform android --clean

# Build and Run on Android Emulator/Device
Write-Host "Starting local Android build and run..." -ForegroundColor Yellow
npx expo run:android
