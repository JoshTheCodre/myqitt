import { supabase } from '@/lib/supabase/client'

/**
 * Check if the current user is connected to another user
 */
export async function checkConnection(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (error) {
      console.error('Error checking connection:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Failed to check connection:', error)
    return false
  }
}

/**
 * Connect the current user to another user
 */
export async function connectToUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already connected
    const isConnected = await checkConnection(currentUserId, targetUserId)
    if (isConnected) {
      return { success: false, error: 'Already connected to this user' }
    }

    // Create connection
    const { error: connectionError } = await supabase
      .from('connections')
      .insert({
        follower_id: currentUserId,
        following_id: targetUserId
      })

    if (connectionError) {
      console.error('Error creating connection:', connectionError)
      return { success: false, error: 'Failed to connect' }
    }

    // Increment followers count for target user
    const { error: updateError } = await supabase.rpc('increment_followers_count', {
      user_id: targetUserId
    })

    if (updateError) {
      console.error('Error updating followers count:', updateError)
      // Connection was created, so still return success
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to connect to user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Disconnect the current user from another user
 */
export async function disconnectFromUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete connection
    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)

    if (deleteError) {
      console.error('Error deleting connection:', deleteError)
      return { success: false, error: 'Failed to disconnect' }
    }

    // Decrement followers count for target user
    const { error: updateError } = await supabase.rpc('decrement_followers_count', {
      user_id: targetUserId
    })

    if (updateError) {
      console.error('Error updating followers count:', updateError)
      // Connection was deleted, so still return success
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to disconnect from user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all users connected to the current user (following)
 */
export async function getConnectedUsers(currentUserId: string) {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('following_id')
      .eq('follower_id', currentUserId)

    if (error) {
      console.error('Error fetching connected users:', error)
      return []
    }

    return data?.map(c => c.following_id) || []
  } catch (error) {
    console.error('Failed to fetch connected users:', error)
    return []
  }
}

/**
 * Get all users who are connected to the current user (followers)
 */
export async function getFollowers(currentUserId: string) {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('follower_id')
      .eq('following_id', currentUserId)

    if (error) {
      console.error('Error fetching followers:', error)
      return []
    }

    return data?.map(c => c.follower_id) || []
  } catch (error) {
    console.error('Failed to fetch followers:', error)
    return []
  }
}
