'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('활동 기록 대표 영역이 게임 목록보다 먼저 나오고 링크는 한 번만 제공한다', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('class="featured-archive"') < html.indexOf('class="game-container"'));
  assert.equal((html.match(/games\/memory_fragments\/index\.html/g) || []).length, 1);
  assert.match(html, /AI 바이브 코딩 참가자들의 활동 기록 살펴보기/);
  assert.equal((html.match(/class="game-card(?: secondary)?"/g) || []).length, 13);
  for (const session of ['1회기', '2회기', '3회기', '4회기']) assert.match(html, new RegExp(session));
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

test('기억의 조각 시작 화면이 AI 바이브 코딩 활동 기록임을 설명한다', () => {
  const html = fs.readFileSync(path.join(root, 'games/memory_fragments/index.html'), 'utf8');
  assert.match(html, /AI 바이브 코딩 참가자들의 활동 기록 살펴보기/);
  assert.match(html, /기획.*AI.*오류.*공유/s);
});

test('참가자 기억 카드에 개별 게임 바로가기를 제공하지 않는다', () => {
  const html = fs.readFileSync(path.join(root, 'games/memory_fragments/index.html'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'games/memory_fragments/main.js'), 'utf8');
  const participants = fs.readFileSync(path.join(root, 'games/memory_fragments/participants.js'), 'utf8');
  const source = `${html}\n${main}\n${participants}`;

  assert.doesNotMatch(source, /dialogGameLink|이 참가자의 게임 보기|gameUrl/);
});

test('기억 카드 상세창에 참가자 아바타 슬롯을 제공한다', () => {
  const html = fs.readFileSync(path.join(root, 'games/memory_fragments/index.html'), 'utf8');
  assert.match(html, /id="dialogAvatarSlot"/);
  assert.doesNotMatch(html, /id="dialogEmoji"/);
});
