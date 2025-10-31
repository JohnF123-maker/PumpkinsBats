/**
 * HALLOWEEN BATTLE: PUMPKINS VS BATS
 * Main game engine with new scoring system and mega events
 */

import { clamp, randInt, rand, formatTime, circleCollision, COLORS } from './utils.js';
import { Audio } from './audio.js';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;
ctx.imageSmoothingEnabled = false;

// Background image (load if available)
let backgroundImage = new Image();
let backgroundLoaded = false;
backgroundImage.src = '/background/halloween_arena.png';
backgroundImage.onload = () => {
    backgroundLoaded = true;
    console.log('✅ Background image loaded');
};
backgroundImage.onerror = () => {
    console.log('⚠️ Background image not found - using gradient fallback');
    backgroundLoaded = false;
};

// Game constants
const SMALL_RADIUS = 15;
const LARGE_RADIUS = 30;
const SMALL_SPEED = 2;
const LARGE_SPEED = 1.5;
const END_ZONE_WIDTH = 100;
const SPAWN_ZONE_WIDTH = 50;
const ROUND_TIME = 60; // seconds
// REMOVED: OVERTIME_TIME (sudden death is untimed, first-to-score wins)

// Game state
let state = 'stopped'; // 'stopped', 'countdown', 'playing', 'sudden', 'round_end'
let countdownValue = 3; // 3, 2, 1
let countdownTimer = 0;
let timeRemaining = ROUND_TIME;
let lastFrameTime = Date.now();
let autoSpawnTimer = 0; // Timer for auto-spawn (changed to 5 seconds)
let enteringSuddenDeath = false; // Flag to track if countdown leads to sudden death

// Scores
let pumpkinScore = 0;
let batScore = 0;

// Entities array
let entities = [];

// Spawn queue for freeze periods
let spawnQueue = [];

// Mega event state
let megaEventActive = false;
let megaEventType = null; // 'double', 'frenzy', 'meteor'
let megaEventDuration = 0;

// Meteor state for meteor sweep wild card
let meteor = null; // {x, y, vx, vy, radius, trail: [{x, y, alpha}]}

// Mirror spawn tracking
let lastSpawnY = null;

// Total wins tracking
let pumpkinWins = 0;
let batWins = 0;
let totalGamesPlayed = 0;

// DOM elements
const pumpkinScoreEl = document.getElementById('pumpkin-score');
const batScoreEl = document.getElementById('bat-score');
const timerEl = document.getElementById('timer');
const roundStatusEl = document.getElementById('round-status');
const eventBannerEl = document.getElementById('event-banner');
const megaBannerEl = document.getElementById('mega-banner');
const pumpkinWinsEl = document.getElementById('pumpkin-wins');
const batWinsEl = document.getElementById('bat-wins');

/**
 * Entity factory with HP system
 */
function createEntity(team, large = false, x = null, y = null, xOffset = 0) {
    const r = large ? LARGE_RADIUS : SMALL_RADIUS;
    const speed = large ? LARGE_SPEED : SMALL_SPEED;
    const maxHp = large ? 2 : 1; // Large tanks have 2 HP
    
    // Default spawn positions with offset for spacing
    if (x === null || y === null) {
        if (team === 'pumpkin') {
            x = SPAWN_ZONE_WIDTH + r + xOffset;
            y = y !== null ? y : randInt(r + 50, canvas.height - r - 50);
        } else {
            x = canvas.width - SPAWN_ZONE_WIDTH - r - xOffset;
            y = y !== null ? y : randInt(r + 50, canvas.height - r - 50);
        }
    }
    
    return {
        team,
        x,
        y,
        r,
        hp: maxHp,
        maxHp: maxHp,
        vx: team === 'pumpkin' ? speed : -speed,
        vy: 0,
        large,
        damageBlinkTimer: 0, // Timer for red blink effect
    };
}

/**
 * Spawn with optional Y position - respects freeze/queue and anti-cramming
 */
