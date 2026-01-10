# Deployment Guide

## Cloudflare Worker Deployment

This project uses GitHub Actions to automatically deploy the Cloudflare Worker when changes are made to the worker code or configuration.

### Prerequisites

1. A Cloudflare account (free tier is sufficient)
2. GitHub repository with Actions enabled

### Setup Instructions

#### 1. Get Your Cloudflare Credentials

**API Token:**
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template
5. Configure permissions:
   - Account → Workers Scripts → Edit
   - Account → Workers KV Storage → Edit (optional)
6. Continue and create the token
7. **Copy the token** (you won't see it again!)

**Account ID:**
1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Look for **Account ID** on the right sidebar
3. Click to copy

#### 2. Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

   | Secret Name | Value |
   |-------------|-------|
   | `CLOUDFLARE_API_TOKEN` | Your API token from step 1 |
   | `CLOUDFLARE_ACCOUNT_ID` | Your Account ID from step 1 |

#### 3. Deploy

The worker will automatically deploy when you push changes to the `main` branch that affect:
- `wrangler.toml` (worker configuration)
- `workers/**` (worker source code)

You can also manually trigger a deployment:
1. Go to **Actions** tab in GitHub
2. Select **Deploy Cloudflare Worker** workflow
3. Click **Run workflow**

### Project Structure

```
.
├── workers/
│   └── index.js          # Cloudflare Worker source code
├── wrangler.toml         # Worker configuration
├── .github/
│   └── workflows/
│       └── deploy-worker.yml  # GitHub Actions workflow
└── index.html            # Main application
```

### Testing Locally

To test the worker locally before deploying:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Test locally (requires wrangler.toml)
wrangler dev

# Manual deployment (if needed)
wrangler deploy --env production
```

### Worker Configuration

The worker is configured in `wrangler.toml`:
- **Name**: `snowy-king-2ff2` (your worker name)
- **Entry Point**: `workers/index.js`
- **Compatibility Date**: `2024-01-01`

### Troubleshooting

**Deployment fails with "Unauthorized":**
- Check that your `CLOUDFLARE_API_TOKEN` secret is correct
- Verify the token has "Edit Cloudflare Workers" permissions

**Deployment fails with "Account not found":**
- Verify your `CLOUDFLARE_ACCOUNT_ID` secret is correct
- Check that the account ID matches your Cloudflare account

**Worker not updating:**
- Check the **Actions** tab for deployment logs
- Verify the workflow was triggered (check paths in workflow file)
- Cloudflare may cache deployments for a few seconds

**Workflow doesn't trigger:**
- Ensure changes are pushed to the `main` branch
- Check that modified files match the `paths` filter in `.github/workflows/deploy-worker.yml`

### Manual Deployment

If GitHub Actions is not available, you can deploy manually:

```bash
# Install dependencies
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy --env production
```

### Security Notes

- Never commit your API token or Account ID to the repository
- Use GitHub Secrets for all sensitive credentials
- Rotate your API token periodically
- Limit API token permissions to only what's needed
