import { chromium } from 'playwright';

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4174').trim();

async function getVisibleHeaderButtonIndex(page, title) {
    return page.locator('header button').evaluateAll((elements, targetTitle) => {
        return elements.findIndex((element) => {
            if (!(element instanceof HTMLElement)) {
                return false;
            }

            const isVisible = Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
            return isVisible && element.getAttribute('title') === targetTitle;
        });
    }, title);
}

async function clickVisibleHeaderButton(page, title) {
    const index = await getVisibleHeaderButtonIndex(page, title);

    if (index < 0) {
        throw new Error(`Missing visible header button: ${title}`);
    }

    await page.locator('header button').nth(index).click({ force: true });
}

async function getVerseModeToggleButtons(page) {
    return page.locator('header button[aria-pressed]:visible');
}

async function getVisibleMain(page) {
    return page.locator('main#main-scroll-container');
}

async function expectVisible(locator, message) {
    try {
        await locator.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
        throw new Error(`${message} (상세 정보: ${error.message})`);
    }
}

async function expectHidden(locator, message) {
    try {
        await locator.first().waitFor({ state: 'hidden', timeout: 5000 });
    } catch (error) {
        throw new Error(`${message} (상세 정보: ${error.message})`);
    }
}

async function expectSingleAudio(page, label) {
    const audioCount = await page.locator('audio').count();

    if (audioCount !== 1) {
        throw new Error(`동작 검사 실패: 오디오 엘리먼트가 단 하나만 존재해야 함 (${label}), 감지된 개수: ${audioCount}`);
    }
}

async function expectNoVisibleCommentaryPanel(page) {
    const visibleCommentaryPanels = page.locator('aside:visible').filter({ hasText: 'Commentary' });
    const panelCount = await visibleCommentaryPanels.count();

    if (panelCount !== 0) {
        throw new Error(`동작 검사 실패: 구절 뷰에서 보이는 Commentary 사이드 패널이 존재하지 않아야 함, 감지된 개수: ${panelCount}`);
    }

    const visibleCommentaryHeaderButtons = page.locator('header button:visible').filter({ hasText: 'Commentary' });
    const buttonCount = await visibleCommentaryHeaderButtons.count();

    if (buttonCount !== 0) {
        throw new Error(`동작 검사 실패: 구절 뷰에서 보이는 Commentary 헤더 버튼이 존재하지 않아야 함, 감지된 개수: ${buttonCount}`);
    }
}

async function expectBodyModeUi(page) {
    const main = await getVisibleMain(page);
    const bodyMarker = main.locator('section').getByText('Word meanings', { exact: true });
    const commentaryMarker = main.locator('section').getByText('COMMENTARY', { exact: true });

    await expectVisible(bodyMarker, '심화(body) 모드에서 Word meanings가 보여야 함.');
    await expectHidden(commentaryMarker, '심화(body) 모드에서 COMMENTARY 마커가 가려져 있어야 함.');
}

async function expectCommentaryModeUi(page) {
    const main = await getVisibleMain(page);
    const bodyMarker = main.locator('section').getByText('Word meanings', { exact: true });
    const commentaryMarker = main.locator('section').getByText('COMMENTARY', { exact: true });

    await expectHidden(bodyMarker, '해설(commentary) 모드에서 Word meanings가 가려져 있어야 함.');
    await expectVisible(commentaryMarker, '해설(commentary) 모드에서 COMMENTARY 마커가 보여야 함.');
}

async function toggleVerseMode(page, modeIndex) {
    const buttons = await getVerseModeToggleButtons(page);
    await buttons.nth(modeIndex).click({ force: true });
}

async function waitForVerseMode(page, modeIndex) {
    await page.waitForFunction((targetIndex) => {
        const buttons = Array.from(document.querySelectorAll('header button[aria-pressed]')).filter((element) => {
            if (!(element instanceof HTMLElement)) {
                return false;
            }

            return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
        });
        const targetButton = buttons[targetIndex];

        return targetButton instanceof HTMLElement && targetButton.getAttribute('aria-pressed') === 'true';
    }, modeIndex);
}

async function ensureSidebarOpen(page) {
    const visibleSidebar = page.locator('aside:visible, [role="complementary"]:visible, [data-sidebar]:visible, [data-drawer]:visible');

    if ((await visibleSidebar.count()) === 0) {
        await clickVisibleHeaderButton(page, 'Open chapter sidebar');
    }
}

