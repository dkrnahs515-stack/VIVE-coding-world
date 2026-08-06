(function (root, factory) {
    'use strict';

    const Input = factory();
    root.StickmanRush = root.StickmanRush || {};
    root.StickmanRush.Input = Input;

    if (typeof module === 'object' && module.exports) {
        module.exports = Input;
    }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function createPointerController(canvas, onMove) {
        if (!canvas || typeof canvas.addEventListener !== 'function') {
            throw new TypeError('A canvas-like event target is required.');
        }
        if (typeof onMove !== 'function') {
            throw new TypeError('onMove must be a function.');
        }

        let activePointerId = null;

        function normalizedX(event) {
            const rect = canvas.getBoundingClientRect();
            const width = Math.max(1, rect.width);
            return clamp(((event.clientX - rect.left) / width) * 2 - 1, -1, 1);
        }

        function handlePointerDown(event) {
            if (activePointerId !== null) return;
            activePointerId = event.pointerId;
            if (typeof canvas.setPointerCapture === 'function') {
                try {
                    canvas.setPointerCapture(event.pointerId);
                } catch (error) {
                    // Some embedded and synthetic pointer environments reject capture.
                }
            }
            event.preventDefault();
            onMove(normalizedX(event));
        }

        function handlePointerMove(event) {
            if (event.pointerId !== activePointerId) return;
            event.preventDefault();
            onMove(normalizedX(event));
        }

        function finishPointer(event) {
            if (event && event.pointerId !== activePointerId) return;
            if (activePointerId !== null && typeof canvas.releasePointerCapture === 'function') {
                try {
                    canvas.releasePointerCapture(activePointerId);
                } catch (error) {
                    // The browser may already have released capture after a cancelled gesture.
                }
            }
            activePointerId = null;
        }

        function reset() {
            finishPointer(null);
        }

        const options = { passive: false };
        canvas.addEventListener('pointerdown', handlePointerDown, options);
        canvas.addEventListener('pointermove', handlePointerMove, options);
        canvas.addEventListener('pointerup', finishPointer, options);
        canvas.addEventListener('pointercancel', finishPointer, options);

        if (typeof window !== 'undefined') {
            window.addEventListener('blur', reset);
        }

        function destroy() {
            reset();
            canvas.removeEventListener('pointerdown', handlePointerDown, options);
            canvas.removeEventListener('pointermove', handlePointerMove, options);
            canvas.removeEventListener('pointerup', finishPointer, options);
            canvas.removeEventListener('pointercancel', finishPointer, options);
            if (typeof window !== 'undefined') {
                window.removeEventListener('blur', reset);
            }
        }

        return Object.freeze({ destroy, reset });
    }

    return Object.freeze({ createPointerController });
});
