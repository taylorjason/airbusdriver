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

    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AirbusDriverProxy/1.0; +https://workers.cloudflare.com)",
      },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "text/html",
        ...buildCorsHeaders(),
      },
    });
  },
};
