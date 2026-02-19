// --- Authentication Gate ---

const MASTER_PASSWORD = '0228';

// --- Authentication Gate ---
// --- Authentication Gate ---
function checkPassword(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('app-password');
    const gate = document.getElementById('password-gate');
    const content = document.getElementById('app-wrapper') || document.getElementById('main-content') || document.getElementById('landing-page');
    const error = document.getElementById('password-error');

    if (input.value === MASTER_PASSWORD) {
        // Success: Store the ACTUAL password (or hash) so that changing MASTER_PASSWORD invalidates sessions
        localStorage.setItem('yoga_gate_auth', MASTER_PASSWORD);
        // Set persistent cookie for 10 years
        document.cookie = `yoga_gate_auth=${MASTER_PASSWORD}; path=/; max-age=315360000; samesite=strict`;

        gate.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            gate.classList.add('hidden');
            gate.style.display = 'none'; // Extra safety as requested
            if (content) {
                content.classList.remove('invisible');
                content.classList.add('opacity-100');
                document.body.classList.remove('overflow-hidden');
            }
        }, 700);
    } else {
        // Fail
        error.classList.remove('hidden');
        input.value = '';
        input.focus();
        // Shake animation
        input.parentElement.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300 });
    }
}

// Check session on load
function initAuthGate() {
    const localAuth = localStorage.getItem('yoga_gate_auth');
    const cookieAuthStr = document.cookie.split('; ').find(row => row.startsWith('yoga_gate_auth='));
    const cookieAuth = cookieAuthStr ? cookieAuthStr.split('=')[1] : null;

    // Auth is valid if stored value matches CURRENT Master Password
    // This ensures that if we change the password in code, old sessions are invalidated
    const isLocalValid = localAuth === MASTER_PASSWORD;
    const isCookieValid = cookieAuth === MASTER_PASSWORD;

    const isAuth = isLocalValid || isCookieValid;

    // Sync state: If authenticated in one but not the other, restore the missing one
    if (isAuth) {
        if (!isLocalValid) localStorage.setItem('yoga_gate_auth', MASTER_PASSWORD);
        if (!isCookieValid) document.cookie = `yoga_gate_auth=${MASTER_PASSWORD}; path=/; max-age=315360000; samesite=strict`;
    }

    const gate = document.getElementById('password-gate');
    const content = document.getElementById('app-wrapper') || document.getElementById('main-content') || document.getElementById('landing-page');

    // Check if we are on the landing page (index.html) by looking for the gate element
    const isLandingPage = !!gate;

    if (!isLandingPage || isAuth) {
        if (gate) {
            gate.classList.add('hidden', 'pointer-events-none');
            gate.style.display = 'none';
        }
        if (content) {
            content.classList.remove('invisible');
            content.classList.add('opacity-100');
            document.body.classList.remove('overflow-hidden');
        }
    } else {
        // Enforce gate only on landing page
        if (gate) {
            gate.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        }
        if (content) content.classList.add('invisible');
    }
}

// State
let currentChapterId = null;
document.addEventListener('DOMContentLoaded', () => {
    // Auth Gate Init (Critical - check immediately)
    initAuthGate();

    // Defer heavy logic to allow UI to breathe/render first
    requestAnimationFrame(() => {
        setTimeout(() => {
            initializeApp();
        }, 0);
    });
});

function initializeApp() {
    // 1. Common Setup
    populateChapterSelects();
    renderLandingGrid();
    setupQuickJump();

    // 2. Chapter Page Logic (only if elements exist)
    const chapterListEl = document.getElementById('chapter-list');
    if (!chapterListEl) return;

    // Get Params
    const urlParams = new URLSearchParams(window.location.search);
    const qChapter = urlParams.get('chapter');
    const qSutra = urlParams.get('sutra');
    const idParam = urlParams.get('id');

    // Default to Chapter 1
    currentChapterId = idParam || '1';

    if (qChapter && qSutra) {
        currentChapterId = qChapter;
        currentSutraId = `${qChapter}.${qSutra}`;
        renderSidebar(currentChapterId);
        loadSutra(currentSutraId);
    } else {
        renderSidebar(currentChapterId);
        // Load Sutra
        const firstSutra = sutras.find(s => s.id.startsWith(`${currentChapterId}.`));
        if (firstSutra) {
            loadSutra(firstSutra.id);
        }
    }

    setupNavigation();
}

// Sutra Counts per Chapter
const sutraCounts = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
    7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
    13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
};

