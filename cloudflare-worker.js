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

const buildCorsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

const errorResponse = (message, status = 400) =>
  new Response(
    JSON.stringify({ error: message }, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...buildCorsHeaders(),
      },
    }
  );

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(),
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return errorResponse("Missing required ?url= query parameter.", 400);
    }

    let target;
    try {
      target = new URL(targetUrl);
    } catch (error) {
      return errorResponse(`Invalid target URL: ${targetUrl}`, 400);
    }

    if (!ALLOWED_HOSTS.has(target.hostname)) {
      return errorResponse(
        `Target host not allowed: ${target.hostname}. Update ALLOWED_HOSTS in the worker.`,
        403
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

        // Add CORS headers
        Object.entries(buildCorsHeaders()).forEach(([key, value]) => {
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
      ...buildCorsHeaders(),
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
