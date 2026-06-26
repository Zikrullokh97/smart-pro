# EduSphere Pro - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb edusphere_pro

# Copy environment file
cp apps/backend/.env.example apps/backend/.env

# Edit apps/backend/.env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/edusphere_pro"
```

### 3. Initialize Database

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Optional: Seed initial data (roles, permissions, admin user)
npx prisma db seed
```

### 4. Start Development

```bash
# From root directory - starts both backend and frontend
npm run dev

# Or start separately:
# Terminal 1 - Backend (port 3001)
npm run dev:backend

# Terminal 2 - Frontend (port 3000)
npm run dev:frontend
```

### 5. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Login: http://localhost:3000/login

## Project Architecture

### Backend (NestJS)

**Key Features:**
- Modular architecture with 20+ modules
- JWT authentication with refresh tokens
- Permission-based authorization
- Record-level scope enforcement
- Sensitive data protection
- Audit logging
- AI Copilot integration

**Module Structure:**
```
apps/backend/src/
├── auth/              # Authentication & authorization
├── users/             # User management
├── roles/             # Role management
├── permissions/       # Permission management
├── students/          # Student CRUD
├── teachers/          # Teacher CRUD
├── classes/           # Class management
├── attendance/        # Attendance tracking
├── grades/            # Grade management
├── homework/          # Homework management
├── exams/             # Exam management
├── schedule/          # Schedule management
├── reports/           # Report generation
├── notifications/     # Notification system
├── documents/         # Document management
├── school-settings/   # School configuration
├── ai-copilot/        # AI assistant
├── audit/             # Audit logs
├── health/            # Health records (sensitive)
├── psychological/     # Psychological notes (sensitive)
├── discipline/        # Discipline records (sensitive)
└── prisma/            # Database service
```

### Frontend (Next.js 14)

**Key Features:**
- App Router architecture
- TypeScript with strict mode
- Tailwind CSS for styling
- TanStack Query for data fetching
- Zustand for state management
- Dynamic workspace assembly
- Permission-based UI rendering

**Page Structure:**
```
apps/frontend/src/
├── app/
│   ├── login/         # Login page
│   ├── dashboard/     # Dynamic dashboard
│   ├── layout.tsx     # Root layout
│   └── globals.css    # Global styles
└── lib/
    ├── api.ts         # Axios configuration
    └── store.ts       # Zustand store
```

## Database Schema

### Core Models

**User Management:**
- `User` - User accounts
- `Role` - System roles (Teacher, Director, etc.)
- `Permission` - Granular permissions (module.action)
- `UserRole` - User-role assignments with scope
- `RolePermission` - Role-permission mappings
- `RefreshToken` - JWT refresh tokens

**Academic:**
- `School` - School information
- `SchoolSettings` - School configuration
- `Class` - Class definitions
- `Subject` - Subject definitions
- `ClassSubject` - Class-subject assignments
- `Student` - Student records
- `StudentParent` - Parent-student relationships
- `TeacherSubject` - Teacher-subject assignments

**Academic Records:**
- `Attendance` - Daily attendance
- `Grade` - Grade records
- `Homework` - Homework assignments
- `Exam` - Exam definitions
- `ExamResult` - Exam results
- `Schedule` - Class schedules

**Sensitive Data:**
- `PsychologicalNote` - Psychologist notes
- `HealthRecord` - Medical records
- `DisciplineRecord` - Discipline incidents

**System:**
- `Notification` - User notifications
- `Document` - Document storage
- `AuditLog` - System audit trail
- `AIAction` - AI-generated suggestions

## Permission System

### Permission Format
```
{module}.{action}
```

### Supported Actions
- `view` - View records
- `create` - Create new records
- `edit` - Edit existing records
- `approve` - Approve records
- `export` - Export data

### Example Permissions
```
attendance.view
attendance.create
attendance.edit
attendance.approve
attendance.export

grade.view
grade.create
grade.edit
grade.approve
grade.export
```

### Multi-Role Permissions
Permissions are **additive** across roles:
- User has Role A with `attendance.view`
- User has Role B with `attendance.create`
- Effective permissions: `attendance.view`, `attendance.create`

## Record-Level Scope

### Scope by Role