const chapters = [
    { id: '1', name: '1. Arjuna Viṣhād Yoga', count: 47, icon: 'sentiment_dissatisfied' },
    { id: '2', name: '2. Sānkhya Yoga', count: 72, icon: 'self_improvement' },
    { id: '3', name: '3. Karma Yoga', count: 43, icon: 'work' },
    { id: '4', name: '4. Jñāna Karma Sanyāsa Yoga', count: 42, icon: 'school' },
    { id: '5', name: '5. Karma Sanyāsa Yoga', count: 29, icon: 'psychology' },
    { id: '6', name: '6. Dhyān Yoga', count: 47, icon: 'spa' },
    { id: '7', name: '7. Jñāna Vijñāna Yoga', count: 30, icon: 'science' },
    { id: '8', name: '8. Akṣhara Brahma Yoga', count: 28, icon: 'all_inclusive' },
    { id: '9', name: '9. Rāja Vidyā Rāja Guhya Yoga', count: 34, icon: 'visibility' },
    { id: '10', name: '10. Vibhūti Yoga', count: 42, icon: 'auto_awesome' },
    { id: '11', name: '11. Viśhwarūp Darśhan Yoga', count: 55, icon: 'stars' },
    { id: '12', name: '12. Bhakti Yoga', count: 20, icon: 'favorite' },
    { id: '13', name: '13. Kṣhetra Kṣhetrajña Vibhāga Yoga', count: 35, icon: 'landscape' },
    { id: '14', name: '14. Guṇa Traya Vibhāga Yoga', count: 27, icon: 'tune' },
    { id: '15', name: '15. Puruṣhottama Yoga', count: 20, icon: 'emoji_people' },
    { id: '16', name: '16. Daivāsura Sampad Vibhāga Yoga', count: 24, icon: 'balance' },
    { id: '17', name: '17. Śhraddhā Traya Vibhāga Yoga', count: 28, icon: 'volunteer_activism' },
    { id: '18', name: '18. Mokṣha Sanyāsa Yoga', count: 78, icon: 'no_meeting_room' }
];

function populateChapterSelects() {
    const selects = ['chapter-select-landing', 'chapter-select-header', 'chapter-select-mobile'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const currentVal = el.value;
        el.innerHTML = '';
        chapters.forEach(chap => {
            const opt = document.createElement('option');
            opt.value = chap.id;
            // Name already contains number, so just use it.
            // Shortening for mobile/selects might still be good?
            // Let's use the full name for clarity as requested.
            opt.textContent = chap.name;
            opt.className = "bg-[#fdfbf7] dark:bg-slate-800 text-slate-700 dark:text-slate-200";
            el.appendChild(opt);
        });
        // Preserve selection if valid, otherwise default to currentChapterId or 1
        if (currentVal && chapters.some(c => c.id === currentVal)) {
            el.value = currentVal;
        } else if (currentChapterId) {
            el.value = currentChapterId;
        }
    });
}

function setupQuickJump() {
    // Initialize quick jump for both landing and header
    initQuickJump('chapter-select-landing', 'sutra-select-landing', 'quick-jump-btn-landing');
    initQuickJump('chapter-select-header', 'sutra-select-header', 'quick-jump-btn-header'); // Desktop
    initQuickJump('chapter-select-mobile', 'sutra-select-mobile', 'quick-jump-btn-mobile'); // Mobile Floating
}

function initQuickJump(chapterId, sutraId, btnId) {
    const chapterSelect = document.getElementById(chapterId);
    const sutraSelect = document.getElementById(sutraId);
    // btnId is no longer used but kept for signature compatibility if needed, or we can just ignore it.

    if (!chapterSelect || !sutraSelect) return;

    // Populate Sutras based on initial chapter
    updateSutraOptions(chapterSelect.value, sutraSelect);

    // Event: Chapter Change
    chapterSelect.addEventListener('change', (e) => {
        updateSutraOptions(e.target.value, sutraSelect);
    });

    // Event: Sutra Change (Auto-navigate)
    sutraSelect.addEventListener('change', (e) => {
        const ch = chapterSelect.value;
        const su = e.target.value;
        if (ch && su) {
            window.location.href = `chapter.html?chapter=${ch}&sutra=${su}`;
        }
    });
}

function updateSutraOptions(chapterVal, sutraSelectEl) {
    if (!chapterVal || !sutraCounts[chapterVal]) return;

    const count = sutraCounts[chapterVal];
    // We don't preserve value anymore, resetting to "Select" is better for "Quick Jump" feel

    sutraSelectEl.innerHTML = ''; // Clear

    // Add Placeholder
    const placeholder = document.createElement('option');
    placeholder.value = "";
    placeholder.textContent = "Sutra";
    placeholder.disabled = true;
    placeholder.selected = true;
    // Apply Landing Page Style vs Chapter Page Style? 
    // Since we use the same JS for both, let's apply the landing page style class (it won't hurt chapter page as it has its own CSS overrides or dark mode handling)
    // Actually, for chapter page we might need dark mode support.
    // Let's rely on standard CSS classes if possible, or add both.
    placeholder.className = "bg-[#fdfbf7] dark:bg-slate-800 text-slate-700 dark:text-slate-200";
    sutraSelectEl.appendChild(placeholder);

    for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option');
        opt.value = i.toString();
        opt.textContent = `${i}`;
        opt.className = "bg-[#fdfbf7] dark:bg-slate-800 text-slate-700 dark:text-slate-200";
        sutraSelectEl.appendChild(opt);
    }
}

function renderSidebar(chapterId) {
    const chapterList = document.getElementById('chapter-list');
    const sutraList = document.getElementById('sidebar-sutra-list');

    // Clear
    chapterList.innerHTML = '';
    sutraList.innerHTML = '';

    // Render Chapter Buttons (Padas)
    // chapters array is now global

    chapters.forEach(chap => {
        const isActive = chap.id === chapterId;
        const btn = document.createElement('button');
        // Compact: py-1.5, smaller text if needed.
        btn.className = `w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${isActive
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`;
        btn.onclick = () => window.location.href = `chapter.html?id=${chap.id}`;

        btn.innerHTML = `
            <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px] ${isActive ? '' : 'text-slate-400'}">${chap.icon}</span>
                <span class="truncate max-w-[140px] text-left">${chap.name}</span>
            </span>
            <span class="text-[10px] ${isActive ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400'} px-1.5 py-0.5 rounded">${chap.count}</span>
        `;
        chapterList.appendChild(btn);
    });

    // Render Sutra Links for Current Chapter
    const chapterSutras = sutras.filter(s => s.id.startsWith(`${chapterId}.`));
    chapterSutras.forEach(sutra => {
        createSutraLink(sutra, sutraList);
    });
}

