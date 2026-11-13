// The walk as a game: the view takes the whole screen, and small panels in its corners say where the
// walker is and how to steer it. Top left, the site's name and the way out; top right, a walk to a
// place and a button that hides the panels; bottom left, where it is and, on a touch screen, a thumb
// stick; at the foot in the middle, how it gets about: on foot, on a scooter, or flying a drone in
// its place; bottom right, its speed and height, and the view. On a touch screen one thumb steers
// with the stick while the other drags the view round. The walker, its scooter and its drone are
// made up; the walk's menu says so, and that doors are not mapped.
import { useEffect, useRef, useState } from "preact/hooks";
import { gameOn, startGame, stopGame } from "../app/game.ts";
import { formatDate, t } from "../app/i18n.ts";
import { data, selBuilding, selCampus, shown, timeMode } from "../app/state.ts";
import { formatMinutes } from "../shared/time.ts";
import {
  ENTER_REACH,
  MY_WALKER,
  PACE,
  hudHidden,
  rideAs,
  run,
  setView,
  steerByHand,
  stopWalking,
  walkerGauge,
  walkerOn,
  walkerRide,
  walkerStatus,
  walkerView,
  wanderingNow,
} from "../app/walker.ts";
import { RIDES, type Ride } from "../scene/rides.ts";
import { DRONE_CEILING } from "../scene/walkers.ts";
import { Icon, campusName } from "./common.tsx";
import { GameHud } from "./GameHud.tsx";
import { isLite } from "./SceneHost.tsx";

const VIEWS = ["follow", "eyes", "map"] as const;
const RIDE_ICON: Record<Ride, string> = { walk: "walkLine", scooter: "scooter", fly: "drone" };
/** The keys the panels name, as a keyboard has them. */
const KEY = { view: "V", hud: "H" } as const;
/** Kilometres an hour at which the speed's bar is full, for each way of getting about. */
const GAUGE_TOP: Record<Ride, number> = { walk: 15, scooter: 25, fly: 60 };

/** How far the stick must be pushed, as a share of its reach, before it does anything. */
const DEAD_ZONE = 0.18;
/** Metres a second with the stick pushed all the way up: on foot a run, as Shift gives; on the scooter and flying, flat out. */
const STICK_TOP: Record<Ride, number> = { walk: PACE.walk.fast, scooter: PACE.scooter.fast, fly: PACE.fly.fast };
/** Degrees a second with the stick pushed all the way to one side. */
const STICK_TURN = 120;
/** Share of the stick's reach that its knob travels. */
const KNOB_TRAVEL = 0.6;

/** -1 to 1 along one of the stick's axes, without the dead zone. */
function axis(v: number): number {
  const a = Math.abs(v);
  return a <= DEAD_ZONE ? 0 : (Math.sign(v) * (a - DEAD_ZONE)) / (1 - DEAD_ZONE);
}

/**
 * What the thumbs ask for: the stick forward (-1 to 1) and round (-1 to 1), the buttons up and down
 * (metres a second). Each sets its part; the stick's speeds are those of the way it gets about now,
 * so that held through a change of it, the stick goes on at the new pace.
 */
const hand = { forward: 0, turn: 0, climb: 0 };
function steerHand(part: Partial<typeof hand>): void {
  Object.assign(hand, part);
  const ride = walkerRide.peek();
  const f = hand.forward;
  // Squared, so that a little push to the side turns a little and the stick can hold a line.
  steerByHand(f > 0 ? f * STICK_TOP[ride] : f * PACE[ride].back, hand.turn * Math.abs(hand.turn) * STICK_TURN, hand.climb);
}

/**
 * A thumb stick, as in a game on a phone: pushed up the walker goes on, faster the further it goes;
 * pulled down it goes back; pushed to a side it turns. It steers as the keys do, and like them it
 * stops a walk to a place.
 */
