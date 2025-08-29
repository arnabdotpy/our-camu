# Deployment Guide

This guide covers deploying both the Cloudflare Worker backend and the React frontend.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Domain** (optional): For custom domain deployment

## Step 1: Deploy Cloudflare Worker

### 1.1 Login to Cloudflare
```bash
wrangler login
```
This will open a browser window to authenticate with Cloudflare.

### 1.2 Deploy the Worker
```bash
cd worker
pnpm install
pnpm run deploy
```

### 1.3 Get Worker URL
After deployment, Wrangler will show you the worker URL:
```
https://proxy-attendance-worker.your-subdomain.workers.dev
```

**Important**: Copy this URL - you'll need it for the frontend configuration.

### 1.4 Test Worker
Test your deployed worker:
```bash
curl -X POST https://proxy-attendance-worker.your-subdomain.workers.dev/mark_attendance \
  -H "Content-Type: application/json" \
  -d '{"category": "B45", "qr_code": "test123"}'
```

## Step 2: Configure Frontend for Production

### 2.1 Update Production Environment
Edit `.env.production` with your actual worker URL:
```env
VITE_API_URL=https://proxy-attendance-worker.your-subdomain.workers.dev/mark_attendance
VITE_ENVIRONMENT=production
```

### 2.2 Build for Production
```bash
pnpm run build:production
```

## Step 3: Deploy Frontend

You have several options for frontend deployment:

### Option A: Cloudflare Pages (Recommended)

1. **Connect Repository**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project" → "Connect to Git"
   - Select your repository

2. **Configure Build Settings**:
   - Build command: `pnpm run build:production`
   - Build output directory: `dist`
   - Environment variables:
     ```
     VITE_API_URL=https://proxy-attendance-worker.your-subdomain.workers.dev/mark_attendance
     VITE_ENVIRONMENT=production
     ```

3. **Deploy**: Click "Save and Deploy"

### Option B: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add VITE_API_URL
   # Enter: https://proxy-attendance-worker.your-subdomain.workers.dev/mark_attendance
   
   vercel env add VITE_ENVIRONMENT
   # Enter: production
   ```

### Option C: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**:
   ```bash
   pnpm run build:production
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables** in Netlify dashboard

## Step 4: Custom Domain (Optional)

### For Cloudflare Worker:
1. Go to Workers & Pages → your worker
2. Click "Custom domains" → "Add custom domain"
3. Enter your domain (e.g., `api.yourdomain.com`)

### For Frontend:
1. Configure your DNS to point to your hosting provider
2. Update SSL certificates if needed

## Step 5: Verification

1. **Test Worker**: Visit your worker URL directly
2. **Test Frontend**: 
   - Visit your deployed frontend
   - Try scanning a QR code
   - Verify attendance marking works

## Environment Variables Summary

### Development (.env.development)
```env
VITE_API_URL=/mark_attendance
VITE_ENVIRONMENT=development
```

### Production (.env.production)
```env
VITE_API_URL=https://your-worker-url.workers.dev/mark_attendance
VITE_ENVIRONMENT=production
```

## Troubleshooting

### Worker Issues:
- Check Cloudflare dashboard for error logs
- Verify worker is deployed and active
- Test endpoints with curl

### Frontend Issues:
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure CORS headers are working

### CORS Issues:
- Worker already includes CORS headers
- If issues persist, check browser network tab

## Quick Deploy Commands

```bash
# Deploy everything
pnpm run deploy:all

# Deploy only worker
pnpm run deploy:worker

# Build frontend for production
pnpm run deploy:frontend
```

## Security Notes

1. **Student Credentials**: Currently stored in worker code. For production, consider:
   - Moving to Cloudflare KV storage
   - Using environment variables
   - Implementing proper authentication

2. **Rate Limiting**: Consider adding rate limiting to prevent abuse

3. **Monitoring**: Set up monitoring and alerts for your worker

## Cost Estimation

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **Cloudflare Pages**: Free tier includes unlimited static requests
- **Custom Domain**: Free with Cloudflare

Total cost for typical usage: **$0/month** (within free tiers)