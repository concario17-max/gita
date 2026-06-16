# Yoga Remediation Plan

Updated: 2026-03-20
Status: completed
Source of truth: `research.md`

This file tracks the full-project remediation pass requested after the latest repository-wide research review.

## 1. Guardrails and sequencing

- [x] Freeze scope to code, documentation, QA, and content mismatches found in `research.md`.
- [x] Avoid unrelated feature work during this pass.
- [x] Keep runtime behavior stable unless a stronger fix is required.
- [x] Execute work in this order:
- [x] content and encoding cleanup
- [x] stale documentation repair
- [x] stale QA and browser smoke repair
- [x] commentary and layout consistency cleanup
- [x] final verification sweep

## 2. Encoding and content cleanup

- [x] Audit the active `src/` tree for remaining encoding-corrupted user-facing strings.
- [x] Fix chapter metadata copy in `src/constants.ts`.
- [x] Fix the sidebar title in `src/components/Sidebar.tsx`.
- [x] Fix the sidebar empty state in `src/components/ui/SidebarMenu.tsx`.
- [x] Fix translation section headings in `src/components/verse/TranslationSection.tsx`.
- [x] Fix malformed and corrupted compendium copy in `src/components/CompendiumModal.tsx`.
- [x] Fix commentary study prompt copy in `src/components/CommentarySidebar.tsx`.
- [x] Normalize corrupted labels in active test fixtures.

## 3. Metadata integrity

- [x] Re-audit `YOGA_CHAPTERS_META`.
- [x] Confirm Korean chapter names match the intended wording.
- [x] Confirm English chapter names still match the runtime cards and sidebar labels.
- [x] Confirm descriptions are readable and free from encoding artifacts.
- [x] Reconfirm sutra counts match `public/data.json`.

## 4. Data loading and fallback quality

- [x] Re-review `src/utils/dataFetcher.ts` fetch-failure behavior.
- [x] Replace silent `{}` fallback with a thrown load error.
- [x] Surface provider load failures through `YogaDataContext`.
- [x] Show load error UI on the landing page in `src/pages/ChapterList.tsx`.
- [x] Show load error UI on the verse page in `src/pages/VerseView.tsx`.
- [x] Add explicit lexicon load failure UI in `src/components/LexiconModal.tsx`.
- [x] Update `src/utils/dataFetcher.test.ts` to reflect the stronger failure contract.

## 5. Commentary panel reality check

- [x] Reject the empty commentary shell as insufficient.
- [x] Define a minimum viable study-guide contract for commentary.
- [x] Implement chapter frame, key line, study prompts, and usage guidance in `src/components/CommentarySidebar.tsx`.
- [x] Keep mobile and desktop commentary drawer behavior unchanged while improving content.
- [x] Align documentation and QA expectations with the real commentary panel.

## 6. Documentation accuracy

- [x] Rewrite `README.md` to match the live app.
- [x] Remove stale reflections references from `README.md`.
- [x] Document the commentary-only right panel and current desktop frame rules.
- [x] Confirm build and QA commands in `README.md` match `package.json`.
- [x] Audit `docs/` for stale conflicting guidance.
- [x] Mark `docs/리서치.md` as historical.
- [x] Mark `docs/plan.md` as historical.

## 7. Browser smoke QA repair

- [x] Audit `scripts/browser_smoke.mjs` against the live UI.
- [x] Remove stale reflections and `textarea` assumptions.
- [x] Rewrite the smoke flow around:
- [x] landing page navigation
- [x] verse route loading
- [x] desktop commentary availability and persistence
- [x] mobile sidebar open and route selection
- [x] mobile commentary drawer open and close
- [x] Fix the storage-reset bug in the smoke script so reload-based persistence checks stay valid.

## 8. Layout and shared-frame follow-up

- [x] Reconfirm the desktop frame still uses:
- [x] `20 / 60 / 20`
- [x] `0 / 60 / 40`
- [x] `20 / 80 / 0`
- [x] `0 / 100 / 0`
- [x] Verify main-panel expansion still works when commentary is hidden.
- [x] Verify commentary gap fixes remain intact.
- [x] Keep reading-column padding readable after the earlier gap repair.
- [x] Add a targeted test for `desktopVerseLayout.ts`.

## 9. Verification

- [x] Run `npm run typecheck`.
- [x] Run `npm run test -- --run`.
- [x] Run `npm run build`.
- [x] Run `npm run qa:browser`.

## 10. Closeout

- [x] Update `research.md` to reflect the remediated repository state.
- [x] Rewrite `plan.md` so completion status is readable and current.
- [x] Keep historical notes in `docs/` but remove them as active guidance.
- [x] Record final scope and verification status in repository docs.

## 11. Chapter 4 Commentary Import

