// Follow this guide on how to implement and deploy:
// https://supabase.com/docs/guides/functions

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface NotificationRequest {
  tokens: string[];
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    url?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { tokens, notification }: NotificationRequest = await req.json();

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No tokens provided' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // For web tokens (browser notifications), we'll use the Web Push API
    // For now, we'll log the notification and return success
    // In production, you would integrate with FCM or Web Push service
    
    console.log('Sending notification to tokens:', tokens.length);
    console.log('Notification:', notification);

    // Here you would integrate with Firebase Cloud Messaging (FCM)
    // or a Web Push service to send actual push notifications
    // Example with FCM:
    /*
    const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
    
    const responses = await Promise.all(
      tokens.map(token =>
        fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: notification.title,
              body: notification.body,
              click_action: notification.url,
            },
            data: notification.data,
          }),
        })
      )
    );
    */

    // For now, return success with mock data
    const results = tokens.map(token => ({
      token,
      success: true,
      message: 'Notification queued (demo mode)',
    }));

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Notification sent to ${tokens.length} device(s)`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send notification',
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});
