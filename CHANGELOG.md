# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.1.0 — 2026-11-09

First published release. The plugin had been running on its author's host for
some time; this is the point at which it became an installable, tested repo.

### Added

- Sidebar panel showing connection state, the three memory roots with live
  entry counts, and the local `~/.openviking/pending` capture backlog when the
  server is unreachable.
- Memories / Resources / Skills tabs, each listing `viking://~/<root>` with
  nested-directory navigation.
- In-place reader for any file, with size, modification time, and a copy-URI
  action.
- Semantic search across memories, resources and skills through the server's
  `/api/v1/search/find`, with per-scope result counts.
- Direct `viking://` URI browsing with a clickable breadcrumb.
- Five-layer connection resolution — plugin row, `OPENVIKING_*` environment,
  `~/.openviking/ovcli.conf`, `~/.openviking/ov.conf`, then
  `http://127.0.0.1:1933` — so the viewer follows the memory plugin's server
  without a second credential to maintain.
- The API key stays in the Host process: browser responses report only
  `hasApiKey`, never the key.
- Strictly read-only: no delete, edit or write action exists in the panel.
- Node-based CI (lint, tests, packaging and metadata checks on Node 20/22/24)
  and a tag-driven release workflow.
