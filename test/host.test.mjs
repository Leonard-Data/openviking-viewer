// Independent behavioral verification of the OpenViking viewer Host half.
// Read-only: starts a local mock OpenViking server, never talks to a real one.
import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Isolate the home directory: a real ~/.openviking/ovcli.conf on this machine
// must not change the connection-resolution results under test.
const ORIGINAL_HOME = process.env.HOME
const ISOLATED_HOME = mkdtempSync(join(tmpdir(), 'ovv-test-home-'))
process.env.HOME = ISOLATED_HOME

const plugin = await import(new URL('../index.js', import.meta.url).href)
const { createRoutes, resolveConnection, apply } = plugin

const KEY = 'verify-secret-key-9f3c'
const MOCK_CONFIG_FILE = '/nonexistent/verify/ovcli.conf'

let server
let mockUrl
const requests = []
const state = { failTargets: new Set() }

// ---------------------------------------------------------------- mock server

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => resolve(raw))
  })
}

function send(res, status, value) {
  const text = JSON.stringify(value)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(text)
}

const MEMORIES = [
  {
    uri: 'viking://~/memories/preferences',
    name: 'preferences',
    isDir: true,
    size: 0,
    modTime: '2026-11-05T08:00:00Z',
    abstract: 'User preferences by topic.',
  },
  {
    uri: 'viking://~/memories/profile.md',
    name: 'profile.md',
    isDir: false,
    // mod_time (snake case) exercises the alias normalization.
    mod_time: '2026-11-05T08:30:00Z',
    size: 4213,
    abstract: 'Stable facts about the user.',
  },
]
const RESOURCES = [
  { uri: 'viking://~/resources/deploy-notes.md', name: 'deploy-notes.md', isDir: false, size: 12, modTime: '2026-11-04T10:00:00Z', abstract: 'Deploy notes.' },
]
const SKILLS = []

async function handle(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1')
  const body = await readBody(req)
  requests.push({
    method: req.method,
    pathname: url.pathname,
    search: Object.fromEntries(url.searchParams),
    headers: req.headers,
    body,
  })

  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, { status: 'ok', result: { status: 'up' } })
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/system/status') {
    return send(res, 200, {
      status: 'ok',
      result: {
        version: '1.2.3',
        user: 'alice',
        account: 'acct-1',
        uptime: 123,
        nested: { deep: true },
        list: [1, 2, 3],
        ok: true,
      },
    })
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/fs/ls') {
    const uri = url.searchParams.get('uri') || ''
    const offset = Number(url.searchParams.get('offset') || '0')
    // Specific pagination case: second page of the memories root.
    if (uri === 'viking://~/memories' && offset >= 2) {
      return send(res, 200, {
        status: 'ok',
        result: [{ uri: 'viking://~/memories/paged.md', name: 'paged.md', isDir: false, size: 1 }],
        has_more: true,
      })
    }
    const table = {
      'viking://~/memories': MEMORIES,
      'viking://~/resources': RESOURCES,
      'viking://~/skills': SKILLS,
    }
    return send(res, 200, { status: 'ok', result: table[uri] ?? [], has_more: false })
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/content/read') {
    return send(res, 200, { status: 'ok', result: '# Profile\nHello' })
  }
  if (req.method === 'GET' && url.pathname === '/api/v1/fs/stat') {
    return send(res, 200, {
      status: 'ok',
      result: { size: 1234, modTime: '2026-11-05T08:30:00Z', isDir: false, id: 'stat-1' },
    })
  }
  if (req.method === 'POST' && url.pathname === '/api/v1/search/find') {
    let parsed = {}
    try { parsed = JSON.parse(body || '{}') } catch { parsed = {} }
    const target = String(parsed.target_uri || '')
    const scope = target.includes('/resources') ? 'resources' : target.includes('/skills') ? 'skills' : 'memories'
    if (state.failTargets.has(target)) {
      return send(res, 500, { status: 'error', error: `mock upstream failure for ${scope}` })
    }
    const hits = scope === 'memories'
      ? [{
          uri: 'viking://~/memories/deploy.md',
          title: 'Deploy preferences',
          abstract: 'Prefers blue-green deploys.',
          score: 0.87,
        }]
      : []
    return send(res, 200, {
      status: 'ok',
      result: { [scope]: hits },
    })
  }
  return send(res, 404, { status: 'error', error: `unexpected mock path ${req.method} ${url.pathname}` })
}

before(async () => {
  server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      try { send(res, 500, { status: 'error', error: String(error) }) } catch { /* closed */ }
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  mockUrl = `http://127.0.0.1:${server.address().port}`
})

beforeEach(() => {
  requests.length = 0
  state.failTargets.clear()
})

