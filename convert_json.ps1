$ErrorActionPreference = "Stop"

$jsonPath = Join-Path $PSScriptRoot "json\gita_all_chapters.json"
$koreanPath = Join-Path $PSScriptRoot "3.korean-1.txt"
$outputPath = Join-Path $PSScriptRoot "data.js"

# 1. Read and Parse Korean Text
Write-Host "Reading Korean text..."
$koreanContent = Get-Content -Path $koreanPath -Encoding UTF8
$koreanMap = @{}
$currentKId = $null
$currentKText = @()

foreach ($line in $koreanContent) {
    $line = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    # Match ID like "1-1 | ..." or "1.1 | ..."
    if ($line -match '^(\d+)[-.](\d+)\s*\|\s*(.*)') {
        if ($currentKId) {
            $koreanMap[$currentKId] = ($currentKText -join ' ')
        }
        $currentKId = "$($matches[1]).$($matches[2])" # Standardize to dot
        $currentKText = @($matches[3])
    }
    else {
        if ($currentKId) {
            $currentKText += $line
        }
    }
}
# Save last one
if ($currentKId) {
    $koreanMap[$currentKId] = ($currentKText -join ' ')
}

Write-Host "Loaded $($koreanMap.Count) Korean verses."

# 2. Read JSON
Write-Host "Reading JSON..."
$jsonContent = Get-Content -Raw -Path $jsonPath -Encoding UTF8
$jsonData = $jsonContent | ConvertFrom-Json

$outputSutras = @()

# 3. Process JSON
# jsonData is an object with keys "1", "2"...
# Powershell Note: JSON objects become PSCustomObject. We iterate properties.
# But keys are dynamic "1", "2"...
# We can get properties or just assume 1..18
foreach ($key in 1..18) {
    $chapterKey = "$key"
    if (-not $jsonData.PSObject.Properties[$chapterKey]) { continue }
    
    $chapterObj = $jsonData.$chapterKey
    $verses = $chapterObj.verses

    foreach ($verseObj in $verses) {
        $mainId = $verseObj.id # "1.1"
        $sanskrit = $verseObj.sanskrit
        $iast = $verseObj.iast
        $translation = $verseObj.translation_en
        $words = $verseObj.words
        
        # Audio: "https://.../001_001.mp3" -> "mp3/001_001.mp3" (Assuming flat structure in mp3 folder)
        $audioUrl = $verseObj.audio
        if ($audioUrl) {
            $audioFilename = Split-Path $audioUrl -Leaf
            $localAudioPath = "mp3/$audioFilename"
        }
        else {
            $localAudioPath = ""
        }

        # Determine grouped verses from Sanskrit text markers
        # Regex: ||1.4|| or ।।1.4।।
        $verseNumbers = @()
        $danda = [char]0x0964
        $regexPattern = "($danda$danda|\|\|)(\d+)\.(\d+)($danda$danda|\|\|)"
        $matchesFound = [regex]::Matches($sanskrit, $regexPattern)
        foreach ($m in $matchesFound) {
            $verseNumbers += "$($m.Groups[2].Value).$($m.Groups[3].Value)"
        }

        if ($verseNumbers.Count -eq 0) {
            $verseNumbers += $mainId
        }

        # Fetch and Merge Korean
        $koreanParts = @()
        foreach ($vid in $verseNumbers) {
            if ($koreanMap.ContainsKey($vid)) {
                $koreanParts += $koreanMap[$vid]
            }
            else {
                # Try replacing . with - just in case map key logic failed? 
                # No, we standardized to dot.
                # Maybe leading zeros? "1.1" vs "1.01"? No, source is "1-1".
                # Expected mismatch for missing files.
                # Write-Host "Warning: No Korean text for $vid"
            }
        }
        $koreanCombined = $koreanParts -join "<br><br>"

        # Transform Words
        $wordMeanings = @{}
        if ($words) {
            foreach ($w in $words) {
                if ($w.s -and $w.m) {
                    $wordMeanings[$w.s] = $w.m
                }
            }
        }

        $sutra = [ordered]@{
            id               = $mainId
            chapter          = $chapterObj.chapter
            verse            = $verseNumbers[0].Split('.')[1]
            sanskrit         = $sanskrit
            pronunciation    = $iast
            pronunciation_kr = $koreanCombined
            word_meanings    = $wordMeanings
            translation_en   = $translation
            audio            = $localAudioPath
            grouped_verses   = $verseNumbers
        }
        $outputSutras += $sutra
    }
}

# 4. Write data.js
# Convert to JSON
$jsonOutput = $outputSutras | ConvertTo-Json -Depth 4 -Compress
# Javascript syntax
$jsContent = "const sutras = $jsonOutput;"
$jsContent | Set-Content -Path $outputPath -Encoding UTF8

Write-Host "Generated data.js with $($outputSutras.Count) entries."