export function spawnEntity(team, large = false, yPos = null) {
    // If in countdown, round_end, or sudden death state, queue the spawn
    if (state === 'countdown' || state === 'round_end' || state === 'sudden') {
        spawnQueue.push({ team, large, yPos });
        // Removed verbose log to reduce logging rate
        return null;
    }
    
    const radius = large ? LARGE_RADIUS : SMALL_RADIUS;
    const minSeparation = radius * 2.5; // Minimum distance from other entities
    let y, x;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Determine spawn position with anti-cramming
    while (attempts < maxAttempts) {
        // Use provided Y position or random with ±50-100px offset
        if (yPos !== null) {
            y = yPos + randInt(-50, 50); // Add randomness even to specified positions
        } else {
            y = randInt(radius + 20, canvas.height - radius - 20);
        }
        
        // Clamp to valid range
        y = clamp(y, radius + 20, canvas.height - radius - 20);
        
        // Determine X based on team (backline spawn zones) with random offset
        const xOffset = randInt(-30, 30); // Additional X randomness
        if (team === 'pumpkin') {
            x = SPAWN_ZONE_WIDTH / 2 + xOffset; // Left side backline with offset
        } else {
            x = canvas.width - SPAWN_ZONE_WIDTH / 2 + xOffset; // Right side backline with offset
        }
        
        // Check for cramming - ensure minimum separation from existing entities
        let tooClose = false;
        for (const e of entities) {
            const dist = Math.sqrt((x - e.x) ** 2 + (y - e.y) ** 2);
            if (dist < minSeparation) {
                tooClose = true;
                break;
            }
        }
        
        if (!tooClose) {
            break; // Found a good spot
        }
        
        attempts++;
        yPos = null; // Try random position on retry
    }
    
    // If still cramped after max attempts, queue for next tick
    if (attempts >= maxAttempts) {
        console.log(`⏸️ Spawn blocked (cramming): ${team} - queued`);
        setTimeout(() => spawnEntity(team, large, null), 100); // Retry in 100ms
        return null;
    }
    
    const entity = createEntity(team, large, x, y);
    entities.push(entity);
    
    return entity;
}

/**
 * Flush spawn queue (called at round start)
 */
function flushSpawnQueue() {
    if (spawnQueue.length === 0) return;
    
    console.log(`📤 Flushing ${spawnQueue.length} queued spawns`);
    
    // Spawn queued entities with spacing to avoid overlap
    for (let i = 0; i < spawnQueue.length; i++) {
        const { team, large, yPos } = spawnQueue[i];
        const spacing = i * 80; // Space them vertically
        const y = yPos !== null ? yPos + spacing : 100 + spacing;
        
        // Use anti-cramming spawn
        spawnEntity(team, large, y);
    }
    
    spawnQueue = [];
}

/**
 * Spawn multiple entities (for frenzy mode or gifts)
 */
export function spawnMultiple(team, count, large = false) {
    for (let i = 0; i < count; i++) {
        // Spread large units apart by 100px increments
        const xOffset = large ? i * 100 : randInt(-30, 30);
        const yOffset = large ? i * 80 : randInt(-40, 40);
        
        let y = randInt(100, canvas.height - 100) + yOffset;
        y = clamp(y, 50, canvas.height - 50);
        
        const entity = createEntity(team, large, null, y, xOffset);
        entities.push(entity);
    }
}

/**
 * Start new round with countdown
 */
export function startRound() {
    state = 'countdown';
    countdownValue = 3;
    countdownTimer = 0;
    timeRemaining = ROUND_TIME;
    autoSpawnTimer = 0; // Reset auto-spawn timer
    pumpkinScore = 0;
    batScore = 0;
    entities = [];
    megaEventActive = false;
    megaEventType = null;
    lastSpawnY = null;
    
    updateUI();
    hideBanners();
    
    console.log('🎮 Round starting - countdown begins!');
}

/**
 * Begin actual gameplay after countdown
 */
function beginGameplay() {
    if (enteringSuddenDeath) {
        state = 'sudden';
        enteringSuddenDeath = false;
        Audio.overtime();
        console.log('⚡ Sudden death: First to score wins!');
    } else {
        state = 'playing';
        console.log('🎮 Gameplay active!');
    }
    flushSpawnQueue(); // Spawn any queued entities
}

/**
 * End round and determine winner
 */
