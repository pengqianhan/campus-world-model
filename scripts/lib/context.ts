// The surroundings of each area of the map, from its OpenStreetMap snapshot (fetch-osm.ts):
// buildings and their parts with heights and roofs, streets, paths, rails, parks and trees. Shared
// by every school (docs/schools/DESIGN.md, section 4): the school's own buildings come from its
// campus adapter, and their OpenStreetMap copies are dropped here.
import {
  bbox,
  boundingRectangle,
  cleanRing,
  encodeRing,
  pointInRing,
  ringArea,
  ringCentroid,
  simplifyLine,
  simplifyRing,
  type Pt,
  type Ring,
} from "../../src/shared/geo.ts";
import type { AreaClass, CampusData, ContextBuilding, ContextData, ContextRoof, FlatRing, RoadClass, RoofShape } from "../../src/shared/types.ts";
import { inBox, type AreaBox, type MapFrame } from "./map-frame.ts";
import { readSnapshot } from "./snapshot.ts";

const readJson = <T>(file: string): T => JSON.parse(readSnapshot(file).toString("utf8")) as T;
const round1 = (n: number) => Math.round(n * 10) / 10;

interface OsmNodeRef {
  lat: number;
  lon: number;
}
export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: OsmNodeRef[];
  members?: { type: string; role: string; geometry?: OsmNodeRef[] }[];
}

const ROAD_CLASS: Record<string, RoadClass> = {
  motorway: "motorway",
  motorway_link: "motorway",
  trunk: "motorway",
  trunk_link: "motorway",
  primary: "major",
  primary_link: "major",
  secondary: "major",
  secondary_link: "major",
  tertiary: "major",
  tertiary_link: "major",
  residential: "street",
  unclassified: "street",
  living_street: "street",
  busway: "street",
  road: "street",
  service: "service",
  pedestrian: "path",
  footway: "path",
  path: "path",
  cycleway: "path",
  track: "path",
  steps: "steps",
};

/** Metres per level where OpenStreetMap gives levels and no height. */
const OSM_LEVEL = 3.3;
/** Parts covering at least this share of their building's outline stand in for it. */
const PARTS_REPLACE_OUTLINE = 0.9;
/** A ridge is drawn only on an outline that fills this share of its bounding rectangle. */
const RIDGE_MIN_FILL = 0.6;

/** OpenStreetMap roof shapes and the simplified shape each is drawn as. Others are drawn flat. */
const ROOF_SHAPES: Record<string, RoofShape> = {
  gabled: "gabled",
  "half-hipped": "gabled",
  gambrel: "gabled",
  hipped: "hipped",
  mansard: "hipped",
  crosspitched: "hipped",
  pyramidal: "pyramidal",
  dome: "dome",
  onion: "dome",
  round: "round",
  skillion: "skillion",
};

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function num(s: string | undefined): number | undefined {
  const n = parseFloat(s ?? "");
  return Number.isFinite(n) ? n : undefined;
}

/** A tagged height in metres; a height of zero or less is a mapping slip and counts as missing. */
function height(s: string | undefined): number | undefined {
  const n = num(s);
  return n !== undefined && n > 0 ? n : undefined;
}

/** A bearing in degrees from a number or a compass point. */
function bearing(s: string | undefined): number | undefined {
  const i = COMPASS.indexOf((s ?? "").toUpperCase());
  return i >= 0 ? i * 22.5 : num(s);
}

/** The roof an element's tags describe, sized to the outline it sits on. */
function roofOf(t: Record<string, string>, ring: Ring, bump: (k: string) => void): ContextRoof | undefined {
  const k = ROOF_SHAPES[t["roof:shape"] ?? ""];
  if (!k) return undefined;
  const box = boundingRectangle(ring);
  // A ridge over an L or a cross would send roof faces across the gap, so those stay flat.
  if ((k === "gabled" || k === "hipped" || k === "round") && ringArea(ring) < RIDGE_MIN_FILL * box.length * box.width) {
    bump("context.roofs.flatOnIrregularOutline");
    return undefined;
  }
  const levels = num(t["roof:levels"]);
  let h = num(t["roof:height"]) ?? (levels !== undefined ? levels * 3 : undefined);
  if (h === undefined || h <= 0) {
    h = k === "dome" || k === "pyramidal" ? box.width / 2 : k === "skillion" ? Math.min(2, box.width * 0.25) : Math.min(3.5, box.width * 0.3);
    bump("context.roofs.defaultHeight");
  }
  if (h < 0.2) return undefined;
  const roof: ContextRoof = { k, h: round1(h) };
  // roof:direction is the way a slope faces; some mappers put "along" or "across" in it.
  const word = t["roof:orientation"] ?? t["roof:direction"];
  const slope = bearing(t["roof:direction"]);
  if (k === "skillion") {
    if (slope !== undefined) roof.bearing = Math.round(slope);
  } else if (k !== "pyramidal" && k !== "dome") {
    if (word === "across") roof.across = true;
    else if (word !== "along" && slope !== undefined) {
      const rad = (slope * Math.PI) / 180;
      // The ridge runs across the long side when the slopes face along it.
      if (Math.abs(Math.sin(rad) * Math.cos(box.angle) + Math.cos(rad) * Math.sin(box.angle)) > 0.7) roof.across = true;
    }
  }
  bump(`context.roofs.${k}`);
  return roof;
}

