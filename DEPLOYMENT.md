# Deployment Guide for Yojak - The Smart Scheduler

## 🚀 Vercel Deployment Fix

### Issues Fixed:
1. **500 API Errors** - Fixed database connection and environment variables
2. **WebSocket Errors** - Disabled Socket.IO in development, configured for production
3. **Database Connection** - Switched from SQLite to PostgreSQL for production
4. **Environment Variables** - Added proper error handling for missing variables

### Required Environment Variables on Vercel:

1. **DATABASE_URL** - PostgreSQL connection string
   ```
   postgresql://username:password@host:port/database
   ```

2. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
   ```
   https://your-project.supabase.co
   ```

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anon key

4. **NEXT_PUBLIC_DISABLE_SOCKETIO** - Set to "true" to disable Socket.IO (optional)

### Steps to Deploy:

1. **Set up PostgreSQL Database:**
   - Use Vercel Postgres, Supabase, or any PostgreSQL provider
   - Get the connection string

2. **Configure Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add all required environment variables
   - Make sure DATABASE_URL is set correctly

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Fix deployment issues"
   git push origin main
   ```

4. **Run Database Migrations:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Local Development:

1. **Create .env.local file:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/yojak_db"
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
   NEXT_PUBLIC_DISABLE_SOCKETIO="true"
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

### Key Changes Made:

- ✅ Fixed database provider (SQLite → PostgreSQL)
- ✅ Added environment variable validation
- ✅ Disabled Socket.IO in development
- ✅ Added proper error handling
- ✅ Created Vercel configuration
- ✅ Fixed admin role assignment

### Testing:

1. **Local:** Should work without errors
2. **Production:** All API routes should return data instead of 500 errors
3. **Admin Panel:** Should load data correctly
4. **User Roles:** Should persist after refresh

### Troubleshooting:

- **500 Errors:** Check DATABASE_URL is set correctly
- **Socket.IO Errors:** These are expected in development, disabled by default
- **Admin Issues:** Check user roles are properly assigned
- **Data Not Loading:** Verify database connection and run migrations
