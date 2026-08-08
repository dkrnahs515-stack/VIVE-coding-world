# STICKMAN COUNT RUSH Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Canvas 2.5D endless crowd runner, add it to VIVE Coding World, and deploy it through GitHub Pages.

**Architecture:** Plain HTML, CSS, and JavaScript with no build step. Pure crowd arithmetic, scoring, difficulty, and battle rules live in `game-core.js`; Canvas drawing, pointer input, and runtime orchestration remain isolated in their own files under a shared `StickmanRush` namespace.

**Tech Stack:** HTML5 Canvas 2D, CSS, JavaScript, Pointer Events, `requestAnimationFrame`, `localStorage`, Node.js built-in test runner.

## Global Constraints

- The game must run from `games/stickman_count_rush/` on GitHub Pages without external game engines or a build step.
- The playfield uses a bright, original 2.5D stickman visual direction and does not copy Count Masters names, assets, UI, or levels.
- Input is mouse and touch drag only; the crowd auto-runs.
- The runtime supports `ready`, `playing`, `paused`, `battle`, and `gameover` states.
- Actual crowd count is capped at 9,999; at most 120 representative stickmen are rendered.
- Every game screen includes a route back to the VIVE Coding World main arcade.

---

## File Map

- Create `games/stickman_count_rush/index.html`: Canvas, start overlay, HUD, pause overlay, game-over overlay, navigation.
- Create `games/stickman_count_rush/style.css`: responsive portrait game shell and overlays.
- Create `games/stickman_count_rush/game-core.js`: pure gate, battle, score, difficulty, cap, and safe-generation functions.
- Create `games/stickman_count_rush/renderer.js`: Canvas 2.5D projection and drawing functions.
- Create `games/stickman_count_rush/input.js`: Pointer Events drag adapter.
- Create `games/stickman_count_rush/game.js`: state machine, endless spawning, collision, persistence, DOM updates, loop.
- Create `tests/stickman-count-rush.test.js`: core and integration contract tests.
- Modify `index.html`: append the new arcade card.
- Modify `README.md`: add the game row, structure entry, and controls description.

### Task 1: Pure gameplay rules

**Files:**
- Create: `tests/stickman-count-rush.test.js`
- Create: `games/stickman_count_rush/game-core.js`

**Interfaces:**
- Produces: `StickmanRush.Core.applyGate(count, operator, value) -> { count, overflow, delta }`
- Produces: `StickmanRush.Core.resolveBattle(allies, enemies) -> { allies, enemies, defeated, won }`
- Produces: `StickmanRush.Core.getDifficulty(distance) -> { level, speed, enemyScale, hazardChance }`
- Produces: `StickmanRush.Core.calculateScore({ distance, defeated, gateGain, bossWins }) -> number`
- Produces: `StickmanRush.Core.createGatePair(random, dangerStreak) -> { gates, nextDangerStreak }`

- [ ] **Step 1: Write failing unit tests**

