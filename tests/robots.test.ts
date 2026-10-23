// The robots.txt reader of the research browser (scripts/research/robots.mjs), against RFC 9309.
// The gate that uses it is tested with real browsers in e2e/polite.spec.ts.
import { describe, expect, it } from "vitest";
import { parseRobots, robotsAllows, robotsMatch } from "../scripts/research/robots.mjs";

/** The paths of `paths` that `robots` allows, and those it does not. */
function judge(robots: string, paths: string[]) {
  const rules = parseRobots(robots);
  return { allowed: paths.filter((p) => robotsAllows(rules, p)), disallowed: paths.filter((p) => !robotsAllows(rules, p)) };
}

/** A User-Agent like the one the research browser sends. */
const HEADLESS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36";

describe("robots.txt groups and lines", () => {
  it("applies the * groups, merged, and no group that names an agent this browser is not", () => {
    const rules = parseRobots(["User-agent: Googlebot", "Disallow: /google/", "", "User-agent: *", "Disallow: /a/", "", "User-agent: GPTBot", "Disallow: /", "", "user-agent: *", "disallow: /b/"].join("\n"), HEADLESS);
    expect(rules.map((r) => r.text)).toEqual(["Disallow: /a/", "disallow: /b/"]);
    expect(rules.map((r) => r.line)).toEqual([5, 11]);
    expect(robotsAllows(rules, "/google/x")).toBe(true);
  });

  it("allows everything when no group applies", () => {
    const robots = "User-agent: Googlebot\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n";
    expect(parseRobots(robots, HEADLESS)).toEqual([]);
    expect(judge(robots, ["/", "/a"]).disallowed).toEqual([]);
  });

  it("applies a group that names an Anthropic agent: a * Allow with a ClaudeBot Disallow disallows (UC's courseinfo host)", () => {
    const robots = ["User-agent: *", "Allow: /", "", "User-agent: GPTBot", "User-agent: ClaudeBot", "Disallow: /"].join("\n");
    const rules = parseRobots(robots, HEADLESS);
    expect(robotsAllows(rules, "/GetCourseDetails.aspx?course=COSC121")).toBe(false);
    expect(robotsMatch(rules, "/")).toMatchObject({ text: "Disallow: /", agent: "ClaudeBot" });
    for (const agent of ["claude-web", "Claude-User", "CLAUDE-SEARCHBOT", "anthropic-ai"])
      expect(robotsAllows(parseRobots(`User-agent: ${agent}\nDisallow: /x`), "/x/y"), agent).toBe(false);
  });

  it("applies a group whose token is part of an Anthropic agent's name, and not one that is not", () => {
    for (const agent of ["Claude", "claude-search", "anthropic", "ANTHROPIC"])
      expect(robotsAllows(parseRobots(`User-agent: ${agent}\nDisallow: /x`, HEADLESS), "/x/y"), agent).toBe(false);
    for (const agent of ["OpenAI", "Claude-Code-Bot", "anthropic-ai-crawler"])
      expect(robotsAllows(parseRobots(`User-agent: ${agent}\nDisallow: /x`, HEADLESS), "/x/y"), agent).toBe(true);
  });

  it("applies a group whose token is in a product name of the browser's User-Agent, and not when the User-Agent lacks it", () => {
    const robots = "User-agent: *\nDisallow: /all/\n\nUser-agent: HeadlessChrome\nDisallow: /headless/\n\nUser-agent: chrome\nDisallow: /chrome/\n";
    const headless = parseRobots(robots, HEADLESS);
    expect(robotsAllows(headless, "/headless/x")).toBe(false);
    expect(robotsMatch(headless, "/headless/x")?.agent).toBe("HeadlessChrome");
    expect(robotsAllows(headless, "/chrome/x")).toBe(false);
    expect(robotsAllows(headless, "/all/x")).toBe(false);
    const plain = parseRobots(robots, HEADLESS.replace("HeadlessChrome", "Chrome"));
    expect(robotsAllows(plain, "/headless/x")).toBe(true);
    expect(robotsAllows(plain, "/chrome/x")).toBe(false);
    // "Gecko" is in a comment of the User-Agent, not in a product name.
    expect(parseRobots("User-agent: Gecko\nDisallow: /", HEADLESS)).toEqual([]);
  });

  it("judges each group by its own longest match, and allows a path only if every group allows it", () => {
    const robots = ["User-agent: *", "Disallow: /a/", "Allow: /a/b", "", "User-agent: ClaudeBot", "Allow: /a/", "Disallow: /a/b/c"].join("\n");
    const rules = parseRobots(robots, HEADLESS);
    expect(robotsAllows(rules, "/a/b")).toBe(true);
    // ClaudeBot's group allows /a/x, but the * group does not.
    expect(robotsAllows(rules, "/a/x")).toBe(false);
    // The * group allows /a/b/c, but ClaudeBot's group does not.
    expect(robotsMatch(rules, "/a/b/c")).toMatchObject({ text: "Disallow: /a/b/c", agent: "ClaudeBot" });
  });

  it("takes a run of User-agent lines as one group, and a rule ends the run", () => {
    const rules = parseRobots(["User-agent: bot-a", "User-agent: *", "Disallow: /shared/", "User-agent: bot-b", "Disallow: /b-only/"].join("\r\n"));
    expect(rules.map((r) => r.path)).toEqual(["/shared/"]);
  });

  it("ignores comments, blank lines, other records and rules outside a group", () => {
    const rules = parseRobots(
      ["Disallow: /before-any-group/", "# a comment", "User-agent: * # all", "", "Sitemap: https://example.ac.nz/sitemap.xml", "Crawl-delay: 5", "Disallow: /x/ # private", "nonsense line"].join("\r"),
    );
    expect(rules).toEqual([{ allow: false, path: "/x/", text: "Disallow: /x/", line: 7, agent: "*" }]);
  });

  it("reads a User-agent line that starts the file after a byte-order mark", () => {
    const rules = parseRobots(`${String.fromCharCode(0xfeff)}User-agent: *\nDisallow: /x/\n`);
    expect(rules).toEqual([{ allow: false, path: "/x/", text: "Disallow: /x/", line: 2, agent: "*" }]);
  });

  it("parses a 500 KiB hostile line and matches a pattern of 40,000 stars, each in well under a second", () => {
    const line = `User-agent: *${" ".repeat(500 * 1024)}Disallow: /a${" allow".repeat(1000)}`;
    let start = performance.now();
    const rules = parseRobots(`${line}\n${"Disallow: /x".padEnd(500 * 1024, " ")}x\n`);
    expect(performance.now() - start).toBeLessThan(500);
    expect(rules.map((r) => r.path.slice(0, 2))).toEqual(["/a", "/x"]);
    const stars = parseRobots(`User-agent: *\nDisallow: /${"*".repeat(40_000)}b$\nDisallow: /${"*a".repeat(20_000)}$`);
    start = performance.now();
    expect(robotsAllows(stars, `/${"a".repeat(200_000)}`)).toBe(false);
    expect(robotsAllows(stars, `/${"c".repeat(200_000)}`)).toBe(true);
    expect(robotsAllows(stars, `/${"c".repeat(200_000)}b`)).toBe(false);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("allows everything for an empty Disallow and for an empty file", () => {
    expect(judge("User-agent: *\nDisallow:\n", ["/", "/a"]).disallowed).toEqual([]);
    expect(judge("", ["/", "/a"]).disallowed).toEqual([]);
  });

  it("reads the one-line file 'User-agent: * Disallow: /' as disallowing everything (UC's timetable host)", () => {
    expect(judge("User-agent: * Disallow: /", ["/", "/even/timetable/"]).allowed).toEqual([]);
  });
});

describe("robots.txt matching", () => {
  it("takes the longest match, and Allow on a tie", () => {
    const rules = parseRobots(["User-agent: *", "Disallow: /folder/", "Allow: /folder/page", "Disallow: /tie", "Allow: /tie", "Allow: /page", "Disallow: /*.html"].join("\n"));
    expect(robotsAllows(rules, "/folder/page")).toBe(true);
    expect(robotsAllows(rules, "/folder/other")).toBe(false);
    expect(robotsMatch(rules, "/folder/other")?.text).toBe("Disallow: /folder/");
    expect(robotsAllows(rules, "/tie")).toBe(true);
    expect(robotsMatch(rules, "/tie")?.text).toBe("Allow: /tie");
    // "/*.html" is longer than "/page".
    expect(robotsAllows(rules, "/page.html")).toBe(false);
    expect(robotsAllows(rules, "/page")).toBe(true);
  });

  it("is case-sensitive in paths, and matches from the start of the path", () => {
    expect(judge("User-agent: *\nDisallow: /Private", ["/Private/x", "/private/x", "/a/Private"])).toEqual({ allowed: ["/private/x", "/a/Private"], disallowed: ["/Private/x"] });
  });

  it("reads * as any characters and a last $ as the end of the path", () => {
    const rules = parseRobots(["User-agent: *", "Disallow: /*.pdf$", "Disallow: /*/drafts/", "Allow: /$", "Disallow: /"].join("\n"));
    expect(robotsAllows(rules, "/")).toBe(true);
    expect(robotsAllows(rules, "/index.html")).toBe(false);
    const pdf = parseRobots("User-agent: *\nDisallow: /*.pdf$\nDisallow: /a/*/drafts/");
    expect(robotsAllows(pdf, "/files/a.pdf")).toBe(false);
    expect(robotsAllows(pdf, "/files/a.pdf?download=1")).toBe(true);
    expect(robotsAllows(pdf, "/files/a.pdfx")).toBe(true);
    expect(robotsAllows(pdf, "/a/b/c/drafts/x")).toBe(false);
    expect(robotsAllows(pdf, "/a/drafts/x")).toBe(true);
  });

  it("matches a $ or * in the URL only by %24 or %2A in the pattern", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /path/file-with-a-%2A.html\nDisallow: /path/foo-%24\nDisallow: /mid$dle");
    expect(robotsAllows(rules, "/path/file-with-a-*.html")).toBe(false);
    expect(robotsAllows(rules, "/path/file-with-a-x.html")).toBe(true);
    expect(robotsAllows(rules, "/path/foo-$")).toBe(false);
    // A $ that is not last is a character, not the end.
    expect(robotsAllows(rules, "/mid$dle/x")).toBe(false);
  });

  it("matches a path with its query", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /*?a=\nDisallow: /search?\nAllow: /search?q=ok");
    expect(robotsAllows(rules, "/page?a=119658")).toBe(false);
    expect(robotsAllows(rules, "/page?b=1&a=2")).toBe(true);
    expect(robotsAllows(rules, "/search")).toBe(true);
    expect(robotsAllows(rules, "/search?q=x")).toBe(false);
    expect(robotsAllows(rules, "/search?q=ok")).toBe(true);
  });

  it("compares percent-encoding as RFC 9309 does", () => {
    // Non-ASCII in the pattern is encoded as UTF-8; the URL holds it encoded.
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /foo/bar/ツ"), "/foo/bar/%E3%83%84")).toBe(false);
    // Encoded in both, in either case of hex digit.
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /foo/bar/%e3%83%84"), "/foo/bar/%E3%83%84")).toBe(false);
    // %XX of an unreserved character is the character, on either side.
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /foo/bar/baz"), "/foo/bar/%62%61%7A")).toBe(false);
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /foo/bar/%62%61%7A"), "/foo/bar/baz")).toBe(false);
    // %XX of a reserved character is not the character.
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /a%2Fb"), "/a/b")).toBe(true);
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /a%2Fb"), "/a%2fb")).toBe(false);
    // A space in the pattern matches the %20 that a URL holds.
    expect(robotsAllows(parseRobots("User-agent: *\nDisallow: /a b"), "/a%20b")).toBe(false);
  });

  it("also reads a Disallow written like a regular expression, '.*', as '*', but not an Allow", () => {
    const rules = parseRobots("User-agent: *\nDisallow: /__data/.*\nDisallow: /x/\nAllow: /x/.*");
    expect(robotsAllows(rules, "/__data/assets/git_bridge/app.js")).toBe(false);
    expect(robotsAllows(rules, "/__data/.hidden")).toBe(false);
    expect(robotsAllows(rules, "/__datum")).toBe(true);
    expect(robotsAllows(rules, "/x/page")).toBe(false);
    expect(robotsAllows(rules, "/x/.page")).toBe(true);
  });
});
