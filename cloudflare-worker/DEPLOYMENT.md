# Cloudflare Worker Deployment Guide

## Prerequisites

1. **Cloudflare Account** - Sign up at https://cloudflare.com
2. **Wrangler CLI** - Install globally with `npm install -g wrangler`
3. **Node.js** - Version 16 or higher

## First-Time Setup

### 1. Authentication
```bash
wrangler login
```
This opens your browser to authenticate with Cloudflare.

### 2. Install Dependencies
```bash
cd cloudflare-worker
npm install
```

### 3. Create KV Namespaces
```bash
wrangler kv namespace create "SMA_SUBSCRIPTIONS"
wrangler kv namespace create "SMA_SCHEDULES"
```

Copy the namespace IDs and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SMA_SUBSCRIPTIONS"
id = "your-subscriptions-id-here"

[[kv_namespaces]]
binding = "SMA_SCHEDULES" 
id = "your-schedules-id-here"
```

### 4. Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

Update `wrangler.toml` with the **public key**:
```toml
[vars]
VAPID_PUBLIC_KEY = "your-public-key-here"
```

### 5. Set Private Key as Secret
```bash
wrangler secret put VAPID_PRIVATE_KEY
```
When prompted, paste one of the following formats (recommended first):
- The raw base64url private key string output by the command above (the second line)
- Or a PKCS8 PEM block (-----BEGIN PRIVATE KEY----- ...)
- Or a base64/base64url-encoded PKCS8 DER string

If you see "Invalid PKCS8 input" in logs, the secret likely isn’t PKCS8; the worker now also accepts the raw base64url key and will import it as a JWK using the public key.

### 6. Deploy Worker
```bash
wrangler deploy
```

## Updating the Main App

After deploying, update the worker URL in `/script.js`:

```javascript
// In PushNotificationManager class
this.workerUrl = 'https://your-worker-name.your-subdomain.workers.dev';
```

## Regular Deployments

For updates after initial setup:

```bash
cd cloudflare-worker
npm run deploy
```

## Environment Variables

- **VAPID_PUBLIC_KEY** - Set in `wrangler.toml` (safe to commit)
- **VAPID_PRIVATE_KEY** - Set as secret (never commit)

## Monitoring

### View Logs
```bash
wrangler tail bptimer-sma-worker --format pretty
```

### Check KV Data
```bash
wrangler kv:key list --binding SMA_SUBSCRIPTIONS
wrangler kv:key list --binding SMA_SCHEDULES
```

### Test Health
```bash
curl https://your-worker-url.workers.dev/health
```

## Troubleshooting

### Worker Not Found
- Check worker name in `wrangler.toml`
- Ensure deployment was successful

### Permission Denied
- Verify you're logged in: `wrangler whoami`
- Check Cloudflare account permissions

### VAPID Key Issues
- Regenerate keys with `npx web-push generate-vapid-keys`
- Update both `wrangler.toml` and secret

### Notifications Not Sent
- Check cron trigger is enabled
- Verify user schedules in KV storage
- Check worker logs for errors

## Security Notes

- **Never commit** VAPID private key to git
- **KV namespaces** contain user data - handle with care
- **CORS headers** restrict access to your domain only
- **User privacy** is maintained - no activity names stored on server

## Costs

- **Free Tier**: 100,000 requests/day, 10GB KV storage
- **Typical Usage**: ~1,000-5,000 requests/day
- **Expected Cost**: $0/month for most users
