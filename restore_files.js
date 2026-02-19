const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.js');
const engPath = path.join(__dirname, '2.english.txt');
const korPath = path.join(__dirname, '3.korean-1.txt');

// Read data.js
let dataContent = fs.readFileSync(dataPath, 'utf8');

// Parse sutras
// expected format: const sutras = [...];
// We'll strip the assignment.
const jsonStart = dataContent.indexOf('[');
const jsonEnd = dataContent.lastIndexOf(']');
if (jsonStart === -1 || jsonEnd === -1) {
    console.error("Could not find array in data.js");
    process.exit(1);
}

const jsonContent = dataContent.substring(jsonStart, jsonEnd + 1);
let sutras;
try {
    sutras = JSON.parse(jsonContent);
} catch (e) {
    console.error("Error parsing JSON:", e);
    // data.js might have trailing commas or comments? 
    // Usually generated JSON is clean.
    process.exit(1);
}

let newEngLines = [];
let newKorLines = [];

sutras.forEach(sutra => {
    const id = sutra.id;
    let iast = sutra.pronunciation || "";
    let hangul = sutra.pronunciation_kr || "";

    // Normalize IAST (English file)
    // 1. Replace newlines with space
    // 2. Replace hyphens with space (split compounds)
    // 3. Replace pipes (ASCII/Fullwidth) with space
    // 4. Split by whitespace
    // 5. Join by " | "
    let iastClean = iast.replace(/[\n\r]+/g, " ")
        .replace(/-/g, " ")
        .replace(/[|｜]/g, " ");

    // Split and filter empty
    let iastWords = iastClean.split(/\s+/).filter(w => w.length > 0);

    // Normalize Hangul (Korean file)
    // 1. Replace newlines with space
    // 2. DO NOT replace hyphens (syllable separators)
    // 3. Replace pipes with space
    let hangulClean = hangul.replace(/[\n\r]+/g, " ")
        .replace(/[|｜]/g, " ");

    let hangulWords = hangulClean.split(/\s+/).filter(w => w.length > 0);

    // Mismatch Check
    if (iastWords.length !== hangulWords.length) {
        console.log(`Warning: ${id} Mismatch E=${iastWords.length} K=${hangulWords.length}`);
    }

    // Join
    let iastLine = iastWords.join(" | ");
    let hangulLine = hangulWords.join(" | ");

    newEngLines.push(`${id} ${iastLine}`);
    newEngLines.push(""); // Blank line

    newKorLines.push(`${id} ${hangulLine}`);
    newKorLines.push(""); // Blank line
});

// Write files
fs.writeFileSync(engPath, newEngLines.join("\n"), 'utf8');
fs.writeFileSync(korPath, newKorLines.join("\n"), 'utf8');

console.log("Files restored and normalized.");
