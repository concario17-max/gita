$dataPath = "c:\Users\PT\Desktop\Bhagavad\data.js"
$engPath = "c:\Users\PT\Desktop\Bhagavad\2.english.txt"
$korPath = "c:\Users\PT\Desktop\Bhagavad\3.korean-1.txt"

# Safe characters
$pipe = [char]0x7C
$fwPipe = [char]0xFF5C

Write-Host "Reading data.js..."
$content = Get-Content $dataPath -Raw -Encoding UTF8

# Extract JSON
$start = $content.IndexOf("[")
$end = $content.LastIndexOf("]")

if ($start -eq -1 -or $end -eq -1) {
    Write-Error "Could not find JSON array in data.js"
    exit 1
}

$jsonString = $content.Substring($start, $end - $start + 1)

Write-Host "Parsing JSON..."
try {
    $sutras = $jsonString | ConvertFrom-Json
}
catch {
    Write-Error "Failed to parse JSON: $_"
    exit 1
}

$newEngLines = @()
$newKorLines = @()

foreach ($sutra in $sutras) {
    $id = $sutra.id
    $iast = $sutra.pronunciation
    if ($null -eq $iast) { $iast = "" }
    $hangul = $sutra.pronunciation_kr
    if ($null -eq $hangul) { $hangul = "" }
    
    # Normalize IAST
    # Replace newlines, hyphens (split compounds), pipes
    $iastClean = $iast -replace "[\r\n]+", " "
    $iastClean = $iastClean -replace "-", " "
    $iastClean = $iastClean.Replace($pipe, " ").Replace($fwPipe, " ")
    
    $iastWords = $iastClean.Split(" ", [StringSplitOptions]::RemoveEmptyEntries)
    $iastLine = $iastWords -join " $pipe "
    
    # Normalize Hangul
    # Replace newlines, pipes. Keep hyphens.
    $hangulClean = $hangul -replace "[\r\n]+", " "
    $hangulClean = $hangulClean.Replace($pipe, " ").Replace($fwPipe, " ")
    
    $hangulWords = $hangulClean.Split(" ", [StringSplitOptions]::RemoveEmptyEntries)
    $hangulLine = $hangulWords -join " $pipe "
    
    # Check
    if ($iastWords.Count -ne $hangulWords.Count) {
        Write-Host "Warning: $id Mismatch E=$($iastWords.Count) K=$($hangulWords.Count)"
    }
    
    # Add to list
    $newEngLines += "$id $iastLine"
    $newEngLines += ""
    
    $newKorLines += "$id $hangulLine"
    $newKorLines += ""
}

$newEngLines | Set-Content $engPath -Encoding UTF8
$newKorLines | Set-Content $korPath -Encoding UTF8

Write-Host "Files restored and normalized."
