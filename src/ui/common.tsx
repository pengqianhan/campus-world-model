// Small shared pieces: icons, text helpers.
import { school } from "@school";
import type { ComponentChildren } from "preact";
import { formatDate, has, pick, t } from "../app/i18n.ts";
import type { AppData } from "../app/data.ts";
import { formatMinutes, weekdayKey } from "../shared/time.ts";
import { buildingCode, type Building, type Layer, type LayerVerdict, type Session } from "../shared/types.ts";
import { aboutHref, homeHref } from "../app/links.ts";
import { ICON_BOXES, ICON_LINES, ICON_PATHS } from "./icons.ts";

/**
 * About lives at the site's root, one section a school (scripts/lib/about.ts; the maintainer, 2026-11-10):
 * the address of this school's, which the attribution and the "why" links open.
 */
export const ABOUT_HREF = aboutHref(import.meta.env.BASE_URL, school.id);

/** The page at the site's root that lists every school's map (the maintainer, 2026-11-11: a way back to it from each). */
export const HOME_HREF = homeHref(import.meta.env.BASE_URL, school.id);

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const line = ICON_LINES[name];
  return (
    <svg class="icon" width={size} height={size} viewBox={ICON_BOXES[name] ?? "0 0 24 24"} aria-hidden="true" focusable="false">
      {line ? (
        <path d={line} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      ) : (
        <path d={ICON_PATHS[name] ?? ""} fill="currentColor" />
      )}
    </svg>
  );
}

export function IconButton(props: { icon: string; label: string; onClick: () => void; class?: string; text?: string; pressed?: boolean; id?: string }) {
  return (
    <button
      type="button"
      id={props.id}
      class={`btn ${props.class ?? ""}`}
      aria-label={props.label}
      title={props.label}
      aria-pressed={props.pressed}
      onClick={props.onClick}
    >
      <Icon name={props.icon} />
      {props.text && <span class="btn-text">{props.text}</span>}
    </button>
  );
}

/** A building's display name; plain "Building 113" names are not repeated after the number. */
export function buildingTitle(b: Building): string {
  const name = pick(b.name);
  return /^Building \d/.test(name) ? "" : name;
}

/** The code a building is known by (`buildingCode` in shared/types.ts, where the walker reads it too). */
export { buildingCode };

/** The layers in the order the site names them when they are absent. */
const ABSENT_ORDER: Layer[] = ["indoor", "timetable", "calendar", "subjects"];

/**
 * The layers the school's data says it cannot show (`Meta.layers`), with their verdicts. Empty for
 * a school whose meta.json gives no layers, as the University of Auckland's does not.
 */
export function absentLayers(d: AppData): { layer: Layer; verdict: Exclude<LayerVerdict, "usable"> }[] {
  const layers = d.meta.layers ?? {};
  return ABSENT_ORDER.flatMap((layer) => {
    const verdict = layers[layer];
    return verdict && verdict !== "usable" ? [{ layer, verdict }] : [];
  });
}

/**
 * True when none of the school's buildings has a code (buildingCode): its buildings come from
 * OpenStreetMap with no ref, as VUW's do, so the site names them by their names alone.
 */
export function noCodes(d: AppData): boolean {
  return d.campus.buildings.length > 0 && d.campus.buildings.every((b) => !buildingCode(b));
}

/** True when the school's data says it has no floors and rooms to show: the Buildings form. */
export function noIndoor(d: AppData): boolean {
  return absentLayers(d).some((a) => a.layer === "indoor");
}

/** True when the school's data says it shows no semester dates (`calendar.available: false`). */
export function noCalendar(d: AppData): boolean {
  return d.calendar.available === false;
}

export function campusName(d: AppData, id: string): string {
  return pick(d.campusById.get(id)?.name) || id;
}

export function componentName(code: string): string {
  const key = `session.component.${code}`;
  return has(key) ? t(key) : code;
}

export function sessionTimes(s: Session): string {
  return t("session.range", { start: formatMinutes(s.start), end: formatMinutes(s.end) });
}

export function sessionDay(s: Session): string {
  return t(`time.days.${weekdayKey(s.day)}`);
}

export function sessionDates(s: Session): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return t("session.dates", { start: formatDate(s.startDate, opts), end: formatDate(s.endDate, opts) });
}

export function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
