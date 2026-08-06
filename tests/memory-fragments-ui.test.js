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
    { nickname: '별빛', avatar: 'assets/avatars/pixel-maker.png', message: '도전해 보세요' },
    { nickname: '파도', learning: '협력의 중요성' }
  ]);

  assert.deepEqual(api.getEndingMessages(participants), [
    {
      nickname: '별빛',
      avatar: 'assets/avatars/pixel-maker.png',
      emoji: '✨',
      color: '#00f0ff',
      message: '도전해 보세요'
    }
  ]);
});

test('아바타 이미지가 실패하면 참가자 이모지로 대체한다', () => {
  const listeners = new Map();
  const document = {
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        children: [],
        className: '',
        hidden: false,
        alt: undefined,
        src: '',
        textContent: '',
        append(...children) { this.children.push(...children); },
        setAttribute() {},
        addEventListener(type, listener) { listeners.set(type, listener); }
      };
    }
  };
  const avatar = api.createAvatar(document, {
    avatar: 'assets/avatars/pixel-maker.png',
    emoji: '🎮'
  }, 'fragment-card-avatar');
  const [image, fallback] = avatar.children;

  assert.match(avatar.className, /fragment-card-avatar/);
  assert.equal(image.alt, '');
  assert.equal(image.src, 'assets/avatars/pixel-maker.png');
  assert.equal(fallback.hidden, true);
  listeners.get('error')();
  assert.equal(image.hidden, true);
  assert.equal(fallback.hidden, false);
  assert.equal(fallback.textContent, '🎮');
});
