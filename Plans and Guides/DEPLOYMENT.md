# Deployment Guide

This project uses [Cloudflare Workers](https://workers.cloudflare.com/) to proxy requests to the legacy site and handle CORS.

## 🚀 Quick Deploy

1. **Install Wrangler**: `npm install -g wrangler`
2. **Login**: `wrangler login`
3. **Deploy**: `wrangler deploy`

## ⚙️ Configuration (`wrangler.toml`)

- **name**: User-defined worker name.
- **main**: `workers/index.js`
- **compatibility_date**: Ensures consistent runtime behavior.

## 🔄 GitHub Actions Deployment

Commits to `main` automatically deploy the worker if secrets are configured:

| Secret Name | Description |
|-------------|-------------|
| `CLOUDFLARE_API_TOKEN` | Token with "Edit Cloudflare Workers" permission. |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID. |

See `.github/workflows/deploy-worker.yml` for the workflow definition.
