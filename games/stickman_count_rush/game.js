(function (root, factory) {
    'use strict';

    const Game = factory(root);
    root.StickmanRush = root.StickmanRush || {};
    root.StickmanRush.Game = Game;

    if (typeof module === 'object' && module.exports) {
        module.exports = Game;
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', Game.boot, { once: true });
    }
})(typeof globalThis !== 'undefined' ? globalThis : window, function (root) {
    'use strict';

    const STATES = Object.freeze(['ready', 'playing', 'paused', 'battle', 'gameover']);
    const RECORD_KEY = 'stickmanCountRushRecords';
    const GUIDE_KEY = 'stickmanCountRushDragSeen';
    const DEFAULT_RECORDS = Object.freeze({ bestScore: 0, bestDistance: 0, bestCrowd: 5 });

    function createInitialWorld() {
        return {
            state: 'ready',
            resumeState: 'playing',
            playerX: 0,
            targetX: 0,
            crowd: 5,
            maxCrowd: 5,
            distance: 0,
            score: 0,
            defeated: 0,
            gateGain: 0,
            bossWins: 0,
            objects: [],
            popups: [],
            time: 0,
            flashAlpha: 0,
            collisionCooldown: 0,
            dangerStreak: 0,
            pairsSinceEnemy: 0,
            gatesUntilEnemy: 2,
            nextHazardAt: 155,
            nextBossAt: 500,
            pendingBoss: false,
            battle: null,
            pairSerial: 0
        };
    }

    function normalizeRecord(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
    }

    function safeLoadRecords(storage) {
        try {
            if (!storage || typeof storage.getItem !== 'function') return { ...DEFAULT_RECORDS };
            const raw = storage.getItem(RECORD_KEY);
            if (!raw) return { ...DEFAULT_RECORDS };
            const parsed = JSON.parse(raw);
            return {
                bestScore: normalizeRecord(parsed.bestScore, 0),
                bestDistance: normalizeRecord(parsed.bestDistance, 0),
                bestCrowd: Math.max(5, normalizeRecord(parsed.bestCrowd, 5))
            };
        } catch (error) {
            return { ...DEFAULT_RECORDS };
        }
    }

    function safeSaveRecords(storage, records) {
        try {
            if (!storage || typeof storage.setItem !== 'function') return false;
            storage.setItem(RECORD_KEY, JSON.stringify(records));
            return true;
        } catch (error) {
            return false;
        }
    }

    function safeReadGuide(storage) {
        try {
            return Boolean(storage && storage.getItem(GUIDE_KEY) === '1');
        } catch (error) {
            return false;
        }
    }

    function safeSaveGuide(storage) {
        try {
            if (storage) storage.setItem(GUIDE_KEY, '1');
        } catch (error) {
            // Tutorial persistence is optional.
        }
    }

    function getNextBossDistance(distance) {
        const safeDistance = Math.max(0, Number(distance) || 0);
        return (Math.floor(safeDistance / 500) + 1) * 500;
    }

    function cleanupObjects(objects) {
        return (objects || []).filter((object) => !object.remove && object.z >= -20);
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function boot() {
        const namespace = root.StickmanRush || {};
        const Core = namespace.Core;
        const Renderer = namespace.Renderer;
        const Input = namespace.Input;
        if (!Core || !Renderer || !Input) {
            throw new Error('STICKMAN COUNT RUSH modules failed to load.');
        }

        const canvas = document.getElementById('gameCanvas');
        const elements = {
            hud: document.getElementById('hud'),
            crowd: document.getElementById('crowdValue'),
            distance: document.getElementById('distanceValue'),
            score: document.getElementById('scoreValue'),
            dragHint: document.getElementById('dragHint'),
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            startButton: document.getElementById('startButton'),
            pauseButton: document.getElementById('pauseButton'),
            resumeButton: document.getElementById('resumeButton'),
            restartButton: document.getElementById('restartButton'),
            finalScore: document.getElementById('finalScore'),
            finalDistance: document.getElementById('finalDistance'),
            finalCrowd: document.getElementById('finalCrowd'),
            bestScore: document.getElementById('bestScore'),
            bestDistance: document.getElementById('bestDistance'),
            newRecord: document.getElementById('newRecordMessage'),
            status: document.getElementById('gameStatus')
        };

        const storage = typeof localStorage !== 'undefined' ? localStorage : null;
        const renderer = Renderer.createRenderer(canvas);
        let records = safeLoadRecords(storage);
        let world = createInitialWorld();
        let lastFrameTime = performance.now();
        let guideSeen = safeReadGuide(storage);

        function setHidden(element, hidden) {
            element.classList.toggle('is-hidden', hidden);
        }

        function announce(message) {
            elements.status.textContent = '';
            requestAnimationFrame(() => {
                elements.status.textContent = message;
            });
        }

        function addPopup(text, color, x, z) {
            world.popups.push({
                text,
                color,
                x: Number(x) || 0,
                z: Number(z) || 4,
                age: 0,
                duration: 1.05
            });
        }

        function updateScore() {
            world.score = Core.calculateScore(world);
        }

        function updateHud() {
            elements.crowd.textContent = world.crowd.toLocaleString('ko-KR');
            elements.distance.textContent = `${Math.floor(world.distance).toLocaleString('ko-KR')}m`;
            elements.score.textContent = world.score.toLocaleString('ko-KR');
        }

        function makeGatePair() {
            const result = Core.createGatePair(Math.random, world.dangerStreak);
            world.dangerStreak = result.nextDangerStreak;
            world.pairSerial += 1;
            const pairId = world.pairSerial;
            const z = randomBetween(92, 116);

            world.objects.push(
                { type: 'gate', x: -0.5, z, gate: result.gates[0], pairId },
                { type: 'gate', x: 0.5, z, gate: result.gates[1], pairId }
            );
        }

        function makeEnemy(isBoss) {
            const difficulty = Core.getDifficulty(world.distance);
            const count = isBoss
                ? Math.max(8, Math.round(world.crowd * 0.58 + difficulty.level * 4.5))
                : Math.max(3, Math.round((world.crowd * 0.48 + difficulty.level * 2.5) * randomBetween(0.82, 1.02)));

            world.objects.push({
                type: isBoss ? 'boss' : 'enemy',
                x: 0,
                z: isBoss ? 132 : 116,
                count,
                isBoss
            });
        }

        function spawnNextPrimary() {
            if (world.state === 'gameover') return;

            if (world.pendingBoss) {
                world.pendingBoss = false;
                makeEnemy(true);
                return;
            }

            if (world.pairsSinceEnemy >= world.gatesUntilEnemy) {
                world.pairsSinceEnemy = 0;
                world.gatesUntilEnemy = Math.random() < 0.5 ? 2 : 3;
                makeEnemy(false);
                return;
            }

            makeGatePair();
        }

        function spawnHazard() {
            const difficulty = Core.getDifficulty(world.distance);
            if (Math.random() < Math.min(0.62, 0.23 + difficulty.hazardChance)) {
                world.objects.push({
                    type: 'obstacle',
                    x: randomBetween(-0.58, 0.58),
                    z: randomBetween(106, 130),
                    spin: Math.random() * Math.PI,
                    hit: false
                });
            }
            world.nextHazardAt += randomBetween(125, 185);
        }

        function finishGatePair(pairId) {
            for (const object of world.objects) {
                if (object.type === 'gate' && object.pairId === pairId) object.remove = true;
            }
            world.pairsSinceEnemy += 1;
            spawnNextPrimary();
        }

        function applyChosenGate(object) {
            const result = Core.applyGate(world.crowd, object.gate.operator, object.gate.value);
            world.crowd = result.count;
            if (result.delta > 0 || result.overflow > 0) {
                world.gateGain += Math.max(0, result.delta) + result.overflow;
            }
            world.maxCrowd = Math.max(world.maxCrowd, world.crowd);
            const positive = result.delta >= 0;
            const text = result.overflow > 0
                ? `${object.gate.label} · MAX!`
                : object.gate.label;
            addPopup(text, positive ? '#125eea' : '#ff315f', object.x, 4);
            announce(`${object.gate.label} 관문, 현재 군단 ${world.crowd}명`);
            finishGatePair(object.pairId);

            if (world.crowd <= 0) endGame();
        }

        function startBattle(object) {
            if (world.state !== 'playing') return;
            world.state = 'battle';
            object.z = 5;
            world.battle = { object, accumulator: 0 };
            addPopup(object.isBoss ? 'BOSS!' : 'BATTLE!', object.isBoss ? '#e69a00' : '#ef2858', 0, 5);
            announce(object.isBoss ? '거대 스틱맨 전투 시작' : '적 군단과 전투 시작');
        }

        function finishBattle() {
            const battleObject = world.battle.object;
            const wasBoss = Boolean(battleObject.isBoss);
            battleObject.remove = true;
            world.battle = null;

            if (world.crowd <= 0) {
                endGame();
                return;
            }

            if (wasBoss) {
                world.bossWins += 1;
                const reward = Core.applyGate(world.crowd, '+', 25);
                world.crowd = reward.count;
                world.maxCrowd = Math.max(world.maxCrowd, world.crowd);
                addPopup('BOSS +25', '#e3a100', 0, 5);
                announce('거대 스틱맨을 물리치고 25명이 합류했습니다');
            } else {
                addPopup('WIN!', '#126bf3', 0, 5);
                announce(`전투 승리, ${world.crowd}명이 남았습니다`);
            }

            world.state = 'playing';
            spawnNextPrimary();
        }

        function updateBattle(deltaTime) {
            const battle = world.battle;
            if (!battle) {
                world.state = 'playing';
                return;
            }

            battle.accumulator += deltaTime;
            while (battle.accumulator >= 0.055 && world.crowd > 0 && battle.object.count > 0) {
                battle.accumulator -= 0.055;
                world.crowd -= 1;
                battle.object.count -= 1;
                world.defeated += 1;
            }

            if (world.crowd <= 0 || battle.object.count <= 0) finishBattle();
        }

        function updateGateCollisions() {
            const pairIds = new Set(
                world.objects
                    .filter((object) => object.type === 'gate' && !object.remove)
                    .map((object) => object.pairId)
            );

            for (const pairId of pairIds) {
                const gates = world.objects.filter((object) => object.type === 'gate' && object.pairId === pairId && !object.remove);
                if (!gates.length) continue;
                const z = gates[0].z;

                if (z <= 8 && z >= -3) {
                    const chosen = gates.find((gate) => Math.abs(world.playerX - gate.x) < 0.34);
                    if (chosen) {
                        applyChosenGate(chosen);
                        return;
                    }
                }

                if (z < -3) {
                    finishGatePair(pairId);
                    return;
                }
            }
        }

        function updateObjectCollisions() {
            updateGateCollisions();
            if (world.state !== 'playing') return;

            for (const object of world.objects) {
                if ((object.type === 'enemy' || object.type === 'boss') && object.z <= 7) {
                    startBattle(object);
                    return;
                }

                if (
                    object.type === 'obstacle' &&
                    !object.hit &&
                    object.z <= 7 &&
                    object.z >= -3 &&
                    Math.abs(world.playerX - object.x) < 0.32 &&
                    world.collisionCooldown <= 0
                ) {
                    const result = Core.applyObstacleDamage(world.crowd);
                    world.crowd = result.count;
                    object.hit = true;
                    world.collisionCooldown = 0.5;
                    world.flashAlpha = 0.34;
                    addPopup(`−${result.lost}`, '#ff315f', object.x, 4);
                    announce(`장애물 충돌, ${result.lost}명을 잃었습니다`);
                    if (world.crowd <= 0) endGame();
                }
            }
        }

        function updatePlaying(deltaTime) {
            const difficulty = Core.getDifficulty(world.distance);
            const travel = difficulty.speed * deltaTime;
            world.distance += travel;

            if (world.distance >= world.nextBossAt) {
                world.pendingBoss = true;
                world.nextBossAt = getNextBossDistance(world.distance);
            }
            if (world.distance >= world.nextHazardAt) spawnHazard();

            for (const object of world.objects) {
                object.z -= travel;
            }

            updateObjectCollisions();
            world.objects = cleanupObjects(world.objects);
        }

        function updateEffects(deltaTime) {
            world.collisionCooldown = Math.max(0, world.collisionCooldown - deltaTime);
            world.flashAlpha = Math.max(0, world.flashAlpha - deltaTime * 1.8);
            for (const popup of world.popups) popup.age += deltaTime;
            world.popups = world.popups.filter((popup) => popup.age < popup.duration);
        }

        function startGame() {
            world = createInitialWorld();
            world.state = 'playing';
            world.nextBossAt = getNextBossDistance(0);
            spawnNextPrimary();
            setHidden(elements.startScreen, true);
            setHidden(elements.pauseScreen, true);
            setHidden(elements.gameOverScreen, true);
            setHidden(elements.hud, false);
            setHidden(elements.dragHint, guideSeen);
            lastFrameTime = performance.now();
            updateScore();
            updateHud();
            announce('게임 시작, 좋은 관문을 선택하세요');
        }

        function pauseGame() {
            if (world.state !== 'playing' && world.state !== 'battle') return;
            world.resumeState = world.state;
            world.state = 'paused';
            setHidden(elements.pauseScreen, false);
            setHidden(elements.dragHint, true);
            announce('게임이 일시정지되었습니다');
        }

        function resumeGame() {
            if (world.state !== 'paused') return;
            world.state = world.resumeState === 'battle' ? 'battle' : 'playing';
            setHidden(elements.pauseScreen, true);
            lastFrameTime = performance.now();
            announce('게임을 계속합니다');
        }

        function endGame() {
            if (world.state === 'gameover') return;
            world.state = 'gameover';
            world.crowd = Math.max(0, world.crowd);
            updateScore();

            const previous = { ...records };
            records = {
                bestScore: Math.max(records.bestScore, world.score),
                bestDistance: Math.max(records.bestDistance, Math.floor(world.distance)),
                bestCrowd: Math.max(records.bestCrowd, world.maxCrowd)
            };
            safeSaveRecords(storage, records);

            elements.finalScore.textContent = world.score.toLocaleString('ko-KR');
            elements.finalDistance.textContent = `${Math.floor(world.distance).toLocaleString('ko-KR')}m`;
            elements.finalCrowd.textContent = `${world.maxCrowd.toLocaleString('ko-KR')}명`;
            elements.bestScore.textContent = records.bestScore.toLocaleString('ko-KR');
            elements.bestDistance.textContent = `${records.bestDistance.toLocaleString('ko-KR')}m`;
            const isNewRecord = records.bestScore > previous.bestScore ||
                records.bestDistance > previous.bestDistance ||
                records.bestCrowd > previous.bestCrowd;
            setHidden(elements.newRecord, !isNewRecord);
            setHidden(elements.hud, true);
            setHidden(elements.dragHint, true);
            setHidden(elements.gameOverScreen, false);
            announce(`게임 종료, 최종 점수 ${world.score}점`);
        }

        const pointerController = Input.createPointerController(canvas, (pointerX) => {
            if (world.state !== 'playing') return;
            world.targetX = pointerX * 0.92;
            if (!guideSeen) {
                guideSeen = true;
                safeSaveGuide(storage);
                setHidden(elements.dragHint, true);
            }
        });

        function handleResize() {
            renderer.resize();
        }

        function handleVisibility() {
            if (document.hidden) pauseGame();
        }

        function frame(timestamp) {
            const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
            lastFrameTime = timestamp;
            world.time += deltaTime;
            world.playerX += (world.targetX - world.playerX) * Math.min(1, deltaTime * 12);

            if (world.state === 'playing') updatePlaying(deltaTime);
            if (world.state === 'battle') updateBattle(deltaTime);
            if (world.state === 'playing' || world.state === 'battle') {
                updateEffects(deltaTime);
                world.maxCrowd = Math.max(world.maxCrowd, world.crowd);
                updateScore();
                updateHud();
            }

            renderer.render(world);
            requestAnimationFrame(frame);
        }

        elements.startButton.addEventListener('click', startGame);
        elements.restartButton.addEventListener('click', startGame);
        elements.pauseButton.addEventListener('click', pauseGame);
        elements.resumeButton.addEventListener('click', resumeGame);
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        window.addEventListener('blur', pauseGame);
        document.addEventListener('visibilitychange', handleVisibility);

        renderer.render(world);
        requestAnimationFrame(frame);

        return Object.freeze({
            destroy() {
                pointerController.destroy();
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('orientationchange', handleResize);
                window.removeEventListener('blur', pauseGame);
                document.removeEventListener('visibilitychange', handleVisibility);
            }
        });
    }

    return Object.freeze({
        STATES,
        RECORD_KEY,
        DEFAULT_RECORDS,
        createInitialWorld,
        safeLoadRecords,
        safeSaveRecords,
        getNextBossDistance,
        cleanupObjects,
        boot
    });
});
