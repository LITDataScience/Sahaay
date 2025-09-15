$ErrorActionPreference = 'Stop'

# File extensions considered text for in-repo branding updates
$textExtensions = @(
  '.md', '.mdx', '.txt',
  '.ts', '.tsx', '.js', '.jsx', '.json',
  '.py', '.sh', '.yml', '.yaml', '.tsconfig'
)

$files = Get-ChildItem -Path .. -Recurse -File -Force |
  Where-Object { $textExtensions -contains $_.Extension }

foreach ($file in $files) {
  try {
    $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop

    $updated = $content
    # SPDX identifier
    $updated = $updated -replace 'LicenseRef-BorroBuddy-Proprietary', 'LicenseRef-Sahaay-Proprietary'
    # Brand names (case-sensitive variants)
    $updated = $updated -replace 'BorrowBuddy', 'Sahaay'
    $updated = $updated -replace 'BorroBuddy', 'Sahaay'
    $updated = $updated -replace 'borrowbuddy', 'sahaay'
    # Domains and container/image names
    $updated = $updated -replace 'api\.borrowbuddy\.com', 'api.sahaay.com'
    $updated = $updated -replace 'image: *borrowbuddy', 'image: sahaay'
    # Expo identifiers
    $updated = $updated -replace 'com\.borrowbuddy\.app', 'com.sahaay.app'

    if ($updated -ne $content) {
      Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8 -ErrorAction Stop
    }
  } catch {
    Write-Host "Skipped $($file.FullName): $($_.Exception.Message)"
  }
}

Write-Host "Rebranding complete."


