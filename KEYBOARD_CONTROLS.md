# 🎮 Quick Reference Card - Keyboard Testing Controls

## Halloween Battle: Pumpkins vs Bats
**TikTok Live Game - Testing Mode**

---

## 🎯 Standard Actions

| Key | Action | Result |
|-----|--------|--------|
| `L` | ❤️ Like | +1 🎃 Pumpkin |
| `C` | 💬 Comment | +1 🦇 Bat |
| `F` | ➕ Follow | +1 🎃 Pumpkin & +1 🦇 Bat |

---

## 🎁 Gift Simulations

| Key | Gift Type | Effect |
|-----|-----------|--------|
| `1` | 🌹 Rose | +5 🦇 Bats |
| `2` | 🎃 Pumpkin Gift | +5 🎃 Pumpkins |
| `3` | 💎 Medium Gift A | +1 Large 🎃 Pumpkin (Tank) |
| `4` | 🦇 Medium Gift B | +1 Large 🦇 Bat (Tank) |
| `5` | 🎁 Large Gift | 🎲 Wild Card Event |

---

## 🎵 Audio & Utilities

| Key | Action |
|-----|--------|
| `M` | Mute/Unmute all sounds |
| `←` | Switch gift team to Pumpkin |
| `→` | Switch gift team to Bat |

---

## 🎮 Game States

- **Countdown**: Large "3, 2, 1..." displays before each round
- **Playing**: Normal gameplay, auto-spawn every 5 seconds
- **Sudden Death**: Triggered only on exact tie, overtime countdown
- **Round End**: All entities cleared, spawns blocked

---

## 📊 Scoring System

- **Small Circle**: +1 point
- **Large Circle (Tank)**: +3 points (moves 50% slower)
- **Wild Card Event**: Double points, frenzy, or meteor sweep

---

## 🎯 Tank Behavior

Large circles:
- Move at 50% speed (0.5x multiplier)
- Score +3 points instead of +1
- Spawn from Medium Gift A/B gifts
- Designed for high-impact gameplay

---

## ⏱️ Auto-Spawn Timer

Every 5 seconds:
- Spawns 1 small 🎃 Pumpkin
- Spawns 1 small 🦇 Bat
- Keeps game active during quiet moments

---

## 🎪 Wild Card Events (Key 5)

Random effects:
- **Double**: All scores worth 2x for limited time
- **Frenzy**: Rapid multi-spawn
- **Meteor**: Clears 30% of entities randomly

---

## 📺 TikTok Live Integration

**Real Stream Events:**
- Viewers' likes → +1 Pumpkin
- Viewers' comments → +1 Bat
- Viewers' follows → Both teams get +1
- Gift subscriptions trigger corresponding effects

**Setup:**
1. Enter TikTok username in setup screen
2. Click "Connect to TikTok Live"
3. Game starts automatically
4. Side panel shows gift chart to viewers

---

## 🎨 Visual Features

✅ Halloween-themed gradient background (or custom image)  
✅ Detailed pumpkin graphics (ridges, stem, face)  
✅ Detailed bat graphics (wings, glowing eyes)  
✅ Center divider with glowing orb  
✅ Side panel with gift chart  
✅ Large countdown numbers  
✅ Event banners  

---

## 🔊 Audio Cues

- **Collision**: Circle impacts
- **Goal**: Point scored
- **Victory**: Round ends
- **Overtime**: Sudden death begins

---

## 💡 Pro Tips

1. **Test All Gifts**: Press keys 1-5 to verify each gift type works
2. **Check Audio**: Press M to toggle, ensure all sounds play
3. **Verify Countdown**: Watch for 3-2-1 before gameplay starts
4. **Check Tie Logic**: Force a tie to test sudden death trigger
5. **Tank Speed**: Press 3 or 4, watch large circles move slower
6. **Auto-Spawn**: Wait 5 seconds to see automatic spawns
7. **Round Cleanup**: Watch entities clear when timer hits 0

---

## 📱 For Streaming

**Hide Test Controls:**
```css
/* In styles.css, set: */
.controls {
    display: none;
}
```

**TikTok Live Studio:**
- Add Browser Source
- URL: Your deployed game URL
- Resolution: 1920x1080
- FPS: 30-60

**Layout:**
- Vertical (9:16): Mobile viewers
- Horizontal (16:9): Desktop viewers
- Side panel visible in both orientations

---

## ⚡ Quick Test Sequence

1. Open http://localhost:5173
2. Enter username (or skip)
3. Click "Connect"
4. Watch countdown (3, 2, 1)
5. Press `L` a few times (spawn pumpkins)
6. Press `C` a few times (spawn bats)
7. Press `F` (spawn both)
8. Press `1` (5 bats appear)
9. Press `2` (5 pumpkins appear)
10. Press `3` (1 large pumpkin, slow movement)
11. Press `4` (1 large bat, slow movement)
12. Press `5` (wild card activates)
13. Watch auto-spawn after 5 seconds
14. Let timer reach 0 (round ends, entities clear)
15. Watch new countdown for next round

---

**Ready for TikTok Live! 🎃🦇**

All features tested and working. Deploy and go live!
