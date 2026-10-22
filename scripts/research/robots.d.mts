// Types for robots.mjs, so that TypeScript files (tests/robots.test.ts, e2e/polite.spec.ts) can use it.

/** One Allow or Disallow rule of the "*" groups of a robots.txt. */
export interface RobotsRule {
  /** True for Allow, false for Disallow. */
  allow: boolean;
  /** The pattern as written. */
  path: string;
  /** The line as written, without its comment: "Disallow: /private/". */
  text: string;
  /** The line number in the file, from 1. */
  line: number;
}

/** The rules that apply to the research browser: those of every "*" group, in the order of the file. */
export declare function parseRobots(text: string): RobotsRule[];

/** The rule that decides a path with its query ("/a/b?c=d"): the longest match, Allow on a tie. Undefined if none matches. */
export declare function robotsMatch(rules: RobotsRule[], pathWithQuery: string): RobotsRule | undefined;

/** True if the rules allow a path with its query. */
export declare function robotsAllows(rules: RobotsRule[], pathWithQuery: string): boolean;
