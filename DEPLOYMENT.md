# Deployment Guide - CrashDSA on Fly.io

This guide covers deploying CrashDSA to Fly.io, the most cost-effective PaaS option for Bun + Hono applications.

## Why Fly.io?

After evaluating multiple PaaS platforms, Fly.io was selected because:

- **Free Tier**: 3 shared-cpu-1x 256MB VMs + 3GB persistent storage
- **Bun Support**: Official Docker image support with excellent performance
- **No Cold Starts**: Unlike serverless platforms, VMs stay warm
- **Cost-Effective**: ~$1.94/month after free tier (for 256MB VM)
- **Global Edge**: Deploy close to your users
- **Simple Config**: Easy `fly.toml` configuration

### Comparison with Other Platforms

| Platform | Free Tier | Bun Support | Cold Starts | Est. Monthly Cost |
|----------|-----------|-------------|-------------|-------------------|
| **Fly.io** ✅ | 3x 256MB VMs + 3GB | Excellent | No | $0 (free tier) → $1.94 |
| Railway | $5 credit/month | Good | No | $5+ |
| Render | 750 hrs/month | Limited | Yes | $0 → $7 |
| Vercel | Free with limits | Poor | Yes | $0 → $20 |

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the flyctl CLI tool
3. **Docker** (optional): For local testing

### Install Fly CLI

**macOS:**
```bash
brew install flyctl
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

## Deployment Steps

### 1. Authenticate with Fly.io

```bash
flyctl auth login
```

This opens your browser for authentication.

### 2. Launch Your App (First Time)

From your project root:

```bash
flyctl launch
```

This will:
- Detect your `fly.toml` configuration
- Create the app on Fly.io
- Build and deploy your Docker container
- Allocate an IPv4 and IPv6 address

**Important prompts:**
- Would you like to set up a Postgresql database? → **No** (not needed yet)
- Would you like to set up an Upstash Redis database? → **No** (not needed yet)
- Would you like to deploy now? → **Yes**

### 3. Deploy Updates

After making code changes:

```bash
flyctl deploy
```

This builds a new Docker image and deploys it.

### 4. Verify Deployment

```bash
# Open your app in browser
flyctl open

# Check app status
flyctl status

# View logs
flyctl logs
```

## Configuration

### fly.toml Explained

```toml
app = 'crashdsa'           # Your app name (must be unique on Fly.io)
primary_region = 'ord'     # Chicago region (change to nearest region)

[http_service]
  internal_port = 3000     # Port your app listens on
  force_https = true       # Redirect HTTP to HTTPS
  auto_stop_machines = 'stop'    # Scale to zero when idle
  auto_start_machines = true     # Auto-start on requests
  min_machines_running = 0       # Allow scaling to zero

[[vm]]
  memory = '256mb'         # Free tier compatible
  cpu_kind = 'shared'      # Shared CPU for cost savings
  cpus = 1                 # Single CPU
```

### Choosing a Region

List available regions:
```bash
flyctl platform regions
```

Common regions:
- `ord` - Chicago (US Central)
- `iad` - Ashburn, Virginia (US East)
- `lax` - Los Angeles (US West)
- `lhr` - London (Europe)
- `syd` - Sydney (Australia)
- `sin` - Singapore (Asia)

Update in `fly.toml`:
```toml
primary_region = 'iad'  # Change to your preferred region
```

### Scaling

**Scale up memory:**
```bash
flyctl scale memory 512  # Upgrade to 512MB (paid)
```

**Scale to multiple regions:**
```bash
flyctl regions add lax iad  # Add US West and East
```

**Prevent scaling to zero:**
```toml
min_machines_running = 1  # Keep at least 1 VM running
```

## Monitoring

### View Logs

```bash
# Real-time logs
flyctl logs

# Last 100 lines
flyctl logs --tail 100
```

### Check Status

```bash
flyctl status
flyctl info
```

### SSH into VM

```bash
flyctl ssh console
```

## Environment Variables

Set secrets (never commit these):

```bash
flyctl secrets set DATABASE_URL=postgresql://...
flyctl secrets set API_KEY=your-secret-key
```

List secrets:
```bash
flyctl secrets list
```

## Custom Domain

### Add Your Domain

```bash
flyctl certs add yourdomain.com
```

### DNS Configuration

Add these DNS records:
- **A Record**: Point to Fly.io IPv4 (from `flyctl info`)
- **AAAA Record**: Point to Fly.io IPv6 (from `flyctl info`)

### Verify Certificate

```bash
flyctl certs show yourdomain.com
```

## Local Testing

Test the Docker build locally:

```bash
# Build image
docker build -t crashdsa .

# Run container
docker run -p 3000:3000 crashdsa

# Test in browser
open http://localhost:3000
```

## Troubleshooting

### Build Fails

**Check Dockerfile syntax:**
```bash
docker build -t crashdsa .
```

**View build logs:**
```bash
flyctl logs --app crashdsa
```

### App Not Starting

**Check logs:**
```bash
flyctl logs
```

**Common issues:**
- Port mismatch: Ensure `index.ts` uses port 3000
- Missing dependencies: Check `package.json`
- File paths: Ensure relative paths work in Docker

### High Costs

**Check resource usage:**
```bash
flyctl dashboard
```

**Optimize:**
- Enable `auto_stop_machines = 'stop'` in `fly.toml`
- Set `min_machines_running = 0` for low-traffic apps
- Use shared CPU instead of dedicated

### Cannot Access App

**Check app is running:**
```bash
flyctl status
```

**Check health checks:**
```bash
flyctl checks list
```

**Restart app:**
```bash
flyctl apps restart crashdsa
```

## Cost Management

### Free Tier Includes

- 3x shared-cpu-1x VMs with 256MB RAM
- 3GB persistent storage
- 160GB outbound data transfer

### Staying Within Free Tier

1. **Use 256MB VMs**: Default in our `fly.toml`
2. **Enable auto-scaling**: Scale to zero when idle
3. **Single region**: Start with one region
4. **Monitor usage**: Check dashboard regularly

### Current Configuration Cost

With the provided `fly.toml`:
- **Memory**: 256MB (free tier)
- **CPU**: Shared (free tier)
- **Auto-scaling**: Enabled (saves costs)
- **Estimated**: $0/month (within free tier)

## Updating Deployment

### After Code Changes

```bash
git add .
git commit -m "feat: your changes"
git push
flyctl deploy
```

### After Configuration Changes

```bash
# Update fly.toml
vim fly.toml

# Redeploy
flyctl deploy
```

## Rollback

If deployment fails:

```bash
# List releases
flyctl releases

# Rollback to previous version
flyctl releases rollback <version>
```

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Bun on Fly.io](https://fly.io/docs/languages-and-frameworks/bun/)
- [Fly.io Status](https://status.fly.io/)

## Support

- **Fly.io Community**: [community.fly.io](https://community.fly.io)
- **Fly.io Status**: [status.fly.io](https://status.fly.io)
- **GitHub Issues**: Report app-specific issues in this repo

---

**Ready to deploy?**
```bash
flyctl auth login
flyctl launch
```

Your app will be live at `https://crashdsa.fly.dev` 🚀
