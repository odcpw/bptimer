/**
 * BPtimer SMA Push Notification Worker
 * Handles subscription management and scheduled notifications
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://odcpw.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/subscribe' && request.method === 'POST') {
        return await handleSubscribe(request, env, corsHeaders);
      }
      
      if (url.pathname === '/unsubscribe' && request.method === 'POST') {
        return await handleUnsubscribe(request, env, corsHeaders);
      }
      
      if (url.pathname === '/schedule' && request.method === 'POST') {
        return await handleScheduleUpdate(request, env, corsHeaders);
      }
      
      if (url.pathname === '/health') {
        return new Response('OK', { headers: corsHeaders });
      }
      
      return new Response('Not found', { 
        status: 404, 
        headers: corsHeaders 
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal server error', { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },

  // Scheduled trigger for sending notifications
  async scheduled(event, env, ctx) {
    console.log('Scheduled event triggered at:', new Date().toISOString());
    await sendScheduledNotifications(env);
  }
};

/**
 * Handle push subscription registration
 */
async function handleSubscribe(request, env, corsHeaders) {
  const body = await request.json();
  const { subscription, userId, timezone } = body;
  
  if (!subscription || !userId) {
    return new Response('Missing subscription or userId', { 
      status: 400, 
      headers: corsHeaders 
    });
  }
  
  // Store subscription in KV
  const subscriptionData = {
    subscription,
    userId,
    timezone: timezone || 'UTC',
    createdAt: new Date().toISOString()
  };
  
  await env.SMA_SUBSCRIPTIONS.put(
    `sub:${userId}`, 
    JSON.stringify(subscriptionData)
  );
  
  console.log('Subscription saved for user:', userId);
  
  return new Response('Subscription saved', { 
    status: 200, 
    headers: corsHeaders 
  });
}

/**
 * Handle unsubscribe
 */
async function handleUnsubscribe(request, env, corsHeaders) {
  const body = await request.json();
  const { userId } = body;
  
  if (!userId) {
    return new Response('Missing userId', { 
      status: 400, 
      headers: corsHeaders 
    });
  }
  
  // Remove subscription and schedules
  await env.SMA_SUBSCRIPTIONS.delete(`sub:${userId}`);
  await env.SMA_SCHEDULES.delete(`schedule:${userId}`);
  
  console.log('Unsubscribed user:', userId);
  
  return new Response('Unsubscribed', { 
    status: 200, 
    headers: corsHeaders 
  });
}

/**
 * Handle schedule updates from app
 */
async function handleScheduleUpdate(request, env, corsHeaders) {
  const body = await request.json();
  const { userId, schedules } = body;
  
  if (!userId || !Array.isArray(schedules)) {
    return new Response('Missing userId or schedules', { 
      status: 400, 
      headers: corsHeaders 
    });
  }
  
  // Store schedules
  const scheduleData = {
    userId,
    schedules,
    updatedAt: new Date().toISOString()
  };
  
  await env.SMA_SCHEDULES.put(
    `schedule:${userId}`, 
    JSON.stringify(scheduleData)
  );
  
  console.log('Schedule updated for user:', userId, 'with', schedules.length, 'SMAs');
  
  return new Response('Schedule updated', { 
    status: 200, 
    headers: corsHeaders 
  });
}

/**
 * Send scheduled notifications (runs every 15 minutes)
 * Uses user's local timezone and respects 7am-9pm daily window
 */
