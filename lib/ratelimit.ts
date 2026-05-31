import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Throttle login attempts per IP: 5 tries per minute (sliding window).
// Shared across serverless instances because the counter lives in Redis.
const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:login",
  analytics: false,
});

// Throttle per-link password guesses: 10 tries per minute, keyed by ip+slug.
const unlockRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit:unlock",
  analytics: false,
});

async function allow(rl: Ratelimit, key: string): Promise<boolean> {
  try {
    const { success } = await rl.limit(key);
    return success;
  } catch {
    // Fail open if Redis is unreachable — a blip shouldn't lock anyone out,
    // and a correct password is still required regardless.
    return true;
  }
}

export const allowLoginAttempt = (ip: string) => allow(loginRatelimit, ip);
export const allowUnlockAttempt = (ip: string, slug: string) =>
  allow(unlockRatelimit, `${ip}:${slug}`);
