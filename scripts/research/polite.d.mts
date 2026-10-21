// Types for polite.mjs, so that TypeScript files (the test in e2e/polite.spec.ts) can use it.
import type { Browser, BrowserContext, LaunchOptions, Page } from "@playwright/test";

export declare const PACE_MS: number;
/** How long a request to a host waits for the answer to the request before it. */
export declare const ANSWER_WAIT_MS: number;
/** Launch arguments for a research browser: no WebRTC UDP except through a proxy. */
export declare const POLITE_ARGS: string[];

/** One request, sent or blocked. */
export interface PoliteRow {
  /** When it was let through, or when it was blocked. */
  at: string;
  /**
   * The resource type as the DevTools Fetch domain gives it, in lower case. Most are Playwright's
   * words ("document", "script", "image"), but a fetch() and an EventSource are "xhr", and the
   * script of a worker is "other".
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
  /** Why it was blocked: "host not allowed", "type not allowed", "closed: 403", "gone" and so on. */
  reason?: string;
}

/** A research browser: the full Chromium build with "Preload pages" off. `close()` also deletes its profile. */
export declare function politeLaunch(options?: LaunchOptions): Promise<{ browser: Browser; close: () => Promise<void> }>;

export declare function politePage(
  browser: Browser,
  options: { url: string; allow?: string[]; types?: string[]; viewport?: { width: number; height: number } },
): Promise<{ page: Page; context: BrowserContext; log: PoliteRow[]; closed: Map<string, string> }>;

export declare function isSignIn(url: string): boolean;

export declare function allowArg(args: string[]): { allow: string[]; rest: string[] };
