// The globe's arithmetic (src/globe/data.ts): where a place stands on the sphere, how the globe turns to face it,
// where it falls on the land's map, and the land as the globe draws it from Natural Earth.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { facing, landFromGeoJson, latLonToVector, mapPixel, middle } from "../src/globe/data.ts";

const near = (a: number[], b: number[]) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, 6));

describe("the globe's arithmetic", () => {
  it("puts a place on the unit sphere in the frame of three's SphereGeometry", () => {
    near(latLonToVector(0, 0), [1, 0, 0]);
    near(latLonToVector(90, 0), [0, 1, 0]);
    // east of Greenwich is toward -z, where the texture's u grows
    near(latLonToVector(0, 90), [0, 0, -1]);
    near(latLonToVector(0, -90), [0, 0, 1]);
  });

  it("turns the globe so that a place faces the viewer on +z", () => {
    for (const [lat, lon] of [[-36.85, 174.77], [40, 116.3], [51.5, -0.1], [0, 0]] as const) {
      const { yaw, pitch } = facing(lat, lon);
      let [x, y, z] = latLonToVector(lat, lon);
      // yaw about y, then pitch about x: three's Euler order XYZ
      [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
      [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
      near([x, y, z], [0, 0, 1]);
    }
  });

  it("finds a place on the equirectangular map of the land", () => {
    expect(mapPixel(90, -180, 2048, 1024)).toEqual([0, 0]);
    expect(mapPixel(0, 0, 2048, 1024)).toEqual([1024, 512]);
    expect(mapPixel(-90, 180, 2048, 1024)).toEqual([2048, 1024]);
  });

  it("faces the middle of the points first", () => {
    const m = middle([{ lat: 10, lon: 170 }, { lat: 10, lon: -170 }]);
    expect(m.lat).toBeCloseTo(10, 0);
    expect(Math.abs(m.lon)).toBeCloseTo(180, 4);
    expect(middle([])).toEqual({ lat: 0, lon: 0 });
  });

  it("draws the land from Natural Earth's 1:110m polygons, in tenths of a degree, every ring closed and kept", () => {
    const geo = JSON.parse(fs.readFileSync("data/raw/naturalearth/ne_110m_land.geojson", "utf8"));
    const land = landFromGeoJson(geo);
    expect(land.length).toBeGreaterThanOrEqual(geo.features.length);
    for (const ring of land) {
      expect(ring.length % 2).toBe(0);
      for (let i = 0; i < ring.length; i += 2) {
        expect(Math.abs(ring[i]!)).toBeLessThanOrEqual(1800);
        expect(Math.abs(ring[i + 1]!)).toBeLessThanOrEqual(900);
      }
    }
    expect(landFromGeoJson({ features: [{ geometry: { type: "MultiPolygon", coordinates: [[[[0, 0], [0, 0.01], [1, 0], [1, 1], [0, 0]]]] } }] })).toEqual([[0, 0, 10, 0, 10, 10, 0, 0]]);
  });
});
