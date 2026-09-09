import { supabase } from './supabase'

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

export async function signUp({ email, password, handle, displayName }) {
  if (!HANDLE_RE.test(handle)) throw new Error('Handle must be 3-20 lowercase letters, numbers or underscores.')
  if (password.length < 6) throw new Error('Password must be at least 6 characters.')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { handle, display_name: displayName },
    },
  })
  if (error) throw error
  if (!data.user) throw new Error('Could not create the account.')
  if (!data.session) throw new Error('Account created. Confirm your email before signing in.')

  return mapUser(data.user)
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Could not sign in.')
  return mapUser(data.user)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function mapUser(user) {
  return {
    userId: user.id,
    handle: user.user_metadata?.handle || '',
    displayName: user.user_metadata?.display_name || '',
  }
}
