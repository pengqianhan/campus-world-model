// Study Quest's panels over the walk: the title card, the quest tracker, the walker's Focus and
// Stamina and its study rank, the skills, the boss's bar, the big words high in the middle, the pause
// menu, the study record and the debrief with its grade. It reads the game ten times a second; the
// marks that move with the picture are drawn by the scene (gameOverlay.ts). On a phone it keeps the
// view clear: small panels in the corners, and big buttons under the right thumb. Nothing is
// explained in words: the first minute teaches by play, with one small prompt (a key, or the
// button itself) the first time each action is needed. Everything in the game is made up, and the
// title card, the menu and the debrief say so.
import { useEffect, useRef, useState } from "preact/hooks";
import {
  gameAct,
  gameBanner,
  gameBest,
  gameCard,
  gameFeed,
  gameMenu,
  gameNewBest,
  gameQuestFlash,
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

const ROMAN = ["I", "II", "III"];

/** Small drawn icons for the skills: a highlighter, a sidestep, a flashcard, a sprint, a light bulb. */
const SKILL_ICON: Record<SkillId, string> = {
  strike: "M5 19l3-1 11-11-2-2L6 16l-1 3zm11.5-13.5l2 2 1.2-1.2a1 1 0 000-1.4l-.6-.6a1 1 0 00-1.4 0L16.5 5.5z",
  dodge: "M4 12l5-5v3h6V7l5 5-5 5v-3H9v3l-5-5z",
  flashcard: "M3 7l12-3 3 12-12 3L3 7zm4 1.5l1 4 6-1.5-1-4-6 1.5z",
  sprint: "M4 6l6 6-6 6V6zm7 0l6 6-6 6V6zm7 0h2v12h-2V6z",
  eureka: "M12 2a6 6 0 00-3.5 10.9V16h7v-3.1A6 6 0 0012 2zm-3 16h6v2H9v-2zm1 3h4v1h-4v-1z",
};
const SKILL_KEY: Record<SkillId, string> = { strike: "J", dodge: "Spc", flashcard: "K", sprint: "Spc", eureka: "R" };

/** Each lesson's keys, and the skill whose button it points to on a phone (none: the stick). */
const LESSON_KEYS: Record<Lesson, string[]> = { move: ["W", "A", "S", "D"], strike: ["J"], dodge: ["Space"], flashcard: ["K"], sprint: ["Space"], eureka: ["R"] };
const LESSON_SKILL: Record<Lesson, SkillId | undefined> = { move: undefined, strike: "strike", dodge: "dodge", flashcard: "flashcard", sprint: "sprint", eureka: "eureka" };

/**
 * The prompt for the action needed now, the first time it is: its key or keys and one word; on a
 * phone the button's own icon beside the button (which pulses), or by the stick to move.
 */
function Prompt({ lesson, touch }: { lesson: Lesson; touch: boolean }) {
  const skill = LESSON_SKILL[lesson];
  return (
    <div class={`sq-prompt ${touch ? (skill ? "at-pad" : "at-stick") : ""}`} key={lesson} id="game-prompt" data-lesson={lesson} role="status">
      {touch ? (
        <span class="sq-prompt-ic" aria-hidden="true">
          {skill ? <SkillIcon id={skill} size={18} /> : <i class="sq-stick-ic" />}
        </span>
      ) : (
        <span class="sq-prompt-keys" aria-hidden="true">
          {LESSON_KEYS[lesson].map((k) => (
            <kbd class={k.length > 1 ? "wide" : ""}>{k}</kbd>
          ))}
        </span>
      )}
      <span class="sq-prompt-word">{t(`game.prompt.${lesson}`)}</span>
    </div>
  );
}

function SkillIcon({ id, size = 22 }: { id: SkillId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={SKILL_ICON[id]} fill="currentColor" />
    </svg>
  );
}

function clock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A bar that fills, with a pale chip that follows it down a moment later, as a game's bars do. */
function Bar({ value, max, cls, id }: { value: number; max: number; cls: string; id?: string }) {
  const k = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <span class={`sq-bar ${cls}`} id={id} role="meter" aria-valuemin={0} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(value)}>
      <i class="chip" style={{ transform: `scaleX(${k})` }} />
      <i class="fill" style={{ transform: `scaleX(${k})` }} />
    </span>
  );
}

