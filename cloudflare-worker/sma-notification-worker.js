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
      
      if (url.pathname === '/debug' && request.method === 'GET') {
        return await handleDebug(request, env, corsHeaders);
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
 * Handle debug requests - shows stored data
 */
async function handleDebug(request, env, corsHeaders) {
  try {
    const now = new Date();
    const schedulesList = await env.SMA_SCHEDULES.list();
    const subscriptionsList = await env.SMA_SUBSCRIPTIONS.list();
    
    const debug = {
      currentTime: now.toISOString(),
      currentUTCMinute: now.getUTCMinutes(),
      isQuarterHour: now.getUTCMinutes() % 15 === 0,
      schedules: [],
      subscriptions: subscriptionsList.keys.length
    };
    
    // Get all schedule data
    for (const { name: key } of schedulesList.keys) {
      try {
        const scheduleData = JSON.parse(await env.SMA_SCHEDULES.get(key));
        debug.schedules.push({
          key,
          userId: scheduleData.userId,
          scheduleCount: scheduleData.schedules?.length || 0,
          schedules: scheduleData.schedules?.map(s => ({
            name: s.name,
            frequency: s.frequency,
            timesPerDay: s.timesPerDay,
            reminderWindows: s.reminderWindows,
            times: s.times,
            lastSent: s.lastSent
          }))
        });
      } catch (e) {
        debug.schedules.push({ key, error: e.message });
      }
    }
    
    return new Response(JSON.stringify(debug, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(`Debug error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
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
            await sendPushNotification(subscriptionData.subscription, schedule.smaId, env);
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
  
  // Enforce 6am-10pm window for daily/multiple notifications (16-hour wake time)
  if ((frequency === 'daily' || frequency === 'multiple') && (localHour < 6 || localHour >= 22)) {
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
 * Convert Uint8Array to base64url string
 */
function uint8ArrayToBase64Url(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Parse PEM (-----BEGIN PRIVATE KEY-----) to DER bytes
 */
function pemToDer(pem) {
  const base64 = pem
    .replace(/^-----BEGIN [A-Z ]+-----/m, '')
    .replace(/-----END [A-Z ]+-----$/m, '')
    .replace(/\s+/g, '');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Import VAPID private key from various formats:
 * - PKCS8 PEM (-----BEGIN PRIVATE KEY-----)
 * - PKCS8 DER base64/base64url
 * - Raw VAPID d (32-byte base64url) with provided public key for x/y
 */
async function importVapidPrivateKey(privateKeyStr, publicKeyStr) {
  // 1) Try PEM (PKCS8)
  if (/BEGIN [A-Z ]+PRIVATE KEY/.test(privateKeyStr)) {
    try {
      const der = pemToDer(privateKeyStr);
      return await crypto.subtle.importKey(
        'pkcs8',
        der,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
    } catch (e) {
      // fall through to other methods
    }
  }

  // 2) Try PKCS8 DER provided as base64/base64url string
  try {
    const der = urlBase64ToUint8Array(privateKeyStr);
    return await crypto.subtle.importKey(
      'pkcs8',
      der,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
  } catch (e) {
    // continue to JWK path
  }

  // 3) Treat as raw VAPID private key (d) in base64url, require public key to build JWK
  const dBytes = urlBase64ToUint8Array(privateKeyStr);
  // Parse public key (uncompressed EC point 0x04 || X(32) || Y(32))
  const pubBytes = urlBase64ToUint8Array(publicKeyStr);
  let xBytes, yBytes;
  if (pubBytes.length === 65 && pubBytes[0] === 0x04) {
    xBytes = pubBytes.slice(1, 33);
    yBytes = pubBytes.slice(33, 65);
  } else if (pubBytes.length === 64) {
    // Public key without 0x04 prefix (x||y)
    xBytes = pubBytes.slice(0, 32);
    yBytes = pubBytes.slice(32, 64);
  } else {
    throw new Error('Unexpected VAPID public key format; expected 65-byte uncompressed or 64-byte xy.');
  }

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: uint8ArrayToBase64Url(dBytes),
    x: uint8ArrayToBase64Url(xBytes),
    y: uint8ArrayToBase64Url(yBytes)
  };

  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
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
  
  // Import private key for signing (supports PKCS8 PEM/DER or raw VAPID d)
  const cryptoKey = await importVapidPrivateKey(privateKey, publicKey);
  
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
async function sendPushNotification(subscription, smaId, env) {
  const payload = JSON.stringify({ due: [smaId], ts: Date.now() });
  
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
    
    // Encrypt payload per Web Push (aes128gcm)
    const { body: encBody, headers: encHeaders } = await encryptWebPushPayload(subscription, payload);

    // Prepare headers with VAPID authentication and encryption
    const headers = {
      'TTL': '86400',
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Authorization': `vapid t=${vapidJWT}, k=${env.VAPID_PUBLIC_KEY}`,
      'Encryption': `salt=${encHeaders.salt}`,
      'Crypto-Key': `dh=${encHeaders.dh}; p256ecdsa=${env.VAPID_PUBLIC_KEY}`
    };

    // Send encrypted push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers,
      body: encBody
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Push failed: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    console.log('Push notification sent to', audience);
    
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

// -------- Web Push Encryption (aes128gcm) ---------
async function encryptWebPushPayload(subscription, payload) {
  const enc = new TextEncoder();
  const data = enc.encode(payload);

  const authSecret = urlBase64ToUint8Array(subscription.keys.auth);
  const clientPub = urlBase64ToUint8Array(subscription.keys.p256dh);

  // Generate server ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const serverPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));

  // Import client public key for ECDH
  const clientPubKey = await crypto.subtle.importKey(
    'raw',
    clientPub,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive ECDH shared secret (IKM)
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: clientPubKey }, serverKeys.privateKey, 256)
  );

  // HKDF-Extract with auth secret -> PRK1
  const prk1 = new Uint8Array(await hmacSha256(authSecret, ecdhSecret));

  // Random salt for content encryption
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF-Extract with salt -> PRK2
  const prk2 = new Uint8Array(await hmacSha256(salt, prk1));

  // Build context
  const cekInfo = buildInfo('aes128gcm', clientPub, serverPubRaw);
  const nonceInfo = buildInfo('nonce', clientPub, serverPubRaw);

  // HKDF-Expand to CEK (16 bytes) and Nonce (12 bytes)
  const cek = new Uint8Array(await hkdfExpand(prk2, cekInfo, 16));
  const nonce = new Uint8Array(await hkdfExpand(prk2, nonceInfo, 12));

  // Payload with 0x00 padding delimiter
  const plaintext = new Uint8Array(1 + data.length);
  plaintext.set([0x00], 0);
  plaintext.set(data, 1);

  // Encrypt
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext)
  );

  return {
    body: ciphertext,
    headers: {
      salt: uint8ArrayToBase64Url(salt),
      dh: uint8ArrayToBase64Url(serverPubRaw)
    }
  };
}

async function hmacSha256(keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', key, dataBytes);
}

async function hkdfExpand(prkBytes, infoBytes, length) {
  // T(0) = empty; T(1) = HMAC(PRK, T(0) | info | 0x01)
  const blocks = Math.ceil(length / 32);
  let t = new Uint8Array(0);
  let okm = new Uint8Array(0);
  for (let i = 1; i <= blocks; i++) {
    const input = new Uint8Array(t.length + infoBytes.length + 1);
    input.set(t, 0);
    input.set(infoBytes, t.length);
    input[input.length - 1] = i;
    t = new Uint8Array(await hmacSha256(prkBytes, input));
    okm = concatUint8(okm, t);
  }
  return okm.slice(0, length);
}

function buildInfo(type, clientPub, serverPub) {
  const te = new TextEncoder();
  const typeLabel = te.encode('Content-Encoding: ' + type);
  const p256 = te.encode('P-256');
  return concatUint8(
    typeLabel,
    new Uint8Array([0x00]),
    p256,
    new Uint8Array([0x00]),
    u16be(clientPub.length),
    clientPub,
    u16be(serverPub.length),
    serverPub
  );
}

function u16be(n) {
  return new Uint8Array([(n >> 8) & 0xff, n & 0xff]);
}

function concatUint8(...arrs) {
  const len = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
