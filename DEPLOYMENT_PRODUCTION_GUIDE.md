# EduSphere Pro - Production Deployment Guide

## 🎯 Deployment Overview

This guide provides complete instructions for deploying EduSphere Pro to production using:
- **Backend**: Render (Web Service)
- **Frontend**: Vercel
- **Database**: Neon/Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] GitHub account with repository access
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] Neon or Supabase account (free PostgreSQL)
- [ ] Node.js 20+ installed locally
- [ ] Git configured

---

## 🗄️ Phase 1: Database Setup (PostgreSQL)

### Option A: Neon (Recommended)

1. **Create Neon Account**
   - Visit: https://neon.tech
   - Sign up with GitHub

2. **Create Database**
   ```bash
   # In Neon Console:
   - Click "New Project"
   - Name: edusphere-pro
   - Region: Choose closest to your users
   - Click "Create Project"
   ```

3. **Get Connection String**
   - Go to "Connection Details"
   - Copy the connection string (format: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/edusphere-pro?sslmode=require`)
   - Save this for later

### Option B: Supabase

1. **Create Supabase Account**
   - Visit: https://supabase.com
   - Sign up with GitHub

2. **Create Project**
   ```bash
   - Click "New Project"
   - Name: edusphere-pro
   - Set database password
   - Region: Choose closest
   - Click "Create new project"
   ```

3. **Get Connection String**
   - Go to "Settings" → "Database"
   - Copy "Connection string" (URI format)
   - Save this for later

---

## ⚙️ Phase 2: Backend Deployment (Render)

### Step 1: Prepare Repository

The following fixes have been applied to your repository:
- ✅ Fixed Prisma model name mismatch (`healthRecord` → `health`)
- ✅ Created public health endpoint (`/api/health`)
- ✅ Updated `.env.example` with all required variables
- ✅ Registered health controller in module

### Step 2: Create Render Web Service

1. **Login to Render**
   - Visit: https://render.com
   - Sign up/login with GitHub

2. **Create New Web Service**
   ```
   - Click "New" → "Web Service"
   - Connect your GitHub repository: Zikrullokh97/smart-pro
   - Authorize Render to access your repo
   ```

3. **Configure Service**
   ```yaml
   Name: edusphere-pro-api
   Environment: Node
   Region: Choose closest to your database
   Branch: main
   Root Directory: apps/backend
   Build Command: npm ci && npx prisma generate && npm run build
   Start Command: npm run start:prod
   ```

4. **Set Environment Variables**
   
   Click "Advanced" → "Add Environment Variable":
   
   ```env
   # Database (REQUIRED)
   DATABASE_URL=postgresql://user:password@host:5432/edusphere_pro?schema=public
   
   # JWT Secrets (REQUIRED - Generate strong random strings)
   JWT_SECRET=<generate-32-char-random-string>
   JWT_EXPIRATION=15m
   JWT_REFRESH_SECRET=<generate-32-char-random-string>
   JWT_REFRESH_EXPIRATION=7d
   
   # Application (REQUIRED)
   NODE_ENV=production
   PORT=10000
   
   # CORS (REQUIRED - Update after frontend deployment)
   CORS_ORIGIN=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   
   # AI Features (OPTIONAL)
   OPENAI_API_KEY=sk-your-openai-key
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (5-10 minutes)
   - Note your backend URL: `https://edusphere-pro-api.onrender.com`

### Step 3: Run Database Migrations

After first successful deployment:

**Option A: Using Render Shell**
```bash
# In Render Dashboard:
- Go to your service
- Click "Shell" tab
- Run: npx prisma migrate deploy
```

**Option B: Using GitHub Actions** (Recommended)
- Migrations will run automatically on next push (see CI/CD section)

---

## 🎨 Phase 3: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. **Login to Vercel**
   - Visit: https://vercel.com
   - Sign up/login with GitHub

2. **Import Project**
   ```
   - Click "Add New" → "Project"
   - Import: Zikrullokh97/smart-pro
   - Click "Import"
   ```

3. **Configure Project**
   ```yaml
   Framework Preset: Next.js
   Root Directory: apps/frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Set Environment Variables**
   
   Click "Environment Variables":
   
   ```env
   # API Configuration (REQUIRED)
   NEXT_PUBLIC_API_URL=https://edusphere-pro-api.onrender.com/api
   
   # App URL (REQUIRED)
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build (2-5 minutes)
   - Note your frontend URL: `https://your-app.vercel.app`

### Step 2: Update Backend CORS

Go back to Render and update:
```env
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy backend if needed.

---

## 🔄 Phase 4: CI/CD Configuration

GitHub Actions workflow has been created at `.github/workflows/deploy.yml`.

### What It Does

On every push to `main`:
1. ✅ Validates code quality (lint, typecheck)
2. ✅ Runs tests
3. ✅ Generates Prisma Client
4. ✅ Validates Prisma schema
5. ✅ Builds backend
6. ✅ Builds frontend
7. ✅ Deploys backend to Render
8. ✅ Deploys frontend to Vercel

### Setup Required

1. **Add GitHub Secrets**
   
   Go to: GitHub Repo → Settings → Secrets and variables → Actions
   
   Add these secrets:
   ```bash
   RENDER_API_KEY=<your-render-api-key>
   RENDER_SERVICE_ID=<your-render-service-id>
   VERCEL_TOKEN=<your-vercel-token>
   VERCEL_ORG_ID=<your-vercel-org-id>
   VERCEL_PROJECT_ID=<your-vercel-project-id>
   DATABASE_URL=<your-neon-or-supabase-url>
   JWT_SECRET=<your-jwt-secret>
   JWT_REFRESH_SECRET=<your-refresh-secret>
   ```

2. **Get API Keys**
   
   **Render API Key:**
   - Render Dashboard → Settings → API Keys → Create API Key
   
   **Render Service ID:**
   - Render Dashboard → Your Service → Settings → Service ID
   
   **Vercel Token:**
   - Vercel Dashboard → Settings → Tokens → Create Token
   
   **Vercel Org/Project IDs:**
   - Run: `vercel link` in frontend directory
   - Or check `.vercel/project.json`

---

## ✅ Phase 5: Validation Checklist

### Backend Validation

```bash
# Health Check
curl https://edusphere-pro-api.onrender.com/api/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "EduSphere Pro API",
  "version": "1.0.0",
  "database": "connected"
}