**Teacher:**
```json
{
  "classIds": ["class-1", "class-2"],
  "subjectIds": ["subject-1", "subject-2"]
}
```

**Class Teacher:**
```json
{
  "classId": "class-1"
}
```

**Parent:**
```json
{
  "studentIds": ["student-1", "student-2"]
}
```

**Student:**
```json
{
  "studentId": "student-1"
}
```

**Academic Head:**
```json
{
  "schoolId": "school-1",
  "scope": "school-wide"
}
```

**School Admin:**
```json
{
  "schoolId": "school-1",
  "scope": "school-wide"
}
```

## Sensitive Data Protection

### Sensitive Modules
- `psychological` - Psychological notes
- `health` - Health records
- `discipline` - Discipline records

### Access Requirements
1. Base permission (e.g., `psychological.view`)
2. Explicit sensitive data grant (`isSensitive: true`)
3. Additional authorization check in controller

### Example
```typescript
// Permission required
psychological.view (isSensitive: true)

// Controller checks
@RequireSensitivePermission('psychological', 'view')
@Get(':id')
async getPsychologicalNote(@Param('id') id: string) {
  // Additional authorization logic
}
```

## AI Copilot System

### Agent Types
- `director` - Director assistant
- `academic` - Academic assistant
- `teacher` - Teacher assistant
- `class_teacher` - Class teacher assistant
- `parent` - Parent assistant
- `student` - Student tutor

### Staged Actions
All AI outputs are staged for human approval:

**States:**
- `pending` - Awaiting review
- `approved` - Approved for execution
- `modified` - Modified before execution
- `rejected` - Rejected
- `executed` - Successfully executed

### Example AI Action
```typescript
{
  "id": "action-123",
  "agentType": "teacher",
  "actionType": "suggestion",
  "title": "Student needs additional support",
  "description": "Based on attendance patterns...",
  "data": {
    "studentId": "student-123",
    "suggestion": "Schedule parent meeting"
  },
  "priority": "medium",
  "status": "pending"
}
```

## API Authentication

### Login Flow
1. `POST /api/auth/login` with email/password
2. Returns access token + refresh token
3. Access token stored in memory
4. Refresh token stored in HttpOnly cookie

### Token Refresh
1. Access token expires (15 minutes)
2. Frontend calls `POST /api/auth/refresh`
3. Backend validates refresh token
4. Returns new access token
5. Retries original request

### Protected Routes
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

## Development Commands

### Backend
```bash
cd apps/backend

npm run start:dev    # Development with hot reload
npm run build        # Production build
npm run start:prod   # Start production
npm run lint         # Lint code
npm run format       # Format code
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
```

### Frontend
```bash
cd apps/frontend

npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Start production
npm run lint         # Lint code
```

### Root Level
```bash
npm run dev                # Start both backend and frontend
npm run dev:backend        # Start backend only
npm run dev:frontend       # Start frontend only
npm run build              # Build both
npm run install:all        # Install all dependencies
```

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/edusphere_pro"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRATION="7d"

# Application
PORT=3001
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## Troubleshooting

### TypeScript Errors
TypeScript errors are expected before running `npm install`. After installing dependencies, most errors will resolve.

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env
3. Ensure database exists: `createdb edusphere_pro`

### Port Already in Use
```bash
# Change ports in .env files
# Backend: PORT=3002
# Frontend: Next.js will auto-increment
```

### Prisma Issues
```bash
cd apps/backend
npx prisma generate
npx prisma migrate reset  # WARNING: drops all data
```

## Next Steps

1. ✅ Project structure created
2. ✅ Database schema defined
3. ✅ Authentication system implemented
4. ✅ Permission system designed
5. ✅ Frontend foundation built
6. ⏳ Install dependencies: `npm run install:all`
7. ⏳ Run migrations: `npx prisma migrate dev`
8. ⏳ Seed initial data (roles, permissions, admin user)
9. ⏳ Implement module controllers and services
10. ⏳ Build frontend pages for each module
11. ⏳ Add comprehensive testing
12. ⏳ Deploy to production

## Support

For issues or questions:
1. Check README.md for architecture details
2. Review SETUP.md for setup instructions
3. Examine code comments for implementation details
4. Consult NestJS and Next.js documentation

## License

Proprietary - EduSphere Pro