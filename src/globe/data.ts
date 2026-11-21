// What the globe on the page at the site's root draws (PROGRESS.md, "Decisions", A global collection of campus
// worlds), and the arithmetic that places it. scripts/build-root.ts writes the data into the page as JSON
// (scripts/lib/picker.ts, globeData), and the land as a file beside the globe's script; src/globe/main.ts reads
// both. Nothing here touches the DOM or WebGL, so the tests can run it.

/** One campus on the globe: a line of the list below it. */
export interface GlobePoint {
  id: string;
  /** The project's name. */
  site: string;
  /** The school, with its campus. */
  name: string;
  /** Its page: the school's map on this site, or the world's page. */
  href: string;
  lat: number;
  lon: number;
  /** A school of this site. */
  own: boolean;
}

/** What the page gives the globe: its points, its land file and its words. */
export interface GlobeData {
  points: GlobePoint[];
  /** The land, as GlobeLand, beside the script. */
  land: string;
  words: { label: string };
}

/** The land as the globe draws it: rings, each a flat list of lon, lat, lon, lat… in tenths of a degree, filled even-odd. */
export type GlobeLand = number[][];

/** A point on the unit sphere, in the frame of three's SphereGeometry, whose texture runs from lon -180 at u = 0 eastward. */
export function latLonToVector(lat: number, lon: number): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
}

/** The globe's turn about its axis and its tilt, in radians, that bring a place to face the viewer on +z. */
export function facing(lat: number, lon: number): { yaw: number; pitch: number } {
  return { yaw: (-(90 + lon) * Math.PI) / 180, pitch: (lat * Math.PI) / 180 };
}

/** Where on an equirectangular map of the given size a place falls, in pixels from its top left. */
export function mapPixel(lat: number, lon: number, width: number, height: number): [number, number] {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height];
}

/**
 * The land of a GeoJSON FeatureCollection of polygons and multipolygons, as GlobeLand: every ring kept, each
 * point rounded to a tenth of a degree, and a point that rounds to the one before it dropped.
 */
export function landFromGeoJson(geo: { features: { geometry: { type: string; coordinates: unknown } }[] }): GlobeLand {
  const out: GlobeLand = [];
  const polygon = (rings: number[][][]) => {
    for (const ring of rings) {
      const flat: number[] = [];
      for (const [lon, lat] of ring) {
        const x = Math.round(lon! * 10);
        const y = Math.round(lat! * 10);
        if (flat.length && flat[flat.length - 2] === x && flat[flat.length - 1] === y) continue;
        flat.push(x, y);
      }
      if (flat.length >= 6) out.push(flat);
    }
  };
  for (const f of geo.features) {
    if (f.geometry.type === "Polygon") polygon(f.geometry.coordinates as number[][][]);
    else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates as number[][][][]) polygon(p);
  }
  return out;
}

/** The middle of the points, as the place the globe first faces: the mean of their unit vectors, back to a latitude and a longitude. */
export function middle(points: { lat: number; lon: number }[]): { lat: number; lon: number } {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    const v = latLonToVector(p.lat, p.lon);
    x += v[0];
    y += v[1];
    z += v[2];
  }
  const r = Math.hypot(x, y, z);
  if (r < 1e-9) return { lat: 0, lon: 0 };
  return { lat: (Math.asin(y / r) * 180) / Math.PI, lon: (Math.atan2(-z, x) * 180) / Math.PI };
}
