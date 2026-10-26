// The surroundings from hand-written OpenStreetMap tags (scripts/lib/context.ts): a building that
// starts above the ground stands on its base, and a bridge with no base keeps its place undrawn.
import { describe, expect, it } from "vitest";
import { buildContext, type OsmElement } from "../scripts/lib/context.ts";
import { mapFrame } from "../scripts/lib/map-frame.ts";
import { decodeRing, makeUnprojector, ringCentroid } from "../src/shared/geo.ts";
import { drawnContext, type CampusData, type ContextBuilding } from "../src/shared/types.ts";

const origin = { lat: -36.85, lon: 174.77 };
const area = { id: "test", bbox: [-36.852, 174.767, -36.848, 174.773] as const, osm: "none.json" };
const frame = mapFrame(origin, area, [area]);
const unproject = makeUnprojector(origin);
const campus = { buildings: [] } as unknown as CampusData;

let nextId = 1;
/** A closed way, a 12 m by 10 m rectangle with its south-west corner `east` metres east of the origin. */
function way(east: number, tags: Record<string, string>): OsmElement {
  const corners: [number, number][] = [
    [east, 0],
    [east + 12, 0],
    [east + 12, 10],
    [east, 10],
    [east, 0],
  ];
  return { type: "way", id: nextId++, tags, geometry: corners.map(([x, y]) => unproject(x, y)).map(([lon, lat]) => ({ lon, lat })) };
}

/** The published building whose outline is centred on the rectangle drawn `east` metres east. */
function at(buildings: ContextBuilding[], east: number): ContextBuilding | undefined {
  return buildings.find((b) => Math.abs(ringCentroid(decodeRing(b.p))[0] - (east + 6)) < 1);
}

describe("surrounding buildings that start above the ground", () => {
  const elements = [
    // A bridge with min_height and height (way/867897492 in the central snapshot).
    way(0, { building: "yes", man_made: "bridge", min_height: "11", height: "13", "building:levels": "1", "building:min_level": "3" }),
    // A bridge with building:min_level and levels counted from the ground (way/321549478).
    way(40, { building: "bridge", "building:levels": "5", "building:min_level": "4" }),
    // A bridge with levels counted from its base (way/867897500).
    way(80, { building: "yes", man_made: "bridge", "building:levels": "2", "building:min_level": "3" }),
    // A bridge tagged building:min_levels, a spelling some mappers use (way/878087448).
    way(120, { building: "yes", man_made: "bridge", "building:levels": "1", "building:min_levels": "2" }),
    // Bridges with no base: the AUT skybridge (way/971820306) and a building=bridge (way/632021115).
    way(160, { building: "university", man_made: "bridge", operator: "AUT" }),
    way(200, { building: "bridge", "building:levels": "2" }),
    // Ordinary buildings, by levels and by default.
    way(240, { building: "yes", "building:levels": "3" }),
    way(280, { building: "yes" }),
    // A bridge marked only by its bridge tag (way/873328783, "Helicopter Access", at the hospital).
    way(-120, { building: "hospital", bridge: "yes", layer: "1" }),
    // A bridge whose base is too small to publish: the ground, so a bridge with no base.
    way(-80, { building: "yes", man_made: "bridge", min_height: "0.04" }),
  ];
  const { data, stats } = buildContext(campus, frame.boxes[0]!, frame, { elements });

  it("raise a bridge to its min_height", () => {
    expect(at(data.buildings, 0)).toMatchObject({ b: 11, h: 13, bridge: true });
  });
  it("raise a bridge to building:min_level storeys of 3.3 m, as a part", () => {
    // 4 storeys up; 5 levels from the ground are 16.5 m, and 1 m for the roof.
    expect(at(data.buildings, 40)).toMatchObject({ b: 13.2, h: 17.5, bridge: true });
  });
  it("stand levels on the base when they do not reach above it", () => {
    // 3 storeys up, then 2 storeys of its own and 1 m for the roof.
    expect(at(data.buildings, 80)).toMatchObject({ b: 9.9, h: 17.5 });
    expect(stats["context.buildings.raised.levelsFromBase"]).toBe(2);
  });
  it("read building:min_levels as building:min_level", () => {
    expect(at(data.buildings, 120)).toMatchObject({ b: 6.6, h: 10.9 });
    expect(stats["context.buildings.raised"]).toBe(4);
  });
  it("keep a bridge with no base in its place, marked, not drawn, and counted", () => {
    // In the order of the snapshot, so the shade the map gives each building by its place stays.
    expect(data.buildings.map((b) => Math.round(ringCentroid(decodeRing(b.p))[0] - 6))).toEqual([0, 40, 80, 120, 160, 200, 240, 280, -120, -80]);
    expect(data.buildings[4]).toEqual({ p: expect.any(Array), h: 6.5, bridge: true });
    expect(data.buildings[5]).toEqual({ p: expect.any(Array), h: 7.6, bridge: true });
    expect(data.buildings[8]).toEqual({ p: expect.any(Array), h: 6.5, bridge: true });
    expect(data.buildings[9]).toEqual({ p: expect.any(Array), h: 6.5, bridge: true });
    expect(data.buildings.map(drawnContext)).toEqual([true, true, true, true, false, false, true, true, false, false]);
    expect(stats["context.buildings.bridgeWithoutBase.notDrawn"]).toBe(4);
    expect(stats["context.buildings.raised"]).toBe(4);
  });
  it("leave an ordinary building on the ground, as before", () => {
    expect(at(data.buildings, 240)).toEqual({ p: expect.any(Array), h: 10.9 });
    expect(at(data.buildings, 280)).toEqual({ p: expect.any(Array), h: 6.5 });
  });
});
