'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('메인 아케이드에서 기억의 조각 게임으로 이동할 수 있다', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /href="games\/memory_fragments\/index\.html"/);
  assert.match(html, />MEMORY FRAGMENTS</);
});

test('README가 새 게임 실행 링크와 참가자 입력 파일을 안내한다', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /VIVE-coding-world\/games\/memory_fragments\//);
  assert.match(readme, /games\/memory_fragments\/participants\.js/);
});

test('새 게임에서 메인 복귀와 참가자 데이터 우선 로딩을 제공한다', () => {
  const html = fs.readFileSync(path.join(root, 'games/memory_fragments/index.html'), 'utf8');
  assert.match(html, /href="\.\.\/\.\.\/index\.html"/);
  assert.ok(html.indexOf('participants.js') < html.indexOf('main.js'));
});
