# 코딩 월드 — 기억의 조각 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비어 있는 참가자 데이터 템플릿을 제공하고, 방문자가 4회기의 회고 구역을 탐험하는 13번째 웹게임을 VIVE Coding World에 추가한다.

**Architecture:** 기존 아케이드와 동일하게 빌드 없는 HTML/CSS/JavaScript를 사용한다. 참가자 원본 데이터는 `participants.js`, 검증·정규화·진행 상태와 DOM 렌더링은 `main.js`, 화면 구조와 스타일은 각각 `index.html`과 `style.css`로 분리한다. 순수 데이터 함수는 CommonJS로도 내보내 Node 내장 테스트 러너에서 검증한다.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Node.js `node:test`, GitHub Pages

## Global Constraints

- 실제 이름, 정확한 나이, 성별은 저장하거나 공개하지 않는다.
- `nickname`이 빈 참가자 객체는 공개 카드에서 제외한다.
- 참가자 데이터가 비어 있어도 시작, 네 구역 이동, 엔딩, 메인 복귀가 동작해야 한다.
- 참가자 정보와 방문 기록을 서버 또는 `localStorage`에 저장하지 않는다.
- 키보드, 포인터, 모바일 화면, `prefers-reduced-motion`을 지원한다.
- 새 외부 프레임워크나 빌드 단계를 추가하지 않는다.

---

### Task 1: 참가자 데이터 정규화 계약

**Files:**
- Create: `tests/memory-fragments.test.js`
- Create: `games/memory_fragments/main.js`
- Create: `games/memory_fragments/participants.js`

**Interfaces:**
- Consumes: `window.MEMORY_FRAGMENT_PARTICIPANTS: Participant[]`
- Produces: `normalizeParticipants(list)`, `getZoneEntries(list, zoneId)`, `sanitizeUrl(url)`, `normalizeColor(color)`

- [ ] **Step 1: 실패하는 데이터 처리 테스트 작성**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../games/memory_fragments/main.js');

test('닉네임이 빈 참가자를 공개 목록에서 제외한다', () => {
  assert.deepEqual(api.normalizeParticipants([{ nickname: '  ' }, { nickname: '별빛', idea: '게임 만들기' }]).map(item => item.nickname), ['별빛']);
});

test('답변이 있는 참가자만 해당 구역 조각으로 만든다', () => {
  const people = api.normalizeParticipants([
    { nickname: '별빛', challenge: '충돌 오류', solution: '조건문 수정' },
    { nickname: '파도', idea: '퍼즐 게임' }
  ]);
  assert.deepEqual(api.getZoneEntries(people, 'challenge').map(item => item.nickname), ['별빛']);
});

