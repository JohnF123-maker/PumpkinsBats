/**
 * TIKTOK LIVE INTEGRATION
 * Socket.IO client + keyboard simulation + username setup
 */

import { io } from 'socket.io-client';
import { spawnEntity, spawnMultiple, activateMegaEvent, getGameState } from './main.js';
import { toggleMute } from './audio.js';
import { choose } from './utils.js';

// Socket.IO connection
let socket = null;
let isConnected = false;

// Gift team toggle (for keyboard key 4)
let giftTeam = 'pumpkin'; // 'pumpkin' or 'bat'

// Like aggregation tracking
let totalLikes = 0;

// DOM elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('tiktok-username-input');
const connectButton = document.getElementById('connect-button');
const connectionMessage = document.getElementById('connection-message');
const giftTeamDisplayEl = document.getElementById('gift-team-display');
const likeProgressEl = document.getElementById('like-progress');

/**
 * Show connection message
 */
function showConnectionMessage(message, type = 'info') {
    connectionMessage.textContent = message;
    connectionMessage.className = `connection-message ${type}`;
}

/**
 * Transition from setup to game
 */
function startGame() {
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    console.log('🎮 Game started!');
}

/**
 * Handle connect button click
 */
connectButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    
    // Store username in localStorage
    if (username) {
        localStorage.setItem('tiktok_username', username);
        showConnectionMessage(`Connecting to @${username}...`, 'info');
    } else {
        localStorage.removeItem('tiktok_username');
        showConnectionMessage('Starting in simulation mode...', 'info');
    }
    
    connectButton.disabled = true;
    
    // Connect to server
    await initTikTokConnection(username);
    
    // Transition to game after 1 second
    setTimeout(() => {
        startGame();
    }, 1000);
});

// Allow Enter key to connect
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        connectButton.click();
    }
});

// Load saved username on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('tiktok_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
});

/**
 * Initialize Socket.IO connection
 */
export async function initTikTokConnection(username = '') {
    const serverUrl = import.meta.env.PROD 
        ? window.location.origin 
        : 'http://localhost:8080';
    
    console.log(`🔌 Connecting to server: ${serverUrl}`);
    
    socket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        query: {
            tiktok_username: username
        }
    });
    
    // Connection events
    socket.on('connect', () => {
        console.log('✅ Connected to server');
        isConnected = true;
        if (username) {
            showConnectionMessage(`✅ Connected to @${username}`, 'success');
        } else {
            showConnectionMessage('✅ Connected in simulation mode', 'success');
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        isConnected = false;
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        isConnected = false;
        showConnectionMessage('❌ Connection failed. Check server.', 'error');
    });
    
    // TikTok events
    socket.on('like', handleLike);
    socket.on('comment', handleComment);
    socket.on('follow', handleFollow);
    socket.on('gift', handleGift);
    socket.on('share', handleShare);
    
    // Server status
    socket.on('status', (data) => {
        console.log('📊 Server status:', data);
    });
}

/**
 * Update like progress display
 */
function updateLikeProgress() {
    if (likeProgressEl) {
        const likesSinceLastSpawn = totalLikes % 10;
        const nextCount = 10 - likesSinceLastSpawn;
        likeProgressEl.textContent = `❤️ Likes: ${totalLikes}  (${likesSinceLastSpawn}/10 → next spawn)`;
    }
}

/**
 * Handle TikTok like event - NEW: Aggregate to spawn every 10 likes
 */
function handleLike(data) {
    console.log('👍 Like received:', data);
    
    totalLikes++;
    updateLikeProgress();
    
    // Spawn 1 random small unit every 10 likes
    if (totalLikes % 10 === 0) {
        const randomTeam = Math.random() < 0.5 ? 'pumpkin' : 'bat';
        spawnEntity(randomTeam, false);
        console.log(`  → 10 likes reached! Spawned random ${randomTeam}`);
    } else {
        // Fallback: 10% chance to spawn if no reliable total
        if (Math.random() < 0.1) {
            const randomTeam = Math.random() < 0.5 ? 'pumpkin' : 'bat';
            spawnEntity(randomTeam, false);
            console.log(`  → Fallback spawn: random ${randomTeam}`);
        }
    }
}

