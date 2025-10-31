# 🚀 Final Deployment Guide

Complete guide for deploying the Halloween Battle: Pumpkins vs Bats game to production.

**🎃 LAUNCH STATUS: READY 🦇**  
*Final polish pass completed October 31, 2025*

---

## ✅ FINAL VERIFICATION CHECKLIST

**A) UI Alignment - Arena Midline Centered**
- ✅ Winner/Tie/Sudden Death banners: `calc(280px + 20px + 640px)` = 940px
- ✅ Total Wins counter: Fixed position, arena-centered, bottom 50px
- ✅ Text: "🎃 Total Wins: X | 🦇 Total Wins: Y"
- ✅ All overlays align with vertical dashed midline

**B) Sudden Death - Untimed First-to-Score**
- ✅ OVERTIME_TIME constant removed
- ✅ Timer frozen during sudden death (timeRemaining = 999)
- ✅ Display shows "SUDDEN DEATH" text, not timer
- ✅ First-to-score logic active (pumpkinScore !== batScore)
- ✅ Simultaneous scoring handled (continues until single leader)
- ✅ Spawns queued during sudden death
- ✅ Sequence: TIE GAME (1.5s) → SUDDEN DEATH (1.5s) → 3-2-1 → Play

**C) Timer & Round Flow**
- ✅ ROUND_TIME = 60 seconds (enforced maximum)
- ✅ Timer pauses during countdown (early return)
- ✅ Timer resets cleanly to 60 each round
- ✅ formatTime() displays as MM:SS
- ✅ No 15/16 minute bugs remain

**D) Visual Polish**
- ✅ Quick Guide removed (only "How It Works" panel remains)
- ✅ Consistent glow effects: text-shadow on all overlays
- ✅ Smooth transitions: 0.3s ease on all banners
- ✅ Countdown centered on canvas with fade effect

---

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account (for code hosting)
- Hosting platform account (Render, Railway, Heroku, etc.)
- TikTok account (optional for live integration)

---

## 🏗️ Project Structure

```
root/
├── package.json              # Root scripts (dev, build, start)
├── README.md                 # Main documentation
├── FINAL_DEPLOYMENT_GUIDE.md # This file
├── .gitignore                # Git exclusions
├── client/                   # Frontend (Vite app)
│   ├── index.html
│   ├── styles.css
│   ├── main.js              # Game engine
│   ├── tiktok.js            # Socket.IO client
│   ├── audio.js             # Howler.js audio manager
│   ├── utils.js             # Helper functions
│   ├── vite.config.js       # Vite configuration
│   ├── package.json
│   └── public/
│       └── sounds/          # Audio files (collision, goal, victory)
└── server/                  # Backend (Express + Socket.IO)
    ├── index.js             # Server entry point
    ├── gift-map.js          # Gift tier classification
    ├── .env.example         # Environment template
    └── package.json
```

---

## 🔧 Local Development Setup

### 1. Install Dependencies

```bash
# From project root
npm run install:all
```

This installs dependencies for:
- Root project (concurrently)
- Client (Vite, Howler.js, Socket.IO client)
- Server (Express, Socket.IO, TikTok Live Connector)

### 2. Configure Environment (Optional)

```bash
cd server
cp .env.example .env
```

Edit `.env` if you want to set a default TikTok username:

