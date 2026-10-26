// Prints the schools on a list of schools after it checks each id (scripts/lib/school-list.ts).
// The deploy workflow (.github/workflows/deploy.yml) uses it; a bad list stops it with an error.
//   node scripts/school-list.ts <list.json>                    one id a line
//   node scripts/school-list.ts <list.json> --others           the same, without the University of Auckland
//   node scripts/school-list.ts <list.json> --others --json    those ids as a JSON array, for a job matrix
import fs from "node:fs";
import { UOA, parseSchoolList } from "./lib/school-list.ts";

const [file, ...flags] = process.argv.slice(2);
const unknown = flags.filter((f) => f !== "--others" && f !== "--json");
if (!file || unknown.length) {
  console.error("usage: node scripts/school-list.ts <list.json> [--others] [--json]");
  process.exit(2);
}

let ids: string[];
try {
  ids = parseSchoolList(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`${file}: ${(e as Error).message}`);
  process.exit(1);
}
if (flags.includes("--others")) ids = ids.filter((id) => id !== UOA);
console.log(flags.includes("--json") ? JSON.stringify(ids) : ids.join("\n"));
