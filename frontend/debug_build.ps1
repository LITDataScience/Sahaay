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

$adbPath = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
$emulatorPath = Join-Path $env:ANDROID_HOME "emulator\emulator.exe"
$defaultAvdName = "Medium_Phone_API_36.1"
$devServerPort = 8081
$androidPackageName = "com.shivshakti.sahaay"

function Get-HealthyAndroidDeviceSerial {
    if (-not (Test-Path $adbPath)) {
        throw "adb not found at $adbPath"
    }

    $devices = & $adbPath devices | Select-Object -Skip 1
    foreach ($line in $devices) {
        if (-not $line) { continue }
        if ($line -match '^(\S+)\s+device$') {
            $serial = $matches[1]
            & $adbPath -s $serial shell pm list packages *> $null
            if ($LASTEXITCODE -eq 0) {
                return $serial
            }
        }
    }

    return $null
}

function Wait-ForHealthyAndroidDevice {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Serial,
        [int]$TimeoutSeconds = 180
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $bootCompleted = (& $adbPath -s $Serial shell getprop sys.boot_completed 2>$null).Trim()
        & $adbPath -s $Serial shell pm list packages *> $null
        if ($bootCompleted -eq "1" -and $LASTEXITCODE -eq 0) {
            return $true
        }
        Start-Sleep -Seconds 3
    }

    return $false
}

function Start-HealthyEmulator {
    param(
        [string]$AvdName = $defaultAvdName
    )

    if (-not (Test-Path $emulatorPath)) {
        throw "Android emulator binary not found at $emulatorPath"
    }

    $existingEmulators = (& $adbPath devices | Select-Object -Skip 1) |
        Where-Object { $_ -match '^(emulator-\d+)\s+device$' } |
        ForEach-Object {
            if ($_ -match '^(emulator-\d+)\s+device$') { $matches[1] }
        }

    foreach ($serial in $existingEmulators) {
        Write-Host "Stopping unhealthy emulator session: $serial" -ForegroundColor Gray
        & $adbPath -s $serial emu kill *> $null
    }

    Write-Host "Starting Android emulator: $AvdName" -ForegroundColor Gray
    $process = Start-Process -FilePath $emulatorPath -ArgumentList "@$AvdName", "-no-snapshot-load" -PassThru

    & $adbPath wait-for-device

    $deadline = (Get-Date).AddSeconds(180)
    while ((Get-Date) -lt $deadline) {
        $serial = Get-HealthyAndroidDeviceSerial
        if ($serial) {
            Write-Host "Android emulator is healthy: $serial" -ForegroundColor Gray
            return $serial
        }
        if ($process.HasExited) {
            throw "Android emulator process exited unexpectedly."
        }
        Start-Sleep -Seconds 3
    }

    throw "Android emulator did not become healthy within the timeout."
}

function Get-ExpoAndroidDeviceName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Serial
    )

    if ($Serial -like "emulator-*") {
        $avdName = (& $adbPath -s $Serial emu avd name 2>$null | Select-Object -First 1).Trim()
        if ($avdName -and $avdName -ne "OK") {
            return $avdName
        }
    }

    return $Serial
}

function Set-GradlePropertyValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $lines = if (Test-Path $Path) { Get-Content $Path } else { @() }
    $pattern = "^\Q$Key\E="
    $updated = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) {
            $lines[$i] = "$Key=$Value"
            $updated = $true
        }
    }

    if (-not $updated) {
        $lines += "$Key=$Value"
    }

    Set-Content -Path $Path -Value $lines -Encoding ascii
}

function Test-LocalTcpPort {
    param(
        [int]$Port
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(1000, $false)) {
            return $false
        }

        $client.EndConnect($async)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Start-MetroDevServer {
    param(
        [int]$Port = $devServerPort
    )

    if (Test-LocalTcpPort -Port $Port) {
        Write-Host "Reusing Metro on port $Port" -ForegroundColor Gray
        return
    }

    $metroCommand = "Set-Location '$PSScriptRoot'; npx expo start --dev-client --port $Port --host localhost"
    Write-Host "Starting Metro on port $Port in a new PowerShell window..." -ForegroundColor Gray
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $metroCommand | Out-Null

    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
        if (Test-LocalTcpPort -Port $Port) {
            Write-Host "Metro is ready on port $Port" -ForegroundColor Gray
            return
        }
        Start-Sleep -Seconds 2
    }

    throw "Metro dev server did not start on port $Port within the timeout."
}

function Start-DevClientApp {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Serial,
        [int]$Port = $devServerPort
    )

    & $adbPath -s $Serial reverse "tcp:$Port" "tcp:$Port" *> $null
    & $adbPath -s $Serial shell am force-stop $androidPackageName *> $null
    Write-Host "Launching Android app main activity..." -ForegroundColor Gray
    & $adbPath -s $Serial shell am start -W -n "$androidPackageName/.MainActivity"
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

$gradlePropertiesPath = "android/gradle.properties"
$emulatorArchitectures = "x86_64"
Set-GradlePropertyValue -Path $gradlePropertiesPath -Key "reactNativeArchitectures" -Value $emulatorArchitectures
Write-Host "React Native Android architectures locked to: $emulatorArchitectures" -ForegroundColor Gray

$deviceSerial = Get-HealthyAndroidDeviceSerial
if ($null -eq $deviceSerial) {
    $deviceSerial = Start-HealthyEmulator
} elseif (-not (Wait-ForHealthyAndroidDevice -Serial $deviceSerial -TimeoutSeconds 30)) {
    Write-Host "Existing emulator is connected but Android services are not ready. Restarting it..." -ForegroundColor Gray
    if ($deviceSerial -like "emulator-*") {
        & $adbPath -s $deviceSerial emu kill *> $null
    }
    $deviceSerial = Start-HealthyEmulator
}

Write-Host "Using Android device: $deviceSerial" -ForegroundColor Gray
Start-MetroDevServer -Port $devServerPort

Write-Host "Building and installing Android debug app..." -ForegroundColor Yellow
Push-Location "android"
try {
    & ".\gradlew.bat" "app:installDebug" "-x" "lint" "-x" "test" "--configure-on-demand" "--build-cache" "-PreactNativeDevServerPort=$devServerPort" "-PreactNativeArchitectures=$emulatorArchitectures"
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle installDebug failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

Start-DevClientApp -Serial $deviceSerial -Port $devServerPort
