'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const corePath = path.join(__dirname, '..', 'games', 'stickman_count_rush', 'game-core.js');
const htmlPath = path.join(__dirname, '..', 'games', 'stickman_count_rush', 'index.html');
const inputPath = path.join(__dirname, '..', 'games', 'stickman_count_rush', 'input.js');
const rendererPath = path.join(__dirname, '..', 'games', 'stickman_count_rush', 'renderer.js');
const gamePath = path.join(__dirname, '..', 'games', 'stickman_count_rush', 'game.js');
const rootHtmlPath = path.join(__dirname, '..', 'index.html');
const readmePath = path.join(__dirname, '..', 'README.md');

test('게임 핵심 규칙 파일이 존재한다', () => {
  assert.ok(fs.existsSync(corePath), 'game-core.js must exist');
});

if (fs.existsSync(corePath)) {
  const Core = require(corePath);

  test('관문의 사칙연산을 적용하고 인원을 0 이상으로 제한한다', () => {
    assert.deepEqual(Core.applyGate(5, '+', 10), { count: 15, overflow: 0, delta: 10 });
    assert.deepEqual(Core.applyGate(15, 'x', 2), { count: 30, overflow: 0, delta: 15 });
    assert.deepEqual(Core.applyGate(10, '-', 15), { count: 0, overflow: 0, delta: -10 });
    assert.deepEqual(Core.applyGate(15, '/', 2), { count: 7, overflow: 0, delta: -8 });
  });

  test('인원 9999명 초과분을 별도 점수용 값으로 반환한다', () => {
    assert.deepEqual(Core.applyGate(9000, 'x', 2), {
      count: 9999,
      overflow: 8001,
      delta: 999
    });
  });

  test('군단 전투는 적은 쪽만큼 양쪽 인원을 차감한다', () => {
    assert.deepEqual(Core.resolveBattle(12, 5), {
      allies: 7,
      enemies: 0,
      defeated: 5,
      won: true
    });
    assert.deepEqual(Core.resolveBattle(3, 5), {
      allies: 0,
      enemies: 2,
      defeated: 3,
      won: false
    });
  });

  test('장애물은 현재 인원의 10퍼센트를 올림해 감소시킨다', () => {
    assert.deepEqual(Core.applyObstacleDamage(5), { count: 4, lost: 1 });
    assert.deepEqual(Core.applyObstacleDamage(101), { count: 90, lost: 11 });
    assert.deepEqual(Core.applyObstacleDamage(0), { count: 0, lost: 0 });
  });

  test('난이도는 250미터마다 한 단계 상승한다', () => {
    assert.equal(Core.getDifficulty(0).level, 1);
    assert.equal(Core.getDifficulty(249).level, 1);
    assert.equal(Core.getDifficulty(250).level, 2);
    assert.ok(Core.getDifficulty(1000).speed > Core.getDifficulty(0).speed);
    assert.ok(Core.getDifficulty(1000).enemyScale > Core.getDifficulty(0).enemyScale);
  });

  test('거리와 처치·관문·보스 기록으로 점수를 계산한다', () => {
    assert.equal(Core.calculateScore({ distance: 123.8, defeated: 4, gateGain: 10, bossWins: 1 }), 433);
  });

  test('연속 위험 관문 뒤에는 안전한 관문 조합을 보장한다', () => {
    const result = Core.createGatePair(() => 0.99, 2);
    assert.equal(result.nextDangerStreak, 0);
    assert.ok(result.gates.every((gate) => gate.kind === 'good'));
  });
}

test('게임 화면 파일이 존재한다', () => {
  assert.ok(fs.existsSync(htmlPath), 'games/stickman_count_rush/index.html must exist');
});

if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  test('시작·HUD·일시정지·결과 화면과 필수 동작을 제공한다', () => {
    for (const id of [
      'gameCanvas', 'startScreen', 'pauseScreen', 'gameOverScreen',
      'crowdValue', 'distanceValue', 'scoreValue',
      'startButton', 'pauseButton', 'resumeButton', 'restartButton'
    ]) {
      assert.match(html, new RegExp(`id=["']${id}["']`));
    }
    assert.match(html, /화면을 누른 채 좌우로 드래그/);
    assert.match(html, /좋은 관문을 선택해 군단을 키우고 적을 돌파하세요/);
    assert.match(html, /\.\.\/\.\.\/index\.html/);
  });

  test('게임 스크립트를 의존 순서대로 불러온다', () => {
    const scripts = ['game-core.js', 'renderer.js', 'input.js', 'game.js'];
    const positions = scripts.map((script) => html.indexOf(`src="${script}"`));
    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  });
}

test('드래그 입력과 2.5D 렌더러 파일이 존재한다', () => {
  assert.ok(fs.existsSync(inputPath), 'input.js must exist');
  assert.ok(fs.existsSync(rendererPath), 'renderer.js must exist');
});