async function waitForHomeSelects(page) {
    // 둥근 알약 모양 피커 트리거 버튼이 렌더링될 때까지 대기
    const pickerButton = page.locator('button[aria-haspopup="dialog"]:visible');
    await pickerButton.waitFor({ state: 'visible' });
}

async function getVisibleElementIndex(page, selector) {
    return page.locator(selector).evaluateAll((elements) => {
        return elements.findIndex((element) => {
            if (!(element instanceof HTMLElement)) {
                return false;
            }

            return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
        });
    });
}

async function goFromHomeToVerse(page, chapterValue, verseValue) {
    const pickerButton = page.locator('button[aria-haspopup="dialog"]:visible');
    await pickerButton.click();

    // '제3장' 텍스트가 포함된 장 버튼을 열기
    const chapterHeader = page.locator('button').filter({ hasText: `제${chapterValue}장` });
    await chapterHeader.waitFor({ state: 'visible' });
    await chapterHeader.click();

    // 해당 장 아래의 그리드 버튼 중 절 번호 버튼을 클릭
    const verseButton = page.getByRole('button', { name: `${verseValue}절`, exact: true });
    await verseButton.waitFor({ state: 'visible' });
    await verseButton.click();

    await page.waitForURL(`**/chapter/${chapterValue}/verse/${verseValue}`);
    await pickerButton.waitFor({ state: 'visible' });
    await page.getByText('COMMENTARY').first().waitFor({ state: 'visible' });
}

async function selectVisibleHeaderChapter(page, chapterValue) {
    const pickerButton = page.locator('button[aria-haspopup="dialog"]:visible');
    await pickerButton.click();

    const chapterHeader = page.locator('button').filter({ hasText: `제${chapterValue}장` });
    await chapterHeader.waitFor({ state: 'visible' });
    await chapterHeader.click();

    const verseButton = page.getByRole('button', { name: `1절`, exact: true });
    await verseButton.waitFor({ state: 'visible' });
    await verseButton.click();

    await page.waitForURL(`**/chapter/${chapterValue}/verse/1`);
    await pickerButton.waitFor({ state: 'visible' });
    await page.getByText('Korean translations').first().waitFor({ state: 'visible' });
}

async function waitForSidebarReadingCard(page) {
    const sidebarCard = page.locator('aside:visible, [role="complementary"]:visible, [data-sidebar]:visible, [data-drawer]:visible').first();

    await sidebarCard.waitFor({ state: 'visible' });
    await sidebarCard.getByText('Chapter', { exact: true }).waitFor({ state: 'visible' });
    await sidebarCard.getByText('03', { exact: true }).waitFor({ state: 'visible' });
    await sidebarCard.getByText('Verse', { exact: true }).waitFor({ state: 'visible' });
    await sidebarCard.getByText('09', { exact: true }).waitFor({ state: 'visible' });
    await sidebarCard.getByText('English', { exact: true }).waitFor({ state: 'visible' });
    await sidebarCard.getByText('Korean', { exact: true }).waitFor({ state: 'visible' });
}

async function waitForTranslationLabels(page) {
    await page.getByText('Korean translations', { exact: true }).first().waitFor({ state: 'visible' });
    await page.getByText('Gil', { exact: true }).first().waitFor({ state: 'visible' });
    await page.getByText('Jimong', { exact: true }).first().waitFor({ state: 'visible' });
    await page.getByText('Suk', { exact: true }).first().waitFor({ state: 'visible' });
}

