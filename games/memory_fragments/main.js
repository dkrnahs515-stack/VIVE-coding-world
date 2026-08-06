(function (root) {
  'use strict';

  const DEFAULT_COLOR = '#00f0ff';
  const PARTICIPANT_FIELDS = [
    'nickname',
    'schoolLevel',
    'gameTitle',
    'gameUrl',
    'emoji',
    'color',
    'idea',
    'joy',
    'challenge',
    'solution',
    'learning',
    'message'
  ];
  const ZONE_FIELDS = {
    idea: ['idea'],
    joy: ['joy'],
    challenge: ['challenge', 'solution'],
    sharing: ['learning', 'message']
  };
  const ZONE_CONFIG = [
    {
      id: 'idea',
      number: '01',
      title: '아이디어 광장',
      icon: '💡',
      question: '어떤 게임이나 기능을 만들고 싶었나요?',
      answers: [['처음 만들고 싶었던 것', 'idea']]
    },
    {
      id: 'joy',
      number: '02',
      title: '제작 공방',
      icon: '🛠️',
      question: '만들면서 가장 즐거웠던 순간은 무엇인가요?',
      answers: [['가장 즐거웠던 순간', 'joy']]
    },
    {
      id: 'challenge',
      number: '03',
      title: '오류의 미로',
      icon: '🧩',
      question: '가장 어려웠던 문제를 어떻게 해결했나요?',
      answers: [['가장 어려웠던 문제', 'challenge'], ['문제를 해결한 방법', 'solution']]
    },
    {
      id: 'sharing',
      number: '04',
      title: '공유의 별빛길',
      icon: '🌠',
      question: '무엇을 배웠고 방문자에게 어떤 말을 전하고 싶나요?',
      answers: [['4회기를 통해 배운 점', 'learning'], ['방문자에게 전하고 싶은 말', 'message']]
    }
  ];

  function cleanText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function sanitizeUrl(value) {
    const url = cleanText(value);
    if (/^https:\/\//i.test(url) || /^(?:\.\/|\.\.\/)/.test(url)) return url;
    return '';
  }

  function normalizeColor(value) {
    const color = cleanText(value).toLowerCase();
    return /^#[0-9a-f]{6}$/.test(color) ? color : DEFAULT_COLOR;
  }

  function normalizeParticipant(participant) {
    const source = participant && typeof participant === 'object' ? participant : {};
    const normalized = {};
    PARTICIPANT_FIELDS.forEach((field) => {
      normalized[field] = cleanText(source[field]);
    });
    normalized.gameUrl = sanitizeUrl(normalized.gameUrl);
    normalized.color = normalizeColor(normalized.color);
    return normalized;
  }

  function normalizeParticipants(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeParticipant).filter((participant) => participant.nickname);
  }

  function getZoneEntries(participants, zoneId) {
    const fields = ZONE_FIELDS[zoneId];
    if (!fields || !Array.isArray(participants)) return [];
    return participants.filter((participant) => fields.some((field) => cleanText(participant[field])));
  }

  function buildFragments(participants) {
    const normalized = Array.isArray(participants) ? participants : [];
    return Object.keys(ZONE_FIELDS).flatMap((zoneId) => getZoneEntries(normalized, zoneId).map((participant) => ({
      id: `${zoneId}-${normalized.indexOf(participant)}`,
      zoneId,
      participant
    })));
  }

  function getEndingMessages(participants) {
    if (!Array.isArray(participants)) return [];
    return participants
      .filter((participant) => cleanText(participant.message))
      .map((participant) => ({
        nickname: participant.nickname,
        emoji: participant.emoji || '✨',
        color: normalizeColor(participant.color),
        message: participant.message
      }));
  }

  function createProgress(zoneIds, totalFragments) {
    return {
      zoneIds: Array.isArray(zoneIds) ? [...new Set(zoneIds.map(cleanText).filter(Boolean))] : [],
      visitedZones: [],
      collectedFragments: [],
      totalFragments: Number.isInteger(totalFragments) && totalFragments > 0 ? totalFragments : 0
    };
  }

  function visitZone(progress, zoneId) {
    const id = cleanText(zoneId);
    const visitedZones = progress.zoneIds.includes(id)
      ? [...new Set([...progress.visitedZones, id])]
      : [...progress.visitedZones];
    return { ...progress, visitedZones };
  }

  function collectFragment(progress, fragmentId) {
    const id = cleanText(fragmentId);
    const collectedFragments = id
      ? [...new Set([...progress.collectedFragments, id])]
      : [...progress.collectedFragments];
    return { ...progress, collectedFragments };
  }

  function isJourneyComplete(progress) {
    return progress.visitedZones.length === progress.zoneIds.length
      && progress.collectedFragments.length >= progress.totalFragments;
  }

  const api = {
    DEFAULT_COLOR,
    ZONE_FIELDS,
    ZONE_CONFIG,
    normalizeParticipants,
    getZoneEntries,
    buildFragments,
    getEndingMessages,
    sanitizeUrl,
    normalizeColor,
    createProgress,
    visitZone,
    collectFragment,
    isJourneyComplete
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MemoryFragments = api;

  function initBrowser() {
    if (!root || !root.document) return;

    const document = root.document;
    const elements = {
      intro: document.getElementById('introView'),
      explorer: document.getElementById('explorerView'),
      ending: document.getElementById('endingView'),
      start: document.getElementById('startJourney'),
      visitedCount: document.getElementById('visitedCount'),
      fragmentCount: document.getElementById('fragmentCount'),
      fragmentGrid: document.getElementById('fragmentGrid'),
      emptyState: document.getElementById('emptyState'),
      zoneEyebrow: document.getElementById('zoneEyebrow'),
      zoneTitle: document.getElementById('zoneTitle'),
      zoneQuestion: document.getElementById('zoneQuestion'),
      previous: document.getElementById('previousZone'),
      next: document.getElementById('nextZone'),
      finish: document.getElementById('finishJourney'),
      hint: document.getElementById('completionHint'),
      restart: document.getElementById('restartJourney'),
      endingMessages: document.getElementById('endingMessages'),
      loadError: document.getElementById('loadError'),
      dialog: document.getElementById('memoryDialog'),
      dialogAccent: document.getElementById('dialogAccent'),
      dialogZone: document.getElementById('dialogZone'),
      dialogEmoji: document.getElementById('dialogEmoji'),
      dialogTitle: document.getElementById('dialogTitle'),
      dialogMeta: document.getElementById('dialogMeta'),
      dialogAnswers: document.getElementById('dialogAnswers'),
      dialogGameLink: document.getElementById('dialogGameLink'),
      closeDialog: document.getElementById('closeDialog')
    };

    const required = ['intro', 'explorer', 'ending', 'start', 'fragmentGrid', 'dialog'];
    if (required.some((key) => !elements[key])) return;

    const sourceExists = Array.isArray(root.MEMORY_FRAGMENT_PARTICIPANTS);
    const participants = normalizeParticipants(sourceExists ? root.MEMORY_FRAGMENT_PARTICIPANTS : []);
    const fragments = buildFragments(participants);
    const zoneButtons = [...document.querySelectorAll('[data-zone]')];
    let progress = createProgress(ZONE_CONFIG.map((zone) => zone.id), fragments.length);
    let activeZoneIndex = 0;
    let lastTrigger = null;

    if (!sourceExists && elements.loadError) elements.loadError.hidden = false;

    function showView(target) {
      [elements.intro, elements.explorer, elements.ending].forEach((view) => {
        view.hidden = view !== target;
      });
      root.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function zoneById(zoneId) {
      return ZONE_CONFIG.find((zone) => zone.id === zoneId) || ZONE_CONFIG[0];
    }

    function fragmentsForZone(zoneId) {
      return fragments.filter((fragment) => fragment.zoneId === zoneId);
    }

    function renderProgress() {
      elements.visitedCount.textContent = `${progress.visitedZones.length} / ${progress.zoneIds.length}`;
      elements.fragmentCount.textContent = `${progress.collectedFragments.length} / ${progress.totalFragments}`;
      const complete = isJourneyComplete(progress);
      elements.finish.disabled = !complete;
      if (complete) {
        elements.hint.textContent = '모든 기억 구역을 확인했습니다. 이제 탐험을 마칠 수 있어요.';
      } else if (progress.visitedZones.length < progress.zoneIds.length) {
        elements.hint.textContent = `남은 구역 ${progress.zoneIds.length - progress.visitedZones.length}곳을 방문해 보세요.`;
      } else {
        elements.hint.textContent = `아직 읽지 않은 기억 조각이 ${progress.totalFragments - progress.collectedFragments.length}개 있어요.`;
      }

      zoneButtons.forEach((button) => {
        const visited = progress.visitedZones.includes(button.dataset.zone);
        button.classList.toggle('is-visited', visited);
        const mark = button.querySelector('.visit-mark');
        if (mark) mark.textContent = visited ? '방문 완료' : '미방문';
      });
    }

    function createFragmentCard(fragment) {
      const participant = fragment.participant;
      const button = document.createElement('button');
      const collected = progress.collectedFragments.includes(fragment.id);
      button.type = 'button';
      button.className = `fragment-card${collected ? ' is-collected' : ''}`;
      button.style.setProperty('--fragment-color', participant.color);
      button.setAttribute('aria-label', `${participant.nickname}의 기억 조각 읽기`);

      const emoji = document.createElement('span');
      emoji.className = 'fragment-card-emoji';
      emoji.textContent = participant.emoji || '✨';
      const name = document.createElement('strong');
      name.textContent = participant.nickname;
      const meta = document.createElement('span');
      meta.textContent = [participant.schoolLevel, participant.gameTitle].filter(Boolean).join(' · ') || '바이브 코딩 참가자';
      const state = document.createElement('small');
      state.textContent = collected ? '읽은 조각 · 다시 보기' : '기억 조각 열기 →';

      button.append(emoji, name, meta, state);
      button.addEventListener('click', () => openFragment(fragment, button));
      return button;
    }

    function renderZone(zoneId) {
      const zone = zoneById(zoneId);
      const zoneFragments = fragmentsForZone(zone.id);
      elements.zoneEyebrow.textContent = `ZONE ${zone.number}`;
      elements.zoneTitle.textContent = zone.title;
      elements.zoneQuestion.textContent = zone.question;
      elements.fragmentGrid.replaceChildren(...zoneFragments.map(createFragmentCard));
      elements.emptyState.hidden = zoneFragments.length > 0;

      zoneButtons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.zone === zone.id));
      });
      elements.previous.disabled = activeZoneIndex === 0;
      elements.next.disabled = activeZoneIndex === ZONE_CONFIG.length - 1;
    }

    function selectZone(zoneId) {
      activeZoneIndex = Math.max(0, ZONE_CONFIG.findIndex((zone) => zone.id === zoneId));
      const activeZone = ZONE_CONFIG[activeZoneIndex];
      progress = visitZone(progress, activeZone.id);
      renderZone(activeZone.id);
      renderProgress();
    }

    function addAnswer(label, value) {
      if (!value) return;
      const wrapper = document.createElement('section');
      wrapper.className = 'dialog-answer';
      const heading = document.createElement('strong');
      heading.textContent = label;
      const copy = document.createElement('p');
      copy.textContent = value;
      wrapper.append(heading, copy);
      elements.dialogAnswers.appendChild(wrapper);
    }

    function openFragment(fragment, trigger) {
      const participant = fragment.participant;
      const zone = zoneById(fragment.zoneId);
      lastTrigger = trigger;
      progress = collectFragment(progress, fragment.id);
      renderZone(zone.id);
      renderProgress();

      elements.dialog.style.setProperty('--dialog-color', participant.color);
      elements.dialogAccent.style.background = participant.color;
      elements.dialogZone.textContent = zone.title;
      elements.dialogEmoji.textContent = participant.emoji || '✨';
      elements.dialogTitle.textContent = participant.nickname;
      elements.dialogMeta.textContent = [participant.schoolLevel, participant.gameTitle].filter(Boolean).join(' · ') || '바이브 코딩 참가자';
      elements.dialogAnswers.replaceChildren();
      zone.answers.forEach(([label, field]) => addAnswer(label, participant[field]));

      elements.dialogGameLink.hidden = !participant.gameUrl;
      if (participant.gameUrl) elements.dialogGameLink.href = participant.gameUrl;
      elements.dialog.showModal();
      elements.closeDialog.focus();
    }

    function closeDialog() {
      if (elements.dialog.open) elements.dialog.close();
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    }

    function renderEnding() {
      const messages = getEndingMessages(participants);
      elements.endingMessages.replaceChildren();
      if (!messages.length) {
        const empty = document.createElement('p');
        empty.className = 'ending-empty';
        empty.textContent = '참가자들의 마지막 한마디는 내용 입력 후 이곳에 표시됩니다.';
        elements.endingMessages.appendChild(empty);
        return;
      }

      messages.forEach((message) => {
        const card = document.createElement('article');
        card.className = 'ending-message';
        card.style.setProperty('--message-color', message.color);
        const author = document.createElement('strong');
        author.textContent = `${message.emoji} ${message.nickname}`;
        const copy = document.createElement('p');
        copy.textContent = message.message;
        card.append(author, copy);
        elements.endingMessages.appendChild(card);
      });
    }

    elements.start.addEventListener('click', () => {
      showView(elements.explorer);
      selectZone(ZONE_CONFIG[0].id);
    });
    zoneButtons.forEach((button) => button.addEventListener('click', () => selectZone(button.dataset.zone)));
    elements.previous.addEventListener('click', () => selectZone(ZONE_CONFIG[Math.max(0, activeZoneIndex - 1)].id));
    elements.next.addEventListener('click', () => selectZone(ZONE_CONFIG[Math.min(ZONE_CONFIG.length - 1, activeZoneIndex + 1)].id));
    elements.finish.addEventListener('click', () => {
      if (!isJourneyComplete(progress)) return;
      renderEnding();
      showView(elements.ending);
    });
    elements.restart.addEventListener('click', () => {
      progress = createProgress(ZONE_CONFIG.map((zone) => zone.id), fragments.length);
      activeZoneIndex = 0;
      showView(elements.explorer);
      selectZone(ZONE_CONFIG[0].id);
    });
    elements.closeDialog.addEventListener('click', closeDialog);
    elements.dialog.addEventListener('click', (event) => {
      if (event.target === elements.dialog) closeDialog();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && elements.dialog.open) closeDialog();
    });
  }

  if (root && root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', initBrowser);
    else initBrowser();
  }
})(typeof window !== 'undefined' ? window : globalThis);