```js
test('applies all gate operations and caps crowd at 9999', () => {
  assert.equal(Core.applyGate(5, '+', 10).count, 15);
  assert.equal(Core.applyGate(15, 'x', 2).count, 30);
  assert.equal(Core.applyGate(10, '-', 15).count, 0);
  assert.equal(Core.applyGate(15, '/', 2).count, 7);
  assert.deepEqual(Core.applyGate(9000, 'x', 2), { count: 9999, overflow: 8001, delta: 999 });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: FAIL because `game-core.js` or `StickmanRush.Core` does not exist.

- [ ] **Step 3: Implement the minimal pure rule API**

```js
(function (root) {
  const MAX_CROWD = 9999;
  function applyGate(count, operator, value) {
    const raw = operator === '+' ? count + value
      : operator === '-' ? count - value
      : operator === 'x' ? count * value
      : Math.floor(count / value);
    const clamped = Math.max(0, Math.min(MAX_CROWD, raw));
    return { count: clamped, overflow: Math.max(0, raw - MAX_CROWD), delta: clamped - count };
  }
  root.StickmanRush = root.StickmanRush || {};
  root.StickmanRush.Core = { MAX_CROWD, applyGate, resolveBattle, getDifficulty, calculateScore, createGatePair };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run the unit tests**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: all core rule tests PASS.

- [ ] **Step 5: Commit Task 1 files to `agent/stickman-count-rush-design`**

Commit message: `STICKMAN COUNT RUSH 게임 규칙 구현`

### Task 2: Game page and responsive UI

**Files:**
- Create: `games/stickman_count_rush/index.html`
- Create: `games/stickman_count_rush/style.css`
- Modify: `tests/stickman-count-rush.test.js`

**Interfaces:**
- Produces DOM IDs: `gameCanvas`, `startScreen`, `pauseScreen`, `gameOverScreen`, `crowdValue`, `distanceValue`, `scoreValue`, `startButton`, `pauseButton`, `resumeButton`, `restartButton`.
- Consumes scripts in order: `game-core.js`, `renderer.js`, `input.js`, `game.js`.

- [ ] **Step 1: Add failing HTML contract tests**

```js
for (const id of ['gameCanvas', 'startScreen', 'pauseScreen', 'gameOverScreen', 'startButton', 'pauseButton', 'restartButton']) {
  assert.match(html, new RegExp(`id=["']${id}["']`));
}
assert.match(html, /화면을 누른 채 좌우로 드래그/);
assert.match(html, /\.\.\/\.\.\/index\.html/);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: FAIL because the game page is missing.

- [ ] **Step 3: Build the accessible start, HUD, pause, and result overlays**

Use a portrait `.game-shell`, a full-size `<canvas>`, DOM HUD above the Canvas, modal overlays with `aria-labelledby`, and an arcade link `../../index.html` on start and result screens.

- [ ] **Step 4: Add responsive CSS**

Set `touch-action: none` on the Canvas, cap the shell at `480px`, use `100dvh` on small screens, keep buttons at least `48px` high, and use `prefers-reduced-motion` to disable decorative animation.

- [ ] **Step 5: Run HTML contract tests**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: page contract tests PASS.

- [ ] **Step 6: Commit Task 2 files**

Commit message: `STICKMAN COUNT RUSH 화면 구성`

### Task 3: Pointer input and 2.5D renderer

**Files:**
- Create: `games/stickman_count_rush/input.js`
- Create: `games/stickman_count_rush/renderer.js`
- Modify: `tests/stickman-count-rush.test.js`

**Interfaces:**
- Produces: `StickmanRush.Input.createPointerController(canvas, onMove) -> { destroy, reset }`
- Produces: `StickmanRush.Renderer.createRenderer(canvas) -> { resize, render }`
- Consumes world shape: `{ playerX, crowd, distance, objects, popups, state, time }`.

- [ ] **Step 1: Add failing source contract tests**

Assert Pointer Events include `pointerdown`, `pointermove`, `pointerup`, and `pointercancel`; assert renderer caps visible crowd using `Math.min(crowd, 120)` and exposes `resize` and `render`.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: FAIL because input and renderer files are missing.

- [ ] **Step 3: Implement drag input**

Normalize pointer movement to `[-1, 1]`, call `setPointerCapture`, prevent default movement, and clear drag state on pointer cancel or window blur.

- [ ] **Step 4: Implement Canvas projection and drawing**

Project world depth `z` using a horizon-to-bottom interpolation, draw a trapezoid road, pastel skyline, gates, obstacles, crowds, stickman limb animation, shadows, and count popups. Limit device pixel ratio to 2.

- [ ] **Step 5: Run source contract tests**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: all input and renderer contract tests PASS.

- [ ] **Step 6: Commit Task 3 files**

Commit message: `STICKMAN COUNT RUSH 2.5D 렌더러 구현`

### Task 4: Endless runtime, collisions, persistence, and restart

**Files:**
- Create: `games/stickman_count_rush/game.js`
- Modify: `tests/stickman-count-rush.test.js`

**Interfaces:**
- Consumes: `Core`, `Input.createPointerController`, `Renderer.createRenderer`, DOM IDs from Task 2.
- Produces: a complete playable loop launched after `DOMContentLoaded`.

- [ ] **Step 1: Add failing runtime contract tests**

Assert the source contains `requestAnimationFrame`, a clamped delta time, all five states, `visibilitychange`, safe `localStorage` wrappers, object cleanup, 500m boss spawning, and restart state reset.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: FAIL because `game.js` is missing.

- [ ] **Step 3: Implement world state and spawn scheduler**

Start with 5 allies, spawn gates every 80–120m, enemies after 2–3 gate pairs, a boss every 500m, and hazards according to `getDifficulty(distance)`.

- [ ] **Step 4: Implement collision and battle updates**

Apply one gate per pair, process obstacle damage once with a 0.5s immunity window, pause forward spawning during `battle`, remove one ally and enemy at fixed battle ticks, and trigger game over at zero allies.

- [ ] **Step 5: Implement score, record persistence, pause, and restart**

Store `bestScore`, `bestDistance`, and `bestCrowd` under the key `stickmanCountRushRecords`; wrap JSON parse/stringify and storage access in `try/catch`.

- [ ] **Step 6: Run all game tests**

Run: `node --check games/stickman_count_rush/game.js && node --test tests/stickman-count-rush.test.js`
Expected: PASS.

- [ ] **Step 7: Commit Task 4 files**

Commit message: `STICKMAN COUNT RUSH 무한 진행 구현`

### Task 5: Arcade and README integration

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Modify: `tests/stickman-count-rush.test.js`

**Interfaces:**
- Produces arcade URL: `games/stickman_count_rush/index.html`.

- [ ] **Step 1: Add failing integration tests**

Assert root `index.html` includes the exact title, card description, icon `👥`, and local href. Assert `README.md` includes the game row and directory.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/stickman-count-rush.test.js`
Expected: FAIL because the arcade and README do not mention the game.

- [ ] **Step 3: Add the arcade card**

Append a new alternating card before the add-more comment with title `STICKMAN COUNT RUSH`, icon `👥`, and description `좋은 관문을 선택해 군단을 늘리고 끝없이 몰려오는 적을 돌파하세요.`

- [ ] **Step 4: Update README**

Add the game to the table, file tree, and play instructions; keep the participant production footer unchanged.

- [ ] **Step 5: Run the full repository tests**

Run: `node --check games/stickman_count_rush/game-core.js && node --check games/stickman_count_rush/renderer.js && node --check games/stickman_count_rush/input.js && node --check games/stickman_count_rush/game.js && node --test tests/*.test.js`
Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit Task 5 files**

Commit message: `메인 아케이드에 STICKMAN COUNT RUSH 추가`

### Task 6: Browser playtest and GitHub Pages handoff

**Files:**
- Modify only files required by verified defects.

**Interfaces:**
- Consumes the deployed game and arcade URLs.
- Produces a verified draft PR ready to merge.

- [ ] **Step 1: Run a local HTTP server and desktop smoke test**

Run: `python3 -m http.server 4173`
Verify start, drag, gates, battle, pause, game over, restart, and arcade exit.

- [ ] **Step 2: Run mobile viewport smoke tests**

Test portrait widths 320px, 375px, and 430px. Verify no page scroll while dragging, readable HUD, and accessible overlay buttons.

- [ ] **Step 3: Run a performance soak**

Use a debug record with crowd count above 120 and confirm only 120 representatives render, objects behind the player are removed, and the loop remains responsive.

- [ ] **Step 4: Fix only observed defects and rerun all tests**

Run the full Task 5 command after each correction.

- [ ] **Step 5: Push all changed files to draft PR #6 and review its final patch**

Confirm only the plan, game folder, new test, root card, and README are changed.

- [ ] **Step 6: Mark PR ready, merge to `main`, and verify GitHub Pages**

Verify:
- `https://dkrnahs515-stack.github.io/VIVE-coding-world/`
- `https://dkrnahs515-stack.github.io/VIVE-coding-world/games/stickman_count_rush/`
