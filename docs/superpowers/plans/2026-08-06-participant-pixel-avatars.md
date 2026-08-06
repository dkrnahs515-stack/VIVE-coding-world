# Participant Pixel Avatars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기억의 조각 참가자 4명에게 128×128 픽셀 상반신 아바타를 적용하고 개별 게임 바로가기 기능을 제거한다.

**Architecture:** 참가자 데이터의 `gameUrl`을 안전한 프로젝트 내부 `avatar` 경로로 교체한다. 동일한 이미지 요소 생성 함수를 카드·상세창·엔딩에서 재사용하고, 이미지가 로드되지 않으면 현재 이모지를 표시한다. 네 PNG는 프로젝트 내부 정적 자산으로 저장한다.

**Tech Stack:** HTML5, CSS, JavaScript, Node.js `node:test`, built-in image generation, PNG assets, GitHub Pages

## Global Constraints

- 아바타는 정확히 128×128 PNG 상반신 초상형이다.
- 학교명, 성별, 실제 이름 등 개인정보를 추가하지 않는다.
- 아바타는 장식 이미지로 빈 `alt`를 사용하고 `image-rendering: pixelated`를 적용한다.
- `gameUrl`, `dialogGameLink`, `이 참가자의 게임 보기`를 공개 코드에서 제거한다.
- 기존 4개 구역, 16개 기억 조각, 4개 엔딩 메시지 흐름을 유지한다.
- 이미지 실패 시 참가자 이모지로 대체한다.

---

### Task 1: 참가자 아바타 데이터 계약과 게임 링크 제거

**Files:**
- Modify: `tests/memory-fragments-participants.test.js`
- Modify: `tests/memory-fragments-links.test.js`
- Modify: `tests/memory-fragments.test.js`
- Modify: `games/memory_fragments/participants.js`
- Modify: `games/memory_fragments/main.js`

**Interfaces:**
- Consumes: `normalizeParticipants(list)`와 참가자 데이터 배열
- Produces: 정규화된 `avatar: string`, 제거된 `gameUrl`, `normalizeAvatarPath(value)`

- [ ] **Step 1: 실패 테스트 작성**

  참가자 4명의 `avatar`가 `assets/avatars/*.png` 형식인지 확인하고, 정규화 결과와 HTML/JS 소스에 `gameUrl`, `dialogGameLink`, 게임 보기 문구가 없음을 검증한다. `normalizeAvatarPath()`는 프로젝트 내부 아바타 경로만 허용하고 외부 URL과 상위 경로를 빈 문자열로 바꿔야 한다.

- [ ] **Step 2: RED 확인**

  Run: `node --test tests/memory-fragments-participants.test.js tests/memory-fragments-links.test.js tests/memory-fragments.test.js`

  Expected: `avatar` 필드와 `normalizeAvatarPath`가 없고 게임 링크 코드가 남아 있어 실패한다.

- [ ] **Step 3: 최소 데이터·정규화 구현**

  `PARTICIPANT_FIELDS`에서 `gameUrl`을 제거하고 `avatar`를 추가한다. 다음 계약으로 경로를 정규화한다.

  ```js
  function normalizeAvatarPath(value) {
    const path = cleanText(value);
    return /^assets\/avatars\/[a-z0-9-]+\.png$/.test(path) ? path : '';
  }
  ```

  네 참가자에게 아래 경로를 입력한다.

  ```text
  assets/avatars/skull-detective.png
  assets/avatars/melon-bread-maker.png
  assets/avatars/frozen-chick-warrior.png
  assets/avatars/penguin-tech-maker.png
  ```

- [ ] **Step 4: 게임 링크 코드 제거**

  `index.html`의 `dialogGameLink`, `main.js`의 요소 조회·hidden·href 처리, `.game-link` 전용 CSS를 삭제한다.

- [ ] **Step 5: GREEN 확인**

  Run: `node --test tests/memory-fragments-participants.test.js tests/memory-fragments-links.test.js tests/memory-fragments.test.js`

  Expected: PASS

- [ ] **Step 6: 변경 게시**

  GitHub 브랜치 `agent/participant-pixel-avatars`에 관련 파일만 커밋한다.

### Task 2: 128×128 픽셀 아바타 4종 제작

**Files:**
- Create: `games/memory_fragments/assets/avatars/skull-detective.png`
- Create: `games/memory_fragments/assets/avatars/melon-bread-maker.png`
- Create: `games/memory_fragments/assets/avatars/frozen-chick-warrior.png`
- Create: `games/memory_fragments/assets/avatars/penguin-tech-maker.png`