function Tracker({ v, touch }: { v: GameView; touch: boolean }) {
  const flash = gameQuestFlash.value;
  const [hot, setHot] = useState(false);
  useEffect(() => {
    if (!flash) return;
    setHot(true);
    const id = window.setTimeout(() => setHot(false), 900);
    return () => window.clearTimeout(id);
  }, [flash]);
  const main = v.quests.find((q) => q.main);
  const sides = touch ? [] : v.quests.filter((q) => !q.main);
  if (!main && !sides.length) return null;
  const line = (q: GameView["quests"][number], big: boolean) => (
    <div class={`sq-q ${big ? "main" : "side"}`} key={q.id} data-quest={q.key}>
      {big && <span class="sq-eyebrow">{t("game.mainQuest")}</span>}
      <strong class="sq-q-title">{questTitle(q)}</strong>
      <span class="sq-q-goal">
        <span>{questGoal(q)}</span>
        {q.need > 1 && (
          <span class="sq-pips" aria-label={`${q.got} / ${q.need}`}>
            {Array.from({ length: q.need }, (_, k) => (
              <i class={k < q.got ? "on" : ""} />
            ))}
          </span>
        )}
        {q.metres !== undefined && q.metres > 5 && (
          <span class="sq-q-far">
            <span class="sq-arrow" style={{ transform: `rotate(${Math.round(q.bearing ?? 0)}deg)` }} aria-hidden="true">
              ▲
            </span>
            {t("game.metres", { metres: Math.round(q.metres) })}
          </span>
        )}
      </span>
    </div>
  );
  return (
    <section class={`sq-obj ${hot ? "flash" : ""}`} id="game-quests" aria-label={t("game.quests")}>
      {main && line(main, true)}
      {sides.length > 0 && <span class="sq-eyebrow side">{t("game.sideQuests")}</span>}
      {sides.map((q) => line(q, false))}
    </section>
  );
}

function Vitals({ v }: { v: GameView }) {
  const span = (v.nextXp ?? v.xp) - v.rankXp;
  return (
    <section class={`sq-vitals ${v.focus < v.maxFocus * 0.3 ? "crit" : ""}`} id="game-vitals" aria-label={t("game.vitals")}>
      <div class="sq-rank">
        <span class="sq-badge" aria-hidden="true">
          <span>{v.rank + 1}</span>
        </span>
        <span class="sq-rank-text">
          <b id="game-rank">{rankName(v.rank)}</b>
          <span class="sq-xp-line">
            <Bar value={span > 0 ? v.xp - v.rankXp : 1} max={span > 0 ? span : 1} cls="xp" />
            <em>{v.nextXp !== undefined ? `${v.xp} / ${v.nextXp}` : `${v.xp}`}</em>
          </span>
        </span>
      </div>
      <div class="sq-stat">
        <span class="sq-k">{t("game.stat.focus")}</span>
        <Bar value={v.focus} max={v.maxFocus} cls="focus" id="game-focus" />
        <span class="sq-n">{Math.ceil(v.focus)}</span>
      </div>
      <div class="sq-stat">
        <span class="sq-k">{t("game.stat.stamina")}</span>
        <Bar value={v.stamina} max={v.maxStamina} cls="stamina" />
        {v.slowed && <span class="sq-tag slow">{t("game.slowed")}</span>}
      </div>
    </section>
  );
}

