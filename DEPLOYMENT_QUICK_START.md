# EduSphere Pro - Quick Start Deployment

## ⚡ 5-Minute Quick Start

This is the fastest way to get EduSphere Pro deployed to production.

---

## 🎯 Prerequisites

- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Neon account (https://neon.tech) for PostgreSQL

---

## 🚀 Step 1: Database (2 minutes)

### Neon PostgreSQL

1. Go to https://neon.tech and sign up with GitHub
2. Click "New Project"
3. Name: `edusphere-pro`
4. Region: Select closest to you
5. Click "Create Project"
6. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/edusphere-pro?sslmode=require`)
7. **Save this** - you'll need it for backend configuration

---

## ⚙️ Step 2: Backend (Render) (2 minutes)

1. Go to https://render.com and sign up with GitHub
2. Click "New" → "Web Service"
3. Connect repository: `Zikrullokh97/smart-pro`
4. Configure:
   ```
   Name: edusphere-pro-api
   Root Directory: apps/backend
   Build Command: npm ci && npx prisma generate && npm run build
   Start Command: npm run start:prod
   ```
5. Click "Advanced" → Add Environment Variables:
   ```env
   DATABASE_URL=<your-neon-connection-string>
   JWT_SECRET=<generate-32-char-random-string>
   JWT_REFRESH_SECRET=<generate-32-char-random-string>
   JWT_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Click "Create Web Service"
7. **Wait 5-10 minutes** for build
8. Copy your backend URL: `https://edusphere-pro-api.onrender.com`

### Generate JWT Secrets

Use this command to generate secure secrets:
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🎨 Step 3: Frontend (Vercel) (1 minute)

1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New" → "Project"
3. Import: `Zikrullokh97/smart-pro`
4. Configure:
   ```
   Framework: Next.js
   Root Directory: apps/frontend
   Build Command: npm run build
   ```
5. Add Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://edusphere-pro-api.onrender.com/api
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
6. Click "Deploy"
7. **Wait 2-3 minutes**
8. Copy your frontend URL: `https://your-app.vercel.app`

---

## 🔄 Step 4: Update CORS (30 seconds)

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment" tab
4. Update:
   ```env
   CORS_ORIGIN=https://your-actual-app.vercel.app
   FRONTEND_URL=https://your-actual-app.vercel.app
   ```
5. Click "Save Changes"
6. Click "Manual Deploy" → "Deploy latest commit"

---

## 🗄️ Step 5: Run Migrations (30 seconds)

1. In Render dashboard, go to your backend service
2. Click "Shell" tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```
4. You should see: "Applying migration..."
5. Close shell

---

## ✅ Step 6: Verify (30 seconds)

### Test Backend Health
```bash
curl https://edusphere-pro-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "EduSphere Pro API",
  "version": "1.0.0",
  "database": "connected"
}
```

### Test Frontend
Visit: `https://your-app.vercel.app`

You should see the login page.

---

## 🎉 Done!

Your EduSphere Pro is now live in production!

**Backend:** https://edusphere-pro-api.onrender.com
**Frontend:** https://your-app.vercel.app
**API Docs:** https://edusphere-pro-api.onrender.com/api/docs

---

## 📝 Next Steps

### 1. Test Login
- Visit your frontend URL
- Click "Register"
- Create a test account
- Login and explore the dashboard

### 2. Configure CI/CD (Optional but Recommended)

Add GitHub Secrets for automatic deployment:

1. **Render API Key:**
   - Render Dashboard → Settings → API Keys → Create
   
2. **Render Service ID:**
   - Render Dashboard → Your Service → Settings → Copy Service ID

3. **Vercel Token:**
   - Vercel Dashboard → Settings → Tokens → Create

4. **Vercel Project ID:**
   ```bash
   cd apps/frontend
   vercel link
   cat .vercel/project.json
   ```

5. **Add to GitHub Secrets:**
   - GitHub Repo → Settings → Secrets → Actions
   - Add all secrets from above

Now every push to `main` will auto-deploy!

### 3. Security Hardening (Recommended)

```bash
# Add rate limiting
npm install @nestjs/throttler

# Add security headers
npm install helmet
npm install @types/helmet
```

### 4. Monitoring (Recommended)

- Enable Render metrics
- Enable Vercel Analytics
- Set up uptime monitoring (UptimeRobot)

---

## 🆘 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Ensure JWT_SECRET is set

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS_ORIGIN matches frontend URL exactly
- Ensure backend is running (check health endpoint)

### Database connection fails
- Verify DATABASE_URL format
- Check database allows remote connections
- Ensure SSL is enabled (add `?sslmode=require`)

### Health check fails
- Wait 30 seconds after deployment
- Check Render logs
- Verify database migrations ran

---

## 📚 Full Documentation

For detailed instructions, see:
- **Complete Guide:** `DEPLOYMENT_PRODUCTION_GUIDE.md`
- **Deployment Report:** `DEPLOYMENT_REPORT.md`
- **Setup Guide:** `SETUP.md`

---

## 🎯 Success Checklist

- [ ] Database created (Neon/Supabase)
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Health endpoint returns HTTP 200
- [ ] Frontend loads successfully
- [ ] Login/Registration works
- [ ] Database migrations applied
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] HTTPS enabled (automatic)

---

**Estimated Time:** 5-10 minutes
**Difficulty:** Easy
**Cost:** $0 (all free tiers)

🚀 **Happy Deploying!**