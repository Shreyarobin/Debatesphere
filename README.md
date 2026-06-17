# DebateSphere 🌐⚔️

> **⚠️ Work in Progress** — This project is under active development. The core platform, both debate modes, and the AI layer are functional and tested, but several planned features (spectator mode, profiles, leaderboards, mobile UI, moderation, deployment) are not yet built. Expect frequent changes, incomplete edges, and breaking changes between sessions.

A real-time debate platform built around **two distinct modes**: a free-form **Practice Mode** for honing arguments with instant AI feedback, and a structured **Competitive Mode** where an AI moderator runs a timed, Oxford-style match and delivers a final verdict — like a debate referee. Built end-to-end as a learning project to explore full-stack architecture, real-time systems, and applied AI (RAG + memory) without relying on paid APIs.

---

## 🚧 Current Status

### Foundation
| Feature | Status |
|---|---|
| User registration & login (JWT + refresh tokens) | ✅ Working |
| MongoDB schemas (User, Debate, Argument, Vote, CompetitiveMatch, MatchMessage) | ✅ Working |
| Redis pub/sub adapter for Socket.io (horizontal scaling ready) | ✅ Working |
| Real-time WebSocket communication | ✅ Working |

### Practice Mode
| Feature | Status |
|---|---|
| Create/join free-form FOR vs AGAINST debate rooms | ✅ Working |
| Real-time argument submission | ✅ Working |
| Live audience-style vote counting | ✅ Working |
| AI argument quality scoring (0–10) via Groq | ✅ Working |
| Logical fallacy detection | ✅ Working |
| **Stance-aware scoring** — penalizes well-written arguments posted on the *wrong* side | ✅ Working |
| AI Debate Prep Chatbot (streaming) | ✅ Working |
| → Retrieval-Augmented Generation (RAG) over a local debate knowledge dataset | ✅ Working |
| → Memory module — chatbot adapts advice based on a user's own past argument history | ✅ Working |
| Post-debate AI summary generator | ⚠️ Built, not yet wired into the frontend UI |

### Competitive Mode
| Feature | Status |
|---|---|
| Create/join competitive matches | ✅ Working |
| Structured 3-round format: Opening → Rebuttal → Closing | ✅ Working |
| Live synced countdown timer per round | ✅ Working |
| AI Moderator — announces round transitions automatically in-chat | ✅ Working |
| Chat-style transcript (FOR / AGAINST / Moderator, visually distinct) | ✅ Working |
| Automatic round advancement when timer hits zero | ✅ Working |
| AI Judge — reviews the full transcript holistically after all rounds end | ✅ Working |
| Final verdict: winner, per-side score (0–10), AI reasoning | ✅ Working |
| Match summary screen with full transcript replay | ✅ Working |

### Not Yet Built
| Feature | Status |
|---|---|
| Spectator / audience mode (watch + vote without participating) | 🔜 Planned |
| Post-debate stats page for Practice Mode | 🔜 Planned |
| User profiles + debate/match history | 🔜 Planned |
| Leaderboard | 🔜 Planned |
| Mobile responsive UI | 🔜 Planned |
| Content moderation + rate limiting | 🔜 Planned |
| Public debate feed + social features | 🔜 Planned |
| Docker Compose, CI/CD, production deployment | 🔜 Planned (intentionally last) |

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Socket.io client

**Backend**
- Node.js + Express.js
- Socket.io with Redis adapter
- MongoDB + Mongoose
- Redis (pub/sub)
- JWT + refresh token authentication
- **Groq API** (Llama 3.3 70B) — free, fast inference for all AI features
- **@xenova/transformers** — local embeddings for RAG, no external API calls or cost

---

## 🧠 How the AI Layer Works

DebateSphere deliberately avoids paid AI APIs. All intelligence is powered by **Groq** (free tier, Llama 3.3 70B) combined with a self-built retrieval and memory system, inspired by patterns from a prior personal project (CoachLM, an AI interview coach):

1. **Stance-aware scoring** — Before grading argument quality, the AI first checks whether the argument actually supports the side it was posted under. A well-written argument posted on the wrong side scores 0–2, with the mismatch clearly flagged in the UI.
2. **RAG (Retrieval-Augmented Generation)** — A curated local dataset of debate techniques, rhetorical strategies, and logical fallacies is embedded using `@xenova/transformers` (runs locally, free). The prep chatbot retrieves the most relevant entries via cosine similarity before responding.
3. **Memory** — The chatbot reads a user's own past arguments and AI scores from MongoDB and summarizes their tendencies (e.g. "frequently commits appeal-to-emotion fallacies") to give personalized coaching advice.
4. **AI Moderator** — In Competitive Mode, the AI announces round transitions in the live chat feed, acting as a referee rather than a participant.
5. **AI Judge** — After all rounds complete, the AI reviews the entire match transcript holistically (not argument-by-argument) and produces a winner, scores, and written reasoning — similar to a real debate judge's verdict.

---

## 📁 Project Structure

```
debatesphere/
├── backend/
│   └── src/
│       ├── models/          # User, Debate, Argument, Vote, CompetitiveMatch, MatchMessage
│       ├── controllers/     # Route handlers (auth, debates, matches)
│       ├── routes/          # Express routes (auth, debates, matches, AI)
│       ├── middleware/      # JWT auth middleware
│       ├── sockets/         # debateSocket.js (Practice Mode), matchSocket.js (Competitive Mode)
│       └── services/
│           ├── openaiService.js     # All Groq calls: scoring, chatbot, summary, judging
│           ├── ragService.js        # Local embeddings + cosine similarity search
│           ├── memoryService.js     # Reads user history from MongoDB
│           └── debateDataset.js     # Hardcoded debate knowledge base for RAG
└── frontend/
    └── src/
        ├── app/
        │   ├── login/, register/
        │   ├── debates/              # Practice Mode lobby + room
        │   │   └── [roomCode]/PrepChatbot.tsx
        │   └── matches/              # Competitive Mode lobby + room
        ├── context/                 # Auth context
        └── lib/                     # Axios + Socket.io clients
```

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js v22+
- MongoDB (running locally on port 27017)
- Redis (via WSL2 on Windows, or natively on Mac/Linux)
- A free Groq API key from [console.groq.com](https://console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/Shreyarobin/Debatesphere.git
cd Debatesphere
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/debatesphere
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
GROQ_API_KEY=gsk-your-groq-key-here
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

The first startup will take slightly longer as it downloads and indexes the local embedding model for RAG.

### 3. Set up the frontend
```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

### 4. Make sure Redis is running
```bash
sudo service redis-server start
```

Then open `http://localhost:3000`.

---

## 🗺️ Roadmap

- [ ] Spectator mode for both Practice and Competitive rooms
- [ ] Post-debate stats/summary page for Practice Mode (wire up the existing summary generator)
- [ ] User profiles with debate/match history
- [ ] Leaderboard (by score, wins, votes)
- [ ] Mobile responsive redesign
- [ ] Content moderation + rate limiting
- [ ] Public debate feed + follow/comment system
- [ ] Docker Compose for one-command setup
- [ ] Deploy backend to Render, frontend to Vercel
- [ ] GitHub Actions CI/CD pipeline

---

## 👩‍💻 Author

Built by **Shreya Robin** as a personal project to learn full-stack development, real-time architecture with Socket.io and Redis, and practical AI integration (RAG, memory, and LLM-driven game logic) without relying on paid APIs.

> This project is actively evolving — features are being added in focused sessions, one phase at a time. If you're viewing this on a particular day, check the table above for what's actually working versus what's still planned.
