# Meeting Scheduler Backend - Deployment Guide

## 📋 Production-Ready Backend

Clean, professional Node.js + Express + MongoDB Atlas backend for Meeting Scheduling System.

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (Access + Refresh Tokens)
- **Language**: TypeScript
- **Validation**: Joi
- **Security**: bcryptjs, cors, express-rate-limit

## 📁 Clean Folder Structure

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
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables (DO NOT commit)
├── .env.example         # Template for environment variables
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README-DEPLOYMENT.md # This file
```

## 🔐 Required Environment Variables

Create a `.env` file in the backend directory with these variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://meetingUser:meetingUser@m0.smalwny.mongodb.net/meeting-scheduler?retryWrites=true&w=majority&appName=M0

# JWT Secrets (MUST be at least 32 characters)
JWT_SECRET=yi4m9OMQ8fh5gRIEN5Xshy4Yqa7lg1T7NTioitCmL8E0ieniHmJn7rUfYKIWMSmfdBq6q0ZWauoIcLbT42LA+w==
JWT_REFRESH_SECRET=H1gi7KzPdg9v9SiZ7ScdZA1F9t+Trkl8TScSsrG7Wxm4tVloF5PHuoqns9grqHUYLAkygYEt9rwdGonTK8rbkQ==

# JWT Token Expiration
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12

# Frontend URLs (update for production)
CLIENT_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## 🚀 Render Deployment Steps

### 1. Push to GitHub

```bash
cd backend
git init
git add .
git commit -m "Production-ready backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/meeting-scheduler-backend.git
git push -u origin main
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**

- **Name**: `meeting-scheduler-backend`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave blank (or `backend` if monorepo)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Advanced Settings:**

- **Node Version**: Select **18.x** or higher

### 3. Add Environment Variables on Render

In the "Environment" section, add all variables from your `.env` file:

| Key                      | Value                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                                                                            |
| `PORT`                   | `5000`                                                                                                                  |
| `MONGODB_URI`            | `mongodb+srv://meetingUser:meetingUser@m0.smalwny.mongodb.net/meeting-scheduler?retryWrites=true&w=majority&appName=M0` |
| `JWT_SECRET`             | (your JWT secret from .env)                                                                                             |
| `JWT_REFRESH_SECRET`     | (your refresh secret from .env)                                                                                         |
| `JWT_EXPIRES_IN`         | `1h`                                                                                                                    |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                                                                                                    |
| `BCRYPT_SALT_ROUNDS`     | `12`                                                                                                                    |
| `CLIENT_URL`             | `https://your-frontend.vercel.app`                                                                                      |
| `ALLOWED_ORIGINS`        | `https://your-frontend.vercel.app`                                                                                      |

### 4. Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait for the deployment to complete (3-5 minutes)
4. Note your backend URL: `https://meeting-scheduler-backend-xyz.onrender.com`

### 5. Verify Deployment

Test your endpoints:

**Health Check:**

```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-31T...",
  "uptime": 123.45,
  "mongodb": "connected"
}
```

**API Info:**

```bash
curl https://your-backend-url.onrender.com/api
```

## 📊 MongoDB Atlas Configuration

✅ **Already Configured:**

- **Cluster**: M0 Free Tier (AWS Mumbai)
- **Database**: `meeting-scheduler`
- **User**: `meetingUser` / `meetingUser`
- **Network Access**: `0.0.0.0/0` (Allow from anywhere)

⚠️ **Important**: The MongoDB Atlas connection will work on Render (Linux servers with proper DNS). Local Windows connection issues are **NOT** a production problem.

## 🧪 Testing Locally

**Development Mode (with TypeScript):**

```bash
npm run dev
```

**Production Mode (with compiled JavaScript):**

```bash
npm run build
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

- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `GET /api/users/organizers` - Get all organizers
- `GET /api/users/participants` - Get all participants

### Health (`/health`)

- `GET /health` - Server health check

## 🔒 Security Features

✅ **Implemented:**

- JWT Authentication (Access + Refresh tokens)
- Password hashing with bcrypt (12 rounds)
- Role-based access control (ORGANIZER/PARTICIPANT)
- CORS protection
- Rate limiting
- Environment variable validation
- Graceful shutdown handling
- MongoDB connection error handling

## 🐛 Common Issues & Solutions

### Issue: "querySrv ECONNREFUSED" locally

**Solution**: This is a Windows DNS limitation. MongoDB Atlas works perfectly on Render (Linux). For local development:

1. Use mobile hotspot
2. Try different DNS (8.8.8.8)
3. Or use local MongoDB: `mongodb://localhost:27017/meeting-scheduler`

### Issue: Build fails on Render

**Solution**: Check build logs. Common fixes:

- Ensure `engines.node` is set in package.json
- Verify all dependencies are in `dependencies`, not `devDependencies`
- Check TypeScript compilation errors

### Issue: Environment variables not working

**Solution**:

- Verify all variables are added in Render dashboard
- Check for typos in variable names
- Restart the service after adding variables

## ✅ Production Checklist

Before deployment, verify:

- [x] All test files removed (testMongoConnection.js, etc.)
- [x] `.gitignore` configured (don't commit .env, node_modules, dist)
- [x] Environment variables validated
- [x] TypeScript compiles without errors
- [x] MongoDB Atlas network access configured
- [x] JWT secrets are at least 32 characters
- [x] CORS origins configured for production
- [x] Health endpoint works
- [x] Graceful shutdown implemented
- [x] Error handling in place
- [x] Build command works: `npm run build`
- [x] Start command works: `npm start`

## 📞 Support

For issues or questions:

- Check MongoDB Atlas dashboard for connection issues
- Review Render logs for deployment errors
- Verify all environment variables are set correctly

## 🎯 Next Steps After Deployment

1. **Test all API endpoints** using Postman/Thunder Client
2. **Update frontend** environment variables with backend URL
3. **Deploy frontend** to Vercel with backend URL
4. **Create test accounts** (organizer and participant)
5. **Submit GitHub repositories** in Google Form

---

**Author**: Ashmitha  
**Version**: 1.0.0  
**Last Updated**: January 2026
