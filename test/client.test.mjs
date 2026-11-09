// Independent static-execution verification of the OpenViking viewer client half.
//
// The client half is a browser module; no DOM is needed to verify its
// registration surface. It is executed in a `node:vm` context with a fake
// `window.__ModuleLoader__` and a fake React, then `apply()` runs against a fake
// Cordis context so the registered slots and locale dictionaries can be
// inspected without a live page.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

function loadClientHalf() {
  let spec = null
  const sandbox = {
    window: { __ModuleLoader__: { load(loaded) { spec = loaded } } },
    console,
  }
  createContext(sandbox)
  runInContext(source, sandbox, { filename: 'client.js' })

  assert.ok(spec, 'client.js must call window.__ModuleLoader__.load(...)')
  const required = []
  const fakeReact = {
    createElement() { return null },
    useState() { return [null, () => {}] },
    useEffect() {},
    useRef() { return { current: null } },
  }
  const fakeRequire = (id) => {
    required.push(id)
    if (id === 'react') return fakeReact
    throw new Error(`client.js required an unexpected module: ${id}`)
  }
  const module = spec.factory(fakeRequire)
  return { spec, module, required }
}

function activate(module) {
  const registered = []
  const locales = []
  const effects = []
  const disposers = []
  const ctx = {
    effect(setup, label) {
      effects.push(label)
      disposers.push(setup())
    },
    locale: {
      register(namespace, language, dictionary) {
        locales.push({ namespace, language, dictionary })
        return () => {}
      },
      bind() {
        return (key) => key
      },
    },
    slots: {
      inject(where, register) { register() },
      register(slot, component) {
        registered.push({ slot, component })
        return () => {}
      },
    },
  }
  module.apply(ctx)
  return { registered, locales, effects, disposers }
}

test('loader id matches the package name and only react is required', () => {
  const { spec, required } = loadClientHalf()
  assert.equal(spec.id, '@local/openviking-viewer')
  assert.deepEqual(required, ['react'])
  assert.equal(source.includes('@deepseek-ai/'), false)
  assert.equal((source.match(/require\s*\(/g) || []).length, 1)
})

test('module injects slots+locale and registers both slots with contract ids', () => {
  const { module } = loadClientHalf()
  assert.deepEqual([...module.inject], ['slots', 'locale'])

  const { registered } = activate(module)
  const main = registered.find((entry) => entry.slot.name === 'main')
  assert.ok(main, 'main slot must be registered')
  assert.equal(main.slot.key, 'openviking')
  assert.equal(typeof main.component, 'function')

  const sidebar = registered.find((entry) => entry.slot.name === 'sidebar.panellist')
  assert.ok(sidebar, 'sidebar.panellist slot must be registered')
  assert.equal(sidebar.slot.id, 'openviking')
  assert.equal(sidebar.slot.order, 30)
  assert.equal(typeof sidebar.component, 'function')
})

test('locale registration is wrapped in ctx.effect with a disposer', () => {
  const { module } = loadClientHalf()
  const { locales, effects, disposers } = activate(module)
  assert.equal(effects.length, 1)
  assert.match(effects[0], /openviking-viewer/)
  assert.equal(disposers.length, 1)
  assert.equal(typeof disposers[0], 'function')
  assert.deepEqual(locales.map((entry) => [entry.namespace, entry.language]), [
    ['openviking-viewer', 'en'],
    ['openviking-viewer', 'zh'],
  ])
  const en = locales.find((entry) => entry.language === 'en').dictionary
  const zh = locales.find((entry) => entry.language === 'zh').dictionary
  assert.ok(en.panel && zh.panel)
  assert.notEqual(en.panel, zh.panel)
  assert.equal(Object.keys(en).length, Object.keys(zh).length)
})

test('locale.json files in the package match their dictionaries', () => {
  const enFile = JSON.parse(readFileSync(new URL('../locale/en.json', import.meta.url), 'utf8'))
  const zhFile = JSON.parse(readFileSync(new URL('../locale/zh.json', import.meta.url), 'utf8'))
  assert.ok(enFile.meta.title && enFile.meta.description)
  assert.ok(zhFile.meta.title && zhFile.meta.description)
  assert.notEqual(enFile.meta.title, zhFile.meta.title)

  const { module } = loadClientHalf()
  const { locales } = activate(module)
  const en = locales.find((entry) => entry.language === 'en').dictionary
  const zh = locales.find((entry) => entry.language === 'zh').dictionary
  assert.equal(enFile.meta.title, en.title)
  assert.equal(zhFile.meta.title, zh.title)
})

test('no literal colors or inline scripts in the client bundle', () => {
  assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(source), false, 'no literal #rgb/#rrggbb colors')
  assert.equal(/\brgba?\(|\bhsla?\(/.test(source), false, 'no rgb()/hsl() colors')
  const customProperties = [...source.matchAll(/var\((--[a-zA-Z0-9-]+)/g)].map((match) => match[1])
  assert.ok(customProperties.length > 0)
  for (const property of new Set(customProperties)) {
    assert.match(property, /^--dsw-alias-/, `non-theme CSS custom property ${property}`)
  }
  assert.equal(/dangerouslySetInnerHTML|innerHTML|eval\(/.test(source), false)
})
