import { supabase } from './supabase'

function publicAvatarUrl(path) {
  if (!path || path.startsWith('http')) return path
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Debes iniciar sesión.')
  return data.user.id
}

export async function getProfileByHandle(handle) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, bio, avatar_path, avatar_emoji, avatar_color, created_at')
    .eq('handle', handle)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    handle: data.handle,
    displayName: data.display_name,
    bio: data.bio,
    avatarPath: publicAvatarUrl(data.avatar_path),
    avatarEmoji: data.avatar_emoji,
    avatarColor: data.avatar_color,
    createdAt: data.created_at,
  }
}

function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(source)
      const size = Math.min(512, image.naturalWidth, image.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight)
      const offsetX = (image.naturalWidth - cropSize) / 2
      const offsetY = (image.naturalHeight - cropSize) / 2
      context.drawImage(image, offsetX, offsetY, cropSize, cropSize, 0, 0, size, size)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('No se pudo preparar la imagen.'))
          return
        }
        resolve(blob)
      }, 'image/webp', 0.82)
    }
    image.onerror = () => {
      URL.revokeObjectURL(source)
      reject(new Error('No se pudo leer la imagen.'))
    }
    image.src = source
  })
}

export async function updateProfileAppearance({ file = null, emoji = null, color = null, keepImage = false }) {
  const userId = await getUserId()
  const { data: current, error: currentError } = await supabase.from('profiles').select('avatar_path').eq('id', userId).single()
  if (currentError) throw currentError

  let avatarPath = keepImage ? current.avatar_path : null
  if (file) {
    const compressed = await compressAvatar(file)
    avatarPath = `${userId}/${crypto.randomUUID()}.webp`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(avatarPath, compressed, {
      cacheControl: '31536000',
      contentType: 'image/webp',
      upsert: false,
    })
    if (uploadError) throw uploadError
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_path: avatarPath, avatar_emoji: emoji || null, avatar_color: color || null })
    .eq('id', userId)
    .select('avatar_path, avatar_emoji, avatar_color')
    .single()
  if (error) throw error

  if (current.avatar_path && !current.avatar_path.startsWith('http') && current.avatar_path !== avatarPath) {
    await supabase.storage.from('avatars').remove([current.avatar_path])
  }

  return {
    avatarPath: publicAvatarUrl(data.avatar_path),
    avatarEmoji: data.avatar_emoji,
    avatarColor: data.avatar_color,
  }
}
