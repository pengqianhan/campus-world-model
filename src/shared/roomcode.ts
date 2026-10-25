// Room codes look like "<building>-<room>": 303-G23, 260-098, 105S-039 at the University of
// Auckland. The school's descriptor holds its grammar (`roomCode` in src/schools/<id>/school.ts):
// the building number, an optional wing letter, the room part, the letters that name a floor, and
// the floor names that mean the same level. The parser here is shared, and each function that reads
// the grammar takes the descriptor as its first argument. The room part usually starts with the
// floor: a letter for ground/basement levels (G, B, SB, LG) or the leading digit(s).
//
// The campus map gives the true floor for every room it knows. The inference in this file is the
// fallback for codes the map does not know, and its results are labelled "inferred" in the UI.
import type { RoomCodeGrammar, School } from "./school.ts";

/** The part of a descriptor this file reads. */
export type RoomCodeSchool = Pick<School, "roomCode">;

export interface ParsedRoomCode {
  building: string;
  room: string;
  /** Canonical "<building>-<room>". */
  code: string;
}

interface Patterns {
  /** A whole room part. */
  roomPart: RegExp;
  /** A building part and a room part with a separator between them. */
  separated: RegExp;
  /** A building number, a wing letter or none, and the rest, with no separator. */
  joined: RegExp;
  /** A code inside longer text. It is global, so each search makes a copy of its own. */
  inText: RegExp;
  floorLetters: ReadonlySet<string>;
}

const patternCache = new WeakMap<RoomCodeGrammar, Patterns>();

/** The regular expressions of a school's grammar, made once for each descriptor. */
function patterns(grammar: RoomCodeGrammar): Patterns {
  let p = patternCache.get(grammar);
  if (!p) {
    const b = grammar.building.source;
    const w = grammar.wing.source;
    const r = grammar.room.source;
    p = {
      roomPart: new RegExp(`^(?:${r})$`),
      separated: new RegExp(`^(${b}(?:${w})?)\\s*[-._/\\s]\\s*([A-Z0-9][A-Z0-9.\\s]*)$`),
      joined: new RegExp(`^(${b})((?:${w})?)([A-Z0-9]+)$`),
      inText: new RegExp(`(${b}(?:${w})?)\\s*[-._/]\\s*(${r})\\b`, "g"),
      floorLetters: new Set(grammar.floorLetters),
    };
    patternCache.set(grammar, p);
  }
  return p;
}

function normalise(text: string): string {
  return text
    .toUpperCase()
    .replace(/[‐-―−]/g, "-")
    .trim();
}

/**
 * Parses free text such as "303-G23", "303 g23", "303.G23" or "303G23".
 * `knownBuildings` (building ids) resolves the wing-letter ambiguity in unseparated input.
 */
export function parseRoomCode(school: RoomCodeSchool, text: string, knownBuildings?: ReadonlySet<string>): ParsedRoomCode | null {
  const p = patterns(school.roomCode);
  const t = normalise(text);
  if (!t) return null;

  const sep = p.separated.exec(t);
  if (sep) {
    const building = sep[1]!;
    const room = sep[2]!.replace(/[\s.]/g, "");
    if (!p.roomPart.test(room)) return null;
    return { building, room, code: `${building}-${room}` };
  }

  const joined = p.joined.exec(t);
  if (!joined) return null;
  const digits = joined[1]!;
  const letter = joined[2]!;
  const rest = joined[3]!;
  const candidates: [string, string][] = [];
  if (letter) {
    const wing: [string, string] = [digits + letter, rest];
    const plain: [string, string] = [digits, letter + rest];
    const wingKnown = knownBuildings?.has(wing[0]) ?? false;
    const plainKnown = knownBuildings?.has(plain[0]) ?? false;
    if (wingKnown && !p.floorLetters.has(letter)) candidates.push(wing, plain);
    else if (plainKnown || !wingKnown) candidates.push(plain, wing);
    else candidates.push(wing, plain);
  } else {
    candidates.push([digits, rest]);
  }
  for (const [building, room] of candidates) {
    if (p.roomPart.test(room)) return { building, room, code: `${building}-${room}` };
  }
  return null;
}

/** Finds the first room-code-looking token inside longer text, e.g. a timetable location field. */
export function findRoomCode(school: RoomCodeSchool, text: string, knownBuildings?: ReadonlySet<string>): ParsedRoomCode | null {
  const t = normalise(text);
  const re = new RegExp(patterns(school.roomCode).inText);
  for (let m = re.exec(t); m; m = re.exec(t)) {
    const parsed = parseRoomCode(school, `${m[1]}-${m[2]}`, knownBuildings);
    if (parsed && (!knownBuildings || knownBuildings.has(parsed.building))) return parsed;
  }
  const whole = parseRoomCode(school, t, knownBuildings);
  return whole;
}

/**
 * Candidate floor names for a room part, most likely first.
 * "G23" -> ["G"], "B11" -> ["B"], "423" -> ["4"], "098" -> ["0"], "1012" -> ["10", "1"].
 */
export function floorCandidates(room: string): string[] {
  const m = /^([A-Z]*)(\d*)/.exec(room.toUpperCase());
  if (!m) return [];
  const letters = m[1]!;
  const digits = m[2]!;
  if (letters) return [letters];
  if (!digits) return [];
  if (digits.length <= 2) return ["0"];
  const strip = (s: string) => s.replace(/^0+(?=\d)/, "");
  const out = [strip(digits.slice(0, -2))];
  if (digits.length >= 4) out.push(strip(digits.slice(0, -3)));
  return out;
}

export interface FloorLike {
  i: number;
  name: string;
}

/** Matches a floor-name token against a building's floors, allowing the school's equivalent floor names. */
export function matchFloor<T extends FloorLike>(school: RoomCodeSchool, floors: readonly T[], token: string): T | null {
  const want = token.toUpperCase();
  const exact = floors.find((f) => f.name.toUpperCase() === want);
  if (exact) return exact;
  for (const group of school.roomCode.equivalentFloors) {
    if (!group.includes(want)) continue;
    for (const alt of group) {
      const f = floors.find((x) => x.name.toUpperCase() === alt);
      if (f) return f;
    }
  }
  return null;
}

/** Infers the floor of a room from its number alone. Returns null when nothing plausible matches. */
export function inferFloor<T extends FloorLike>(school: RoomCodeSchool, floors: readonly T[], room: string): T | null {
  for (const token of floorCandidates(room)) {
    const f = matchFloor(school, floors, token);
    if (f) return f;
  }
  return null;
}

/**
 * Comparison key for a room part that ignores zero padding: "G010" and "G10" give the same key,
 * as do "098" and "98". Timetables and door signs do not always pad the same way as the map.
 */
export function roomKey(room: string): string {
  const m = /^([A-Z]*)(\d*)(.*)$/.exec(room.toUpperCase());
  if (!m) return room.toUpperCase();
  return `${m[1]}${m[2]!.replace(/^0+(?=\d)/, "")}${m[3]}`;
}

/** Comparison key for a whole code, e.g. "114-G010" -> "114-G10". */
export function codeKey(code: string): string {
  const i = code.indexOf("-");
  return i < 0 ? code.toUpperCase() : `${code.slice(0, i).toUpperCase()}-${roomKey(code.slice(i + 1))}`;
}