if (fs.existsSync(inputPath)) {
  const Input = require(inputPath);

  test('포인터 위치를 -1부터 1 사이의 이동값으로 변환한다', () => {
    const listeners = new Map();
    const removed = [];
    const values = [];
    const canvas = {
      addEventListener(type, listener) { listeners.set(type, listener); },
      removeEventListener(type) { removed.push(type); },
      getBoundingClientRect() { return { left: 10, width: 100 }; },
      setPointerCapture() {},
      releasePointerCapture() {}
    };

    const controller = Input.createPointerController(canvas, (value) => values.push(value));
    const event = (clientX) => ({ pointerId: 1, clientX, preventDefault() {} });

    listeners.get('pointerdown')(event(10));
    listeners.get('pointermove')(event(110));
    listeners.get('pointerup')(event(110));

    assert.deepEqual(values, [-1, 1]);
    controller.destroy();
    assert.ok(removed.includes('pointercancel'));
  });

  test('브라우저가 포인터 캡처를 거부해도 드래그 입력을 계속 처리한다', () => {
    const listeners = new Map();
    const values = [];
    const canvas = {
      addEventListener(type, listener) { listeners.set(type, listener); },
      removeEventListener() {},
      getBoundingClientRect() { return { left: 0, width: 100 }; },
      setPointerCapture() { throw new Error('No active pointer'); },
      releasePointerCapture() {}
    };
    const controller = Input.createPointerController(canvas, (value) => values.push(value));
    const event = { pointerId: 9, clientX: 75, preventDefault() {} };

    assert.doesNotThrow(() => listeners.get('pointerdown')(event));
    assert.deepEqual(values, [0.5]);
    controller.destroy();
  });
}

if (fs.existsSync(rendererPath)) {
  const Renderer = require(rendererPath);

  test('실제 인원이 많아도 대표 스틱맨은 최대 120명만 표시한다', () => {
    assert.equal(Renderer.getVisibleCrowdCount(5), 5);
    assert.equal(Renderer.getVisibleCrowdCount(120), 120);
    assert.equal(Renderer.getVisibleCrowdCount(9999), 120);
  });

  test('깊이가 가까워질수록 화면 투영 비율이 커진다', () => {
    assert.ok(Renderer.getDepthScale(0.2) < Renderer.getDepthScale(0.8));
  });
}

test('무한 진행 게임 런타임 파일이 존재한다', () => {
  assert.ok(fs.existsSync(gamePath), 'game.js must exist');
});

if (fs.existsSync(gamePath)) {
  const Game = require(gamePath);
  const source = fs.readFileSync(gamePath, 'utf8');

  test('초기 월드는 5명의 군단과 비어 있는 기록 상태로 시작한다', () => {
    const world = Game.createInitialWorld();
    assert.equal(world.state, 'ready');
    assert.equal(world.crowd, 5);
    assert.equal(world.maxCrowd, 5);
    assert.equal(world.distance, 0);
    assert.deepEqual(world.objects, []);
    assert.deepEqual(world.popups, []);
  });

  test('런타임은 준비·플레이·일시정지·전투·종료 상태를 모두 정의한다', () => {
    assert.deepEqual(Game.STATES, ['ready', 'playing', 'paused', 'battle', 'gameover']);
  });

  test('저장소 오류와 손상된 기록을 안전한 기본값으로 대체한다', () => {
    const throwingStorage = { getItem() { throw new Error('blocked'); } };
    assert.deepEqual(Game.safeLoadRecords(throwingStorage), {
      bestScore: 0,
      bestDistance: 0,
      bestCrowd: 5
    });
    const invalidStorage = { getItem() { return '{broken'; } };
    assert.equal(Game.safeLoadRecords(invalidStorage).bestCrowd, 5);
  });

  test('다음 거대 스틱맨 기록 지점은 500미터 단위다', () => {
    assert.equal(Game.getNextBossDistance(0), 500);
    assert.equal(Game.getNextBossDistance(499), 500);
    assert.equal(Game.getNextBossDistance(500), 1000);
  });

  test('지나간 객체와 제거 표시 객체를 월드에서 정리한다', () => {
    const objects = [{ z: -21 }, { z: -10 }, { z: 40, remove: true }, { z: 60 }];
    assert.deepEqual(Game.cleanupObjects(objects), [{ z: -10 }, { z: 60 }]);
  });

  test('프레임 루프·탭 숨김·기록 저장·500m 보스 처리를 포함한다', () => {
    assert.match(source, /requestAnimationFrame/);
    assert.match(source, /Math\.min\([^\n]*0\.05/);
    assert.match(source, /visibilitychange/);
    assert.match(source, /localStorage/);
    assert.match(source, /500/);
    assert.match(source, /pointer/);
  });
}

test('메인 아케이드에 STICKMAN COUNT RUSH 카드가 연결된다', () => {
  const rootHtml = fs.readFileSync(rootHtmlPath, 'utf8');
  assert.match(rootHtml, /href="games\/stickman_count_rush\/index\.html"/);
  assert.match(rootHtml, /<div class="game-icon">👥<\/div>/);
  assert.match(rootHtml, /<div class="game-title">STICKMAN COUNT RUSH<\/div>/);
  assert.match(rootHtml, /좋은 관문을 선택해 군단을 늘리고 끝없이 몰려오는 적을 돌파하세요/);
});

test('README에 새 게임과 폴더 구조가 기록된다', () => {
  const readme = fs.readFileSync(readmePath, 'utf8');
  assert.match(readme, /STICKMAN COUNT RUSH/);
  assert.match(readme, /games\/stickman_count_rush/);
  assert.match(readme, /마우스·터치 드래그/);
});
