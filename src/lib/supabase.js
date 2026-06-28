import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

if (import.meta.env.DEV) window.__sb = supabase

export async function ensureUserRow(sessionUser) {
  if (!sessionUser) return
  const meta = sessionUser.user_metadata || {}
  const { error } = await supabase.from('users').upsert(
    {
      id: sessionUser.id,
      kakao_id: meta.kakao_id || sessionUser.id,
      nickname: meta.nickname || '사용자',
    },
    { onConflict: 'id', ignoreDuplicates: false }
  )
  if (error) console.error('ensureUserRow 실패:', error)
}

export async function getBirdsByRegion(region) {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .contains('regions', [region])
    .order('name_ko')

  if (error) throw error
  return data
}

export async function getUserUnlockedBirds(userId) {
  const { data, error } = await supabase
    .from('user_birds')
    .select('bird_id, unlocked_at')
    .eq('user_id', userId)

  if (error) throw error
  return data
}

export async function checkImageHashExists(hash) {
  const { data, error } = await supabase
    .from('uploads')
    .select('id')
    .eq('image_hash', hash)
    .maybeSingle()

  if (error) throw error
  return !!data
}

export async function createUpload({ userId, storageUrl, imageHash, exifTakenAt, aiResult, aiConfidence, status }) {
  const { data, error } = await supabase
    .from('uploads')
    .insert({
      user_id: userId,
      storage_url: storageUrl,
      image_hash: imageHash,
      exif_taken_at: exifTakenAt,
      ai_result: aiResult,
      ai_confidence: aiConfidence,
      status,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unlockBird({ userId, birdId, uploadId }) {
  const { data, error } = await supabase
    .from('user_birds')
    .insert({ user_id: userId, bird_id: birdId, upload_id: uploadId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRanking(limit = 50) {
  const { data, error } = await supabase.rpc('get_ranking', { p_limit: limit })
  if (error) throw error
  return (data || []).map((r) => ({
    user_id: r.user_id,
    nickname: r.nickname,
    count: Number(r.unlocked_count),
  }))
}

export async function uploadBirdImage(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('bird-uploads')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error
  return path
}

export async function getUnlockedBirdsWithData(userId) {
  const { data, error } = await supabase
    .from('user_birds')
    .select('unlocked_at, birds(*)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function cancelUnlock({ userId, birdId }) {
  const { error } = await supabase
    .from('user_birds')
    .delete()
    .eq('user_id', userId)
    .eq('bird_id', birdId)

  if (error) throw error
}

export async function findBirdByName(nameKo) {
  if (!nameKo) return null
  const normalized = nameKo.trim()
  const { data } = await supabase
    .from('birds')
    .select('*')
    .ilike('name_ko', normalized)
    .maybeSingle()

  return data || null
}