function createSutraLink(sutra, container) {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md truncate transition-colors';
    link.dataset.id = sutra.id;
    link.onclick = (e) => {
        e.preventDefault();
        loadSutra(sutra.id);
    };
    // Preview text: 1.1 Atha yoga...
    const preview = `${sutra.id} ${sutra.pronunciation ? sutra.pronunciation.split(' ').slice(0, 4).join(' ') + '...' : ''}`;
    link.textContent = preview;
    container.appendChild(link);
}

function loadSutra(id) {
    currentSutraId = id;
    const sutra = sutras.find(s => s.id === id);
    if (!sutra) return;

    const mainContent = document.getElementById('sutra-detail-view');

    // Update Sidebar Active State
    document.querySelectorAll('#sidebar-sutra-list a').forEach(a => {
        if (a.dataset.id === id) {
            a.className = 'block px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded-md border-l-2 border-primary truncate transition-colors';
            a.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            a.className = 'block px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md truncate transition-colors';
        }
    });

    // Update Indicators
    document.getElementById('current-sutra-indicator').textContent = id;
    document.getElementById('note-sutra-id').textContent = id;

    // Render Main Content
    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto pb-24 animate-fade-in">
            <!-- Header -->
            <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8 font-display">
                <span class="hover:text-primary cursor-pointer">Chapter ${currentChapterId}</span>
                <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                <span class="font-medium text-slate-600 dark:text-slate-300">Sutra ${sutra.id}</span>
            </nav>

            <!-- Sanskrit & Pronunciation -->
            <section class="text-center mb-16 relative">
                <div class="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-6">
                    <span class="material-symbols-outlined">self_improvement</span>
                </div>
                <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight tracking-tight font-kr-serif break-keep break-words">
                    ${sutra.sanskrit || ''}
                </h1>
                ${renderPronunciation(sutra)}

                <!-- Audio Player -->
                <div class="flex flex-col items-center mb-10 w-full max-w-md mx-auto">
                    <!-- Active Player (Always Visible) -->
                    <div id="audio-player-${sutra.id}" class="w-full bg-white dark:bg-slate-800 border border-primary/20 rounded-full px-4 py-2 shadow-sm flex items-center gap-4 animate-fade-in">
                        <button id="play-pause-btn-${sutra.id}" class="shrink-0 size-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <span class="material-symbols-outlined text-[24px]">play_arrow</span>
                        </button>
                        
                        <span id="current-time-${sutra.id}" class="text-xs font-mono text-slate-500 w-10 text-right">0:00</span>
                        
                        <div class="relative flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full cursor-pointer group">
                             <div id="progress-bar-${sutra.id}" class="absolute top-0 left-0 h-full bg-primary rounded-full w-0 transition-all duration-100"></div>
                             <input type="range" id="seek-slider-${sutra.id}" min="0" max="100" value="0" class="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10">
                        </div>

                        <span id="duration-${sutra.id}" class="text-xs font-mono text-slate-500 w-10">0:00</span>
                        
                        <audio id="audio-${sutra.id}" src="${sutra.audio}"></audio>
                    </div>
                </div>

                <!-- Word Breakdown -->
                <div class="flex flex-wrap justify-center gap-3 text-sm font-display leading-relaxed max-w-2xl mx-auto">
                    ${renderWordBreakdown(sutra)}
                </div>
            </section>

            <div class="w-full h-px bg-primary/10 mb-12"></div>

            <!-- Translation Cards -->
            <div class="space-y-6 max-w-3xl mx-auto">
                ${renderTranslations(sutra)}
            </div>
        </div>
    `;

    // Auto-init audio player
    initAudioPlayer(sutra.id);

    // Scroll to top
    mainContent.scrollTop = 0;

    // Load User Note
    if (typeof loadUserNote === 'function') {
        loadUserNote(id);
    }
}

// Helper to remove diacritics and common Sandhi endings for easier matching
function formatPronunciationKr(text) {
    if (!text) return '';
    // Split by '|' or '｜' and wrap each chunk in an inline-block span to prevent internal breaking
    // We include the separator in the chunk so it stays with the preceding word, or manage it separately.
    return text.split(/[|｜]/).map((chunk, index, array) => {
        // Trim and only wrap if not empty
        const trimmed = chunk.trim();
        if (!trimmed) return '';
        // Add separator if not the last chunk. 
        // User wants NO space after pipe. "word| nextword" -> "word |nextword".
        // Use ml-1 for space BEFORE pipe, so it separates from previous word, but sticks to next word.
        const separator = index < array.length - 1 ? '<span class="ml-1 opacity-50">|</span>' : '';
        return `<span class="inline-block whitespace-nowrap">${trimmed}</span>${separator}`;
    }).join('');
}

function renderPronunciation(sutra) {
    const iast = sutra.pronunciation || '';
    const hangul = sutra.pronunciation_kr || '';

    if (!iast && !hangul) return '';

    // Reverting to Stacked Display as requested
    return `
        <h2 class="text-xl md:text-2xl font-light text-slate-600 dark:text-slate-400 italic mb-8 font-serif break-keep break-words">
            ${iast}
        </h2>
        <div class="text-lg text-slate-500 dark:text-slate-500 mb-8 font-kr-serif break-keep break-words leading-relaxed">
            ${formatPronunciationKr(hangul)}
        </div>
    `;
}

function normalizeText(text) {
    let normalized = text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9]/g, ""); // Remove punctuation/spaces

    // Remove trailing h, m, s, r, associated with Visarga/Anusvara Sandhi
    // This helps match "tah" with "ta", "samadhih" with "samadhi", etc.
    normalized = normalized.replace(/[hmsr]$/, "");

    // Handle Sandhi: 'o' at the end often comes from 'ah' or 'as'.
    // We normalize 'o' to 'a' to match the stem 'a' (from 'ah' -> 'a' after stripping 'h').
    // Example: viparyayo -> viparyaya (matches viparyayah -> viparyaya)
    if (normalized.endsWith('o')) {
        normalized = normalized.slice(0, -1) + 'a';
    }

    return normalized;
}

function renderWordBreakdown(sutra) {
    // 1. Use new Tokens if available
    if (sutra.tokens && sutra.tokens.length > 0) {
        // Tokens are already sorted in data.js by reorder_tokens.ps1
        return sutra.tokens.map((token) => {
            const word = token.surface || token.lemma;
            let meaning = (token.meaning_ko || '').trim();
            let shortMeaning = (token.meaning_ko_short || '').trim();
            const etymology = token.etymology_ko || '';

            // Construct rich meaning display
            let htmlContent = '';

            // Theme's gold accent #b08d45
            const goldClass = 'text-[#b08d45] dark:text-[#c5a059]';
            const defaultClass = 'text-slate-600 dark:text-slate-400';

            // Robust deduplication check
            const cleanMeaning = meaning.replace(/[^가-힣a-zA-Z0-9]/g, '');
            const cleanShort = shortMeaning.replace(/[^가-힣a-zA-Z0-9]/g, '');
            const isDuplicate = cleanShort && (cleanMeaning === cleanShort || cleanMeaning.startsWith(cleanShort));

            if (shortMeaning && meaning && !isDuplicate) {
                // Both exist and are distinct
                htmlContent += `<span class="font-bold ${goldClass} mr-1">${shortMeaning}</span>`;
                htmlContent += `<span class="opacity-90 ${defaultClass}">${meaning}</span>`;
            } else {
                // Deduplicate: preference to shortMeaning if both exist but same, otherwise whichever exists
                const displayMeaning = (shortMeaning && meaning && isDuplicate) ? meaning : (shortMeaning || meaning);
                htmlContent += `<span class="font-bold ${goldClass}">${displayMeaning}</span>`;
            }

            if (etymology) {
                htmlContent += `<br><span class="text-xs opacity-50 mt-1 block font-normal">root: ${etymology}</span>`;
            }

            return `
        <span class="inline-flex flex-col items-start gap-0.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:border-[#b08d45]/30 transition-colors text-left">
            <span class="font-serif font-bold text-slate-800 dark:text-slate-200 text-lg leading-none mb-1">${word}</span>
            <span class="text-sm leading-snug">
                ${htmlContent}
            </span>
        </span>
            `;
        }).join('');
    }

    // 2. Fallback to existing word_meanings
    if (!sutra.word_meanings) return '';

    // Sort meaning keys by their appearance in the pronunciation string
    const entries = Object.entries(sutra.word_meanings);

    // Fallback sorting for old data structure
    if (sutra.pronunciation) {
        const p = normalizeText(sutra.pronunciation);
        entries.sort(([wordA], [wordB]) => {
            const idxA = p.indexOf(normalizeText(wordA));
            const idxB = p.indexOf(normalizeText(wordB));

            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    return entries.map(([word, meaning]) => {
        // Break meaning at '<' for better readability if it's long
        const formattedMeaning = meaning.replace(/</g, '<br><span class="opacity-60 text-xs">&lt;</span>');

        return `
        <span class="inline-flex flex-col items-start gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-colors text-left">
            <strong class="font-serif text-slate-900 dark:text-white font-bold text-lg leading-none">${word}</strong>
            <span class="text-slate-600 dark:text-slate-400 text-sm leading-snug">
                ${formattedMeaning}
            </span>
        </span>
    `}).join('');
}

function renderTranslations(sutra) {
    const translationKeys = getTranslationKeys(sutra);
    let html = '';

    // Display generic translations if available
    const keys = translationKeys.filter(k => k !== 'audio'); // Exclude audio if it leaked
    keys.forEach(key => {
        html += renderTranslationCard(sutra, [key], key, "Translation", "translate", "bg-slate-50 text-slate-600");
    });

    return html;
}



function renderTranslationCard(sutra, keys, authorName, subTitle, icon, iconClass) {
    const contents = keys.map(key => {
        // Determine language for typography
        const isEnglish = key.includes('english') || key.includes('ox-en');
        const langClass = isEnglish ? 'lang-en' : 'lang-ko';

        return `
        <div class="mb-6 last:mb-0">
            <div class="section-label">${formatLabel(key)}</div>
            <div class="content-block">
                <blockquote class="${langClass} text-[1.05rem] text-[#1f2937] dark:text-[#d1d5db] whitespace-pre-wrap">${(sutra[key] || '').trim()}</blockquote>
            </div>
        </div>
    `}).join('');

    return `
        <div class="max-w-[720px] mx-auto bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/10 hover:border-primary/40 transition-all hover:shadow-md group text-left">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full ${iconClass} flex items-center justify-center">
                        <span class="material-symbols-outlined">${icon}</span>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">${authorName}</h3>
                        <p class="text-xs text-slate-500">${subTitle}</p>
                    </div>
                </div>
                <button class="text-slate-300 group-hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">bookmark_add</span>
                </button>
            </div>
            ${contents}
        </div>
    `;
}

function getTranslationKeys(sutra) {
    const fixedKeys = ['id', 'sanskrit', 'pronunciation', 'pronunciation_kr', 'word_meanings', 'chapter', 'verse', 'grouped_verses', 'audio'];
    return Object.keys(sutra).filter(key => !fixedKeys.includes(key) && key !== 'pada').sort();
}

function formatLabel(key) {
    if (key.includes('bae_jik')) return '직역 (Literal)';
    if (key.includes('bae_uu')) return '의역 (Meaning)';
    if (key.includes('bae_han')) return '한글 발음'; // Usually skipped
    if (key.includes('ox-en')) return 'English';
    if (key === '8. ox') return 'Korean';
    if (key === '2.english') return 'English';
    if (key === '3.korean-1') return 'Korean';
    if (key === '7.dan') return 'Korean';
    return key;
}

function playAudio(id) {
    const audio = document.getElementById(`audio-${id}`);
    if (audio) {
        audio.play().catch(e => alert("Audio file not found or playback error."));
    }
}

function setupNavigation() {
    const prevBtn = document.getElementById('prev-sutra-btn');
    const nextBtn = document.getElementById('next-sutra-btn');
    if (prevBtn) prevBtn.onclick = () => navigateSutra(-1);
    if (nextBtn) nextBtn.onclick = () => navigateSutra(1);
}

function loadUserNote(id) {
    const noteArea = document.getElementById('user-note-area');
    if (noteArea) {
        noteArea.value = localStorage.getItem(`note-${id}`) || '';
    }
}

// Global saveNote function called by HTML button
// Global saveNote function called by HTML button
window.saveNote = () => {
    const noteArea = document.getElementById('user-note-area');
    if (currentSutraId && noteArea) {
        localStorage.setItem(`note-${currentSutraId}`, noteArea.value);
        alert('Note saved locally!');
    }
};

// Global exportNotes function
window.exportNotes = () => {
    let content = "YOGA SUTRAS - MY REFLECTIONS\n============================\n\n";
    let hasNotes = false;

    // Iterate through all localStorage keys
    const keys = Object.keys(localStorage).sort(); // Sort to keep order roughly nice (though Sutra 1.10 comes after 1.1)

    // Better sort: extract chapter/sutra numbers
    keys.sort((a, b) => {
        if (!a.startsWith('note-') || !b.startsWith('note-')) return 0;
        const idA = a.replace('note-', '').split('.').map(Number);
        const idB = b.replace('note-', '').split('.').map(Number);

        if (idA[0] !== idB[0]) return idA[0] - idB[0];
        return idA[1] - idB[1];
    });

    keys.forEach(key => {
        if (key.startsWith('note-')) {
            const sutraId = key.replace('note-', '');
            const note = localStorage.getItem(key);
            if (note && note.trim()) {
                hasNotes = true;
                content += `[Sutra ${sutraId}]\n${note}\n\n----------------------------\n\n`;
            }
        }
    });

    if (!hasNotes) {
        alert("No saved notes to export.");
        return;
    }

    // Create Blob and Download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoga_sutras_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

// Audio Player Logic
let currentAudio = null;
let updateInterval = null;

window.initAudioPlayer = (sutraId) => {
    const player = document.getElementById(`audio-player-${sutraId}`);
    const audio = document.getElementById(`audio-${sutraId}`);
    const playPauseBtn = document.getElementById(`play-pause-btn-${sutraId}`);
    const seekSlider = document.getElementById(`seek-slider-${sutraId}`);
    const progressBar = document.getElementById(`progress-bar-${sutraId}`);
    const currentTimeEl = document.getElementById(`current-time-${sutraId}`);
    const durationEl = document.getElementById(`duration-${sutraId}`);

    if (!player || !audio) return;

    // Helper to update button state
    const updatePlayButton = (isPlaying) => {
        playPauseBtn.innerHTML = isPlaying
            ? '<span class="material-symbols-outlined text-[24px]">pause</span>'
            : '<span class="material-symbols-outlined text-[24px]">play_arrow</span>';
    };

    // Play/Pause
    playPauseBtn.addEventListener('click', () => {
        if (audio.paused || audio.ended) {
            // Check if ended, reset to 0 if needed (though play() usually handles it, explicit is safer)
            if (audio.ended) {
                audio.currentTime = 0;
            }
            audio.play().catch(e => console.error("Audio play failed:", e));
            updatePlayButton(true);
            startProgressLoop(sutraId);
        } else {
            audio.pause();
            updatePlayButton(false);
            stopProgressLoop();
        }
    });

    // Seek
    seekSlider.addEventListener('input', () => {
        const seekTime = (audio.duration / 100) * seekSlider.value;
        audio.currentTime = seekTime;
    });

    // Update Progress
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        seekSlider.value = progress;
        progressBar.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration || 0);
    });

    // Reset when ended
    audio.addEventListener('ended', () => {
        updatePlayButton(false);
        stopProgressLoop();
        seekSlider.value = 0;
        progressBar.style.width = '0%';
        currentTimeEl.textContent = "0:00";
        audio.currentTime = 0; // Explicitly reset
    });
};

function startProgressLoop(sutraId) {
    if (updateInterval) clearInterval(updateInterval);
    // Optional: finer progress updates if 'timeupdate' isn't smooth enough
}

function stopProgressLoop() {
    if (updateInterval) clearInterval(updateInterval);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Compendium Modal Logic
// Compendium Modal Logic
window.openCompendium = () => {
    const modal = document.getElementById('compendium-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    // Use requestAnimationFrame to ensure display:block is applied before opacity transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            const content = modal.querySelector('div.bg-\\[\\#fcfaf7\\]') || modal.querySelector('div.relative');
            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        });
    });
};

window.closeCompendium = () => {
    const modal = document.getElementById('compendium-modal');
    if (!modal) return;

    modal.classList.add('opacity-0');
    const content = modal.querySelector('div.bg-\\[\\#fcfaf7\\]') || modal.querySelector('div.relative');
    if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 500);
};

function renderLandingGrid() {
    const grid = document.getElementById('landing-chapter-grid');
    if (!grid) return;

    grid.innerHTML = '';
    chapters.forEach(chap => {
        const a = document.createElement('a');
        // Grid styling: Use border-r and border-b for grid effect. Tailwind grid-cols will handle layout.
        // We'll add borders to all, and maybe clean up edges with CSS or just let them be.
        a.className = "group relative p-6 hover:bg-[#fbf9f4] transition-colors duration-500 flex flex-col items-center text-center cursor-pointer border-r border-b border-primary/10";
        a.href = `chapter.html?id=${chap.id}`;
        a.onclick = (e) => navigateToChapter(e, `chapter.html?id=${chap.id}`);
        // Subtitle (English meaning)
        const sub = getChapterSubtitle(chap.id);

        a.innerHTML = `
            <div class="mb-3 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                <span class="material-symbols-outlined text-3xl text-primary">${chap.icon}</span>
            </div>
            <div class="space-y-1">
                <span class="text-[10px] font-display tracking-[0.2em] text-primary/70 uppercase block">Chapter ${chap.id}</span>
                <h2 class="text-lg font-display text-ink group-hover:text-primary-dark transition-colors font-bold">${chap.name.replace(/^\d+\.\s*/, '')}</h2>
                 <p class="text-xs text-text-muted font-serif italic leading-relaxed break-keep break-words mt-1 opacity-80">
                    ${sub}
                </p>
                <div class="mt-4 w-6 h-px bg-primary/20 group-hover:w-12 transition-all duration-500 mx-auto"></div>
            </div>
        `;
        grid.appendChild(a);
    });
}

function getChapterSubtitle(id) {
    const subs = {
        '1': 'Lamenting the Consequences of War',
        '2': 'The Eternal Reality of the Soul\'s Immortality',
        '3': 'The Eternal Duties of Human Beings',
        '4': 'Approaching the Ultimate Truth',
        '5': 'Action and Renunciation',
        '6': 'The Science of Self Realization',
        '7': 'Knowledge of the Ultimate Truth',
        '8': 'Attainment of Salvation',
        '9': 'The Most Confidential Knowledge',
        '10': 'The Opulence of the Absolute',
        '11': 'Vision of the Universal Form',
        '12': 'The Path of Devotion',
        '13': 'Nature, the Enjoyer and Consciousness',
        '14': 'The Three Modes of Material Nature',
        '15': 'The Yoga of the Supreme Person',
        '16': 'The Divine and Demoniac Natures',
        '17': 'The Divisions of Faith',
        '18': 'Conclusion-The Perfection of Renunciation'
    };
    return subs[id] || '';
}

// Lexicon Modal Logic
// Lexicon Modal Logic
let lexiconCache = null;

window.openLexicon = () => {
    const modal = document.getElementById('lexicon-modal');
    const contentContainer = document.getElementById('lexicon-content');

    if (!modal || !contentContainer) return;

    // Show Modal immediately (Animation)
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
        });
    });

    // Use cached content if available
    if (lexiconCache) {
        if (contentContainer.innerHTML === '') {
            contentContainer.appendChild(lexiconCache);
        }
        return;
    }

    // Render content asynchronously to avoid blocking the open animation
    setTimeout(() => {
        if (typeof sutras === 'undefined' || !Array.isArray(sutras)) {
            contentContainer.innerHTML = '<p class="text-center text-red-500">Error: Vocabulary data could not be loaded.</p>';
            return;
        }

        // 1. Collect and Deduplicate Words - Case Insensitive for KEYS
        const wordMap = new Map();

        sutras.forEach(sutra => {
            if (sutra.word_meanings) {
                Object.entries(sutra.word_meanings).forEach(([word, meaning]) => {
                    const cleanWord = word.trim();
                    if (!wordMap.has(cleanWord)) {
                        wordMap.set(cleanWord, meaning);
                    }
                });
            }
        });

        // 2. Sort Alphabetically
        const sortedWords = Array.from(wordMap.entries()).sort((a, b) => {
            return a[0].localeCompare(b[0], 'en', { sensitivity: 'base' });
        });

        // 3. Collect Unique First Letters for Navigation
        const letters = [...new Set(sortedWords.map(([word]) => word[0].toUpperCase()))].sort();

        // 4. Generate HTML
        const wrapper = document.createElement('div');

        if (sortedWords.length === 0) {
            wrapper.innerHTML = '<p class="text-center text-text-muted italic">No words found.</p>';
        } else {
            // Navigation Bar (Sticky)
            const navBar = document.createElement('div');
            navBar.className = 'sticky top-0 bg-[#fcfaf7] z-10 py-3 border-b border-primary/10 flex flex-wrap gap-2 mb-6';
            letters.forEach(letter => {
                const btn = document.createElement('button');
                btn.className = 'size-8 flex items-center justify-center rounded bg-primary/5 text-primary-dark font-display font-bold hover:bg-primary/20 transition-colors text-sm';
                btn.textContent = letter;
                btn.onclick = () => {
                    const target = document.getElementById(`lexicon-letter-${letter}`);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                };
                navBar.appendChild(btn);
            });
            wrapper.appendChild(navBar);

            const list = document.createElement('ul');
            list.className = 'space-y-4';

            let lastLetter = '';
            sortedWords.forEach(([word, meaning]) => {
                const currentLetter = word[0].toUpperCase();

                const item = document.createElement('li');
                item.className = 'border-b border-primary/10 pb-3 last:border-0 hover:bg-primary/5 transition-colors p-2 rounded';

                // Add ID for the first occurrence of a letter
                if (currentLetter !== lastLetter) {
                    item.id = `lexicon-letter-${currentLetter}`;
                    lastLetter = currentLetter;

                    const divider = document.createElement('div');
                    divider.className = 'text-xs font-display text-primary/40 mb-2 mt-4 first:mt-0 font-bold';
                    divider.textContent = currentLetter;
                    list.appendChild(divider);
                }

                item.innerHTML = `
                    <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                        <span class="font-bold text-primary-dark text-xl font-display min-w-[120px]">${word}</span>
                        <span class="text-text-main font-kr-serif leading-relaxed opacity-90 break-keep break-words">${meaning}</span>
                    </div>
                `;
                list.appendChild(item);
            });
            wrapper.appendChild(list);
        }

        // Cache the result
        lexiconCache = wrapper;
        contentContainer.innerHTML = '';
        contentContainer.appendChild(wrapper);
    }, 50); // Small delay to let the modal open transition start
};

window.closeLexicon = () => {
    const modal = document.getElementById('lexicon-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 500);
};

// Commentaries Modal Logic
// Commentaries Modal Logic
window.openCommentaries = () => {
    const modal = document.getElementById('commentaries-modal');
    const contentContainer = document.getElementById('commentaries-content');

    if (!modal || !contentContainer) return;

    // Show Modal immediately
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
        });
    });

    // Render content asynchronously
    setTimeout(() => {
        // Clear previous content
        contentContainer.innerHTML = '';

        // 1. Collect Notes from LocalStorage
        const notes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('note-')) {
                const sutraId = key.substring(5); // Remove 'note-'
                const noteContent = localStorage.getItem(key);
                if (noteContent && noteContent.trim() !== '' && noteContent !== 'undefined') {
                    notes.push({ id: sutraId, content: noteContent });
                }
            }
        }

        // 2. Sort by Sutra ID (e.g., 1.1, 1.2, 2.1)
        notes.sort((a, b) => {
            const partsA = a.id.split('.').map(Number);
            const partsB = b.id.split('.').map(Number);
            if (partsA[0] !== partsB[0]) return partsA[0] - partsB[0];
            return partsA[1] - partsB[1];
        });

        // 3. Generate HTML
        if (notes.length === 0) {
            contentContainer.innerHTML = '<p class="text-center text-text-muted italic">No commentaries found. Start adding notes to Sutras!</p>';
        } else {
            const list = document.createElement('div');
            list.className = 'space-y-6';

            notes.forEach(note => {
                // Find Sutra Data for Context
                const sutraData = sutras.find(s => s.id === note.id);
                const sutraTitle = sutraData ? sutraData.sanskrit : `Sutra ${note.id}`;
                // Determine chapter for link (1.x -> 1)
                const chapterId = note.id.split('.')[0];

                const item = document.createElement('div');
                item.className = 'bg-white p-6 rounded-lg shadow-sm border border-primary/10 hover:border-primary/30 transition-colors';
                item.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <a href="chapter.html?id=${chapterId}&sutra=${note.id}" class="text-primary-dark font-display font-medium hover:underline flex items-center gap-2">
                            <span class="bg-primary/10 px-2 py-0.5 rounded text-sm">Sutra ${note.id}</span>
                            <span>${sutraTitle}</span>
                        </a>
                    </div>
                    <p class="text-text-main font-kr-serif leading-relaxed whitespace-pre-wrap break-keep break-words">${note.content}</p>
                `;
                list.appendChild(item);
            });
            contentContainer.appendChild(list);
        }
    }, 50);
};

