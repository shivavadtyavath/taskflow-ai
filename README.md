# TaskFlow AI — Team Task Manager

> A full-stack AI-powered team task management application built for the **Ethara AI Full-Stack Assignment**.

---

## 🌐 Live Demo

| | URL |
|--|--|
| **Frontend** | https://taskflow-ai-frontend.onrender.com |
| **Backend API** | https://taskflow-ai-backend-y3li.onrender.com |
| **Health Check** | https://taskflow-ai-backend-y3li.onrender.com/health |
| **GitHub** | https://github.com/shivavadtyavath/taskflow-ai |

### Demo Credentials
```
Email:    demo@taskflow.ai
Password: demo123
```

> ⚠️ Free tier on Render — first load may take 30-50 seconds to wake up. Please wait.

---

## ✨ Features

### Core Features (Assignment Requirements)
- ✅ **User Authentication** — Signup, Login with JWT
- ✅ **Project Management** — Create projects, admin/member roles
- ✅ **Team Management** — Add/remove members, change roles
- ✅ **Task Management** — Create, assign, update status (To Do / In Progress / In Review / Done)
- ✅ **Dashboard** — Total tasks, tasks by status, overdue tasks, tasks per user
- ✅ **Role-Based Access** — Admin manages everything, Members update assigned tasks only

### Unique AI-Powered Features
- 🤖 **AI Task Generator** — Type a title, click "AI Fill" → LLaMA3 auto-generates description, priority, estimated hours, tags, and subtasks
- 📊 **Smart Risk Analysis** — AI scores tasks by risk based on deadlines and priority
- 💡 **Project Health Summary** — AI generates natural language project status insights
- ⚡ **Graceful Fallbacks** — App works 100% even without AI key

### UI/UX
- 🎨 Beautiful dark glassmorphism design
- 🔄 Kanban board + List view toggle
- 📈 Weekly completion charts (Recharts)
- 👥 Team workload visualization
- 💬 Task comments system
- 🏷️ Tags and priority filtering
- ✨ Smooth animations (Framer Motion)

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI Framework |
| TailwindCSS v4 | Styling |
| Framer Motion | Animations |
| Recharts | Dashboard Charts |
| Zustand | State Management |
| React Router v6 | Navigation |
| Axios | HTTP Client |
| Lucide React | Icons |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API |
| MongoDB + Mongoose | Database |
| JWT + bcryptjs | Auth & Security |
| Groq SDK (LLaMA3) | AI Features |
| Helmet | Security Headers |
| Express Rate Limit | API Protection |
| Morgan | Request Logging |

### Deployment
| Service | Platform |
|---------|---------|
| Backend | Render.com (Free) |
| Frontend | Render.com (Free) |
| Database | MongoDB Atlas (Free) |

---

## 📁 Project Structure

