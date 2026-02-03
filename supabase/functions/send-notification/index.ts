// Follow this guide on how to implement and deploy:
// https://supabase.com/docs/guides/functions

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FCM_URL = 'https://fcm.googleapis.com/fcm/send';
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY') || '';

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

    if (!FCM_SERVER_KEY) {
      console.error('FCM_SERVER_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'FCM configuration missing' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    console.log('Sending notification to tokens:', tokens.length);
    console.log('Notification:', notification);

    const results = [];
    const errors = [];

    // Send notification to each token via FCM
    for (const token of tokens) {
      try {
        const response = await fetch(FCM_URL, {
          method: 'POST',
          headers: {
            'Authorization': `key=${FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: notification.title,
              body: notification.body,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              click_action: notification.url || '/notifications',
            },
            data: {
              ...notification.data,
              action_url: notification.url || '/notifications',
            },
            priority: 'high',
            webpush: {
              headers: {
                Urgency: 'high',
              },
              notification: {
                title: notification.title,
                body: notification.body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: notification.data?.type || 'general',
                requireInteraction: false,
                vibrate: [200, 100, 200],
                data: {
                  ...notification.data,
                  action_url: notification.url || '/notifications',
                }
              },
              fcm_options: {
                link: notification.url || '/notifications'
              }
            }
          }),
        });

        const result = await response.json();
        
        if (response.ok && result.success === 1) {
          results.push({ token: token.substring(0, 10) + '...', success: true });
        } else {
          errors.push({ 
            token: token.substring(0, 10) + '...', 
            error: result.results?.[0]?.error || 'Unknown error' 
          });
        }
      } catch (error: any) {
        errors.push({ 
          token: token.substring(0, 10) + '...', 
          error: error.message 
        });
      }
    }

    console.log(`Sent ${results.length} notifications successfully`);
    if (errors.length > 0) {
      console.error(`Failed to send ${errors.length} notifications:`, errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: any) {
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
