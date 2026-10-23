// Types for robots.mjs, so that TypeScript files (tests/robots.test.ts, e2e/polite.spec.ts) can use it.

/** Anthropic's agents, in lower case. A group that names one of them applies to the research browser. */
export declare const ANTHROPIC_AGENTS: string[];

/** One Allow or Disallow rule of a group of a robots.txt that applies to the research browser. */
export interface RobotsRule {
  /** True for Allow, false for Disallow. */
  allow: boolean;
  /** The pattern as written. */
  path: string;
  /** The line as written, without its comment: "Disallow: /private/". */
  text: string;
  /** The line number in the file, from 1. */
  line: number;
  /** The token of the rule's group, as written: "*", "ClaudeBot", "HeadlessChrome". */
  agent: string;
}

/**
 * The rules of every group that applies to a browser that sends `userAgent`, in the order of the
 * file: the "*" groups, and the groups whose token is part of one of our names, ignoring case. Our
 * names are the product names of `userAgent` and ANTHROPIC_AGENTS.
 */
export declare function parseRobots(text: string, userAgent?: string): RobotsRule[];

/**
 * The rule that decides a path with its query ("/a/b?c=d"). Each group gives its longest match
 * (Allow on a tie); a Disallow from any group decides. Undefined if no rule matches.
 */
export declare function robotsMatch(rules: RobotsRule[], pathWithQuery: string): RobotsRule | undefined;

/** True if every group allows a path with its query. */
export declare function robotsAllows(rules: RobotsRule[], pathWithQuery: string): boolean;
