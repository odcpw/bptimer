# BPtimer SMA Push Notification Worker

This Cloudflare Worker handles push notifications for Special Mindfulness Activities (SMAs) in the BPtimer app.

## Setup Summary

### What We Created

1. **Cloudflare Worker** (`worker.js`)
   - Handles subscription management (`/subscribe`, `/unsubscribe`)
   - Manages SMA schedules (`/schedule`)
   - Sends push notifications every 15 minutes via cron job
   - Deployed to: `https://bptimer-sma-worker.mail-12b.workers.dev`

2. **KV Namespaces** (key-value storage)
   - `SMA_SUBSCRIPTIONS` (ID: `453bff7add9a4f84b64586ba984045ea`)
     - Stores user push subscriptions and metadata
   - `SMA_SCHEDULES` (ID: `c4fb2d230704490e8df0d2ba3d29487b`)
     - Stores user SMA notification schedules

3. **VAPID Keys** (for push notification security)
   - Public Key: `BPYlMr-dC9cqX8W-tMBShBbus2vWmOdb6cRNVsJ5i4Kp1S9dBl7epLvM19e_apKRsarJGfgBhiRgiTlMLQ7bbFk`
   - Private Key: Stored securely as `VAPID_PRIVATE_KEY` secret
     - Accepted formats: raw base64url (from `web-push`), PKCS8 PEM, or base64/base64url PKCS8 DER
     - If logs show "Invalid PKCS8 input", ensure you pasted the raw base64url private key or a valid PKCS8 key

### Commands Used

```bash
# 1. Install Wrangler CLI globally
npm install -g wrangler

# 2. Authenticate with Cloudflare
wrangler login

# 3. Generate VAPID keys for push notifications
npx web-push generate-vapid-keys

# 4. Create KV namespaces for data storage
wrangler kv namespace create "SMA_SUBSCRIPTIONS"
wrangler kv namespace create "SMA_SCHEDULES"

# 5. Set private key as encrypted secret
wrangler secret put VAPID_PRIVATE_KEY

# 6. Deploy worker to Cloudflare
wrangler deploy
```

## How It Works

### Data Flow

1. **User enables notifications** in BPtimer app
2. **App requests permission** and gets push subscription
3. **App sends subscription** to `/subscribe` endpoint
4. **App sends SMA schedules** to `/schedule` endpoint
5. **Worker checks every 15 minutes** for due notifications
6. **Worker sends push** with just the SMA name (privacy-preserving)
7. **User clicks notification** and app opens

### Privacy Design

- **Server only knows**: Timing of notifications, user timezone
- **Server DOESN'T know**: SMA names, what user is practicing
- **Notifications contain**: Just the SMA name the user entered

### API Endpoints

- `POST /subscribe` - Register for push notifications
- `POST /unsubscribe` - Unregister from notifications  
- `POST /schedule` - Update SMA notification schedules
- `GET /health` - Health check

### Automatic Scheduling

- **Cron job runs every 15 minutes**: `*/15 * * * *`
- **Checks all user schedules** for due notifications
- **Sends notifications** based on frequency:
  - **Monthly**: First of month at 9 AM
  - **Weekly**: Specified day at 10 AM  
  - **Daily**: Every day at 9 AM
  - **Multiple**: Spread throughout day (8am, 12pm, 4pm, 8pm)

## Files Structure

```
cloudflare-worker/
├── worker.js          # Main worker code
├── wrangler.toml      # Worker configuration 
├── package.json       # Node.js dependencies
└── README.md         # This documentation
```

## Costs

- **Cloudflare Workers Free Tier**: 100,000 requests/day
- **KV Storage Free Tier**: 10GB storage, 100,000 reads/day
- **Estimated usage**: ~2,000 requests/day for active users
- **Cost**: $0/month for typical usage

## Integration with Main App

The main BPtimer app (`/script.js`) includes:

- `PushNotificationManager` class
- Automatic permission requests when notifications enabled
- Schedule updates when SMAs are modified
- Service worker handlers for incoming notifications

## Monitoring

Check worker logs and usage:
```bash
wrangler tail bptimer-sma-worker --format pretty
```

View KV data:
```bash
wrangler kv:key list --binding SMA_SUBSCRIPTIONS
wrangler kv:key list --binding SMA_SCHEDULES
```

## Security

- Private VAPID key stored as encrypted secret
- CORS headers restrict access to BPtimer domain
- No sensitive data stored on server
- Push notifications use standard Web Push Protocol

### VAPID Key Format Notes
- Public key (`VAPID_PUBLIC_KEY`) must be the uncompressed P-256 public key in base64url (starts with `B...`, 65 bytes when decoded)
- Private key (`VAPID_PRIVATE_KEY`) can be:
  - Raw base64url private key (`d`) as output by `npx web-push generate-vapid-keys` (recommended)
  - A PKCS8 PEM (-----BEGIN PRIVATE KEY-----)
  - A base64/base64url PKCS8 DER

## Deployment

To update the worker:
```bash
cd cloudflare-worker
wrangler deploy
```

Changes take effect immediately without downtime.
