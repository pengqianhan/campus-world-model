// The school the pipeline works for (docs/schools/DESIGN.md, section 4): SCHOOL picks it, and the
// University of Auckland, uoa, is the default. Its descriptor is loaded by its path,
// src/schools/<SCHOOL>/school.ts, not through the app's `@school` alias, which the type check points
// at the University of Auckland's whatever SCHOOL says.
import type { School } from "../../src/shared/school.ts";

export const SCHOOL = process.env.SCHOOL || "uoa";
if (!/^[a-z][a-z0-9-]*$/.test(SCHOOL)) throw new Error(`SCHOOL is a school's id in lower case, such as uoa, not "${SCHOOL}"`);

export const school: School = ((await import(`../../src/schools/${SCHOOL}/school.ts`)) as { school: School }).school;
if (school.id !== SCHOOL) throw new Error(`src/schools/${SCHOOL}/school.ts names the school "${school.id}"`);