function endRound() {
    // Enter round_end state to prevent spawns
    state = 'round_end';
    entities = []; // Clear all entities
    
    const winner = pumpkinScore > batScore ? '🎃 PUMPKINS' : 
                   batScore > pumpkinScore ? '🦇 BATS' : 
                   null; // Don't show message for tie
    
    console.log(`🏁 Round ended: ${winner || 'TIE'} (Pumpkins: ${pumpkinScore}, Bats: ${batScore})`);
    
    // Increment total wins
    if (winner) {
        if (pumpkinScore > batScore) {
            pumpkinWins++;
        } else {
            batWins++;
        }
        totalGamesPlayed++;
        
        // Reset wins after 50 games
        if (totalGamesPlayed >= 50) {
            console.log('🔄 50 games completed! Resetting win counters...');
            pumpkinWins = 0;
            batWins = 0;
            totalGamesPlayed = 0;
        }
        
        updateWinsDisplay();
    }
    
    // Play victory sound
    Audio.victory();
    
    // Show winner banner ONLY if there's a clear winner
    if (winner) {
        showEventBanner(`ROUND OVER!\n${winner} WIN!`, 3000);
    }
    
    // Auto-restart after 3 seconds
    setTimeout(() => {
        console.log('🔄 Auto-restarting round...');
        startRound();
    }, 3000);
}

/**
 * Update game logic
 */
