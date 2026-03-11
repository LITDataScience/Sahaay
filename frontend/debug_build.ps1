# Setup JAVA_HOME
if ($null -eq $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}

# Auto-detect ANDROID_HOME
if ($null -eq $env:ANDROID_HOME) {
    $localAppData = [System.Environment]::GetFolderPath('LocalApplicationData')
    $env:ANDROID_HOME = "$localAppData\Android\Sdk"
}

# Generate local.properties if it doesn't exist (Fixes the SDK location error)
$localPropertiesPath = "android/local.properties"
if (-not (Test-Path $localPropertiesPath)) {
    Write-Host "Generating local.properties with SDK path: $env:ANDROID_HOME" -ForegroundColor Gray
    $sdkPathEscaped = $env:ANDROID_HOME.Replace('\', '\\').Replace(':', '\:')
    "sdk.dir=$sdkPathEscaped" | Out-File -FilePath $localPropertiesPath -Encoding ascii
}

Write-Host "Java Version: 17.0.18" -ForegroundColor Green
Write-Host "Android SDK: $env:ANDROID_HOME" -ForegroundColor Green

# Ensure google-services.json is in the right place
if (Test-Path "..\google-services.json") {
    Write-Host "Syncing google-services.json from root..." -ForegroundColor Gray
    Copy-Item "..\google-services.json" "google-services.json" -Force
}

# Ensure dependencies are up to date
Write-Host "Checking dependencies..." -ForegroundColor Cyan
pnpm install

# Run Expo Prebuild
Write-Host "Syncing native files (Prebuild)..." -ForegroundColor Cyan
npx expo prebuild --platform android --clean

# Build and Run
Write-Host "Starting local Android build and run..." -ForegroundColor Yellow
npx expo run:android