function Stick({ onSteer }: { onSteer: () => void }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const finger = useRef<number | undefined>(undefined);
  // A stick let go of by the page (the walk closed under the thumb) stops the walker.
  useEffect(
    () => () => {
      if (finger.current !== undefined) steerHand({ forward: 0, turn: 0 });
    },
    [],
  );

  const push = (e: PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    const reach = r.width / 2;
    let x = (e.clientX - r.left - reach) / reach;
    let y = (e.clientY - r.top - reach) / reach;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    if (knob.current) knob.current.style.transform = `translate(${x * reach * KNOB_TRAVEL}px, ${y * reach * KNOB_TRAVEL}px)`;
    steerHand({ forward: -axis(y), turn: axis(x) });
  };
  const release = (e: PointerEvent) => {
    if (e.pointerId !== finger.current) return;
    finger.current = undefined;
    base.current?.classList.remove("held");
    if (knob.current) knob.current.style.transform = "";
    steerHand({ forward: 0, turn: 0 });
  };

  return (
    <div class="hud-stick-wrap">
      <div
        class="walker-stick"
        id="walker-stick"
        ref={base}
        aria-hidden="true"
        onPointerDown={(e) => {
          if (finger.current !== undefined) return;
          finger.current = e.pointerId;
          // The thumb keeps the stick when it slides off it. A pointer the browser no longer knows cannot be kept.
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          } catch {
            // Steered all the same, while it stays over the stick.
          }
          base.current?.classList.add("held");
          onSteer();
          push(e);
        }}
        onPointerMove={(e) => {
          if (e.pointerId === finger.current) push(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span class="walker-knob" ref={knob} />
      </div>
      <span class="hud-caption">{t("walker.stick")}</span>
    </div>
  );
}

/** A button held to climb or come down, flying: for as long as the finger or the mouse is on it. */
function Hold({ id, climb, icon, label }: { id: string; climb: number; icon: string; label: string }) {
  const [held, setHeld] = useState(false);
  const stop = () => {
    setHeld(false);
    steerHand({ climb: 0 });
  };
  useEffect(() => () => steerHand({ climb: 0 }), []);
  return (
    <button
      type="button"
      id={id}
      class={`hud-hold ${held ? "held" : ""}`}
      aria-label={label}
      title={label}
      onPointerDown={(e) => {
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          // Held all the same, while it stays on the button.
        }
        setHeld(true);
        steerHand({ climb });
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </button>
  );
}

/**
 * Pixels at the foot of the screen that the open building's dock covers, which the thumb controls
 * stand above; and whether it reaches across to the right-hand thumb too.
 */
function useDock(active: boolean): { lift: number; wide: boolean } {
  const building = selBuilding.value;
  const [dock, setDock] = useState({ lift: 0, wide: false });
  useEffect(() => {
    const el = active && building ? document.querySelector<HTMLElement>(".dock") : null;
    if (!el) {
      setDock({ lift: 0, wide: false });
      return;
    }
    const measure = () => {
      // The dock may have gone between a change of its size and this.
      if (!el.isConnected || !el.parentElement) return;
      const r = el.getBoundingClientRect();
      const app = el.parentElement.getBoundingClientRect();
      setDock({ lift: Math.max(0, Math.round(app.bottom - r.top)), wide: r.right > app.left + app.width * 0.6 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [building, active]);
  return dock;
}

export function WalkerPanel() {
  const touch = isLite();
  const [to, setTo] = useState("");
  const [message, setMessage] = useState<string | undefined>(undefined);
  // The walk to a place, wandering, how to steer and that all of it is made up: a menu from the top
  // right, shut as a walk starts on every screen, so that the walk has the view; Go to opens it.
  const [more, setMore] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dock = useDock(walkerOn.value);
  const on = walkerOn.value;
  useEffect(() => {
    if (on) setMore(false);
  }, [on]);
  // Going into a building shuts the menu: the building's floors and card take that part of the screen.
  const inside = !!walkerStatus.value?.indoor;
  useEffect(() => {
    if (inside) setMore(false);
  }, [inside]);
  // A change of the way it gets about while the stick is held goes on at the new pace.
  const rideNow = walkerRide.value;
  useEffect(() => {
    if (hand.forward || hand.turn || hand.climb) steerHand({});
  }, [rideNow]);
  if (!walkerOn.value) return null;
  const d = data.value;
  const status = walkerStatus.value;
  const gauge = walkerGauge.value;
  const view = walkerView.value;
  const ride = walkerRide.value;
  const hidden = hudHidden.value;
  const wandering = wanderingNow.value.has(MY_WALKER);
  const indoor = !!status?.indoor;
  const clock = shown.value;
  const preview = timeMode.value === "preview";
  const playing = gameOn.value;

  // The game is played on the ground and seen from the walker: starting it lands the drone, and
  // leaves the map view for the view behind the walker.
  const play = () => {
    setMore(false);
    setMessage(undefined);
    if (ride === "fly") rideAs("walk");
    if (view === "map") setView({ view: "follow", name: MY_WALKER });
    // The buildings' names wait until the game ends, on every screen: the game's own marks lead the way.
    if (!startGame(MY_WALKER, true, touch)) setMessage(t("game.notReady"));
  };

  const act = async (command: string, args: Record<string, unknown>) => {
    const r = await run(command, { name: MY_WALKER, ...args });
    setMessage(r.error ? String(r.error) : undefined);
  };

  const go = async (e: Event) => {
    e.preventDefault();
    const where = to.trim();
    if (!where) return;
    // The menu shuts, so that the walk can be watched.
    setMore(false);
    setMessage(t(ride === "fly" ? "walker.flying" : ride === "scooter" ? "walker.riding" : "walker.walking"));
    const r = await run("walk", { name: MY_WALKER, to: where, speed: ride === "fly" ? PACE.fly.forward : ride === "scooter" ? PACE.scooter.forward : 3 });
    if (r.error) setMessage(String(r.error));
    else setMessage(r.arrived ? t("walker.arrived", { place: String(r.to) }) : t("walker.stopped"));
  };

  const moves = indoor ? (
    <>
      <button type="button" id="walker-up" onClick={() => act("floor", { to: "up" })}>
        {t("walker.up")}
      </button>
      <button type="button" id="walker-down" onClick={() => act("floor", { to: "down" })}>
        {t("walker.down")}
      </button>
      <button type="button" id="walker-exit" onClick={() => act("exit", {})}>
        {t("walker.exit")}
      </button>
    </>
  ) : ride !== "fly" && status?.nearId && (status.nearMetres ?? Infinity) <= ENTER_REACH && (data.value?.buildingById.get(status.nearId)?.floors.length ?? 0) > 0 ? (
    // A building with no floors (the Buildings form) has nothing inside to stand on.
    <button type="button" id="walker-enter" onClick={() => act("enter", {})}>
      {t("walker.enter", { place: status.nearId })}
    </button>
  ) : undefined;

  const where = indoor
    ? t("walker.inside", { place: status!.indoor!, floor: status!.floor ?? "" })
    : status?.walking
      ? t(ride === "fly" ? "walker.flying" : ride === "scooter" ? "walker.riding" : "walker.walking")
      : status?.near
        ? // Flying over a building, the drone is over it, not near it.
          t(ride === "fly" && status.nearMetres === 0 ? "walker.over" : "walker.near", { place: status.near })
        : t("walker.standing");
  const kmh = Math.round((gauge?.speed ?? 0) * 3.6);
  // The time the view shows: now, or a preview of another time, as the top bar's chip says. On a
  // wide screen in the toolbar; on a touch screen with the speed, where the top row has no room.
  const label = `${preview ? t("time.preview") : t("time.now")} ${formatDate(clock.date)} ${formatMinutes(clock.minutes)}`;
  const time = (
    <span class={`hud-time ${preview ? "preview" : ""}`} id="walker-time" role="img" aria-label={label} title={label}>
      <span class="hud-time-mode">{preview ? t("time.preview") : t("time.now")}</span>
      {preview && !touch && <span class="hud-time-date">{formatDate(clock.date)}</span>}
      <span class="hud-time-clock">{formatMinutes(clock.minutes)}</span>
    </span>
  );
  // Over the open building's card: the sign, and on a touch screen the stick, and the right thumb's buttons where it reaches across.
  const lift = dock.lift ? { "--hud-lift": `${dock.lift + 8}px`, ...(dock.wide ? { "--hud-lift-r": `${dock.lift + 8}px` } : {}) } : undefined;

  return (
    <section
      class={`hud view-${view} ride-${ride} ${touch ? "touch" : ""} ${hidden ? "hud-hidden" : ""} ${indoor ? "hud-indoor" : ""} ${playing ? "playing" : ""}`}
      id="walker-panel"
      aria-label={t("walker.heading")}
      style={lift}
    >
      <header class="hud-corner hud-tl">
        <div class="hud-card hud-brand">
          <span class="hud-badge" aria-hidden="true">
            <Icon name={RIDE_ICON[ride]} size={18} />
          </span>
          <span class="hud-names">
            <span class="hud-title">{t("app.title")}</span>
            <span class="hud-sub">
              {d ? campusName(d, selCampus.value) : ""} · {t("app.tagline")}
            </span>
          </span>
        </div>
        <button type="button" class="hud-card hud-btn" id="walker-close" aria-label={t("walker.closeHint")} title={t("walker.closeHint")} onClick={stopWalking}>
          <Icon name="close" size={16} />
          <span class="hud-label">{t("walker.close")}</span>
        </button>
      </header>

      <div class="hud-corner hud-tr">
        <div class="hud-card hud-toolbar">
          {!touch && (
            <>
              {time}
              <span class="hud-divider" aria-hidden="true" />
            </>
          )}
          <button
            type="button"
            class="hud-tool"
            id="walker-more"
            aria-expanded={more}
            aria-controls="walker-menu"
            aria-label={t("walker.more")}
            title={t("walker.more")}
            onClick={() => {
              setMore(!more);
              // Opened with a click on a wide screen, its field takes the keys, for a place to type.
              if (!more && !touch) requestAnimationFrame(() => input.current?.focus());
            }}
          >
            <Icon name="pin" size={16} />
            <span class="hud-label">{t("walker.goTo")}</span>
            <Icon name="chevronDown" size={14} />
          </button>
          {/* On a phone the top row has no room for it: there the game's button stands under the speed. */}
          {!touch && (
            <>
              <span class="hud-divider" aria-hidden="true" />
              <button
                type="button"
                class={`hud-tool hud-game-tool ${playing ? "on" : ""}`}
                id="walker-game"
                aria-pressed={playing}
                aria-label={t(playing ? "game.stopHint" : "game.startHint")}
                title={t(playing ? "game.stopHint" : "game.startHint")}
                onClick={() => (playing ? stopGame() : play())}
              >
                <Icon name="book" size={16} />
                <span class="hud-label">{t(playing ? "game.stop" : "game.start")}</span>
              </button>
            </>
          )}
          <span class="hud-divider" aria-hidden="true" />
          <button
            type="button"
            class="hud-tool hud-eye"
            id="walker-hud"
            aria-pressed={hidden}
            aria-label={t(hidden ? "walker.hud.show" : "walker.hud.hide")}
            title={t(hidden ? "walker.hud.show" : "walker.hud.hide")}
            onClick={() => (hudHidden.value = !hidden)}
          >
            <Icon name={hidden ? "eyeOff" : "eye"} size={18} />
            {!touch && <kbd>{KEY.hud}</kbd>}
          </button>
        </div>
        <div class="hud-card hud-menu" id="walker-menu" hidden={!more}>
          <form class="walker-go" onSubmit={go}>
            <label class="sr-only" for="walker-to">
              {t("walker.goTo")}
            </label>
            <input id="walker-to" ref={input} value={to} placeholder={t("walker.goToPlaceholder")} onInput={(e) => setTo((e.target as HTMLInputElement).value)} autocomplete="off" />
            <button type="submit" class="btn primary">
              {t("walker.go")}
            </button>
          </form>
          <button
            type="button"
            class={`walker-wander ${wandering ? "on" : ""}`}
            id="walker-wander"
            aria-pressed={wandering}
            onClick={() => {
              if (!wandering) setMore(false);
              void run(wandering ? "stop" : "wander", { name: MY_WALKER });
            }}
          >
            {wandering ? t("walker.wanderStop") : t("walker.wander")}
          </button>
          <p class="walker-keys">{touch ? t("walker.keysTouch") : t("walker.keys")}</p>
          <p class="walker-note">{t("walker.note", { ceiling: DRONE_CEILING })}</p>
        </div>
      </div>

      {playing && <GameHud touch={touch} again={play} />}

      <div class="hud-corner hud-bl">
        <p class="hud-sign" id="walker-where" aria-live="polite">
          {where}
        </p>
        {message && (
          <p class="hud-card hud-message" id="walker-message" role="status">
            {message}
          </p>
        )}
        {touch && <Stick onSteer={() => setMessage(undefined)} />}
      </div>

      <footer class="hud-corner hud-bc">
        {!touch && <p class="hud-hint">{t(`walker.hint.${ride}`)}</p>}
        <div class="hud-card hud-rides" role="group" aria-label={t("walker.ride.label")}>
          {RIDES.map((r, i) => (
            <button
              type="button"
              class={r === ride ? "on" : ""}
              aria-pressed={r === ride}
              data-ride={r}
              title={t(`walker.ride.${r}Hint`)}
              onClick={() => {
                setMessage(undefined);
                rideAs(r);
              }}
            >
              <Icon name={RIDE_ICON[r]} size={20} />
              <span class="hud-label">{t(`walker.ride.${r}`)}</span>
              {!touch && <kbd>{i + 1}</kbd>}
            </button>
          ))}
        </div>
      </footer>

      {touch && (moves || ride === "fly") && (
        <div class="hud-corner hud-thumb-r">
          {moves && (
            <div class="walker-moves" role="group" aria-label={t("walker.moves")}>
              {moves}
            </div>
          )}
          {ride === "fly" && (
            <div class="hud-holds">
              <Hold id="walker-climb" climb={PACE.fly.climb} icon="chevronUp" label={t("walker.climb")} />
              <Hold id="walker-descend" climb={-PACE.fly.climb} icon="chevronDown" label={t("walker.descend")} />
            </div>
          )}
        </div>
      )}

      <div class="hud-corner hud-br">
        {!touch && moves && (
          <div class="walker-moves" role="group" aria-label={t("walker.moves")}>
            {moves}
          </div>
        )}
        <section class="hud-card hud-cluster" aria-label={t("walker.gauge")}>
          <div class="hud-gauge">
            <div class="hud-gauge-top">
              <span class="hud-gauge-name">{t(`walker.ride.${ride}Name`)}</span>
              {touch && time}
              {ride === "fly" && (
                <span class="hud-alt" id="walker-altitude">
                  {t("walker.altitude", { metres: Math.round(gauge?.altitude ?? 0) })}
                </span>
              )}
            </div>
            <div class="hud-speed">
              <span id="walker-speed">{kmh}</span>
              <span class="hud-unit">{t("walker.kmh")}</span>
            </div>
            <div class="hud-meter" aria-hidden="true">
              <span style={{ width: `${Math.min(100, (kmh / GAUGE_TOP[ride]) * 100)}%` }} />
            </div>
          </div>
          <div class="hud-views walker-views" role="group" aria-label={t("walker.view.label")}>
            <Icon name="camera" size={16} />
            {VIEWS.map((v) => (
              <button type="button" class={v === view ? "on" : ""} aria-pressed={v === view} data-view={v} onClick={() => setView({ view: v, name: MY_WALKER })}>
                {t(`walker.view.${v}`)}
              </button>
            ))}
            {!touch && <kbd>{KEY.view}</kbd>}
          </div>
        </section>
        {touch && (
          <button
            type="button"
            class={`hud-card hud-btn hud-game-pill ${playing ? "on" : ""}`}
            id="walker-game"
            aria-pressed={playing}
            title={t(playing ? "game.stopHint" : "game.startHint")}
            onClick={() => (playing ? stopGame() : play())}
          >
            <Icon name="book" size={16} />
            <span>{t(playing ? "game.stop" : "game.start")}</span>
          </button>
        )}
      </div>
    </section>
  );
}
