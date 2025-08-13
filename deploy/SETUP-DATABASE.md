# 🗄️ Database Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: **https://supabase.com/dashboard/project/wlmljniorublcadvorvf/sql**
2. Click **"New Query"**

### Step 2: Execute Database Setup
1. Copy the entire content from `deploy/database-setup.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** button
4. Wait for completion (should take ~30 seconds)

### Step 3: Verify Setup
You should see:
- ✅ 6 tables created (customers, consultants, visits, interactions, ai_analysis_log, ai_predictions)
- ✅ RLS policies enabled
- ✅ Indexes created for performance
- ✅ Sample data inserted
- ✅ "Database setup completed successfully!" message

## Alternative: Manual Setup

If you prefer to run each section separately:

### 1. Initial Schema
```sql
-- Copy and run STEP 1 from database-setup.sql
```

### 2. Interactions & AI Tables  
```sql
-- Copy and run STEP 2 from database-setup.sql
```

### 3. Performance Indexes
```sql
-- Copy and run STEP 3 from database-setup.sql
```

### 4. Continue with remaining steps...

## Verification

After setup, run this query to verify:
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected result: 6 tables with RLS enabled.

## Next Steps

Once database is set up:
1. Frontend is already running at http://localhost:3000
2. Test the complete system
3. Deploy Edge Functions for AI analysis

## Troubleshooting

**If you get permission errors:**
- Make sure you're using the correct project URL
- Verify you have admin access to the Supabase project

**If tables already exist:**
- The script uses `IF NOT EXISTS` so it's safe to run multiple times
- Add `DROP TABLE [tablename] CASCADE;` before CREATE TABLE if you need to reset

**Need help?**
- Check Supabase logs in the Dashboard
- Verify environment variables are correct