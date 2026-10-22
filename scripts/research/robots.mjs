// robots.txt as RFC 9309 reads it, for the gate of the research browser (polite.mjs). This file is
// pure: it fetches nothing and imports nothing, so tests/robots.test.ts runs it in the vitest job.
//
// parseRobots(text) gives the rules that apply to the research browser. The browser sends
// Chromium's own User-Agent, which names no robots.txt product token, so those are the rules of
// the "*" groups, merged into one (RFC 9309, 2.2.1). robotsMatch() and robotsAllows() judge a path
// with its query by those rules: the longest match wins, and Allow wins a tie (2.2.2). "*" matches
// any characters and a "$" at the end of a pattern matches the end of the path (2.2.3). Before
// they are compared, the path and the pattern are put in one form (2.2.2): each non-ASCII
// character and each character that a URL cannot hold as it is becomes %XX in UTF-8; %XX of a
// letter, a digit, "-", ".", "_" or "~" becomes that character; other %XX stay, in capitals. In
// the path, "*" and "$" become %2A and %24, so a pattern matches them only as %2A and %24.
//
// Two readings go further than RFC 9309, each only towards leaving more alone:
// - A directive written after another on the same line starts a line of its own. The file
//   "User-agent: * Disallow: /" (one line) then disallows everything, as its author meant.
// - A Disallow pattern written like a regular expression, with ".*", also matches with "*" in its
//   place: "Disallow: /__data/.*" leaves alone all of /__data/, not only paths that start
//   "/__data/.".

/** The directives that start a line of their own when they come after another on one line. */
const DIRECTIVE_INSIDE = /\s+(?=(?:user-agent|allow|disallow|sitemap|crawl-delay|host|content-signal)\s*:)/i;

/** One rule of the "*" groups. */
function rule(allow, path, text, line) {
  return { allow, path, text, line };
}

/**
 * The rules of robots.txt that apply to the research browser: those of every "*" group, in the
 * order of the file. An empty Allow or Disallow is no rule. Each rule keeps its line as written.
 */
export function parseRobots(text) {
  const rules = [];
  /** The group being read: its agents, and whether a rule has ended its run of User-agent lines. */
  let group;
  const lines = String(text).replace(/^﻿/, "").split(/\r\n|\r|\n/);
  lines.forEach((raw, index) => {
    const content = raw.replace(/#.*/, "").trim();
    for (const part of content.split(DIRECTIVE_INSIDE)) {
      const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(part.trim());
      if (!m) continue;
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      if (key === "user-agent") {
        if (!group || group.ruled) group = { star: false, ruled: false };
        // "*" alone, or "*" and then a space and more (as Google's parser reads it).
        if (/^\*(\s|$)/.test(value)) group.star = true;
      } else if (key === "allow" || key === "disallow") {
        if (!group) continue;
        group.ruled = true;
        if (group.star && value) rules.push(rule(key === "allow", value, part.trim(), index + 1));
      }
    }
  });
  return rules;
}

const UNRESERVED = /^[A-Za-z0-9\-._~]$/;
/** Characters that stand as they are: the unreserved and the reserved ones of RFC 3986, and "%". */
const AS_IS = /^[A-Za-z0-9\-._~:/?#[\]@!&'()+,;=%]$/;

function encode(char) {
  return [...new TextEncoder().encode(char)].map((b) => `%${b.toString(16).toUpperCase().padStart(2, "0")}`).join("");
}

/**
 * The form in which a path and a pattern are compared. In a pattern, "*" stays a wildcard and a
 * last "$" stays the end; anywhere else they are %2A and %24.
 */
function canon(text, pattern) {
  const chars = [...text];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const hex = c === "%" ? `${chars[i + 1] ?? ""}${chars[i + 2] ?? ""}` : "";
    if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
      const decoded = String.fromCharCode(parseInt(hex, 16));
      out += UNRESERVED.test(decoded) ? decoded : `%${hex.toUpperCase()}`;
      i += 2;
    } else if (pattern && (c === "*" || (c === "$" && i === chars.length - 1))) out += c;
    else if (c === "*" || c === "$" || !AS_IS.test(c)) out += encode(c);
    else out += c;
  }
  return out;
}

/** True if `pattern` (in canonical form) matches `path` (in canonical form) from its start. */
function matches(path, pattern) {
  let at = [0];
  for (let j = 0; j < pattern.length; j++) {
    const c = pattern[j];
    if (c === "$" && j === pattern.length - 1) return at.includes(path.length);
    if (c === "*") {
      at = Array.from({ length: path.length - at[0] + 1 }, (_, k) => at[0] + k);
      continue;
    }
    at = at.filter((p) => path[p] === c).map((p) => p + 1);
    if (!at.length) return false;
  }
  return true;
}

function ruleMatches(r, path) {
  const pattern = canon(r.path, true);
  if (matches(path, pattern)) return true;
  return !r.allow && pattern.includes(".*") && matches(path, pattern.replaceAll(".*", "*"));
}

/**
 * The rule that decides `pathWithQuery` (a URL's path and its query, as "/a/b?c=d"): the matching
 * rule with the longest pattern, Allow before Disallow when two are as long. Undefined if no rule
 * matches, which allows the path.
 */
export function robotsMatch(rules, pathWithQuery) {
  const path = canon(pathWithQuery || "/", false);
  let best;
  let length = -1;
  for (const r of rules) {
    if (!ruleMatches(r, path)) continue;
    const n = canon(r.path, true).length;
    if (n > length || (n === length && r.allow && !best.allow)) {
      best = r;
      length = n;
    }
  }
  return best;
}

/** True if the rules allow `pathWithQuery`. */
export function robotsAllows(rules, pathWithQuery) {
  return robotsMatch(rules, pathWithQuery)?.allow ?? true;
}
