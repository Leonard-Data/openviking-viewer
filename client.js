window.__ModuleLoader__.load({
  id: '@local/openviking-viewer',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef } = React

    const NS = 'openviking-viewer'
    const PANEL_ID = 'openviking'
    const API_BASE = '/api/openviking'
    const LIST_LIMIT = 200
    const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    const CONF_EXAMPLE = '{"url":"http://HOST:1933","api_key":"…"}'
    const TABS = [
      { key: 'memories', labelKey: 'tabMemories', uri: 'viking://~/memories' },
      { key: 'resources', labelKey: 'tabResources', uri: 'viking://~/resources' },
      { key: 'skills', labelKey: 'tabSkills', uri: 'viking://~/skills' },
      { key: 'browse', labelKey: 'tabBrowse', uri: 'viking://~' },
      { key: 'search', labelKey: 'tabSearch', uri: null },
    ]
    const SCOPES = [
      { value: 'all', labelKey: 'scopeAll' },
      { value: 'memories', labelKey: 'scopeMemories' },
      { value: 'resources', labelKey: 'scopeResources' },
      { value: 'skills', labelKey: 'scopeSkills' },
    ]
    const SEARCH_LIMITS = [10, 20, 50]

    const EN = {
      panel: 'OpenViking memory',
      title: 'OpenViking memory',
      desc: 'Browse the memories, resources, and skills stored in OpenViking, and search them semantically. This view is read-only.',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      updated: 'Updated {time}',
      loading: 'Loading OpenViking…',
      loadFailed: 'Could not load the OpenViking connection status.',
      statusRefreshFailed: 'Could not refresh the connection status:',
      statusConnected: 'Connected',
      statusOffline: 'Offline',
      statusNotConfigured: 'Not configured',
      statusChecking: 'Checking…',
      retry: 'Try again',
      unknown: 'Unknown',
      yes: 'Yes',
      no: 'No',
      setupTitle: 'OpenViking is not reachable',
      setupDesc:
        'The harness cannot reach the OpenViking server, so memories are captured into the local backlog but not indexed yet. Point the viewer at a running server, then retry.',
      setupEndpoint: 'Resolved endpoint',
      setupSource: 'Configuration source',
      setupApiKey: 'API key configured',
      setupConfigFile: 'Credential file',
      setupHealthTitle: 'Health check failed',
      setupHealthStatus: 'HTTP status {status}',
      setupPendingTitle: 'Pending memory capture',
      setupPendingCount: '{count} items are waiting to be captured.',
      setupPendingNone: 'Nothing is waiting to be captured.',
      setupPendingOldest: 'Oldest item: {time}',
      setupHowTitle: 'How to connect',
      setupHowEnv:
        'Set OPENVIKING_URL and OPENVIKING_API_KEY in the environment of the harness process, then restart it.',
      setupHowConf: 'Or create {file} with:',
      setupRetry: 'Retry connection',
      spaceMemories: 'memories',
      spaceResources: 'resources',
      spaceSkills: 'skills',
      spaceUnknown: 'items',
      spaceCount: '{count} {label}',
      spaceError: '{label}: {error}',
      chipVersion: 'Server {version}',
      chipUser: 'User {user}',
      tabMemories: 'Memories',
      tabResources: 'Resources',
      tabSkills: 'Skills',
      tabBrowse: 'Browse',
      tabSearch: 'Search',
      tablistLabel: 'OpenViking sections',
      breadcrumbLabel: 'URI path',
      browseUriLabel: 'OpenViking URI',
      browseGo: 'Open',
      browsePlaceholder: 'viking://~/memories',
      invalidUri: 'Enter a viking:// URI first, for example viking://~/memories.',
      dirLoading: 'Loading directory…',
      dirFailed: 'Could not list this directory.',
      dirEmptyTitle: 'This directory is empty',
      dirEmptyDesc: 'No memories, resources, or files are stored under this URI yet.',
      dirHasMore: 'Showing the first {limit} entries.',
      openAsFile: 'Open as file',
      sizeB: '{n} B',
      sizeKB: '{n} KB',
      sizeMB: '{n} MB',
      sizeGB: '{n} GB',
      modified: 'Modified {time}',
      dash: '—',
      openFolderAria: 'Open folder {name}',
      openFileAria: 'Open file {name}',
      detailBack: 'Back',
      detailTitle: 'File details',
      detailCopy: 'Copy URI',
      detailCopied: 'Copied',
      detailCopyFailed: 'Copy failed',
      detailLoading: 'Loading file…',
      detailFailed: 'Could not read this file.',
      detailRetry: 'Try again',
      detailChars: '{chars} characters',
      detailTruncatedChip: 'Truncated',
      detailTruncated: 'The content is truncated to the first part of the file.',
      detailEmpty: 'This file is empty.',
      searchLabel: 'Search query',
      searchPlaceholder: 'Describe what you are looking for',
      searchAction: 'Search',
      searchScopeLabel: 'Scope',
      searchLimitLabel: 'Limit',
      limitOption: '{count} results',
      scopeAll: 'All',
      scopeMemories: 'Memories',
      scopeResources: 'Resources',
      scopeSkills: 'Skills',
      searchNeedQuery: 'Enter a search query first.',
      searchLoading: 'Searching memory…',
      searchFailed: 'Search failed.',
      searchEmptyTitle: 'No matches',
      searchEmptyDesc: 'Try different words, or widen the scope.',
      searchHintTitle: 'Search memory semantically',
      searchHintDesc:
        'Search across memories, resources, and skills. Results open in the read-only file view.',
      searchElapsed: 'Searched in {ms} ms',
      searchResults: '{count} results',
      scopeError: '{scope} scope failed: {error}',
      score: 'Score {score}',
      footerNote:
        'Read-only view: it lists, reads, and searches OpenViking memory. Nothing here modifies the server.',
    }

    const ZH = {
      panel: 'OpenViking 记忆',
      title: 'OpenViking 记忆',
      desc: '浏览 OpenViking 中保存的记忆、资源与技能，并进行语义搜索。此视图为只读。',
      refresh: '刷新',
      refreshing: '正在刷新…',
      updated: '更新于 {time}',
      loading: '正在加载 OpenViking…',
      loadFailed: '无法加载 OpenViking 连接状态。',
      statusRefreshFailed: '无法刷新连接状态：',
      statusConnected: '已连接',
      statusOffline: '离线',
      statusNotConfigured: '未配置',
      statusChecking: '检查中…',
      retry: '重试',
      unknown: '未知',
      yes: '是',
      no: '否',
      setupTitle: '无法连接 OpenViking',
      setupDesc:
        'Harness 无法访问 OpenViking 服务器，因此记忆会先写入本地待处理队列，暂时不会建立索引。请将查看器指向一个运行中的服务器，然后重试。',
      setupEndpoint: '实际使用的地址',
      setupSource: '配置来源',
      setupApiKey: 'API 密钥已配置',
      setupConfigFile: '凭据文件',
      setupHealthTitle: '健康检查失败',
      setupHealthStatus: 'HTTP 状态 {status}',
      setupPendingTitle: '待处理的记忆捕获',
      setupPendingCount: '有 {count} 条内容等待写入。',
      setupPendingNone: '当前没有待写入的内容。',
      setupPendingOldest: '最早一条：{time}',
      setupHowTitle: '如何连接',
      setupHowEnv:
        '在 Harness 进程的环境变量中设置 OPENVIKING_URL 和 OPENVIKING_API_KEY，然后重启进程。',
      setupHowConf: '或者创建 {file}，内容如下：',
      setupRetry: '重新连接',
      spaceMemories: '记忆',
      spaceResources: '资源',
      spaceSkills: '技能',
      spaceUnknown: '条目',
      spaceCount: '{count} 个{label}',
      spaceError: '{label}：{error}',
      chipVersion: '服务端 {version}',
      chipUser: '用户 {user}',
      tabMemories: '记忆',
      tabResources: '资源',
      tabSkills: '技能',
      tabBrowse: '浏览',
      tabSearch: '搜索',
      tablistLabel: 'OpenViking 内容分区',
      breadcrumbLabel: 'URI 路径',
      browseUriLabel: 'OpenViking URI',
      browseGo: '打开',
      browsePlaceholder: 'viking://~/memories',
      invalidUri: '请先输入 viking:// 开头的 URI，例如 viking://~/memories。',
      dirLoading: '正在加载目录…',
      dirFailed: '无法列出此目录。',
      dirEmptyTitle: '此目录为空',
      dirEmptyDesc: '该 URI 下还没有保存任何记忆、资源或文件。',
      dirHasMore: '仅显示前 {limit} 条。',
      openAsFile: '作为文件打开',
      sizeB: '{n} B',
      sizeKB: '{n} KB',
      sizeMB: '{n} MB',
      sizeGB: '{n} GB',
      modified: '修改于 {time}',
      dash: '—',
      openFolderAria: '打开文件夹 {name}',
      openFileAria: '打开文件 {name}',
      detailBack: '返回',
      detailTitle: '文件详情',
      detailCopy: '复制 URI',
      detailCopied: '已复制',
      detailCopyFailed: '复制失败',
      detailLoading: '正在加载文件…',
      detailFailed: '无法读取此文件。',
      detailRetry: '重试',
      detailChars: '{chars} 个字符',
      detailTruncatedChip: '已截断',
      detailTruncated: '内容已截断，仅显示文件的前一部分。',
      detailEmpty: '此文件为空。',
      searchLabel: '搜索内容',
      searchPlaceholder: '描述你要查找的内容',
      searchAction: '搜索',
      searchScopeLabel: '范围',
      searchLimitLabel: '数量',
      limitOption: '{count} 条',
      scopeAll: '全部',
      scopeMemories: '记忆',
      scopeResources: '资源',
      scopeSkills: '技能',
      searchNeedQuery: '请先输入搜索内容。',
      searchLoading: '正在搜索记忆…',
      searchFailed: '搜索失败。',
      searchEmptyTitle: '没有匹配结果',
      searchEmptyDesc: '换个关键词，或者扩大搜索范围。',
      searchHintTitle: '语义搜索记忆',
      searchHintDesc: '在记忆、资源与技能中搜索。点击结果可在只读文件视图中查看。',
      searchElapsed: '耗时 {ms} 毫秒',
      searchResults: '{count} 条结果',
      scopeError: '{scope}范围出错：{error}',
      score: '相关度 {score}',
      footerNote: '只读视图：仅列出、读取和搜索 OpenViking 记忆，不会修改服务器内容。',
    }

    // ---------------------------------------------------------------- helpers

    function translateFactory(raw) {
      const lookup = (key) => (EN[key] !== undefined ? EN[key] : key)
      return function t(key, params) {
        let text
        if (typeof raw === 'function') {
          try {
            text = raw(key, params)
          } catch {
            text = lookup(key)
          }
        } else {
          text = lookup(key)
        }
        if (typeof text !== 'string') text = lookup(key)
        if (params && typeof params === 'object') {
          text = text.replace(/\{(\w+)\}/g, (match, name) =>
            params[name] === undefined || params[name] === null ? match : String(params[name]),
          )
        }
        return text
      }
    }

    function apiUrl(path) {
      const full = API_BASE + path
      try {
        const base = new URL(document.baseURI)
        if (!base.pathname.endsWith('/')) base.pathname += '/'
        return new URL(full.replace(/^\//, ''), base.href).href
      } catch {
        return full
      }
    }

    async function apiGet(path) {
      const response = await fetch(apiUrl(path), {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (!response.ok) {
        const message =
          payload && typeof payload.error === 'string' ? payload.error : 'HTTP ' + response.status
        throw new Error(message)
      }
      if (!payload || payload.ok !== true) {
        throw new Error(
          payload && typeof payload.error === 'string' ? payload.error : 'Unexpected response',
        )
      }
      return payload.data
    }

    function errorText(error) {
      if (error === null || error === undefined) return 'Unknown error'
      if (typeof error === 'string') return error
      if (typeof error.message === 'string' && error.message) return error.message
      return String(error)
    }

    function formatDateTime(value) {
      if (typeof value !== 'string') return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return date.toLocaleString()
      } catch {
        return ''
      }
    }

    function formatShortTime(value) {
      if (typeof value !== 'string') return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return formatDateTime(value)
      }
    }

    function formatDecimal(value) {
      if (!isFinite(value)) return '0'
      return value >= 10 ? String(Math.round(value)) : value.toFixed(1)
    }

    function formatSize(t, bytes) {
      if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) return ''
      if (bytes < 1024) return t('sizeB', { n: String(Math.round(bytes)) })
      const kb = bytes / 1024
      if (kb < 1024) return t('sizeKB', { n: formatDecimal(kb) })
      const mb = kb / 1024
      if (mb < 1024) return t('sizeMB', { n: formatDecimal(mb) })
      return t('sizeGB', { n: formatDecimal(mb / 1024) })
    }

    function decodeSegment(segment) {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    }

    function basenameOfUri(uri) {
      if (typeof uri !== 'string' || !uri) return ''
      const clean = uri.replace(/\/+$/, '')
      const index = clean.lastIndexOf('/')
      if (index < 0) return clean
      return decodeSegment(clean.slice(index + 1))
    }

    function breadcrumbCrumbs(uri) {
      if (typeof uri !== 'string') return []
      const clean = uri.replace(/\/+$/, '')
      const match = /^viking:\/\/([^/]+)((?:\/.*)?)$/.exec(clean)
      if (!match) return []
      const authority = match[1]
      const rest = match[2] ? match[2].split('/').filter(Boolean) : []
      const rootUri = 'viking://' + authority
      const crumbs = [{ label: authority, uri: rootUri }]
      let path = rootUri
      for (const segment of rest) {
        path += '/' + segment
        crumbs.push({ label: decodeSegment(segment), uri: path })
      }
      return crumbs
    }

    function copyWithTextarea(value) {
      try {
        if (typeof document === 'undefined' || !document.body) return false
        const area = document.createElement('textarea')
        area.value = value
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.top = '-1000px'
        area.style.left = '-1000px'
        area.style.opacity = '0'
        document.body.appendChild(area)
        let copied = false
        try {
          if (typeof area.focus === 'function') area.focus()
          area.select()
          copied = typeof document.execCommand === 'function' ? document.execCommand('copy') : false
        } finally {
          try {
            document.body.removeChild(area)
          } catch {
            // The fallback node may already be gone; copying already succeeded or failed.
          }
        }
        return copied === true
      } catch {
        return false
      }
    }

    // Never throws: resolves true when the URI reached the clipboard.
    function copyText(text) {
      const value = typeof text === 'string' ? text : ''
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === 'function'
        ) {
          const result = navigator.clipboard.writeText(value)
          if (result && typeof result.then === 'function') {
            return result.then(
              () => true,
              () => copyWithTextarea(value),
            )
          }
          return Promise.resolve(true)
        }
      } catch {
        // Clipboard permissions rejected the synchronous call; use the textarea fallback.
      }
      return Promise.resolve(copyWithTextarea(value))
    }

    function spaceLabel(t, label) {
      switch (label) {
        case 'memories':
          return t('spaceMemories')
        case 'resources':
          return t('spaceResources')
        case 'skills':
          return t('spaceSkills')
        default:
          return typeof label === 'string' && label ? label : t('spaceUnknown')
      }
    }

    function scopeLabel(t, scope) {
      switch (scope) {
        case 'all':
          return t('scopeAll')
        case 'memories':
          return t('scopeMemories')
        case 'resources':
          return t('scopeResources')
        case 'skills':
          return t('scopeSkills')
        default:
          return typeof scope === 'string' && scope ? scope : t('spaceUnknown')
      }
    }

    // ------------------------------------------------------------------ icons

    // Original stacked-memory-layers glyph with a node on the top layer.
    function MemoryGlyph(props) {
      const size = (props && props.size) || 16
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('ellipse', { cx: '8', cy: '4.5', rx: '5.1', ry: '2.1' }),
        h('path', { d: 'M2.9 4.5v3.2c0 1.2 2.3 2.1 5.1 2.1s5.1-.9 5.1-2.1V4.5' }),
        h('path', { d: 'M2.9 7.7v3.2c0 1.2 2.3 2.1 5.1 2.1s5.1-.9 5.1-2.1V7.7' }),
        h('circle', { cx: '8', cy: '4.5', r: '1.15', fill: 'currentColor', stroke: 'none' }),
      )
    }

    function RefreshGlyph(props) {
      const size = (props && props.size) || 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', { d: 'M13.2 8a5.2 5.2 0 1 1-1.6-3.7' }),
        h('path', { d: 'M13.4 2.8v3.9H9.5' }),
      )
    }

    function FolderGlyph(props) {
      const size = (props && props.size) || 16
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.3',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', {
          d: 'M1.9 4.4c0-.5.4-.9.9-.9h3.4l1.3 1.5h5.8c.5 0 .9.4.9.9v6.6c0 .5-.4.9-.9.9H2.8a.9.9 0 0 1-.9-.9V4.4z',
        }),
        h('path', { d: 'M1.9 6.8h12.2' }),
      )
    }

    function FileGlyph(props) {
      const size = (props && props.size) || 16
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.3',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', {
          d: 'M4.1 1.8h4.6l3.2 3.2v9.2c0 .5-.4.9-.9.9H4.1a.9.9 0 0 1-.9-.9V2.7c0-.5.4-.9.9-.9z',
        }),
        h('path', { d: 'M8.6 1.8v3.3h3.3' }),
      )
    }

    function ChevronRightGlyph(props) {
      const size = (props && props.size) || 12
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.6',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', { d: 'M6.5 4.5 10 8l-3.5 3.5' }),
      )
    }

    function BackGlyph(props) {
      const size = (props && props.size) || 12
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.6',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', { d: 'M9.5 4.5 6 8l3.5 3.5' }),
      )
    }

    function CopyGlyph(props) {
      const size = (props && props.size) || 13
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.3',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
          style: { display: 'block' },
        },
        h('path', {
          d: 'M10.7 5.3V3.9c0-.5-.4-.9-.9-.9H3.9c-.5 0-.9.4-.9.9v5.9c0 .5.4.9.9.9h1.4',
        }),
        h('rect', { x: '5.3', y: '5.3', width: '7.4', height: '7.4', rx: '1.4' }),
      )
    }

    // ----------------------------------------------------------------- styles

    const CSS = `
.ovv-page { position:relative; display:flex; flex-direction:column; height:100%; min-height:0; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; }
.ovv-scroll { flex:1 1 auto; min-height:0; overflow:auto; padding:26px 28px 44px; }
.ovv-inner { width:100%; max-width:1120px; margin:0 auto; }
.ovv-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; flex-wrap:wrap; }
.ovv-title { margin:0; font-size:20px; line-height:28px; font-weight:600; letter-spacing:-0.01em; }
.ovv-desc { margin:6px 0 0; font-size:13px; line-height:20px; color:var(--dsw-alias-label-secondary); max-width:680px; }
.ovv-head-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ovv-btn { display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:4px 10px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; cursor:pointer; white-space:nowrap; }
.ovv-btn:hover { background:var(--dsw-alias-bg-layer-2); border-color:var(--dsw-alias-border-l2); }
.ovv-btn:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.ovv-btn[disabled] { opacity:.5; cursor:default; }
.ovv-btn-primary { background:var(--dsw-alias-brand-primary); border-color:transparent; color:var(--dsw-alias-bg-base); }
.ovv-btn-primary:hover { background:var(--dsw-alias-brand-primary); border-color:transparent; opacity:.92; }
.ovv-btn-quiet { border-color:transparent; background:transparent; color:var(--dsw-alias-label-secondary); }
.ovv-btn-quiet:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.ovv-status { display:inline-flex; align-items:center; gap:6px; padding:3px 9px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; white-space:nowrap; }
.ovv-status-dot { flex:none; width:7px; height:7px; border-radius:50%; background:currentColor; }
.ovv-status-success { color:var(--dsw-alias-state-success-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 36%, var(--dsw-alias-border-l1)); }
.ovv-status-error { color:var(--dsw-alias-state-error-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 36%, var(--dsw-alias-border-l1)); }
.ovv-status-warn { color:var(--dsw-alias-state-warn-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 36%, var(--dsw-alias-border-l1)); }
.ovv-summary { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:16px 0 12px; font-size:12px; color:var(--dsw-alias-label-secondary); }
.ovv-chip { display:inline-flex; align-items:center; gap:6px; padding:3px 9px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); }
.ovv-chip-warn { color:var(--dsw-alias-state-warn-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 36%, var(--dsw-alias-border-l1)); }
.ovv-spacer { flex:1 1 auto; }
.ovv-card { margin-top:16px; padding:16px 18px; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); }
.ovv-card-head { display:flex; align-items:center; gap:8px; }
.ovv-card-title { margin:0; font-size:14px; line-height:21px; font-weight:600; }
.ovv-card-desc { margin:6px 0 0; max-width:720px; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:19px; }
.ovv-dot { flex:none; width:8px; height:8px; border-radius:50%; background:var(--dsw-alias-state-idle-primary); }
.ovv-dot-warn { background:var(--dsw-alias-state-warn-primary); }
.ovv-dot-success { background:var(--dsw-alias-state-success-primary); }
.ovv-dot-error { background:var(--dsw-alias-state-error-primary); }
.ovv-kv { display:grid; grid-template-columns:minmax(130px,170px) minmax(0,1fr); gap:6px 14px; margin:14px 0 0; font-size:12.5px; line-height:19px; }
.ovv-k { color:var(--dsw-alias-label-secondary); }
.ovv-v { overflow-wrap:anywhere; }
.ovv-mono { font-family:${MONO}; font-size:11.5px; }
.ovv-input.ovv-mono { font-size:11.5px; }
.ovv-pending { margin-top:14px; padding:11px 13px; border-radius:10px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, var(--dsw-alias-border-l1)); background:var(--dsw-alias-bg-layer-1); }
.ovv-pending-head { display:flex; align-items:center; gap:8px; }
.ovv-pending-title { margin:0; font-size:12.5px; line-height:19px; font-weight:600; }
.ovv-pending-line { margin:5px 0 0; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; }
.ovv-how { margin:16px 0 0; font-size:12.5px; line-height:19px; font-weight:600; }
.ovv-how-p { margin:6px 0 0; color:var(--dsw-alias-label-secondary); font-size:12.5px; line-height:19px; }
.ovv-conf { margin:8px 0 0; padding:10px 12px; border-radius:9px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font-family:${MONO}; font-size:11.5px; line-height:17px; white-space:pre; overflow:auto; }
.ovv-setup-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:14px; }
.ovv-error-box { margin:10px 0 0; padding:8px 10px; border-radius:8px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 34%, var(--dsw-alias-border-l1)); color:var(--dsw-alias-state-error-primary); font-size:12px; line-height:18px; overflow-wrap:anywhere; }
.ovv-inline-error { margin:8px 0 0; padding:7px 9px; border-radius:8px; border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 34%, var(--dsw-alias-border-l1)); color:var(--dsw-alias-state-error-primary); font-size:12px; line-height:18px; overflow-wrap:anywhere; }
.ovv-tabs { display:flex; align-items:center; gap:2px; margin:16px 0 12px; padding:3px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); overflow-x:auto; }
.ovv-tab { flex:0 0 auto; min-height:28px; padding:4px 12px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:12px; line-height:18px; white-space:nowrap; cursor:pointer; }
.ovv-tab:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.ovv-tab:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.ovv-tab[aria-selected="true"] { background:var(--dsw-alias-bg-base); border-color:var(--dsw-alias-border-l2); color:var(--dsw-alias-label-primary); font-weight:600; }
.ovv-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
.ovv-crumbs { display:flex; align-items:center; gap:2px; flex-wrap:wrap; min-width:0; font-size:12px; line-height:18px; }
.ovv-crumb { display:inline-flex; align-items:center; max-width:220px; padding:2px 6px; border:0; border-radius:6px; background:transparent; color:var(--dsw-alias-brand-primary); font:inherit; font-size:12px; line-height:18px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
.ovv-crumb:hover { background:var(--dsw-alias-bg-layer-2); }
.ovv-crumb:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.ovv-crumb[aria-current="page"] { color:var(--dsw-alias-label-primary); cursor:default; }
.ovv-crumb-sep { color:var(--dsw-alias-label-secondary); user-select:none; }
.ovv-uri-form { display:flex; align-items:center; gap:6px; flex:1 1 320px; min-width:0; }
.ovv-input { flex:1 1 auto; min-width:0; min-height:28px; padding:4px 9px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; }
.ovv-input:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:0; }
.ovv-select { min-height:28px; padding:3px 8px; border-radius:8px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); font:inherit; font-size:12px; line-height:18px; }
.ovv-select:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.ovv-list { display:flex; flex-direction:column; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); overflow:hidden; }
.ovv-row { display:flex; align-items:center; gap:10px; width:100%; padding:9px 12px; border:0; border-bottom:1px solid var(--dsw-alias-border-l1); background:transparent; color:var(--dsw-alias-label-primary); font:inherit; text-align:left; cursor:pointer; }
.ovv-row:last-child { border-bottom:0; }
.ovv-row:hover { background:var(--dsw-alias-bg-layer-2); }
.ovv-row:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }
.ovv-row-glyph { flex:none; display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; color:var(--dsw-alias-label-secondary); }
.ovv-row-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:2px; }
.ovv-row-name { font-size:13px; line-height:19px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ovv-row-uri { color:var(--dsw-alias-label-secondary); font-family:${MONO}; font-size:11px; line-height:16px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ovv-row-meta { flex:none; display:flex; align-items:center; gap:8px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; white-space:nowrap; }
.ovv-row-chevron { flex:none; color:var(--dsw-alias-label-secondary); }
.ovv-loading { display:flex; align-items:center; gap:8px; padding:16px 2px; color:var(--dsw-alias-label-secondary); font-size:12.5px; }
.ovv-spinner { flex:none; width:14px; height:14px; border-radius:50%; border:2px solid var(--dsw-alias-border-l2); border-top-color:var(--dsw-alias-brand-primary); animation:ovv-spin .8s linear infinite; }
@keyframes ovv-spin { to { transform:rotate(360deg); } }
.ovv-empty { margin-top:12px; padding:28px 20px; text-align:center; border:1px dashed var(--dsw-alias-border-l2); border-radius:12px; background:var(--dsw-alias-bg-layer-1); }
.ovv-empty-title { margin:0; font-size:13.5px; line-height:21px; font-weight:600; }
.ovv-empty-desc { margin:6px auto 0; max-width:520px; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:19px; }
.ovv-empty .ovv-btn { margin-top:12px; }
.ovv-detail { padding:14px 16px 16px; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); }
.ovv-detail-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.ovv-detail-heading { flex:1 1 260px; min-width:0; }
.ovv-detail-title { margin:8px 0 0; font-size:14px; line-height:21px; font-weight:600; overflow-wrap:anywhere; }
.ovv-detail-uri { margin-top:3px; color:var(--dsw-alias-label-secondary); font-family:${MONO}; font-size:11.5px; line-height:17px; overflow-wrap:anywhere; }
.ovv-detail-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ovv-detail-meta { display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin:12px 0 0; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; }
.ovv-content { margin:12px 0 0; max-height:min(58vh, 640px); overflow:auto; padding:12px 14px; border:1px solid var(--dsw-alias-border-l1); border-radius:9px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font-family:${MONO}; font-size:12px; line-height:18px; white-space:pre-wrap; overflow-wrap:anywhere; tab-size:2; }
.ovv-content-empty { color:var(--dsw-alias-label-secondary); font-style:italic; }
.ovv-hint { color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; overflow-wrap:anywhere; }
.ovv-search-form { display:flex; flex-direction:column; gap:8px; padding:12px 14px; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); }
.ovv-search-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ovv-field { display:inline-flex; align-items:center; gap:6px; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; }
.ovv-search-input { flex:1 1 260px; }
.ovv-search-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:12px 0 8px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; }
.ovv-hits { display:flex; flex-direction:column; border:1px solid var(--dsw-alias-border-l1); border-radius:12px; background:var(--dsw-alias-bg-layer-1); overflow:hidden; }
.ovv-hit { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; width:100%; padding:10px 12px; border:0; border-bottom:1px solid var(--dsw-alias-border-l1); background:transparent; color:var(--dsw-alias-label-primary); font:inherit; text-align:left; cursor:pointer; }
.ovv-hit:last-child { border-bottom:0; }
.ovv-hit:hover { background:var(--dsw-alias-bg-layer-2); }
.ovv-hit:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }
.ovv-hit-main { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; gap:3px; }
.ovv-hit-title { font-size:13px; line-height:19px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ovv-hit-uri { color:var(--dsw-alias-label-secondary); font-family:${MONO}; font-size:11px; line-height:16px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ovv-hit-abstract { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; }
.ovv-hit-side { flex:none; display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
.ovv-badge { display:inline-flex; align-items:center; gap:5px; padding:1px 7px; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-secondary); font-size:11px; line-height:16px; white-space:nowrap; }
.ovv-badge-score { color:var(--dsw-alias-brand-primary); border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, var(--dsw-alias-border-l1)); }
.ovv-badge-warn { color:var(--dsw-alias-state-warn-primary); border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 34%, var(--dsw-alias-border-l1)); }
.ovv-footer { margin-top:18px; color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:17px; }
.ovv-body { min-width:0; }
@media (max-width: 720px) {
  .ovv-scroll { padding:18px 14px 36px; }
  .ovv-head { gap:12px; }
  .ovv-head-actions { width:100%; justify-content:flex-start; }
  .ovv-tabs { gap:0; }
  .ovv-tab { padding:4px 9px; }
  .ovv-row { padding:8px 10px; gap:8px; }
  .ovv-row-meta { flex-direction:column; align-items:flex-end; gap:1px; }
  .ovv-hit { gap:8px; }
  .ovv-hit-side { flex-direction:column; align-items:flex-end; }
  .ovv-kv { grid-template-columns:1fr; gap:2px; }
  .ovv-kv .ovv-k { margin-top:6px; }
  .ovv-crumb { max-width:140px; }
  .ovv-content { max-height:min(62vh, 560px); }
}
`

    // ------------------------------------------------------------- small parts

    function loadingNode(text) {
      return h(
        'div',
        { className: 'ovv-loading', role: 'status' },
        h('span', { className: 'ovv-spinner', 'aria-hidden': 'true' }),
        text,
      )
    }

    function statusChipNode(t, status, loading) {
      if (!status) {
        if (loading) {
          return h(
            'span',
            { className: 'ovv-status ovv-status-idle' },
            h('span', { className: 'ovv-status-dot', 'aria-hidden': 'true' }),
            t('statusChecking'),
          )
        }
        return h(
          'span',
          { className: 'ovv-status ovv-status-error' },
          h('span', { className: 'ovv-status-dot', 'aria-hidden': 'true' }),
          t('statusOffline'),
        )
      }
      if (status.reachable === true) {
        return h(
          'span',
          { className: 'ovv-status ovv-status-success' },
          h('span', { className: 'ovv-status-dot', 'aria-hidden': 'true' }),
          t('statusConnected'),
        )
      }
      const configured = Boolean(status.connection && status.connection.configured)
      return h(
        'span',
        { className: 'ovv-status ' + (configured ? 'ovv-status-error' : 'ovv-status-warn') },
        h('span', { className: 'ovv-status-dot', 'aria-hidden': 'true' }),
        configured ? t('statusOffline') : t('statusNotConfigured'),
      )
    }

    // --------------------------------------------------------------- setup card

    function SetupCard(props) {
      const { t, status, onRetry } = props
      const connection =
        status && status.connection && typeof status.connection === 'object'
          ? status.connection
          : {}
      const health =
        status && status.health && typeof status.health === 'object' ? status.health : null
      const pending =
        status && status.pending && typeof status.pending === 'object' ? status.pending : null

      const rows = [
        {
          key: 'endpoint',
          label: t('setupEndpoint'),
          value:
            typeof connection.baseUrl === 'string' && connection.baseUrl
              ? connection.baseUrl
              : t('unknown'),
          mono: true,
        },
        {
          key: 'source',
          label: t('setupSource'),
          value:
            typeof connection.source === 'string' && connection.source
              ? connection.source
              : t('unknown'),
          mono: false,
        },
        {
          key: 'apiKey',
          label: t('setupApiKey'),
          value: connection.hasApiKey === true ? t('yes') : t('no'),
          mono: false,
        },
      ]
      if (typeof connection.configFile === 'string' && connection.configFile) {
        rows.push({
          key: 'configFile',
          label: t('setupConfigFile'),
          value: connection.configFile,
          mono: true,
        })
      }
      const kv = []
      for (const row of rows) {
        kv.push(h('dt', { key: row.key + '-k', className: 'ovv-k' }, row.label))
        kv.push(
          h(
            'dd',
            { key: row.key + '-v', className: 'ovv-v' + (row.mono ? ' ovv-mono' : '') },
            row.value,
          ),
        )
      }

      const healthError =
        health && typeof health.error === 'string' && health.error ? health.error : ''
      const healthStatus =
        health && typeof health.status === 'number' && health.status > 0 ? health.status : 0
      const healthNode = healthError
        ? h(
            'p',
            { className: 'ovv-error-box', role: 'alert' },
            t('setupHealthTitle') +
              ': ' +
              healthError +
              (healthStatus ? ' · ' + t('setupHealthStatus', { status: healthStatus }) : ''),
          )
        : null

      const pendingNode = pending
        ? h(
            'div',
            { className: 'ovv-pending' },
            h(
              'div',
              { className: 'ovv-pending-head' },
              h('span', { className: 'ovv-dot ovv-dot-warn', 'aria-hidden': 'true' }),
              h('h4', { className: 'ovv-pending-title' }, t('setupPendingTitle')),
            ),
            h(
              'p',
              { className: 'ovv-pending-line' },
              typeof pending.count === 'number' && pending.count > 0
                ? t('setupPendingCount', { count: pending.count })
                : t('setupPendingNone'),
            ),
            typeof pending.oldestAt === 'string' && pending.oldestAt
              ? h(
                  'p',
                  { className: 'ovv-pending-line ovv-mono' },
                  t('setupPendingOldest', { time: formatDateTime(pending.oldestAt) }),
                )
              : null,
          )
        : null

      return h(
        'section',
        { className: 'ovv-card', 'aria-label': t('setupTitle') },
        h(
          'div',
          { className: 'ovv-card-head' },
          h('span', { className: 'ovv-dot ovv-dot-warn', 'aria-hidden': 'true' }),
          h('h3', { className: 'ovv-card-title' }, t('setupTitle')),
        ),
        h('p', { className: 'ovv-card-desc' }, t('setupDesc')),
        h('dl', { className: 'ovv-kv' }, kv),
        healthNode,
        pendingNode,
        h('h4', { className: 'ovv-how' }, t('setupHowTitle')),
        h('p', { className: 'ovv-how-p' }, t('setupHowEnv')),
        h('p', { className: 'ovv-how-p' }, t('setupHowConf', { file: '~/.openviking/ovcli.conf' })),
        h('pre', { className: 'ovv-conf' }, CONF_EXAMPLE),
        h(
          'div',
          { className: 'ovv-setup-actions' },
          h(
            'button',
            { type: 'button', className: 'ovv-btn ovv-btn-primary', onClick: onRetry },
            t('setupRetry'),
          ),
        ),
      )
    }

    // ----------------------------------------------------------- directory view

    function EntryRow(props) {
      const { t, entry, onNavigate, onOpenFile } = props
      const item = entry && typeof entry === 'object' ? entry : {}
      const isDir = item.isDir === true
      const uri = typeof item.uri === 'string' ? item.uri : ''
      const name =
        (typeof item.name === 'string' && item.name) || basenameOfUri(uri) || uri || t('unknown')
      const size = isDir ? '' : formatSize(t, item.size)
      const modTime = !isDir && typeof item.modTime === 'string' ? formatShortTime(item.modTime) : ''

      const metaParts = []
      if (size) metaParts.push(h('span', { key: 'size' }, size))
      if (modTime) metaParts.push(h('span', { key: 'mod' }, t('modified', { time: modTime })))

      return h(
        'button',
        {
          type: 'button',
          className: 'ovv-row',
          title: uri,
          'aria-label': isDir
            ? t('openFolderAria', { name })
            : t('openFileAria', { name }),
          onClick: () => {
            if (!uri) return
            if (isDir) onNavigate(uri)
            else onOpenFile(uri)
          },
        },
        h(
          'span',
          { className: 'ovv-row-glyph', 'aria-hidden': 'true' },
          isDir ? h(FolderGlyph, { size: 16 }) : h(FileGlyph, { size: 16 }),
        ),
        h(
          'span',
          { className: 'ovv-row-main' },
          h('span', { className: 'ovv-row-name' }, name),
          uri ? h('span', { className: 'ovv-row-uri' }, uri) : null,
        ),
        isDir
          ? h(
              'span',
              { className: 'ovv-row-chevron', 'aria-hidden': 'true' },
              h(ChevronRightGlyph, { size: 12 }),
            )
          : h(
              'span',
              { className: 'ovv-row-meta' },
              metaParts.length > 0 ? metaParts : h('span', null, t('dash')),
            ),
      )
    }

    function Breadcrumbs(props) {
      const { t, uri, onNavigate } = props
      const crumbs = breadcrumbCrumbs(uri)
      if (crumbs.length === 0) return null
      return h(
        'nav',
        { className: 'ovv-crumbs', 'aria-label': t('breadcrumbLabel') },
        crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return h(
            React.Fragment,
            { key: crumb.uri + ':' + index },
            index > 0
              ? h('span', { className: 'ovv-crumb-sep', 'aria-hidden': 'true' }, '/')
              : null,
            isLast
              ? h(
                  'span',
                  { className: 'ovv-crumb', 'aria-current': 'page', title: crumb.uri },
                  crumb.label,
                )
              : h(
                  'button',
                  {
                    type: 'button',
                    className: 'ovv-crumb',
                    title: crumb.uri,
                    onClick: () => onNavigate(crumb.uri),
                  },
                  crumb.label,
                ),
          )
        }),
      )
    }

    function DirectoryView(props) {
      const { t, uri, nonce, browseMode, onNavigate, onOpenFile } = props
      const [state, setState] = useState({ loading: true, error: null, data: null, entries: [] })
      const [retryNonce, setRetryNonce] = useState(0)
      const [inputValue, setInputValue] = useState(uri)
      const [inputError, setInputError] = useState(false)

      useEffect(() => {
        setInputValue(uri)
        setInputError(false)
      }, [uri])

      useEffect(() => {
        let alive = true
        setState({ loading: true, error: null, data: null, entries: [] })
        const load = async () => {
          try {
            const data = await apiGet(
              '/list?uri=' + encodeURIComponent(uri) + '&limit=' + String(LIST_LIMIT),
            )
            if (!alive) return
            const entries = data && Array.isArray(data.entries) ? data.entries : []
            setState({
              loading: false,
              error: null,
              data: data && typeof data === 'object' ? data : null,
              entries,
            })
          } catch (caught) {
            if (!alive) return
            setState({ loading: false, error: errorText(caught), data: null, entries: [] })
          }
        }
        void load()
        return () => {
          alive = false
        }
      }, [uri, nonce, retryNonce])

      const retry = () => setRetryNonce((value) => value + 1)

      const submitUri = (event) => {
        if (event && typeof event.preventDefault === 'function') event.preventDefault()
        const next = String(inputValue || '')
          .trim()
          .replace(/\/+$/, '')
        if (!next || next.indexOf('viking://') !== 0) {
          setInputError(true)
          return
        }
        setInputError(false)
        if (next !== uri) onNavigate(next)
      }

      let content
      if (state.error) {
        content = h(
          'div',
          null,
          h(
            'p',
            { className: 'ovv-error-box', role: 'alert' },
            t('dirFailed') + ' ' + state.error,
          ),
          h(
            'div',
            { className: 'ovv-setup-actions' },
            h('button', { type: 'button', className: 'ovv-btn', onClick: retry }, t('retry')),
            browseMode
              ? h(
                  'button',
                  { type: 'button', className: 'ovv-btn', onClick: () => onOpenFile(uri) },
                  t('openAsFile'),
                )
              : null,
          ),
        )
      } else if (state.loading) {
        content = loadingNode(t('dirLoading'))
      } else if (state.entries.length === 0) {
        content = h(
          'div',
          { className: 'ovv-empty' },
          h('p', { className: 'ovv-empty-title' }, t('dirEmptyTitle')),
          h('p', { className: 'ovv-empty-desc' }, t('dirEmptyDesc')),
        )
      } else {
        content = h(
          'div',
          { className: 'ovv-list' },
          state.entries.map((entry, index) =>
            h(EntryRow, {
              key: (entry && entry.uri) || (entry && entry.name) || index,
              t,
              entry,
              onNavigate,
              onOpenFile,
            }),
          ),
        )
      }

      const hasMore =
        state.data && state.data.hasMore === true
          ? h(
              'p',
              { className: 'ovv-hint', style: { marginTop: '8px' } },
              t('dirHasMore', { limit: state.data.limit || LIST_LIMIT }),
            )
          : null

      const form = browseMode
        ? h(
            'form',
            { className: 'ovv-uri-form', onSubmit: submitUri },
            h('input', {
              className: 'ovv-input ovv-mono',
              type: 'text',
              value: inputValue,
              placeholder: t('browsePlaceholder'),
              'aria-label': t('browseUriLabel'),
              autoComplete: 'off',
              spellCheck: false,
              onChange: (event) => {
                setInputValue(event.target.value)
                if (inputError) setInputError(false)
              },
            }),
            h('button', { type: 'submit', className: 'ovv-btn' }, t('browseGo')),
          )
        : null

      return h(
        'div',
        { className: 'ovv-dir' },
        h(
          'div',
          { className: 'ovv-toolbar' },
          h(Breadcrumbs, { t, uri, onNavigate }),
          form ? h('span', { className: 'ovv-spacer' }) : null,
          form,
        ),
        inputError
          ? h('p', { className: 'ovv-inline-error', role: 'alert' }, t('invalidUri'))
          : null,
        content,
        hasMore,
      )
    }

    // -------------------------------------------------------------- detail view

    function DetailView(props) {
      const { t, uri, nonce, onBack } = props
      const [state, setState] = useState({ loading: true, error: null, data: null })
      const [retryNonce, setRetryNonce] = useState(0)
      const [copyState, setCopyState] = useState(null)
      const timerRef = useRef(null)

      useEffect(() => {
        let alive = true
        setState({ loading: true, error: null, data: null })
        const load = async () => {
          try {
            const data = await apiGet('/read?uri=' + encodeURIComponent(uri))
            if (!alive) return
            setState({ loading: false, error: null, data: data && typeof data === 'object' ? data : null })
          } catch (caught) {
            if (!alive) return
            setState({ loading: false, error: errorText(caught), data: null })
          }
        }
        void load()
        return () => {
          alive = false
        }
      }, [uri, nonce, retryNonce])

      useEffect(
        () => () => {
          if (timerRef.current) clearTimeout(timerRef.current)
        },
        [],
      )

      const retry = () => setRetryNonce((value) => value + 1)

      const onCopy = () => {
        void copyText(uri).then((copied) => {
          setCopyState(copied ? 'ok' : 'fail')
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => {
            timerRef.current = null
            setCopyState(null)
          }, 1800)
        })
      }

      const name = basenameOfUri(uri) || uri
      const data = state.data
      const content = data && typeof data.content === 'string' ? data.content : ''

      const metaParts = []
      if (data && typeof data.chars === 'number') {
        metaParts.push(
          h('span', { key: 'chars', className: 'ovv-badge' }, t('detailChars', { chars: data.chars })),
        )
      }
      if (data && typeof data.size === 'number') {
        const sizeText = formatSize(t, data.size)
        if (sizeText) {
          metaParts.push(h('span', { key: 'size', className: 'ovv-badge' }, sizeText))
        }
      }
      const stat = data && data.stat && typeof data.stat === 'object' ? data.stat : null
      if (stat && typeof stat.modTime === 'string' && stat.modTime) {
        metaParts.push(
          h(
            'span',
            { key: 'mod' },
            t('modified', { time: formatShortTime(stat.modTime) }),
          ),
        )
      }
      if (data && data.truncated === true) {
        metaParts.push(
          h(
            'span',
            { key: 'truncated', className: 'ovv-badge ovv-badge-warn' },
            t('detailTruncatedChip'),
          ),
        )
      }

      let body
      if (state.loading) {
        body = loadingNode(t('detailLoading'))
      } else if (state.error) {
        body = h(
          'div',
          null,
          h(
            'p',
            { className: 'ovv-error-box', role: 'alert' },
            t('detailFailed') + ' ' + state.error,
          ),
          h(
            'div',
            { className: 'ovv-setup-actions' },
            h('button', { type: 'button', className: 'ovv-btn', onClick: retry }, t('detailRetry')),
          ),
        )
      } else if (data) {
        body = [
          h('div', { key: 'meta', className: 'ovv-detail-meta' }, metaParts),
          h(
            'pre',
            {
              key: 'content',
              className: 'ovv-content' + (content ? '' : ' ovv-content-empty'),
              tabIndex: 0,
            },
            content || t('detailEmpty'),
          ),
          data.truncated === true
            ? h(
                'p',
                { key: 'truncated-note', className: 'ovv-hint', style: { marginTop: '8px' } },
                t('detailTruncated'),
              )
            : null,
        ]
      } else {
        body = h('p', { className: 'ovv-error-box', role: 'alert' }, t('detailFailed'))
      }

      return h(
        'section',
        { className: 'ovv-detail', 'aria-label': t('detailTitle') },
        h(
          'div',
          { className: 'ovv-detail-head' },
          h(
            'div',
            { className: 'ovv-detail-heading' },
            h(
              'button',
              { type: 'button', className: 'ovv-btn ovv-btn-quiet', onClick: onBack },
              h(BackGlyph, { size: 12 }),
              t('detailBack'),
            ),
            h('h3', { className: 'ovv-detail-title' }, name),
            h('div', { className: 'ovv-detail-uri', title: uri }, uri),
          ),
          h(
            'div',
            { className: 'ovv-detail-actions' },
            copyState
              ? h(
                  'span',
                  { className: 'ovv-hint', role: 'status', 'aria-live': 'polite' },
                  copyState === 'ok' ? t('detailCopied') : t('detailCopyFailed'),
                )
              : null,
            h(
              'button',
              { type: 'button', className: 'ovv-btn', onClick: onCopy },
              h(CopyGlyph, { size: 13 }),
              t('detailCopy'),
            ),
          ),
        ),
        body,
      )
    }

    // -------------------------------------------------------------- search view

    function SearchView(props) {
      const {
        t,
        q,
        scope,
        limit,
        inputError,
        state,
        onQ,
        onScope,
        onLimit,
        onSubmit,
        onRetry,
        onOpen,
      } = props

      const form = h(
        'form',
        { className: 'ovv-search-form', onSubmit },
        h(
          'div',
          { className: 'ovv-search-row' },
          h('input', {
            className: 'ovv-input ovv-search-input',
            type: 'text',
            value: q,
            placeholder: t('searchPlaceholder'),
            'aria-label': t('searchLabel'),
            autoComplete: 'off',
            onChange: (event) => onQ(event.target.value),
          }),
          h(
            'button',
            {
              type: 'submit',
              className: 'ovv-btn ovv-btn-primary',
              disabled: !String(q || '').trim(),
            },
            t('searchAction'),
          ),
        ),
        h(
          'div',
          { className: 'ovv-search-row' },
          h(
            'label',
            { className: 'ovv-field' },
            h('span', null, t('searchScopeLabel')),
            h(
              'select',
              {
                className: 'ovv-select',
                value: scope,
                onChange: (event) => onScope(event.target.value),
              },
              SCOPES.map((option) =>
                h('option', { key: option.value, value: option.value }, t(option.labelKey)),
              ),
            ),
          ),
          h(
            'label',
            { className: 'ovv-field' },
            h('span', null, t('searchLimitLabel')),
            h(
              'select',
              {
                className: 'ovv-select',
                value: String(limit),
                onChange: (event) => onLimit(Number(event.target.value)),
              },
              SEARCH_LIMITS.map((count) =>
                h('option', { key: String(count), value: String(count) }, t('limitOption', { count })),
              ),
            ),
          ),
        ),
        inputError
          ? h('p', { className: 'ovv-inline-error', role: 'alert' }, t('searchNeedQuery'))
          : null,
      )

      let results
      if (state.error) {
        results = h(
          'div',
          null,
          h(
            'p',
            { className: 'ovv-error-box', role: 'alert' },
            t('searchFailed') + ' ' + state.error,
          ),
          h(
            'div',
            { className: 'ovv-setup-actions' },
            h('button', { type: 'button', className: 'ovv-btn', onClick: onRetry }, t('retry')),
          ),
        )
      } else if (state.loading) {
        results = loadingNode(t('searchLoading'))
      } else if (!state.data) {
        results = h(
          'div',
          { className: 'ovv-empty' },
          h('p', { className: 'ovv-empty-title' }, t('searchHintTitle')),
          h('p', { className: 'ovv-empty-desc' }, t('searchHintDesc')),
        )
      } else {
        const data = state.data
        const hits = Array.isArray(data.hits) ? data.hits : []
        const scopes = Array.isArray(data.scopes) ? data.scopes : []
        const metaParts = [h('span', { key: 'count' }, t('searchResults', { count: hits.length }))]
        if (typeof data.elapsedMs === 'number') {
          metaParts.push(
            h('span', { key: 'elapsed' }, t('searchElapsed', { ms: data.elapsedMs })),
          )
        }
        const children = [h('div', { key: 'meta', className: 'ovv-search-meta' }, metaParts)]
        let errorIndex = 0
        for (const entry of scopes) {
          if (entry && typeof entry.error === 'string' && entry.error) {
            children.push(
              h(
                'p',
                { key: 'scope-error-' + errorIndex, className: 'ovv-inline-error', role: 'alert' },
                t('scopeError', { scope: scopeLabel(t, entry.scope), error: entry.error }),
              ),
            )
            errorIndex += 1
          }
        }
        if (hits.length === 0) {
          children.push(
            h(
              'div',
              { key: 'empty', className: 'ovv-empty' },
              h('p', { className: 'ovv-empty-title' }, t('searchEmptyTitle')),
              h('p', { className: 'ovv-empty-desc' }, t('searchEmptyDesc')),
            ),
          )
        } else {
          children.push(
            h(
              'div',
              { key: 'hits', className: 'ovv-hits' },
              hits.map((hit, index) => {
                const uri = hit && typeof hit.uri === 'string' ? hit.uri : ''
                const title =
                  (hit && typeof hit.title === 'string' && hit.title) ||
                  basenameOfUri(uri) ||
                  uri ||
                  t('unknown')
                const scopeText = scopeLabel(t, hit && hit.scope)
                const score = hit && typeof hit.score === 'number' ? hit.score : null
                return h(
                  'button',
                  {
                    key: uri || index,
                    type: 'button',
                    className: 'ovv-hit',
                    title: uri,
                    onClick: () => {
                      if (uri) onOpen(uri)
                    },
                  },
                  h(
                    'span',
                    { className: 'ovv-hit-main' },
                    h('span', { className: 'ovv-hit-title' }, title),
                    uri ? h('span', { className: 'ovv-hit-uri' }, uri) : null,
                    hit && typeof hit.abstract === 'string' && hit.abstract
                      ? h('span', { className: 'ovv-hit-abstract' }, hit.abstract)
                      : null,
                  ),
                  h(
                    'span',
                    { className: 'ovv-hit-side' },
                    h('span', { className: 'ovv-badge' }, scopeText),
                    score !== null
                      ? h(
                          'span',
                          { className: 'ovv-badge ovv-badge-score' },
                          t('score', { score: score.toFixed(2) }),
                        )
                      : null,
                  ),
                )
              }),
            ),
          )
        }
        results = h('div', { className: 'ovv-search' }, children)
      }

      return h('div', { className: 'ovv-search-wrap' }, form, results)
    }

    // -------------------------------------------------------------------- page

    function OpenVikingPanel(props) {
      const t = translateFactory(props && props.t)
      const [statusData, setStatusData] = useState(null)
      const [statusLoading, setStatusLoading] = useState(true)
      const [statusError, setStatusError] = useState(null)
      const [loadedAt, setLoadedAt] = useState(null)
      const [nonce, setNonce] = useState(0)
      const [tab, setTab] = useState('memories')
      const [activeUri, setActiveUri] = useState(TABS[0].uri)
      const [detailUri, setDetailUri] = useState(null)
      const [searchQ, setSearchQ] = useState('')
      const [searchScope, setSearchScope] = useState('all')
      const [searchLimit, setSearchLimit] = useState(20)
      const [searchInputError, setSearchInputError] = useState(false)
      const [searchRun, setSearchRun] = useState(null)
      const [searchState, setSearchState] = useState({ loading: false, error: null, data: null })

      useEffect(() => {
        let alive = true
        setStatusLoading(true)
        setStatusError(null)
        const load = async () => {
          try {
            const data = await apiGet('/status')
            if (!alive) return
            setStatusData(data && typeof data === 'object' ? data : null)
            setLoadedAt(
              data && typeof data.at === 'string' ? data.at : new Date().toISOString(),
            )
          } catch (caught) {
            if (!alive) return
            setStatusError(errorText(caught))
          } finally {
            if (alive) setStatusLoading(false)
          }
        }
        void load()
        return () => {
          alive = false
        }
      }, [nonce])

      useEffect(() => {
        if (!searchRun) return undefined
        let alive = true
        setSearchState({ loading: true, error: null, data: null })
        const query =
          '?q=' +
          encodeURIComponent(searchRun.q) +
          '&scope=' +
          encodeURIComponent(searchRun.scope) +
          '&limit=' +
          encodeURIComponent(String(searchRun.limit))
        const load = async () => {
          try {
            const data = await apiGet('/search' + query)
            if (!alive) return
            setSearchState({
              loading: false,
              error: null,
              data: data && typeof data === 'object' ? data : null,
            })
          } catch (caught) {
            if (!alive) return
            setSearchState({ loading: false, error: errorText(caught), data: null })
          }
        }
        void load()
        return () => {
          alive = false
        }
      }, [searchRun])

      const refresh = () => {
        setNonce((value) => value + 1)
        setSearchRun((previous) =>
          previous ? { ...previous, nonce: (previous.nonce || 0) + 1 } : previous,
        )
      }

      const selectTab = (key) => {
        setTab(key)
        setDetailUri(null)
        setSearchInputError(false)
        const target = TABS.find((entry) => entry.key === key)
        if (target && target.uri) setActiveUri(target.uri)
      }

      const submitSearch = (event) => {
        if (event && typeof event.preventDefault === 'function') event.preventDefault()
        const query = searchQ.trim()
        if (!query) {
          setSearchInputError(true)
          return
        }
        setSearchInputError(false)
        setSearchRun((previous) => ({
          q: query,
          scope: searchScope,
          limit: searchLimit,
          nonce: previous ? (previous.nonce || 0) + 1 : 1,
        }))
      }

      const retrySearch = () => {
        setSearchRun((previous) =>
          previous ? { ...previous, nonce: (previous.nonce || 0) + 1 } : previous,
        )
      }

      const status = statusData
      const reachable = Boolean(status && status.reachable === true)

      const head = h(
        'div',
        { className: 'ovv-head' },
        h(
          'div',
          null,
          h('h2', { className: 'ovv-title' }, t('title')),
          h('p', { className: 'ovv-desc' }, t('desc')),
        ),
        h(
          'div',
          { className: 'ovv-head-actions' },
          statusChipNode(t, status, statusLoading),
          loadedAt
            ? h('span', { className: 'ovv-hint' }, t('updated', { time: formatDateTime(loadedAt) }))
            : null,
          statusLoading && status
            ? h('span', { className: 'ovv-hint' }, t('refreshing'))
            : null,
          h(
            'button',
            {
              type: 'button',
              className: 'ovv-btn',
              onClick: refresh,
              disabled: statusLoading,
            },
            h(RefreshGlyph, { size: 14 }),
            t('refresh'),
          ),
        ),
      )

      const statusErrorNode =
        statusError && status
          ? h(
              'p',
              { className: 'ovv-error-box', role: 'alert' },
              t('statusRefreshFailed') + ' ' + statusError,
            )
          : null

      let body
      if (!status) {
        if (statusLoading) {
          body = loadingNode(t('loading'))
        } else {
          body = h(
            'div',
            { className: 'ovv-empty', role: 'alert' },
            h('p', { className: 'ovv-empty-title' }, t('loadFailed')),
            h('p', { className: 'ovv-empty-desc' }, statusError || t('unknown')),
            h(
              'button',
              { type: 'button', className: 'ovv-btn', onClick: refresh },
              t('retry'),
            ),
          )
        }
      } else if (!reachable) {
        body = h(SetupCard, { t, status, onRetry: refresh })
      } else {
        const chips = []
        const spaces = Array.isArray(status.spaces) ? status.spaces : []
        for (let index = 0; index < spaces.length; index += 1) {
          const space = spaces[index] && typeof spaces[index] === 'object' ? spaces[index] : {}
          const label = spaceLabel(t, space.label)
          if (typeof space.error === 'string' && space.error) {
            chips.push(
              h(
                'span',
                { key: 'space-' + index, className: 'ovv-chip ovv-chip-warn', title: space.error },
                t('spaceError', { label, error: space.error }),
              ),
            )
          } else {
            chips.push(
              h(
                'span',
                { key: 'space-' + index, className: 'ovv-chip' },
                t('spaceCount', {
                  count: typeof space.count === 'number' ? space.count : t('dash'),
                  label,
                }),
              ),
            )
          }
        }
        const server =
          status.server && typeof status.server === 'object' ? status.server : null
        if (server && typeof server.version === 'string' && server.version) {
          chips.push(
            h('span', { key: 'server-version', className: 'ovv-chip' }, t('chipVersion', { version: server.version })),
          )
        }
        if (server && typeof server.user === 'string' && server.user) {
          chips.push(
            h('span', { key: 'server-user', className: 'ovv-chip' }, t('chipUser', { user: server.user })),
          )
        }
        const summary = h(
          'div',
          { className: 'ovv-summary' },
          chips,
          h('span', { className: 'ovv-spacer' }),
        )

        const tabbar = h(
          'div',
          { className: 'ovv-tabs', role: 'tablist', 'aria-label': t('tablistLabel') },
          TABS.map((entry) =>
            h(
              'button',
              {
                key: entry.key,
                type: 'button',
                role: 'tab',
                className: 'ovv-tab',
                'aria-selected': tab === entry.key ? 'true' : 'false',
                onClick: () => selectTab(entry.key),
              },
              t(entry.labelKey),
            ),
          ),
        )

        let content
        if (detailUri) {
          content = h(DetailView, {
            key: 'detail',
            t,
            uri: detailUri,
            nonce,
            onBack: () => setDetailUri(null),
          })
        } else if (tab === 'search') {
          content = h(SearchView, {
            key: 'search',
            t,
            q: searchQ,
            scope: searchScope,
            limit: searchLimit,
            inputError: searchInputError,
            state: searchState,
            onQ: (value) => {
              setSearchQ(value)
              if (searchInputError) setSearchInputError(false)
            },
            onScope: setSearchScope,
            onLimit: setSearchLimit,
            onSubmit: submitSearch,
            onRetry: retrySearch,
            onOpen: (uri) => setDetailUri(uri),
          })
        } else {
          content = h(DirectoryView, {
            key: 'directory',
            t,
            uri: activeUri,
            nonce,
            browseMode: tab === 'browse',
            onNavigate: (nextUri) => {
              setActiveUri(nextUri)
              setDetailUri(null)
            },
            onOpenFile: (uri) => setDetailUri(uri),
          })
        }

        body = h('div', { className: 'ovv-body' }, summary, tabbar, content)
      }

      return h(
        'div',
        { className: 'ovv-page' },
        h('style', { key: 'style' }, CSS),
        h(
          'div',
          { className: 'ovv-scroll', key: 'scroll' },
          h(
            'div',
            { className: 'ovv-inner' },
            head,
            statusErrorNode,
            body,
            h('p', { className: 'ovv-footer' }, t('footerNote')),
          ),
        ),
      )
    }

    // ---------------------------------------------------------------- activate

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const offEnglish = ctx.locale.register(NS, 'en', EN)
          const offChinese = ctx.locale.register(NS, 'zh', ZH)
          return () => {
            try {
              offEnglish()
            } catch {
              // Already disposed with the locale service.
            }
            try {
              offChinese()
            } catch {
              // Already disposed with the locale service.
            }
          }
        }, 'openviking-viewer: locale dictionaries')

        const bound = typeof ctx.locale.bind === 'function' ? ctx.locale.bind(NS) : null

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: PANEL_ID,
              locale: NS,
              inject: () => ({ t: bound || translateFactory(null) }),
            },
            OpenVikingPanel,
          ),
        )

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 30,
              locale: NS,
              label: () => (bound ? bound('panel') : EN.panel),
            },
            MemoryGlyph,
          ),
        )
      },
    }
  },
})
