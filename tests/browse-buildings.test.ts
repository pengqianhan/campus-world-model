// The buildings Search offers before anything is typed (browseBuildings in src/app/searchIndex.ts).
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { browseBuildings } from "../src/app/searchIndex.ts";
import type { AppData } from "../src/app/data.ts";
import type { CampusData, Meta } from "../src/shared/types.ts";

function data(school: string): AppData {
  const campus = JSON.parse(fs.readFileSync(`public/data/${school}/campus.json`, "utf8")) as CampusData;
  const meta = JSON.parse(fs.readFileSync(`public/data/${school}/meta.json`, "utf8")) as Meta;
  return { campus, meta, campusById: new Map(campus.campuses.map((c) => [c.id, c])) } as unknown as AppData;
}

describe("browseBuildings", () => {
  it("offers the University of Auckland's buildings with learning spaces, and none on a campus that has none", () => {
    const d = data("uoa");
    const city = browseBuildings(d, "city");
    expect(city.length).toBe(12);
    for (const b of city) expect(b.roomCount).toBeGreaterThan(0);
    // Tai Tokerau and Ardmore have buildings but no learning spaces: the list stays empty, as its
    // heading ("Buildings with the most learning spaces") would not be true of any of them.
    for (const campus of ["tai-tokerau", "ardmore"]) {
      expect(d.campus.buildings.some((b) => b.campus === campus), campus).toBe(true);
      expect(browseBuildings(d, campus), campus).toEqual([]);
    }
  });

  it("offers a school in the Buildings form its buildings by code", () => {
    const d = data("aut");
    const list = browseBuildings(d, "city");
    expect(list.length).toBe(12);
    const codes = list.map((b) => b.ref ?? b.id);
    expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b, "en", { numeric: true })));
  });

  it("offers each of AUT's campuses away from the centre its own buildings, by code or by the name that is one", () => {
    const d = data("aut");
    for (const [campus, first] of [
      ["north", ["AA", "AB", "AF", "AG", "AH", "AJ", "AK", "AL", "AM", "AN", "AO", "AP"]],
      ["south", ["MA", "MB", "MC", "MD", "ME", "MF", "MG", "MH"]],
    ] as const) {
      const list = browseBuildings(d, campus);
      for (const b of list) expect(b.campus, b.id).toBe(campus);
      expect(list.map((b) => b.ref ?? b.name.en)).toEqual(first);
    }
  });
});