test('외부 링크는 https만 허용하고 색상은 안전한 기본값으로 대체한다', () => {
  assert.equal(api.sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(api.sanitizeUrl('https://example.com/game'), 'https://example.com/game');
  assert.equal(api.normalizeColor('red'), '#00f0ff');
  assert.equal(api.normalizeColor('#ff0055'), '#ff0055');
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/memory-fragments.test.js`
Expected: FAIL because `games/memory_fragments/main.js` does not exist.

- [ ] **Step 3: 최소 데이터 API 구현**

`main.js`에 공백 제거, 닉네임 필터, 네 구역별 필드 선택, HTTPS/상대 URL 허용, 6자리 HEX 색상 검증을 구현한다. Node에서는 `module.exports`, 브라우저에서는 `window.MemoryFragments`로 같은 API를 노출한다.

- [ ] **Step 4: 빈 데이터 템플릿 작성**

`participants.js`에 설계 문서의 12개 필드를 모두 빈 문자열로 가진 객체 하나를 배열에 넣고, 입력 방법 주석을 추가한다.

- [ ] **Step 5: 데이터 테스트 통과 확인**

Run: `node --test tests/memory-fragments.test.js`
Expected: 3 tests PASS, 0 tests FAIL.

### Task 2: 4구역 탐험 UI와 진행 상태

**Files:**
- Create: `games/memory_fragments/index.html`
- Create: `games/memory_fragments/style.css`
- Modify: `games/memory_fragments/main.js`
- Modify: `tests/memory-fragments.test.js`

**Interfaces:**
- Consumes: Task 1의 정규화된 참가자와 구역 API
- Produces: `createProgress(zoneIds, totalFragments)`, `visitZone(progress, zoneId)`, `collectFragment(progress, fragmentId)`, `isJourneyComplete(progress)` 및 브라우저 DOM 탐험 화면

- [ ] **Step 1: 실패하는 진행 상태 테스트 작성**

```js
test('빈 데이터에서는 네 구역 방문만으로 엔딩이 열린다', () => {
  let progress = api.createProgress(['idea', 'joy', 'challenge', 'sharing'], 0);
  for (const id of ['idea', 'joy', 'challenge', 'sharing']) progress = api.visitZone(progress, id);
  assert.equal(api.isJourneyComplete(progress), true);
});

test('등록된 조각은 모두 읽어야 엔딩이 열린다', () => {
  let progress = api.createProgress(['idea', 'joy'], 2);
  progress = api.visitZone(api.visitZone(progress, 'idea'), 'joy');
  progress = api.collectFragment(progress, 'idea-0');
  assert.equal(api.isJourneyComplete(progress), false);
  progress = api.collectFragment(progress, 'joy-0');
  assert.equal(api.isJourneyComplete(progress), true);
});
```

- [ ] **Step 2: 진행 상태 테스트 실패 확인**

Run: `node --test tests/memory-fragments.test.js`
Expected: FAIL because progress functions are undefined.

- [ ] **Step 3: 진행 상태 함수 구현 후 테스트 통과**

방문 구역과 수집 조각을 중복 없는 배열로 복사해 갱신하고, 모든 구역 방문 및 전체 조각 수집을 완료 조건으로 계산한다.

Run: `node --test tests/memory-fragments.test.js`
Expected: 5 tests PASS, 0 tests FAIL.

- [ ] **Step 4: 시작·탐험·모달·엔딩 HTML 작성**

`index.html`에 건너뛰기 링크, 메인 복귀 링크, 시작 패널, 네 구역 내비게이션, 조각 목록, 빈 상태, 진행 표시, 엔딩 패널, 접근성 모달을 작성한다. `participants.js`를 `main.js`보다 먼저 불러온다.

- [ ] **Step 5: 네온 기억 아카이브 스타일 작성**

CSS 변수로 청록·보라·핑크·노랑 색상을 정의한다. 카드 격자, 모달, 모바일 한 열, 44px 터치 영역, 포커스 표시, 감소된 움직임 설정을 구현한다.

- [ ] **Step 6: DOM 렌더링 연결**

시작 버튼은 탐험 화면을 열고 첫 구역을 선택한다. 구역 버튼은 방문 상태와 질문을 갱신한다. 조각 버튼은 모달을 열고 수집 수를 갱신한다. 네 구역 및 모든 조각 완료 후 엔딩 버튼을 활성화한다. 빈 구역은 안내문을 표시한다.

### Task 3: 아케이드와 문서 연결

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Modify: `tests/memory-fragments.test.js`

**Interfaces:**
- Consumes: `games/memory_fragments/index.html`
- Produces: 메인 13번째 카드와 README 실행 링크

- [ ] **Step 1: 실패하는 연결 검증 테스트 작성**

루트 `index.html`을 읽어 `games/memory_fragments/index.html` 링크가 있고, README가 `games/memory_fragments/` 실행 URL과 폴더를 안내하는지 검증한다.

- [ ] **Step 2: 연결 테스트 실패 확인**

Run: `node --test tests/memory-fragments.test.js`
Expected: FAIL because the root arcade and README do not link the new game.

- [ ] **Step 3: 메인 13번째 카드 추가**

Flappy Bird 카드 다음에 `✨ MEMORY FRAGMENTS` 카드를 추가하고, 4회기의 아이디어·고민·성장을 모으는 체험임을 설명한다.

- [ ] **Step 4: README 갱신**

게임 목록 표, 폴더 구조, 주요 기능, 참가자 회고 데이터 입력 안내에 새 게임과 `participants.js` 편집 방법을 추가한다.

- [ ] **Step 5: 전체 자동 테스트 실행**

Run: `node --test tests/*.test.js`
Expected: all tests PASS, 0 tests FAIL.

### Task 4: GitHub Pages 배포와 플레이테스트

**Files:**
- Publish: Task 1~3의 모든 생성·수정 파일

**Interfaces:**
- Consumes: 자동 테스트를 통과한 정적 파일
- Produces: `https://dkrnahs515-stack.github.io/VIVE-coding-world/games/memory_fragments/`

- [ ] **Step 1: GitHub 작업 브랜치 생성**

`agent/memory-fragments`를 최신 `main`에서 만들고 구현 파일만 커밋한다.

- [ ] **Step 2: PR 생성 및 main 반영**

변경 파일, 개인정보 최소화, 테스트 결과를 PR 설명에 기록하고 `main`에 병합한다.

- [ ] **Step 3: 배포 경로 응답 확인**

메인 페이지와 새 게임 경로가 HTTP 200을 반환하는지 확인한다.

- [ ] **Step 4: 데스크톱 플레이테스트**

1440×900 화면에서 시작→네 구역 방문→엔딩→메인 복귀를 실행하고 카드·모달·진행 표시가 겹치지 않는지 확인한다.

- [ ] **Step 5: 모바일 플레이테스트**

390×844 화면에서 가로 스크롤, 버튼 터치 영역, 모달 스크롤, 메인 복귀를 확인한다.

- [ ] **Step 6: 빈 데이터 검증**

공개 화면에 실제 이름·나이·성별이나 샘플 참가자 문장이 없고, `아직 등록된 기억의 조각이 없습니다`가 표시되는지 확인한다.
