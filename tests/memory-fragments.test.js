'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../games/memory_fragments/main.js');

test('닉네임이 빈 참가자를 공개 목록에서 제외한다', () => {
  const participants = api.normalizeParticipants([
    { nickname: '  ' },
    { nickname: '별빛', idea: '게임 만들기' }
  ]);

  assert.deepEqual(participants.map((participant) => participant.nickname), ['별빛']);
});

test('답변이 있는 참가자만 해당 구역 조각으로 만든다', () => {
  const participants = api.normalizeParticipants([
    { nickname: '별빛', challenge: '충돌 오류', solution: '조건문 수정' },
    { nickname: '파도', idea: '퍼즐 게임' }
  ]);

  assert.deepEqual(
    api.getZoneEntries(participants, 'challenge').map((participant) => participant.nickname),
    ['별빛']
  );
});

test('프로젝트 내부 아바타 경로만 허용하고 색상은 안전한 기본값으로 대체한다', () => {
  assert.equal(api.normalizeAvatarPath('https://example.com/avatar.png'), '');
  assert.equal(api.normalizeAvatarPath('../avatar.png'), '');
  assert.equal(api.normalizeAvatarPath('assets/avatars/person.jpg'), '');
  assert.equal(api.normalizeAvatarPath('assets/avatars/pixel-maker.png'), 'assets/avatars/pixel-maker.png');
  assert.equal(api.normalizeColor('red'), '#00f0ff');
  assert.equal(api.normalizeColor('#ff0055'), '#ff0055');
});

test('빈 데이터에서는 네 구역 방문만으로 엔딩이 열린다', () => {
  let progress = api.createProgress(['idea', 'joy', 'challenge', 'sharing'], 0);
  for (const zoneId of ['idea', 'joy', 'challenge', 'sharing']) {
    progress = api.visitZone(progress, zoneId);
  }

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
