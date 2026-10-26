// The list of schools that the site holds: .github/schools.json, a JSON array of school ids
// (docs/schools/DESIGN.md, section 8). The deploy workflow reads it through scripts/school-list.ts.

/** A school's id: its own short name in lower case. vite.config.ts checks SCHOOL with the same rule. */
export const SCHOOL_ID = /^[a-z][a-z0-9-]*$/;

/** The University of Auckland. Its build goes into dist/, which is also the GitHub Pages copy. */
export const UOA = "uoa";

/** The schools on a list, in its order. Throws, with the fault, unless it is a JSON array of unique school ids. */
export function parseSchoolList(text: string): string[] {
  let list: unknown;
  try {
    list = JSON.parse(text);
  } catch {
    throw new Error("the list of schools is not JSON");
  }
  if (!Array.isArray(list) || list.length === 0) throw new Error("the list of schools is a JSON array with one school id or more");
  for (const id of list) {
    // JSON.stringify keeps a line break in a bad id from starting a new line in the CI log.
    if (typeof id !== "string" || !SCHOOL_ID.test(id)) throw new Error(`${JSON.stringify(id)} is not a school id: lower case letters, digits and "-", starting with a letter`);
  }
  const ids = list as string[];
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice !== undefined) throw new Error(`"${twice}" is on the list of schools twice`);
  return ids;
}
