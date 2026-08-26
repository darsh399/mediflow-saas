// Minimal in-memory sliding-window rate limiter for public, unauthenticated
// endpoints. Not distributed-safe (per-process state) — fine for a single
// Node instance; swap for a shared store (Redis) if the app scales out.
export function rateLimit({ windowMs, max, message = 'Too many requests, please try again later.' }) {
  const hits = new Map(); // ip -> array of request timestamps within window

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, timestamps] of hits) {
      const kept = timestamps.filter((t) => t > cutoff);
      if (kept.length) hits.set(ip, kept);
      else hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(ip) || []).filter((t) => t > cutoff);

    if (timestamps.length >= max) {
      return res.status(429).json({ message });
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    next();
  };
}

export default rateLimit;
