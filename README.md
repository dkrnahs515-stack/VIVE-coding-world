# 🎮 VIVE Coding World

강서청소년회관 **바이브 코딩 1·2 참가자들이 직접 제작한 웹 기반 미니게임 아케이드**입니다.

HTML, CSS, JavaScript로 제작된 게임을 한곳에서 선택해 플레이할 수 있으며, GitHub Pages를 통해 별도의 설치 없이 PC·태블릿·스마트폰 브라우저에서 실행할 수 있습니다.

## 🌐 바로가기

- [VIVE Coding World 메인 아케이드](https://dkrnahs515-stack.github.io/VIVE-coding-world/)

## 🕹️ 수록 게임

| 게임 | 장르 | 주요 내용 | 실행 |
|---|---|---|---|
| 🕵️ **MAFIA GAME** | 추리·토론 | 3~8명이 한 기기를 돌아가며 역할을 확인하고 마피아를 찾아내는 게임 | [플레이](https://dkrnahs515-stack.github.io/VIVE-coding-world/games/mafia/) |
| 🤥 **LIAR GAME** | 추리·파티 | 제시어를 모르는 라이어를 찾아내는 3~8인용 게임. 동점 재투표와 라이어 역전승 지원 | [플레이](https://dkrnahs515-stack.github.io/VIVE-coding-world/games/liar/) |
| ⚔️ **ENHANCE SWORD** | 확률·성장 | 골드를 모아 검을 강화하고 전설의 검에 도전하는 게임 | [플레이](https://dkrnahs515-stack.github.io/VIVE-coding-world/games/sword/) |
| ⚡ **NEON DASH** | 액션·러닝 | 자동으로 달리는 네온 큐브를 점프시켜 장애물을 피하고 완주하는 게임 | [플레이](https://dkrnahs515-stack.github.io/VIVE-coding-world/games/geometry_dash/) |
| 🪜 **INFINITE STAIRS** | 순발력·액션 | 300초 동안 방향을 판단하며 끝없이 이어지는 계단을 올라가는 게임 | [플레이](https://dkrnahs515-stack.github.io/VIVE-coding-world/games/infinite_stairs/) |
| 🏃 **VIBE ESCAPE** | 액션·대탈출 | 캐릭터를 선택하고 50개 스테이지와 보스를 돌파하는 게임 | [플레이](https://dkrnahs515-stack.github.io/gsyouth-exit-/) |

> **VIBE ESCAPE**는 별도의 GitHub Pages 프로젝트로 운영되며, VIVE Coding World 메인 아케이드에서 연결됩니다.

## ✅ 아케이드 주요 기능

- 게임별 선택 카드와 간단한 소개
- PC·태블릿·스마트폰 반응형 화면
- 별도 설치 없이 웹 브라우저에서 실행
- 각 게임의 다시 시작 및 게임 종료 기능
- 키보드·마우스·터치 조작 지원
- GitHub Pages를 이용한 웹 배포

## 📁 저장소 구조

```text
VIVE-coding-world/
├─ index.html
├─ README.md
└─ games/
   ├─ mafia/
   │  └─ index.html
   ├─ liar/
   │  └─ index.html
   ├─ sword/
   │  └─ index.html
   ├─ geometry_dash/
   │  └─ index.html
   └─ infinite_stairs/
      └─ index.html
```

- 루트 `index.html`: 전체 게임을 보여주는 메인 아케이드
- `games/게임명/index.html`: 각 게임의 실행 파일
- `README.md`: 프로젝트와 게임 구성 안내

## 🎮 이용 방법

1. [메인 아케이드](https://dkrnahs515-stack.github.io/VIVE-coding-world/)에 접속합니다.
2. 플레이할 게임 카드를 선택합니다.
3. 게임 화면의 규칙과 조작 방법을 확인합니다.
4. **PLAY NOW** 버튼을 눌러 게임을 시작합니다.
5. 게임이 끝나면 다시 플레이하거나 메인 아케이드로 돌아갑니다.

## ➕ 새로운 게임 추가 방법

1. `games/` 폴더 안에 새 게임 폴더를 만듭니다.
2. 게임의 시작 파일 이름을 `index.html`로 지정합니다.
3. 루트 `index.html`의 `.game-container` 안에 새 게임 카드를 추가합니다.
4. 카드의 링크를 `games/새게임폴더/index.html`로 연결합니다.
5. GitHub Pages 배포 후 PC와 모바일에서 실행 상태를 확인합니다.

> 게임 폴더만 추가하면 메인 카드가 자동으로 생성되지 않습니다. 반드시 루트 `index.html`에도 게임 카드를 추가해야 합니다.

## 🔜 추천 개선 사항

- 게임 장르별 필터와 검색 기능
- 게임별 썸네일 이미지
- 난이도·권장 인원·조작 방법 표시
- 플레이 횟수와 최고 점수 저장
- 모든 게임에 공통 아케이드 복귀 버튼 적용
- 참가자별 게임 소개와 제작 과정 기록

## 👥 제작

**2026년 강서청소년회관 바이브 코딩 1, 2 참가자 제작**
