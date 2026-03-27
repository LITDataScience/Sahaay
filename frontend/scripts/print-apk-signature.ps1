param(
  [Parameter(Mandatory = $true)]
  [string]$ApkPath
)

$resolvedApkPath = Resolve-Path $ApkPath -ErrorAction Stop

$sdkRoot = if ($env:ANDROID_HOME) {
  $env:ANDROID_HOME
} elseif ($env:ANDROID_SDK_ROOT) {
  $env:ANDROID_SDK_ROOT
} else {
  Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}

$buildToolsRoot = Join-Path $sdkRoot 'build-tools'
if (-not (Test-Path $buildToolsRoot)) {
  throw "Android build-tools directory not found at $buildToolsRoot"
}

$latestBuildTools = Get-ChildItem $buildToolsRoot -Directory |
  Sort-Object Name -Descending |
  Select-Object -First 1

if (-not $latestBuildTools) {
  throw "No Android build-tools versions found under $buildToolsRoot"
}

$apksignerPath = Join-Path $latestBuildTools.FullName 'apksigner.bat'
if (-not (Test-Path $apksignerPath)) {
  throw "apksigner.bat not found at $apksignerPath"
}

& $apksignerPath verify --print-certs $resolvedApkPath
