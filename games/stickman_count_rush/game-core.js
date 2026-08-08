(function (root, factory) {
    'use strict';

    const Core = factory();
    root.StickmanRush = root.StickmanRush || {};
    root.StickmanRush.Core = Core;

    if (typeof module === 'object' && module.exports) {
        module.exports = Core;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const MAX_CROWD = 9999;
    const GOOD_GATES = Object.freeze([
        Object.freeze({ operator: '+', value: 10, label: '+10', kind: 'good' }),
        Object.freeze({ operator: '+', value: 20, label: '+20', kind: 'good' }),
        Object.freeze({ operator: 'x', value: 2, label: '×2', kind: 'good' })
    ]);
    const DANGER_GATES = Object.freeze([
        Object.freeze({ operator: '-', value: 15, label: '−15', kind: 'danger' }),
        Object.freeze({ operator: '-', value: 30, label: '−30', kind: 'danger' }),
        Object.freeze({ operator: '/', value: 2, label: '÷2', kind: 'danger' })
    ]);

    function toCount(value) {
        return Math.max(0, Math.floor(Number(value) || 0));
    }

    function applyGate(count, operator, value) {
        const initial = toCount(count);
        const operand = Math.max(1, toCount(value));
        let raw = initial;

        if (operator === '+') raw = initial + operand;
        if (operator === '-') raw = initial - operand;
        if (operator === 'x' || operator === '×') raw = initial * operand;
        if (operator === '/' || operator === '÷') raw = Math.floor(initial / operand);

        raw = Math.max(0, raw);
        const nextCount = Math.min(MAX_CROWD, raw);

        return {
            count: nextCount,
            overflow: Math.max(0, raw - MAX_CROWD),
            delta: nextCount - initial
        };
    }

    function resolveBattle(allies, enemies) {
        const allyCount = toCount(allies);
        const enemyCount = toCount(enemies);
        const defeated = Math.min(allyCount, enemyCount);
        const remainingAllies = allyCount - defeated;
        const remainingEnemies = enemyCount - defeated;

        return {
            allies: remainingAllies,
            enemies: remainingEnemies,
            defeated,
            won: remainingEnemies === 0 && remainingAllies > 0
        };
    }

    function applyObstacleDamage(count) {
        const initial = toCount(count);
        if (initial === 0) return { count: 0, lost: 0 };

        const lost = Math.min(initial, Math.max(1, Math.ceil(initial * 0.1)));
        return { count: initial - lost, lost };
    }

    function getDifficulty(distance) {
        const safeDistance = Math.max(0, Number(distance) || 0);
        const level = Math.floor(safeDistance / 250) + 1;

        return {
            level,
            speed: 18 + Math.min(22, level - 1) * 0.75,
            enemyScale: 1 + (level - 1) * 0.13,
            hazardChance: Math.min(0.34, 0.06 + (level - 1) * 0.016)
        };
    }

    function calculateScore(stats) {
        const values = stats || {};
        return Math.max(0,
            Math.floor(Number(values.distance) || 0) +
            toCount(values.defeated) * 10 +
            toCount(values.gateGain) * 2 +
            toCount(values.bossWins) * 250
        );
    }

    function pick(list, random) {
        const index = Math.min(list.length - 1, Math.floor(random() * list.length));
        return { ...list[index] };
    }

    function createGatePair(random, dangerStreak) {
        const nextRandom = typeof random === 'function' ? random : Math.random;
        const streak = toCount(dangerStreak);

        if (streak >= 2) {
            return {
                gates: [pick(GOOD_GATES, nextRandom), pick(GOOD_GATES, nextRandom)],
                nextDangerStreak: 0
            };
        }

        const goodGate = pick(GOOD_GATES, nextRandom);
        if (nextRandom() < 0.58) {
            const dangerGate = pick(DANGER_GATES, nextRandom);
            const gates = nextRandom() < 0.5
                ? [goodGate, dangerGate]
                : [dangerGate, goodGate];
            return { gates, nextDangerStreak: streak + 1 };
        }

        return {
            gates: [goodGate, pick(GOOD_GATES, nextRandom)],
            nextDangerStreak: 0
        };
    }

    return Object.freeze({
        MAX_CROWD,
        GOOD_GATES,
        DANGER_GATES,
        applyGate,
        resolveBattle,
        applyObstacleDamage,
        getDifficulty,
        calculateScore,
        createGatePair
    });
});
