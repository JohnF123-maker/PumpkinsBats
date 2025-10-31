# 🎃 Halloween Battle: Pumpkins vs Bats 🦇

A real-time TikTok Live interactive battle game where viewers control two teams through likes, comments, follows, and gifts!

## 🌟 Features

### Game Mechanics
- **Orange Team (Pumpkins)**: Powered by TikTok **Likes** 👍
- **Black Team (Bats)**: Powered by **Comments** 💬, **Follows** ➕, and **Shares** 🔄
- **Gift System**:
  - **Small Gifts** (Rose, etc.): Spawn 2 small units for a **random** team
  - **Medium Gifts** (GG, etc.): Spawn 1 large unit for specified team
  - **Large Gifts** (Drama Queen, etc.): Spawn 2 large units for **ONE** team
  - **Mega Gifts** (Universe, etc.): Trigger wild card events!

### Mega Events 🌟
- **Double Points** 💰: All scoring doubled for 10 seconds
- **Frenzy Mode** ⚡: Random units spawn rapidly
- **Meteor Sweep** ☄️: Clears 30% of entities from the field

### Scoring System
- **Small Units**: +1 point when reaching opponent's end zone
- **Large Units**: +2 points when reaching opponent's end zone
- **Round Duration**: 60 seconds
- **Sudden Death**: 15 seconds if tied

## 🏗️ Architecture

This is a **client-server** application:

```
tiktok-live-game/
├── client/              # Frontend (Vite + vanilla JS)
│   ├── index.html
│   ├── styles.css
│   ├── main.js         # Game engine
│   ├── tiktok.js       # Socket.IO client + keyboard simulation
│   ├── audio.js        # Howler.js audio manager
│   ├── utils.js        # Helper functions
│   ├── vite.config.js
│   └── package.json
├── server/              # Backend (Node.js + Express + Socket.IO)
│   ├── index.js        # Server + TikTok Live Connector
│   ├── gift-map.js     # Gift classification system
│   ├── .env.example
│   └── package.json
└── package.json         # Root scripts
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- TikTok account (optional for testing - works in simulation mode)

### Installation

1. **Clone/download this repository**

2. **Install all dependencies** (root, client, and server):
   ```bash
   npm run install:all
   ```

3. **Configure TikTok connection** (optional):
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your TikTok username
   ```

### Development

Run both client and server concurrently:

```bash
npm run dev
```

This starts:
- **Client**: http://localhost:5173 (Vite dev server)
- **Server**: http://localhost:8080 (Express + Socket.IO)

### Production Build

1. **Build the client**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

The server will serve the built client files at http://localhost:8080

## 🎮 Controls

### During Game
- **SPACE**: Start new round
- **M**: Mute/unmute audio

### Keyboard Simulation (for testing)
- **L**: Simulate Like → Spawn small pumpkin 🎃
- **C**: Simulate Comment → Spawn small bat 🦇
- **F**: Simulate Follow → Spawn small bat 🦇
- **1**: Small gift → 2 random small units
- **2**: Medium gift → 1 large pumpkin
- **3**: Medium gift → 1 large bat
- **4**: Large gift → 2 large units (uses gift team)
- **5**: Mega gift → Random wild card event
- **←/→**: Toggle gift team (for key 4)

## 🔊 Audio System

The game uses **Howler.js** for audio with rate limiting. Three sound effects are included:

- `collision.wav` - Plays when units collide
- `goal.wav` - Plays when a unit scores
- `victory.wav` - Plays when a round ends

Audio files are located in `/client/public/sounds/` and automatically preloaded on startup.

**Controls**: Press **M** to mute/unmute audio.

## 🌐 Server Configuration

Edit `server/.env`:

```env
# TikTok username to connect to (without @)
# Leave empty for simulation mode
TIKTOK_USERNAME=your_tiktok_username

# Server port
PORT=8080

# Client origin (for CORS)
CLIENT_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

### Simulation Mode
If `TIKTOK_USERNAME` is not set, the server runs in **simulation mode** - perfect for testing with keyboard controls!

## 🎨 Visual Design

- **Background**: Simple Halloween gradient (black #000000 → deep pumpkin orange #1a0b00)
- **Pumpkins**: Orange (#ff7b00) with carved triangular eyes and jagged grin
- **Bats**: Black (#0b0b0b) with purple glow, eyes, and wings
- **Canvas**: 1280×720 with orange border and glow effects
- **Contrast**: Optimized for visibility against dark background

## 📊 API Endpoints

- `GET /health` - Health check (returns OK)
- `GET /api/status` - Server status and TikTok connection info

## 🐛 Troubleshooting

### Client won't connect to server
- Check that server is running on port 8080
- Check browser console for errors
- Verify CORS settings in `server/index.js`

### TikTok events not working
- Ensure `TIKTOK_USERNAME` is set correctly (without @)
- Check server console for TikTok connection status
- Try simulation mode first (leave TIKTOK_USERNAME empty)

### Audio not playing
- Check browser console for audio loading errors
- Ensure sound files exist in `/client/public/sounds/`
- Check that audio isn't muted (press M)

### Build errors
- Delete `node_modules` folders and reinstall: `npm run install:all`
- Ensure Node.js version is 18+

## 📝 Development Scripts

```bash
# Install all dependencies
npm run install:all

# Development mode (runs both client and server)
npm run dev

# Run client only
npm run dev:client

# Run server only
npm run dev:server

# Build client for production
npm run build

# Start production server
npm start
```

## 🚀 Deployment

See **FINAL_DEPLOYMENT_GUIDE.md** for detailed instructions on deploying to:
- Render
- Railway
- Other cloud platforms

## 📄 License

MIT License - Feel free to use and modify!

## 🎉 Credits

Created for TikTok Live interactive streaming experiences. Powered by:
- [TikTok Live Connector](https://github.com/zerodytrash/TikTok-Live-Connector)
- [Socket.IO](https://socket.io/)
- [Vite](https://vitejs.dev/)
- [Howler.js](https://howlerjs.com/)

---

**Have fun streaming! 🎃🦇👻**
