// Harbour-Night GTA circular minimap radar for Study Quest:
// Dark slate campus ground, vector roads & building footprints, yellow GPS route polyline,
// rotating North compass pip, colour-coded blips, and 3 curved SVG vital arcs (Health, Energy/Armour, Stamina).
// Skips redraws when paused or hidden.
import { useEffect, useRef } from "preact/hooks";
import type { VehicleKind } from "../shared/campusVehicles.ts";

export type GtaBlipKind =
  | "mission"
  | "objective"
  | "destination"
  | "pizza"
  | "cart"
  | "vehicle"
  | "scooter"
  | "mecha"
  | "security"
  | "rival"
  | "pedestrian"
  | "pickup"
  | "checkpoint"
  | "main"
  | "activity"
  | "foe"
  | "npc";

export interface GtaRadarBlip {
  x: number; // dx east from player, metres
  y: number; // dy north from player, metres
  kind: GtaBlipKind;
  color?: string;
  label?: string;
  short?: boolean;
  radius?: number; // optional area circle radius in metres
  pulse?: boolean;
}

export interface GtaRadarRoad {
  pts: readonly (readonly [number, number])[]; // local [dx, dy] metres relative to player
  major?: boolean;
}

export interface GtaRadarBuilding {
  pts: readonly (readonly [number, number])[]; // local [dx, dy] metres relative to player
}

export interface GtaPhoneJob {
  id: string;
  kind: "story" | "side";
  titleKey?: string;
  title?: string;
  giver?: string;
  blurbKey?: string;
  blurb?: string;
  status: "available" | "active" | "done" | "locked";
  rewardCash?: number;
  bestTime?: number;
}

export interface GtaPhoneCmd {
  type: "gps" | "start" | "orderPizza" | "shuttle" | "callMecha" | "abort";
  targetId?: string;
}

export interface GtaNote {
  id: number | string;
  icon?: "phone" | "cash" | "star" | "mission" | "pizza" | "scooter" | "security";
  title: string;
  text?: string;
}

export interface GtaBannerCard {
  id: number | string;
  style: "passed" | "failed" | "wasted" | "busted" | "mission";
  kicker?: string;
  title: string;
  sub?: string;
  rewardCash?: number;
  stats?: { label: string; value: string }[];
  quip?: string;
}

export interface GtaHudView {
  health: number;
  maxHealth: number;
  armour: number;
  maxArmour: number;
  stamina: number;
  maxStamina: number;

  wanted: number; // 0..5 integer stars
  wantedMax?: number;
  evading?: boolean;
  arrestProgress?: number; // 0..1

  cash: number;
  cashDelta?: number;
  cashDeltaKey?: number;

  weapon: "fists" | "textbook";
  hasTextbook?: boolean;
  pizzaSlices: number;
  pizzaBuffSec?: number;

  yaw: number; // camera compass bearing, degrees clockwise from north
  playerHeading?: number; // player/vehicle heading, degrees clockwise from north
  buildings: readonly GtaRadarBuilding[];
  roads?: readonly GtaRadarRoad[];
  gpsRoute?: readonly (readonly [number, number])[];
  blips: readonly GtaRadarBlip[];

  timer?: { seconds: number; label?: string; urgent?: boolean };
  radio?: { id: string; name: string; genre?: string; off?: boolean; key?: number };

  prompt?: { key: string; text: string; action?: string };
  subtitle?: { who?: string; text: string; colorIdx?: number };
  objective?: string;

  place?: { zone?: string; street?: string; showKey?: number };
  vehicle?: {
    kind: VehicleKind;
    name: string;
    kmh: number;
    gear: string;
    rpm: number;
    health?: number;
    state?: "ok" | "smoking" | "wrecked";
  };

  phoneUnread?: boolean;
  jobs?: readonly GtaPhoneJob[];
  stats?: { label: string; value: string }[];
  onPhoneAction?: (cmd: GtaPhoneCmd) => void;

  notes?: readonly GtaNote[];
  card?: GtaBannerCard;
}

// Legacy Round 1 exports preserved so scene/game.ts compiles cleanly during integration.
export interface RadarBlip {
  x: number;
  y: number;
  kind: "main" | "activity" | "pizza" | "cart" | "foe" | "npc" | "checkpoint";
}

export interface RadarBuilding {
  pts: readonly (readonly [number, number])[];
}

export interface OpenWorldHudView {
  cred: number;
  heat: number;
  heatFill: number;
  pizzaBuff: number;
  pizzaSeconds: number;
  pizzasEaten: number;
  yaw: number;
  buildings: readonly RadarBuilding[];
  blips: readonly RadarBlip[];
  nearSpot?: { kind: "pizzaCart" | "clubStand"; activity: "pizzaBrawl" | "pizzaRun" | "clubDuel" | "cramRally"; placeName: string };
  activity?: {
    key: "pizzaBrawl" | "pizzaRun" | "clubDuel" | "cramRally";
    stage: "fight" | "eat" | "checkpoints";
    got: number;
    need: number;
    timer?: number;
    maxTimer?: number;
    metres?: number;
    bearing?: number;
    placeName: string;
  };
}

