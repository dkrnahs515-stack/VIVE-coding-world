(function (root, factory) {
    'use strict';

    const Renderer = factory();
    root.StickmanRush = root.StickmanRush || {};
    root.StickmanRush.Renderer = Renderer;

    if (typeof module === 'object' && module.exports) {
        module.exports = Renderer;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const MAX_VISIBLE_CROWD = 120;
    const VIEW_DISTANCE = 145;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getVisibleCrowdCount(count) {
        return Math.min(MAX_VISIBLE_CROWD, Math.max(0, Math.floor(Number(count) || 0)));
    }

    function getDepthScale(depth) {
        const normalized = clamp(Number(depth) || 0, 0, 1);
        return 0.28 + Math.pow(normalized, 1.55) * 1.02;
    }

    function createRenderer(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context is unavailable.');

        let width = 480;
        let height = 840;
        let dpr = 1;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, Math.round(rect.width || canvas.clientWidth || 480));
            height = Math.max(1, Math.round(rect.height || canvas.clientHeight || 840));
            dpr = Math.min(2, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function roadHalfWidth(depth) {
            return width * (0.105 + depth * 0.42);
        }

        function project(x, z) {
            const depth = 1 - clamp(z / VIEW_DISTANCE, 0, 1);
            const eased = Math.pow(depth, 1.15);
            const horizonY = height * 0.19;
            const bottomY = height * 0.94;
            return {
                x: width * 0.5 + clamp(x, -1.2, 1.2) * roadHalfWidth(eased) * 0.82,
                y: horizonY + eased * (bottomY - horizonY),
                depth: eased,
                scale: getDepthScale(eased)
            };
        }

        function roundedRect(x, y, w, h, radius) {
            const r = Math.min(radius, w * 0.5, h * 0.5);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function drawSky(time) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#62d3ff');
            gradient.addColorStop(0.48, '#c8f1ff');
            gradient.addColorStop(1, '#ebfff8');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            const sunX = width * 0.78;
            const sunY = height * 0.11;
            const sunGradient = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, width * 0.14);
            sunGradient.addColorStop(0, 'rgba(255, 245, 168, 0.95)');
            sunGradient.addColorStop(1, 'rgba(255, 245, 168, 0)');
            ctx.fillStyle = sunGradient;
            ctx.fillRect(sunX - width * 0.15, 0, width * 0.3, height * 0.27);

            ctx.fillStyle = 'rgba(255,255,255,0.86)';
            for (let i = 0; i < 5; i += 1) {
                const cloudX = ((i * 137 + time * (2 + i * 0.15)) % (width + 150)) - 75;
                const cloudY = height * (0.08 + (i % 3) * 0.045);
                const size = 16 + (i % 2) * 7;
                ctx.beginPath();
                ctx.arc(cloudX, cloudY, size, 0, Math.PI * 2);
                ctx.arc(cloudX + size * 1.15, cloudY - size * 0.35, size * 1.2, 0, Math.PI * 2);
                ctx.arc(cloudX + size * 2.3, cloudY, size * 0.9, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function drawSkyline() {
            const baseY = height * 0.255;
            const colors = ['#a9b8ef', '#f0b7ce', '#99d9c5', '#ffd494'];
            for (let i = 0; i < 12; i += 1) {
                const buildingW = width / 10;
                const x = i * buildingW - buildingW * 0.3;
                const buildingH = height * (0.055 + (i % 4) * 0.018);
                ctx.fillStyle = colors[i % colors.length];
                ctx.fillRect(x, baseY - buildingH, buildingW * 0.8, buildingH);
                ctx.fillStyle = 'rgba(255,255,255,0.62)';
                for (let row = 0; row < 2; row += 1) {
                    ctx.fillRect(x + buildingW * 0.18, baseY - buildingH + 8 + row * 12, 5, 6);
                    ctx.fillRect(x + buildingW * 0.48, baseY - buildingH + 8 + row * 12, 5, 6);
                }
            }
        }

        function drawRoad(distance) {
            const horizonY = height * 0.19;
            const bottomY = height * 0.98;
            ctx.fillStyle = '#94d8ad';
            ctx.fillRect(0, horizonY, width, height - horizonY);

            const roadGradient = ctx.createLinearGradient(0, horizonY, 0, bottomY);
            roadGradient.addColorStop(0, '#a8b5c6');
            roadGradient.addColorStop(1, '#606f84');
            ctx.fillStyle = roadGradient;
            ctx.beginPath();
            ctx.moveTo(width * 0.5 - roadHalfWidth(0), horizonY);
            ctx.lineTo(width * 0.5 + roadHalfWidth(0), horizonY);
            ctx.lineTo(width * 0.5 + roadHalfWidth(1), bottomY);
            ctx.lineTo(width * 0.5 - roadHalfWidth(1), bottomY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#f7fbff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(width * 0.5 - roadHalfWidth(0), horizonY);
            ctx.lineTo(width * 0.5 - roadHalfWidth(1), bottomY);
            ctx.moveTo(width * 0.5 + roadHalfWidth(0), horizonY);
            ctx.lineTo(width * 0.5 + roadHalfWidth(1), bottomY);
            ctx.stroke();

            for (let z = 8 - (distance % 18); z < VIEW_DISTANCE; z += 18) {
                const near = project(0, z);
                const far = project(0, Math.min(VIEW_DISTANCE, z + 7));
                const nearW = Math.max(2, near.scale * 5);
                const farW = Math.max(1, far.scale * 3);
                ctx.fillStyle = 'rgba(255,255,255,0.66)';
                ctx.beginPath();
                ctx.moveTo(width * 0.5 - nearW, near.y);
                ctx.lineTo(width * 0.5 + nearW, near.y);
                ctx.lineTo(width * 0.5 + farW, far.y);
                ctx.lineTo(width * 0.5 - farW, far.y);
                ctx.closePath();
                ctx.fill();
            }
        }

        function drawStickman(x, y, scale, color, phase, emphasis) {
            const unit = Math.max(2.2, 9 * scale * (emphasis || 1));
            const swing = Math.sin(phase) * unit * 0.6;

            ctx.fillStyle = 'rgba(20, 42, 75, 0.18)';
            ctx.beginPath();
            ctx.ellipse(x, y + unit * 2.55, unit * 1.25, unit * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = Math.max(2, unit * 0.48);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.arc(x, y - unit * 1.15, unit * 0.72, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(x, y - unit * 0.25);
            ctx.lineTo(x, y + unit * 1.15);
            ctx.moveTo(x, y + unit * 0.1);
            ctx.lineTo(x - unit * 0.85, y + unit * 0.38 + swing * 0.18);
            ctx.moveTo(x, y + unit * 0.1);
            ctx.lineTo(x + unit * 0.85, y + unit * 0.38 - swing * 0.18);
            ctx.moveTo(x, y + unit * 1.1);
            ctx.lineTo(x - unit * 0.62 + swing * 0.25, y + unit * 2.25);
            ctx.moveTo(x, y + unit * 1.1);
            ctx.lineTo(x + unit * 0.62 - swing * 0.25, y + unit * 2.25);
            ctx.stroke();
        }

        function drawCrowd(x, y, scale, count, color, phase, maxForGroup) {
            const visible = Math.min(getVisibleCrowdCount(count), maxForGroup || MAX_VISIBLE_CROWD);
            if (visible <= 0) return;

            const columns = Math.max(1, Math.ceil(Math.sqrt(visible * 1.25)));
            const spacingX = 12 * scale;
            const spacingY = 9 * scale;

            for (let index = visible - 1; index >= 0; index -= 1) {
                const row = Math.floor(index / columns);
                const column = index % columns;
                const itemsThisRow = Math.min(columns, visible - row * columns);
                const offsetX = (column - (itemsThisRow - 1) / 2) * spacingX;
                const offsetY = row * spacingY;
                drawStickman(x + offsetX, y - offsetY, scale * 0.78, color, phase + index * 0.36, 1);
            }
        }

        function drawGate(object, time) {
            const point = project(object.x, object.z);
            const scale = point.scale;
            const panelW = 82 * scale;
            const panelH = 50 * scale;
            const panelX = point.x - panelW * 0.5;
            const panelY = point.y - panelH - 18 * scale;
            const color = object.gate.kind === 'good' ? '#1688ff' : '#ff4777';

            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(2, 6 * scale);
            ctx.beginPath();
            ctx.moveTo(panelX + 8 * scale, point.y + 8 * scale);
            ctx.lineTo(panelX + 8 * scale, panelY + panelH * 0.75);
            ctx.moveTo(panelX + panelW - 8 * scale, point.y + 8 * scale);
            ctx.lineTo(panelX + panelW - 8 * scale, panelY + panelH * 0.75);
            ctx.stroke();

            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 12 * scale + Math.sin(time * 5) * 2;
            ctx.fillStyle = color;
            roundedRect(panelX, panelY, panelW, panelH, 12 * scale);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#fff';
            ctx.font = `900 ${Math.max(10, 25 * scale)}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(object.gate.label, point.x, panelY + panelH * 0.52);
        }

        function drawEnemy(object, time) {
            const point = project(object.x, object.z);
            drawCrowd(point.x, point.y, point.scale, object.count, '#f03865', time * 8, 42);
            drawCountBadge(point.x, point.y - 42 * point.scale, object.count, '#d91d50', point.scale);
        }

        function drawBoss(object, time) {
            const point = project(object.x, object.z);
            drawStickman(point.x, point.y, point.scale, '#ffbd24', time * 5, 2.7);
            drawCountBadge(point.x, point.y - 66 * point.scale, object.count, '#d88c00', point.scale * 1.1);
        }

        function drawObstacle(object, time) {
            const point = project(object.x, object.z);
            const scale = point.scale;
            const length = 62 * scale;
            ctx.save();
            ctx.translate(point.x, point.y - 8 * scale);
            ctx.rotate(time * 2.5 + (object.spin || 0));
            ctx.fillStyle = '#6e7890';
            roundedRect(-length, -6 * scale, length * 2, 12 * scale, 6 * scale);
            ctx.fill();
            ctx.fillStyle = '#ffe043';
            ctx.fillRect(-length * 0.65, -6 * scale, 14 * scale, 12 * scale);
            ctx.fillRect(length * 0.28, -6 * scale, 14 * scale, 12 * scale);
            ctx.restore();
            ctx.fillStyle = '#4a556d';
            ctx.beginPath();
            ctx.arc(point.x, point.y - 8 * scale, 9 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawCountBadge(x, y, count, color, scale) {
            const text = String(Math.max(0, Math.floor(count)));
            const fontSize = Math.max(9, 19 * scale);
            ctx.font = `900 ${fontSize}px Arial, sans-serif`;
            const padding = 9 * scale;
            const badgeW = ctx.measureText(text).width + padding * 2;
            const badgeH = fontSize + 8 * scale;
            ctx.fillStyle = color;
            roundedRect(x - badgeW * 0.5, y - badgeH, badgeW, badgeH, 999);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y - badgeH * 0.52);
        }

        function drawWorldObject(object, time) {
            if (object.type === 'gate') drawGate(object, time);
            if (object.type === 'enemy') drawEnemy(object, time);
            if (object.type === 'boss') drawBoss(object, time);
            if (object.type === 'obstacle') drawObstacle(object, time);
        }

        function drawPopups(popups) {
            for (const popup of popups || []) {
                const progress = clamp(popup.age / popup.duration, 0, 1);
                const point = project(popup.x, Math.max(0, popup.z || 0));
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = popup.color || '#fff';
                ctx.font = `900 ${20 + point.scale * 8}px Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.lineWidth = 5;
                ctx.strokeStyle = 'rgba(24,45,78,0.42)';
                ctx.strokeText(popup.text, point.x, point.y - 40 - progress * 45);
                ctx.fillText(popup.text, point.x, point.y - 40 - progress * 45);
            }
            ctx.globalAlpha = 1;
        }

        function render(world) {
            const state = world || {};
            const time = Number(state.time) || 0;
            drawSky(time);
            drawSkyline();
            drawRoad(Number(state.distance) || 0);

            const objects = [...(state.objects || [])]
                .filter((object) => object.z >= 0 && object.z <= VIEW_DISTANCE)
                .sort((a, b) => b.z - a.z);
            for (const object of objects) drawWorldObject(object, time);

            const player = project(Number(state.playerX) || 0, 5);
            drawCrowd(player.x, player.y, player.scale, Number(state.crowd) || 0, '#176bff', time * 9, MAX_VISIBLE_CROWD);
            drawCountBadge(player.x, player.y - 56 * player.scale, Number(state.crowd) || 0, '#0d55d8', player.scale);
            drawPopups(state.popups);

            if (state.flashAlpha > 0) {
                ctx.fillStyle = `rgba(255, 70, 105, ${clamp(state.flashAlpha, 0, 0.35)})`;
                ctx.fillRect(0, 0, width, height);
            }
        }

        resize();
        return Object.freeze({ resize, render });
    }

    return Object.freeze({
        MAX_VISIBLE_CROWD,
        VIEW_DISTANCE,
        getVisibleCrowdCount,
        getDepthScale,
        createRenderer
    });
});
