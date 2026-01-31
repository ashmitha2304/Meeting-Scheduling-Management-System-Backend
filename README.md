# Meeting Scheduler Backend API

Production-ready Node.js + Express + MongoDB Atlas backend with JWT authentication and Role-Based Access Control.

## 🚀 Features

- ✅ JWT Authentication (Access + Refresh Tokens)
- ✅ Role-Based Access Control (ORGANIZER/PARTICIPANT)
- ✅ Meeting CRUD Operations
- ✅ Conflict Detection & Prevention
- ✅ Participant Assignment & Management
- ✅ MongoDB Atlas Integration
- ✅ TypeScript for Type Safety
- ✅ Comprehensive API Documentation

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: bcryptjs, cors, express-rate-limit
- **Language**: TypeScript

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Environment configuration
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, RBAC, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # JWT utilities
│   ├── validators/      # Joi schemas
│   └── index.ts         # Server entry point
├── scripts/             # Setup scripts
├── dist/                # Compiled JavaScript
└── package.json
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=https://your-frontend-url.vercel.app
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Meetings (`/api/meetings`)
- `POST /api/meetings` - Create meeting (ORGANIZER only)
- `GET /api/meetings` - Get meetings (role-based)
- `GET /api/meetings/schedule` - Get user schedule
- `GET /api/meetings/my-meetings` - Get assigned meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `PATCH /api/meetings/:id` - Update meeting (ORGANIZER only)
- `DELETE /api/meetings/:id` - Delete meeting (ORGANIZER only)
- `PATCH /api/meetings/:id/cancel` - Cancel meeting
- `POST /api/meetings/:id/participants` - Assign participants (ORGANIZER)
- `DELETE /api/meetings/:id/participants` - Remove participants (ORGANIZER)

### Users (`/api/users`)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/organizers` - Get all organizers
- `GET /api/users/participants` - Get all participants

### Health Check
- `GET /health` - Server health status

## 🌐 Deployment on Render

### Prerequisites
- MongoDB Atlas cluster set up
- GitHub repository created

### Deployment Steps

1. **Connect Repository**:
   - Go to [Render Dashboard](https://render.com)
   - New Web Service
   - Connect this repository

2. **Configure Service**:
   ```
   Name: meeting-scheduler-backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Add Environment Variables**:
   - Add all variables from `.env` file
   - Use your production values

4. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment

### Verify Deployment

```bash
curl https://your-app.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2026-02-01T...",
  "uptime": 123.45
}
```

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT access and refresh tokens
- Role-based authorization
- CORS protection
- Rate limiting
- Environment variable validation
- Secure MongoDB connection

## 📚 Documentation

- [Deployment Guide](README-DEPLOYMENT.md) - Complete deployment instructions
- API Documentation - Available at `/api` endpoint

## 👤 Author

**Ashmitha** ([@ashmitha2304](https://github.com/ashmitha2304))

## 📄 License

MIT

## 🔗 Links

- **Frontend Repository**: https://github.com/ashmitha2304/Meeting-Scheduling-Management-System-Frontend
- **Complete Project**: https://github.com/ashmitha2304/Meeting-Scheduling-Management-System
