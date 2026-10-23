// robots.txt as RFC 9309 reads it, for the gate of the research browser (polite.mjs). This file is
// pure: it fetches nothing and imports nothing, so tests/robots.test.ts runs it in the vitest job.
//
// parseRobots(text, userAgent) gives the rules of every group that applies to the research
// browser, which is the strictest reading: the "*" groups, and each group whose token is part of
// one of our names, ignoring case. Our names are the product names of the browser's own User-Agent
// ("HeadlessChrome/156.0.0.0" makes the groups for HeadlessChrome and for Chrome apply) and
// Anthropic's agents (ANTHROPIC_AGENTS: a group for "Claude" or "anthropic" applies too), because
// Claude drives this browser. RFC 9309 (2.2.1) would apply only
// the one most specific group. The groups for one token are merged into one (2.2.1). robotsMatch()
// and robotsAllows() judge a path with its query by each token's group alone: the longest match
// wins, and Allow wins a tie (2.2.2). The path is allowed only if every group allows it; with no
// group, everything is allowed. Crawl-delay is not read. "*" matches any characters and a "$" at
// the end of a pattern matches the end of the path (2.2.3). Before they are compared, the path
// and the pattern are put in one form (2.2.2): each non-ASCII
// character and each character that a URL cannot hold as it is becomes %XX in UTF-8; %XX of a
// letter, a digit, "-", ".", "_" or "~" becomes that character; other %XX stay, in capitals. In
// the path, "*" and "$" become %2A and %24, so a pattern matches them only as %2A and %24.
//
// Three readings go further than RFC 9309, each only towards leaving more alone:
// - The groups, as above.
// - A directive written after another on the same line starts a line of its own. The file
//   "User-agent: * Disallow: /" (one line) then disallows everything, as its author meant.
// - A Disallow pattern written like a regular expression, with ".*", also matches with "*" in its
//   place: "Disallow: /__data/.*" leaves alone all of /__data/, not only paths that start
//   "/__data/.".

/** The directives that start a line of their own when they come after a space on one line. */
const DIRECTIVE = /(?:user-agent|allow|disallow|sitemap|crawl-delay|host|content-signal)[ \t]*:/gi;

/** A line cut before each directive that comes after a space: "User-agent: * Disallow: /" gives two. */
function directives(line) {
  const starts = [0];
  for (const m of line.matchAll(DIRECTIVE)) if (m.index > 0 && /\s/.test(line[m.index - 1])) starts.push(m.index);
  return starts.map((start, k) => line.slice(start, starts[k + 1] ?? line.length));
}

/** Anthropic's agents, in lower case. A group that names one of them applies to this browser. */
export const ANTHROPIC_AGENTS = ["claudebot", "claude-web", "claude-user", "claude-searchbot", "anthropic-ai"];

const BOM = String.fromCharCode(0xfeff);

/**
 * The token of a User-agent line, as Google's parser takes it: "*" for "*" alone or "*" and then a
 * space; else the letters, "_" and "-" it starts with ("Mozilla/5.0 (…)" gives "Mozilla").
 */
function tokenOf(value) {
  if (/^\*(\s|$)/.test(value)) return "*";
  return /^[A-Za-z_-]*/.exec(value)[0];
}

