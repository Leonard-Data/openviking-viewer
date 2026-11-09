# OpenViking memory viewer

[![CI](https://github.com/Leonard-Data/openviking-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/Leonard-Data/openviking-viewer/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Leonard-Data/openviking-viewer?sort=semver)](https://github.com/Leonard-Data/openviking-viewer/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A [DeepSeek Harness](https://github.com/Leonard-Data/deepseek-harness) Web UI plugin that shows the OpenViking memory behind the
harness's memory plugin: what the agent remembers, which resources it imported,
which skills are stored, and what a semantic search over all of it returns.

## What it adds

- **A sidebar panel** (memory-stack icon): connection state, the three memory
  roots with live entry counts, and the local capture backlog when the
  OpenViking server is unreachable.
- **Memories / Resources / Skills tabs** — each lists `viking://~/<root>` and
  lets you walk nested directories.
- **A reader** — click any file to read its Markdown/plain text in place, with
  size, modification time, and a copy-URI action.
- **Search** — semantic search over memories, resources, and skills through the
  server's `/api/v1/search/find`, with per-scope result counts.
- **Browse** — open any `viking://` URI directly, with a clickable breadcrumb.

It is strictly read-only. There is no delete, edit, or write action anywhere in
the panel; the memory the agent depends on cannot be changed from the browser.

## Requirements

- DeepSeek Harness with the Web UI, on Node.js 20 or newer.
- The `@openviking/dsh-memory-plugin` connection settings you already use, or
  explicit ones for this viewer (see below). The viewer resolves the server from
  the same places the memory plugin does, so pointing the memory plugin at a
  server points the viewer at the same one.
- A reachable OpenViking server. Without one the panel still works: it explains
  what is missing, shows the resolved endpoint, and reports the local
  `~/.openviking/pending` capture backlog instead of showing an empty page.

## The OpenViking server

The panel needs an OpenViking server to read. Any reachable one works; the
reference stack used to develop this plugin is published separately as
[openviking-server](https://github.com/Leonard-Data/openviking-server) —
OpenViking on `127.0.0.1:1933`, Ollama for embeddings, and a local proxy for
memory extraction.

Because the viewer resolves its connection from the same places the memory
plugin does (see below), pointing the memory plugin at a server points the
viewer at the same one. Nothing viewer-side changes when the server moves.

## Installation

### From a release

```bash
curl -fLO https://github.com/Leonard-Data/openviking-viewer/releases/latest/download/local-openviking-viewer-0.1.0.tgz
dsh plugin install ./local-openviking-viewer-0.1.0.tgz
```

### From a clone

```bash
git clone https://github.com/Leonard-Data/openviking-viewer.git
cd openviking-viewer
npm test                       # optional: the checks are dependency-free
dsh plugin install .
```

### Through the agent

Ask the agent to run `plugin_manager` with `install_bundle` against the
directory you cloned into, for example `/root/plugins/openviking-viewer`.

Then restart the harness process so the Web UI picks up the client bundle, and
open the memory-stack icon in the sidebar. If no server answers, the panel says
so and shows the endpoint it resolved — that message is the fastest way to find
a wrong endpoint.

```bash
curl -s http://127.0.0.1:1933/health     # the server the panel expects
```

## Connection resolution

Checked in order, first value wins per field:

| Order | Source | Keys |
| --- | --- | --- |
| 1 | This plugin's loader row `config` | `endpoint`/`baseUrl`/`url`, `apiKey`, `account`, `user`, `peerId`, `authMode` |
| 2 | Harness environment | `OPENVIKING_URL`, `OPENVIKING_BASE_URL`, `OPENVIKING_API_KEY`, `OPENVIKING_ACCOUNT`, `OPENVIKING_USER`, `OPENVIKING_PEER_ID`, `OPENVIKING_AUTH_MODE` |
| 3 | `~/.openviking/ovcli.conf` (or `$OPENVIKING_CONFIG_FILE`) | `url`, `api_key`, `account`, `user`, `actor_peer_id` |
| 4 | `~/.openviking/ov.conf` | `server.url`, `server.host`/`server.port`, `server.root_api_key` |
| 5 | Default | `http://127.0.0.1:1933` |

To set the connection in the profile instead of the environment, add a `config`
block to this bundle's row in the user patch layer:

```yaml
- id: openviking-viewer
  config:
    endpoint: http://127.0.0.1:1933
    apiKey: your-openviking-api-key
```

`ovcli.conf` is the simplest option when another OpenViking client already uses
the same file:

```json
{ "url": "http://127.0.0.1:1933", "api_key": "your-openviking-api-key" }
```

The API key stays in the Host process. Every browser response reports only
`hasApiKey`; the key itself is never serialized to the page.

## Privacy

The panel reads the OpenViking database through the harness's authenticated
`/api` channel, so only the harness owner's browser can reach it. No data leaves
the machine except the requests the Host makes to the configured OpenViking
server. The panel adds no telemetry and no third-party calls.

## Package layout

| File | Role |
| --- | --- |
| `index.js` | Host plugin: connection resolution, read-only `/api/openviking/*` routes |
| `client.js` | Web client module: sidebar entry, panel, reader, search |
| `cordis.patch.yml` | Inserts the plugin row into the profile |
| `locale/*.json` | Plugin Manager title and description |
| `icon.svg` | Panel artwork |
| `CONTRACT.md` | Host/Client route contract |

## Development

No dependencies, so there is nothing to install:

```bash
npm run lint    # node --check on both modules
npm test        # node:test
npm run build   # npm pack --dry-run: what a release would ship
```

| Test | Covers |
| --- | --- |
| `test/host.test.mjs` | connection resolution precedence, route behaviour |
| `test/client.test.mjs` | client-side URI handling and rendering helpers |

## License

[MIT](LICENSE)
