// Types for polite.mjs, so that TypeScript files (the test in e2e/polite.spec.ts) can use it.
import type { Browser, BrowserContext, LaunchOptions, Page } from "@playwright/test";
import type { RobotsRule } from "./robots.mjs";

export { ANTHROPIC_AGENTS, parseRobots, robotsAllows, robotsMatch, type RobotsRule } from "./robots.mjs";

export declare const PACE_MS: number;
/** How long a request to a host waits for the answer to the request before it. */
export declare const ANSWER_WAIT_MS: number;
/** Launch arguments for a research browser: no WebRTC UDP except through a proxy. */
export declare const POLITE_ARGS: string[];
/** How many redirects of robots.txt the gate follows. */
export declare const ROBOTS_REDIRECTS: number;

/** One request, sent or blocked. */
export interface PoliteRow {
  /** When it was let through, or when it was blocked. */
  at: string;
  /**
   * The resource type as the DevTools Fetch domain gives it, in lower case. Most are Playwright's
   * words ("document", "script", "image"), but a fetch() and an EventSource are "xhr", and the
   * script of a worker is "other". The gate's own request for robots.txt is "robots".
   */
  type: string;
  method: string;
  url: string;
  sent: boolean;
  /** The request whose redirect led to this one. */
  from?: string;
  /** The status of the answer, for a request sent. */
  status?: number;
  /** The network error, for a request sent that got no answer. */
  error?: string;
  /**
   * Why it was blocked: "host not allowed", "type not allowed", "closed: 403", "favicon", "gone",
   * "robots: Disallow: /private/", "robots: Disallow: / (User-agent: ClaudeBot)",
   * "robots: unreachable (503)" and so on. For the gate's own
   * request for robots.txt, sent or not, "robots" or the reason it was not sent.
   */
  reason?: string;
}

/** What robots.txt said for one origin ("https://host:port"), kept for the life of the browser. */
export interface RobotsAnswer {
  /** The robots.txt asked for: the first hop. */
  url: string;
  /** The status of the last answer, if one came. */
  status?: number;
  /** The network error, or "no answer in 10 s", if none came. */
  error?: string;
  /** The rules of the groups that apply (see parseRobots); empty when robots.txt allows everything (a 404, an empty file). */
  rules: RobotsRule[];
  /** The file as it came (its first 500 KiB), after a 2xx: to quote in a recon's write-up. */
  text?: string;
  /** Set when the gate leaves the whole origin alone: "unreachable (503)", "closed: 403" and so on. */
  disallowAll?: string;
}

/** A research browser: the full Chromium build with "Preload pages" off. `close()` also deletes its profile. */
export declare function politeLaunch(options?: LaunchOptions): Promise<{ browser: Browser; close: () => Promise<void> }>;

export declare function politePage(
  browser: Browser,
  options: { url: string; allow?: string[]; types?: string[]; viewport?: { width: number; height: number } },
): Promise<{
  page: Page;
  context: BrowserContext;
  log: PoliteRow[];
  closed: Map<string, string>;
  /** The robots.txt answers of this browser so far, by origin. */
  robots: Map<string, RobotsAnswer>;
  /** Why the gate will block `url` itself, if it will: "robots: Disallow: /", "closed: 403". */
  blocked?: string;
}>;

export declare function isSignIn(url: string): boolean;

export declare function allowArg(args: string[]): { allow: string[]; rest: string[] };