function areaClass(t: Record<string, string>): AreaClass | undefined {
  if (t.natural === "water") return "water";
  if (t.natural === "wood" || t.landuse === "forest") return "wood";
  if (t.leisure === "pitch" || t.leisure === "track") return "pitch";
  if (t.leisure === "park" || t.leisure === "garden" || t.leisure === "playground") return "park";
  if (
    t.landuse === "grass" ||
    t.landuse === "village_green" ||
    t.landuse === "recreation_ground" ||
    t.landuse === "meadow" ||
    t.landuse === "cemetery" ||
    t.natural === "grassland" ||
    t.natural === "scrub"
  ) {
    return "grass";
  }
  return undefined;
}

/** Splits a polyline into the runs that lie inside the scene (plus a margin). */
function clipLine(line: Pt[], box: AreaBox, margin: number): Pt[][] {
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of line) {
    if (inBox(box, p, margin)) cur.push(p);
    else {
      if (cur.length >= 2) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length >= 2) runs.push(cur);
  return runs;
}

/** Outer rings of a way or multipolygon relation. Unclosed member ways are stitched end to end. */
export function outerRings(e: OsmElement, project: MapFrame["project"]): Ring[] {
  const toPts = (g: OsmNodeRef[]) => g.map((n) => project(n.lon, n.lat));
  if (e.type === "way" && e.geometry) {
    const pts = toPts(e.geometry);
    const a = pts[0];
    const z = pts[pts.length - 1];
    if (!a || !z || Math.hypot(a[0] - z[0], a[1] - z[1]) > 0.5) return [];
    return [cleanRing(pts)];
  }
  if (e.type !== "relation" || !e.members) return [];
  const open: Pt[][] = [];
  const rings: Ring[] = [];
  const near = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5;
  for (const m of e.members) {
    if (m.type !== "way" || !m.geometry || (m.role && m.role !== "outer")) continue;
    let seg = toPts(m.geometry);
    if (seg.length < 2) continue;
    if (near(seg[0]!, seg[seg.length - 1]!)) {
      rings.push(cleanRing(seg));
      continue;
    }
    // Stitch with any open chain that shares an endpoint.
    for (let i = 0; i < open.length; i++) {
      const chain = open[i]!;
      const head = chain[0]!;
      const tail = chain[chain.length - 1]!;
      if (near(tail, seg[0]!)) seg = [...chain, ...seg.slice(1)];
      else if (near(tail, seg[seg.length - 1]!)) seg = [...chain, ...seg.reverse().slice(1)];
      else if (near(head, seg[seg.length - 1]!)) seg = [...seg, ...chain.slice(1)];
      else if (near(head, seg[0]!)) seg = [...seg.reverse(), ...chain.slice(1)];
      else continue;
      open.splice(i, 1);
      i = -1;
    }
    if (near(seg[0]!, seg[seg.length - 1]!)) rings.push(cleanRing(seg));
    else open.push(seg);
  }
  return rings.filter((r) => r.length >= 3);
}

