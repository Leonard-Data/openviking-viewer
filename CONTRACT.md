# OpenViking viewer — Host/Client contract

The Host half (`index.js`) owns every read of the OpenViking server and exposes it
through authenticated Fetch routes on the shared `/api` channel. The Web client
(`client.js`) is presentation only: it calls these routes and renders the results.

Package name (also the client module id): `@local/openviking-viewer`
Route base: `/api/openviking`

Every route answers `200` with `{ "ok": true, "data": ... }` or a non-2xx with
`{ "ok": false, "error": "<human readable message>" }`. The client always reads
`data` on success and `error` on failure.

All routes are GET and read-only. Nothing here mutates the OpenViking database.

## `GET /api/openviking/status`

Health + configuration + local backlog. Never throws for an unreachable server:
an unreachable server is reported in `data`.

```jsonc
{
  "at": "2026-11-05T09:30:00.000Z",
  "connection": {
    "baseUrl": "http://127.0.0.1:1933",
    "configured": false,            // an explicit endpoint or credential source was found
    "source": "default",            // "plugin" | "env" | "ovcli.conf" | "ov.conf" | "default"
    "hasApiKey": false,
    "authMode": "api_key",          // "api_key" | "trusted" | "none"
    "account": null,                // string or null
    "user": null,                   // string or null
    "peerId": null,                 // string or null
    "mcpUrl": "http://127.0.0.1:1933/mcp",
    "configFile": "~/.openviking/ovcli.conf"   // first credential file that exists, or null
  },
  "reachable": false,
  "health": { "ok": false, "status": 0, "error": "fetch failed", "latencyMs": 12 },
  "server": null,                   // trimmed /api/v1/system/status result when reachable
  "spaces": [                       // counts of the three browsing roots; empty when unreachable
    { "uri": "viking://~/memories",  "label": "memories",  "count": 42, "error": null },
    { "uri": "viking://~/resources", "label": "resources", "count": 8,  "error": null },
    { "uri": "viking://~/skills",    "label": "skills",    "count": 3,  "error": null }
  ],
  "pending": {                      // local dsh memory capture backlog
    "dir": "~/.openviking/pending",
    "count": 27,
    "oldestAt": "2026-11-05T09:01:00.000Z",
    "newestAt": "2026-11-05T09:02:00.000Z"
  }
}
```

`server` is a small projection of the OpenViking status payload — include only
scalars/strings, e.g. `{ "version": "...", "user": "...", "account": "..." }`;
unknown extra keys are allowed, the client renders `version`/`user` when present.

## `GET /api/openviking/list?uri=<viking-uri>&limit=<1..500>&offset=<0..>`

Lists one OpenViking directory (`viking://~/memories`, nested dirs, …).

```jsonc
{
  "uri": "viking://~/memories",
  "entries": [
    {
      "name": "preferences",
      "uri": "viking://~/memories/preferences",
      "isDir": true,
      "size": 4096,                    // number or null
      "modTime": "2026-11-05T08:00:00Z", // ISO string or null
      "abstract": "User preferences by topic."  // string or null
    }
  ],
  "hasMore": false,
  "limit": 200,
  "offset": 0
}
```

## `GET /api/openviking/read?uri=<viking-uri>`

Reads one file's content. `content` is the raw Markdown/plain text.

```jsonc
{
  "uri": "viking://~/memories/profile.md",
  "content": "# Profile\n…",
  "chars": 4213,          // characters actually returned (content caps at 512 KiB)
  "size": 4213,           // bytes from stat when available, else content bytes
  "truncated": false,
  "stat": { "size": 4213, "modTime": "2026-11-05T08:00:00Z", "isDir": false, "id": "…" }
}
```

`stat` may be `null` when the stat probe fails; the read itself is the authority.

## `GET /api/openviking/search?q=<query>&scope=<all|memories|resources|skills>&limit=<1..50>`

Semantic search over the same roots the dsh memory plugin uses.

```jsonc
{
  "query": "deploy",
  "scope": "all",
  "hits": [
    {
      "scope": "memories",
      "uri": "viking://~/memories/preferences/deploy.md",
      "title": "Deploy preferences",
      "abstract": "Prefers blue-green deploys…",
      "score": 0.87              // number or null
    }
  ],
  "scopes": [
    { "scope": "memories",  "count": 1, "error": null },
    { "scope": "resources", "count": 0, "error": null },
    { "scope": "skills",    "count": 0, "error": null }
  ],
  "elapsedMs": 41
}
```

Search failures confined to one scope are reported in `scopes[].error` and do
not fail the whole response — the hits the other scopes produced are still
returned. Only a request-level failure is an error response: a bad request
(empty query) or a failure every requested scope shares (server unreachable,
credential rejected).

## Client requirements

- Register the page in slot `main` (key `openviking`) and the sidebar icon in
  `sidebar.panellist` (id `openviking`, order 30), like `docker-compose-panel`.
- Plain `React.createElement`; `require('react')` is the only import.
- Style only with `--dsw-alias-*` theme tokens; no literal colors for chrome.
- All visible text through the locale dictionaries (`ctx.locale.register`).
- Read-only UI: no buttons that pretend to write memories; Refresh and search only.
