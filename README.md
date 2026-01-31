# Meeting Scheduler Backend API

A Node.js REST API for managing meeting schedules with secure authentication and role-based access control. This backend powers a meeting scheduling system where organizers can create and manage meetings, while participants can view their assigned schedules.

## What This Project Does

This backend service provides a complete API for:
- **User Authentication**: Secure registration and login using JWT tokens (access and refresh tokens)
- **Meeting Management**: Create, read, update, and delete meetings with start/end times
- **Conflict Detection**: Automatically checks for scheduling conflicts when creating or updating meetings
- **Participant Management**: Assign users to meetings and manage participant lists
- **Role-Based Access**: Two user roles - ORGANIZER (can manage meetings) and PARTICIPANT (can view assigned meetings)
- **Data Validation**: All inputs are validated before processing to ensure data integrity

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas (cloud-hosted)
- **Authentication**: JWT (jsonwebtoken) with bcrypt password hashing
- **Validation**: Joi schema validation
- **Language**: TypeScript
- **Security**: CORS, express-rate-limit

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and environment configuration
│   ├── controllers/     # HTTP request handlers
│   ├── middlewares/     # Authentication, authorization, and validation
│   ├── models/          # MongoDB data models (User, Meeting)
│   ├── routes/          # API endpoint definitions
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions (JWT utilities)
│   ├── validators/      # Request validation schemas
│   └── index.ts         # Application entry point
└── package.json
```

## Environment Configuration

Create a `.env` file with these variables:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=your_frontend_url
ALLOWED_ORIGINS=your_frontend_url
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and receive JWT tokens
- `POST /api/auth/refresh` - Get new access token using refresh token
- `POST /api/auth/logout` - Invalidate refresh token

### Meetings
- `POST /api/meetings` - Create a new meeting (ORGANIZER only)
- `GET /api/meetings` - Get all meetings (role-based filtering)
- `GET /api/meetings/:id` - Get specific meeting details
- `PUT /api/meetings/:id` - Update meeting (ORGANIZER only)
- `DELETE /api/meetings/:id` - Delete meeting (ORGANIZER only)
- `PUT /api/meetings/:id/cancel` - Cancel meeting (ORGANIZER only)
- `POST /api/meetings/:id/participants` - Add participant (ORGANIZER only)
- `DELETE /api/meetings/:id/participants/:userId` - Remove participant (ORGANIZER only)

### Users
- `GET /api/users` - Get all users (for participant selection)
- `GET /api/users/me` - Get current user profile

### Health
- `GET /api/health` - Check server and database status

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Create `.env` file with required variables

3. **Development mode**:
   ```bash
   npm run dev
   ```

4. **Production build**:
   ```bash
   npm run build
   npm start
   ```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT-based authentication with token refresh mechanism
- CORS protection with configurable origins
- Rate limiting on API endpoints
- Input validation on all requests
- Role-based access control middleware

## Related Repositories

- **Frontend**: [Meeting-Scheduling-Management-System-Frontend](https://github.com/ashmitha2304/Meeting-Scheduling-Management-System-Frontend)
- **Complete Project**: [Meeting-Scheduling-Management-System](https://github.com/ashmitha2304/Meeting-Scheduling-Management-System)
