# PediaSignal Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. **Prepare Your Repository**
Your repository is already configured with the necessary files:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.example` - Environment variables template
- ✅ `build.sh` - Build script
- ✅ All source code and assets

### 2. **Deploy to Vercel**

#### Option A: GitHub Integration (Recommended)
1. **Push to GitHub**: Make sure your code is pushed to your GitHub repository
2. **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign in
3. **Import Project**: Click "New Project" and import from GitHub
4. **Select Repository**: Choose your PediaSignal repository
5. **Configure Settings**:
   - Framework Preset: **Other**
   - Root Directory: Leave empty (uses root)
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
6. **Add Environment Variables** (see section below)
7. **Deploy**: Click "Deploy"

#### Option B: Manual Deployment
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```
2. **Login to Vercel**:
   ```bash
   vercel login
   ```
3. **Deploy from project root**:
   ```bash
   vercel
   ```
4. **Follow CLI prompts** and configure environment variables

### 3. **Required Environment Variables**

Add these in Vercel Dashboard → Project Settings → Environment Variables:

#### **Database (Required)**
```
DATABASE_URL=postgresql://username:password@hostname:port/database
PGDATABASE=your_database_name
PGHOST=your_host
PGPASSWORD=your_password
PGPORT=5432
PGUSER=your_username
```

#### **AI Integration (Required)**
```
OPENAI_API_KEY=your_openai_api_key_here
```

#### **Security (Required)**
```
SESSION_SECRET=your_secure_session_secret_here
```

#### **Environment**
```
NODE_ENV=production
```

#### **Optional: Authentication**
```
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.vercel.app
```

### 4. **Database Setup**

#### **Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables as `DATABASE_URL`

#### **Option B: Other PostgreSQL Providers**
- **Supabase**: [supabase.com](https://supabase.com)
- **PlanetScale**: [planetscale.com](https://planetscale.com)
- **Railway**: [railway.app](https://railway.app)

### 5. **Run Database Migration**
After deployment, run the database migration:
```bash
# If using Vercel CLI locally
vercel env pull .env.local
npm run db:push

# Or use Vercel's dashboard to run the command
```

### 6. **Custom Domain (Optional)**
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update `REPLIT_DOMAINS` environment variable if using authentication

## 🔧 Troubleshooting

### **Build Failures**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### **Database Connection Issues**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check if database accepts external connections
- Run `npm run db:push` after first deployment

### **API Routes Not Working**
- Ensure `vercel.json` is in root directory
- Check that API routes start with `/api/`
- Verify serverless function limits (30s timeout)

### **Static Assets Not Loading**
- Check `attached_assets` folder is included in build
- Verify asset imports use correct paths
- Ensure build output directory is `dist/public`

## 📊 Performance Optimization

### **Recommended Settings**
- **Node.js Version**: 20.x (latest LTS)
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### **Environment Variables for Performance**
```
NODE_ENV=production
VERCEL_ANALYTICS_ID=your_analytics_id
```

## 🔒 Security Checklist

- ✅ All API keys in environment variables (not code)
- ✅ Database credentials secured
- ✅ Session secret is random and secure
- ✅ CORS configured for your domain
- ✅ Rate limiting enabled
- ✅ HTTPS enforced (automatic with Vercel)

## 🎯 Post-Deployment Steps

1. **Test Core Features**:
   - Landing page loads correctly
   - Waitlist form submission works
   - Admin login functions
   - Database connections work

2. **Update DNS** (if using custom domain):
   - Point domain to Vercel nameservers
   - Verify SSL certificate is active

3. **Monitor Performance**:
   - Check Vercel Analytics
   - Monitor serverless function usage
   - Watch database connection limits

4. **Update Repository**:
   - Add deployment URL to README
   - Update any hardcoded URLs in code
   - Tag release version

## 🔗 Useful Links

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Node.js Functions**: [vercel.com/docs/functions/serverless-functions/runtimes/node-js](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- **Environment Variables**: [vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

Your PediaSignal platform is now ready for professional deployment! 🏥✨