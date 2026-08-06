# AI 바이브 코딩 활동 기록 대표 영역 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VIVE Coding World 첫 화면에서 기억의 조각을 최우선 대표 콘텐츠로 보여주고 방문자가 AI 바이브 코딩 4회기 활동 과정을 이해한 뒤 기록 탐험으로 이동하게 한다.

**Architecture:** 루트 `index.html`의 인라인 CSS와 HTML에 독립된 활동 기록 대표 영역을 추가하고 기존 MEMORY FRAGMENTS 일반 카드를 제거한다. 기억의 조각 시작 화면은 HTML 문구와 기존 CSS만 보강하며 게임 로직과 참가자 데이터 구조는 변경하지 않는다.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Node.js `node:test`, GitHub Pages

## Global Constraints

- 대표 영역은 게임 카드 그리드보다 먼저 표시한다.
- `AI 바이브 코딩 참가자들의 활동 기록 살펴보기` 문구를 홈페이지와 기억의 조각 시작 화면에 표시한다.
- 기억의 조각 링크는 홈페이지에서 대표 버튼 한 곳에만 둔다.
- 기존 12개 게임 링크와 순서를 유지한다.
- 별도 프레임워크, 이미지 파일, 서버 저장 기능을 추가하지 않는다.
- 모바일과 `prefers-reduced-motion` 환경을 지원한다.

---

### Task 1: 대표 콘텐츠 정보 구조

**Files:**
- Modify: `tests/memory-fragments-links.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `games/memory_fragments/index.html`
- Produces: `.featured-archive`, `.archive-cta`, `.arcade-section-heading` 구조

- [ ] **Step 1: 실패하는 대표 영역 테스트 작성**

```js
test('활동 기록 대표 영역이 게임 목록보다 먼저 나오고 링크는 한 번만 제공한다', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('class="featured-archive"') < html.indexOf('class="game-container"'));
  assert.equal((html.match(/games\/memory_fragments\/index\.html/g) || []).length, 1);
  assert.match(html, /AI 바이브 코딩 참가자들의 활동 기록 살펴보기/);
  assert.equal((html.match(/class="game-card(?: secondary)?"/g) || []).length, 12);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/memory-fragments-links.test.js`
Expected: FAIL because `.featured-archive` does not exist and the memory link is still the 13th card.

- [ ] **Step 3: 홈페이지 대표 영역 구현**

헤더 아래에 상단 배지, 제목, 설명, 네 회기 카드, CTA, 기록 오브젝트를 가진 `<section class="featured-archive">`를 추가한다. 그 아래에 `참가자 제작 미니게임` 제목과 설명을 추가하고 기존 MEMORY FRAGMENTS 일반 카드를 삭제한다.

- [ ] **Step 4: 대표 영역 스타일 구현**

루트 인라인 CSS에 대형 네온 패널, 2열 레이아웃, 기억 조각 장식, 4회기 카드, CTA, 모바일 1열 배치와 감소된 움직임 설정을 추가한다.

- [ ] **Step 5: 대표 영역 테스트 통과 확인**

Run: `node --test tests/memory-fragments-links.test.js`
Expected: all tests PASS.

### Task 2: 기억의 조각 시작 화면과 안내 문서

**Files:**
- Modify: `tests/memory-fragments-links.test.js`
- Modify: `games/memory_fragments/index.html`
- Modify: `games/memory_fragments/style.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: 기존 `#introView` 시작 화면
- Produces: `.archive-purpose`, 보강된 4회기 설명, README 대표 콘텐츠 안내

- [ ] **Step 1: 실패하는 시작 화면 테스트 작성**

```js
test('기억의 조각 시작 화면이 AI 바이브 코딩 활동 기록임을 설명한다', () => {
  const html = fs.readFileSync(path.join(root, 'games/memory_fragments/index.html'), 'utf8');
  assert.match(html, /AI 바이브 코딩 참가자들의 활동 기록 살펴보기/);
  assert.match(html, /기획.*AI.*오류.*공유/s);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/memory-fragments-links.test.js`
Expected: FAIL because the new purpose text is not present.

- [ ] **Step 3: 시작 화면 설명 보강**

`AI VIBE CODING · ACTIVITY ARCHIVE`와 정확한 활동 기록 제목을 추가하고 기존 네 구역 소개 앞에 기획→AI 제작→오류 해결→공유 흐름을 설명한다.

- [ ] **Step 4: README 갱신**

메인 아케이드 소개에 기억의 조각이 대표 활동 기록이며 4회기 제작 과정을 소개한다는 내용을 추가한다.

- [ ] **Step 5: 전체 테스트 실행**

Run: `node --check games/memory_fragments/main.js && node --test tests/*.test.js`
Expected: 0 failures.

### Task 3: 배포와 공개 화면 검증

**Files:**
- Publish: `index.html`, `games/memory_fragments/index.html`, `games/memory_fragments/style.css`, `README.md`, `tests/memory-fragments-links.test.js`

**Interfaces:**
- Consumes: 자동 테스트를 통과한 정적 파일
- Produces: 배포된 메인 대표 영역과 기억의 조각 시작 화면

- [ ] **Step 1: 작업 브랜치 생성**

최신 `main`에서 `agent/featured-activity-archive` 브랜치를 만든다.

- [ ] **Step 2: 변경 파일 게시 및 PR 병합**

검증된 파일만 작업 브랜치에 게시하고 `main` 대상 PR을 생성해 병합한다.

- [ ] **Step 3: 공개 경로 검증**

메인, 기억의 조각, CSS 파일이 HTTP 200을 반환하고 공개 HTML에서 대표 영역이 게임 목록보다 먼저 나오는지 확인한다.

- [ ] **Step 4: 상호작용 회귀 검증**

공개 DOM에서 활동 기록 CTA가 기억의 조각으로 연결되고, 기억의 조각 시작→네 구역→엔딩 흐름이 유지되는지 확인한다.