/**
 * Handle TikTok comment event - NEW: Keyword-based spawning
 */
function handleComment(data) {
    const message = (data.text || data.comment || '').toLowerCase();
    console.log('💬 Comment received:', data, '| Message:', message);
    
    // Check for pumpkin keywords: "pumpkin" or standalone "p"
    const pumpkinMatch = /(^|\W)(pumpkin|p)(\W|$)/i.test(message);
    
    // Check for bat keywords: "bat", "bats", or standalone "b"
    const batMatch = /(^|\W)(bat|bats|b)(\W|$)/i.test(message);
    
    // Spawn based on first match (prioritize pumpkin if both match)
    if (pumpkinMatch) {
        spawnEntity('pumpkin', false);
        console.log(`  → Keyword matched: spawned pumpkin`);
    } else if (batMatch) {
        spawnEntity('bat', false);
        console.log(`  → Keyword matched: spawned bat`);
    } else {
        console.log(`  → No keyword match, no spawn`);
    }
}

/**
 * Handle TikTok follow event - NEW SCHEMA: spawns both teams
 */
function handleFollow(data) {
    console.log('➕ Follow received:', data);
    
    // NEW: Follow spawns +1 Pumpkin AND +1 Bat with non-mirrored offsets
    const offset1 = Math.random() * 100;
    const offset2 = Math.random() * 100 + 120; // Different range to avoid symmetry
    spawnEntity('pumpkin', false, offset1);
    spawnEntity('bat', false, offset2);
}

/**
 * Handle TikTok share event
 */
function handleShare(data) {
    console.log('🔄 Share received:', data);
    
    // Shares spawn bats
    spawnEntity('bat', false);
}

/**
 * Handle TikTok gift event with NEW gift schema
 * Actions: spawn_multiple, spawn_large, wild_card
 */
function handleGift(data) {
    const { giftName, diamonds, action, team, count, isLarge, user } = data;
    console.log(`🎁 Gift received: ${giftName} (${diamonds} 💎) - Action: ${action} from ${user}`);
    
    // Block wild cards and queued gifts during sudden death
    if (getGameState() === 'sudden') {
        if (action === 'wild_card') {
            console.log('  ⚠️ Wild cards disabled during sudden death');
            return;
        }
    }
    
    switch (action) {
        case 'spawn_multiple':
            // Rose (🌹) = +5 Bats, Pumpkin (🎃) = +5 Pumpkins
            spawnMultiple(team, count, isLarge);
            console.log(`  → Spawned ${count} ${team}s`);
            break;
            
        case 'spawn_large':
            // Medium gifts = +1 Large Pumpkin or +1 Large Bat
            spawnEntity(team, true);
            console.log(`  → Spawned 1 large ${team}`);
            break;
            
        case 'wild_card':
            // Large gifts = Wild Card Event (random power-up)
            const wildCardType = choose(['double', 'frenzy', 'meteor']);
            activateMegaEvent(wildCardType);
            console.log(`  → Wild card event: ${wildCardType}`);
            break;
            
        default:
            console.warn(`  ⚠️ Unknown gift action: ${action}`);
    }
}

/**
 * Toggle gift team (for keyboard control)
 */
export function toggleGiftTeam() {
    giftTeam = giftTeam === 'pumpkin' ? 'bat' : 'pumpkin';
    updateGiftTeamDisplay();
    console.log(`🔄 Gift team: ${giftTeam}`);
}

/**
 * Set gift team explicitly
 */
export function setGiftTeam(team) {
    if (team === 'pumpkin' || team === 'bat') {
        giftTeam = team;
        updateGiftTeamDisplay();
        console.log(`🎯 Gift team set to: ${giftTeam}`);
    }
}

