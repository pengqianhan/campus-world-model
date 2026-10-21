// Types for polite.mjs, so that TypeScript files (the test in e2e/polite.spec.ts) can use it.
import type { Browser, BrowserContext, Page } from "@playwright/test";

export declare const PACE_MS: number;

/** One request, sent or blocked. */
export interface PoliteRow {
  /** When it was let through, or when it was blocked. */
  at: string;
  /** The resource type in Playwright's words: "document", "script", "xhr" and so on. A fetch() is "xhr". */
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
  /** Why it was blocked: "host not allowed", "type not allowed", "closed: 403" and so on. */
  reason?: string;
}

export declare function politePage(
  browser: Browser,
  options: { url: string; allow?: string[]; types?: string[]; viewport?: { width: number; height: number } },
): Promise<{ page: Page; context: BrowserContext; log: PoliteRow[]; closed: Map<string, string> }>;

export declare function isSignIn(url: string): boolean;

export declare function allowArg(args: string[]): { allow: string[]; rest: string[] };