function update(deltaTime) {
    if (state === 'stopped') return;
    
    // Handle countdown state
    if (state === 'countdown') {
        countdownTimer += deltaTime;
        if (countdownTimer >= 1) {
            countdownTimer = 0;
            countdownValue--;
            
            if (countdownValue <= 0) {
                // Countdown finished, begin gameplay and flush queue
                beginGameplay();
            }
        }
        return; // Don't update game during countdown
    }
    
    // Handle round end state (cooldown before next round)
    if (state === 'round_end') {
        // Block all spawns and updates during cooldown
        return;
    }
    
    // Update timer (only during playing state, NOT during sudden death)
    if (state === 'playing') {
        timeRemaining -= deltaTime;
    }
    // Sudden death is UNTIMED - first team to score wins
    
    // Auto-spawn every 5 seconds (changed from 15) with randomized, non-mirrored offsets
    // DISABLED during sudden death (first-to-score mode)
    if (state === 'playing') {
        autoSpawnTimer += deltaTime;
        if (autoSpawnTimer >= 5) {
            autoSpawnTimer = 0;
            // Random backline Y positions with spacing
            const pumpkinY = rand(100, canvas.height - 100);
            const batY = rand(100, canvas.height - 100);
            spawnEntity('pumpkin', false, pumpkinY);
            spawnEntity('bat', false, batY);
            // Removed auto-spawn log to reduce logging rate
        }
    }
    
    // Check for round transitions
    if (state === 'playing' && timeRemaining <= 0) {
        // Clear all entities at end of round
        entities = [];
        
        if (pumpkinScore === batScore) {
            // Show TIE GAME banner first
            state = 'round_end'; // Freeze state
            showEventBanner('🎃 🦇 TIE GAME', 1500);
            
            // After 1.5s, show Sudden Death and countdown
            setTimeout(() => {
                showEventBanner('SUDDEN DEATH!', 1500);
                
                // After another 1.5s, start countdown leading to sudden death
                setTimeout(() => {
                    enteringSuddenDeath = true; // Set flag so beginGameplay() enters sudden state
                    state = 'countdown';
                    countdownValue = 3;
                    countdownTimer = 0;
                    timeRemaining = 999; // Set high value, but timer won't decrement in sudden state
                }, 1500);
            }, 1500);
        } else {
            endRound();
            return;
        }
    }
    
    // Update mega event timer
    if (megaEventActive) {
        megaEventDuration -= deltaTime;
        if (megaEventDuration <= 0) {
            deactivateMegaEvent();
        }
    }
    
    // Update entities
    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        
        // Movement (with tank behavior for large circles)
        const speedMultiplier = e.large ? 0.5 : 1; // Large circles move 50% slower
        e.x += e.vx * speedMultiplier;
        e.y += e.vy * speedMultiplier;
        
        // Boundary check (top/bottom bounce)
        if (e.y - e.r < 0) {
            e.y = e.r;
            e.vy = 0;
        } else if (e.y + e.r > canvas.height) {
            e.y = canvas.height - e.r;
            e.vy = 0;
        }
        
        // Check end zone scoring
        let scored = false;
        if (e.team === 'pumpkin' && e.x - e.r >= canvas.width - END_ZONE_WIDTH) {
            scored = true;
        } else if (e.team === 'bat' && e.x + e.r <= END_ZONE_WIDTH) {
            scored = true;
        }
        
        if (scored) {
            // NEW SCORING: +1 for small, +3 for large (higher impact for tanks)
            const points = e.large ? 3 : 1;
            const multiplier = megaEventType === 'double' ? 2 : 1;
            const finalPoints = points * multiplier;
            
            if (e.team === 'pumpkin') {
                pumpkinScore += finalPoints;
            } else {
                batScore += finalPoints;
            }
            
            // Remove entity and play goal sound
            entities.splice(i, 1);
            Audio.goal();
            // Score logged only in sudden death below (removed regular scoring log to reduce rate)
            
            // In sudden death, check if one team has taken the lead
            if (state === 'sudden') {
                if (pumpkinScore !== batScore) {
                    console.log(`🏆 Sudden death: ${pumpkinScore > batScore ? 'Pumpkins' : 'Bats'} take the lead! Round ending...`);
                    entities = []; // Clear all entities
                    setTimeout(() => endRound(), 500); // Brief delay to show score
                } else {
                    console.log(`⚖️ Sudden death: Still tied at ${pumpkinScore}-${batScore}`);
                }
            }
            
            continue;
        }
        
        // Update damage blink timer for damaged large units
        if (e.large && e.hp < e.maxHp && e.hp > 0) {
            e.damageBlinkTimer += deltaTime;
            if (e.damageBlinkTimer > 0.18) { // Blink every 180ms
                e.damageBlinkTimer = 0;
            }
        }
    }
    
    // Collision detection with atomic damage and deferred removal
    const toRemove = new Set();
    for (let i = 0; i < entities.length; i++) {
        if (toRemove.has(i)) continue; // Skip already marked for removal
        
        const e1 = entities[i];
        for (let j = i + 1; j < entities.length; j++) {
            if (toRemove.has(j)) continue; // Skip already marked for removal
            
            const e2 = entities[j];
            
            // Only check collisions between opposing teams
            if (e1.team !== e2.team && circleCollision(e1.x, e1.y, e1.r, e2.x, e2.y, e2.r)) {
                // Calculate damage based on unit size
                // Large units deal 2 damage, small units deal 1 damage
                const damage1 = e1.large ? 2 : 1;
                const damage2 = e2.large ? 2 : 1;
                
                // Apply damage atomically
                e1.hp -= damage2;
                e2.hp -= damage1;
                
                // Play collision sound once per collision
                Audio.collision();
                
                // Mark for removal if dead
                if (e1.hp <= 0) {
                    toRemove.add(i);
                }
                if (e2.hp <= 0) {
                    toRemove.add(j);
                }
                
                // Update blink timers for damaged large units
                if (e1.large && e1.hp > 0 && e1.hp < e1.maxHp) {
                    e1.damageBlinkTimer = 0; // Reset blink timer on new damage
                }
                if (e2.large && e2.hp > 0 && e2.hp < e2.maxHp) {
                    e2.damageBlinkTimer = 0; // Reset blink timer on new damage
                }
            }
        }
    }
    
    // Deferred removal (remove from highest index to lowest to preserve indices)
    const removalArray = Array.from(toRemove).sort((a, b) => b - a);
    for (const idx of removalArray) {
        entities.splice(idx, 1);
    }
    
    // Frenzy mode: spawn random units
    if (megaEventType === 'frenzy' && Math.random() < 0.05) {
        const team = Math.random() < 0.5 ? 'pumpkin' : 'bat';
        spawnEntity(team, false);
    }
    
    // Update meteor if active
    if (megaEventType === 'meteor' && meteor) {
        updateMeteor(deltaTime);
    }
    
    updateUI();
}

