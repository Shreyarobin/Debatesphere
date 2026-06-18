# DebateSphere 🌐⚔️

> **⚠️ Work in Progress** — This project is under active development. Three full debate experiences, the entire AI layer, and a complete identity/progression system (profiles, history, leaderboard) are functional and tested. Mobile responsiveness, content moderation, and a public social feed are not yet built, and deployment is intentionally saved for last. Expect frequent changes between sessions.

A real-time debate platform built around **three distinct ways to debate**: practice solo against an AI opponent and get a coaching report, go free-form against another person with live AI scoring and an AI prep coach, or compete head-to-head in a structured, timed Oxford-style match with an AI moderator and a final AI verdict. Built end-to-end as a learning project to explore full-stack architecture, real-time systems, and applied AI (RAG, memory, and multi-persona AI behavior) without relying on paid APIs.

---

## 🚧 Current Status

### Foundation
| Feature | Status |
|---|---|
| User registration & login (JWT + refresh tokens) | ✅ Working |
| MongoDB schemas (User, Debate, Argument, Vote, CompetitiveMatch, MatchMessage, SoloSession) | ✅ Working |
| Redis pub/sub adapter for Socket.io (horizontal scaling ready) | ✅ Working |
| Real-time WebSocket communication | ✅ Working |
| `/home` landing hub + `/practice` sub-choice page after login | ✅ Working |

### Practice Mode — Solo vs AI
| Feature | Status |
|---|---|
| Pick a topic and a side, AI argues the opposite | ✅ Working |
| 3-minute timed round, live back-and-forth chat with AI opponent | ✅ Working |
| AI generates sharp, on-topic rebuttals each turn | ✅ Working |
| AI-generated strengths & weaknesses coaching report at the end | ✅ Working |
| No prep assistance in this mode (intentional — it's the test, not the practice) | ✅ Working |

### Practice Mode — With a Competitor
| Feature | Status |
|---|---|
| Create/join free-form FOR vs AGAINST debate rooms | ✅ Working |
| Real-time argument submission | ✅ Working |
| Live audience-style vote counting | ✅ Working |
| AI argument quality scoring (0–10) via Groq | ✅ Working |
| Logical fallacy detection | ✅ Working |
| **Stance-aware scoring** — penalizes well-written arguments posted on the *wrong* side | ✅ Working |
| AI Debate Prep Chatbot (streaming, RAG + memory powered) | ✅ Working |
| Spectator mode — watch live, vote, without participating | ✅ Working |
| Explicit join-vs-watch choice screen on entering a room | ✅ Working |
| "End Debate" + post-debate stats page (avg scores, most-upvoted, AI summary) | ✅ Working |

### Competitive Mode
| Feature | Status |
|---|---|
| Create/join competitive matches | ✅ Working |
| Structured 3-round format: Opening → Rebuttal → Closing | ✅ Working |
| Live synced countdown timer per round | ✅ Working |
| AI Moderator — announces round transitions automatically in-chat | ✅ Working |
| Chat-style transcript (FOR / AGAINST / Moderator, visually distinct) | ✅ Working |
| AI Judge — reviews the full transcript holistically, delivers winner + scores + reasoning | ✅ Working |
| Spectator mode with live population counter | ✅ Working |
| Match summary screen with full transcript replay | ✅ Working |

### Identity & Progression
| Feature | Status |
|---|---|
| User profiles (`/profile/[username]`) | ✅ Working |
| Cross-mode stats: Practice avg score, debate count, Competitive W/L/T record | ✅ Working |
| Clickable debate & match history linking back to past rooms | ✅ Working |
| Leaderboard — ranked by avg AI score (Practice) and wins (Competitive) | ✅ Working |

### Not Yet Built
| Feature | Status |
|---|---|
| Mobile responsive UI | 🔜 Planned |
| Content moderation + rate limiting | 🔜 Planned |
| Public debate feed + follow/comment system | 🔜 Planned |
| Solo Practice sessions reflected in profile/leaderboard | 🔜 Planned |
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

DebateSphere deliberately avoids paid AI APIs. All intelligence runs on **Groq** (free tier, Llama 3.3 70B) combined with a self-built retrieval and memory system. The AI plays five distinct roles across the app:

1. **Stance-aware scorer** — Before grading argument quality, checks whether the argument actually supports the side it was posted under. A well-written argument posted on the wrong side scores 0–2, with the mismatch flagged in the UI.
2. **Prep coach (RAG + Memory)** — A curated local dataset of debate techniques and fallacies is embedded with `@xenova/transformers` (runs locally, free) and retrieved via cosine similarity. The coach also reads a user's own past arguments and scores from MongoDB to personalize advice — e.g. warning a user who frequently commits appeal-to-emotion fallacies.
3. **AI opponent (Solo Mode)** — Argues the opposite side of whatever topic the user picks, generating direct, punchy rebuttals turn-by-turn within a 3-minute timer.
4. **AI moderator** — In Competitive Mode, announces round transitions in the live chat feed, acting as a referee rather than a participant.
5. **AI judge / coach** — After a Competitive match, holistically reviews the full transcript and produces a winner, scores, and reasoning. After a Solo session, the same holistic-review pattern instead produces a strengths/weaknesses coaching report.

---

## 📁 Project Structure

```
debatesphere/
├── backend/
│   └── src/
│       ├── models/          # User, Debate, Argument, Vote, CompetitiveMatch, MatchMessage, SoloSession
│       ├── controllers/     # auth, debates, matches, solo, profile, leaderboard
│       ├── routes/          # Express routes matching each controller
│       ├── middleware/      # JWT auth middleware
│       ├── sockets/         # debateSocket.js (Practice w/ Competitor), matchSocket.js (Competitive)
│       └── services/
│           ├── openaiService.js     # All Groq calls: scoring, chatbot, summary, judging, AI opponent, solo report
│           ├── ragService.js        # Local embeddings + cosine similarity search
│           ├── memoryService.js     # Reads user history from MongoDB
│           └── debateDataset.js     # Hardcoded debate knowledge base for RAG
└── frontend/
    └── src/
        ├── app/
        │   ├── login/, register/
        │   ├── home/                 # Post-login hub: choose Practice or Competitive
        │   ├── practice/             # Choose Solo vs AI or With a Competitor
        │   │   └── solo/             # 3-min timed solo debate vs AI + report
        │   ├── debates/               # Practice w/ Competitor lobby + room
        │   │   └── [roomCode]/
        │   │       ├── PrepChatbot.tsx
        │   │       └── results/      # Post-debate stats page
        │   ├── matches/               # Competitive Mode lobby + room
        │   ├── profile/[username]/
        │   └── leaderboard/
        ├── context/                  # Auth context
        └── lib/                      # Axios + Socket.io clients
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

- [ ] Mobile responsive redesign across all pages
- [ ] Content moderation + rate limiting (spam protection, report system)
- [ ] Fold Solo Practice stats into profiles and the leaderboard
- [ ] Public debate feed + follow/comment system
- [ ] Docker Compose for one-command setup
- [ ] Deploy backend to Render, frontend to Vercel
- [ ] GitHub Actions CI/CD pipeline

---

## 👩‍💻 Author

Built by **Shreya Robin** as a personal project to learn full-stack development, real-time architecture with Socket.io and Redis, and practical AI integration (RAG, memory, multi-persona LLM behavior, and game/coaching logic) without relying on paid APIs.

> This project is actively evolving — features are being added in focused sessions, one phase at a time. If you're viewing this on a particular day, check the tables above for what's actually working versus what's still planned.
