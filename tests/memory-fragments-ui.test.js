'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../games/memory_fragments/main.js');

test('한 참가자의 답변을 구역별로 독립된 기억 조각으로 만든다', () => {
  const participants = api.normalizeParticipants([{
    nickname: '별빛',
    idea: '퍼즐 게임',
    joy: '첫 화면 완성',
    challenge: '충돌 오류',
    solution: '조건문 수정',
    learning: '끝까지 점검하기',
    message: '직접 만들어 보세요'
  }]);

  const fragments = api.buildFragments(participants);
  assert.deepEqual(fragments.map((fragment) => fragment.id), [
    'idea-0',
    'joy-0',
    'challenge-0',
    'sharing-0'
  ]);
});

test('일부 답변이 비어 있으면 내용이 있는 구역만 만든다', () => {
  const participants = api.normalizeParticipants([{
    nickname: '파도',
    idea: '달리기 게임',
    message: '재미있게 즐겨주세요'
  }]);

  const fragments = api.buildFragments(participants);
  assert.deepEqual(fragments.map((fragment) => fragment.zoneId), ['idea', 'sharing']);
});

test('마지막 한마디가 있는 참가자만 엔딩 카드에 포함한다', () => {
  const participants = api.normalizeParticipants([
    { nickname: '별빛', message: '도전해 보세요' },
    { nickname: '파도', learning: '협력의 중요성' }
  ]);

  assert.deepEqual(api.getEndingMessages(participants), [
    { nickname: '별빛', emoji: '✨', color: '#00f0ff', message: '도전해 보세요' }
  ]);
});