after(async () => {
  process.env.HOME = ORIGINAL_HOME
  rmSync(ISOLATED_HOME, { recursive: true, force: true })
  if (!server) return
  await new Promise((resolve) => server.close(resolve))
  server = undefined
})

// -------------------------------------------------------------------- helpers

function env(overrides = {}) {
  return {
    OPENVIKING_URL: mockUrl,
    OPENVIKING_API_KEY: KEY,
    OPENVIKING_CONFIG_FILE: MOCK_CONFIG_FILE,
    ...overrides,
  }
}

function routesFor(config = {}, environment = env()) {
  return createRoutes(config, environment)
}

async function call(routes, pathAndQuery) {
  const path = pathAndQuery.split('?')[0]
  const route = routes.find((entry) => entry.path === path)
  assert.ok(route, `no route registered for ${path}`)
  const response = await route.fetch(new Request(`http://viewer.test${pathAndQuery}`))
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { json = null }
  return { response, status: response.status, text, json }
}

function assertNoSecret(text) {
  assert.equal(text.includes(KEY), false, 'an OpenViking API key leaked into a route response body')
}

// ------------------------------------------------------- resolveConnection

test('resolveConnection: env precedence, trusted auth, source env', () => {
  const connection = resolveConnection({}, {
    OPENVIKING_URL: 'http://127.0.0.1:1999',
    OPENVIKING_API_KEY: 'env-key',
    OPENVIKING_ACCOUNT: 'env-account',
    OPENVIKING_CONFIG_FILE: MOCK_CONFIG_FILE,
  })
  assert.equal(connection.baseUrl, 'http://127.0.0.1:1999')
  assert.equal(connection.hasApiKey, true)
  assert.equal(connection.authMode, 'trusted')
  assert.equal(connection.source, 'env')
  assert.equal(connection.account, 'env-account')
})

test('resolveConnection: plugin config beats env', () => {
  const connection = resolveConnection(
    { endpoint: 'http://127.0.0.1:8123', apiKey: 'plugin-key' },
    { OPENVIKING_URL: 'http://127.0.0.1:1999', OPENVIKING_API_KEY: 'env-key', OPENVIKING_CONFIG_FILE: MOCK_CONFIG_FILE },
  )
  assert.equal(connection.baseUrl, 'http://127.0.0.1:8123')
  assert.equal(connection.source, 'plugin')
  assert.equal(connection.hasApiKey, true)
  assert.equal(connection.authMode, 'api_key')
})

test('resolveConnection: default port 1933 when nothing is configured', () => {
  const connection = resolveConnection({}, {})
  assert.equal(connection.baseUrl, 'http://127.0.0.1:1933')
  assert.equal(connection.source, 'default')
  assert.equal(connection.hasApiKey, false)
  assert.equal(connection.authMode, 'none')
})

// ------------------------------------------------------------- route table

test('createRoutes: four read-only GET routes on /api/openviking', () => {
  const routes = routesFor()
  assert.deepEqual(
    routes.map((route) => route.path).sort(),
    ['/api/openviking/list', '/api/openviking/read', '/api/openviking/search', '/api/openviking/status'],
  )
  for (const route of routes) {
    assert.deepEqual(route.methods, ['GET'])
    assert.equal(route.requestBody, 'buffered')
    assert.equal(typeof route.fetch, 'function')
  }
})

// ------------------------------------------------------------- status route