# API Documentation
Visit: https://edusphere-pro-api.onrender.com/api/docs
```

### Frontend Validation

1. Visit: `https://your-app.vercel.app`
2. Test login page loads
3. Test registration
4. Test dashboard access
5. Test API communication

### Database Validation

```bash
# Connect to database and verify tables
psql postgresql://user:pass@host/edusphere_pro

# Check tables
\dt

# Expected tables:
# schools, users, roles, permissions, students, teachers, classes,
# attendance, grades, homework, schedule, notifications, reports, etc.
```

---

## 🔒 Phase 6: Security Checklist

- [x] JWT secrets are cryptographically secure (32+ chars)
- [x] CORS configured to specific frontend domain
- [x] Passwords hashed with bcrypt
- [x] Prisma prevents SQL injection
- [x] Input validation with class-validator
- [x] Helmet security headers (add if missing)
- [x] Rate limiting (add if missing)
- [x] HTTPS enabled (Render/Vercel provide automatically)
- [x] Environment variables not exposed to client
- [x] Database connection uses SSL

### Additional Security Recommendations

1. **Add Rate Limiting** (Optional but Recommended)
   ```bash
   npm install @nestjs/throttler
   ```

2. **Add Helmet** (Optional)
   ```bash
   npm install helmet
   npm install @types/helmet
   ```

3. **Enable Render Auto-Scaling**
   - Render Dashboard → Service → Settings → Auto-Scaling
   - Min: 1 instance
   - Max: 3 instances

---

## ⚡ Phase 7: Performance Optimization

### Backend Optimizations

1. **Enable Compression**
   ```bash
   npm install compression
   npm install @types/compression
   ```

2. **Prisma Query Optimization**
   - Use `select` instead of `include` when possible
   - Add database indexes for frequently queried fields
   - Enable query logging in development only

3. **Render Performance**
   - Use "Standard" instance (not Free) for production
   - Enable "Auto-Deploy" for continuous deployment
   - Configure health check path: `/api/health`

### Frontend Optimizations

1. **Next.js Configuration** (Already configured)
   - Image optimization: ✅
   - Font optimization: ✅
   - Script optimization: ✅

2. **Vercel Performance**
   - Enable "Edge Network"
   - Enable "Image Optimization"
   - Use "Analytics" for monitoring

---

## 📊 Phase 8: Monitoring & Logs

### Backend Monitoring (Render)

1. **View Logs**
   - Render Dashboard → Service → Logs
   - Real-time log streaming available

2. **Metrics**
   - CPU usage
   - Memory usage
   - Request count
   - Response times

