const windows = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export const clientId = (request: Request) => {
  // Vercel terminates the request and rewrites x-forwarded-for. Cloudflare's
  // header is accepted only when the deployment explicitly declares that it
  // is the trusted edge, so a direct caller cannot choose their own bucket.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  if (process.env.TRUST_CLOUDFLARE_HEADERS === "true") return request.headers.get("cf-connecting-ip")?.trim() ?? "unknown";
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
};

/** A lightweight fallback. Configure a durable Vercel WAF or Redis limit in production. */
export const takeRateLimit = (request: Request, scope: string, limit: number, windowMs: number) => {
  const id = `${scope}:${clientId(request)}`;
  const now = Date.now();
  const active = (windows.get(id) ?? []).filter((time) => now - time < windowMs);
  if (windows.size > MAX_BUCKETS) {
    for (const [bucket, timestamps] of windows) if (!timestamps.some((time) => now - time < windowMs)) windows.delete(bucket);
  }
  if (active.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - active[0])) / 1000));
    windows.set(id, active);
    return { allowed: false, retryAfter };
  }
  active.push(now);
  windows.set(id, active);
  return { allowed: true, retryAfter: 0 };
};

/** Reject cross-site browser POSTs so these public routes cannot be used as a proxy. */
export const isSameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  return Boolean(origin && host && origin === `${protocol}://${host}`);
};

export const tooManyRequests = (retryAfter: number) => Response.json(
  { error: "Too many requests. Please wait a minute and try again." },
  { status: 429, headers: { "retry-after": String(retryAfter), "cache-control": "no-store" } },
);