test('status route: reachable, projected server, space counts, pending, no key leak', async () => {
  const { status, text, json } = await call(routesFor(), '/api/openviking/status')
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  const data = json.data

  assert.equal(data.reachable, true)
  assert.equal(data.health.ok, true)
  assert.equal(typeof data.at, 'string')

  // Server projection: scalars kept, nested objects/arrays dropped.
  assert.equal(data.server.version, '1.2.3')
  assert.equal(data.server.user, 'alice')
  assert.equal(data.server.account, 'acct-1')
  assert.equal(data.server.nested, undefined)
  assert.equal(data.server.list, undefined)

  // Space counts come from the three ls calls (2 memories, 1 resource, 0 skills).
  assert.deepEqual(data.spaces.map((space) => space.count), [2, 1, 0])
  assert.deepEqual(data.spaces.map((space) => space.error), [null, null, null])
  assert.deepEqual(data.spaces.map((space) => space.label), ['memories', 'resources', 'skills'])

  // Local pending backlog shape.
  assert.match(data.pending.dir, /^~\//)
  assert.equal(typeof data.pending.count, 'number')
  assert.equal(Number.isInteger(data.pending.count), true)

  // Connection exposure: presence only, never the secret.
  assert.equal(data.connection.hasApiKey, true)
  assert.equal(data.connection.authMode, 'api_key')
  assert.equal(Object.prototype.hasOwnProperty.call(data.connection, 'apiKey'), false)
  assertNoSecret(text)
})

// --------------------------------------------------------------- list route

test('list route: entries normalized and hasMore follows has_more', async () => {
  const uri = encodeURIComponent('viking://~/memories')
  const { status, text, json } = await call(routesFor(), `/api/openviking/list?uri=${uri}`)
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  const data = json.data
  assert.equal(data.uri, 'viking://~/memories')
  assert.equal(data.entries.length, 2)
  assertNoSecret(text)

  const dir = data.entries[0]
  assert.equal(dir.name, 'preferences')
  assert.equal(dir.uri, 'viking://~/memories/preferences')
  assert.equal(dir.isDir, true)
  assert.equal(dir.size, 0)
  assert.equal(dir.modTime, '2026-11-05T08:00:00Z')
  assert.equal(dir.abstract, 'User preferences by topic.')

  const file = data.entries[1]
  assert.equal(file.name, 'profile.md')
  assert.equal(file.isDir, false)
  assert.equal(file.size, 4213)
  // Snake-case mod_time must be normalized into modTime.
  assert.equal(file.modTime, '2026-11-05T08:30:00Z')
  assert.equal(file.abstract, 'Stable facts about the user.')

  assert.equal(data.hasMore, false)
  assert.equal(data.limit, 200)
  assert.equal(data.offset, 0)

  // Specific pagination case: the mock answers has_more: true for offset >= 2.
  const paged = await call(routesFor(), `/api/openviking/list?uri=${uri}&offset=2`)
  assert.equal(paged.status, 200)
  assert.equal(paged.json.data.hasMore, true)
  assert.equal(paged.json.data.offset, 2)
})

// --------------------------------------------------------------- read route

test('read route: content string, stat.size used for size, chars correct', async () => {
  const uri = encodeURIComponent('viking://~/memories/profile.md')
  const { status, text, json } = await call(routesFor(), `/api/openviking/read?uri=${uri}`)
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  const data = json.data
  assert.equal(data.content, '# Profile\nHello')
  assert.equal(data.chars, 15)
  assert.equal(data.size, 1234, 'stat.size must win over the byte length of content')
  assert.equal(data.truncated, false)
  assert.equal(data.stat.size, 1234)
  assert.equal(data.stat.isDir, false)
  assert.equal(data.stat.modTime, '2026-11-05T08:30:00Z')
  assertNoSecret(text)
})

// ------------------------------------------------------------- search route

test('search route: hits parsed with scope/uri/title/score and per-scope counts', async () => {
  const { status, text, json } = await call(routesFor(), '/api/openviking/search?q=deploy')
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  const data = json.data
  assert.equal(data.query, 'deploy')
  assert.equal(data.scope, 'all')
  assertNoSecret(text)

  assert.equal(data.hits.length, 1)
  const hit = data.hits[0]
  assert.equal(hit.scope, 'memories')
  assert.equal(hit.uri, 'viking://~/memories/deploy.md')
  assert.equal(hit.title, 'Deploy preferences')
  assert.equal(hit.abstract, 'Prefers blue-green deploys.')
  assert.equal(hit.score, 0.87)
  assert.equal(typeof data.elapsedMs, 'number')

  assert.deepEqual(
    data.scopes.map((entry) => [entry.scope, entry.count, entry.error]),
    [['memories', 1, null], ['resources', 0, null], ['skills', 0, null]],
  )

  // The POST body the host half sends is JSON with query/target_uri/limit.
  const post = requests.find((request) => request.method === 'POST' && request.pathname === '/api/v1/search/find')
  assert.ok(post, 'expected a POST to /api/v1/search/find')
  const sent = JSON.parse(post.body)
  assert.equal(sent.query, 'deploy')
  assert.equal(sent.limit, 10)
  assert.match(sent.target_uri, /^viking:\/\/~\/memories$/)
})

test('search route: one failing scope does not fail the response', async () => {
  state.failTargets.add('viking://~/resources')
  const { status, json } = await call(routesFor(), '/api/openviking/search?q=deploy')
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  const byScope = Object.fromEntries(json.data.scopes.map((entry) => [entry.scope, entry]))
  assert.equal(byScope.memories.error, null)
  assert.equal(byScope.memories.count, 1)
  assert.notEqual(byScope.resources.error, null)
  assert.equal(typeof byScope.resources.error, 'string')
  assert.match(byScope.resources.error, /mock upstream failure for resources/)
  assert.equal(json.data.hits.length, 1, 'hits from healthy scopes must survive')
})

// -------------------------------------------------------------- validation

test('validation: rejects non-viking URIs, control chars and empty queries', async () => {
  const badScheme = await call(routesFor(), `/api/openviking/list?uri=${encodeURIComponent('http://evil.test/x')}`)
  assert.equal(badScheme.status, 400)
  assert.equal(badScheme.json.ok, false)
  assert.equal(typeof badScheme.json.error, 'string')

  const control = await call(routesFor(), `/api/openviking/list?uri=${encodeURIComponent('viking://~/memories/\u0000bad')}`)
  assert.equal(control.status, 400)
  assert.equal(control.json.ok, false)
  assert.match(control.json.error, /control/i)

  const readBad = await call(routesFor(), `/api/openviking/read?uri=${encodeURIComponent('/etc/passwd')}`)
  assert.equal(readBad.status, 400)
  assert.equal(readBad.json.ok, false)

  const emptySearch = await call(routesFor(), '/api/openviking/search')
  assert.equal(emptySearch.status, 400)
  assert.equal(emptySearch.json.ok, false)
  assert.equal(typeof emptySearch.json.error, 'string')

  const blankSearch = await call(routesFor(), '/api/openviking/search?q=%20%20')
  assert.equal(blankSearch.status, 400)
  assert.equal(blankSearch.json.ok, false)
})

// ------------------------------------------------------------ unreachable

test('unreachable server: status is 200/reachable:false, data routes are 502', async () => {
  const deadEnv = { OPENVIKING_URL: 'http://127.0.0.1:1', OPENVIKING_CONFIG_FILE: MOCK_CONFIG_FILE }
  const routes = routesFor({}, deadEnv)

  const statusCall = await call(routes, '/api/openviking/status')
  assert.equal(statusCall.status, 200)
  assert.equal(statusCall.json.ok, true)
  const data = statusCall.json.data
  assert.equal(data.reachable, false)
  assert.equal(data.health.ok, false)
  assert.equal(typeof data.health.error, 'string')
  assert.match(data.health.error, /127\.0\.0\.1:1/)
  assert.deepEqual(data.spaces, [])

  const uri = encodeURIComponent('viking://~/memories')
  for (const path of [
    `/api/openviking/list?uri=${uri}`,
    `/api/openviking/read?uri=${uri}`,
    '/api/openviking/search?q=deploy',
  ]) {
    const result = await call(routes, path)
    assert.equal(result.status, 502, `${path} must answer 502 when the server is down`)
    assert.equal(result.json.ok, false)
    assert.equal(typeof result.json.error, 'string')
    assert.match(result.json.error, /127\.0\.0\.1:1/)
  }
})

// -------------------------------------------------------------- auth headers

test('auth headers: bearer + x-api-key always, trusted headers when trusted', async () => {
  await call(routesFor(), `/api/openviking/list?uri=${encodeURIComponent('viking://~/memories')}`)
  const apiKeyRequest = requests.find((request) => request.pathname === '/api/v1/fs/ls')
  assert.ok(apiKeyRequest, 'expected a request to /api/v1/fs/ls')
  assert.equal(apiKeyRequest.headers.authorization, `Bearer ${KEY}`)
  assert.equal(apiKeyRequest.headers['x-api-key'], KEY)

  await call(
    routesFor({}, env({
      OPENVIKING_AUTH_MODE: 'trusted',
      OPENVIKING_ACCOUNT: 'acct-trusted',
      OPENVIKING_USER: 'user-trusted',
    })),
    `/api/openviking/list?uri=${encodeURIComponent('viking://~/memories')}`,
  )
  const trustedRequest = requests.filter((request) => request.pathname === '/api/v1/fs/ls').at(-1)
  assert.ok(trustedRequest)
  assert.equal(trustedRequest.headers['x-openviking-account'], 'acct-trusted')
  assert.equal(trustedRequest.headers['x-openviking-user'], 'user-trusted')
})

test('apply(): registers four routes through ctx.connection.fetch and cleans up', () => {
  const registered = []
  const disposers = []
  const labels = []
  const ctx = {
    connection: {
      fetch: {
        register(route) {
          registered.push(route)
          return () => {
            const index = registered.indexOf(route)
            if (index >= 0) registered.splice(index, 1)
          }
        },
      },
    },
    effect(setup, label) {
      labels.push(label)
      disposers.push(setup())
    },
  }

  apply(ctx, {})
  assert.equal(registered.length, 4)
  assert.deepEqual(
    registered.map((route) => route.path).sort(),
    ['/api/openviking/list', '/api/openviking/read', '/api/openviking/search', '/api/openviking/status'],
  )
  assert.equal(labels.length, 1)
  assert.match(labels[0], /openviking-viewer/)

  for (const dispose of disposers) dispose()
  assert.equal(registered.length, 0, 'dispose must unregister every route')
})