/** The surroundings of one area of the map, from its OpenStreetMap snapshot. */
export function buildContext(campus: CampusData, box: AreaBox, frame: MapFrame): { data: ContextData; stats: Record<string, number> } {
  const { project } = frame;
  const inScene = (p: Pt, margin = 0) => inBox(box, p, margin);
  const osm = readJson<{ elements: OsmElement[] }>(box.area.osm);
  const stats: Record<string, number> = {};
  // The central area's counts keep their old names; others are prefixed with the area.
  const prefix = box.area === frame.central ? "" : `${box.area.id}.`;
  const bump = (k: string, n = 1) => (stats[prefix + k] = (stats[prefix + k] ?? 0) + n);

  // University footprints, to drop the OSM copies of the same buildings.
  const uni = campus.buildings.map((b) => {
    const ring: Ring = [];
    const flat = b.outline[0]!;
    for (let i = 0; i < flat.length; i += 2) ring.push([flat[i]! / 10, flat[i + 1]! / 10]);
    return { ring, box: bbox(ring) };
  });
  const insideUni = (p: Pt) =>
    uni.some((u) => p[0] >= u.box[0] && p[0] <= u.box[2] && p[1] >= u.box[1] && p[1] <= u.box[3] && pointInRing(p, u.ring));

  const out: ContextData = {
    version: 1,
    origin: frame.origin,
    attribution: "© OpenStreetMap contributors, ODbL 1.0",
    buildings: [],
    roads: [],
    areas: [],
    rails: [],
    trees: [],
    deciduous: [],
  };

  // Building outlines are held back until their parts are known.
  interface Outline {
    ring: Ring;
    box: [number, number, number, number];
    area: number;
    tags: Record<string, string>;
    /** Height from the tags, a default, or a tower's podium. */
    h: number;
    /** True when `h` is the building's tagged height, which includes its roof. */
    tagged: boolean;
    tower: boolean;
    parts: ContextBuilding[];
    partArea: number;
  }
  const outlines: Outline[] = [];
  const partElements: OsmElement[] = [];

  for (const e of osm.elements) {
    const t = e.tags ?? {};

    if (e.type === "node") {
      if (t.natural === "tree" && e.lat != null && e.lon != null) {
        const p = project(e.lon, e.lat);
        // A tree tagged deciduous is kept apart, so the scene can bare it in winter.
        if (inScene(p) && !insideUni(p)) (t.leaf_cycle === "deciduous" ? out.deciduous : out.trees).push(Math.round(p[0] * 10), Math.round(p[1] * 10));
      }
      continue;
    }

    if (t.building && t.building !== "no") {
      if (t.location === "underground" || Number(t.layer) < 0) continue;
      for (const ring0 of outerRings(e, project)) {
        const ring = simplifyRing(ring0, 0.5);
        const area = ringArea(ring);
        if (area < 12) continue;
        const c = ringCentroid(ring);
        if (!inScene(c, 30)) continue;
        // Same building as a University footprint? Sample the outline and the centre.
        const samples = [c, ...ring];
        const hit = samples.filter(insideUni).length / samples.length;
        const uniCentreInside = uni.some((u) => pointInRing(ringCentroid(u.ring), ring));
        if (hit > 0.35 || uniCentreInside) {
          bump("context.buildings.droppedAsUniversity");
          continue;
        }
        const tagged = height(t.height);
        const levels = num(t["building:levels"]);
        let h = tagged ?? (levels !== undefined ? levels * OSM_LEVEL + 1 : undefined);
        if (h === undefined) {
          h = t.building === "roof" || t.building === "carport" || t.building === "shed" ? 3 : area > 900 ? 10 : 6.5;
          bump("context.buildings.defaultHeight");
        }
        // Masts and observation towers are tagged with their full height on a podium-sized
        // footprint; extruding that would draw a 300 m slab, so only the podium is kept. A tower
        // that is mapped in parts is drawn from its parts instead, further down.
        const tower = h > 200 || t.man_made === "tower" || t.building === "tower";
        if (tower) h = Math.min(h, 24);
        outlines.push({ ring, box: bbox(ring), area, tags: t, h, tagged: tagged !== undefined && !tower, tower, parts: [], partArea: 0 });
      }
      continue;
    }

    if (t["building:part"] && t["building:part"] !== "no") {
      partElements.push(e);
      continue;
    }

    if (t.highway && e.type === "way" && e.geometry) {
      const k = ROAD_CLASS[t.highway];
      if (!k) continue;
      if (t.tunnel && t.tunnel !== "no") continue;
      if (t.indoor === "yes" || t.area === "yes" || t.access === "private") continue;
      if ((k === "path" || k === "steps") && t.footway === "sidewalk") continue;
      const line = e.geometry.map((n) => project(n.lon, n.lat));
      for (const run of clipLine(line, box, 40)) {
        const simple = simplifyLine(run, k === "path" || k === "steps" ? 0.6 : 0.4);
        if (simple.length >= 2) out.roads.push({ k, p: encodeRing(simple) });
      }
      continue;
    }

    if (t.railway === "rail" && e.type === "way" && e.geometry) {
      if (t.tunnel && t.tunnel !== "no") continue;
      const line = e.geometry.map((n) => project(n.lon, n.lat));
      for (const run of clipLine(line, box, 40)) out.rails.push(encodeRing(simplifyLine(run, 0.5)));
      continue;
    }

    const k = areaClass(t);
    if (k) {
      for (const ring0 of outerRings(e, project)) {
        const ring = simplifyRing(ring0, 0.6);
        if (ringArea(ring) < 25) continue;
        const [x0, y0, x1, y1] = bbox(ring);
        if (x1 < box.x0 || x0 > box.x1 || y1 < box.y0 || y0 > box.y1) continue;
        out.areas.push({ k, p: encodeRing(ring) });
      }
    }
  }

  // Parts: where OpenStreetMap maps a building as several volumes, each with its own height.
  for (const e of partElements) {
    const t = e.tags ?? {};
    for (const ring0 of outerRings(e, project)) {
      const ring = simplifyRing(ring0, 0.3);
      const area = ringArea(ring);
      if (area < 0.5) continue;
      const c = ringCentroid(ring);
      if (!inScene(c, 30)) continue;
      if (insideUni(c)) {
        bump("context.parts.droppedAsUniversity");
        continue;
      }
      // The smallest outline around the part is its building.
      let holder: Outline | undefined;
      for (const o of outlines) {
        if (c[0] < o.box[0] || c[0] > o.box[2] || c[1] < o.box[1] || c[1] > o.box[3] || !pointInRing(c, o.ring)) continue;
        if (!holder || o.area < holder.area) holder = o;
      }
      const roof = roofOf(t, ring, bump);
      const tagged = height(t.height);
      const levels = num(t["building:levels"]);
      // A tagged height includes the roof; levels do not.
      let top = tagged !== undefined ? tagged - (roof?.h ?? 0) : levels !== undefined ? levels * OSM_LEVEL : undefined;
      if (top === undefined) {
        top = holder && !holder.tower ? holder.h : 6.5;
        bump("context.parts.heightFromBuilding");
      }
      const minLevel = num(t["building:min_level"]);
      let base = num(t.min_height) ?? (minLevel !== undefined ? minLevel * OSM_LEVEL : 0);
      // A part tagged as a roof is a canopy: a thin slab at its height.
      if (t["building:part"] === "roof") base = Math.max(base, top - 0.4);
      if (top < base + 0.3) top = base + 0.3;
      const part: ContextBuilding = { p: encodeRing(ring), h: round1(top), ...(base > 0 ? { b: round1(base) } : {}), ...(roof ? { roof } : {}) };
      if (holder) {
        holder.parts.push(part);
        // Only parts that stand on the ground cover the outline; stacked ones would count twice.
        if (base === 0) holder.partArea += area;
      } else {
        out.buildings.push(part);
        bump("context.parts.withoutOutline");
      }
    }
  }
  for (const o of outlines) {
    if (o.parts.length) {
      out.buildings.push(...o.parts);
      bump("context.parts", o.parts.length);
      if (o.partArea >= PARTS_REPLACE_OUTLINE * o.area) {
        bump("context.buildings.replacedByParts");
        continue;
      }
      // Parts cover only some of the outline: it stays as the base they stand on, no higher
      // than the lowest part that starts at the ground.
      const lowest = Math.min(...o.parts.filter((p) => !p.b).map((p) => p.h));
      out.buildings.push({ p: encodeRing(o.ring), h: round1(Math.min(o.h, lowest)) });
      bump("context.buildings.underParts");
      continue;
    }
    const roof = o.tower ? undefined : roofOf(o.tags, o.ring, bump);
    const top = roof && o.tagged ? Math.max(o.h - roof.h, 2) : o.h;
    out.buildings.push({ p: encodeRing(o.ring), h: round1(top), ...(roof ? { roof } : {}) });
  }

  // Largest areas first so small pitches and gardens draw on top of the parks that contain them.
  out.areas.sort((a, z) => ringArea(decode(z.p)) - ringArea(decode(a.p)));
  stats["context.buildings"] = out.buildings.length;
  stats["context.roads"] = out.roads.length;
  stats["context.areas"] = out.areas.length;
  stats["context.trees"] = out.trees.length / 2;
  return { data: out, stats };
}

function decode(flat: FlatRing): Ring {
  const r: Ring = [];
  for (let i = 0; i < flat.length; i += 2) r.push([flat[i]! / 10, flat[i + 1]! / 10]);
  return r;
}
