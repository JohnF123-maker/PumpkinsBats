/**
 * AUDIO MANAGER
 * Howler.js wrapper with preloading and rate limiting
 */

import { Howl } from 'howler';

// Audio state
let isMuted = false;
const sounds = {};
const cooldowns = new Map();

// Sound configuration
const SOUND_CONFIG = {
    collision: {
        src: ['/sounds/collision.mp3'],
        volume: 0.25,
        cooldown: 50, // ms - prevent collision spam
    },
    goal: {
        src: ['/sounds/goal.wav'],
        volume: 0.5,
        cooldown: 200,
    },
    victory: {
        src: ['/sounds/victory.wav'],
        volume: 0.6,
        cooldown: 2000,
    },
    overtime: {
        src: ['/sounds/overtime.wav'],
        volume: 0.5,
        cooldown: 5000,
    },
};

/**
 * Initialize and preload all sounds
 */
export function initAudio() {
    console.log('🔊 Initializing audio system...');
    
    for (const [name, config] of Object.entries(SOUND_CONFIG)) {
        try {
            sounds[name] = new Howl({
                src: config.src,
                volume: config.volume,
                preload: true,
                html5: false, // Use Web Audio API for better performance
                onloaderror: (id, error) => {
                    console.warn(`⚠️ Failed to load sound: ${name}`, error);
                },
                onload: () => {
                    console.log(`✅ Loaded sound: ${name}`);
                },
            });
        } catch (error) {
            console.error(`❌ Error creating sound ${name}:`, error);
        }
    }
    
    // Apply initial mute state
    if (isMuted) {
        Howler.mute(true);
    }
}

/**
 * Play a sound with rate limiting
 */
export function playSound(name) {
    if (!sounds[name]) {
        console.warn(`⚠️ Sound not found: ${name}`);
        return;
    }
    
    // Check cooldown
    const now = Date.now();
    const lastPlayed = cooldowns.get(name);
    const config = SOUND_CONFIG[name];
    
    if (lastPlayed && now - lastPlayed < config.cooldown) {
        return; // Still in cooldown
    }
    
    // Play and update cooldown
    try {
        sounds[name].play();
        cooldowns.set(name, now);
    } catch (error) {
        console.error(`❌ Error playing sound ${name}:`, error);
    }
}

/**
 * Toggle mute state
 */
export function toggleMute() {
    isMuted = !isMuted;
    Howler.mute(isMuted);
    console.log(`🔊 Audio ${isMuted ? 'MUTED' : 'UNMUTED'}`);
    
    // Update body class for visual indicator
    document.body.classList.toggle('muted', isMuted);
    
    return isMuted;
}

/**
 * Set mute state explicitly
 */
export function setMute(muted) {
    isMuted = muted;
    Howler.mute(isMuted);
    document.body.classList.toggle('muted', isMuted);
}

/**
 * Get current mute state
 */
export function isMutedState() {
    return isMuted;
}

/**
 * Stop all sounds
 */
export function stopAllSounds() {
    for (const sound of Object.values(sounds)) {
        sound.stop();
    }
}

/**
 * Set master volume (0.0 to 1.0)
 */
export function setMasterVolume(volume) {
    Howler.volume(Math.max(0, Math.min(1, volume)));
}

/**
 * Individual sound shortcuts for convenience
 */
export const Audio = {
    collision: () => playSound('collision'),
    goal: () => playSound('goal'),
    victory: () => playSound('victory'),
    overtime: () => playSound('overtime'),
};

// Initialize on module load (will be called when imported)
// Note: Actual sound files may not exist yet - that's OK, will show warnings
initAudio();