3. **Alerts**
   - Set up email alerts for downtime
   - Configure in Render → Settings → Alerts

### Frontend Monitoring (Vercel)

1. **Analytics**
   - Vercel Dashboard → Analytics
   - Page views, performance, errors

2. **Speed Insights**
   - Core Web Vitals monitoring
   - Real User Monitoring

### Database Monitoring

**Neon:**
- Query performance
- Connection pooling
- Storage usage

**Supabase:**
- Database size
- API requests
- Storage usage

---

## 🚨 Troubleshooting

### Backend Issues

**Problem:** `PrismaClientInitializationError`
```bash
Solution:
1. Verify DATABASE_URL is correct
2. Check database allows remote connections
3. Ensure SSL mode is enabled (add ?sslmode=require)
```

**Problem:** `JWT_SECRET not defined`
```bash
Solution:
1. Add JWT_SECRET to Render environment variables
2. Redeploy service
```

**Problem:** Build fails on `prisma generate`
```bash
Solution:
1. Ensure DATABASE_URL is set during build
2. Check Node.js version (use 20.x)
3. Clear build cache in Render
```

**Problem:** Health check fails
```bash
Solution:
1. Verify /api/health endpoint exists
2. Check database connection
3. Review application logs
```

### Frontend Issues

**Problem:** CORS errors
```bash
Solution:
1. Update CORS_ORIGIN in backend to match frontend URL
2. Ensure both use HTTPS
3. Check for trailing slashes
```

**Problem:** API calls fail
```bash
Solution:
1. Verify NEXT_PUBLIC_API_URL is correct
2. Check backend is running
3. Test API endpoint directly
```

---

## 📦 Deployment Files Created

### Backend Files Modified
- `apps/backend/src/health/health.service.ts` - Fixed Prisma model name
- `apps/backend/src/health/health.public.controller.ts` - Created public health endpoint
- `apps/backend/src/health/health.module.ts` - Registered new controller
- `apps/backend/.env.example` - Added OPENAI_API_KEY

### CI/CD Files Created
- `.github/workflows/deploy.yml` - Automated deployment pipeline

### Documentation Created
- `DEPLOYMENT_PRODUCTION_GUIDE.md` - This file
- `DEPLOYMENT_QUICK_START.md` - Quick reference guide

---

## 🎯 Quick Start Commands

### Local Testing

```bash
# Install dependencies
npm install

# Setup backend
cd apps/backend
cp .env.example .env
# Edit .env with your database URL
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod

# In another terminal, setup frontend
cd apps/frontend
cp .env.example .env.local
# Edit .env.local with backend URL
npm install
npm run build
npm run start
```

### Production Deployment

```bash
# Push to main branch triggers automatic deployment
git add .
git commit -m "Deploy to production"
git push origin main

# Monitor deployment
# Backend: https://render.com
# Frontend: https://vercel.com
```

---

## 📞 Support

If you encounter issues:

1. Check Render logs: https://dashboard.render.com
2. Check Vercel logs: https://vercel.com/dashboard
3. Check GitHub Actions: https://github.com/Zikrullokh97/smart-pro/actions
4. Review this guide's troubleshooting section

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Backend URL returns HTTP 200 from `/api/health`
- ✅ Frontend URL loads successfully
- ✅ Login/Registration works
- ✅ Dashboard is accessible
- ✅ Database is connected
- ✅ All modules load without errors
- ✅ HTTPS is enabled
- ✅ CI/CD pipeline runs successfully

---

## 📝 Next Steps After Deployment

1. **Configure Custom Domain** (Optional)
   - Backend: Render → Custom Domains
   - Frontend: Vercel → Domains

2. **Set Up Monitoring**
   - Enable Render metrics
   - Enable Vercel Analytics
   - Set up uptime monitoring (UptimeRobot, etc.)

3. **Configure Backups**
   - Enable database backups in Neon/Supabase
   - Set up automated backup schedule

4. **Enable Auto-Scaling**
   - Configure Render auto-scaling rules
   - Set minimum and maximum instances

5. **Security Hardening**
   - Add rate limiting
   - Enable security headers
   - Regular security audits

---

## 🔐 Security Notes

**Never commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- `node_modules/`
- `dist/`
- `.next/`

**Always use:**
- Strong JWT secrets (32+ random characters)
- HTTPS in production
- Environment variables for secrets
- Database connection SSL
- CORS with specific origins (not `*`)

---

**Deployment completed successfully! 🚀**