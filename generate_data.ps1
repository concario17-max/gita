# encoding set to UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$sutras = @{}

function Get-OrCreateSutra {
    param ($id)
    if (-not $sutras.ContainsKey($id)) {
        $sutras[$id] = @{ id = $id }
    }
    return $sutras[$id]
}

# Generic function to read file with "ID" ... "Text" structure
function Parse-File {
    param ($filePath, $field, $isLineBased)
    
    if (-not (Test-Path $filePath)) { return }
    Write-Host "Processing $filePath to '$field'..."

    $lines = Get-Content $filePath -Encoding UTF8
    $currentId = $null
    $buffer = ""

    foreach ($line in $lines) {
        if ($line -eq $null) { continue }
        $trimLine = $line.Trim()
        
        # Match ID like "1-1" or "1-1 something"
        # We assume ID is at start of line
        if ($trimLine -match "^(\d+)[-.](\d+)(.*)$") {
            # Save previous
            if ($currentId -ne $null -and $buffer.Length -gt 0) {
                $sutra = Get-OrCreateSutra $currentId
                $sutra[$field] = $buffer.Trim()
            }

            $currentId = "$($Matches[1]).$($Matches[2])"
            $remainder = $Matches[3].Trim()
            $buffer = $remainder # Start buffer with remainder of ID line
            continue
        }

        # Accumulate
        if ($currentId -ne $null -and $trimLine.Length -gt 0) {
            if ($buffer.Length -gt 0) { $buffer += "`n" }
            $buffer += $trimLine
        }
    }
    # Save last
    if ($currentId -ne $null -and $buffer.Length -gt 0) {
        $sutra = Get-OrCreateSutra $currentId
        $sutra[$field] = $buffer.Trim()
    }
}

# 1. Sanskrit (1.sans.txt) -> sanskrit
Parse-File "1.sans.txt" "sanskrit" $false

# 2. English/IAST (2.english.txt) -> pronunciation
Parse-File "2.english.txt" "pronunciation" $false

# 3. Korean/Hangul (3.korean-1.txt) -> pronunciation_kr
Parse-File "3.korean-1.txt" "pronunciation_kr" $false


# 4. Sort and Save
$sortedIds = $sutras.Keys | Sort-Object { 
    $parts = $_.Split('.')
    [int]$parts[0] * 1000 + [int]$parts[1] 
}

$outputList = @()
foreach ($id in $sortedIds) {
    if (-not $sutras[$id].ContainsKey("sanskrit")) { $sutras[$id]["sanskrit"] = "" }
    if (-not $sutras[$id].ContainsKey("pronunciation")) { $sutras[$id]["pronunciation"] = "" }
    if (-not $sutras[$id].ContainsKey("pronunciation_kr")) { $sutras[$id]["pronunciation_kr"] = "" }
    
    # Placeholders for translations (missing in source)
    $sutras[$id]["english"] = "" 
    $sutras[$id]["korean"] = "" 

    # Audio Path
    $parts = $id.Split('.')
    $ch = [int]$parts[0]
    $ve = [int]$parts[1]
    $chPad = "{0:D3}" -f $ch
    $vePad = "{0:D3}" -f $ve
    
    # Check if specific split file exists
    # mp3/1/001_001.mp3
    $sutras[$id]["audio"] = "mp3/$ch/${chPad}_${vePad}.mp3"

    $outputList += $sutras[$id]
}

$json = $outputList | ConvertTo-Json -Depth 4 -Compress
$jsContent = "const sutras = $json;"

[System.IO.File]::WriteAllText("$PWD\data.js", $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Generated data.js with $( $outputList.Count ) verses."
