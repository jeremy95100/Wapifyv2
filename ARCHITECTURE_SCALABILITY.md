# Architecture Scalability Analysis - Wapify

**Date:** 2025-10-25
**Status:** Architecture review needed before production deployment

---

## 🎯 Context

Wapify generates full-stack React apps with Express APIs and Neon databases. Current implementation creates:
- 1 Railway service per generated app
- 1 Neon branch per generated app
- 1 GitHub repo per generated app

**Question raised:** "C'est scalable tout ça?"

---

## ⚠️ Current Architecture Issues

### Problem 1: One Railway Service Per App ❌

```
App 1 → Railway Service 1
App 2 → Railway Service 2
App 3 → Railway Service 3
...
App 1000 → Railway Service 1000 ❌ NOT SCALABLE!
```

**Cost Analysis:**
- Railway Hobby: $5/month for 500h compute
- Each service consumes hours even when idle
- 100 apps = 100 services = exponential costs
- Railway Pro: Usage-based pricing, can get very expensive

**Example:**
- 50 apps × 24h/day × 30 days = 36,000 hours/month
- Railway Hobby limit: 500 hours/month
- Result: Need Pro plan, ~$200-500/month 💸

### Problem 2: One Neon Branch Per App ⚠️

```
User → Neon Project → Branch 1, Branch 2... Branch 1000
```

**Limits:**
- Neon Free: 10 branches max
- Neon Pro: 50 branches max
- Not scalable for 1000s of apps

### Problem 3: Schema Heterogeneity

Each app can have completely different schema:
- App 1: `tasks`, `users`
- App 2: `products`, `orders`, `customers`
- App 3: `posts`, `comments`, `categories`

Makes centralization complex.

---

## ✅ Scalable Architecture Options

### Option 1: Multitenant Backend (Recommended)

**Architecture:**
```
All Apps → 1 Railway API Service (shared)
              ↓
          1 Neon Database (multitenant)
```

**Database Structure:**
```sql
-- Global projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  schema_version TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Example: Tasks table with project_id isolation
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Example: Products table with project_id isolation
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  stock INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- Row Level Security (RLS) for isolation
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_isolation ON tasks
  USING (project_id = current_setting('app.current_project_id')::uuid);
```

**API Backend (Single Shared Service):**
```javascript
// All routes filter by projectId
app.get('/api/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params

  // Verify projectId exists
  const project = await db.query(
    'SELECT id FROM projects WHERE id = $1',
    [projectId]
  )

  if (!project.rows.length) {
    return res.status(404).json({ error: 'Project not found' })
  }

  // Set RLS context
  await db.query('SET app.current_project_id = $1', [projectId])

  // Fetch data (automatically filtered by RLS)
  const tasks = await db.query('SELECT * FROM tasks')

  res.json(tasks.rows)
})

app.post('/api/:projectId/tasks', async (req, res) => {
  const { projectId } = req.params
  const { title, description } = req.body

  await db.query('SET app.current_project_id = $1', [projectId])

  const result = await db.query(
    'INSERT INTO tasks (project_id, title, description) VALUES ($1, $2, $3) RETURNING *',
    [projectId, title, description]
  )

  res.json(result.rows[0])
})
```

**Frontend Code (Generated):**
```typescript
// Injected at build time
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID // e.g., "proj-k9jsun"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// All API calls include projectId
const fetchTasks = async () => {
  const response = await fetch(`${API_URL}/api/${PROJECT_ID}/tasks`)
  return response.json()
}

const createTask = async (task) => {
  const response = await fetch(`${API_URL}/api/${PROJECT_ID}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  })
  return response.json()
}
```

**Deployment Workflow:**
1. Generate React code + Express API code
2. Create tables in SHARED Neon database (with project_id)
3. Deploy code to GitHub
4. Inject `VITE_PROJECT_ID` and `VITE_API_URL` into frontend
5. Frontend calls shared API with projectId in URL

**Pros:**
- ✅ Fixed costs: 1 Railway service (~$5-20/month)
- ✅ 1 Neon database (~$0-19/month)
- ✅ Scalable to millions of apps
- ✅ Easy monitoring (single service)
- ✅ Centralized logging and analytics
- ✅ Row Level Security (RLS) for data isolation
- ✅ **Total: ~$25/month for UNLIMITED apps**

**Cons:**
- ⚠️ Requires schema migration strategy
- ⚠️ All apps must share same base schema (tasks, products, etc.)
- ⚠️ More complex initial setup
- ⚠️ Need to handle schema versioning

**Cost Comparison:**
- Current (100 apps): $5 + (100 × $5) = $500+/month 💸
- Multitenant (100 apps): $25/month 🎉
- **Savings: ~95%**

---

### Option 2: Serverless Functions (Most Scalable)

**Architecture:**
```
App 1 → Vercel Edge Function
App 2 → Vercel Edge Function
App 3 → Vercel Edge Function
           ↓
    1 Neon Database (multitenant)
