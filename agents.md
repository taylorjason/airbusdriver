# AGENTS.md

Instructions for AI coding agents working on the AirbusDriver project.

## Project Overview

AirbusDriver is a web application that proxies and modernizes the legacy airbusdriver.net pilot comments page. It consists of:

- A static frontend (HTML/CSS/JS) hosted on GitHub Pages
- A Cloudflare Worker proxy that fetches and caches data from the legacy site

## Project Structure

```
├── index.html          # Main HTML document with critical inline CSS
├── app.js              # All frontend JavaScript logic (~1000 lines)
├── styles.css          # Deferred stylesheet
├── workers/
│   └── index.js        # Cloudflare Worker proxy with caching
├── wrangler.toml       # Cloudflare Worker configuration
└── .github/workflows/
    └── deploy-worker.yml   # CI/CD for Worker deployment
```

## Code Style

### JavaScript
- Vanilla JavaScript only. Do not introduce frameworks or build tools.
- Use `const` by default, `let` when reassignment is needed, never `var`.
- Use arrow functions for callbacks and anonymous functions.
- Use template literals for string interpolation.
- Prefix console logs with context: `console.log('[Cache] message')`.
- Use JSDoc comments for function documentation.

### CSS
- Use CSS custom properties (variables) defined in `:root`.
- Mobile-first responsive design with media queries.
- Use semantic class names.

### HTML
- Use semantic HTML5 elements.
- Keep accessibility in mind (ARIA labels where appropriate).

## Security Requirements

### Boundaries - DO NOT:
- Modify the `ALLOWED_HOSTS` whitelist in `workers/index.js` without explicit approval.
- Add external script sources or CDN dependencies without approval.
- Store or log user data beyond localStorage caching.
- Disable CORS protections or security headers.
- Commit secrets, API keys, or tokens.

### Input Validation
- All URLs passed to the Worker must be validated against `ALLOWED_HOSTS`.
- Sanitize any user-provided search input before DOM insertion.
- Use `textContent` over `innerHTML` when possible to prevent XSS.

### Worker Security
- The Worker only accepts GET, HEAD, and OPTIONS requests.
- Only proxy requests to whitelisted domains.
- Return proper error responses with appropriate status codes.

## Architecture Notes

### Two-Tier Caching
The application uses a two-tier caching strategy. Understand this before making changes:

1. **Client-side (localStorage)**: 24-hour cache in browser
   - Cache key: `airbusdriver_cache`
   - Stores: raw HTML, parsed entries, timestamp

2. **Server-side (Cloudflare Cache API)**: 24-hour cache at edge
   - Controlled via `Cache-Control` headers
   - Only caches successful (2xx) responses

### Cache Invalidation
- Double-refresh within 15 seconds bypasses client cache
- `Cache-Control: no-cache` header bypasses server cache
- "Refresh Data" button forces full refresh

## Testing

There are no automated tests. Before submitting changes:

1. Open `index.html` in a browser.
2. Verify the page loads and displays cached or fetched data.
3. Test date filtering and search functionality.
4. Test the modal view by clicking an entry.
5. Test cache invalidation via double-refresh.
6. For Worker changes, test locally with `npx wrangler dev`.

### Local Worker Development
```bash
npx wrangler dev
```

## Deployment

### Frontend (GitHub Pages)
- Merges to `main` automatically deploy via GitHub Pages.
- No build step required.

### Cloudflare Worker
- Changes to `workers/` or `wrangler.toml` trigger automatic deployment.
- CI runs via `.github/workflows/deploy-worker.yml`.
- Manual deploy: `npx wrangler deploy --env production`

## Git Workflow

## Commits and PRs
- Commit and PRs should be focused on a single change.
- Provide a clear description of the change in the PR description. Include info from all related commits and issues.
- Do not create a PR until instructed to do so.
- Reference related issues in the PR description.
- Ensure the frontend works before requesting review.

### Commit Messages
Use conventional commits:
```
feat: add new filter option
fix: correct date parsing for edge case
perf: memoize search regex compilation
docs: update README with cache flow
refactor: extract helper function
```

### Pull Requests
- Keep PRs focused on a single change.
- Reference related issues in the PR description.
- Ensure the frontend works before requesting review.

## Common Tasks

### Adding a New Feature
1. Read existing code in `app.js` to understand patterns.
2. Implement feature following existing code style.
3. Test manually in browser.
4. Update README.md if user-facing behavior changes.

### Modifying the Worker
1. Read `workers/index.js` completely before changes.
2. Preserve the ALLOWED_HOSTS security boundary.
3. Maintain cache behavior and headers.
4. Test with `npx wrangler dev` before committing.

### Performance Optimization
- Check for DOM operation frequency (batch updates).
- Use memoization for expensive computations (see `searchRegexCache` pattern).
- Avoid layout thrashing (read then write to DOM).
- Preserve existing caching behavior.

## Key Files Reference

| File | Purpose |
|------|---------|
| `app.js:58` | PROXY_URL constant for Worker endpoint |
| `app.js:77-79` | Cache configuration constants |
| `app.js:74` | Marker text for HTML parsing |
| `workers/index.js:14-17` | ALLOWED_HOSTS security whitelist |
| `workers/index.js:71-73` | Cache API implementation |
