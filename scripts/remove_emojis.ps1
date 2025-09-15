$ErrorActionPreference = 'Stop'

$emoji = @('🚀','✨','📱','🏘️','💰','📦','⭐','🚚','🛡️','🤖','🏗️','🔧','🏠','🔍','📝','➕','📅','👤','💬','🔄','🚧','📋','📊','🔒','⚖️','📞','🇮🇳','❤️','🎉','🗃️','🤝','📄','🌟','✅')
$textExtensions = @(
  '.md', '.mdx', '.txt',
  '.ts', '.tsx', '.js', '.jsx', '.json',
  '.py', '.sh', '.yml', '.yaml', '.tsconfig'
)

$files = Get-ChildItem -Path .. -Recurse -File -Force |
  Where-Object { $textExtensions -contains $_.Extension }

foreach ($file in $files) {
  try {
    $original = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
    $updated = $original
    foreach ($e in $emoji) {
      $updated = $updated -replace [regex]::Escape($e), ''
    }
    if ($updated -ne $original) {
      Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8 -ErrorAction Stop
    }
  } catch {
    Write-Host "Skipped $($file.FullName): $($_.Exception.Message)"
  }
}

Write-Host "Emoji removal complete."


