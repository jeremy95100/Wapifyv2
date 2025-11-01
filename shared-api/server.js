/**
 * Wapify Shared Multitenant API
 *
 * This is a generic CRUD API that serves ALL Wapify generated apps.
 * Data isolation is achieved through project_id filtering on all queries.
 *
 * Architecture:
 * - 1 API service for unlimited apps
 * - 1 Neon database with project_id isolation
 * - Routes: /api/:projectId/:resource
 */

import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
const app = express()
const PORT = process.env.PORT || 3001

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err)
    process.exit(1)
  }
  console.log('✅ Database connected:', res.rows[0].now)
})

// Middleware
app.use(cors())
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'wapify-shared-api',
    version: '1.0.0'
  })
})

// Middleware to validate project_id
async function validateProject(req, res, next) {
  const { projectId } = req.params

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  req.projectId = projectId
  next()
}

/**
 * Generic CRUD Routes
 * Pattern: /api/:projectId/:resource
 */

// GET all items from a resource
app.get('/api/:projectId/:resource', validateProject, async (req, res) => {
  const { projectId, resource } = req.params

  try {
    // Query with project_id filter
    const result = await pool.query(
      `SELECT * FROM ${resource} WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(`Error fetching ${resource}:`, error)

    // Check if table doesn't exist
    if (error.code === '42P01') {
      return res.status(404).json({
        error: `Resource '${resource}' not found`,
        hint: 'Make sure the table exists in the database'
      })
    }

    res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    })
  }
})

// GET single item by ID
app.get('/api/:projectId/:resource/:id', validateProject, async (req, res) => {
  const { projectId, resource, id } = req.params

  try {
    const result = await pool.query(
      `SELECT * FROM ${resource} WHERE project_id = $1 AND id = $2`,
      [projectId, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(`Error fetching ${resource}/${id}:`, error)
    res.status(500).json({
      error: 'Failed to fetch item',
      message: error.message
    })
  }
})

// POST create new item
app.post('/api/:projectId/:resource', validateProject, async (req, res) => {
  const { projectId, resource } = req.params
  const data = req.body

  try {
    // Add project_id to data
    data.project_id = projectId

    // Build INSERT query dynamically
    const columns = Object.keys(data)
    const values = Object.values(data)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

    const query = `
      INSERT INTO ${resource} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `

    const result = await pool.query(query, values)

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(`Error creating ${resource}:`, error)
    res.status(500).json({
      error: 'Failed to create item',
      message: error.message
    })
  }
})

// PUT update item
app.put('/api/:projectId/:resource/:id', validateProject, async (req, res) => {
  const { projectId, resource, id } = req.params
  const data = req.body

  try {
    // Remove id and project_id from update data
    delete data.id
    delete data.project_id

    // Build UPDATE query dynamically
    const columns = Object.keys(data)
    const values = Object.values(data)
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ')

    const query = `
      UPDATE ${resource}
      SET ${setClause}
      WHERE project_id = $${values.length + 1} AND id = $${values.length + 2}
      RETURNING *
    `

    const result = await pool.query(query, [...values, projectId, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(`Error updating ${resource}/${id}:`, error)
    res.status(500).json({
      error: 'Failed to update item',
      message: error.message
    })
  }
})

// DELETE item
app.delete('/api/:projectId/:resource/:id', validateProject, async (req, res) => {
  const { projectId, resource, id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM ${resource} WHERE project_id = $1 AND id = $2 RETURNING *`,
      [projectId, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json({ success: true, deleted: result.rows[0] })
  } catch (error) {
    console.error(`Error deleting ${resource}/${id}:`, error)
    res.status(500).json({
      error: 'Failed to delete item',
      message: error.message
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    hint: 'Use format: /api/:projectId/:resource'
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Wapify Shared API listening on port ${PORT}`)
  console.log(`📦 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`📚 API format: /api/:projectId/:resource`)
})
