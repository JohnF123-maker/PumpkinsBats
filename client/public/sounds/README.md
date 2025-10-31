# 🔊 Audio Files

This directory contains the sound effects used in the Halloween Battle game.

## Current Files

- ✅ `collision.wav` - Played when two units collide
- ✅ `goal.wav` - Played when a unit scores
- ✅ `victory.wav` - Played when a round ends

## Technical Details

- **Format**: WAV (recommended for low latency)
- **Implementation**: Howler.js with rate limiting
- **Volume Levels**:
  - collision: 0.25 (throttled to 50ms)
  - goal: 0.5 (throttled to 200ms)
  - victory: 0.6 (throttled to 2000ms)

## How It Works

Audio files are automatically:
1. **Preloaded** on game startup
2. **Rate-limited** to prevent spam
3. **Managed** by Howler.js for best performance

## Controls

- Press **M** key to mute/unmute all audio
- Volume levels can be adjusted in `client/audio.js`

## Replacing Sounds

To use different sound effects:

1. Replace the `.wav` files in this directory
2. Keep the same filenames
3. Reload the game - changes take effect immediately

### Recommended Specifications

- **Sample Rate**: 44.1kHz
- **Channels**: Mono or Stereo
- **Duration**: 0.1-2 seconds (short sounds work best)
- **File Size**: Under 100KB each

## Finding New Sounds

### Free Resources

- **Freesound**: https://freesound.org/
- **Zapsplat**: https://www.zapsplat.com/
- **Mixkit**: https://mixkit.co/free-sound-effects/

### Search Terms

- "collision" or "impact" for collision.wav
- "coin" or "bell" for goal.wav  
- "fanfare" or "victory" for victory.wav

## Troubleshooting

**Sounds not playing?**
1. Check browser console (F12) for loading errors
2. Verify files exist in this directory
3. Ensure audio isn't muted (press M)
4. Check file formats are supported (WAV, MP3, OGG)

**Sounds too loud/quiet?**
- Edit volume levels in `client/audio.js`
- Adjust SOUND_CONFIG object values (0.0 to 1.0)

**Sounds overlapping?**
- Cooldown values prevent spam
- Adjust cooldown times in `client/audio.js` if needed
