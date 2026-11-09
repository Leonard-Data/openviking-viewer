/**
 * Host half of the OpenViking memory viewer.
 *
 * The Web client reaches every OpenViking read through authenticated
 * `/api/openviking/*` Fetch routes owned by this plugin. Nothing here mutates
 * the OpenViking database: the viewer is read-only by design, so a browser
 * panel can never corrupt the memory the agent relies on.
 *
 * Connection resolution mirrors the dsh memory plugin's own chain, so the
 * viewer and the memory plugin always talk to the same server:
 *   plugin row config → OPENVIKING_* environment → ~/.openviking/ovcli.conf
 *   → ~/.openviking/ov.conf → http://127.0.0.1:1933
 *
 * The resolved API key is never returned to the browser; responses only say
 * whether one is configured.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'openviking-viewer'
export const inject = ['connection']

const API_BASE = '/api/openviking'
const DEFAULT_BASE_URL = 'http://127.0.0.1:1933'
const DEFAULT_TIMEOUT_MS = 12000
const HEALTH_TIMEOUT_MS = 5000
const STAT_TIMEOUT_MS = 6000
const MAX_CONTENT_CHARS = 512 * 1024
const MAX_URI_LENGTH = 2048
const MAX_QUERY_LENGTH = 500
const MAX_PENDING_FILES = 5000
const VERSION = readManifestVersion()
const USER_AGENT = `openviking-viewer/${VERSION}`

const SPACES = [
  { label: 'memories', uri: 'viking://~/memories' },
  { label: 'resources', uri: 'viking://~/resources' },
  { label: 'skills', uri: 'viking://~/skills' },
]
const SEARCH_TARGETS = {
  memories: 'viking://~/memories',
  resources: 'viking://~/resources',
  skills: 'viking://~/skills',
}
const SEARCH_SCOPES = ['all', ...Object.keys(SEARCH_TARGETS)]

/** A failure that maps to one HTTP status instead of a server error. */
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

