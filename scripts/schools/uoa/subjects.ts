// The University of Auckland's subjects: its Calendar's "course codes by faculty" page
// (scripts/schools/uoa/fetch-calendar.ts), parsed into the list that search shows.
import type { Subject } from "../../../src/shared/types.ts";
import { hasSnapshot, readSnapshot } from "../../lib/snapshot.ts";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&rsquo;|&#39;/g, "'")
    .replace(/&ndash;/g, "–");
}

export function buildSubjects(): Subject[] {
  if (!hasSnapshot("uoa-calendar/courses.html")) return [];
  const html = readSnapshot("uoa-calendar/courses.html").toString("utf8");
  const subjects = new Map<string, Subject>();
  const section = /<h2 id="[^"]*">([^<]+)<\/h2>\s*<\/div>\s*<div class="text section">([\s\S]*?)<\/div>/g;
  for (let m = section.exec(html); m; m = section.exec(html)) {
    const faculty = decodeEntities(m[1]!).trim();
    const lines = m[2]!
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n");
    for (const raw of lines) {
      const line = decodeEntities(raw).replace(/\s+/g, " ").trim();
      const s = /^([A-ZĀĒĪŌŪ]{2,10})\s+[–-]\s+(.+)$/u.exec(line);
      if (!s) continue;
      const code = s[1]!;
      if (!subjects.has(code)) subjects.set(code, { code, name: { en: s[2]!.trim() }, faculty: { en: faculty } });
    }
  }
  return [...subjects.values()].sort((a, z) => a.code.localeCompare(z.code));
}
