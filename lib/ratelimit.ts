import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Layered sliding windows: an attempt must pass EVERY tier. Owner sign-in is
// strictest (2/min, 5/hour, 10/day); per-link password guesses get 2× those.
// Counters live in Redis, so limits hold across all serverless instances.
const loginTiers = [
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, "60 s"), prefix: "rl:login:m", analytics: false }),
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:login:h", analytics: false }),
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 d"), prefix: "rl:login:d", analytics: false }),
];

const unlockTiers = [
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(4, "60 s"), prefix: "rl:unlock:m", analytics: false }),
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:unlock:h", analytics: false }),
  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 d"), prefix: "rl:unlock:d", analytics: false }),
];

async function allowAll(tiers: Ratelimit[], key: string): Promise<boolean> {
  try {
    // Check tightest window first; stop (and don't consume the wider tiers) on
    // the first block, so a burst doesn't needlessly drain the daily budget.
    for (const rl of tiers) {
      const { success } = await rl.limit(key);
      if (!success) return false;
    }
    return true;
  } catch {
    // Fail open if Redis is unreachable — a blip shouldn't lock anyone out,
    // and a correct password is still required regardless.
    return true;
  }
}

export const allowLoginAttempt = (ip: string) => allowAll(loginTiers, ip);
export const allowUnlockAttempt = (ip: string, slug: string) =>
  allowAll(unlockTiers, `${ip}:${slug}`);