function Skills({ v, touch }: { v: GameView; touch: boolean }) {
  // The dodge becomes the Cram Sprint at its rank; the slot shows whichever the walker has.
  const sprint = v.skills.find((s) => s.id === "sprint")!;
  const slots = v.skills.filter((s) => s.id !== (sprint.open ? "dodge" : "sprint"));
  if (touch) {
    return (
      <div class="sq-pad" role="group" aria-label={t("game.skills")}>
        {slots.map((s) => (
          <button
            type="button"
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
      </div>
    );
  }
  return (
    <section class="sq-skills" aria-label={t("game.skills")}>
      {slots.map((s) => (
        <div class={`sq-skill ${s.open ? "" : "locked"} ${s.id === "eureka" && s.ready >= 1 ? "full" : ""}`} title={t(`game.skill.${s.id}.desc`)} style={{ "--cd": String(s.ready) }} data-skill={s.id}>
          <span class="sq-skill-ic">
            <SkillIcon id={s.id} />
          </span>
          <kbd>{SKILL_KEY[s.id]}</kbd>
          <span class="sq-skill-name">{s.open ? t(`game.skill.${s.id}.short`) : rankName(s.rank)}</span>
        </div>
      ))}
    </section>
  );
}

function BossBar({ v }: { v: GameView }) {
  const b = v.boss;
  if (!b) return null;
  return (
    // Low in the middle, clear of the boss itself: its name over a wide bar, notches where its
    // phases begin, and the phase it is in under the bar.
    <section class={`sq-boss phase-${b.phase}`} id="game-boss" aria-label={t("game.foe.exam.name")}>
      <div class="sq-boss-head">
        <b>{t("game.foe.exam.name")}</b>
        <span class="sq-boss-title">{t("game.foe.exam.title")}</span>
      </div>
      <div class="sq-boss-track">
        <Bar value={b.hp} max={b.max} cls="boss" />
        <i class="sq-boss-notch" style={{ left: "33%" }} />
        <i class="sq-boss-notch" style={{ left: "66%" }} />
      </div>
      <div class="sq-boss-foot">
        <span class="sq-boss-phase">
          {ROMAN.map((r, k) => (
            <i class={k < b.phase ? "on" : ""}>{r}</i>
          ))}
        </span>
        <span class="sq-boss-sub">{t(`game.phase.${b.phase}.name`)}</span>
      </div>
    </section>
  );
}

function CardView() {
  const b = gameCard.value;
  if (!b) return null;
  return (
    <div class={`sq-card ${b.kind}`} key={b.id} id="game-namecard" role="status">
      <span class="sq-card-eyebrow">{t(b.kind === "boss" ? "game.bossEyebrow" : "game.foeEyebrow")}</span>
      <strong>{b.title}</strong>
      {b.sub && <span class="sq-card-sub">{b.sub}</span>}
      {b.quote && <q>{b.quote}</q>}
    </div>
  );
}

function BannerView() {
  const b = gameBanner.value;
  if (!b) return null;
  return (
    <div class={`sq-banner ${b.kind}`} key={b.id} id="game-banner" role="status">
      {b.kind === "rank" && <span class="sq-banner-eyebrow">{t("game.rankUp")}</span>}
      {b.kind === "phase" && <span class="sq-banner-eyebrow">{t("game.foe.exam.name")}</span>}
      <strong>{b.title}</strong>
      {b.sub && <span>{b.sub}</span>}
    </div>
  );
}

function Feed() {
  const lines = gameFeed.value;
  if (!lines.length) return null;
  return (
    <div class="sq-feed" aria-live="polite">
      {lines.map((l) => (
        <div class={`sq-fl ${l.kind}`} key={l.id}>
          {l.kind === "kill" && <span class="sq-fl-k">{t("game.feed.beaten")}</span>}
          <b>{l.text}</b>
          {l.value && <em>{l.value}</em>}
        </div>
      ))}
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

/** A volume slider in the pause menu: 0 to 100 in steps of 5, kept as 0 to 1. */
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

function PauseMenu({ touch }: { touch: boolean }) {
  const s = gameSettings.value;
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  // Moving through the menu ticks, with the keys or the pointer; the first focus, given on opening, does not.
  const opened = useRef(performance.now());
  const move = () => {
    if (performance.now() - opened.current > 150) sfx("uiMove");
  };
  return (
    <div class="sq-menu" id="game-menu" role="dialog" aria-modal="true" aria-label={t("game.menu.title")} onFocusIn={move}>
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
            {(["move", "strike", "dodge", "card", "eureka", "lock", "pause", "record", "pad"] as const).map((k) => (
              <span>{t(`game.legend.${k}`)}</span>
            ))}
          </div>
        )}
        <p class="sq-note">{t("game.madeUp")}</p>
      </div>
    </div>
  );
}

function Sheet({ v }: { v: GameView }) {
  return (
    <div class="sq-menu sheet" id="game-sheet" role="dialog" aria-modal="true" aria-label={t("game.sheet.title")}>
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
                <li class={k === v.rank ? "now" : k < v.rank ? "done" : ""}>
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
                <li class={v.rank >= s.rank ? "" : "locked"}>
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
                <li>
                  <b>{t(`game.foe.${k}.name`)}</b> <small>{t(`game.foe.${k}.title`)}</small>
                </li>
              ))}
              {!v.met.length && <li class="none">{t("game.sheet.none")}</li>}
            </ul>
          </section>
        </div>
        <div class="sq-actions">
          <button type="button" class="sq-b primary" id="game-sheet-close" onClick={() => setMenu("none")}>
            {t("game.menu.resume")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Burnt out: try again from the last checkpoint, see the full debrief, or end the game. */
function BurntOut({ v, show }: { v: GameView; show: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  const r = v.retry;
  return (
    <div class="sq-debrief lost burnt" id="game-over" role="dialog" aria-label={t("game.over.defeat")}>
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
  const value: Record<(typeof GRADE_FACTORS)[number], string> = { time: clock(d.seconds), deaths: String(d.deaths), combo: String(d.maxChain), knowledge: String(d.xp) };
  return (
    <div class={`sq-debrief ${d.victory ? "won" : "lost"}`} id="game-over" role="dialog" aria-label={t(d.victory ? "game.over.victory" : "game.over.defeat")}>
      <div class="sq-debrief-body">
        <span class="sq-eyebrow">{t("game.over.eyebrow")}</span>
        <h2>{t(d.victory ? "game.over.victory" : "game.over.defeat")}</h2>
        <div class="sq-grade-row">
          <div class="sq-grade" id="game-grade" aria-label={t("game.over.grade", { grade: d.grade })}>
            {d.grade}
          </div>
          {/* Why the grade: one line a factor, its value and its marks out of its most. */}
          <dl class="sq-tally sq-factors" id="game-factors">
            <dt>{t("game.over.course")}</dt>
            <dd data-factor="course">
              <b>{t(d.victory ? "game.over.passed" : "game.over.notPassed")}</b>
              <span class="sq-pts">
                {d.victory ? GRADE.victory : 0}/{GRADE.victory}
              </span>
            </dd>
            {GRADE_FACTORS.map((k) => (
              <>
                <dt>{t(`game.over.factor.${k}`)}</dt>
                <dd data-factor={k}>
                  <b>{value[k]}</b>
                  <span class="sq-pts">
                    {f[k].points}/{f[k].max}
                  </span>
                </dd>
              </>
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

/** The game's whole panel, while a game is on. */
export function GameHud({ touch, again }: { touch: boolean; again: () => void }) {
  const v = gameView.value;
  // Burnt out, the choice comes first (retry, debrief, end); the debrief only when asked for.
  const [full, setFull] = useState(false);
  const over = v?.phase === "over";
  useEffect(() => {
    if (!over) setFull(false);
  }, [over]);
  if (!v) return null;
  const menu = gameMenu.value;
  const lesson = !over && menu === "none" && !gameTitle.value ? v.lesson : undefined;
  const cinematic = gameTitle.value || over || gameBanner.value?.kind === "phase" || gameCard.value?.kind === "boss";
  return (
    <div class={`sq ${touch ? "touch" : ""} ${gameSettings.value.reducedMotion ? "rm" : ""} ${cinematic ? "cine" : ""} ${over ? "over" : ""} ${menu !== "none" ? "menu-open" : ""} ${v.boss && !over ? "has-boss" : ""} ${gameCard.value?.kind === "boss" ? "boss-card" : ""} ${lesson ? `cue-${lesson}` : ""}`} id="game-panel" aria-label={t("game.title")}>
      <div class="sq-bars" aria-hidden="true">
        <i />
        <i />
      </div>
      {!over && (
        <>
          <Tracker v={v} touch={touch} />
          <Vitals v={v} />
          <BossBar v={v} />
          {v.chain >= 3 && (
            <div class="sq-combo" key={v.chain} aria-hidden="true">
              <b>{v.chain}</b>
              <span>{t("game.hits")}</span>
            </div>
          )}
          {!touch && <Feed />}
          {/* Under a full menu the buttons are not shown through it. */}
          {menu === "none" && <Skills v={v} touch={touch} />}
          {lesson && <Prompt lesson={lesson} touch={touch} />}
          {touch && menu === "none" && (
            <button type="button" class="sq-pausebtn" id="game-pause" aria-label={t("game.menu.title")} onClick={() => setMenu("pause")}>
              <i />
              <i />
            </button>
          )}
          {v.paused && (
            <p class="sq-paused" id="game-status" role="status">
              {t(`game.paused.${v.paused}`)}
            </p>
          )}
          <BannerView />
          <CardView />
        </>
      )}
      {gameTitle.value && !over && <Title touch={touch} />}
      {menu === "pause" && !over && <PauseMenu touch={touch} />}
      {menu === "sheet" && !over && <Sheet v={v} />}
      {over && v.debrief && (v.debrief.victory || full ? <Debrief v={v} again={again} /> : <BurntOut v={v} show={() => setFull(true)} />)}
    </div>
  );
}
