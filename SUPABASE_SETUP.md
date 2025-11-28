# Supabase Connection Status & Dummy Users Setup

## 📡 Connection Status: ✅ CONNECTED

Your MCP is correctly configured to connect to your Supabase cloud project:
- **Project URL**: https://qrnkhsqvngnqsqfkuiuu.supabase.co
- **Project ID**: qrnkhsqvngnqsqfkuiuu
- **Environment**: Cloud (not local)

## ⚠️ Current Status

**Tables**: NOT YET CREATED in your Supabase project

The seed script is ready to run, but you need to create the database schema first.

## 🚀 Setup Instructions

### Option 1: Quick Setup (Recommended)

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/qrnkhsqvngnqsqfkuiuu/sql/new

2. Copy and paste the contents of `supabase/setup.sql` into the SQL Editor

3. Click "Run" to execute the SQL

4. Once complete, run the seed script:
   ```bash
   npm run seed
   ```

### Option 2: Using Supabase CLI (Alternative)

If you have Docker installed, you can set up a local Supabase instance:

```bash
# Install Supabase CLI via brew or download from GitHub
supabase start

# Then run migrations
supabase db push

# Seed data
npm run seed
```

## 📊 What Gets Created

### Tables
- ✅ schools (3 records)
- ✅ users (5 dummy records)
- ✅ courses
- ✅ assignments
- ✅ timetable_items
- ✅ connections
- ✅ catchups

### Dummy Users Created
1. **Dummy User 1** - dummy.user1@test.edu (CSC Level 2)
2. **Dummy User 2** - dummy.user2@test.edu (STAT Level 2)
3. **Dummy User 3** - dummy.user3@test.edu (CSC Level 3)
4. **Dummy User 4** - dummy.user4@test.edu (ENG Level 2)
5. **Dummy User 5** - dummy.user5@test.edu (PHY Level 3)

## 🔐 Row Level Security (RLS)

RLS policies are automatically configured for:
- Users can view all profiles
- Users can update their own profile
- Courses and assignments are viewable by everyone
- Connections visible only to involved users

## ✅ Verification

After setup, verify everything works:

```bash
npm run seed
```

You should see:
```
🌱 Starting database seeding...
📡 Checking Supabase connection...
✓ Connection successful to Supabase
🏫 Initializing schools...
  ✓ Schools initialized
👥 Inserting dummy users...
  ✓ Created: Dummy User 1 (dummy.user1@test.edu)
  ✓ Created: Dummy User 2 (dummy.user2@test.edu)
  ...
✨ Seeding completed successfully!
📊 Database Summary:
   Total users: 5
```

## 📝 Notes

- Your MCP is already connected to the cloud project ✅
- Tables need to be created via SQL Editor (one-time setup)
- Seed script will upsert data (safe to run multiple times)
- Use `.env.local` for credentials (already configured)
