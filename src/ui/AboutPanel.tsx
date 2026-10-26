// About: the unofficial notice, data sources with snapshot dates, coverage, and known limitations.
import { useEffect, useRef } from "preact/hooks";
import { formatDate, intlLocale, lang, languages, setLang, t } from "../app/i18n.ts";
import { LANDMARKS, MEASURED, landmarkBuildings } from "../app/landmarks.ts";
import { INSPIRED_BY, LANDMARK_LIDAR, LINZ_ELEVATION_CREDIT, REPO } from "../app/links.ts";
import { data, panel } from "../app/state.ts";
import { aucklandWallTime } from "../shared/time.ts";
import { IconButton, Section, absentLayers, buildingTitle, noIndoor } from "./common.tsx";
import { WorldLink } from "./Travel.tsx";

const longDate: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export function AboutPanel() {
  const d = data.value;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  if (!d) return null;
  const c = d.meta.coverage;
  const n = (x: number) => x.toLocaleString(intlLocale());
  const pct = (x: number) => (c.sessions ? ` (${Math.round((x / c.sessions) * 100)}%)` : "");
  const available = d.schedule.available;
  // The buildings drawn in detail, and those measured and drawn by rule, by number and name.
  const named = (ids: string[]) =>
    new Intl.ListFormat(intlLocale(), { type: "conjunction" }).format(
      ids.map((id) => {
        const b = d.buildingById.get(id);
        return [id, b && buildingTitle(b)].filter(Boolean).join(" ");
      }),
    );
  // The layers the school's data says are absent (Meta.layers); the University of Auckland gives none.
  const absent = new Set(absentLayers(d).map((a) => a.layer));
  const buildingsOnly = noIndoor(d);
  const detailed = named(LANDMARKS.flatMap(landmarkBuildings));
  const measured = named(MEASURED.flatMap(landmarkBuildings));

  return (
    <div class="modal-wrap" onClick={(e) => e.target === e.currentTarget && (panel.value = "none")}>
      <div class="panel about-panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <div class="panel-head">
          <h2 id="about-title" tabIndex={-1} ref={heading}>
            {t("about.title")}
          </h2>
          <IconButton icon="close" label={t("nav.close")} class="ghost" onClick={() => (panel.value = "none")} />
        </div>
        <div class="panel-body prose">
          <div class="callout" id="unofficial-notice">
            <strong>{t("about.unofficialTitle")}</strong>
            <p>{t("about.unofficial")}</p>
          </div>

          <Section title={t("about.whatTitle")}>
            <p>{buildingsOnly ? t("about.whatBuildings") : available ? t("about.what") : t("about.whatNoTimetable")}</p>
          </Section>
          <Section title={t("about.howTitle")}>
            <p>{buildingsOnly ? t("about.howBuildings") : t("about.how")}</p>
          </Section>

          <Section title={t("about.sourcesTitle")}>
            <ul class="sources" id="data-sources">
              {d.meta.sources.map((s) => (
                <li>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.name}
                  </a>
                  <dl>
                    <dt>{t("about.sourceProvides")}</dt>
                    <dd>{s.provides}</dd>
                    <dt>{t("about.sourceSnapshot")}</dt>
                    <dd>
                      <time dateTime={s.snapshotDate}>{formatDate(s.snapshotDate, longDate)}</time>
                    </dd>
                    <dt>{t("about.sourceLicence")}</dt>
                    <dd>{s.licence}</dd>
                  </dl>
                </li>
              ))}
            </ul>
            <p id="osm-attribution">
              {t("about.osm")}{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                {t("about.osmLink")}
              </a>
            </p>
          </Section>

          {LANDMARKS.length + MEASURED.length > 0 && (
            <Section title={t("about.landmarksTitle")}>
              <p id="landmarks">{t("about.landmarks", { buildings: detailed })}</p>
              {MEASURED.length > 0 && <p id="measured">{t("about.measured", { buildings: measured })}</p>}
              <p id="landmark-links">
                <a href={LANDMARK_LIDAR} target="_blank" rel="noopener noreferrer">
                  {t("about.landmarksLidar")}
                </a>
                {" · "}
                <a href={LINZ_ELEVATION_CREDIT} target="_blank" rel="noopener noreferrer">
                  {t("about.landmarksCredit")}
                </a>
                {" · "}
                <a href={`${REPO}/tree/main/landmarks`} target="_blank" rel="noopener noreferrer">
                  {t("about.landmarksLink")}
                </a>
              </p>
            </Section>
          )}

          <Section title={t("about.coverageTitle")}>
            <table class="coverage" id="coverage">
              <tbody>
                <tr>
                  <th>{t("about.coverage.buildings")}</th>
                  <td>{n(c.buildings)}</td>
                </tr>
                <tr class="sub">
                  <th>{t("about.coverage.buildingsOnMap")}</th>
                  <td>{n(c.buildingsOnMap)}</td>
                </tr>
                {c.buildingsExcluded !== undefined && (
                  <tr class="sub">
                    <th>{t("about.coverage.buildingsExcluded")}</th>
                    <td>{n(c.buildingsExcluded)}</td>
                  </tr>
                )}
                {!absent.has("indoor") && (
                  <>
                    <tr>
                      <th>{t("about.coverage.rooms")}</th>
                      <td>{n(c.rooms)}</td>
                    </tr>
                    <tr>
                      <th>{t("about.coverage.indexedRooms")}</th>
                      <td>{n(c.indexedRooms)}</td>
                    </tr>
                    <tr>
                      <th>{t("about.coverage.planShapes")}</th>
                      <td>{n(c.planShapes)}</td>
                    </tr>
                  </>
                )}
                {!absent.has("subjects") && (
                  <tr>
                    <th>{t("about.coverage.subjects")}</th>
                    <td>{n(c.subjects)}</td>
                  </tr>
                )}
                {!absent.has("timetable") && (
                  <>
                    <tr>
                      <th>{t("about.coverage.courses")}</th>
                      <td>{n(c.courses)}</td>
                    </tr>
                    <tr>
                      <th>{t("about.coverage.sessions")}</th>
                      <td>{n(c.sessions)}</td>
                    </tr>
                  </>
                )}
                {available && (
                  <>
                    <tr class="sub">
                      <th>{t("about.coverage.sessionsRoom")}</th>
                      <td>
                        {n(c.sessionsLocatedToRoom)}
                        {pct(c.sessionsLocatedToRoom)}
                      </td>
                    </tr>
                    <tr class="sub">
                      <th>{t("about.coverage.sessionsFloor")}</th>
                      <td>
                        {n(c.sessionsLocatedToFloor)}
                        {pct(c.sessionsLocatedToFloor)}
                      </td>
                    </tr>
                    <tr class="sub">
                      <th>{t("about.coverage.sessionsBuilding")}</th>
                      <td>
                        {n(c.sessionsLocatedToBuilding)}
                        {pct(c.sessionsLocatedToBuilding)}
                      </td>
                    </tr>
                    <tr class="sub">
                      <th>{t("about.coverage.sessionsExcluded")}</th>
                      <td>{n(c.sessionsExcluded)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </Section>

          <Section title={t("about.limitsTitle")}>
            <ul class="limits" id="limitations">
              <li data-layer={absent.has("timetable") ? "timetable" : undefined}>
                {available
                  ? t("about.limits.timetableLoaded", { date: formatDate(d.schedule.snapshotDate ?? "", longDate) })
                  : t("about.limits.timetable")}
              </li>
              {!absent.has("timetable") && <li>{t("about.limits.scheduled")}</li>}
              <li data-layer={absent.has("indoor") ? "indoor" : undefined}>{t("about.limits.rooms")}</li>
              <li>{t("about.limits.heights", { height: d.campus.floorHeight })}</li>
              <li>{t("about.limits.campuses")}</li>
              <li>{t("about.limits.context")}</li>
              <li id="walker-limits">{t("about.limits.walker")}</li>
              <li data-layer={absent.has("calendar") ? "calendar" : undefined}>{t("about.limits.calendar")}</li>
              {absent.has("subjects") && <li data-layer="subjects">{t("about.limits.subjects")}</li>}
              <li>{t("about.limits.daylight")}</li>
            </ul>
          </Section>

          <Section title={t("about.privacyTitle")}>
            <p>{t("about.privacy")}</p>
          </Section>

          <Section title={t("about.inspirationTitle")}>
            <p id="inspiration">{t("about.inspiration")}</p>
            <p>
              <WorldLink world={INSPIRED_BY} />
            </p>
          </Section>

          <Section title={t("about.codeTitle")}>
            <p>
              {t("about.code")}{" "}
              <a href={REPO} target="_blank" rel="noopener noreferrer">
                {t("about.repo")}
              </a>
            </p>
            {languages.length > 1 && (
              <label class="lang">
                <span>{t("nav.language")}</span>
                <select value={lang.value} onChange={(e) => setLang((e.target as HTMLSelectElement).value)}>
                  {languages.map((l) => (
                    <option value={l.code}>{l.name}</option>
                  ))}
                </select>
              </label>
            )}
            <p class="built">{t("about.built", { date: formatDate(aucklandWallTime(new Date(d.meta.generatedAt)).date, longDate) })}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