```

**API as Serverless Functions:**
```typescript
// api/[projectId]/tasks/route.ts (Vercel Edge Function)
import { neon } from '@neondatabase/serverless'

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const sql = neon(process.env.DATABASE_URL)

  const tasks = await sql`
    SELECT * FROM tasks
    WHERE project_id = ${params.projectId}
  `

  return Response.json(tasks)
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const sql = neon(process.env.DATABASE_URL)
  const { title, description } = await request.json()

  const [task] = await sql`
    INSERT INTO tasks (project_id, title, description)
    VALUES (${params.projectId}, ${title}, ${description})
    RETURNING *
  `

  return Response.json(task)
}
```

**Deployment:**
- Generate API routes as Vercel Edge Functions
- Deploy to Vercel alongside frontend
- No separate backend server needed

**Pros:**
- ✅ Pay-per-execution (minimal costs when idle)
- ✅ Infinite auto-scaling
- ✅ No servers to manage
- ✅ Vercel Free: 100k requests/month
- ✅ Global edge network (ultra-fast)
- ✅ **Cheapest option for low-traffic apps**

**Cons:**
- ⚠️ Cold starts (~100-500ms first request)
- ⚠️ Execution limits (10s Vercel Free, 60s Pro)
- ⚠️ Not ideal for long-running operations
- ⚠️ Requires Vercel deployment (not just Blob storage)

**Cost Estimation:**
- Vercel Free: 100k requests/month × unlimited apps = $0
- Vercel Pro: $20/month + usage = ~$20-50/month
- **Near-zero marginal cost per app**

---

### Option 3: Hybrid - Current + Optimizations

Keep current architecture but optimize:

**Optimizations:**
1. **Railway Sleep on Idle**
   - Configure services to sleep after 5 min idle
   - Wake on request (adds ~2s latency)
   - Reduces compute hours by 90%+

2. **Shared Railway Service for Low-Traffic Apps**
   - Apps with <100 requests/day → Shared service
   - High-traffic apps → Dedicated service
   - Smart routing based on projectId

3. **Neon Branch Consolidation**
   - Use 1 Neon database with project_id
   - Eliminate branch-per-app limit

**Pros:**
- ✅ Minimal code changes
- ✅ Gradual migration path
- ✅ Keep isolation for high-traffic apps

**Cons:**
- ⚠️ Still not truly scalable
- ⚠️ Complex routing logic
- ⚠️ Higher costs than Options 1-2

---

## 🎯 Recommended Solution

### **Option 1: Multitenant Backend** (Best balance)

**Why:**
1. Professional architecture (used by SaaS companies)
2. Predictable costs (~$25/month total)
3. Scalable to millions of apps
4. Single codebase to maintain
5. Easy analytics and monitoring

**Implementation Plan:**

### Phase 1: Schema Generator Updates
- [ ] Modify schema generator to add `project_id UUID` to all tables
- [ ] Add `REFERENCES projects(id) ON DELETE CASCADE`
- [ ] Generate Row Level Security policies
- [ ] Add projects table to all schemas

### Phase 2: Shared API Service
- [ ] Create single Railway service: `wapify-shared-api`
- [ ] Routes: `/api/:projectId/:resource`
- [ ] Middleware for project validation
- [ ] RLS context setting
- [ ] Error handling for missing projects

### Phase 3: Database Migration
- [ ] Create single Neon database: `wapify-shared-db`
- [ ] Run migrations for all table types (tasks, products, posts, etc.)
- [ ] Set up connection pooling (Neon + Prisma)
- [ ] Configure RLS policies

### Phase 4: Frontend Generation
- [ ] Inject `VITE_PROJECT_ID` during build
- [ ] Update API calls to include projectId
- [ ] Example: `fetch(\`\${API_URL}/api/\${PROJECT_ID}/tasks\`)`

### Phase 5: Deployment Workflow
- [ ] Remove Railway service creation per app
- [ ] Keep GitHub deployment
- [ ] Deploy to Vercel Blob with env vars
- [ ] Point all apps to shared API URL

### Phase 6: Migration of Existing Apps
- [ ] Script to migrate existing Neon branches to shared DB
- [ ] Add project_id to existing data
- [ ] Update .env files with new API URL
- [ ] Gradual rollout

---

## 📊 Cost Comparison Summary

| Architecture | Monthly Cost (100 apps) | Scalability | Complexity |
|--------------|-------------------------|-------------|------------|
| **Current (1 service/app)** | $500+ 💸 | Low ❌ | Low ✅ |
| **Multitenant Backend** | $25 🎉 | High ✅ | Medium ⚠️ |
| **Serverless Functions** | $20-50 ✨ | Infinite ✅ | Medium ⚠️ |
| **Hybrid Optimized** | $100-200 | Medium ⚠️ | High ❌ |

---

## 🚀 Next Steps

**Decision Required:**
- [ ] Choose architecture (Recommended: **Option 1 - Multitenant**)
- [ ] Plan migration timeline
- [ ] Implement Phase 1 (Schema Generator)
- [ ] Create shared Railway service
- [ ] Test with new app generation
- [ ] Migrate existing apps (if any)

**Timeline Estimate:**
- Phase 1-2: 1-2 days (schema + API service)
- Phase 3: 1 day (database setup)
- Phase 4: 0.5 day (frontend updates)
- Phase 5: 0.5 day (deployment workflow)
- Phase 6: Ongoing (migration as needed)

**Total: ~3-4 days for full implementation**

---

## 📝 Current Status (2025-10-25)

**Implemented:**
- ✅ Railway integration (creates 1 service per app)
- ✅ Neon database (creates 1 branch per app)
- ✅ GitHub deployment
- ✅ API URL injection into frontend

**Configuration:**
```bash
RAILWAY_TOKEN=8ad6d87e-787f-4aff-b4ea-82986bc2c4ce
RAILWAY_PROJECT_ID=3453d181-e479-4a39-91cc-3971ec5b69fa (wapify-app)
```

**Pending:**
- ⚠️ Spread operator fix needs testing
- ⚠️ Architecture migration to multitenant
- ⚠️ Cost optimization

**Recommendation:**
**DO NOT deploy to production with current architecture.** Migrate to multitenant first to avoid high costs.

---

## 🔗 Related Files

- [RAILWAY_SETUP.md](RAILWAY_SETUP.md) - Railway configuration guide
- [build-server/src/railway.js](build-server/src/railway.js) - Railway API integration
- [build-server/src/generator.js](build-server/src/generator.js) - Main generation workflow
- [build-server/src/neon.js](build-server/src/neon.js) - Neon database management
- [lib/react-generator.ts](lib/react-generator.ts) - React code generation prompts

---

## 💡 Questions to Answer Tomorrow

1. **Schema Flexibility:** How to handle apps with very different schemas in shared DB?
   - Option A: Create all possible tables upfront
   - Option B: Dynamic table creation (risky)
   - Option C: JSON columns for flexible data

2. **API Service Code:** Generate API or use generic CRUD?
   - Option A: Generate route files per project (complex)
   - Option B: Generic CRUD API (simple, less flexible)
   - Option C: Hybrid (generic + custom endpoints)

3. **Migration Strategy:** Existing apps using current architecture?
   - Keep both architectures running?
   - Force migration?
   - Gradual transition?

4. **Authentication:** Who can access which projects?
   - Add user_id to projects table
   - JWT tokens with project permissions
   - API keys per project

---

**Session ended:** 2025-10-25
**Resume tomorrow with:** Architecture implementation decision + Phase 1 coding

---

*Generated with Claude Code*
*Co-Authored-By: Claude <noreply@anthropic.com>*