const BASE_RANGE = 115;

const BLIP_ORDER: Record<GtaBlipKind, number> = {
  pedestrian: 0,
  npc: 0,
  scooter: 1,
  vehicle: 1,
  mecha: 5,
  pickup: 2,
  rival: 3,
  foe: 3,
  security: 4,
  cart: 5,
  pizza: 5,
  checkpoint: 6,
  objective: 6,
  activity: 6,
  destination: 7,
  mission: 8,
  main: 8,
};

const BLIP_COLOR: Record<GtaBlipKind, string> = {
  mission: "#ffcb2e",
  main: "#ffcb2e",
  objective: "#ffcb2e",
  destination: "#ffcb2e",
  checkpoint: "#5cf28c",
  activity: "#2de2d0",
  pizza: "#ff9f43",
  cart: "#ff9f43",
  vehicle: "#7cc4ff",
  scooter: "#2de2d0",
  mecha: "#ff5252",
  security: "#4d8dff",
  rival: "#ff3355",
  foe: "#ff3355",
  pedestrian: "#9db8ff",
  npc: "#9db8ff",
  pickup: "#2de2d0",
};

function arcPath(r: number, a0: number, a1: number, cw: boolean): string {
  const pt = (a: number): [number, number] => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 ${cw ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const HEALTH_D = arcPath(93, 194, 346, true);
const ARMOUR_D = arcPath(93, 166, 14, false);
const STAMINA_D = arcPath(86, 152, 208, true);

function drawBlipGlyph(ctx: CanvasRenderingContext2D, sx: number, sy: number, kind: GtaBlipKind, color: string, clamped: boolean): void {
  const ink = "#05080f";
  ctx.save();
  ctx.translate(sx, sy);
  if (clamped) ctx.scale(0.84, 0.84);

  switch (kind) {
    case "mission":
    case "main": {
      ctx.beginPath();
      ctx.moveTo(0, -6.5);
      ctx.lineTo(6.5, 0);
      ctx.lineTo(0, 6.5);
      ctx.lineTo(-6.5, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.fillRect(-0.9, -3.5, 1.8, 4.2);
      ctx.fillRect(-0.9, 1.7, 1.8, 1.7);
      break;
    }
    case "destination": {
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
      break;
    }
    case "objective":
    case "checkpoint":
    case "activity": {
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      break;
    }
    case "pizza":
    case "cart": {
      ctx.beginPath();
      ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -3.4);
      ctx.lineTo(3.2, 2.8);
      ctx.lineTo(-3.2, 2.8);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      break;
    }
    case "vehicle":
    case "scooter": {
      ctx.beginPath();
      ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
      ctx.fillStyle = ink;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(-2.4, -1.5, 4.8, 3);
      break;
    }
    case "mecha": {
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5.2, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5.2, 0);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#68f6ff";
      ctx.fill();
      break;
    }
    case "security": {
      ctx.beginPath();
      ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#ff3355";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    }
    case "rival":
    case "foe": {
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      break;
    }
    case "pickup": {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = ink;
      ctx.fillRect(-3.6, -3.6, 7.2, 7.2);
      ctx.fillStyle = color;
      ctx.fillRect(-2.3, -2.3, 4.6, 4.6);
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

export function GameRadar({
  gta,
  paused,
  northLabel,
  ariaLabel,
  onClick,
}: {
  gta: GtaHudView;
  paused: boolean;
  northLabel: string;
  ariaLabel: string;
  onClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = canvas.clientWidth;
    if (size <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pxSize = Math.round(size * dpr);
    if (canvas.width !== pxSize || canvas.height !== pxSize) {
      canvas.width = pxSize;
      canvas.height = pxSize;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const R = size / 2;
    const kmh = gta.vehicle?.kmh ?? 0;
    const range = gta.vehicle ? BASE_RANGE * (1 + Math.min(1.1, kmh / 65)) : BASE_RANGE;
    const scale = R / range;
    const yawRad = (gta.yaw * Math.PI) / 180;
    const sinY = Math.sin(yawRad);
    const cosY = Math.cos(yawRad);

    const toRadar = (dx: number, dy: number): [number, number] => {
      const right = dx * cosY - dy * sinY;
      const forward = dx * sinY + dy * cosY;
      return [right * scale, -forward * scale];
    };

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Circular Harbour-Night mask
    ctx.beginPath();
    ctx.arc(R, R, R, 0, Math.PI * 2);
    ctx.clip();

    // Dark slate campus ground
    const bg = ctx.createRadialGradient(R, R, R * 0.1, R, R, R);
    bg.addColorStop(0, "#101a2c");
    bg.addColorStop(1, "#09101d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Subtle range circle
    ctx.save();
    ctx.translate(R, R);
    ctx.strokeStyle = "rgba(126, 224, 255, 0.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Vector roads (minor then major)
    if (gta.roads?.length) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const pass of [false, true]) {
        ctx.strokeStyle = pass ? "#3b526b" : "#253549";
        ctx.lineWidth = pass ? Math.max(3, 8 * scale) : Math.max(1.8, 4.5 * scale);
        ctx.beginPath();
        for (const r of gta.roads) {
          if (!!r.major !== pass || r.pts.length < 2) continue;
          for (let i = 0; i < r.pts.length; i++) {
            const [sx, sy] = toRadar(r.pts[i]![0], r.pts[i]![1]);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
      }
    }

    // Building footprints
    ctx.fillStyle = "#182332";
    ctx.strokeStyle = "#0b111a";
    ctx.lineWidth = 1;
    for (const b of gta.buildings) {
      if (b.pts.length < 3) continue;
      ctx.beginPath();
      for (let i = 0; i < b.pts.length; i++) {
        const [sx, sy] = toRadar(b.pts[i]![0], b.pts[i]![1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Area radius blips
    for (const b of gta.blips) {
      if (!(b.radius && b.radius > 0)) continue;
      const [sx, sy] = toRadar(b.x, b.y);
      const col = b.color ?? BLIP_COLOR[b.kind] ?? "#ffcb2e";
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius * scale, 0, Math.PI * 2);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = col;
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Yellow GPS route polyline
    if (gta.gpsRoute && gta.gpsRoute.length >= 2) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < gta.gpsRoute.length; i++) {
        const [sx, sy] = toRadar(gta.gpsRoute[i]![0], gta.gpsRoute[i]![1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = "rgba(3, 7, 12, 0.88)";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = "#ffcb2e";
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }

    // Icon blips (rim-clamped when out of range)
    const rim = R - 9;
    const sorted = [...gta.blips].sort((a, b) => BLIP_ORDER[a.kind] - BLIP_ORDER[b.kind]);
    for (const b of sorted) {
      if (b.radius && b.radius > 0 && b.kind !== "mission" && b.kind !== "main") continue;
      let [sx, sy] = toRadar(b.x, b.y);
      const dist = Math.hypot(sx, sy);
      let clamped = false;
      if (dist > rim) {
        if (b.short) continue;
        sx = (sx / dist) * rim;
        sy = (sy / dist) * rim;
        clamped = true;
      }
      const col = b.color ?? BLIP_COLOR[b.kind] ?? "#f4f1ea";
      drawBlipGlyph(ctx, sx, sy, b.kind, col, clamped);
    }

    // Rotating North compass pip on rim
    const nR = R - 10;
    const nx = -sinY * nR;
    const ny = -cosY * nR;
    ctx.beginPath();
    ctx.arc(nx, ny, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = "#05080f";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 241, 234, 0.65)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = "#f4f1ea";
    ctx.font = '700 9.5px "Bahnschrift Condensed", "Arial Narrow", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(northLabel, nx, ny + 0.5);

    // Center player chevron
    const headingDiff = (((gta.playerHeading ?? gta.yaw) - gta.yaw) * Math.PI) / 180;
    ctx.save();
    ctx.rotate(headingDiff);
    ctx.beginPath();
    ctx.moveTo(0, -7.5);
    ctx.lineTo(5.2, 5.8);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5.2, 5.8);
    ctx.closePath();
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#05080f";
    ctx.stroke();
    ctx.fillStyle = "#f4f1ea";
    ctx.fill();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }, [gta, paused, northLabel]);

  const hpPct = Math.max(0, Math.min(100, Math.round((gta.health / Math.max(1, gta.maxHealth)) * 1000) / 10));
  const apPct = Math.max(0, Math.min(100, Math.round((gta.armour / Math.max(1, gta.maxArmour)) * 1000) / 10));
  const spPct = Math.max(0, Math.min(100, Math.round((gta.stamina / Math.max(1, gta.maxStamina)) * 1000) / 10));
  const tired = gta.stamina < gta.maxStamina * 0.98;

  return (
    <button
      type="button"
      class={`g-radar ${tired ? "is-tired" : ""} ${apPct > 0 ? "has-armor" : ""}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <canvas id="game-radar" class="g-radar-canvas" ref={canvasRef} role="img" aria-label={ariaLabel} />
      <svg class="g-ring" viewBox="0 0 200 200" aria-hidden="true">
        <path d={HEALTH_D} class="g-ring-track" pathLength={100} />
        <path d={ARMOUR_D} class="g-ring-track" pathLength={100} />
        <path d={HEALTH_D} class="g-ring-health" pathLength={100} stroke-dasharray={`${hpPct} 100`} />
        <path d={ARMOUR_D} class="g-ring-armor" pathLength={100} stroke-dasharray={`${apPct} 100`} />
        <path d={STAMINA_D} class="g-ring-stamina" pathLength={100} stroke-dasharray={`${spPct} 100`} />
      </svg>
      <span class="g-radar-rim" aria-hidden="true" />
    </button>
  );
}
