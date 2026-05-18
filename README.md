# TaskFlow AI — Team Task Manager

> An AI-powered team task management application built for the Ethara AI Full-Stack Assignment.

![TaskFlow AI](https://img.shields.io/badge/TaskFlow-AI-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)

## 🚀 Live Demo

- **Frontend:** https://taskflow-ai-frontend.up.railway.app
- **Backend API:** https://taskflow-ai-backend.up.railway.app/health

**Demo Credentials:**
- Email: `demo@taskflow.ai`
- Password: `demo123`

---

## ✨ What Makes This Unique

Unlike a basic Trello clone, TaskFlow AI integrates **AI-powered features** directly into the task management workflow:

1. **🤖 AI Task Generator** — Type a task title, click "AI Fill" and the AI (Groq LLaMA3) auto-generates description, priority, estimated hours, tags, and subtasks
2. **📊 Smart Risk Analysis** — AI analyzes tasks and assigns risk scores based on deadlines, priority, and assignment status
3. **💡 Project Health Summaries** — AI generates natural language project status summaries
4. **🎨 Beautiful Dark UI** — Glassmorphism design with smooth animations (Framer Motion)
5. **📈 Rich Dashboard** — Weekly completion charts, team workload heatmap, overdue tracking
6. **🔄 Kanban + List Views** — Toggle between visual Kanban board and compact list view
7. **💬 Task Comments** — Inline discussion on every task
8. **🏷️ Tags & Filtering** — Organize and filter tasks by status, priority, assignee

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework |
| TailwindCSS v4 | Styling |
| Framer Motion | Animations |
| Recharts | Dashboard charts |
| Zustand | State management |
| React Router v6 | Navigation |
| Axios | HTTP client |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Groq SDK (LLaMA3) | AI features |
| Helmet + Rate Limiting | Security |

---

## 📁 Project Structure

```
taskflow-ai/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema with bcrypt
│   │   ├── Project.js       # Project with members, activity log
│   │   └── Task.js          # Task with comments, AI fields
│   ├── routes/
│   │   ├── auth.js          # Signup, login, profile
│   │   ├── projects.js      # CRUD + member management
│   │   ├── tasks.js         # CRUD + comments
│   │   ├── dashboard.js     # Analytics & stats
│   │   ├── users.js         # User search
│   │   └── ai.js            # AI endpoints (Groq)
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   └── projectAccess.js # Role-based access
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Button, Input, Modal, Avatar, Badge
│   │   │   ├── layout/      # Sidebar, AppLayout
│   │   │   └── tasks/       # TaskCard, CreateTaskModal
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectDetailPage.jsx
│   │   │   ├── MyTasksPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── store/
│   │   │   └── authStore.js  # Zustand auth state
│   │   └── lib/
│   │       ├── api.js        # Axios instance
│   │       └── utils.js      # Helpers, constants
│   └── vite.config.js
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |
| PUT | `/api/projects/:id/members/:userId/role` | Change role (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?projectId=xxx` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full dashboard stats |
| GET | `/api/dashboard/project/:id` | Project stats |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-task` | AI task description |
| POST | `/api/ai/risk-analysis` | Task risk scores |
| POST | `/api/ai/project-summary` | Project health summary |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at console.groq.com)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

**Backend `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
GROQ_API_KEY=gsk_your_groq_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🌐 Deployment on Railway

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: TaskFlow AI"
git remote add origin https://github.com/yourusername/taskflow-ai.git
git push -u origin main
```

### Step 2: Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → choose the `backend` folder as root
3. Add environment variables (same as `.env` above)
4. Railway auto-detects Node.js and deploys

### Step 3: Deploy Frontend on Railway
1. New Service → GitHub → same repo → `frontend` folder as root
2. Add `VITE_API_URL=https://your-backend.railway.app/api`
3. Railway runs `npm run build` automatically

### Step 4: Connect them
- Copy your backend Railway URL
- Update `VITE_API_URL` in frontend Railway env vars
- Redeploy frontend

---

## 🔐 Security Features

- JWT authentication with 7-day expiry
- Passwords hashed with bcrypt (12 salt rounds)
- Rate limiting (200 req/15min per IP)
- Helmet.js security headers
- Input validation with express-validator
- Role-based access control (Admin/Member)
- CORS configured for production

---

## 🎯 Role-Based Access Control

| Feature | Admin | Member |
|---------|-------|--------|
| Create/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Update assigned tasks | ✅ | ✅ |
| Delete tasks | ✅ | Own only |
| View project | ✅ | ✅ |
| Dashboard | ✅ | ✅ |

---

## 🤖 AI Features (Groq LLaMA3)

The app uses **Groq's free API** with the `llama3-8b-8192` model for:

1. **Task Generation**: Given a title, generates description, priority, estimated hours, tags, and subtasks
2. **Risk Analysis**: Scores tasks 0-100 based on deadline proximity, priority, and assignment status
3. **Project Summary**: Natural language health summary with actionable recommendations

All AI features have **graceful fallbacks** — if the API is unavailable, smart heuristics are used instead. The app works fully without an AI key.

---

## 📊 Database Schema

### User
```
name, email, password (hashed), avatar (color), bio, isActive, lastSeen
```

### Project
```
name, description, color, emoji, status, members[{user, role}], 
activity[{user, action, target, timestamp}], taskCount, completedTaskCount, dueDate, tags
```

### Task
```
title, description, project, assignedTo, createdBy, status, priority,
dueDate, completedAt, tags, estimatedHours, actualHours, 
comments[{user, text}], aiGenerated, aiRiskScore, position
```

---

## 👨‍💻 Author

Built for the **Ethara AI Full-Stack Assignment** — demonstrating full-stack engineering skills with a unique AI-integrated approach.
