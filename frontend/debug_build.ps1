$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host "Java Configured: $(java -version 2>&1 | Out-String)" -ForegroundColor Green

Write-Host "Starting Gradle Build (This might take a while to download updates)..." -ForegroundColor Yellow
.\android\gradlew.bat assembleRelease --stacktrace