/**
 * Update gift team display
 */
function updateGiftTeamDisplay() {
    giftTeamDisplayEl.textContent = `Gift Team: ${giftTeam === 'pumpkin' ? '🎃 Pumpkin' : '🦇 Bat'}`;
    giftTeamDisplayEl.style.color = giftTeam === 'pumpkin' ? '#ff7b00' : '#9b4dff';
}

/**
 * Keyboard simulation for testing
 */
document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 'l':
            // Simulate like
            handleLike({ count: 1 });
            break;
            
        case 'c':
            // Simulate comment with pumpkin keyword
            handleComment({ text: 'I love pumpkin!', user: 'Tester' });
            break;
            
        case 'v':
            // Simulate comment with bat keyword
            handleComment({ text: 'Go bat!', user: 'Tester' });
            break;
            
        case 'p':
            // Simulate comment with single-letter keyword "p"
            handleComment({ text: 'p', user: 'Tester' });
            break;
            
        case 'b':
            // Simulate comment with single-letter keyword "b"
            handleComment({ text: 'b', user: 'Tester' });
            break;
            
        case 'f':
            // Simulate follow (spawn pumpkin + bat)
            handleFollow({ user: 'Tester' });
            break;
            
        case '1':
            // Simulate Rose gift: +5 Bats
            handleGift({
                giftName: 'Rose',
                diamonds: 1,
                action: 'spawn_multiple',
                team: 'bat',
                count: 5,
                isLarge: false,
                user: 'Tester',
            });
            break;
            
        case '2':
            // Simulate Pumpkin gift: +5 Pumpkins
            handleGift({
                giftName: 'Pumpkin',
                diamonds: 5,
                action: 'spawn_multiple',
                team: 'pumpkin',
                count: 5,
                isLarge: false,
                user: 'Tester',
            });
            break;
            
        case '3':
            // Simulate Boo (Medium): +1 Large Pumpkin
            handleGift({
                giftName: 'Boo',
                diamonds: 10,
                action: 'spawn_large',
                team: 'pumpkin',
                count: 1,
                isLarge: true,
                user: 'Tester',
            });
            break;
            
        case '4':
            // Simulate Rosa (Medium): +1 Large Bat
            handleGift({
                giftName: 'Rosa',
                diamonds: 10,
                action: 'spawn_large',
                team: 'bat',
                count: 1,
                isLarge: true,
                user: 'Tester',
            });
            break;
            
        case '5':
            // Simulate October (Large): Meteor Sweep Wild Card
            handleGift({
                giftName: 'October',
                diamonds: 500,
                action: 'wild_card',
                team: null,
                count: 0,
                isLarge: false,
                user: 'Tester',
            });
            break;
            
        case 'arrowleft':
            // Toggle gift team to pumpkin
            setGiftTeam('pumpkin');
            break;
            
        case 'arrowright':
            // Toggle gift team to bat
            setGiftTeam('bat');
            break;
            
        case 'm':
            // Toggle mute
            toggleMute();
            break;
            
        // DEV ONLY: Collision tests
        case 't':
            // Test 1: Large vs Large (both should die)
            console.log('🧪 TEST: Large vs Large collision');
            spawnEntity('pumpkin', true, 600);
            spawnEntity('bat', true, 680);
            break;
            
        case 'y':
            // Test 2: Small vs Large (large should survive first hit, die on second)
            console.log('🧪 TEST: Small vs Large collision (press twice)');
            spawnEntity('pumpkin', false, 620);
            spawnEntity('bat', true, 660);
            break;
            
        case 'u':
            // Test 3: Small vs Small (both should die)
            console.log('🧪 TEST: Small vs Small collision');
            spawnEntity('pumpkin', false, 630);
            spawnEntity('bat', false, 650);
            break;
    }
});

// Initialize gift team display
updateGiftTeamDisplay();

// Export for external use
export { socket, isConnected, giftTeam };
