// The list of schools that the deploy workflow builds and publishes (.github/schools.json).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseSchoolList } from "../scripts/lib/school-list.ts";

describe("the list of schools", () => {
  it("names schools that each have a descriptor and published data", () => {
    const ids = parseSchoolList(fs.readFileSync(".github/schools.json", "utf8"));
    expect(ids).toContain("uoa");
    for (const id of ids) {
      expect(fs.existsSync(path.join("src", "schools", id, "school.ts")), `src/schools/${id}/school.ts`).toBe(true);
      expect(fs.existsSync(path.join("public", "data", id)), `public/data/${id}/`).toBe(true);
    }
  });

  it("is read only as a JSON array of unique school ids", () => {
    expect(parseSchoolList('["uoa", "aut", "vuw-2"]\n')).toEqual(["uoa", "aut", "vuw-2"]);
    for (const bad of ["", "uoa", "{}", '"uoa"', "[]", "[1]", '["UoA"]', '["2uoa"]', '["uoa ", "aut"]', '["../x"]', '["a/b"]', '["aut;id"]', '["aut\\n::stop"]', '["$(id)"]', '["uoa","uoa"]'])
      expect(() => parseSchoolList(bad), bad).toThrow();
  });

  it("is printed by the workflow's script, which stops on a bad list", () => {
    const run = (file: string, ...flags: string[]) => execFileSync(process.execPath, ["scripts/school-list.ts", file, ...flags], { encoding: "utf8", stdio: "pipe" });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "school-list-"));
    try {
      const list = path.join(dir, "schools.json");
      fs.writeFileSync(list, '["uoa", "aut"]');
      expect(run(list)).toBe("uoa\naut\n");
      expect(run(list, "--others")).toBe("aut\n");
      expect(run(list, "--others", "--json")).toBe('["aut"]\n');
      fs.writeFileSync(list, '["uoa"]');
      expect(run(list, "--others")).toBe("\n");
      expect(run(list, "--others", "--json")).toBe("[]\n");
      fs.writeFileSync(list, '["uoa", "Bad id"]');
      expect(() => run(list)).toThrow(/not a school id/);
      expect(() => run(path.join(dir, "missing.json"))).toThrow();
      expect(() => run(list, "--all")).toThrow(/usage/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