/**
 * Render game
 */
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (image if loaded, gradient fallback)
    if (backgroundLoaded) {
        // Draw background image with dimming for visibility
        ctx.save();
        ctx.globalAlpha = 0.7; // Dim to 70% for better sprite visibility
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Add overlay for even better contrast
        ctx.fillStyle = 'rgba(5, 0, 8, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Halloween gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#050008'); // Top: dark navy
        gradient.addColorStop(0.6, '#2a004b'); // Middle: deep purple
        gradient.addColorStop(1, '#1a0b00'); // Bottom: orange haze
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add atmospheric fog at bottom
        const fogGradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
        fogGradient.addColorStop(0, 'rgba(255, 140, 0, 0)');
        fogGradient.addColorStop(1, 'rgba(255, 140, 0, 0.15)');
        ctx.fillStyle = fogGradient;
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
        
        // Faint moon silhouette
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width - 200, 120, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Draw entities
    for (const e of entities) {
        drawEntity(e);
    }
    
    // Draw meteor if active
    if (megaEventActive && megaEventType === 'meteor' && meteor) {
        drawMeteor();
    }
    
    // COUNTDOWN DISPLAY (large centered text)
    if (state === 'countdown' && countdownValue > 0) {
        ctx.save();
        ctx.font = 'bold 120px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#9b4dff';
        ctx.lineWidth = 6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add fade-out effect
        const fadeAmount = 1 - (countdownTimer / 1);
        ctx.globalAlpha = fadeAmount;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.strokeText(countdownValue, centerX, centerY);
        ctx.fillText(countdownValue, centerX, centerY);
        ctx.restore();
    }
}

/**
 * Draw entity with improved Halloween graphics and damage feedback
 */
