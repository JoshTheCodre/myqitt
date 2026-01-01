import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import admin from 'firebase-admin'

// Force Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.error('Firebase admin initialization error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Notification API called')
    const { userId, title, body, data } = await request.json()
    console.log('📧 Request data:', { userId, title, body })

    // Validate input
    if (!userId || !title || !body) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      )
    }

    // Get all FCM tokens for the user
    console.log('🔍 Fetching tokens for user:', userId)
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('fcm_token, device_type')
      .eq('user_id', userId)

    console.log('📱 Tokens found:', tokens?.length || 0)
    if (tokensError) {
      console.error('❌ Error fetching tokens:', tokensError)
      return NextResponse.json(
        { error: 'Failed to fetch user tokens' },
        { status: 500 }
      )
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'No FCM tokens found for this user' },
        { status: 404 }
      )
    }

    // Prepare notification payload
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
    }

    // Send notifications to all user's devices
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        try {
          return await admin.messaging().send({
            ...message,
            token: token.fcm_token,
          })
        } catch (error: any) {
          console.error(`Error sending to token ${token.fcm_token}:`, error)
          
          // If token is invalid, remove it from database
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            await supabase
              .from('notification_tokens')
              .delete()
              .eq('fcm_token', token.fcm_token)
          }
          
          throw error
        }
      })
    )

    // Count successful and failed sends
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failedCount = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      totalTokens: tokens.length,
      message: `Notification sent to ${successCount} device(s)`,
    })
  } catch (error: any) {
    console.error('❌ Send notification error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    )
  }
}