window.closeCommentaries = () => {
    const modal = document.getElementById('commentaries-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 500);
};

// Close Modals on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeCompendium();
        window.closeLexicon();
        window.closeCommentaries();
    }
});

// Mobile UX: Toggle Tooltip on Tap
document.addEventListener('click', (e) => {
    if (window.innerWidth < 768) {
        const tooltip = e.target.closest('.tooltip-word');
        if (tooltip) {
            // Determine if we should show or hide based on current state
            // This is tricky with CSS hover. For mobile, we might rely on :active or :focus
            // Or simply let the native behavior handle it.
            // If we want a toggle:
            // tooltip.classList.toggle('active');
        }
    }
});

function navigateSutra(direction) {
    if (!currentSutraId) return;

    // Find index
    const index = sutras.findIndex(s => s.id === currentSutraId);
    if (index === -1) return;

    const nextIndex = index + direction;
    if (nextIndex >= 0 && nextIndex < sutras.length) {
        const nextSutra = sutras[nextIndex];
        // Check if next sutra is in same chapter? Or allow cross-chapter?
        // Actually, if we change chapter, we need to re-render sidebar.

        const nextChapterId = nextSutra.id.split('.')[0];
        if (nextChapterId !== currentChapterId) {
            // Change Chapter
            window.location.href = `chapter.html?id=${nextChapterId}`;
            // Note: this will reload page, which is fine.
            return;
        }

        loadSutra(nextSutra.id);
    }
}

