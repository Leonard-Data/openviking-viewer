#!/usr/bin/env node
/**
 * Every path in package.json "files" and every export target must exist, or the
 * published tarball installs a plugin the harness cannot load.
 *
 * Run: node .github/scripts/check-files.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// Patterns here are only ever "dir/*.ext" (node:fs globSync needs Node 22, and
// CI covers Node 20), so one directory read answers every case the manifests use.
function resolves(pattern) {
  const relative = pattern.replace(/^\.\//, '')
  if (!relative.includes('*')) return existsSync(join(root, relative))
  const dir = join(root, dirname(relative))
  if (!existsSync(dir)) return false
  const suffix = relative.slice(relative.lastIndexOf('*') + 1)
  return readdirSync(dir).some((entry) => entry.endsWith(suffix))
}

const missing = []

for (const entry of pkg.files ?? []) {
  if (!resolves(entry)) missing.push(`files: ${entry}`)
}

for (const [name, target] of Object.entries(pkg.exports ?? {})) {
  if (typeof target !== 'string') continue
  if (!resolves(target)) missing.push(`exports["${name}"]: ${target}`)
}

const patch = pkg.dsh?.bundle?.patch
if (patch && !existsSync(join(root, patch))) missing.push(`dsh.bundle.patch: ${patch}`)

if (pkg.icon && !existsSync(join(root, pkg.icon))) missing.push(`icon: ${pkg.icon}`)

if (missing.length > 0) {
  console.error('package.json promises files that do not exist:')
  for (const entry of missing) console.error(`  - ${entry}`)
  process.exit(1)
}
console.log(`file list ok: ${(pkg.files ?? []).length} patterns, ${Object.keys(pkg.exports ?? {}).length} exports`)