```
taskflow-ai/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   └── projectAccess.js     # Role-based access control
│   ├── models/
│   │   ├── User.js              # User schema (bcrypt hashing)
│   │   ├── Project.js           # Project with members & activity log
│   │   └── Task.js              # Task with comments & AI fields
│   ├── routes/
│   │   ├── auth.js              # POST /signup, /login, GET /me
│   │   ├── projects.js          # CRUD + member management
│   │   ├── tasks.js             # CRUD + comments
│   │   ├── dashboard.js         # Analytics & stats
│   │   ├── users.js             # User search
│   │   └── ai.js                # Groq AI endpoints
│   ├── scripts/
│   │   └── seed.js              # Demo data seeder
│   └── server.js                # Express app entry point
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/              # Button, Input, Modal, Avatar, Badge
│       │   ├── layout/          # Sidebar, AppLayout
│       │   └── tasks/           # TaskCard, CreateTaskModal
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── SignupPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── ProjectsPage.jsx
│       │   ├── ProjectDetailPage.jsx  # Kanban board
│       │   ├── MyTasksPage.jsx
│       │   └── ProfilePage.jsx
│       ├── store/
│       │   └── authStore.js     # Zustand auth state
│       └── lib/
│           ├── api.js           # Axios instance with JWT interceptor
│           └── utils.js         # Helpers, constants
│
├── render.yaml                  # Render deployment config
├── README.md
└── .gitignore
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update name/bio |

### Projects
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Member | List my projects |
| POST | `/api/projects` | Any | Create project (becomes admin) |
| GET | `/api/projects/:id` | Member | Get project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project + tasks |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |
| PUT | `/api/projects/:id/members/:userId/role` | Admin | Change role |

### Tasks
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks?projectId=xxx` | Member | List tasks (filterable) |
| POST | `/api/tasks` | Member | Create task |
| GET | `/api/tasks/:id` | Member | Get task details |
| PUT | `/api/tasks/:id` | Member/Admin | Update task |
| DELETE | `/api/tasks/:id` | Admin/Creator | Delete task |
| POST | `/api/tasks/:id/comments` | Member | Add comment |
| DELETE | `/api/tasks/:id/comments/:cid` | Admin/Owner | Delete comment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full stats (charts, overdue, workload) |
| GET | `/api/dashboard/project/:id` | Project-specific stats |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-task` | AI fills task details from title |
| POST | `/api/ai/risk-analysis` | Score tasks by risk |
| POST | `/api/ai/project-summary` | Natural language project health |

---

## 🔐 Security

- JWT tokens with 7-day expiry
- Passwords hashed with bcrypt (12 salt rounds)
- Rate limiting: 200 requests per 15 minutes per IP
- Helmet.js security headers
- Input validation with express-validator
- CORS configured for production domains
- Environment variables for all secrets

---

## 👥 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Update assigned tasks | ✅ | ✅ |
| Delete tasks | ✅ | Own only |
| View dashboard | ✅ | ✅ |
| Use AI features | ✅ | ✅ |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Groq API key (free at console.groq.com) — optional

### 1. Clone the repo
```bash
git clone https://github.com/shivavadtyavath/taskflow-ai.git
cd taskflow-ai
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskflow
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRE=7d
GROQ_API_KEY=gsk_your_groq_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
# ✅ MongoDB connected
# 🚀 Server running on port 5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
# Open http://localhost:5173
```

### 4. Seed demo data (optional)
```bash
cd backend
node scripts/seed.js
# Creates demo@taskflow.ai / demo123 with sample project
```

---

## 🌐 Deployment (Render.com)

### Backend
1. New Web Service → Public Git Repo → `https://github.com/shivavadtyavath/taskflow-ai`
2. Root Directory: `backend`
3. Build: `npm install`
4. Start: `node server.js`
5. Add env vars (MONGODB_URI, JWT_SECRET, GROQ_API_KEY, NODE_ENV=production, FRONTEND_URL)

### Frontend
1. New Web Service → same repo
2. Root Directory: `frontend`
3. Build: `npm install --legacy-peer-deps && npm run build`
4. Start: `npm run start`
5. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## 🤖 AI Features Detail

Uses **Groq's free API** with `llama3-8b-8192` model:

**Task Generation** — Given a title, returns:
- Detailed description with acceptance criteria
- Suggested priority level
- Estimated hours
- Relevant tags
- 3-5 subtask suggestions

**Risk Analysis** — Scores each task 0-100 based on:
- Days until due date
- Priority level
- Assignment status
- Current task status

**All AI features have graceful fallbacks** — smart heuristics are used if the API is unavailable. The app is fully functional without an AI key.

---

## 📊 Database Schema

### User
```
name, email, password(hashed), avatar(color), bio, isActive, lastSeen, timestamps
```

### Project
```
name, description, color, emoji, status, dueDate, tags,
members[{user, role, joinedAt}],
activity[{user, action, target, timestamp}],
taskCount, completedTaskCount, timestamps
```

### Task
```
title, description, project(ref), assignedTo(ref), createdBy(ref),
status(todo|in-progress|in-review|done),
priority(low|medium|high|critical),
dueDate, completedAt, tags, estimatedHours, actualHours,
comments[{user, text, createdAt}],
aiGenerated, aiRiskScore, position, timestamps
```

---

## 📝 Assignment Checklist

- ✅ Signup with Name, Email, Password
- ✅ Secure login with JWT
- ✅ Create projects (creator becomes Admin)
- ✅ Admin can add/remove members
- ✅ Members can view assigned projects
- ✅ Create tasks (Title, Description, Due Date, Priority)
- ✅ Assign tasks to users
- ✅ Update status (To Do, In Progress, Done)
- ✅ Dashboard — Total tasks, Tasks by status, Tasks per user, Overdue tasks
- ✅ Role-Based Access (Admin/Member)
- ✅ RESTful APIs
- ✅ MongoDB database with proper relationships
- ✅ Validations and error handling
- ✅ Deployed and publicly accessible
- ✅ Backend and frontend connected
- ✅ Environment variables properly used
- ✅ README with setup and deployment steps
- ✅ GitHub repository

---

*Built by Shiva Vadthyavath for Ethara AI Full-Stack Assignment*
