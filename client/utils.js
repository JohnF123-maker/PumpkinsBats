/**
 * UTILITY FUNCTIONS
 * Helper functions for game logic, math, and formatting
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Random integer between min (inclusive) and max (inclusive)
 */
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min (inclusive) and max (exclusive)
 */
export function rand(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check circle collision (distance between centers < sum of radii)
 */
export function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (r1 + r2);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Choose random element from array
 */
export function choose(array) {
    return array[randInt(0, array.length - 1)];
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Color utilities
 */
export const COLORS = {
    PUMPKIN_ORANGE: '#ff7b00',
    PUMPKIN_FILL: '#ff9933',
    BAT_BLACK: '#0b0b0b',
    BAT_PURPLE: '#9b4dff',
    BACKGROUND_DARK: '#0a0f2a',
    BACKGROUND_LIGHT: '#321045',
    NEON_VIOLET: '#9b4dff',
    GROUND_HAZE: 'rgba(200, 150, 255, 0.1)',
};

/**
 * Draw filled circle
 */
export function drawCircle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw stroked circle
 */
export function drawCircleOutline(ctx, x, y, r, color, lineWidth = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
}

/**
 * Draw text with shadow
 */
export function drawTextWithShadow(ctx, text, x, y, color, fontSize = 20) {
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText(text, x + 2, y + 2);
    
    // Main text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

/**
 * Easing functions
 */
export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
};
