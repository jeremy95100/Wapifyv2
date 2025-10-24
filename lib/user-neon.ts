/**
 * User Neon Project Management
 * Handles creation and retrieval of user Neon projects
 */

import { createClient } from '@supabase/supabase-js'

const NEON_API_KEY = process.env.NEON_API_KEY!
const NEON_ORG_ID = process.env.NEON_ORG_ID!
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Create a Neon project for a user via Neon API
 */
async function createNeonProject(userId: string): Promise<string> {
  const response = await fetch(`${NEON_API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NEON_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      project: {
        name: `wapify-user-${userId}`,
        org_id: NEON_ORG_ID,
        region_id: 'aws-us-east-2'
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Neon project: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.project.id
}

/**
 * Get or create a Neon project ID for a user
 * Stores the project ID in the first project of the user
 */
export async function getUserNeonProjectId(userId: string): Promise<string> {
  if (!userId) {
    throw new Error('userId is required')
  }

  // Get any project from this user to check if they have a Neon project ID
  const { data: projects, error } = await supabase
    .from('projects')
    .select('user_neon_project_id')
    .eq('user_id', userId)
    .not('user_neon_project_id', 'is', null)
    .limit(1)

  if (error) {
    console.error('Error fetching user projects:', error)
    throw new Error('Failed to fetch user projects')
  }

  // If user has a Neon project ID, return it
  if (projects && projects.length > 0 && projects[0].user_neon_project_id) {
    console.log(`User ${userId} already has Neon project: ${projects[0].user_neon_project_id}`)
    return projects[0].user_neon_project_id
  }

  // Create new Neon project for user
  console.log(`Creating new Neon project for user ${userId}...`)
  const neonProjectId = await createNeonProject(userId)
  console.log(`Neon project created: ${neonProjectId}`)

  // Store it in all user's projects
  const { error: updateError } = await supabase
    .from('projects')
    .update({ user_neon_project_id: neonProjectId })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Warning: Failed to store Neon project ID:', updateError)
    // Don't throw - we still have the project ID
  }

  return neonProjectId
}
