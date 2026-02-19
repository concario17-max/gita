const fs = require('fs');

// Read data.js
const content = fs.readFileSync('data.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const sutras = JSON.parse(jsonStr);

let matchCount = 0;
let mismatchCount = 0;
let missingDataCount = 0;

console.log("Validating interlinear chunks...");

const delimiterRegex = /\|/g; // We normalized to |

sutras.forEach(sutra => {
    if (!sutra.pronunciation || !sutra.pronunciation_kr) {
        missingDataCount++;
        // console.log(`Missing data for ${sutra.id}`);
        return;
    }

    // Split by |
    // Note: The text might have spaces around |, so trim is good, but simple split by | is enough to count chunks if normalized
    const iastChunks = sutra.pronunciation.split('|').filter(s => s.trim().length > 0);
    const krChunks = sutra.pronunciation_kr.split('|').filter(s => s.trim().length > 0);

    if (iastChunks.length === krChunks.length) {
        matchCount++;
    } else {
        mismatchCount++;
        console.log(`Mismatch ${sutra.id}: IAST=${iastChunks.length}, KR=${krChunks.length}`);
    }
});

console.log(`\nSummary:`);
console.log(`Total Sutras: ${sutras.length}`);
console.log(`Interlinear Ready (Match): ${matchCount}`);
console.log(`Fallback (Mismatch): ${mismatchCount}`);
console.log(`Missing Data: ${missingDataCount}`);
