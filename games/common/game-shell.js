(function () {
  'use strict';

  const script = document.currentScript;
  const arcadeUrl = 'https://dkrnahs515-stack.github.io/VIVE-coding-world/';
  const config = {
    title: script?.dataset.title || document.title,
    goal: script?.dataset.goal || '',
    controls: script?.dataset.controls || '',
    result: script?.dataset.result || '',
    intro: script?.dataset.intro !== 'false',
    startFunction: script?.dataset.start || ''
  };

  const style = document.createElement('style');
  style.textContent = `
    .game-shell-exit{position:fixed!important;top:12px!important;left:12px!important;z-index:10001!important;display:inline-flex!important;align-items:center!important;width:auto!important;margin:0!important;padding:10px 14px!important;border:1px solid #00f0ff!important;border-radius:9px!important;background:rgba(13,13,21,.92)!important;color:#00f0ff!important;font:700 13px/1.2 Arial,"Noto Sans KR",sans-serif!important;text-decoration:none!important;box-shadow:0 0 14px rgba(0,240,255,.25)!important;cursor:pointer!important}
    .game-shell-exit:hover{background:#00f0ff!important;color:#071016!important}
    .game-shell-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(7,9,20,.96);font-family:Arial,"Noto Sans KR",sans-serif;color:#fff}
    .game-shell-overlay.is-hidden{display:none}
    .game-shell-dialog{width:min(100%,560px);max-height:calc(100vh - 40px);overflow:auto;padding:30px;border:1px solid #34426f;border-radius:20px;background:linear-gradient(145deg,#171b31,#0e1122);box-shadow:0 24px 80px rgba(0,0,0,.65)}
    .game-shell-eyebrow{text-align:center;color:#00f0ff;font-size:12px;font-weight:900;letter-spacing:2px}
    .game-shell-title{margin:10px 0 20px;text-align:center;color:#fff;font-size:clamp(26px,7vw,40px);text-shadow:0 0 18px rgba(0,240,255,.45)}
    .game-shell-info{display:grid;gap:11px;margin:0 0 22px}
    .game-shell-row{padding:14px 15px;border:1px solid #2e385f;border-radius:12px;background:#0a0d1c;line-height:1.55}
    .game-shell-row strong{display:block;margin-bottom:4px;color:#ffe600;font-size:14px}.game-shell-row span{color:#d7def7;font-size:14px}
    .game-shell-start,.game-shell-home{display:block;width:100%;padding:14px;border-radius:10px;font-weight:900;font-size:16px;cursor:pointer}
    .game-shell-start{border:0;background:linear-gradient(135deg,#00f0ff,#4777ff);color:#071016}.game-shell-home{margin-top:9px;border:1px solid #3b456e;background:#232a49;color:#fff;text-align:center;text-decoration:none}
    @media(max-width:520px){.game-shell-exit{top:8px!important;left:8px!important;padding:8px 10px!important;font-size:12px!important}.game-shell-dialog{padding:24px 17px}}
  `;
  document.head.appendChild(style);

  let exitLink = [...document.querySelectorAll('a')].find(anchor => {
    const href = anchor.getAttribute('href') || '';
    return href.includes('../../index.html') || href.includes('VIVE-coding-world');
  });
  if (!exitLink) {
    exitLink = document.createElement('a');
    document.body.appendChild(exitLink);
  }
  exitLink.href = arcadeUrl;
  exitLink.textContent = '← 메인 아케이드로 나가기';
  exitLink.classList.add('game-shell-exit');

  if (!config.intro) return;

  const overlay = document.createElement('section');
  overlay.className = 'game-shell-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'game-shell-dialog';
  const eyebrow = document.createElement('div');
  eyebrow.className = 'game-shell-eyebrow';
  eyebrow.textContent = 'GAME GUIDE';
  const title = document.createElement('h1');
  title.className = 'game-shell-title';
  title.textContent = config.title;
  const info = document.createElement('div');
  info.className = 'game-shell-info';

  [['🎯 게임 목표', config.goal], ['🎮 조작 방법', config.controls], ['🏆 승리·실패 조건', config.result]].forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'game-shell-row';
    const strong = document.createElement('strong');
    strong.textContent = label;
    const span = document.createElement('span');
    span.textContent = value;
    row.append(strong, span);
    info.appendChild(row);
  });

  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'game-shell-start';
  start.textContent = '게임 시작';
  start.addEventListener('click', () => {
    overlay.classList.add('is-hidden');
    if (config.startFunction && typeof window[config.startFunction] === 'function') {
      window[config.startFunction]();
    }
  });
  const home = document.createElement('a');
  home.className = 'game-shell-home';
  home.href = arcadeUrl;
  home.textContent = '메인으로 나가기';
  dialog.append(eyebrow, title, info, start, home);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
})();
