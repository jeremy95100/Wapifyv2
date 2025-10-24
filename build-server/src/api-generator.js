/**
 * Backend Express Generator
 * Generates a minimal CRUD API based on database schema
 */

/**
 * Generate Express API files from database schema
 */
export function generateExpressAPI(databaseSchema) {
  const files = []

  // 1. package.json for API
  files.push({
    path: 'api/package.json',
    content: JSON.stringify({
      name: 'wapify-api',
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'node server.js',
        dev: 'node --watch server.js'
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        pg: '^8.11.3'
      }
    }, null, 2)
  })

  // 2. server.js - Main Express server
  const serverCode = generateServerFile(databaseSchema)
  files.push({
    path: 'api/server.js',
    content: serverCode
  })

  // 3. db.js - Database connection
  files.push({
    path: 'api/db.js',
    content: `import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
`
  })

  // 4. Generate route files for each table
  for (const table of databaseSchema.tables) {
    const routeCode = generateRouteFile(table)
    files.push({
      path: `api/routes/${table.name}.js`,
      content: routeCode
    })
  }

  // 5. .env.example
  files.push({
    path: 'api/.env.example',
    content: `DATABASE_URL=your_neon_connection_string_here
PORT=3001
`
  })

  // 6. README.md for API
  files.push({
    path: 'api/README.md',
    content: `# Wapify Generated API

## Installation

\`\`\`bash
cd api
npm install
\`\`\`

## Configuration

Create a \`.env\` file with:
\`\`\`
DATABASE_URL=your_neon_connection_string
PORT=3001
\`\`\`

## Running

\`\`\`bash
npm start
\`\`\`

## API Endpoints

${databaseSchema.tables.map(table => `### ${table.name}
- GET /api/${table.name} - Get all
- GET /api/${table.name}/:id - Get by ID
- POST /api/${table.name} - Create
- PUT /api/${table.name}/:id - Update
- DELETE /api/${table.name}/:id - Delete
`).join('\n')}
`
  })

  return files
}

/**
 * Generate main server file
 */
function generateServerFile(databaseSchema) {
  const routeImports = databaseSchema.tables
    .map(table => `import ${table.name}Routes from './routes/${table.name}.js';`)
    .join('\n')

  const routeUses = databaseSchema.tables
    .map(table => `app.use('/api/${table.name}', ${table.name}Routes);`)
    .join('\n')

  return `import express from 'express';
import cors from 'cors';
${routeImports}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
${routeUses}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`✅ API server running on port \${PORT}\`);
});
`
}

/**
 * Generate route file for a table
 */
function generateRouteFile(table) {
  const tableName = table.name
  const columns = table.columns
  const idColumn = columns.find(col => col.primaryKey) || columns[0]

  // Get insertable columns (not id if it's auto-generated)
  const insertableColumns = columns.filter(col => !col.primaryKey || col.type !== 'uuid')
  const insertColumnNames = insertableColumns.map(col => col.name)

  return `import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all ${tableName}
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "${tableName}" ORDER BY "${idColumn.name}"');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ${tableName}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ${tableName} by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM "${tableName}" WHERE "${idColumn.name}" = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '${tableName} not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ${tableName}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create ${tableName}
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const columns = [${insertColumnNames.map(name => `"${name}"`).join(', ')}];
    const values = [${insertColumnNames.map(name => `data.${name}`).join(', ')}];
    const placeholders = values.map((_, i) => \`$\${i + 1}\`).join(', ');

    const query = \`INSERT INTO "${tableName}" (\${columns.join(', ')}) VALUES (\${placeholders}) RETURNING *\`;
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ${tableName}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update ${tableName}
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const setClause = Object.keys(data)
      .map((key, i) => \`"\${key}" = $\${i + 1}\`)
      .join(', ');

    const values = [...Object.values(data), id];

    const query = \`UPDATE "${tableName}" SET \${setClause} WHERE "${idColumn.name}" = $\${values.length} RETURNING *\`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '${tableName} not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ${tableName}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE ${tableName}
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM "${tableName}" WHERE "${idColumn.name}" = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '${tableName} not found' });
    }

    res.json({ message: '${tableName} deleted successfully' });
  } catch (error) {
    console.error('Error deleting ${tableName}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
`
}