function drawEntity(e) {
    ctx.save();
    
    // Add red blink for damaged large units (hp < maxHp)
    if (e.large && e.hp < e.maxHp && e.hp > 0) {
        const showBlink = e.damageBlinkTimer < 0.09; // Show red for first half of cycle
        if (showBlink) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            ctx.shadowBlur = 15;
        }
    }
    
    if (e.team === 'pumpkin') {
        // Pumpkin body with gradient
        const pumpkinGradient = ctx.createRadialGradient(e.x, e.y, e.r * 0.3, e.x, e.y, e.r);
        pumpkinGradient.addColorStop(0, '#ffaa44');
        pumpkinGradient.addColorStop(1, '#ff7b00');
        ctx.fillStyle = pumpkinGradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Pumpkin outline (thicker)
        ctx.strokeStyle = '#ff5500';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Vertical ridges for texture
        ctx.strokeStyle = 'rgba(255, 85, 0, 0.4)';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
            const x = e.x + i * e.r * 0.4;
            ctx.beginPath();
            ctx.moveTo(x, e.y - e.r * 0.8);
            ctx.lineTo(x, e.y + e.r * 0.8);
            ctx.stroke();
        }
        
        // Stem on top
        ctx.fillStyle = '#228B22';
        ctx.fillRect(e.x - e.r * 0.1, e.y - e.r - 2, e.r * 0.2, e.r * 0.3);
        
        // Carved face (triangular eyes and jagged mouth)
        ctx.fillStyle = '#000';
        
        // Left eye (triangle)
        const eyeSize = e.r * 0.25;
        ctx.beginPath();
        ctx.moveTo(e.x - e.r * 0.35, e.y - e.r * 0.25);
        ctx.lineTo(e.x - e.r * 0.35 - eyeSize * 0.7, e.y - e.r * 0.05);
        ctx.lineTo(e.x - e.r * 0.35 + eyeSize * 0.7, e.y - e.r * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Right eye (triangle)
        ctx.beginPath();
        ctx.moveTo(e.x + e.r * 0.35, e.y - e.r * 0.25);
        ctx.lineTo(e.x + e.r * 0.35 - eyeSize * 0.7, e.y - e.r * 0.05);
        ctx.lineTo(e.x + e.r * 0.35 + eyeSize * 0.7, e.y - e.r * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Nose (small triangle)
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x - e.r * 0.1, e.y + e.r * 0.15);
        ctx.lineTo(e.x + e.r * 0.1, e.y + e.r * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Jagged grin
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(e.x - e.r * 0.5, e.y + e.r * 0.25);
        for (let i = 0; i <= 8; i++) {
            const x = e.x - e.r * 0.5 + (i * e.r) / 8;
            const y = e.y + e.r * 0.25 + (i % 2 === 0 ? 0 : e.r * 0.2);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        
    } else {
        // Bat body (black circle with gradient)
        const batGradient = ctx.createRadialGradient(e.x, e.y, e.r * 0.2, e.x, e.y, e.r);
        batGradient.addColorStop(0, '#1a1a1a');
        batGradient.addColorStop(1, '#0b0b0b');
        ctx.fillStyle = batGradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        
        // Purple glow outline
        ctx.strokeStyle = '#9b4dff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner purple glow
        ctx.strokeStyle = 'rgba(155, 77, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bat ears (pointy)
        ctx.fillStyle = '#0b0b0b';
        ctx.strokeStyle = '#9b4dff';
        ctx.lineWidth = 2;
        // Left ear
        ctx.beginPath();
        ctx.moveTo(e.x - e.r * 0.5, e.y - e.r * 0.7);
        ctx.lineTo(e.x - e.r * 0.8, e.y - e.r * 1.2);
        ctx.lineTo(e.x - e.r * 0.3, e.y - e.r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Right ear
        ctx.beginPath();
        ctx.moveTo(e.x + e.r * 0.5, e.y - e.r * 0.7);
        ctx.lineTo(e.x + e.r * 0.8, e.y - e.r * 1.2);
        ctx.lineTo(e.x + e.r * 0.3, e.y - e.r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Glowing purple eyes
        ctx.fillStyle = '#9b4dff';
        ctx.shadowColor = '#9b4dff';
        ctx.shadowBlur = 5;
        const eyeR = e.r * 0.18;
        ctx.beginPath();
        ctx.arc(e.x - e.r * 0.35, e.y - e.r * 0.15, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(e.x + e.r * 0.35, e.y - e.r * 0.15, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Bat wings (more detailed)
        ctx.fillStyle = 'rgba(155, 77, 255, 0.4)';
        ctx.strokeStyle = '#9b4dff';
        ctx.lineWidth = 2;
        
        // Left wing (curved)
        ctx.beginPath();
        ctx.moveTo(e.x - e.r, e.y);
        ctx.quadraticCurveTo(e.x - e.r * 1.8, e.y - e.r * 0.6, e.x - e.r * 1.6, e.y);
        ctx.quadraticCurveTo(e.x - e.r * 1.8, e.y + e.r * 0.6, e.x - e.r, e.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right wing (curved)
        ctx.beginPath();
        ctx.moveTo(e.x + e.r, e.y);
        ctx.quadraticCurveTo(e.x + e.r * 1.8, e.y - e.r * 0.6, e.x + e.r * 1.6, e.y);
        ctx.quadraticCurveTo(e.x + e.r * 1.8, e.y + e.r * 0.6, e.x + e.r, e.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Wing details (finger-like points)
        ctx.strokeStyle = 'rgba(155, 77, 255, 0.6)';
        ctx.lineWidth = 1.5;
        // Left wing lines
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(e.x - e.r, e.y);
            ctx.lineTo(e.x - e.r * (1.3 + i * 0.2), e.y - e.r * 0.3 + i * e.r * 0.3);
            ctx.stroke();
        }
        // Right wing lines
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(e.x + e.r, e.y);
            ctx.lineTo(e.x + e.r * (1.3 + i * 0.2), e.y - e.r * 0.3 + i * e.r * 0.3);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

/**
 * Update total wins display
 */
function updateWinsDisplay() {
    pumpkinWinsEl.textContent = pumpkinWins;
    batWinsEl.textContent = batWins;
}

/**
 * Update UI elements
 */
function updateUI() {
    pumpkinScoreEl.textContent = pumpkinScore;
    batScoreEl.textContent = batScore;
    
    // Timer display: hide in sudden death (first-to-score, no time limit)
    if (state === 'sudden') {
        timerEl.textContent = 'SUDDEN DEATH';
    } else {
        timerEl.textContent = formatTime(Math.max(0, timeRemaining));
    }
    
    // Timer styling
    timerEl.classList.toggle('overtime', state === 'sudden');
    timerEl.classList.toggle('mega-event', megaEventActive);
    
    // Round status
    if (state === 'stopped') {
        roundStatusEl.textContent = 'Press SPACE to start';
    } else if (state === 'sudden') {
        roundStatusEl.textContent = 'FIRST TO SCORE WINS!';
    } else {
        roundStatusEl.textContent = megaEventActive ? `Mega: ${megaEventType?.toUpperCase()}` : '';
    }
}

/**
 * Show event banner
 */
function showEventBanner(message, duration = 2000) {
    eventBannerEl.textContent = message;
    eventBannerEl.classList.add('show');
    
    setTimeout(() => {
        eventBannerEl.classList.remove('show');
    }, duration);
}

/**
 * Show mega event banner
 */
function showMegaBanner(message, duration = 3000) {
    megaBannerEl.textContent = message;
    megaBannerEl.classList.add('show');
    
    setTimeout(() => {
        megaBannerEl.classList.remove('show');
    }, duration);
}

/**
 * Hide all banners
 */
function hideBanners() {
    eventBannerEl.classList.remove('show');
    megaBannerEl.classList.remove('show');
}

/**
 * Activate mega event
 */
export function activateMegaEvent(type) {
    megaEventActive = true;
    megaEventType = type;
    megaEventDuration = 10; // 10 seconds
    
    switch (type) {
        case 'double':
            showMegaBanner('🌟 DOUBLE POINTS! 🌟');
            console.log('💰 Double Points activated!');
            break;
        case 'frenzy':
            showMegaBanner('⚡ FRENZY MODE! ⚡');
            console.log('⚡ Frenzy mode activated!');
            break;
        case 'meteor':
            showMegaBanner('☄️ METEOR SWEEP! ☄️');
            initializeMeteor();
            console.log('☄️ Meteor Sweep activated!');
            break;
    }
}

/**
 * Deactivate mega event
 */
function deactivateMegaEvent() {
    console.log(`✅ Mega event ended: ${megaEventType}`);
    megaEventActive = false;
    megaEventType = null;
    meteor = null; // Clear meteor
}

/**
 * Initialize bouncing meteor for meteor sweep wild card
 */
function initializeMeteor() {
    const speed = 5; // Increased speed for more dramatic effect
    const angle = rand(Math.PI / 6, Math.PI / 3); // Diagonal angle
    meteor = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 26, // Larger meteor (22-26 range)
        trail: []
    };
    console.log('☄️ Meteor initialized at center with speed', speed, 'angle', angle);
}

/**
 * Update meteor position and check collisions
 */
function updateMeteor(deltaTime) {
    if (!meteor) return;
    
    // Update position
    meteor.x += meteor.vx;
    meteor.y += meteor.vy;
    
    // Bounce off walls (simple reflection)
    if (meteor.x - meteor.radius <= 0 || meteor.x + meteor.radius >= canvas.width) {
        meteor.vx *= -1;
        meteor.x = clamp(meteor.x, meteor.radius, canvas.width - meteor.radius);
    }
    if (meteor.y - meteor.radius <= 0 || meteor.y + meteor.radius >= canvas.height) {
        meteor.vy *= -1;
        meteor.y = clamp(meteor.y, meteor.radius, canvas.height - meteor.radius);
    }
    
    // Update trail
    meteor.trail.push({ x: meteor.x, y: meteor.y, alpha: 1.0 });
    if (meteor.trail.length > 15) {
        meteor.trail.shift();
    }
    
    // Fade trail
    for (let i = 0; i < meteor.trail.length; i++) {
        meteor.trail[i].alpha = (i / meteor.trail.length) * 0.8;
    }
    
    // Check collisions with entities
    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (circleCollision(meteor.x, meteor.y, meteor.radius, e.x, e.y, e.r)) {
            entities.splice(i, 1);
            Audio.collision();
        }
    }
}

/**
 * Draw meteor with trailing effect
 */
function drawMeteor() {
    if (!meteor) return;
    
    ctx.save();
    
    // Draw trail
    for (const point of meteor.trail) {
        ctx.globalAlpha = point.alpha * 0.6;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(point.x, point.y, meteor.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw meteor with glow
    ctx.globalAlpha = 1.0;
    const gradient = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, meteor.radius);
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(0.5, '#ff6600');
    gradient.addColorStop(1, '#ff0000');
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

/**
 * Game loop
 */
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = now;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}

/**
 * Keyboard controls
 */
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && state === 'stopped') {
        startRound();
        e.preventDefault();
    }
});

// Start game loop
console.log('🎃 Halloween Battle initialized!');
gameLoop();

// Auto-start first round after 1 second
setTimeout(() => {
    if (state === 'stopped') {
        console.log('🎮 Auto-starting first round...');
        startRound();
    }
}, 1000);

// Export functions for tiktok.js to use
export function getGameState() {
    return state;
}

export { entities, state, pumpkinScore, batScore };
