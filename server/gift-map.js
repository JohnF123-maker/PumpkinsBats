/**
 * Gift Classification System
 * Maps TikTok gifts to game actions based on new schema
 * 
 * NEW GIFT SCHEMA:
 * - Rose (🌹): +5 Bats
 * - Pumpkin (🎃): +5 Pumpkins
 * - Boo (👻) - Medium: +1 Large Pumpkin Tank
 * - Rosa (🌹) - Medium: +1 Large Bat Tank
 * - October (🕸️) - Large: Wild Card (Meteor Sweep)
 */

// Gift mappings by name
const GIFT_ACTIONS = {
  // Small Gifts - Team Specific
  'Rose': { action: 'spawn_multiple', team: 'bat', count: 5, isLarge: false },
  'Pumpkin': { action: 'spawn_multiple', team: 'pumpkin', count: 5, isLarge: false },
  
  // Medium Gifts - Large Tank Units
  'Boo': { action: 'spawn_large', team: 'pumpkin', count: 1, isLarge: true },
  'GG': { action: 'spawn_large', team: 'pumpkin', count: 1, isLarge: true },
  'Ice Cream Cone': { action: 'spawn_large', team: 'pumpkin', count: 1, isLarge: true },
  'Rosa': { action: 'spawn_large', team: 'bat', count: 1, isLarge: true },
  'Love Bang': { action: 'spawn_large', team: 'bat', count: 1, isLarge: true },
  'Star': { action: 'spawn_large', team: 'bat', count: 1, isLarge: true },
  'Mishka Bear': { action: 'spawn_large', team: 'pumpkin', count: 1, isLarge: true },
  
  // Large Gifts - Wild Card (Meteor Sweep)
  'October': { action: 'wild_card', team: null, count: 0, isLarge: false },
  'Drama Queen': { action: 'wild_card', team: null, count: 0, isLarge: false },
  'Signature Jet': { action: 'wild_card', team: null, count: 0, isLarge: false },
  'Sports Car': { action: 'wild_card', team: null, count: 0, isLarge: false },
  'Lion': { action: 'wild_card', team: null, count: 0, isLarge: false },
};

/**
 * Classify gift action based on name and diamond value
 * @param {string} giftName - Name of the gift
 * @param {number} diamonds - Diamond cost of the gift
 * @returns {object} Gift action configuration
 */
export function classifyGiftAction(giftName, diamonds) {
  // Check known gifts first
  if (GIFT_ACTIONS[giftName]) {
    return GIFT_ACTIONS[giftName];
  }
  
  // Fallback to diamond value ranges
  if (diamonds < 10) {
    // Small gift - favor bats (Rose-like)
    return { action: 'spawn_multiple', team: 'bat', count: 5, isLarge: false };
  } else if (diamonds < 100) {
    // Medium gift - spawn large pumpkin
    return { action: 'spawn_large', team: 'pumpkin', count: 1, isLarge: true };
  } else {
    // Large gift - wild card
    return { action: 'wild_card', team: null, count: 0, isLarge: false };
  }
}

export default {
  classifyGiftAction,
  GIFT_ACTIONS
};
