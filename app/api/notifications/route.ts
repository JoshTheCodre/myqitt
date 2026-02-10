import { NextRequest } from 'next/server'
import { getAuthenticatedUser, jsonSuccess, jsonError } from '@/utils/api-helpers'

// GET /api/notifications
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (action === 'unread') {
    const { data } = await supabase!
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    return jsonSuccess(data || [])
  }

  if (action === 'unread-count') {
    const { count } = await supabase!
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('is_read', false)

    return jsonSuccess(count || 0)
  }

  // Default: all notifications
  const { data } = await supabase!
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return jsonSuccess(data || [])
}

// POST /api/notifications
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedUser()
  if (error) return error

  const body = await request.json()
  const { action } = body

  if (action === 'mark-read') {
    await supabase!
      .from('notifications')
      .update({ is_read: true })
      .eq('id', body.notificationId)
    return jsonSuccess({ marked: true })
  }

  if (action === 'mark-all-read') {
    await supabase!
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user!.id)
      .eq('is_read', false)
    return jsonSuccess({ marked: true })
  }

  if (action === 'register-fcm') {
    const { token } = body
    const { data: existing } = await supabase!
      .from('device_tokens')
      .select('id, is_active')
      .eq('user_id', user!.id)
      .eq('token', token)
      .maybeSingle()

    if (existing) {
      await supabase!
        .from('device_tokens')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase!
        .from('device_tokens')
        .insert({ user_id: user!.id, token, device_type: 'web', is_active: true })
    }

    return jsonSuccess({ registered: true })
  }

  if (action === 'unregister-fcm') {
    await supabase!
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', user!.id)
      .eq('device_type', 'web')
    return jsonSuccess({ unregistered: true })
  }

  return jsonError('Unknown action')
}
