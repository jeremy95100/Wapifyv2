# Configuration Neon Multitenant

## Architecture

**Avant (Per-App):**
```
User Neon Project
├── Branch 1 (App 1)
├── Branch 2 (App 2)
├── Branch 3 (App 3)
└── ...
❌ Limite: 10-50 branches max
```

**Après (Multitenant):**
```
Shared Neon Database
├── projects table (registry)
├── tasks table (project_id column)
├── products table (project_id column)
├── orders table (project_id column)
└── ...
✅ Scalable: Unlimited projects
```

## Setup Instructions

### Step 1: Create Shared Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project named **wapify-shared-db**
3. Copy the connection string

### Step 2: Configure Environment Variables

Add to your Railway build-server:

```bash
# Shared Database (NEW)
SHARED_NEON_PROJECT_ID=your_neon_project_id
SHARED_DATABASE_URL=postgresql://user:password@hostname/database?sslmode=require

# Keep existing for backward compatibility
NEON_API_KEY=your_neon_api_key
```

### Step 3: Initialize Database Schema

Run this SQL on your shared Neon database:

```sql
-- Projects registry table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Example: Tasks table (will be created automatically by generator)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Example: Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  description TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_project_id ON products(project_id);
```

### Step 4: Deploy Shared API to Railway

```bash
cd shared-api
```

1. Create new Railway service: **wapify-shared-api**
2. Connect to GitHub repo (shared-api folder)
3. Set environment variable:
   ```
   DATABASE_URL = <SHARED_DATABASE_URL from Step 2>
   PORT = 3001
   ```
4. Deploy

### Step 5: Update Build Server

The build server will automatically use the shared database if `SHARED_DATABASE_URL` is set.

## How It Works

### Data Isolation

Every table has a `project_id` column:

```sql
-- Project A data
INSERT INTO tasks (project_id, title) VALUES ('proj-abc123', 'Task 1');

-- Project B data
INSERT INTO tasks (project_id, title) VALUES ('proj-xyz789', 'Task 2');

-- Query only Project A data
SELECT * FROM tasks WHERE project_id = 'proj-abc123';
```

### API Routes

Frontend calls include project ID in URL:

```javascript
// App A (project_id = proj-abc123)
const API_URL = 'https://wapify-shared-api.railway.app'
const PROJECT_ID = 'proj-abc123'

fetch(`${API_URL}/api/${PROJECT_ID}/tasks`)
// Returns only tasks with project_id = 'proj-abc123'

// App B (project_id = proj-xyz789)
const PROJECT_ID = 'proj-xyz789'

fetch(`${API_URL}/api/${PROJECT_ID}/tasks`)
// Returns only tasks with project_id = 'proj-xyz789'
```

### Security

- **URL-based isolation:** Project ID in every API call
- **Query-level filtering:** SQL filters by project_id
- **No cross-project data leaks:** Each app only sees its own data

Future improvements:
- Row Level Security (RLS) policies
- API authentication tokens
- Rate limiting per project

## Migration from Old Architecture

If you have existing apps using the old per-branch architecture:

### Option 1: Keep Both (Gradual Migration)

- New apps use shared database
- Old apps keep using branches
- Migrate apps one by one

### Option 2: Full Migration

Use the migration function:

```javascript
import { migrateFromBranchToShared } from './neon-multitenant.js'

await migrateFromBranchToShared(
  oldBranchConnectionString,
  projectId,
  schema
)
```

This copies all data from the old branch to the shared database with `project_id`.

## Testing

1. Generate a new app (e.g., todo list)
2. Check logs:
   ```
   📦 Creating tables in shared database for project proj-abc123...
   ✅ Connected to shared database
   ✅ Tables created: tasks
   ```
3. Verify in Neon Console:
   - Table `tasks` exists
   - Has `project_id` column
   - Index `idx_tasks_project_id` exists
4. Test API:
   ```bash
   curl https://wapify-shared-api.railway.app/api/proj-abc123/tasks
   ```

## Monitoring

### Check Active Projects

```sql
SELECT id, created_at FROM projects ORDER BY created_at DESC;
```

### Check Data per Project

```sql
SELECT
  project_id,
  COUNT(*) as task_count
FROM tasks
GROUP BY project_id
ORDER BY task_count DESC;
```

### Database Size

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Cost Analysis

### Before (Per-Branch)
- 100 apps = 100 branches
- Neon Free: Max 10 branches ❌
- Neon Pro: Max 50 branches ❌
- Need multiple Neon projects = $$$

### After (Multitenant)
- 100 apps = 1 database
- Neon Free: 512MB storage (good for 1000s of records)
- Neon Pro: $19/month (10GB storage)
- **Scales to millions of records** ✅

### Railway API
- Before: 100 services × $5 = $500+/month
- After: 1 service × $20 = $20/month
- **Savings: 96%** 🎉

## Troubleshooting

### Error: "SHARED_DATABASE_URL not configured"
→ Add `SHARED_DATABASE_URL` to Railway environment variables

### Error: "relation 'tasks' does not exist"
→ Run the initialization SQL (Step 3)

### Error: "column 'project_id' does not exist"
→ Schema generator should add it automatically. Check logs.

### Data not isolated between projects
→ Verify API routes include `${PROJECT_ID}` in URL
→ Check SQL queries filter by `project_id`

### Performance issues
→ Verify indexes exist: `CREATE INDEX idx_<table>_project_id ON <table>(project_id);`
→ Monitor query performance in Neon Console

## Next Steps

- [ ] Complete Step 1-5 above
- [ ] Test with sample app generation
- [ ] Verify data isolation
- [ ] Monitor costs
- [ ] Add Row Level Security (optional)
- [ ] Implement API authentication (optional)