```env
TIKTOK_USERNAME=your_tiktok_username
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Note:** You can now enter your TikTok username directly in the game's setup screen! The `.env` file is optional. If you don't provide a username (either in `.env` or the setup screen), the server runs in **simulation mode** (perfect for testing with keyboard controls).

### 3. Run Development Servers

```bash
# From project root
npm run dev
```

This starts:
- **Client**: http://localhost:5173 (Vite dev server with HMR)
- **Server**: http://localhost:8080 (Express with nodemon)

### 4. Test the Game

Open http://localhost:5173 in your browser.

**Setup Screen:**
1. You'll see a Halloween-themed setup screen
2. Enter your TikTok username (optional, without @)
3. Click "Connect to TikTok Live" button
4. The game will transition to the main view automatically

**Keyboard Controls (for testing):**
- `L` - Like → aggregates toward next spawn (every 10 likes)
- `C` - Comment → keyword "pumpkin" test
- `V` - Comment → keyword "bat" test
- `P` - Comment → single letter "p" test
- `B` - Comment → single letter "b" test
- `F` - Follow → +1 🎃 & +1 🦇 (non-mirrored)
- `1` - Rose Gift → +5 🦇 Bats
- `2` - Pumpkin Gift → +5 🎃 Pumpkins
- `3` - Boo Gift (Medium) → +1 Large 🎃 Tank
- `4` - Rosa Gift (Medium) → +1 Large 🦇 Tank
- `5` - October (Large) → ☄️ Meteor Sweep Wild Card
- `T` - Test: Large vs Large collision
- `Y` - Test: Small vs Large collision (press twice)
- `U` - Test: Small vs Small collision
- `M` - Mute/unmute audio

---

## 📊 Event Mapping Reference

### TikTok Live → Game Actions

| TikTok Event | Game Action | Notes |
|--------------|-------------|-------|
| **❤️ Likes** | Every 10 likes → spawn 1 random unit | Progress shown in UI: "❤️ Likes: X (Y/10 → next spawn)" |
| **💬 Comments** | Keyword matching (case-insensitive) | • "pumpkin" or "p" → spawn 🎃<br>• "bat", "bats", or "b" → spawn 🦇<br>• Uses regex word boundaries |
| **➕ Follow** | Spawn 1 🎃 + 1 🦇 | Non-mirrored offsets for variety |
| **🌹 Rose** | Spawn 5 🦇 Bats | Small gift tier |
| **🎃 Pumpkin** | Spawn 5 🎃 Pumpkins | Small gift tier |
| **� Boo** | Spawn 1 Large 🎃 Tank | Medium tier (⭐ featured) |
| **🌹 Rosa** | Spawn 1 Large 🦇 Tank | Medium tier (⭐ featured) |
| **🕸️ October** | ☄️ Meteor Sweep! | Large tier wild card<br>Bouncing meteor destroys units on contact (10s duration) |

### Game Mechanics

**HP System:**
- **Small units**: 1 HP, deal 1 damage per hit
- **Large units**: 2 HP (tanks), deal 2 damage per hit
- Damaged large units show **red blink** effect every ~180ms
- Units destroyed when HP reaches 0
- Collision damage is atomic - both units take damage simultaneously
- Large vs Large: both units destroyed (2dmg vs 2hp each)
- Small vs Large: large survives first hit, dies on second
- Small vs Small: both destroyed instantly

**Spawn System:**
- Anti-cramming: Minimum 2.5× radius separation between spawned units
- Backline spawning: Units spawn at left/right edges, not in center
- Non-mirrored positions: Random Y offsets prevent predictable patterns
- Spawn queue: Events during countdown/round_end → pushed to queue → flushed on round start

**Scoring:**
- Small unit reaches end zone → +1 point
- Large unit reaches end zone → +3 points
- Round duration: 60 seconds
- **Sudden Death**: First to score wins (no time limit, no auto-spawn)
- Only triggers on exact tie at 0:00

**Auto-Spawn:**
- Every 5 seconds during normal play: 1 🎃 + 1 🦇
- Random Y positions (non-mirrored) from backline
- **DISABLED during Sudden Death** to make first-score decisive

**Wild Cards:**
- **☄️ Meteor Sweep** (October gift): Bouncing meteor (radius 22px) with trailing effect, destroys any unit it touches, reflects off canvas bounds, 10-second duration
- **⚡ Frenzy Mode**: Random unit spawns
- **🌟 Double Points**: All scores ×2 for 10 seconds

**Game Features:**
- 3-2-1 Countdown before each round
- Auto-spawn: 1 pumpkin + 1 bat every 5 seconds
- Large circles move 50% slower (tank behavior) and score +3 points
- Round ends: all circles cleared, spawns blocked during cooldown
- Sudden Death only triggers on exact tie
- Side panel displays gift chart and instructions for TikTok viewers
- HP system: Large units have 2 HP, small units have 1 HP
- Damage feedback: Red blink effect on damaged large units
- Spawn queue: Events during countdown/round_end are queued and flushed at round start

---

## 🏭 Production Build

### 1. Build the Client

```bash
npm run build
```

This creates optimized production files in `client/dist/`.

### 2. Test Production Locally

```bash
npm start
```

Access at http://localhost:8080 (server serves built client files).

---

## ☁️ Deploy to Cloud Platform

### Option A: Deploy to Render

#### Step 1: Prepare Repository

1. **Initialize Git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

#### Step 2: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `halloween-battle`
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free or Starter

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=8080
   CLIENT_ORIGIN=https://YOUR_APP.onrender.com
   TIKTOK_USERNAME=your_username (optional)
   ```

6. Click **"Create Web Service"**

