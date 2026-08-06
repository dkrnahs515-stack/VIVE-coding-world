const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const participantsPath = path.join(__dirname, '..', 'games', 'memory_fragments', 'participants.js');
const participantSource = fs.readFileSync(participantsPath, 'utf8');
const context = { window: {} };
vm.runInNewContext(participantSource, context);

const participants = context.window.MEMORY_FRAGMENT_PARTICIPANTS;

test('동의한 닉네임 4명의 활동 기록을 네 구역에서 공개한다', () => {
  const api = require('../games/memory_fragments/main.js');
  const normalized = api.normalizeParticipants(participants);

  assert.deepEqual(
    Array.from(normalized, (participant) => participant.nickname),
    ['닠네임💀', '멜론빵맨🍈🍞', '냉동병아리🦟', '미니미니메추리🐧']
  );
  assert.equal(api.buildFragments(normalized).length, 16);
  assert.equal(api.getEndingMessages(normalized).length, 4);
});

test('공개 참가자 데이터에 성별과 학교 정보를 저장하지 않는다', () => {
  const serialized = JSON.stringify(participants);

  assert.doesNotMatch(serialized, /화곡중학교|영동초등학교|월정초등학교/);
  participants.forEach((participant) => {
    assert.equal(participant.schoolLevel, '');
    assert.equal(Object.hasOwn(participant, 'gender'), false);
  });
});
