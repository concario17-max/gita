# Repository Research (Bhagavad Gita App)
최신 갱신일: 2026-06-16
분석자: Ray (Codeforces Grandmaster Developer)

## 1 한 줄 요약
이 프로젝트는 React 19 + TypeScript + Vite + Tailwind CSS 4 기반의 바가바드 기타 읽기 및 학습용 정적 웹 앱임
최근 대안 1 반응형 1단 레이아웃과 아코디언-그리드 피커 리팩토링을 통해 이중 테두리와 모바일 동선 불통 문제를 완벽히 소거하여 Awwwards급의 높은 비주얼 밸런스를 확보함

## 2 프로젝트 디렉토리 아키텍처
소스 코드의 핵심은 `src` 폴더에 밀집되어 있음

- `src/main.tsx`
  - ThemeProvider, UIProvider, YogaDataProvider를 중첩하여 전역 컨텍스트를 안정적으로 공급하는 진입점

- `src/App.tsx`
  - 라우팅 정의 및 MainLayout 셸을 통한 상위 그리드 제어
  - 아코디언-그리드 기반의 ContextPillPicker 컴포넌트 포함

- `src/pages/`
  - `ChapterList.tsx`
    - 사용하지 않는 레거시로 분류됨 (현재 라우트 상 루트 진입 시 바로 DefaultVerseRedirect에 의해 1장 1절로 리다이렉션됨)
  - `VerseView.tsx`
    - 실질적인 수트라/구절 읽기 뷰어 페이지로 단어별 의미, 영어/한국어 번역 비교, 네이티브 오디오 재생기 등을 조건부 렌더링함

- `src/components/`
  - `Header.tsx`
    - 모바일과 데스크톱 레이아웃에 맞춰 알약 피커와 모드 선택 버튼을 나란히 배치하는 역할
  - `Sidebar.tsx`
    - 좌측에 위치하여 현재 구절 정보와 번역 텍스트를 요약 노출하는 영구 패널
  - `verse/`
    - `MobileVerseGuide.tsx`
      - 1024px 미만 가로 화면에서만 상단에 노출되는 콤팩트형 가이드 배너
    - `VersePanelCard.tsx`
      - 구절 및 해설 콘텐츠를 담는 섀도우 베이스 카드

- `scripts/`
  - `browser_smoke.mjs`
    - Playwright 기반의 데스크톱 & 모바일 뷰포트 E2E 자동 검증 스크립트

## 3 핵심 동작 시나리오 및 최적화 내역

### 1 반응형 1단 레이아웃 제어 (대안 1)
- 좁은 뷰포트(lg 미만) 환경에서 좌측 가이드 사이드바가 강제로 켜지며 본문 레이아웃을 붕괴시키던 문제를 청소함
- UIContext에서 모바일 초기 열림 값을 해제하고 리사이즈 시 강제 닫힘을 적용하여 모바일 화면 공간을 보장함
- 대신 Commentary(해설) 모드 진입 시 본문 상단에 `MobileVerseGuide`를 주입하여 콤팩트한 본문 흐름을 유지하도록 Reflow 처리함

### 2 아코디언-그리드 피커 도입
- 기존 네이티브 `<select>` 드롭다운 모달을 둥근 카드 형태의 고급스러운 피커 모달로 승격시킴
- `chapters` 원본 구조를 그대로 순회하여 현재 속해 있는 장을 자동 개방(Single Expand)시키는 단일 아코디언을 구축함
- 하위 절 번호들은 6열 그리드로 버튼화하여 한 눈에 전체 장/절 현황을 파악하고 쉽게 이동할 수 있게 함
- 활성화된 상태는 차별화된 HSL 골드 컬러 테두리와 섀도우 하이라이트를 통해 시각적 계층 구조를 명확히 함

### 3 헤더 이중 보더 제거 및 밸런스 튜닝
- 피커와 모드 전환기를 감싸고 있던 과도한 아우터 컨테이너 테두리를 모두 걷어냄
- 데스크톱 우측 정렬 2열 및 모바일 서브 헤더 라인 내부에서 각 컨트롤들이 나란히 밀착 정렬되도록 간격을 gap-2.5 및 gap-2 수준으로 다듬음
- 이로써 이중 테두리 및 컨트롤 높이 불균형 문제를 원천 해결하고 visual depth를 한 차원 높임

### 4 디폴트 뷰 모드와 영속성 정립
- 최초 페이지 진입 시 무조건 해설(commentary) 모드가 디폴트로 열리도록 초기 상태를 `'commentary'`로 고정함
- 사용자의 디폴트 진입 스펙을 꼬이게 만들던 `localStorage` 기반 뷰 모드 자동 복원 및 영속성 동기화 코드를 완전히 청소함

## 4 통합 테스트 및 E2E 무결성
- 기존 `browser_smoke.mjs` 가 레거시 select 요소와 ID를 추적하며 실패하던 부분을 전면 쇄신함
- Playwright가 개편된 알약 피커 트리거 버튼을 클릭하고 아코디언 장 타이틀과 절 버튼을 차례로 밟아 이동하도록 액션을 수정함
- `expectVisible` 헬퍼 내부를 비동기 대기 방식인 `.waitFor({ state: 'visible' })`로 강화하여 framer-motion 애니메이션 트레이션 레이스 컨디션을 완전히 진압함
- gita-1 데이터셋 번역가 라벨(Korean translations, Gil, Jimong, Suk)에 최적화된 대기 로직을 정교하게 반영하여 ok 상태를 검증함

## 5 잔존 이슈 및 유지 관리
- 런타임 데이터 소스 `/data.json`은 정상 로드되고 있으며 `dist/data.json`과 `public/data.json` 간의 동기화 정합성을 유지해야 함
- 향후 추가 모드 도입 시 single-responsibility 원칙에 입각하여 800라인 한계와 50라인 함수 스펙을 엄수하며 독립 모듈로 개발할 것을 권장함
