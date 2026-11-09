#!/usr/bin/env node
/**
 * package.json version must equal the newest released CHANGELOG heading, and —
 * when a tag is passed — that tag too. Keeps a release from shipping notes for
 * a different version than the code it packs.
 *
 * Run: node .github/scripts/check-version.mjs [vX.Y.Z]
 */
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const changelog = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8')

const headings = [...changelog.matchAll(/^##\s+\[?v?(\d+\.\d+\.\d+)\]?/gm)].map((m) => m[1])
if (headings.length === 0) {
  console.error('CHANGELOG.md has no "## x.y.z" release heading.')
  process.exit(1)
}

const failures = []
if (headings[0] !== pkg.version) {
  failures.push(`package.json version ${pkg.version} != newest CHANGELOG release ${headings[0]}`)
}

const tag = process.argv[2]
if (tag) {
  const tagVersion = tag.replace(/^v/, '')
  if (tagVersion !== pkg.version) failures.push(`tag ${tag} != package.json version ${pkg.version}`)
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}
console.log(`version ok: ${pkg.version}${tag ? ` (tag ${tag})` : ''}`)
