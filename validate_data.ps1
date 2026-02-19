$jsonContent = Get-Content -Raw -Path "data.js" -Encoding UTF8
# Extract JSON array part
$startIndex = $jsonContent.IndexOf('[')
$endIndex = $jsonContent.LastIndexOf(']')
$jsonString = $jsonContent.Substring($startIndex, $endIndex - $startIndex + 1)

$sutras = $jsonString | ConvertFrom-Json

$matchCount = 0
$mismatchCount = 0
$missingDataCount = 0

Write-Host "Validating interlinear chunks..."

foreach ($sutra in $sutras) {
    if (-not $sutra.pronunciation -or -not $sutra.pronunciation_kr) {
        $missingDataCount++
        Write-Host "Missing data for $($sutra.id)"
        continue
    }

    $iastChunks = $sutra.pronunciation.Split('|') | Where-Object { $_.Trim().Length -gt 0 }
    $krChunks = $sutra.pronunciation_kr.Split('|') | Where-Object { $_.Trim().Length -gt 0 }

    if ($iastChunks.Count -eq $krChunks.Count) {
        $matchCount++
    }
    else {
        $mismatchCount++
        Write-Host "Mismatch $($sutra.id): IAST=$($iastChunks.Count), KR=$($krChunks.Count)"
    }
}

Write-Host ""
Write-Host "Summary:"
Write-Host "Total Sutras: $($sutras.Count)"
Write-Host "Interlinear Ready (Match): $matchCount"
Write-Host "Fallback (Mismatch): $mismatchCount"
Write-Host "Missing Data: $missingDataCount"