#### Notes:
- Free tier sleeps after 15 min inactivity
- First request takes ~30s to wake up
- SSL certificate automatically provisioned

---

### Option B: Deploy to Railway

#### Step 1: Push to GitHub (same as Render)

#### Step 2: Deploy on Railway

1. Go to [Railway.app](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your repository
4. Railway auto-detects Node.js

5. **Configure Build**:
   - Go to **Settings** → **Build & Deploy**
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`

6. **Add Environment Variables**:
   - Go to **Variables** tab
   - Add:
     ```
     NODE_ENV=production
     PORT=8080
     TIKTOK_USERNAME=your_username (optional)
     ```

7. **Generate Domain**:
   - Go to **Settings** → **Domains**
   - Click **"Generate Domain"**
   - Update `CLIENT_ORIGIN` variable with your Railway URL

8. Redeploy if needed

#### Notes:
- $5 free credit/month
- Always on (no cold starts)
- Better performance than Render free tier

---

### Option C: Deploy to Heroku

#### Step 1: Install Heroku CLI

```bash
npm install -g heroku
```

#### Step 2: Login and Create App

```bash
heroku login
heroku create your-app-name
```

#### Step 3: Configure Environment

```bash
heroku config:set NODE_ENV=production
heroku config:set TIKTOK_USERNAME=your_username
```

#### Step 4: Deploy

```bash
git push heroku main
```

---

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `8080` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TIKTOK_USERNAME` | TikTok username (no @) | `yourname` |
| `CLIENT_ORIGIN` | Frontend URL for CORS | `https://yourapp.com` |

**Note:** If `TIKTOK_USERNAME` is omitted, server runs in simulation mode (keyboard-only testing).

---

## 🧪 Testing Production Deployment

### 1. Health Check

Visit: `https://your-app.com/health`

Expected response: `OK`

### 2. Status API

Visit: `https://your-app.com/api/status`

Expected response:
```json
{
  "status": "online",
  "tiktokConnected": true,
  "username": "your_username"
}
```

### 3. Game Functionality

1. Open your app URL
2. Check connection status (should be 🟢 Connected)
3. Press SPACE to start a round
4. Test keyboard controls (L, C, F, 1-5)
5. Verify audio plays (collision, goal, victory)
6. Confirm rounds auto-restart after 3 seconds

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Ensure all dependencies are in `package.json`
- Run `npm run install:all` again
- Check that build command includes client build

**Error: "Port already in use"**
- Don't hardcode port in code
- Use `process.env.PORT`
- Check platform assigns ports dynamically

### Server Won't Start

**Check logs:**
- Render: **Logs** tab in dashboard
- Railway: **Deployments** → Click deployment → **View Logs**
- Heroku: `heroku logs --tail`

**Common issues:**
- Missing environment variables
- Incorrect build command
- Dependencies not installed

### TikTok Events Not Working

1. Verify `TIKTOK_USERNAME` is set correctly (no @ symbol)
2. Check server logs for connection errors
3. Ensure TikTok account is live streaming
4. Try simulation mode (remove username) to test keyboard controls

### CORS Errors

1. Update `CLIENT_ORIGIN` to match deployment URL
2. Check browser console for specific error
3. Verify server CORS config in `server/index.js`:
   ```javascript
   app.use(cors({
     origin: process.env.CLIENT_ORIGIN || '*',
     methods: ['GET', 'POST'],
   }));
   ```

### WebSocket Connection Fails

1. Check that Socket.IO is configured for production:
   ```javascript
   const serverUrl = import.meta.env.PROD 
     ? window.location.origin 
     : 'http://localhost:8080';
   ```
2. Verify WebSocket isn't blocked by firewall
3. Test with `wss://` in browser console

### Audio Not Playing

1. Check sound files exist in `client/public/sounds/`:
   - `collision.wav`
   - `goal.wav`
   - `victory.wav`
2. Verify files are included in build
3. Check browser console for loading errors
4. Ensure audio isn't muted (press M key)

---

## 🎨 Custom Domain (Optional)

### Render

1. Go to **Settings** → **Custom Domain**
2. Add your domain (e.g., `game.yourdomain.com`)
3. Update DNS with provided CNAME
4. Wait for SSL certificate (automatic)

### Railway

1. Go to **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Update DNS (A record or CNAME)
4. Verify domain in dashboard

---

## 🎥 TikTok Live Studio Setup

### Preparation

1. **Deploy your game** to a hosting platform (Render, Railway, etc.)
2. **Get your live URL** (e.g., `https://your-app.onrender.com`)
3. **Download TikTok Live Studio** from TikTok website

### Scene Configuration

#### Option 1: Browser Source (Recommended)

1. Open TikTok Live Studio
2. Click **"Add Source"** → **"Browser"**
3. Configure Browser Source:
   - **URL**: `https://your-app.onrender.com`
   - **Width**: 1920
   - **Height**: 1080
   - **FPS**: 30-60
   - Enable **"Control audio via OBS"** if using OBS
4. Position the browser source to fill your scene
5. **Hide test controls**: Edit `client/index.html` and set `.controls { display: none; }`

#### Option 2: Window Capture

1. Open your game in a browser (Chrome recommended)
2. Press `F11` for fullscreen
3. In TikTok Live Studio, add **"Window Capture"**
4. Select your browser window
5. Crop to remove browser UI

### Layout Recommendations

**Vertical (9:16) Layout:**
- Best for mobile viewers
- Side panel on left with gift chart
- Canvas scaled to fit vertical space
- Emojis at top clearly visible

**Horizontal (16:9) Layout:**
- Desktop/tablet viewers
- Full canvas width utilization
- Side panel remains on left
- Better for gameplay visibility

### Audio Setup

1. **In-Game Audio**: Enabled by default (collision, goal, victory, overtime)
2. **Mute Option**: Viewers can press `M` key (in test mode)
3. **Volume Levels**: Pre-balanced for TikTok streaming
4. **Background Music**: Add in TikTok Live Studio separately

### Going Live

1. **Enter Username**: In setup screen, enter your TikTok username
2. **Click Connect**: Game connects to your live stream
3. **Auto-Start**: Game begins automatically after connection
4. **Gift Chart**: Always visible in side panel for viewers
5. **Test First**: Use keyboard controls to verify everything works

### Troubleshooting

**Game not connecting:**
- Verify TikTok username is correct (no @ symbol)
- Check server logs for connection errors
- Ensure you're currently live on TikTok

**Audio not playing:**
- Check browser audio permissions
- Verify TikTok Live Studio audio settings
- Unmute with `M` key if muted

**Performance issues:**
- Lower canvas resolution in `main.js` (e.g., 1280x720 → 960x540)
- Reduce FPS in browser source settings
- Close other applications

---

## 📊 Performance Optimization

### Client-Side

- Audio files are preloaded on startup
- Rate limiting prevents audio spam
- RequestAnimationFrame ensures smooth 60 FPS
- Canvas rendering optimized (gradients, image background support)
- Background image auto-dimmed for sprite visibility

### Server-Side

- Socket.IO efficiently handles real-time events
- Express serves static files in production
- TikTok Live Connector manages live stream connection
- Graceful shutdown on SIGINT/SIGTERM

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use `.gitignore`
2. **Use environment variables** for all secrets
3. **Keep dependencies updated**: `npm audit fix`
4. **Enable HTTPS** (automatic on most platforms)
5. **Set CORS origin** to specific domain in production
6. **Rate limit Socket.IO events** (already implemented)

---

## 💰 Cost Estimates

### Render
- **Free Tier**: $0/month (750 hours, sleeps after 15 min)
- **Starter**: $7/month (always on, better performance)

### Railway
- **Free Tier**: $5 credit/month (pay for usage)
- **Typical Cost**: $5-10/month for active app

### Heroku
- **Basic**: $7/month (always on)
- **Hobby**: $25/month (better resources)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] `.gitignore` excludes `node_modules`, `.env`, `dist`
- [ ] Build command set: `npm run install:all && npm run build`
- [ ] Start command set: `npm start`
- [ ] Environment variables configured
- [ ] App deploys successfully
- [ ] Health check returns OK
- [ ] Status API shows correct info
- [ ] Game loads in browser
- [ ] Socket.IO connects (green indicator)
- [ ] Audio plays correctly
- [ ] Rounds auto-restart
- [ ] TikTok events work (if configured)

---

## 🎉 You're Live!

Your Halloween Battle game is now deployed and ready for TikTok Live streaming!

**Share your URL** with viewers and watch them battle in real-time! 🎃🦇

---

## 📞 Support

- **Server Logs**: Check platform dashboard for errors
- **Browser Console**: Press F12 to debug client-side issues
- **TikTok Connector**: See [GitHub repo](https://github.com/zerodytrash/TikTok-Live-Connector)
- **Socket.IO**: See [official docs](https://socket.io/docs/)

**Good luck with your stream! 👻🎃🦇**
