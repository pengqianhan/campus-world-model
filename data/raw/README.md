# Raw snapshots

Raw responses from data sources are cached here by `scripts/lib/snapshot.ts`.
Everything in this folder is gitignored except `osm/` (OpenStreetMap data, ODbL), `terrain/`
(elevation tiles holding the LINZ 8 m DEM, CC BY 3.0 NZ) and this file.
`../sources.json` records the URL, fetch time, size and sha256 of every snapshot.

`overpass-closed.txt` (gitignored) records each Overpass instance that refused a query, sent it elsewhere
or dropped the connection (`scripts/lib/overpass.ts`): closed is a verdict, so `scripts/fetch-osm.ts` does
not ask it again, in that run or a later one, until a person deletes its line.