// --- Mobile UX Toggle Functions ---

window.toggleSidebar = () => {
    const sidebar = document.getElementById('left-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        const isHidden = sidebar.classList.contains('-translate-x-full');
        if (isHidden) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('opacity-100'), 10);
        } else {
            closeAllSidebars();
        }
    }
};

window.toggleNotes = () => {
    const notes = document.getElementById('right-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (notes && overlay) {
        const isHidden = notes.classList.contains('translate-x-full');
        if (isHidden) {
            notes.classList.remove('translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('opacity-100'), 10);
        } else {
            closeAllSidebars();
        }
    }
};

window.closeAllSidebars = () => {
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (leftSidebar) leftSidebar.classList.add('-translate-x-full');
    if (rightSidebar) rightSidebar.classList.add('translate-x-full');

    if (overlay) {
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

// Update loadSutra to close mobile drawers on navigation
const originalLoadSutra = window.loadSutra;
window.loadSutra = function (id) {
    if (originalLoadSutra) originalLoadSutra(id);
    // Close sidebars on mobile after selection
    if (window.innerWidth < 1024) {
        closeAllSidebars();
    }
};

// --- Mobile Floating Nav Scroll Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const scrollContainer = document.getElementById('sutra-detail-view');
    const mobileNav = document.getElementById('mobile-nav-bar');
    let lastScrollY = 0;

    if (scrollContainer && mobileNav) {
        scrollContainer.addEventListener('scroll', () => {
            const currentScrollY = scrollContainer.scrollTop;

            // If scrolling down and not at the top, hide nav
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                mobileNav.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
            } else {
                // Scrolling up or at top, show nav
                mobileNav.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
            }

            lastScrollY = currentScrollY;
        });
    }
});

