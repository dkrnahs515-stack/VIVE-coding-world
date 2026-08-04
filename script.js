function launchGame(gamePath, gameTitle) {
    const menuView = document.getElementById('menuView');
    const gameView = document.getElementById('gameView');
    const gameFrame = document.getElementById('gameFrame');
    const currentGameTitle = document.getElementById('currentGameTitle');

    // 1. Iframe에 선택한 게임 파일 경로 바인딩
    gameFrame.src = gamePath;
    currentGameTitle.innerText = gameTitle;

    // 2. 화면 스위칭
    menuView.classList.remove('active');
    gameView.classList.add('active');
}

function closeGame() {
    const menuView = document.getElementById('menuView');
    const gameView = document.getElementById('gameView');
    const gameFrame = document.getElementById('gameFrame');

    // 1. 게임 프레임 비우기 (오디오 및 게임 루프 완전히 종료)
    gameFrame.src = '';

    // 2. 메인 메뉴 화면으로 복귀
    gameView.classList.remove('active');
    menuView.classList.add('active');
}
