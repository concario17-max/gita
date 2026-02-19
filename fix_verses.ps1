$engFile = "c:\Users\PT\Desktop\Bhagavad\2.english.txt"
$korFile = "c:\Users\PT\Desktop\Bhagavad\3.korean-1.txt"

# Safe characters
$pipe = [char]0x7C
$fwPipe = [char]0xFF5C

function Parse-Verses($path) {
    if (-not (Test-Path $path)) { return @{} }
    $content = Get-Content $path -Raw -Encoding UTF8
    $matches = [regex]::Matches($content, "(?ms)^(\d+-\d+(?:\s+)?)(.*?)(?=(^\d+-\d+|$))")
    $verses = @{}
    foreach ($m in $matches) {
        $id = $m.Groups[1].Value.Trim()
        $text = $m.Groups[2].Value
        $verses[$id] = $text
    }
    return $verses
}

Write-Host "Parsing files..."
$engVerses = Parse-Verses $engFile
$korVerses = Parse-Verses $korFile

$newEngContent = @()
$newKorContent = @()

$orderedIds = [regex]::Matches((Get-Content $engFile -Raw -Encoding UTF8), "(?ms)^(\d+-\d+)").Value.Trim()

foreach ($id in $orderedIds) {
    if (-not $engVerses.ContainsKey($id)) { continue }
    
    $eText = $engVerses[$id]
    
    # Tokenize English
    # Regex Replace: remove pipes, replace newlines with space.
    $eClean = $eText -replace "[\r\n]+", " "
    $eClean = $eClean.Replace($pipe, " ")
    
    $eWords = $eClean.Split(" ", [StringSplitOptions]::RemoveEmptyEntries)
    $eNew = $eWords -join " $pipe "
    
    # Handle Korean
    if ($korVerses.ContainsKey($id)) {
        $kText = $korVerses[$id]
        
        $kClean = $kText -replace "[\r\n]+", " "
        $kClean = $kClean.Replace($pipe, " ").Replace($fwPipe, " ")
        
        $kWords = $kClean.Split(" ", [StringSplitOptions]::RemoveEmptyEntries)
        $kNew = $kWords -join " $pipe "
        
        $eCount = $eWords.Count
        $kCount = $kWords.Count
        
        if ($eCount -ne $kCount) {
            Write-Host "Warning: $id Mismatch (E=$eCount, K=$kCount)"
        }
        
        $newKorContent += "$id"
        $newKorContent += "$kNew"
        $newKorContent += ""
    }
    
    $newEngContent += "$id"
    $newEngContent += "$eNew"
    $newEngContent += ""
}

$newEngContent | Set-Content $engFile -Encoding UTF8
$newKorContent | Set-Content $korFile -Encoding UTF8

Write-Host "Done normalizing delimiters using ASCII pipe."