// --- User Note Logic ---

function loadUserNote(sutraId) {
    const noteArea = document.getElementById('user-note-area');
    const noteIdDisplay = document.getElementById('note-sutra-id');

    if (noteArea && noteIdDisplay) {
        noteIdDisplay.textContent = sutraId;
        noteArea.value = localStorage.getItem(`note-${sutraId}`) || '';
        // Save current sutra ID to a data attribute for saving later
        noteArea.dataset.currentSutraId = sutraId;
    }
}

window.saveNote = function () {
    const noteArea = document.getElementById('user-note-area');
    // Get sutra ID from data attribute or try to infer from UI if possible, 
    // but data attribute set by loadUserNote is safest.
    // Fallback: get from the display span
    const noteIdDisplay = document.getElementById('note-sutra-id');
    const sutraId = noteArea.dataset.currentSutraId || (noteIdDisplay ? noteIdDisplay.textContent : null);

    if (sutraId && noteArea) {
        const content = noteArea.value;
        localStorage.setItem(`note-${sutraId}`, content);

        // Show Custom Toast instead of alert
        showToast("Note saved successfully", "success");
    } else {
        showToast("Error: No active sutra selected", "error");
    }
};

window.exportNotes = function () {
    let content = "Yoga Sutras - My Reflections\n\n";
    let hasNotes = false;

    // Iterate all keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('note-')) {
            const id = key.substring(5);
            const note = localStorage.getItem(key);
            if (note && note.trim()) {
                content += `[Sutra ${id}]\n${note}\n\n-------------------\n\n`;
                hasNotes = true;
            }
        }
    }

    if (!hasNotes) {
        showToast("No notes to export.", "warning");
        return;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoga_sutras_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Notes exported to text file", "success");
};

// --- Toast Notification System ---
function showToast(message, type = 'success') {
    // Check if toast container exists, create if not
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none';
        document.body.appendChild(container);
    }

    // Create Toast Element
    const toast = document.createElement('div');

    // Theme colors matching chapter design
    // Success: Gold/Primary
    // Error: Red
    // Warning: Orange

    let colors = "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-primary/40";
    let icon = "check_circle";
    let iconColor = "text-primary";

    if (type === 'error') {
        colors = "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-red-500/40";
        icon = "error";
        iconColor = "text-red-500";
    } else if (type === 'warning') {
        colors = "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-orange-500/40";
        icon = "warning";
        iconColor = "text-orange-500";
    }

    toast.className = `flex items-center gap-3 px-6 py-3 rounded-full shadow-xl border ${colors} transform transition-all duration-300 translate-y-8 opacity-0 pointer-events-auto min-w-[300px] max-w-sm backdrop-blur-sm bg-white/95 dark:bg-slate-800/95`;

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <span class="text-sm font-medium font-serif">${message}</span>
    `;

    container.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-8', 'opacity-0');
    });

    // Remove after delay
    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}
