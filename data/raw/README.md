# Raw snapshots

Raw responses from data sources are cached here by `scripts/lib/snapshot.ts`.
Everything in this folder is gitignored except `osm/` (OpenStreetMap data, ODbL), `terrain/`
(elevation tiles holding the LINZ 8 m DEM, CC BY 3.0 NZ) and this file.
`../sources.json` records the URL, fetch time, size and sha256 of every snapshot.

`overpass-closed.txt` (gitignored) records each Overpass instance that refused a query (401, 403), sent
it elsewhere (a redirect) or dropped the connection (a reset, a close, a refused connection) where
another instance answered after it (`scripts/lib/overpass.ts`): closed is a verdict, so
`scripts/fetch-osm.ts` does not ask it again until a person deletes its line. A snapshot already here is
read with no request, whatever the record says. Never recorded: a busy instance, a timeout, a failure
whose error does not show the host's answer (a name not resolved, no route, an error on this machine such
as a firewall or a certificate it does not trust: the network may be ours), a drop that no answer
follows, and a fault of ours (a query answered 400, a file that cannot be written), which stops the run.
A refusal, a reset or a close made on this side (by a local firewall, say) can still close an instance:
delete its line then.
