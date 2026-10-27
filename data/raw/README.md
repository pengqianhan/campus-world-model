# Raw snapshots

Raw responses from data sources are cached here by `scripts/lib/snapshot.ts`.
Everything in this folder is gitignored except `osm/` (OpenStreetMap data, ODbL), `terrain/`
(elevation tiles holding the LINZ 8 m DEM, CC BY 3.0 NZ) and this file.
`../sources.json` records the URL, fetch time, size and sha256 of every snapshot.

`overpass-closed.txt` (gitignored) records each Overpass instance that refused a query (401, 403), sent
it elsewhere (a redirect) or dropped the connection where another instance answered after it, with a
status, a redirect or a body (`scripts/lib/overpass.ts`): closed is a verdict, so `scripts/fetch-osm.ts`
does not ask it again until a person deletes its line. A snapshot already here is read with no request,
whatever the record says; a fault of ours (a query answered 400, a file that cannot be written) stops
the run and is never recorded, and nor is a drop that no answer follows (the network may be ours).
