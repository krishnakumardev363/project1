# MERN Stack App — Deploy Training

Full-stack app with **MongoDB · Express · React (Vite) · Node.js** + Tailwind CSS.

## Features

- ✅ JWT Authentication (register / login / logout)
- ✅ Protected routes (frontend + backend)
- ✅ Per-user data isolation — users only see their own items
- ✅ Full CRUD — Create, Read, Update, Delete items
- ✅ Search + filter by status
- ✅ Role-based authorisation middleware (user / admin)
- ✅ Responsive dark UI with Tailwind CSS

---

## Project Structure

```
mern-app/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── itemController.js
│   ├── middleware/
│   │   └── auth.js           # JWT protect + restrictTo
│   ├── models/
│   │   ├── User.js
│   │   └── Item.js           # owner field scopes data per user
│   ├── routes/
│   │   ├── auth.js
│   │   └── items.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   └── ItemModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── axios.js      # axios with JWT interceptors
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js        # proxies /api → localhost:5000
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json              # root — runs both with concurrently
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
# From root
npm install             # installs concurrently
npm run install:all     # installs backend + frontend deps
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mernapp
JWT_SECRET=change_this_to_a_long_random_string
NODE_ENV=development
```

### 3. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 mongo
```

### 4. Run in development

```bash
# From root (runs both simultaneously)
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | Protected | Get current user |

### Items (all protected — users only see their own)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items | List user's items (supports ?status=&search=) |
| POST | /api/items | Create item |
| GET | /api/items/:id | Get single item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |

---

## Deployment

### Backend (Railway / Render / Fly.io)
1. Set env vars: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL`
2. Build command: `npm install`
3. Start command: `node server.js`

### Frontend (Vercel / Netlify)
1. Build command: `npm run build`
2. Output dir: `dist`
3. Set env var: `VITE_API_URL=https://your-backend-url.com` (if not using proxy)

> For production, update `axios.js` baseURL to use `import.meta.env.VITE_API_URL` instead of `/api`.

---

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT expires in 7 days
- All item queries include `owner: req.user._id` — a user can never access another user's data
- CORS is configured to only allow requests from the frontend origin
