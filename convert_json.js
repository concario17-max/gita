const fs = require('fs');
const path = require('path');

// Paths
const jsonPath = path.join(__dirname, 'json', 'gita_all_chapters.json');
const koreanPath = path.join(__dirname, '3.korean-1.txt');
const outputPath = path.join(__dirname, 'data.js');

// 1. Read and Parse Korean Text
console.log("Reading Korean text...");
const koreanContent = fs.readFileSync(koreanPath, 'utf8');
const koreanMap = new Map();
const kLines = koreanContent.split(/\r?\n/);
let currentKId = null;
let currentKText = [];

kLines.forEach(line => {
    line = line.trim();
    if (!line) return;

    // Check for ID line like "1-1 | ..." or "1.1 | ..."
    // The file seems to have "1-1 | word | word..." format based on previous view
    // We need to support "1-1" or "1.1"
    const match = line.match(/^(\d+)[-.](\d+)\s*\|\s*(.*)/);
    if (match) {
        if (currentKId) {
            koreanMap.set(currentKId, currentKText.join(' '));
        }
        currentKId = `${match[1]}.${match[2]}`; // Standardize to dot
        currentKText = [match[3]];
    } else {
        if (currentKId) {
            currentKText.push(line);
        }
    }
});
// Save last one
if (currentKId) {
    koreanMap.set(currentKId, currentKText.join(' '));
}

console.log(`Loaded ${koreanMap.size} Korean verses.`);

// 2. Read JSON
console.log("Reading JSON...");
const jsonContent = fs.readFileSync(jsonPath, 'utf8');
const jsonData = JSON.parse(jsonContent);

const outputSutras = [];

// 3. Process JSON
// The JSON has top-level keys "1", "2"... for chapters
Object.values(jsonData).forEach(chapterObj => {
    const chapterId = chapterObj.chapter;
    const verses = chapterObj.verses;

    verses.forEach(verseObj => {
        const mainId = verseObj.id; // e.g., "1.1"
        const sanskrit = verseObj.sanskrit;
        const iast = verseObj.iast;
        const translation = verseObj.translation_en;
        const words = verseObj.words; // Array of {s, m}

        // Audio: "https://.../001_001.mp3" -> "mp3/1/001_001.mp3"
        // Wait, folder structure in mp3 dir:
        // User provided "mp3" folder with "001_001.mp3" directly in root of mp3 based on file list?
        // Let's check the list_dir output again.
        // "mp3" isDir, numChildren 702.
        // Files were "001_001.mp3".
        // It seems they are FLAT in mp3 folder, NOT in subfolders?
        // list_dir showed: "001_001.mp3" inside "c:\Users\PT\Desktop\Bhagavad\mp3" ??
        // Actually list_dir output was on "c:\Users\PT\Desktop\Bhagavad", showing "mp3" isDir.
        // find_by_name on "mp3" showed "001_001.mp3".
        // It didn't explicitly show "1/001_001.mp3".
        // If find_by_name showed just filename, it means it's in the search directory.
        // I will assume flat structure for now, based on find_by_name output.
        // If they are in folders, find_by_name usually shows relative path like "1/File.mp3".
        // "Found 334 results\n001_001.mp3" -> Likely flat.

        const audioUrl = verseObj.audio || '';
        const audioFilename = audioUrl.split('/').pop(); // "001_001.mp3"
        const localAudioPath = `mp3/${audioFilename}`;

        // Determine grouped verses
        // Check sanskrit for ||X.Y|| patterns
        const verseNumbers = [];
        // Regex to find "||Chapter.Verse||" or "||Verse||"
        // Grouped verse sample: "...||1.4||\n...||1.5||\n...||1.6||"
        // Also single verse: "...||1.1||"
        // We need to capture the Verse number.
        // Pattern: /\|\|(\d+)\.(\d+)\|\|/g  (Assuming 1.4 format)

        const regex = /\|\|(\d+)\.(\d+)\|\|/g;
        let m;
        while ((m = regex.exec(sanskrit)) !== null) {
            verseNumbers.push(`${m[1]}.${m[2]}`);
        }

        // If no matches found (maybe formatting differs?), use valid ID from obj
        if (verseNumbers.length === 0) {
            verseNumbers.push(mainId);
        }

        // Fetch and Merge Korean Pronunciation
        let koreanParts = [];
        verseNumbers.forEach(vid => {
            if (koreanMap.has(vid)) {
                // Determine if we need to label them if multiple?
                // If grouped, maybe: "1.4 data... 1.5 data..."
                // But the requested display style is stacked.
                // Merging them with simple newline is probably best.
                koreanParts.push(koreanMap.get(vid));
            } else {
                console.log(`Warning: No Korean text for ${vid}`);
            }
        });
        const koreanCombined = koreanParts.join('<br><br>'); // Separate by blank line

        // Transform Words (s, m) -> Object for script.js
        // script.js expects `word_meanings` object: { "word": "meaning", ... }
        // URL/JSON has array: [{s: "word", m: "meaning"}]
        const wordMeanings = {};
        if (words && Array.isArray(words)) {
            words.forEach(w => {
                if (w.s && w.m) {
                    wordMeanings[w.s] = w.m;
                }
            });
        }

        const sutra = {
            id: mainId,
            chapter: chapterId,
            verse: verseNumbers[0].split('.')[1], // First verse number
            sanskrit: sanskrit,
            pronunciation: iast, // Using IAST from JSON
            pronunciation_kr: koreanCombined, // Merged Korean
            word_meanings: wordMeanings,
            translation_en: translation,
            audio: localAudioPath,
            // Keep original audio url just in case? No need.
            grouped_verses: verseNumbers // Metadata for reference
        };

        outputSutras.push(sutra);
    });
});

// 4. Write data.js
const jsContent = `const sutras = ${JSON.stringify(outputSutras, null, 2)};`;
fs.writeFileSync(outputPath, jsContent, 'utf8');

console.log(`Generated data.js with ${outputSutras.length} entries.`);