/** Our names: the product names of `userAgent` (each name before a "/") and Anthropic's agents, in lower case. */
function namesOf(userAgent) {
  return [...[...String(userAgent).matchAll(/([A-Za-z0-9_-]+)\//g)].map((m) => m[1].toLowerCase()), ...ANTHROPIC_AGENTS];
}

/** True if the group for `token` applies to us: "*", or a token that is part of one of our names. */
function applies(token, names) {
  const t = token.toLowerCase();
  return t === "*" || (t !== "" && names.some((name) => name.includes(t)));
}

/**
 * The rules of robots.txt that apply to the research browser, whose User-Agent is `userAgent`: those
 * of each group that applies (see above), in the order of the file. A rule of a group that names
 * two tokens that apply is listed once for each. An empty Allow or Disallow is no rule. Each rule
 * keeps its line as written and the token of its group as written (`agent`).
 */
export function parseRobots(text, userAgent = "") {
  const rules = [];
  /** The group being read: its tokens that apply, and whether a rule has ended its run of User-agent lines. */
  let group;
  const names = namesOf(userAgent);
  let body = String(text);
  if (body.startsWith(BOM)) body = body.slice(1);
  body.split(/\r\n|\r|\n/).forEach((raw, index) => {
    const content = raw.replace(/#.*/, "").trim();
    for (const part of directives(content)) {
      const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(part.trim());
      if (!m) continue;
      const key = m[1].toLowerCase();
      const value = m[2].trim();
      if (key === "user-agent") {
        if (!group || group.ruled) group = { agents: [], ruled: false };
        const token = tokenOf(value);
        if (applies(token, names) && !group.agents.some((a) => a.toLowerCase() === token.toLowerCase())) group.agents.push(token);
      } else if (key === "allow" || key === "disallow") {
        if (!group) continue;
        group.ruled = true;
        if (value) for (const agent of group.agents) rules.push({ allow: key === "allow", path: value, text: part.trim(), line: index + 1, agent });
      }
    }
  });
  return rules;
}

const UNRESERVED = /^[A-Za-z0-9\-._~]$/;
/** Characters that stand as they are: the unreserved and the reserved ones of RFC 3986, and "%". */
const AS_IS = /^[A-Za-z0-9\-._~:/?#[\]@!&'()+,;=%]$/;

/** Text that canon() gives back as it is: no "%", "*" or "$", and nothing to encode. */
const PLAIN = /^[A-Za-z0-9\-._~:/?#[\]@!&'()+,;=]*$/;

function encode(char) {
  return [...new TextEncoder().encode(char)].map((b) => `%${b.toString(16).toUpperCase().padStart(2, "0")}`).join("");
}

/**
 * The form in which a path and a pattern are compared. In a pattern, "*" stays a wildcard and a
 * last "$" stays the end; anywhere else they are %2A and %24.
 */
function canon(text, pattern) {
  // Most paths and patterns hold nothing to change.
  if (PLAIN.test(text)) return text;
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

/**
 * True if `pattern` (in canonical form) matches `path` (in canonical form) from its start. The
 * parts between the wildcards are found in turn, each at its first place after the one before:
 * with "*" the only wildcard, the first place is never a worse choice.
 */
function matches(path, pattern) {
  const anchored = pattern.endsWith("$");
  const parts = (anchored ? pattern.slice(0, -1) : pattern).split("*");
  if (!path.startsWith(parts[0])) return false;
  let at = parts[0].length;
  if (parts.length === 1) return !anchored || at === path.length;
  for (const part of parts.slice(1, -1)) {
    const found = path.indexOf(part, at);
    if (found < 0) return false;
    at = found + part.length;
  }
  const last = parts.at(-1);
  return anchored ? path.length - last.length >= at && path.endsWith(last) : path.indexOf(last, at) >= 0;
}

/**
 * The canonical pattern of each rule, made once: `full` to rank it by its length as written (RFC
 * 9309, 2.2.2: the most octets win), and `match`, with each run of "*" made one, to match it.
 */
const patterns = new WeakMap();
function patternOf(r) {
  if (!patterns.has(r)) {
    const full = canon(r.path, true);
    patterns.set(r, { full, match: full.replace(/[*]+/g, "*") });
  }
  return patterns.get(r);
}

function ruleMatches(r, path) {
  const pattern = patternOf(r).match;
  if (matches(path, pattern)) return true;
  return !r.allow && pattern.includes(".*") && matches(path, pattern.replaceAll(".*", "*"));
}

/** In one group: the matching rule with the longest pattern, Allow before Disallow when two are as long. */
function longest(rules, path) {
  let best;
  let length = -1;
  for (const r of rules) {
    if (!ruleMatches(r, path)) continue;
    const n = patternOf(r).full.length;
    if (n > length || (n === length && r.allow && !best.allow)) {
      best = r;
      length = n;
    }
  }
  return best;
}

/**
 * The rule that decides `pathWithQuery` (a URL's path and its query, as "/a/b?c=d"). Each token's
 * group gives its own longest match. The first group, in the order of the file, whose match is a
 * Disallow decides; else the first Allow that matched. Undefined if no rule matches, which allows
 * the path.
 */
export function robotsMatch(rules, pathWithQuery) {
  const path = canon(pathWithQuery || "/", false);
  const groups = new Map();
  for (const r of rules) {
    const key = (r.agent ?? "*").toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  let allowed;
  for (const group of groups.values()) {
    const best = longest(group, path);
    if (best && !best.allow) return best;
    allowed ??= best;
  }
  return allowed;
}

/** True if the rules allow `pathWithQuery`. */
export function robotsAllows(rules, pathWithQuery) {
  return robotsMatch(rules, pathWithQuery)?.allow ?? true;
}
