# Wapify Shared API

Generic multitenant CRUD API that serves **all** Wapify generated apps.

## Architecture

```
App 1 (projectId: proj-abc123) ─┐
App 2 (projectId: proj-xyz789) ─┼─→ Shared API Service ──→ Shared Neon Database
App 3 (projectId: proj-def456) ─┘                           (with project_id isolation)
```

## Features

- **Multitenant:** One API serves unlimited apps
- **Data Isolation:** All queries filtered by `project_id`
- **Generic CRUD:** Works with any table structure
- **Scalable:** Fixed costs regardless of app count
- **Simple:** No per-app deployment needed

## API Routes

All routes follow the pattern: `/api/:projectId/:resource`

### GET all items
```bash
GET /api/proj-abc123/tasks
```

### GET single item
```bash
GET /api/proj-abc123/tasks/550e8400-e29b-41d4-a716-446655440000
```

### POST create item
```bash
POST /api/proj-abc123/tasks
Content-Type: application/json

{
  "title": "Buy milk",
  "completed": false
}
```

### PUT update item
```bash
PUT /api/proj-abc123/tasks/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "completed": true
}
```

### DELETE item
```bash
DELETE /api/proj-abc123/tasks/550e8400-e29b-41d4-a716-446655440000
```

## Database Schema

All tables MUST have a `project_id` column:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,  -- Required for isolation
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
```

## Installation

```bash
cd shared-api
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` to your Neon connection string
3. Ensure database has tables with `project_id` columns

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Deployment to Railway

1. Create new service in Railway
2. Connect to this repository
3. Set environment variables:
   - `DATABASE_URL`: Neon connection string
   - `PORT`: 3001 (or Railway's default)
4. Deploy

## Security

- **Project ID Validation:** UUIDs only
- **SQL Injection:** Uses parameterized queries
- **CORS:** Enabled for all origins (adjust in production)
- **Data Isolation:** Automatic via project_id filtering

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T10:00:00.000Z",
  "service": "wapify-shared-api",
  "version": "1.0.0"
}
```

## Error Handling

### Table not found (42P01)
```json
{
  "error": "Resource 'tasks' not found",
  "hint": "Make sure the table exists in the database"
}
```

### Invalid project ID
```json
{
  "error": "Invalid project ID format"
}
```

### Item not found
```json
{
  "error": "Item not found"
}
```

## Performance

- Connection pooling via `pg.Pool`
- Indexed `project_id` columns for fast filtering
- Single database connection for all apps

## Scaling

This single API can handle:
- 100s of projects
- 1000s of requests per second
- Millions of records (with proper indexing)

Horizontal scaling:
- Deploy multiple instances behind load balancer
- Railway auto-scales based on load
- Stateless design allows easy scaling

## Cost Comparison

| Architecture | Cost (100 apps) |
|--------------|-----------------|
| Per-app services | $500+/month |
| **Shared API** | **$20-50/month** |

**Savings: ~90%**
