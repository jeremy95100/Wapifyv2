import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    })

    if (authError) {
      console.error('Signup error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    // Créer l'utilisateur dans la table users avec le client admin
    // pour bypasser les RLS policies
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured')
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          name: name || email.split('@')[0],
          credits: 100, // Crédits de départ
          plan: 'starter',
        },
      ])

    if (dbError) {
      console.error('Database error:', dbError)
      // Si l'utilisateur existe déjà dans la table (code 23505), c'est OK
      // Cela peut arriver si l'utilisateur a été créé dans auth.users mais pas dans public.users
      if (dbError.code !== '23505') { // 23505 = duplicate key
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil utilisateur' },
          { status: 500 }
        )
      }
      // Si duplicate key, on continue quand même (l'utilisateur existe déjà)
      console.log('User already exists in public.users table, continuing...')
    }

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name || email.split('@')[0],
        },
        message: 'Compte créé avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
