# AirbusDriver - CQ Line Pilot Intel

A modern, responsive interface for viewing Airbus CQ Line Pilot comments from [airbusdriver.net](http://www.airbusdriver.net). This project transforms the legacy site into a mobile-friendly experience with instant loading and offline capabilities.

## ✨ Key Features

- **Modern & Responsive**: Clean card-based layout that works perfectly on mobile, tablet, and desktop.
- **Smart Filtering**: Easily filter comments by date range to find relevant info.
- **Instant Performance**: Two-tier caching (Browser + Edge) ensures <100ms load times for returning users.
- **Offline Access**: View previously loaded data even without an internet connection.
- **Privacy**: No personal data is collected or stored.

## 🚀 Getting Started

### Prerequisites
- A modern web browser
- Cloudflare account (for Worker deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/taylorjason/airbusdriver.git
   cd airbusdriver
   ```

2. **Run the static site**
   ```bash
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

3. **Run the Worker locally** (optional)
   ```bash
   npm install -g wrangler
   wrangler dev
   ```

### Deployment

1. **Cloudflare Worker**: Handles CORS and server-side caching.
   - See [DEPLOYMENT.md](Plans%20and%20Guides/DEPLOYMENT.md) for full setup instructions.
   - Quick deploy: `wrangler deploy`

2. **Static Site**: Holds the UI (`index.html`).
   - Host on GitHub Pages, Netlify, Vercel, or any static web host.

## 🛠️ Architecture

The app acts as a smart proxy layer:

**User Browser** (Modern UI + Local Cache)
   ⬇️
**Cloudflare Worker** (CORS Proxy + Edge Cache)
   ⬇️
**Legacy Site** (Original Data Source)

*Pro Tip: Double-refreshing the page (reloading twice within 15 seconds) bypasses all caches to force a fresh fetch.*

## 🤝 Contributing

Contributions are welcome!
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Open source for personal and educational use.

---
Built with ❤️ for pilots by pilots.