async function sendScheduledNotifications(env) {
  const now = new Date();
  const currentMinute = now.getUTCMinutes();
  
  // Only check on quarter hours to reduce load
  if (currentMinute % 15 !== 0) return;
  
  console.log('Checking for notifications at:', now.toISOString());
  
  // Get all schedules
  const schedulesList = await env.SMA_SCHEDULES.list();
  let notificationCount = 0;
  
  for (const { name: key } of schedulesList.keys) {
    try {
      const scheduleData = JSON.parse(await env.SMA_SCHEDULES.get(key));
      const subscriptionData = JSON.parse(await env.SMA_SUBSCRIPTIONS.get(`sub:${scheduleData.userId}`));
      
      if (!subscriptionData) {
        console.log('No subscription found for user:', scheduleData.userId);
        continue;
      }
      
      // Check if any SMAs should trigger now (using user's local timezone)
      for (const schedule of scheduleData.schedules) {
        if (shouldSendNotification(schedule, subscriptionData.timezone || 'UTC', now)) {
          try {
            await sendPushNotification(
              subscriptionData.subscription, 
              schedule.name,
              env
            );
            notificationCount++;
            
            // Update last sent time
            schedule.lastSent = now.toISOString();
            await env.SMA_SCHEDULES.put(key, JSON.stringify(scheduleData));
            
          } catch (pushError) {
            console.error('Failed to send notification:', pushError);
          }
        }
      }
    } catch (error) {
      console.error('Error processing schedule:', error);
    }
  }
  
  console.log('Sent', notificationCount, 'notifications');
}

/**
 * Check if notification should be sent
 * Respects 7am-9pm local time window for daily notifications
 */
function shouldSendNotification(schedule, userTimezone, now) {
  const { frequency, times = [], lastSent } = schedule;
  
  // Don't send if already sent in last hour
  if (lastSent) {
    const lastSentTime = new Date(lastSent);
    const timeDiff = now - lastSentTime;
    if (timeDiff < 60 * 60 * 1000) return false; // 1 hour
  }
  
  // Convert current UTC time to user's local time
  const localTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
  const localHour = localTime.getHours();
  const localMinute = localTime.getMinutes();
  
  // Enforce 7am-9pm window for daily/multiple notifications
  if ((frequency === 'daily' || frequency === 'multiple') && (localHour < 7 || localHour >= 21)) {
    return false;
  }
  
  // Check if current time matches any scheduled times
  const currentTime = `${localHour.toString().padStart(2, '0')}:${localMinute.toString().padStart(2, '0')}`;
  
  // For quarter-hour checks, match if within 15 minutes of scheduled time
  const isTimeMatch = times.some(scheduledTime => {
    const [schedHour, schedMinute] = scheduledTime.split(':').map(Number);
    return schedHour === localHour && Math.abs(schedMinute - localMinute) < 15;
  });
  
  if (!isTimeMatch) return false;
  
  // Check frequency rules
  switch (frequency) {
    case 'daily':
    case 'multiple':
      return true; // Already checked time match and window above
    case 'weekly':
      return localTime.getDay() === (schedule.dayOfWeek || 1); // Default Monday, using local day
    case 'monthly':
      return localTime.getDate() === 1; // First of month, using local date
    default:
      return false;
  }
}

/**
 * Convert URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Create VAPID JWT token for push authentication
 */
async function createVapidJWT(audience, publicKey, privateKey) {
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };
  
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: 'mailto:mail@odc.pw'
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  // Import private key for signing
  const keyData = urlBase64ToUint8Array(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  );
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256'
    },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  // Convert signature to base64url
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${unsignedToken}.${signatureBase64}`;
}

/**
 * Send push notification using Web Push Protocol with VAPID authentication
 */
async function sendPushNotification(subscription, activityName, env) {
  const payload = JSON.stringify({
    title: "Mindfulness Reminder",
    body: activityName, // Just the SMA name, as requested
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "sma-reminder",
    data: {
      type: 'sma',
      timestamp: Date.now()
    }
  });
  
  try {
    // Extract audience (origin) from push endpoint
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
    
    // Create VAPID JWT token
    const vapidJWT = await createVapidJWT(
      audience,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    
    // Prepare headers with VAPID authentication
    const headers = {
      'Content-Type': 'application/json',
      'TTL': '86400', // 24 hours
      'Authorization': `vapid t=${vapidJWT}, k=${env.VAPID_PUBLIC_KEY}`
    };
    
    // Send push notification with VAPID authentication
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: headers,
      body: payload
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Push failed: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    console.log('Push notification sent for:', activityName, 'to', audience);
    
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}