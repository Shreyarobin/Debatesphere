# DebateSphere 🌐⚔️

> **⚠️ Work in Progress** — This project is actively being developed. Core functionality is working but several features are still being built out. Expect breaking changes and rough edges.

A real-time Oxford-style debate platform where two participants argue FOR and AGAINST a topic in live debate rooms, with an audience that can vote on arguments. Built with a modern full-stack architecture featuring WebSocket-based real-time communication, JWT authentication, and AI-powered argument analysis.

---

## 🚧 Current Status

| Feature | Status |
|---|---|
| User registration & login | ✅ Working |
| JWT + refresh token auth | ✅ Working |
| Create debate rooms with codes | ✅ Working |
| Join rooms as FOR / AGAINST | ✅ Working |
| Real-time argument submission | ✅ Working |
| Live vote counting | ✅ Working |
| Redis pub/sub adapter | ✅ Working |
| AI argument scoring | ⏳ Requires OpenAI API key |
| AI debate prep chatbot | ⏳ Requires OpenAI API key |
| Post-debate AI summary | ⏳ Requires OpenAI API key |
| Debate timer | 🔜 Planned |
| Mobile responsive UI | 🔜 Planned |
| Deployment (Render + Vercel) | 🔜 Planned |
| Docker Compose setup | 🔜 Planned |
| GitHub Actions CI/CD | 🔜 Planned |

---

## 🛠️ Tech Stack

**Frontend**
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Socket.io client
- Axios

**Backend**
- Node.js + Express.js
- Socket.io with Redis adapter (horizontal scaling)
- MongoDB + Mongoose
- Redis (pub/sub)
- JWT + refresh token authentication
- OpenAI API (gpt-4o-mini)

---

## 📁 Project Structure

```
debatesphere/
├── backend/
│   └── src/
│       ├── models/          # Mongoose schemas (User, Debate, Argument, Vote)
│       ├── controllers/     # Route handlers
│       ├── routes/          # Express routes (auth, debates, AI)
│       ├── middleware/       # JWT auth middleware
│       ├── sockets/         # Socket.io event handlers
│       └── services/        # OpenAI service
└── frontend/
    └── src/
        ├── app/             # Next.js pages (login, register, debates, room)
        ├── context/         # Auth context
        └── lib/             # Axios + Socket.io clients
```

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js v22+
- MongoDB (running locally on port 27017)
- Redis (running via WSL2 on Windows, or natively on Mac/Linux)

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

Create a `.env` file in the `backend/` folder:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/debatesphere
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
OPENAI_API_KEY=sk-your-openai-key-here
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

### 3. Set up the frontend
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

### 4. Make sure Redis is running
On Windows (WSL2):
```bash
sudo service redis-server start
```

Then open `http://localhost:3000` in your browser.

---

## 🤖 AI Features (Optional)

DebateSphere has three AI touchpoints powered by the OpenAI API. These are optional — the platform works without them, but with a valid API key you get:

- **Argument Quality Scorer** — rates each argument 0–10 with logical fallacy detection
- **Debate Prep Chatbot** — streaming SSE chatbot to help you prepare arguments
- **Post-Debate Summary** — neutral AI-generated summary of the full debate

To enable: add a valid `OPENAI_API_KEY` to `backend/.env`.

---

## 🗺️ Roadmap

- [ ] Debate timer with round system
- [ ] Post-debate summary page with AI analysis
- [ ] Audience-only mode (spectators who can't post arguments)
- [ ] Mobile responsive redesign
- [ ] Docker Compose for one-command local setup
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] GitHub Actions CI/CD pipeline
- [ ] Debate history and user profiles

---

## 👩‍💻 Author

Built by **Shreya Robin** as a personal project exploring real-time full-stack development, WebSocket architecture, and applied AI integration.

> This is an ongoing project — features are being added regularly. Contributions, suggestions, and feedback are welcome!
