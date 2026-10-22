import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagePath = resolve(root, 'package.json')
const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
const patchRelative = pkg.dsh?.bundle?.patch

if (typeof patchRelative !== 'string' || patchRelative.length === 0) {
  throw new Error(`${pkg.name ?? 'plugin'}: package.json must declare dsh.bundle.patch`)
}

const patchPath = resolve(root, patchRelative)
await access(patchPath)
const patch = await readFile(patchPath, 'utf8')
const names = [`name: '${pkg.name}'`, `name: "${pkg.name}"`, `name: ${pkg.name}`]
if (!patch.includes('insert:') || !names.some(name => patch.includes(name))) {
  throw new Error(`${pkg.name}: ${patchRelative} must insert a loader entry whose name is the package name`)
}

if (pkg.dsh?.client !== undefined) {
  if (pkg.dsh.client.platform !== 'web') throw new Error(`${pkg.name}: dsh.client.platform must be "web"`)
  if (!Array.isArray(pkg.dsh.client.inject)) throw new Error(`${pkg.name}: dsh.client.inject must be an array`)
}

console.log(`${pkg.name}: bundle manifest OK (${patchRelative})`)
