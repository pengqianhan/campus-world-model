// Harbour-Night GTA HUD for Study Quest:
// Top-left 200px circular radar with Health/Energy/Stamina arcs, top-right Wanted Stars, Cash &
// Weapon/Pizza slot, top-center Timer & Radio ticker, bottom-center Prompt/Subtitles/Objective,
// bottom-right Campus Zone/Street blade & Speedometer, slide-in Phone drawer [T], Toast notes,
// and Harbour-Night Start/Pause/Debrief overlays.
// Strict i18n: every UI string and aria-label uses the locale dictionary.
import { useEffect, useRef, useState } from "preact/hooks";
import {
  gameAct,
  gameBanner,
  gameBest,
  gameCard,
  gameFeed,
  gameMenu,
  gameNewBest,
  gameSettings,
  gameTitle,
  gameView,
  dismissTitle,
  questGoal,
  questTitle,
  rankName,
  retryGame,
  setGameSettings,
  setMenu,
  stopGame,
} from "../app/game.ts";
import { sfx } from "../app/gameAudio.ts";
import { t } from "../app/i18n.ts";
import type { GameView } from "../scene/game.ts";
import { FOE_KINDS, GRADE, GRADE_FACTORS, RANKS, SKILLS, gradeFactors, type Lesson, type SkillId } from "../shared/game.ts";
import {
  GameRadar,
  type GtaBannerCard,
  type GtaHudView,
  type GtaNote,
  type GtaPhoneCmd,
  type GtaPhoneJob,
  type GtaRadarBlip,
  type OpenWorldHudView,
} from "./GameRadar.tsx";

const STAR_PATH = "M12 2.4l2.86 6.2 6.74.72-5.04 4.56 1.42 6.66L12 17.1l-5.98 3.44 1.42-6.66L2.4 9.32l6.74-.72z";
const SPEAKER_COLORS = ["#ffcb2e", "#2de2d0", "#ff7aa8", "#9db8ff", "#5cf28c", "#ff9f43", "#c38bff"];

const SKILL_ICON: Record<SkillId, string> = {
  strike: "M5 19l3-1 11-11-2-2L6 16l-1 3zm11.5-13.5l2 2 1.2-1.2a1 1 0 000-1.4l-.6-.6a1 1 0 00-1.4 0L16.5 5.5z",
  dodge: "M4 12l5-5v3h6V7l5 5-5 5v-3H9v3l-5-5z",
  flashcard: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 2.2c-2-.9-4.5-.8-6.5.2v9.8c2-.9 4.5-1 6.5-.1V6.2zm1.5 0v9.9c2-.9 4.5-.8 6.5.1V6.4c-2-1-4.5-1.1-6.5-.2z",
  sprint: "M4 6l6 6-6 6V6zm7 0l6 6-6 6V6zm7 0h2v12h-2V6z",
  eureka: "M12 2a6 6 0 00-3.5 10.9V16h7v-3.1A6 6 0 0012 2zm-3 16h6v2H9v-2zm1 3h4v1h-4v-1z",
};
const JUMP_ICON = "M12 3l6.5 6.5h-4.2V15H9.7V9.5H5.5L12 3zM5 18h14v2.5H5V18z";

const LESSON_KEY: Record<Lesson, string> = {
  move: "WASD",
  strike: "J",
  dodge: "Shift",
  jump: "Space",
  flashcard: "K",
  sprint: "Shift",
  eureka: "R",
};

const NOTE_GLYPH: Record<NonNullable<GtaNote["icon"]>, string> = {
  phone: "☎",
  cash: "$",
  star: "★",
  mission: "!",
  pizza: "▲",
  scooter: "⚡",
  security: "★",
};

type GameViewWithGta = GameView & { gta?: GtaHudView; openWorld?: OpenWorldHudView };

function fmtMoney(n: number): string {
  return Math.round(n).toLocaleString("en-NZ");
}

function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function JumpIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={JUMP_ICON} fill="currentColor" />
    </svg>
  );
}

function SkillIcon({ id, size = 22 }: { id: SkillId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={SKILL_ICON[id]} fill="currentColor" />
    </svg>
  );
}

function WeaponIcon({ weapon }: { weapon: "fists" | "textbook" }) {
  if (weapon === "textbook") {
    return (
      <svg class="g-weapon-icon" viewBox="0 0 64 24" aria-hidden="true">
        <rect x="14" y="4" width="36" height="16" rx="2.5" fill="currentColor" />
        <path d="M22 4v16M27 8h18M27 12h14" stroke="#05080f" stroke-width="1.8" fill="none" />
      </svg>
    );
  }
  return (
    <svg class="g-weapon-icon" viewBox="0 0 64 24" aria-hidden="true">
      <path d="M21 4.5h15.5a6.5 6.5 0 0 1 6.5 6.5v1.5a6.5 6.5 0 0 1-6.5 6.5H30l-3.4 3H20a2 2 0 0 1-2-2V6.5a2 2 0 0 1 3-2z" fill="currentColor" />
      <path d="M11 9h6.5v8.5H11z" fill="currentColor" />
      <path d="M24.6 4.8v7.4M30.4 4.8v7.4M36.2 5.2v7M18.4 12.6h9" stroke="#05080f" stroke-width="1.5" fill="none" />
    </svg>
  );
}

function SliceIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M12 2C7.8 2 4.1 3.7 2 6.5L12 22 22 6.5C19.9 3.7 16.2 2 12 2zm0 3.2c2.8 0 5.3 1 7 2.6l-.9 1.4c-1.5-1.3-3.7-2-6.1-2s-4.6.7-6.1 2L5 7.8c1.7-1.6 4.2-2.6 7-2.6zm-2 6.3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm4 2a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="6.5" y="2" width="11" height="20" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.9" />
      <path d="M10 18.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
  );
}

function mapLegacyBlip(b: OpenWorldHudView["blips"][number]): GtaRadarBlip {
  return { x: b.x, y: b.y, kind: b.kind };
}

/** Builds a GtaHudView from GameView + legacy OpenWorldHudView if `v.gta` is not yet provided. */
function resolveGta(v: GameViewWithGta): GtaHudView {
  if (v.gta) return v.gta;
  const ow = v.openWorld;
  const main = v.quests.find((q) => q.main);
  const act = ow?.activity;
  const objective = act
    ? `${t(`game.activity.${act.key}.title`)} · ${t(`game.activity.${act.key}.${act.stage}`)}`
    : main
      ? `${questTitle(main)} · ${questGoal(main)}`
      : undefined;
  const prompt = ow?.nearSpot
    ? {
        key: t("game.hud.sliceKey"),
        text: t(ow.nearSpot.kind === "pizzaCart" ? "game.openWorld.spotPizza" : "game.openWorld.spotClub", { place: ow.nearSpot.placeName }),
        action: "interact",
      }
    : v.lesson
      ? { key: LESSON_KEY[v.lesson], text: t(`game.prompt.${v.lesson}`) }
      : undefined;

  return {
    health: v.focus,
    maxHealth: v.maxFocus,
    armour: ow && ow.pizzaBuff > 0 ? Math.round(ow.pizzaBuff * 100) : 0,
    maxArmour: 100,
    stamina: v.stamina,
    maxStamina: v.maxStamina,
    wanted: ow?.heat ?? 0,
    wantedMax: 5,
    evading: false,
    cash: ow?.cred ?? 0,
    weapon: v.skills.some((s) => s.id === "flashcard" && s.open) ? "textbook" : "fists",
    hasTextbook: v.skills.some((s) => s.id === "flashcard" && s.open),
    pizzaSlices: ow?.pizzasEaten ?? 0,
    pizzaBuffSec: ow?.pizzaSeconds ?? 0,
    yaw: ow?.yaw ?? 0,
    buildings: ow?.buildings ?? [],
    blips: (ow?.blips ?? []).map(mapLegacyBlip),
    timer: act?.timer !== undefined ? { seconds: act.timer, label: t(`game.activity.${act.key}.title`), urgent: act.timer <= 10 } : undefined,
    prompt,
    objective,
    place: main?.place ? { zone: main.place } : undefined,
  };
}

function sendPhoneAction(gta: GtaHudView, cmd: GtaPhoneCmd): void {
  if (gta.onPhoneAction) {
    gta.onPhoneAction(cmd);
    return;
  }
  window.dispatchEvent(new CustomEvent("sq:phone", { detail: cmd }));
}

