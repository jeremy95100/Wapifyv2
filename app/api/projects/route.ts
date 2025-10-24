import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { uploadProjectFiles, ProjectFile } from '../../../lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Récupérer tous les projets d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des projets' },
        { status: 500 }
      )
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau projet (supporte single-file HTML ou multi-file React)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, prompt, code, files, framework, hasDatabase, databaseSchema } = body

    // Validation
    if (!userId || !name || !prompt) {
      return NextResponse.json(
        { error: 'userId, name et prompt sont requis' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // Déterminer si c'est un projet multi-fichiers
    const isMultiFile = files && Array.isArray(files) && files.length > 0

    // Vérifier si l'utilisateur existe dans la table users, sinon le créer
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    console.log('📊 Check user exists:', { userId, existingUser, userCheckError })

    if (!existingUser) {
      console.log('⚠️ User not found in users table, attempting to create...')

      // L'utilisateur n'existe pas, on le crée (cas où l'utilisateur vient de Google OAuth par exemple)
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

        console.log('🔍 Auth user fetch result:', { authData, authError })

        if (authError) {
          console.error('❌ Error fetching auth user:', authError)
        }

        if (authData?.user) {
          console.log('✅ Auth user found, creating user record...')
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert([
              {
                id: userId,
                email: authData.user.email,
                name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
                credits: 100,
                plan: 'starter',
              },
            ])
            .select()
            .single()

          console.log('📝 User creation result:', { newUser, insertError })

          if (insertError) {
            console.error('❌ Error creating user:', insertError)
          }
        } else {
          console.error('❌ No auth user found for ID:', userId)
        }
      } catch (err) {
        console.error('❌ Exception while creating user:', err)
      }
    } else {
      console.log('✅ User already exists in users table')
    }

    // Préparer les données du projet
    const projectData: any = {
      user_id: userId,
      name,
      prompt,
      description: prompt.substring(0, 200),
      status: (code || files) ? 'ready' : 'generating',
      code: isMultiFile ? null : (code || null), // Pour multi-file, code est null
      framework: framework || (isMultiFile ? 'react' : 'html'),
      has_database: hasDatabase || false,
    }

    // Créer le projet d'abord
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du projet' },
        { status: 500 }
      )
    }

    console.log(`✅ Project created: ${project.id}`)

    // Si c'est un projet multi-fichiers, gérer Storage et Neon
    if (isMultiFile) {
      try {
        // 1. Upload files to Supabase Storage
        console.log(`📤 Uploading ${files.length} files to Storage...`)
        const uploadResult = await uploadProjectFiles(userId, project.id, files)

        if (!uploadResult.success) {
          console.error('❌ Failed to upload files:', uploadResult.error)
          // On ne bloque pas, mais on log l'erreur
        } else {
          console.log(`✅ Files uploaded successfully`)

          // Mettre à jour le storage_path dans le projet
          const storagePath = `${userId}/${project.id}`
          await supabaseAdmin
            .from('projects')
            .update({ storage_path: storagePath })
            .eq('id', project.id)

          // Insérer les fichiers dans la table project_files
          const fileRecords = files.map(file => ({
            project_id: project.id,
            file_path: file.path,
            file_type: file.type || null,
            storage_path: `${storagePath}/${file.path}`,
            size_bytes: file.content.length
          }))

          const { error: filesError } = await supabaseAdmin
            .from('project_files')
            .insert(fileRecords)

          if (filesError) {
            console.error('❌ Failed to insert file records:', filesError)
          } else {
            console.log(`✅ Inserted ${fileRecords.length} file records into DB`)
          }
        }

        // Note: Database creation is now handled by Railway worker
        // when generation completes, not here during project creation

        // Récupérer le projet mis à jour
        const { data: updatedProject } = await supabaseAdmin
          .from('projects')
          .select('*')
          .eq('id', project.id)
          .single()

        return NextResponse.json({ project: updatedProject || project }, { status: 201 })
      } catch (storageError) {
        console.error('Error handling multi-file project:', storageError)
        // On retourne quand même le projet créé
        return NextResponse.json({ project }, { status: 201 })
      }
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un projet (sauvegarder le code)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, code, status, deployedUrl, files, dbBranchId, dbConnectionString, databaseSchema, githubRepo, githubRepoFullName, githubCloneUrl } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId est requis' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // Récupérer le projet pour savoir s'il est multi-fichiers
    const { data: existingProject } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    // Si c'est un projet multi-fichiers et qu'on a des fichiers à mettre à jour
    if (files && Array.isArray(files) && existingProject?.framework === 'react' && existingProject?.storage_path) {
      console.log('📤 Mise à jour de', files.length, 'fichiers dans Storage...')

      // Mettre à jour les fichiers dans Supabase Storage
      const { uploadProjectFiles } = await import('../../../lib/storage')
      const userId = existingProject.user_id

      await uploadProjectFiles(userId, projectId, files)
      console.log('✅ Fichiers mis à jour dans Storage')
    }

    // Préparer les données à mettre à jour dans la DB
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (code !== undefined) updateData.code = code
    if (status !== undefined) updateData.status = status
    if (deployedUrl !== undefined) updateData.deployed_url = deployedUrl
    if (dbBranchId !== undefined) updateData.db_branch_id = dbBranchId
    if (dbConnectionString !== undefined) updateData.db_connection_string = dbConnectionString
    if (databaseSchema !== undefined) updateData.database_schema = databaseSchema
    if (githubRepo !== undefined) updateData.github_repo_url = githubRepo
    if (githubRepoFullName !== undefined) updateData.github_repo_full_name = githubRepoFullName
    if (githubCloneUrl !== undefined) updateData.github_clone_url = githubCloneUrl

    // Mettre à jour le projet
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du projet' },
        { status: 500 }
      )
    }

    console.log('✅ Projet mis à jour:', projectId)
    return NextResponse.json({ project })
  } catch (error) {
    console.error('PATCH /api/projects error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