async function verifyVerseModeToggling(page) {
    // 최초 진입 시 무조건 commentary(해설) 모드가 활성화되어 있어야 함
    await expectNoVisibleCommentaryPanel(page);
    await expectCommentaryModeUi(page);
    
    // 해설 모드에서는 오디오 태그가 비활성화되므로 0개 존재해야 함
    const initialAudioCount = await page.locator('audio').count();
    if (initialAudioCount !== 0) {
        throw new Error(`동작 검사 실패: 해설 모드에서 오디오 엘리먼트가 없어야 함, 감지된 개수: ${initialAudioCount}`);
    }

    // body(심화) 모드로 전환 동작 확인 (해설 모드는 index 0, 심화 모드는 index 1)
    await toggleVerseMode(page, 1);
    await waitForVerseMode(page, 1);

    await expectNoVisibleCommentaryPanel(page);
    await expectBodyModeUi(page);
    await expectSingleAudio(page, 'after switching to body mode');

    // 다시 commentary(해설) 모드로 무결 복귀 동작 확인
    await toggleVerseMode(page, 0);
    await waitForVerseMode(page, 0);

    await expectNoVisibleCommentaryPanel(page);
    await expectCommentaryModeUi(page);
    
    // 복귀 후 다시 해설 모드이므로 오디오 엘리먼트가 없어야 함
    const finalAudioCount = await page.locator('audio').count();
    if (finalAudioCount !== 0) {
        throw new Error(`동작 검사 실패: 해설 모드로 복귀 후 오디오 엘리먼트가 없어야 함, 감지된 개수: ${finalAudioCount}`);
    }
}

async function createPage(browser, viewport, logs, errors) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    page.on('console', (message) => {
        if (message.type() === 'error') {
            logs.push(`${viewport.width}px console: ${message.text()}`);
        }
    });

    page.on('pageerror', (error) => {
        errors.push(`${viewport.width}px pageerror: ${error.message}`);
    });

    await page.addInitScript(() => {
        if (sessionStorage.getItem('__smoke-storage-reset') === 'true') {
            return;
        }

        localStorage.removeItem('yoga-desktop-right-panel');
        localStorage.removeItem('yoga-desktop-sidebar');
        sessionStorage.setItem('__smoke-storage-reset', 'true');
    });

    return { context, page };
}

async function runDesktopFlow(browser, logs, errors) {
    const desktop = await createPage(browser, { width: 1440, height: 1000 }, logs, errors);

    await desktop.page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await waitForHomeSelects(desktop.page);
    await goFromHomeToVerse(desktop.page, '3', '9');
    await waitForHomeSelects(desktop.page);
    await verifyVerseModeToggling(desktop.page);

    await ensureSidebarOpen(desktop.page);
    await waitForSidebarReadingCard(desktop.page);

    // 번역가 라벨 검증을 위해 body(심화) 모드로 전환
    await toggleVerseMode(desktop.page, 1);
    await waitForVerseMode(desktop.page, 1);

    await selectVisibleHeaderChapter(desktop.page, '1');
    await waitForTranslationLabels(desktop.page);

    await desktop.context.close();
}

async function runMobileFlow(browser, logs, errors) {
    const mobile = await createPage(browser, { width: 390, height: 844 }, logs, errors);

    await mobile.page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await waitForHomeSelects(mobile.page);
    await goFromHomeToVerse(mobile.page, '3', '9');
    await waitForHomeSelects(mobile.page);
    await verifyVerseModeToggling(mobile.page);

    // 번역가 라벨 검증을 위해 body(심화) 모드로 전환
    await toggleVerseMode(mobile.page, 1);
    await waitForVerseMode(mobile.page, 1);

    await selectVisibleHeaderChapter(mobile.page, '1');
    await waitForTranslationLabels(mobile.page);

    await mobile.context.close();
}

async function run() {
    const logs = [];
    const errors = [];
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });

    try {
        await runDesktopFlow(browser, logs, errors);
        await runMobileFlow(browser, logs, errors);

        if (logs.length || errors.length) {
            throw new Error(JSON.stringify({ logs, errors }, null, 2));
        }

        console.log(
            JSON.stringify(
                {
                    ok: true,
                    checked: [
                        'desktop home chapter select',
                        'desktop home verse select',
                        'desktop verse header selects',
                        'desktop verse no visible commentary panel',
                        'desktop verse body mode markers',
                        'desktop verse commentary mode markers',
                        'desktop verse audio persists through toggles',
                        'desktop verse mode toggling',
                        'desktop left reading card',
                        'desktop translation labels',
                        'mobile home chapter select',
                        'mobile home verse select',
                        'mobile verse header selects',
                        'mobile verse no visible commentary panel',
                        'mobile verse body mode markers',
                        'mobile verse commentary mode markers',
                        'mobile verse audio persists through toggles',
                        'mobile verse mode toggling',
                        'mobile left reading card',
                        'mobile translation labels',
                    ],
                    baseUrl,
                },
                null,
                2,
            ),
        );
    } finally {
        await browser.close();
    }
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