function WantedAndCash({
  gta,
  phoneOpen,
  onTogglePhone,
  touch,
}: {
  gta: GtaHudView;
  phoneOpen: boolean;
  onTogglePhone: () => void;
  touch: boolean;
}) {
  const [delta, setDelta] = useState<{ sum: number; shown: boolean }>({ sum: 0, shown: false });
  const prevCash = useRef<number | undefined>(undefined);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    if (prevCash.current === undefined) {
      prevCash.current = gta.cash;
      return;
    }
    const diff = gta.cashDelta !== undefined && gta.cashDeltaKey !== undefined ? gta.cashDelta : gta.cash - prevCash.current;
    prevCash.current = gta.cash;
    if (!diff) return;
    setDelta((d) => ({ sum: d.shown ? d.sum + diff : diff, shown: true }));
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setDelta({ sum: 0, shown: false }), 2600);
  }, [gta.cash, gta.cashDelta, gta.cashDeltaKey]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const maxStars = Math.max(1, Math.min(5, gta.wantedMax ?? 5));
  const wantedLevel = Math.max(0, Math.min(maxStars, Math.round(gta.wanted)));
  const arrest = Math.max(0, Math.min(1, gta.arrestProgress ?? 0));
  const showWeapon = !gta.vehicle;

  return (
    <div class="g-corner g-tr">
      {showWeapon && (
        <div class="g-weapon is-shown" data-kind={gta.weapon}>
          <WeaponIcon weapon={gta.weapon} />
          <div class="g-weapon-meta">
            <span class="g-weapon-name">{t(`game.weapon.${gta.weapon}`)}</span>
            {gta.hasTextbook && (
              <span class="g-weapon-pips" aria-hidden="true">
                <i class={gta.weapon === "fists" ? "is-on" : ""} />
                <i class={gta.weapon === "textbook" ? "is-on" : ""} />
              </span>
            )}
          </div>
          <button
            type="button"
            class={`g-slice-pill ${gta.pizzaSlices > 0 ? "has-slice" : ""} ${(gta.pizzaBuffSec ?? 0) > 0 ? "is-buff" : ""}`}
            aria-label={t("game.hud.slicesTitle", { count: gta.pizzaSlices })}
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "g", bubbles: true }))}
          >
            <SliceIcon size={13} />
            <b>{t("game.hud.slices", { count: gta.pizzaSlices })}</b>
            {gta.pizzaSlices > 0 && !touch && <kbd class="g-kbd">{t("game.hud.sliceKey")}</kbd>}
            {(gta.pizzaBuffSec ?? 0) > 0 && <em>{t("game.hud.sliceBuff", { seconds: Math.ceil(gta.pizzaBuffSec!) })}</em>}
          </button>
        </div>
      )}

      <div class="g-trcol">
        <div
          class={`g-wanted is-shown ${wantedLevel > 0 ? "is-active" : ""} ${gta.evading && wantedLevel > 0 ? "is-evading" : ""}`}
          id="game-heat"
          role="img"
          aria-label={t("game.hud.wantedLevel", { level: wantedLevel })}
        >
          {Array.from({ length: maxStars }, (_, i) => (
            <svg class={`g-star ${i < wantedLevel ? "is-on" : ""}`} viewBox="0 0 24 24" aria-hidden="true" key={i}>
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>

        <div class={`g-arrest ${arrest > 0 ? "is-on" : ""}`}>
          <span class="g-arrest-label">{t("game.hud.cuffs")}</span>
          <span class="g-arrest-bar">
            <span style={{ transform: `scaleX(${arrest})` }} />
          </span>
        </div>

        <div class="g-money" id="game-cred">
          <span class="g-cur">{t("game.hud.currency")}</span>
          <span class="g-amt">{fmtMoney(gta.cash)}</span>
        </div>

        <div class={`g-delta ${delta.shown ? "is-on" : ""}`} data-sign={delta.sum >= 0 ? "up" : "down"}>
          {delta.shown ? `${delta.sum >= 0 ? "+" : "−"}${t("game.hud.currency")}${fmtMoney(Math.abs(delta.sum))}` : ""}
        </div>
      </div>

      <div class="g-tr-actions">
        <button
          type="button"
          class={`g-tr-btn g-phone-btn ${phoneOpen ? "is-open" : ""}`}
          id="game-phone-btn"
          aria-label={t("game.phone.open")}
          aria-expanded={phoneOpen}
          onClick={onTogglePhone}
        >
          <PhoneIcon size={18} />
          {!touch && <kbd class="g-kbd">{t("game.phone.key")}</kbd>}
          {gta.phoneUnread && <i class="g-unread-dot" aria-hidden="true" />}
        </button>

        <button
          type="button"
          class="g-tr-btn g-pause-btn"
          id="game-pause"
          aria-label={t("game.hud.pause")}
          onClick={() => setMenu("pause")}
        >
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function TopCenter({ gta }: { gta: GtaHudView }) {
  if (!gta.timer && !gta.radio) return null;
  const urgent = gta.timer ? gta.timer.urgent ?? gta.timer.seconds <= 10 : false;
  return (
    <div class="g-tc">
      {gta.timer && (
        <div class={`g-timer ${urgent ? "is-urgent" : ""}`}>
          {gta.timer.label && <span class="g-timer-label">{gta.timer.label}</span>}
          <span class="g-timer-time">{fmtClock(gta.timer.seconds)}</span>
        </div>
      )}
      {gta.radio && (
        <div class={`g-radio ${gta.radio.off ? "is-off" : ""}`} key={gta.radio.key ?? gta.radio.id}>
          <span class="g-radio-kicker">
            <kbd class="g-kbd">{t("game.hud.radioKey")}</kbd> {t("game.hud.radio")}
          </span>
          <b class="g-radio-name">{gta.radio.off ? t("game.hud.radioOff") : gta.radio.name}</b>
          {gta.radio.genre && !gta.radio.off && <span class="g-radio-genre">{gta.radio.genre}</span>}
        </div>
      )}
    </div>
  );
}

function BottomCenter({ gta, touch }: { gta: GtaHudView; touch: boolean }) {
  const speakerColor = gta.subtitle ? SPEAKER_COLORS[(gta.subtitle.colorIdx ?? 0) % SPEAKER_COLORS.length] : undefined;
  return (
    <div class="g-bc">
      {gta.prompt && (
        <button
          type="button"
          class="g-prompt"
          id="game-prompt"
          data-lesson={gta.prompt.action ?? "prompt"}
          onClick={() => {
            const k = gta.prompt?.key?.toLowerCase();
            if (k && k.length === 1) window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
          }}
        >
          {!touch && gta.prompt.key && <kbd class="g-kbd">{gta.prompt.key}</kbd>}
          <span>{gta.prompt.text}</span>
        </button>
      )}
      {gta.subtitle && (
        <div class="g-sub" id="game-sub" role="status">
          {gta.subtitle.who && (
            <b class="g-sub-who" style={{ color: speakerColor }}>
              {gta.subtitle.who}
            </b>
          )}
          <span>{gta.subtitle.text}</span>
        </div>
      )}
      {gta.objective && (
        <div class="g-objective" id="game-objective">
          <span class="g-objective-kicker">{t("game.hud.objective")}</span>
          <span class="g-objective-text">{gta.objective}</span>
        </div>
      )}
    </div>
  );
}

function BottomRight({ gta }: { gta: GtaHudView }) {
  const v = gta.vehicle;
  const p = gta.place;
  if (!v && !p?.zone && !p?.street) return null;
  const gearText = v
    ? v.kind === "mecha"
      ? v.gear
      : v.kind === "scooter"
        ? t("game.hud.gearE")
        : v.gear === "R"
          ? t("game.hud.gearR")
          : v.gear === "N"
            ? t("game.hud.gearN")
            : t("game.hud.gear", { gear: v.gear })
    : "";
  const rpm = Math.max(0, Math.min(1, v?.rpm ?? 0));
  const vhp = Math.max(0, Math.min(1, v?.health ?? 1));
  return (
    <div class="g-corner g-br">
      {(p?.zone || p?.street) && (
        <div class={`g-place is-on ${!p.zone ? "is-street" : ""}`} id="game-place">
          {p.zone && <div class="g-place-name">{p.zone}</div>}
          {p.street && <div class="g-place-street">{p.street}</div>}
        </div>
      )}
      {v && (
        <>
          <div class="g-vehname is-on">{v.name}</div>
          <div class="g-speedo is-on" id="game-speedo">
            <div class="g-speed-row">
              <span class="g-speed">{Math.round(v.kmh)}</span>
              <span class="g-unit">{t("game.hud.kmh")}</span>
            </div>
            <div class={`g-rev ${v.kind !== "scooter" && rpm > 0.9 ? "is-red" : ""}`}>
              <span class="g-rev-fill" style={{ transform: `scaleX(${rpm})` }} />
            </div>
            <div class="g-speed-meta">
              <span class="g-gear">{gearText}</span>
              {v.kind !== "scooter" && (
                <span class="g-vdmg" data-state={v.state ?? "ok"}>
                  <span>{t("game.hud.body")}</span>
                  <span class="g-vdmg-bar">
                    <span style={{ transform: `scaleX(${vhp})` }} />
                  </span>
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Notes({ gta }: { gta: GtaHudView }) {
  const feed = gameFeed.value;
  const notes: GtaNote[] = gta.notes
    ? [...gta.notes].slice(0, 3)
    : feed.slice(-3).map((l) => ({
        id: l.id,
        icon: l.kind === "kill" ? "star" : "mission",
        title: l.text,
        text: l.value,
      }));
  return (
    <div class="g-notes" aria-live="polite">
      {notes.map((n) => (
        <div class="g-note" key={n.id}>
          <div class="g-note-icon" aria-hidden="true">
            {n.icon ? NOTE_GLYPH[n.icon] : "!"}
          </div>
          <div class="g-note-body">
            <b class="g-note-title">{n.title}</b>
            {n.text && <p class="g-note-text">{n.text}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhoneDrawer({ gta, onClose }: { gta: GtaHudView; onClose: () => void }) {
  const jobs = gta.jobs ?? [];
  const active = jobs.find((j) => j.status === "active");
  const stories = jobs.filter((j) => j.kind === "story");
  const sides = jobs.filter((j) => j.kind === "side");
  const canPizza = gta.cash >= 12;

  const jobTitle = (j: GtaPhoneJob) => (j.titleKey ? t(j.titleKey) : j.title ?? j.id);
  const jobBlurb = (j: GtaPhoneJob) => (j.blurbKey ? t(j.blurbKey) : j.blurb ?? "");
  const statusLabel = (s: GtaPhoneJob["status"]) =>
    s === "active"
      ? t("game.phone.statusActive")
      : s === "done"
        ? t("game.phone.statusDone")
        : s === "locked"
          ? t("game.phone.statusLocked")
          : t("game.phone.statusAvailable");

  const stats = gta.stats ?? [
    { label: t("game.phone.statCash"), value: `${t("game.hud.currency")}${fmtMoney(gta.cash)}` },
    { label: t("game.phone.statWanted"), value: String(gta.wanted) },
    { label: t("game.phone.statSlices"), value: String(gta.pizzaSlices) },
  ];

  return (
    <div class="g-listmenu g-phone" id="game-phone" role="dialog" aria-label={t("game.phone.title")}>
      <div class="g-list-head">
        <button type="button" class="g-list-close" aria-label={t("game.phone.close")} onClick={onClose} />
        <div class="g-list-title">{t("game.phone.title")}</div>
        <div class="g-list-sub">{active ? t("game.phone.subActive", { title: jobTitle(active) }) : t("game.phone.subIdle")}</div>
      </div>

      <div class="g-list-items">
        {active && (
          <button
            type="button"
            class="g-list-item is-abort"
            onClick={() => {
              sendPhoneAction(gta, { type: "abort", targetId: active.id });
              onClose();
            }}
          >
            <span class="g-list-label">{t("game.phone.abortJob")}</span>
            <span class="g-list-price is-dear">{t("game.phone.statusActive")}</span>
            <span class="g-list-item-detail">{t("game.phone.abortDetail")}</span>
          </button>
        )}

        <div class="g-phone-sec">{t("game.phone.services")}</div>
        <button
          type="button"
          class={`g-list-item ${canPizza ? "" : "is-disabled"}`}
          disabled={!canPizza}
          onClick={() => {
            sendPhoneAction(gta, { type: "orderPizza" });
            onClose();
          }}
        >
          <span class="g-list-label">{t("game.phone.orderPizza")}</span>
          <span class={`g-list-price ${canPizza ? "" : "is-dear"}`}>{t("game.phone.orderPizzaPrice")}</span>
          <span class="g-list-item-detail">{t("game.phone.orderPizzaDetail")}</span>
        </button>

        <button
          type="button"
          class="g-list-item"
          onClick={() => {
            sendPhoneAction(gta, { type: "shuttle" });
            onClose();
          }}
        >
          <span class="g-list-label">{t("game.phone.callScooter")}</span>
          <span class="g-list-price">{t("game.phone.callScooterPrice")}</span>
          <span class="g-list-item-detail">{t("game.phone.callScooterDetail")}</span>
        </button>

        <button
          type="button"
          class="g-list-item"
          onClick={() => {
            sendPhoneAction(gta, { type: "callMecha" });
            onClose();
          }}
        >
          <span class="g-list-label">{t("game.phone.callMecha")}</span>
          <span class="g-list-price">{t("game.phone.callMechaPrice")}</span>
          <span class="g-list-item-detail">{t("game.phone.callMechaDetail")}</span>
        </button>

        <div class="g-phone-sec">{t("game.phone.story")}</div>
        {stories.length === 0 && <div class="g-phone-empty">{t("game.phone.noJobs")}</div>}
        {stories.map((j) => (
          <button
            type="button"
            key={j.id}
            class={`g-list-item ${j.status === "locked" ? "is-disabled" : ""}`}
            disabled={j.status === "locked"}
            onClick={() => {
              sendPhoneAction(gta, { type: j.status === "available" ? "start" : "gps", targetId: j.id });
              onClose();
            }}
          >
            <span class="g-list-label">{jobTitle(j)}</span>
            <span class="g-list-price">{statusLabel(j.status)}</span>
            <span class="g-list-item-detail">
              {j.giver ? `${j.giver} · ` : ""}
              {jobBlurb(j)}
            </span>
          </button>
        ))}

        {sides.length > 0 && (
          <>
            <div class="g-phone-sec">{t("game.phone.hustles")}</div>
            {sides.map((j) => (
              <button
                type="button"
                key={j.id}
                class={`g-list-item ${j.status === "locked" ? "is-disabled" : ""}`}
                disabled={j.status === "locked"}
                onClick={() => {
                  sendPhoneAction(gta, { type: "gps", targetId: j.id });
                  onClose();
                }}
              >
                <span class="g-list-label">{jobTitle(j)}</span>
                <span class="g-list-price">{j.rewardCash ? t("game.phone.reward", { cash: j.rewardCash }) : statusLabel(j.status)}</span>
                <span class="g-list-item-detail">
                  {jobBlurb(j)}
                  {j.bestTime !== undefined ? ` · ${t("game.phone.bestTime", { seconds: j.bestTime.toFixed(1) })}` : ""}
                </span>
              </button>
            ))}
          </>
        )}

        <div class="g-phone-sec">{t("game.phone.stats")}</div>
        <dl class="g-phone-stats">
          {stats.map((s) => (
            <div class="g-phone-stat" key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div class="g-list-foot">
        <span>{t("game.phone.setGps")}</span>
        <span class="g-list-money">
          {t("game.hud.currency")}
          {fmtMoney(gta.cash)}
        </span>
      </div>
    </div>
  );
}

function CardBanner({ gta }: { gta: GtaHudView }) {
  const b = gameBanner.value;
  const card = gameCard.value;
  const gCard: GtaBannerCard | undefined = gta.card
    ? gta.card
    : b
      ? {
          id: b.id,
          style: (b.kind as string) === "missionPass" ? "passed" : b.kind === "wave" || b.kind === "phase" ? "mission" : "passed",
          kicker: b.kind === "rank" ? t("game.rankUp") : undefined,
          title: b.title,
          sub: b.sub,
        }
      : card
        ? {
            id: card.id,
            style: "mission",
            kicker: t(card.kind === "boss" ? "game.bossEyebrow" : "game.foeEyebrow"),
            title: card.title,
            sub: card.sub,
            quip: card.quote,
          }
        : undefined;
  if (!gCard) return null;
  return (
    <div class="g-card is-in" id="game-banner" data-style={gCard.style} key={gCard.id} role="status">
      {gCard.style === "busted" && <span class="g-card-band" aria-hidden="true" />}
      {gCard.kicker && <span class="g-card-kicker">{gCard.kicker}</span>}
      <strong class="g-card-title">{gCard.title}</strong>
      {gCard.sub && <span class="g-card-sub">{gCard.sub}</span>}
      {gCard.rewardCash !== undefined && gCard.rewardCash > 0 && (
        <span class="g-card-reward">{t("game.card.rewardCash", { cash: fmtMoney(gCard.rewardCash) })}</span>
      )}
      {gCard.stats && gCard.stats.length > 0 && (
        <dl class="g-card-stats">
          {gCard.stats.map((s) => (
            <div class="g-card-stat" key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {gCard.quip && <span class="g-card-quip">{gCard.quip}</span>}
    </div>
  );
}

function TouchPad({ v, gta }: { v: GameView; gta: GtaHudView }) {
  const sprint = v.skills.find((s) => s.id === "sprint")!;
  const slots = v.skills.filter((s) => s.id !== (sprint.open ? "dodge" : "sprint"));
  return (
    <div class="sq-pad" role="group" aria-label={t("game.skills")}>
      {slots.map((s) => (
        <button
          type="button"
          key={s.id}
          class={`sq-btn sk-${s.id} ${s.open ? "" : "locked"} ${s.id === "eureka" && s.ready >= 1 ? "full" : ""}`}
          id={`game-${s.id}`}
          aria-label={t(`game.skill.${s.id}.name`)}
          disabled={!s.open}
          style={{ "--cd": String(s.ready) }}
          onPointerDown={(e) => {
            e.preventDefault();
            gameAct(s.id === "flashcard" ? "card" : s.id === "sprint" ? "dodge" : (s.id as "strike" | "dodge" | "eureka"));
          }}
        >
          <SkillIcon id={s.id} size={s.id === "strike" ? 34 : 24} />
        </button>
      ))}
      <button
        type="button"
        class="sq-btn sk-jump"
        id="game-jump"
        aria-label={gta.vehicle ? t("game.touch.exit") : t("game.jump")}
        onPointerDown={(e) => {
          e.preventDefault();
          if (gta.vehicle) window.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
          else gameAct("jump");
        }}
      >
        <JumpIcon size={26} />
      </button>
    </div>
  );
}

function Title({ touch }: { touch: boolean }) {
  return (
    <div class="sq-title" id="game-title" onPointerDown={dismissTitle}>
      <div class="sq-title-main">
        <span class="sq-eyebrow">
          <span class="sq-tag">{t("game.tag")}</span>
          {t("game.eyebrow")}
        </span>
        <h2 class="sq-word">{t("game.title")}</h2>
        <p class="sq-premise">{t("game.premise")}</p>
        <p class="sq-note">{t("game.madeUp")}</p>
        <p class="sq-press">{t(touch ? "game.tapToBegin" : "game.pressToBegin")}</p>
      </div>
    </div>
  );
}

function Volume({ id, label, value, on, set }: { id: string; label: string; value: number; on: boolean; set: (v: number) => void }) {
  const pct = Math.round(value * 100);
  return (
    <label class={`sq-vol ${on ? "" : "off"}`} for={id}>
      <span class="sq-vol-k">{label}</span>
      <input
        type="range"
        id={id}
        min={0}
        max={100}
        step={5}
        value={pct}
        style={{ "--v": `${pct}%` }}
        aria-valuetext={`${pct}%`}
        onInput={(e) => set(Number((e.target as HTMLInputElement).value) / 100)}
        onChange={() => sfx("uiMove")}
      />
      <em>{pct}</em>
    </label>
  );
}

function trapTab(e: KeyboardEvent): void {
  if (e.key !== "Tab") return;
  const root = e.currentTarget as HTMLElement;
  const els = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
  if (!els.length) return;
  const first = els[0]!;
  const last = els[els.length - 1]!;
  const at = document.activeElement;
  if (!root.contains(at)) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && at === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && at === last) {
    e.preventDefault();
    first.focus();
  }
}

function PauseMenu({ touch }: { touch: boolean }) {
  const s = gameSettings.value;
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  const opened = useRef(performance.now());
  const move = () => {
    if (performance.now() - opened.current > 150) sfx("uiMove");
  };
  return (
    <div class="sq-menu" id="game-menu" role="dialog" aria-modal="true" aria-label={t("game.menu.title")} onFocusIn={move} onKeyDown={trapTab}>
      <div class="sq-menu-body">
        <span class="sq-eyebrow">{t("game.title")}</span>
        <h2>{t("game.menu.title")}</h2>
        <div class="sq-actions col">
          <button type="button" class="sq-b primary" ref={first} id="game-resume" onClick={() => setMenu("none")}>
            {t("game.menu.resume")}
          </button>
          <button type="button" class="sq-b" id="game-record" onClick={() => setMenu("sheet")}>
            {t("game.menu.record")}
          </button>
          <button type="button" class="sq-b" aria-pressed={s.sound} id="game-sound" onClick={() => setGameSettings({ sound: !s.sound })}>
            {t("game.menu.sound")} <em>{t(s.sound ? "game.menu.on" : "game.menu.off")}</em>
          </button>
          <div class="sq-vols" role="group" aria-label={t("game.menu.volume")}>
            <Volume id="game-music" label={t("game.menu.music")} value={s.music} on={s.sound} set={(v) => setGameSettings({ music: v })} />
            <Volume id="game-effects" label={t("game.menu.effects")} value={s.effects} on={s.sound} set={(v) => setGameSettings({ effects: v })} />
          </div>
          <button type="button" class="sq-b" aria-pressed={s.reducedMotion} id="game-motion" onClick={() => setGameSettings({ reducedMotion: !s.reducedMotion })}>
            {t("game.menu.motion")} <em>{t(s.reducedMotion ? "game.menu.on" : "game.menu.off")}</em>
          </button>
          <button type="button" class="sq-b" id="game-quit" onClick={stopGame}>
            {t("game.stop")}
          </button>
        </div>
        {!touch && (
          <div class="sq-controls">
            <span class="sq-eyebrow">{t("game.menu.controls")}</span>
            {(["move", "strike", "dodge", "jump", "card", "drive", "interact", "phone", "radio", "horn", "pause", "record"] as const).map((k) => (
              <span key={k}>{t(`game.legend.${k}`)}</span>
            ))}
          </div>
        )}
        <p class="sq-note">{t("game.madeUp")}</p>
      </div>
    </div>
  );
}

function Sheet({ v }: { v: GameView }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <div class="sq-menu sheet" id="game-sheet" role="dialog" aria-modal="true" aria-label={t("game.sheet.title")} onKeyDown={trapTab}>
      <div class="sq-menu-body wide">
        <span class="sq-eyebrow">{t("game.sheet.title")}</span>
        <h2>{rankName(v.rank)}</h2>
        <div class="sq-sheet-grid">
          <section>
            <dl class="sq-stats">
              <dt>{t("game.stat.knowledge")}</dt>
              <dd>
                {v.xp}
                {v.nextXp !== undefined && <small> / {v.nextXp}</small>}
              </dd>
              <dt>{t("game.stat.focus")}</dt>
              <dd>
                {Math.ceil(v.focus)} <small>/ {v.maxFocus}</small>
              </dd>
              <dt>{t("game.stat.insight")}</dt>
              <dd>{v.insight}</dd>
              <dt>{t("game.stat.stamina")}</dt>
              <dd>{v.maxStamina}</dd>
              <dt>{t("game.stat.crit")}</dt>
              <dd>{Math.round(v.crit * 100)}%</dd>
            </dl>
            <ol class="sq-ranks">
              {RANKS.map((r, k) => (
                <li class={k === v.rank ? "now" : k < v.rank ? "done" : ""} key={r.id}>
                  <span>{rankName(k)}</span>
                  <em>{r.xp}</em>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <span class="sq-eyebrow">{t("game.skills")}</span>
            <ul class="sq-skill-list">
              {SKILLS.map((s) => (
                <li class={v.rank >= s.rank ? "" : "locked"} key={s.id}>
                  <SkillIcon id={s.id} />
                  <span>
                    <b>{t(`game.skill.${s.id}.name`)}</b>
                    <small>{v.rank >= s.rank ? t(`game.skill.${s.id}.desc`) : t("game.locked", { rank: rankName(s.rank) })}</small>
                  </span>
                </li>
              ))}
            </ul>
            <span class="sq-eyebrow">{t("game.sheet.met")}</span>
            <ul class="sq-codex">
              {FOE_KINDS.filter((k) => v.met.includes(k)).map((k) => (
                <li key={k}>
                  <b>{t(`game.foe.${k}.name`)}</b> <small>{t(`game.foe.${k}.title`)}</small>
                </li>
              ))}
              {!v.met.length && <li class="none">{t("game.sheet.none")}</li>}
            </ul>
          </section>
        </div>
        <div class="sq-actions">
          <button type="button" class="sq-b primary" ref={first} id="game-sheet-close" onClick={() => setMenu("none")}>
            {t("game.menu.resume")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BurntOut({ v, show }: { v: GameView; show: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  const r = v.retry;
  return (
    <div class="sq-debrief lost burnt" id="game-over" role="dialog" aria-modal="true" aria-label={t("game.over.defeat")} onKeyDown={trapTab}>
      <div class="sq-debrief-body">
        <span class="sq-eyebrow">{t("game.title")}</span>
        <h2>{t("game.over.defeat")}</h2>
        {r && <p class="sq-from">{r.boss ? t("game.retry.boss") : t("game.retry.from", { quest: t(`game.quest.${r.quest}.title`) })}</p>}
        <div class="sq-actions">
          <button type="button" class="sq-b primary" ref={first} id="game-retry" onClick={() => retryGame()}>
            {t("game.retry.button")}
          </button>
          <button type="button" class="sq-b" id="game-debrief" onClick={show}>
            {t("game.over.eyebrow")}
          </button>
          <button type="button" class="sq-b" id="game-end" onClick={stopGame}>
            {t("game.stop")}
          </button>
        </div>
        <p class="sq-note">{t("game.madeUp")}</p>
      </div>
    </div>
  );
}

function Debrief({ v, again }: { v: GameView; again: () => void }) {
  const d = v.debrief!;
  const best = gameBest.value;
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  const f = gradeFactors(d);
  const value: Record<(typeof GRADE_FACTORS)[number], string> = { time: fmtClock(d.seconds), deaths: String(d.deaths), combo: String(d.maxChain), knowledge: String(d.xp) };
  return (
    <div class={`sq-debrief ${d.victory ? "won" : "lost"}`} id="game-over" role="dialog" aria-modal="true" aria-label={t(d.victory ? "game.over.victory" : "game.over.defeat")} onKeyDown={trapTab}>
      <div class="sq-debrief-body">
        <span class="sq-eyebrow">{t("game.over.eyebrow")}</span>
        <h2>{t(d.victory ? "game.over.victory" : "game.over.defeat")}</h2>
        <div class="sq-grade-row">
          <div class="sq-grade" id="game-grade" aria-label={t("game.over.grade", { grade: d.grade })}>
            {d.grade}
          </div>
          <dl class="sq-tally sq-factors" id="game-factors">
            <dt>{t("game.over.course")}</dt>
            <dd data-factor="course">
              <b>{t(d.victory ? "game.over.passed" : "game.over.notPassed")}</b>
              <span class="sq-pts">
                {d.victory ? GRADE.victory : 0}/{GRADE.victory}
              </span>
            </dd>
            {GRADE_FACTORS.map((k) => (
              <div class="g-factor-pair" key={k}>
                <dt>{t(`game.over.factor.${k}`)}</dt>
                <dd data-factor={k}>
                  <b>{value[k]}</b>
                  <span class="sq-pts">
                    {f[k].points}/{f[k].max}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p class="sq-best">{gameNewBest.value ? t("game.over.newBest") : best.grade ? t("game.over.best", { grade: best.grade, xp: best.xp }) : ""}</p>
        <div class="sq-actions">
          <button type="button" class="sq-b primary" ref={first} id="game-again" onClick={again}>
            {t("game.again")}
          </button>
          <button type="button" class="sq-b" id="game-end" onClick={stopGame}>
            {t("game.stop")}
          </button>
        </div>
        <p class="sq-note">{t("game.madeUp")}</p>
      </div>
    </div>
  );
}

/** Study Quest's Harbour-Night GTA HUD panel. */
export function GameHud({ touch, again }: { touch: boolean; again: () => void }) {
  const v = gameView.value as GameViewWithGta | undefined;
  const [full, setFull] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);

  const over = v?.phase === "over";
  const menu = gameMenu.value;
  const titleOpen = gameTitle.value;
  const isPlaying = !!v && !over && menu === "none" && !titleOpen;

  useEffect(() => {
    if (!over) setFull(false);
  }, [over]);

  useEffect(() => {
    if (!isPlaying && phoneOpen) setPhoneOpen(false);
  }, [isPlaying, phoneOpen]);

  // Toggle Campus Phone drawer on [T] key
  useEffect(() => {
    if (!isPlaying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setPhoneOpen((o) => !o);
      } else if (e.key === "Escape" && phoneOpen) {
        setPhoneOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, phoneOpen]);

  if (!v) return null;

  const gta = resolveGta(v);
  const lowHealth = gta.health < gta.maxHealth * 0.3;
  const cinematic = titleOpen || over || gameBanner.value?.kind === "phase" || gameCard.value?.kind === "boss" || !!gta.card;
  const radarPaused = menu !== "none" || !!v.paused || titleOpen || over;
  const lesson = isPlaying ? v.lesson : undefined;

  return (
    <div
      class={`sq ${touch ? "touch" : ""} ${gameSettings.value.reducedMotion ? "rm" : ""} ${cinematic ? "cine" : ""} ${over ? "over" : ""} ${menu !== "none" ? "menu-open" : ""} ${lowHealth ? "is-low" : ""} ${gta.vehicle ? "in-vehicle" : ""} ${lesson ? `cue-${lesson}` : ""}`}
      id="game-panel"
      aria-label={t("game.title")}
    >
      <div class="g-vignette" aria-hidden="true" />
      <div class="sq-bars" aria-hidden="true">
        <i />
        <i />
      </div>

      {!over && (
        <div class={`g-hud ${menu !== "none" || titleOpen ? "is-hidden" : ""}`} id="game-hud">
          <div class="g-corner g-tl">
            <GameRadar
              gta={gta}
              paused={radarPaused}
              northLabel={t("game.compass.n")}
              ariaLabel={t("game.radar.label")}
              onClick={() => setMenu(menu === "pause" ? "none" : "pause")}
            />
          </div>

          <WantedAndCash gta={gta} phoneOpen={phoneOpen} onTogglePhone={() => setPhoneOpen((o) => !o)} touch={touch} />
          <TopCenter gta={gta} />
          <Notes gta={gta} />
          <BottomCenter gta={gta} touch={touch} />
          <BottomRight gta={gta} />

          {v.chain >= 3 && (
            <div class="sq-combo" key={v.chain} aria-hidden="true">
              <b>{v.chain}</b>
              <span>{t("game.hits")}</span>
            </div>
          )}

          {touch && menu === "none" && !titleOpen && <TouchPad v={v} gta={gta} />}
        </div>
      )}

      {v.paused && !over && (
        <p class="sq-paused" id="game-status" role="status">
          {t(`game.paused.${v.paused}`)}
        </p>
      )}

      {!over && <CardBanner gta={gta} />}
      {phoneOpen && isPlaying && <PhoneDrawer gta={gta} onClose={() => setPhoneOpen(false)} />}
      {titleOpen && !over && <Title touch={touch} />}
      {menu === "pause" && !over && <PauseMenu touch={touch} />}
      {menu === "sheet" && !over && <Sheet v={v} />}
      {over && v.debrief && (v.debrief.victory || full ? <Debrief v={v} again={again} /> : <BurntOut v={v} show={() => setFull(true)} />)}
    </div>
  );
}
