# EduSphere Pro

Role + Permission + Dynamic Workspace + AI Copilot Platform for Educational Institutions

## Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- Zustand (State Management)

**Backend:**
- NestJS
- PostgreSQL
- Prisma ORM
- JWT + Refresh Tokens + HttpOnly Cookies

## Project Structure

```
smart-pro/
├── package.json                 # Root monorepo config
├── apps/
│   ├── backend/                 # NestJS API
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   ├── src/
│   │   │   ├── auth/            # Authentication module
│   │   │   ├── users/           # User management
│   │   │   ├── roles/           # Role management
│   │   │   ├── permissions/     # Permission management
│   │   │   ├── students/        # Student management
│   │   │   ├── teachers/        # Teacher management
│   │   │   ├── classes/         # Class management
│   │   │   ├── attendance/      # Attendance tracking
│   │   │   ├── grades/          # Grade management
│   │   │   ├── homework/        # Homework management
│   │   │   ├── exams/           # Exam management
│   │   │   ├── schedule/        # Schedule management
│   │   │   ├── reports/         # Reports generation
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── documents/       # Document management
│   │   │   ├── school-settings/ # School configuration
│   │   │   ├── ai-copilot/      # AI Copilot
│   │   │   ├── audit/           # Audit logs
│   │   │   ├── health/          # Health records (sensitive)
│   │   │   ├── psychological/   # Psychological notes (sensitive)
│   │   │   ├── discipline/      # Discipline records (sensitive)
│   │   │   └── prisma/          # Prisma service
│   │   └── package.json
│   └── frontend/                # Next.js App
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/       # Login page
│       │   │   ├── dashboard/   # Dynamic dashboard
│       │   │   └── globals.css
│       │   └── lib/
│       │       ├── api.ts       # Axios configuration
│       │       └── store.ts     # Zustand store
│       └── package.json
└── package.json
```

## Key Features

### 1. Permission-Based Access Control
- Menus are permission-based, NOT role-based
- Each module supports: view, create, edit, approve, export
- Permissions are additive across multiple roles
- Example: `attendance.view`, `grade.create`, `student.edit`

### 2. Multi-Role Support
- Users can have multiple roles (Teacher, Class Teacher, Academic Head, etc.)
- Permissions merge automatically
- Single dynamic workspace generated from effective permissions
- No role switching required

### 3. Record-Level Scope
- Teacher: Only own subjects/classes
- Class Teacher: Only assigned class
- Parent: Only own children
- Student: Only own data
- Academic Head: School-wide academic data
- School Admin: School-wide administration data
- All API requests enforce scope

### 4. Sensitive Data Layer
- Separate permission layer for sensitive data
- Requires explicit grant
- Includes: Psychological Notes, Health Records, Discipline Records
- Even Director cannot access automatically

### 5. AI Copilot
- AI is an assistant, NEVER an administrator
- AI NEVER modifies data directly
- AI NEVER executes actions
- AI only generates suggestions
- All actionable outputs become "Staged Actions"
- States: Pending, Approved, Modified, Rejected
- Execution happens ONLY after human approval

### 6. Dynamic Workspace
- Automatically assembles from:
  - Roles
  - Permissions
  - Scope
  - Additional Assignments
- No duplicate menus
- Single workspace for all roles

### 7. Kyrgyzstan School Structure
Supports all school roles:
- Director
- Vice Director
- Academic Head
- School Administrator
- Teacher
- Class Teacher
- Psychologist
- Social Worker
- Librarian
- Accountant
- Medical Staff
- Parent
- Student

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb edusphere_pro
   
   # Copy environment file
   cp apps/backend/.env.example apps/backend/.env
   
   # Update DATABASE_URL in apps/backend/.env
   ```

3. **Run database migrations:**
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   npx prisma db seed  # Optional: seed initial data
   ```

4. **Start development servers:**
   ```bash
   # From root directory
   npm run dev
   
   # Or start separately:
   npm run dev:backend  # Backend on port 3001
   npm run dev:frontend # Frontend on port 3000
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - Login page: http://localhost:3000/login

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/workspace` - Get user workspace

### Core Modules
All modules follow RESTful conventions:
- `GET /api/{module}` - List (with scope filtering)
- `GET /api/{module}/:id` - Get one
- `POST /api/{module}` - Create (if permitted)
- `PUT /api/{module}/:id` - Update (if permitted)
- `DELETE /api/{module}/:id` - Delete (if permitted)

## Permission Model

### Module Actions
Each module supports 5 actions:
1. **view** - Can view records
2. **create** - Can create new records
3. **edit** - Can edit existing records
4. **approve** - Can approve records
5. **export** - Can export data

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

## Workspace Assembly

The workspace is dynamically generated based on user permissions:

```typescript
{
  user: { id, email, firstName, lastName },
  roles: [
    { id, name, nameKy, scope }
  ],
  permissions: [
    "attendance.view",
    "attendance.create",
    "grade.view",
    // ... all effective permissions
  ],
  modules: [
    {
      name: "attendance",
      label: "Attendance",
      actions: ["view", "create", "edit"],
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: false,
      canExport: false
    },
    // ... other modules
  ]
}
```

## Phases

### Phase 1: Single School MVP (Current)
- Complete permission system
- All core modules
- AI Copilot with staged actions
- Dynamic workspace
- Kyrgyzstan school structure

### Phase 2: Multi-School
- Multi-tenancy
- School-level isolation
- Cross-school reporting

### Phase 3: District Level
- District administration
- Cross-school analytics
- District-wide reports

### Phase 4: Ministry Level
- National reporting
- Policy management
- System-wide analytics

## Development

### Backend
```bash
cd apps/backend
npm run start:dev  # Development with hot reload
npm run build      # Production build
npm run lint       # Lint code
npm run test       # Run tests
```

### Frontend
```bash
cd apps/frontend
npm run dev        # Development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Lint code
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/edusphere_pro"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

## License

Proprietary - EduSphere Pro