- [ ] Inspect `요가수트라 해설_4. 깨달음.odt` structure and confirm verse boundaries before generating any new data file.
- [ ] Extract chapter 4 commentary into a new `src/data/chapter4Commentary.ts` file using the shared `CommentaryBlock` / `CommentaryTable` structure.
- [ ] Preserve real tables as `table` blocks instead of flattening them into paragraphs.
- [ ] Preserve numbered list items so the shared sidebar can render `1. 2. 3.` markers rather than collapsing them into dot bullets.
- [ ] Remove non-content artifacts from the ODT import:
- [ ] `Plaintext` markers
- [ ] `Online Mode` / `Offline Mode` lines
- [ ] `참조 출처` / `Verified Sources`
- [ ] search-strategy and web-search meta labels
- [ ] other trailing reference/footer blocks that are not real commentary
- [ ] Verify chapter 4 verse keys align with the source document and that no verse numbers are skipped like the earlier missing chapter 2 verse 4 issue.
- [ ] Add chapter 4 support to the shared lookup in `src/components/CommentarySidebar.tsx` while keeping chapter 1/2/3 behavior unchanged.
- [ ] Keep the existing inline heading rule so the first title shows next to the `4.x` verse number and is not duplicated in the block list.
- [ ] Run a focused encoding audit on the generated chapter 4 file before merging, because the current `src/data/chapter3Commentary.ts` shows mojibake and the same generation path could repeat that corruption.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run build`.
- [ ] Smoke-check a few representative chapter 4 verses after import:
- [ ] one verse with a table
- [ ] one verse with numbered list items
- [ ] one verse with a trailing reference block removed

## 12. Data Synchronization Pass

Goal: synchronize the live app with the newly copied data source before any implementation work starts.

### 12.1 Source Audit

- [ ] Identify the exact external source set that was copied into this workspace.
- [ ] Compare the copied data against the active runtime contract used by `src/utils/dataFetcher.ts`.
- [ ] List every file that is authoritative for the new data set.
- [ ] Mark which files are canonical inputs, derived outputs, or legacy leftovers.

### 12.2 Schema and Shape Review

- [ ] Diff the new data shape against `src/types.ts`.
- [ ] Check whether chapter, verse, translation, pronunciation, and commentary fields still line up.
- [ ] Confirm whether `word_meanings` still normalizes cleanly into the current array shape.
- [ ] Verify whether chapter metadata in `src/constants.ts` still matches the copied source.

### 12.3 Runtime Data Flow

- [ ] Decide whether `public/data.json` remains the runtime source or needs to be regenerated/replaced.
- [ ] Check whether `dist/data.json` should be treated as a build artifact only.
- [ ] Confirm whether the dev server, production build, and browser smoke flow all resolve the same asset path.
- [ ] Identify any cached assumptions in `src/context/YogaDataContext.tsx` and `src/utils/dataFetcher.ts` that depend on the old data set.

### 12.4 Content Alignment

- [ ] Compare the copied data against the landing page chapter cards.
- [ ] Compare the copied data against verse route canonicalization and range labels.
- [ ] Compare the copied data against the left sidebar reading guide.
- [ ] Compare the copied data against the commentary sidebar content map.
- [ ] Compare the copied data against the learning comic asset mapping.
- [ ] Compare the copied data against `public/lexicon.json` and any lexicon-related UI.

### 12.5 Asset and Pipeline Check

- [ ] Verify whether any MP3 paths need renaming to match the copied data.
- [ ] Verify whether the learning comic image keys still align with chapter/verse numbering.
- [ ] Verify whether `scripts/generate_data.ps1` can still reproduce the runtime data from source files.
- [ ] Verify whether any auxiliary generated files such as `data.js` need regeneration or removal.

### 12.6 Validation Plan

- [ ] Run typecheck after the data contract is finalized.
- [ ] Run unit tests that cover data loading, verse range resolution, navigation, and desktop layout.
- [ ] Run a targeted smoke pass against the actual UI selectors after any data sync work.
- [ ] Record any newly discovered mismatches in `ERROR_LOG.md` if the work is interrupted or blocked.

### 12.7 Decision Gate

- [ ] Freeze the new canonical data source.
- [ ] Freeze the exact files that must be regenerated versus preserved.
- [ ] Freeze the list of UI surfaces that will need to be updated.
- [ ] Only then start implementation in a separate pass.

## 13. Verse Panel Chrome & Comic Padding Optimization (구절 패널 테두리 제거 및 코믹 패딩 최적화)

### 13.1 문제점 분석
- 공유 구절 패널 자체의 외곽에 불필요한 경계선이 남아 있는지 검토하고 헤더 구분선은 건드리지 않고 유지해야 함
- `VerseView.tsx` 내부 `CommentaryContent` 컴포넌트에서 학습만화 이미지를 래핑하는 `div`에 테두리(`border border-gold-border/12`)와 `p-1` 패딩이 중첩되어 만화 이미지가 작아 보이고 시각적 노이즈를 만듦

### 13.2 세분화된 TODO 리스트
- [ ] `src/pages/VerseView.tsx` 내 코믹 이미지 영역 리팩토링
  - [ ] 학습만화 이미지 래퍼 `div`에서 `border border-gold-border/12` 및 `dark:border-dark-border/50` 등 외곽 테두리 제거
  - [ ] 래퍼 패딩 `p-1`을 `p-0` 등으로 축소해 만화 뷰 크기 확대 구현
- [ ] `src/components/verse/VersePanelCard.tsx` 크롬 검토 및 청소
  - [ ] 카드 자체의 외부 보더 제거 여부 재검토 및 그림자(shadow) 기반 접지 유지 확인
  - [ ] 카드 헤더 하단 구분선(`border-b border-gold-border/8`) 및 섹션 내부선은 그대로 보존
- [ ] 품질 보증 및 통합 검증 실행
  - [ ] `npm.cmd run typecheck` 통과 확인
  - [ ] `npm.cmd run build` 프로덕션 빌드 성공 확인
  - [ ] `npm.cmd run qa:browser` 스모크 QA 테스트 통과 확인 (테두리 제거 상태에서도 에러 없이 렌더 검증 완료)

## 14. Legacy Commentary Artifacts Clean Up (요가 수트라 레거시 찌꺼기 파일 정리)

### 14.1 문제점 분석
- `src/data/` 내부에 방치된 `chapter1Commentary.ts` ~ `chapter4Commentary.ts` 파일들은 4장 구성인 요가 수트라 시절의 잔재이며 현재 바가바드 기타 뷰어에서는 임포트조차 되지 않는 순수 찌꺼기 파일임
- 바가바드 기타의 1~18장 모든 해설은 이미 `public/gita.json` 내부에 `commentary_en` 필드로 통합 서빙되고 있어 5장 이후 해설도 런타임에 아무 문제 없이 잘 출력됨
- 루트에 흩어져 있는 `.odt` 해설 원본 문서들과 `src/data/` 하위 모듈들은 리포지토리 용량과 복잡도만 늘리는 불필요한 노이즈이므로 제거 대상임

### 14.2 세분화된 TODO 리스트
- [ ] 레거시 요가 수트라 해설 파일 삭제
  - [ ] `src/data/chapter1Commentary.ts` 삭제
  - [ ] `src/data/chapter2Commentary.ts` 삭제
  - [ ] `src/data/chapter3Commentary.ts` 삭제
  - [ ] `src/data/chapter4Commentary.ts` 삭제
- [ ] 루트의 백업용 `.odt` 문서 정리 여부 확정 및 정리


## 15. Stale Documentation & Dead Code Clean Up (문서 및 미사용 레거시 정리)

### 15.1 문제점 분석
- `README.md`에서 런타임 데이터 소스가 `public/data.json`으로 안내되고 있으나 실제 `dataFetcher.ts`에서는 `public/gita.json`을 호출하고 있어 문서 동기화 오류 발생
- 라우팅 리다이렉션으로 인해 진입이 불가능한 `ChapterList.tsx` 및 하위 모달들(`CompendiumModal`, `LexiconModal`)이 사실상 미사용 레거시 코드로 방치되고 있음

### 15.2 세분화된 TODO 리스트
- [ ] `README.md` 문서 정합성 복원
  - [ ] 데이터 소스 파일명 서술을 `public/gita.json`으로 동기화 갱신
- [ ] 미사용 레거시 페이지 및 컴포넌트 리팩토링
  - [ ] 홈 챕터 리스트(`ChapterList.tsx`)와 내장 모달들의 진입 통로 복원 여부 또는 깔끔한 청소 계획 수립

## 16. Playwright Smoke Test Responsive Layout Assertion (스모크 테스트 반응형 검증 추가)

### 16.1 문제점 분석
- 최근에 적용 완료한 모바일 해상도(784px 이하)에서의 1단 레이아웃 제어 및 `MobileVerseGuide` 강제 활성화 여부를 Playwright가 자동으로 검증하지 않고 있어 회귀 방지가 어려움

### 16.2 세분화된 TODO 리스트
- [ ] `scripts/browser_smoke.mjs` 검증 케이스 주입
  - [ ] 뷰포트를 784px 이하로 축소한 뒤 좌측 사이드바가 강제로 닫혀 있고 `MobileVerseGuide` 배너가 켜져 있는지 확인하는 Assertion 추가