**Interfaces:**
- Consumes: Task 1의 네 `avatar` 상대 경로
- Produces: 정확히 128×128인 프로젝트 내부 PNG 네 개

- [ ] **Step 1: 이미지 생성**

  built-in image generation을 네 번 호출한다. 모든 프롬프트에 `retro 16-bit pixel art`, `bust portrait`, `centered`, `dark navy square background`, `no text`, `no logo`, `no watermark`, `clear silhouette`, `consistent pixel density`를 공통으로 넣고, 디자인 명세의 참가자별 콘셉트와 색상을 적용한다.

- [ ] **Step 2: 결과 검사와 정규화**

  생성 결과를 육안으로 확인한 뒤 프로젝트 자산 폴더로 복사하고 최근접 보간으로 128×128 PNG로 축소한다.

- [ ] **Step 3: 파일 검증**

  Run: `file games/memory_fragments/assets/avatars/*.png`

  Expected: 네 파일 모두 `PNG image data, 128 x 128`.

- [ ] **Step 4: 변경 게시**

  네 PNG만 `agent/participant-pixel-avatars` 브랜치에 추가한다.

### Task 3: 카드·상세창·엔딩 아바타 UI

**Files:**
- Modify: `tests/memory-fragments-ui.test.js`
- Modify: `games/memory_fragments/index.html`
- Modify: `games/memory_fragments/main.js`
- Modify: `games/memory_fragments/style.css`

**Interfaces:**
- Consumes: 정규화된 `participant.avatar`, `participant.emoji`, `participant.nickname`
- Produces: `createAvatar(participant, className)` DOM 이미지/대체 이모지 래퍼

- [ ] **Step 1: 실패 테스트 작성**

  카드, 상세창, 엔딩이 `avatar` 경로를 소비하고, 아바타가 없거나 로드 실패하면 이모지 대체 요소를 유지하는지 검증한다.

- [ ] **Step 2: RED 확인**

  Run: `node --test tests/memory-fragments-ui.test.js`

  Expected: 아바타 DOM 생성 기능이 없어 실패한다.

- [ ] **Step 3: 재사용 가능한 아바타 요소 구현**

  `createAvatar(participant, className)`는 래퍼 안에 빈 `alt`의 `<img>`와 이모지 `<span>`을 만들고, `error` 이벤트에서 이미지가 숨겨지고 이모지가 표시되게 한다. 카드, 상세창, 엔딩에서 같은 함수를 사용한다.

- [ ] **Step 4: 반응형 CSS 구현**

  카드 72×72, 상세창 80×80, 엔딩 48×48 크기로 적용하고, 모든 이미지에 `object-fit: cover`와 `image-rendering: pixelated`를 설정한다. 580px 이하에서는 카드 64×64, 상세창 70×70으로 축소한다.

- [ ] **Step 5: GREEN 확인**

  Run: `node --test tests/memory-fragments-ui.test.js`

  Expected: PASS

- [ ] **Step 6: 변경 게시**

  UI와 테스트 파일만 `agent/participant-pixel-avatars` 브랜치에 커밋한다.

### Task 4: 통합 검증과 배포

**Files:**
- Verify: `games/memory_fragments/**/*`
- Verify: `tests/*.test.js`

**Interfaces:**
- Consumes: Tasks 1~3 전체 결과
- Produces: 병합된 PR과 검증된 GitHub Pages 배포

- [ ] **Step 1: 전체 정적·자동 테스트**

  Run: `node --check games/memory_fragments/main.js && node --check games/memory_fragments/participants.js && node --test tests/*.test.js`

  Expected: 모든 검사 PASS, 실패 0.

- [ ] **Step 2: 브랜치 범위 확인**

  `main...agent/participant-pixel-avatars` 비교에서 명세·계획·아바타 자산·기억의 조각 코드·테스트 파일만 변경되었는지 확인한다.

- [ ] **Step 3: PR 생성 및 병합**

  변경 요약, 게임 링크 제거, 이미지 크기, 테스트 결과를 PR 본문에 기록하고 squash merge한다.

- [ ] **Step 4: 라이브 DOM·자산 검증**

  GitHub Pages에서 메인과 기억의 조각이 HTTP 200인지, 네 PNG가 HTTP 200인지 확인한다. 네 구역의 카드 16개에 아바타가 표시되고 게임 보기 링크가 없으며, 조각 16개 수집 후 엔딩 메시지 4개와 메인 복귀가 동작하는지 검사한다.
