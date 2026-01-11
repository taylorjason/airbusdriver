/**
 * Cloudflare Worker proxy for Airbusdriver HTML fetching.
 *
 * Setup:
 * 1. Create a Worker in Cloudflare dashboard (free tier is fine).
 * 2. Paste this file contents as the Worker script.
 * 3. Deploy and copy the Worker URL (ends with .workers.dev).
 * 4. Paste the Worker URL into the "Cloudflare Worker proxy URL" input.
 *
 * Usage:
 * https://your-worker.your-subdomain.workers.dev?url=http://www.airbusdriver.net/airbus_CQT_Intel.htm
 */

const ALLOWED_HOSTS = new Set([
  "airbusdriver.net",
  "www.airbusdriver.net",
]);

// Allowed origins for CORS (restrict to your domain in production)
const ALLOWED_ORIGINS = [
  "https://taylorjason.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:3000",
];

const buildCorsHeaders = (origin) => {
  // Check if origin is allowed
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
  };
};

const errorResponse = (message, status = 400, origin = null) =>
  new Response(
    JSON.stringify({ error: message }, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...buildCorsHeaders(origin),
      },
    }
  );

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin),
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return errorResponse("Missing required ?url= query parameter.", 400, origin);
    }

    let target;
    try {
      target = new URL(targetUrl);
    } catch (error) {
      return errorResponse(`Invalid target URL: ${targetUrl}`, 400, origin);
    }

    // Validate protocol
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return errorResponse(`Invalid protocol: ${target.protocol}. Only HTTP and HTTPS are allowed.`, 400, origin);
    }

    if (!ALLOWED_HOSTS.has(target.hostname)) {
      return errorResponse(
        `Target host not allowed: ${target.hostname}. Update ALLOWED_HOSTS in the worker.`,
        403,
        origin
      );
    }

    // Check if client is requesting cache bypass (force refresh)
    const cacheControl = request.headers.get("Cache-Control");
    const forceRefresh = cacheControl === "no-cache" || cacheControl === "no-store";

    // Use Cloudflare Cache API
    const cache = caches.default;
    const cacheKey = new Request(target.toString(), { method: "GET" });

    // Try to get from cache if not forcing refresh
    if (!forceRefresh) {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        // Clone response to add CORS headers
        const response = new Response(cachedResponse.body, cachedResponse);
        const newHeaders = new Headers(response.headers);

        // Add CORS headers with origin
        Object.entries(buildCorsHeaders(origin)).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        // Keep the X-Cached-At header if it exists
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }
    }

    // Cache miss or force refresh - fetch from origin
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AirbusDriverProxy/1.0; +https://workers.cloudflare.com)",
      },
    });

    const body = await upstream.text();

    // Validate response content
    if (upstream.ok && !body.includes("Your CQ Line Pilot Comments")) {
      console.error("Invalid response from upstream - expected marker not found");
      return errorResponse("Invalid response from origin server", 502, origin);
    }

    // Only cache successful responses (2xx status codes)
    // Don't cache errors to avoid turning transient failures into 24-hour outages
    const shouldCache = upstream.ok; // true for status 200-299

    const responseHeaders = {
      "Content-Type": upstream.headers.get("Content-Type") || "text/html",
      // Only set long cache for successful responses
      "Cache-Control": shouldCache
        ? "public, max-age=86400"  // 24 hours for success
        : "no-cache, no-store",    // Don't cache errors
      "X-Cached-At": new Date().toISOString(),
      ...buildCorsHeaders(origin),
    };

    const response = new Response(body, {
      status: upstream.status,
      headers: responseHeaders,
    });

    // Only store successful responses in cache
    // Errors, rate limits, and server failures are not cached
    if (shouldCache) {
      await cache.put(cacheKey, response.clone());
    }

    return response;
  },
};