function readManifestVersion() {
  try {
    const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    return typeof manifest.version === 'string' && manifest.version ? manifest.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/** Trimmed string or empty string; never throws on arbitrary input. */
function str(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function pick(...values) {
  for (const value of values) {
    const text = str(value)
    if (text) return text
  }
  return ''
}

function trimSlash(value) {
  return String(value).replace(/\/+$/, '')
}

function readJsonFile(path) {
  if (!path) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function existsFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/** `~`-relative display path for the browser; never leaks the home prefix. */
function displayPath(path) {
  const home = homedir()
  if (typeof path === 'string' && path.startsWith(home)) return `~${path.slice(home.length)}`
  return path
}

function clampInt(value, min, max, fallback) {
  const number = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

function lastSegment(uri) {
  const text = trimSlash(str(uri))
  if (!text) return ''
  const index = text.lastIndexOf('/')
  return index >= 0 ? text.slice(index + 1) : text
}

/**
 * Resolve the OpenViking connection from the plugin row, the environment and
 * the same credential files the dsh memory plugin reads.
 *
 * @param {Record<string, unknown>} config - the loader row's `config`.
 * @param {Record<string, string | undefined>} env - environment to read.
 */
export function resolveConnection(config = {}, env = process.env) {
  const settings = config && typeof config === 'object' ? config : {}
  const home = homedir()
  const cliPath = pick(env.OPENVIKING_CONFIG_FILE) || join(home, '.openviking', 'ovcli.conf')
  const ovPath = join(home, '.openviking', 'ov.conf')
  const cliFile = readJsonFile(cliPath)
  const ovFile = readJsonFile(ovPath)
  const ovServer = ovFile && typeof ovFile.server === 'object' && ovFile.server ? ovFile.server : null

  const fromPlugin = {
    baseUrl: pick(settings.endpoint, settings.baseUrl, settings.url),
    apiKey: pick(settings.apiKey, settings.api_key, settings.token),
    account: pick(settings.account, settings.accountId, settings.account_id),
    user: pick(settings.user, settings.userId, settings.user_id),
    peerId: pick(settings.peerId, settings.peer_id, settings.actorPeerId, settings.actor_peer_id),
    authMode: pick(settings.authMode, settings.auth_mode),
  }
  const fromEnv = {
    baseUrl: pick(env.OPENVIKING_URL, env.OPENVIKING_BASE_URL),
    apiKey: pick(env.OPENVIKING_API_KEY, env.OPENVIKING_ROOT_API_KEY),
    account: pick(env.OPENVIKING_ACCOUNT, env.OPENVIKING_ACCOUNT_ID),
    user: pick(env.OPENVIKING_USER, env.OPENVIKING_USER_ID),
    peerId: pick(env.OPENVIKING_PEER_ID, env.OPENVIKING_ACTOR_PEER_ID),
    authMode: pick(env.OPENVIKING_AUTH_MODE),
  }
  const fromCli = {
    baseUrl: pick(cliFile?.url),
    apiKey: pick(cliFile?.api_key, cliFile?.apiKey),
    account: pick(cliFile?.account, cliFile?.account_id),
    user: pick(cliFile?.user, cliFile?.user_id),
    peerId: pick(cliFile?.actor_peer_id, cliFile?.peer_id),
    authMode: pick(cliFile?.authMode, cliFile?.auth_mode),
  }
  const fromOv = {
    baseUrl: pick(ovServer?.url) || baseUrlFromServer(ovServer) || pick(ovFile?.url),
    apiKey: pick(ovServer?.root_api_key, ovServer?.api_key, ovFile?.root_api_key, ovFile?.api_key),
    account: pick(ovFile?.account, ovFile?.account_id),
    user: pick(ovFile?.user, ovFile?.user_id),
    peerId: pick(ovFile?.actor_peer_id, ovFile?.peer_id),
    authMode: pick(ovServer?.auth_mode),
  }

  const layers = [
    { source: 'plugin', values: fromPlugin },
    { source: 'env', values: fromEnv },
    { source: 'ovcli.conf', values: fromCli },
    { source: 'ov.conf', values: fromOv },
  ]
  const first = (field) => {
    for (const layer of layers) {
      const value = str(layer.values[field])
      if (value) return { value, source: layer.source }
    }
    return { value: '', source: '' }
  }

  const baseUrlLayer = first('baseUrl')
  const apiKey = first('apiKey').value
  const account = first('account').value
  const user = first('user').value
  const peerId = first('peerId').value
  const configuredAuth = first('authMode').value.toLowerCase()
  const authMode = normalizeAuthMode(configuredAuth)
    || ((account || user) ? 'trusted' : (apiKey ? 'api_key' : 'none'))
  const baseUrl = trimSlash(baseUrlLayer.value || DEFAULT_BASE_URL)
  const configFile = [cliPath, ovPath].find((candidate) => existsFile(candidate)) || null

  return {
    baseUrl,
    source: baseUrlLayer.source || 'default',
    configured: Boolean(baseUrlLayer.source) || Boolean(apiKey),
    apiKey,
    hasApiKey: Boolean(apiKey),
    account: account || null,
    user: user || null,
    peerId: peerId || null,
    authMode,
    mcpUrl: `${baseUrl}/mcp`,
    configFile,
    apiKeySource: first('apiKey').source || null,
  }
}

function baseUrlFromServer(server) {
  if (!server || typeof server !== 'object') return ''
  const host = str(server.host).replace('0.0.0.0', '127.0.0.1') || '127.0.0.1'
  const port = Number(server.port)
  if (!Number.isFinite(port)) return ''
  return `http://${host}:${Math.floor(port)}`
}

function normalizeAuthMode(value) {
  const text = str(value).toLowerCase()
  if (text === 'trusted' || text === 'api_key' || text === 'none') return text
  return ''
}

/** What the browser is allowed to know about the connection. */
function publicConnection(connection) {
  return {
    baseUrl: connection.baseUrl,
    configured: connection.configured,
    source: connection.source,
    hasApiKey: connection.hasApiKey,
    apiKeySource: connection.apiKeySource,
    authMode: connection.authMode,
    account: connection.account,
    user: connection.user,
    peerId: connection.peerId,
    mcpUrl: connection.mcpUrl,
    configFile: connection.configFile === null ? null : displayPath(connection.configFile),
  }
}

function errorMessage(response, payload) {
  const error = payload && typeof payload === 'object' ? payload.error : null
  if (typeof error === 'string' && error.trim()) return error.trim()
  if (error && typeof error === 'object') {
    const message = str(error.message) || str(error.code) || str(error.type)
    if (message) return message
  }
  if (payload && typeof payload === 'object') {
    const message = str(payload.message) || str(payload.detail)
    if (message) return message
  }
  return `OpenViking answered HTTP ${response.status}`
}

/**
 * One request to the OpenViking server. Never throws: transport failures are
 * reported as `{ ok: false, status: 0 }` so a dead server cannot take the
 * route down with it.
 */
async function ovFetch(connection, path, options = {}) {
  const method = options.method === 'POST' ? 'POST' : 'GET'
  const timeoutMs = clampInt(options.timeoutMs, 1000, 60000, DEFAULT_TIMEOUT_MS)
  const startedAt = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const headers = { accept: 'application/json', 'user-agent': USER_AGENT }
    if (connection.apiKey) {
      headers.authorization = `Bearer ${connection.apiKey}`
      // Older servers accept only X-API-Key; current ones take the bearer.
      headers['x-api-key'] = connection.apiKey
    }
    if (connection.authMode === 'trusted') {
      if (connection.account) headers['x-openviking-account'] = connection.account
      if (connection.user) headers['x-openviking-user'] = connection.user
    }
    if (connection.peerId) headers['x-openviking-actor-peer'] = connection.peerId
    if (options.body !== undefined) headers['content-type'] = 'application/json'

    const response = await fetch(`${connection.baseUrl}${path}`, {
      method,
      headers,
      body: options.body,
      signal: controller.signal,
      redirect: 'manual',
    })
    const text = await response.text()
    let payload = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = null
    }
    const contentType = response.headers.get('content-type') || ''
    if (payload === null && response.ok && contentType && !/json/i.test(contentType)) {
      return {
        ok: false,
        status: response.status,
        result: null,
        payload: null,
        error: `OpenViking answered ${contentType}, not JSON (a proxy or login page may be in front of it)`,
        latencyMs: Date.now() - startedAt,
      }
    }
    const failedEnvelope = payload && typeof payload === 'object' && payload.status === 'error'
    if (!response.ok || failedEnvelope) {
      return {
        ok: false,
        status: response.status,
        result: null,
        payload,
        error: errorMessage(response, payload),
        latencyMs: Date.now() - startedAt,
      }
    }
    const result = payload && typeof payload === 'object' && 'result' in payload ? payload.result : payload
    return {
      ok: true,
      status: response.status,
      result,
      payload,
      error: null,
      latencyMs: Date.now() - startedAt,
    }
  } catch (error) {
    const aborted = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
    return {
      ok: false,
      status: 0,
      result: null,
      payload: null,
      error: aborted
        ? `OpenViking did not answer within ${timeoutMs} ms (${connection.baseUrl})`
        : `Could not reach OpenViking at ${connection.baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      latencyMs: Date.now() - startedAt,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Local dsh memory capture backlog, shown even while the server is down. */
function pendingBacklog() {
  const dir = join(homedir(), '.openviking', 'pending')
  const summary = { dir: displayPath(dir), count: 0, oldestAt: null, newestAt: null }
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return summary
  }
  const files = names.filter((entry) => entry.endsWith('.json')).slice(0, MAX_PENDING_FILES)
  let oldest = null
  let newest = null
  for (const file of files) {
    try {
      const info = statSync(join(dir, file))
      if (!info.isFile()) continue
      summary.count += 1
      const time = info.mtimeMs
      if (oldest === null || time < oldest) oldest = time
      if (newest === null || time > newest) newest = time
    } catch {
      // A file removed between readdir and stat is not part of the backlog.
    }
  }
  summary.oldestAt = oldest === null ? null : new Date(oldest).toISOString()
  summary.newestAt = newest === null ? null : new Date(newest).toISOString()
  return summary
}

function normalizeEntry(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const uri = str(raw.uri)
  const name = str(raw.name) || lastSegment(uri)
  if (!uri && !name) return null
  const rawSize = Number(raw.size)
  return {
    name: name || uri,
    uri,
    isDir: raw.isDir === true,
    size: Number.isFinite(rawSize) ? rawSize : null,
    modTime: str(raw.modTime) || str(raw.mod_time) || null,
    abstract: str(raw.abstract) || null,
  }
}

function normalizeHit(raw, scope) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const uri = str(raw.uri) || str(raw.id)
  const score = Number(raw.score)
  return {
    scope,
    uri,
    title: str(raw.title) || str(raw.name) || lastSegment(uri) || uri,
    abstract: str(raw.abstract) || str(raw.summary) || str(raw.l0) || str(raw.l1) || null,
    score: Number.isFinite(score) ? score : null,
  }
}

/** Accept only viking:// URIs of bounded length without control characters. */
function validateUri(raw) {
  const value = str(raw)
  if (!value) throw new HttpError(400, 'A viking:// URI is required.')
  if (value.length > MAX_URI_LENGTH) throw new HttpError(400, 'That viking:// URI is too long.')
  if (!/^viking:\/\//i.test(value)) throw new HttpError(400, 'Only viking:// URIs can be browsed.')
  if (/[\u0000-\u001f\u007f]/.test(value)) throw new HttpError(400, 'That viking:// URI contains control characters.')
  return value
}

function statusForUpstream() {
  // Any upstream failure reaches the browser as a gateway error carrying the
  // server's own message; the client renders it as the connection problem.
  return 502
}

async function statusPayload(connection) {
  const health = await ovFetch(connection, '/health', { timeoutMs: HEALTH_TIMEOUT_MS })
  const reachable = health.ok
  let server = null
  let spaces = []
  if (reachable) {
    const [statusResult, ...spaceResults] = await Promise.all([
      ovFetch(connection, '/api/v1/system/status', { timeoutMs: DEFAULT_TIMEOUT_MS }),
      ...SPACES.map((space) =>
        ovFetch(
          connection,
          `/api/v1/fs/ls?uri=${encodeURIComponent(space.uri)}&output=original&node_limit=1000`,
          { timeoutMs: DEFAULT_TIMEOUT_MS },
        ),
      ),
    ])
    server = statusResult.ok ? projectServerStatus(statusResult.result) : null
    spaces = SPACES.map((space, index) => {
      const result = spaceResults[index]
      if (!result.ok) {
        return { uri: space.uri, label: space.label, count: null, error: result.error }
      }
      const entries = Array.isArray(result.result) ? result.result : []
      return { uri: space.uri, label: space.label, count: entries.length, error: null }
    })
  }
  return {
    at: new Date().toISOString(),
    connection: publicConnection(connection),
    reachable,
    health: {
      ok: health.ok,
      status: health.status,
      error: health.error,
      latencyMs: health.latencyMs,
    },
    server,
    spaces,
    pending: pendingBacklog(),
  }
}

/** Keep only scalar status fields; the raw payload can be large and nested. */
function projectServerStatus(result) {
  if (result === null || typeof result !== 'object' || Array.isArray(result)) return null
  const kept = {}
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      kept[key] = value
    }
  }
  return kept
}

async function listPayload(connection, url) {
  const uri = validateUri(url.searchParams.get('uri'))
  const limit = clampInt(url.searchParams.get('limit'), 1, 500, 200)
  const offset = clampInt(url.searchParams.get('offset'), 0, 1000000, 0)
  const path =
    `/api/v1/fs/ls?uri=${encodeURIComponent(uri)}&output=original`
    + `&node_limit=${limit}&offset=${offset}&include_abstract=true`
  const result = await ovFetch(connection, path)
  if (!result.ok) throw new HttpError(statusForUpstream(), result.error)
  const entries = (Array.isArray(result.result) ? result.result : [])
    .map(normalizeEntry)
    .filter(Boolean)
  return {
    uri,
    entries,
    hasMore: result.payload !== null && typeof result.payload === 'object' && result.payload.has_more === true,
    limit,
    offset,
  }
}

async function readPayload(connection, url) {
  const uri = validateUri(url.searchParams.get('uri'))
  const result = await ovFetch(connection, `/api/v1/content/read?uri=${encodeURIComponent(uri)}`)
  if (!result.ok) throw new HttpError(statusForUpstream(), result.error)
  let content = ''
  if (typeof result.result === 'string') content = result.result
  else if (result.result !== null && typeof result.result === 'object') {
    content = str(result.result.content) || str(result.result.text) || str(result.result.body)
  }
  const chars = content.length
  let truncated = false
  if (chars > MAX_CONTENT_CHARS) {
    content = content.slice(0, MAX_CONTENT_CHARS)
    truncated = true
  }
  const statResult = await ovFetch(
    connection,
    `/api/v1/fs/stat?uri=${encodeURIComponent(uri)}`,
    { timeoutMs: STAT_TIMEOUT_MS },
  )
  let stat = null
  if (statResult.ok && statResult.result !== null && typeof statResult.result === 'object') {
    const size = Number(statResult.result.size)
    stat = {
      size: Number.isFinite(size) ? size : null,
      modTime: str(statResult.result.modTime) || null,
      isDir: statResult.result.isDir === true,
      id: str(statResult.result.id) || null,
    }
  }
  return {
    uri,
    content,
    // Characters actually returned; `size` carries the file's full byte size.
    chars: content.length,
    size: stat && stat.size !== null ? stat.size : Buffer.byteLength(content, 'utf8'),
    truncated,
    stat,
  }
}

async function searchPayload(connection, url) {
  const query = str(url.searchParams.get('q'))
  if (!query) throw new HttpError(400, 'A search query is required.')
  if (query.length > MAX_QUERY_LENGTH) throw new HttpError(400, 'That search query is too long.')
  const requestedScope = str(url.searchParams.get('scope')).toLowerCase()
  const scope = SEARCH_SCOPES.includes(requestedScope) ? requestedScope : 'all'
  const limit = clampInt(url.searchParams.get('limit'), 1, 50, 10)
  const targets = scope === 'all' ? Object.keys(SEARCH_TARGETS) : [scope]
  const startedAt = Date.now()

  const results = await Promise.all(
    targets.map(async (name) => {
      const result = await ovFetch(connection, '/api/v1/search/find', {
        method: 'POST',
        body: JSON.stringify({
          query,
          target_uri: SEARCH_TARGETS[name],
          limit,
          score_threshold: 0,
        }),
      })
      if (!result.ok) return { scope: name, status: result.status, count: 0, error: result.error, hits: [] }
      const bucket = result.result !== null
        && typeof result.result === 'object'
        && Array.isArray(result.result[name])
        ? result.result[name]
        : []
      const hits = bucket.map((item) => normalizeHit(item, name)).filter(Boolean)
      return { scope: name, count: hits.length, error: null, hits }
    }),
  )

  // A fault in one search target is that scope's problem and rides back in
  // `scopes[].error` with the hits the other targets produced. Only a failure
  // every target shares — an unreachable server or a rejected credential — is a
  // request-level error the client must report instead of rendering an empty
  // result set.
  const failed = results.filter((entry) => entry.error !== null)
  const requestFailure = failed.length === results.length
    && failed.length > 0
    && failed.every((entry) => entry.status === 0 || entry.status === 401 || entry.status === 403)
  if (requestFailure) throw new HttpError(502, failed[0].error)
  return {
    query,
    scope,
    hits: results.flatMap((entry) => entry.hits),
    scopes: results.map(({ scope: name, count, error }) => ({ scope: name, count, error })),
    elapsedMs: Date.now() - startedAt,
  }
}

function jsonResponse(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function okResponse(data) {
  return jsonResponse(200, { ok: true, data })
}

function errorResponse(status, message) {
  return jsonResponse(status, { ok: false, error: message })
}

async function handleRequest(handler) {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error.status, error.message)
    return errorResponse(500, error instanceof Error ? error.message : String(error))
  }
}

/**
 * Build the exact Fetch routes the client half calls. Exported so the
 * verification harness can exercise them without booting Cordis.
 */
export function createRoutes(config = {}, env = process.env) {
  const route = (path, handler) => ({
    path,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: (request) => handleRequest(() => handler(resolveConnection(config, env), new URL(request.url))),
  })
  return [
    route(`${API_BASE}/status`, async (connection) => okResponse(await statusPayload(connection))),
    route(`${API_BASE}/list`, async (connection, url) => okResponse(await listPayload(connection, url))),
    route(`${API_BASE}/read`, async (connection, url) => okResponse(await readPayload(connection, url))),
    route(`${API_BASE}/search`, async (connection, url) => okResponse(await searchPayload(connection, url))),
  ]
}

/** Activate the Host half: authenticated read-only OpenViking API routes. */
export function apply(ctx, config = {}) {
  ctx.effect(() => {
    const disposers = createRoutes(config).map((route) => ctx.connection.fetch.register(route))
    return () => {
      for (const dispose of disposers) {
        try {
          void dispose()
        } catch {
          // A route already removed with the transport needs no further cleanup.
        }
      }
    }
  }, 'openviking-viewer: authenticated API routes')
}
