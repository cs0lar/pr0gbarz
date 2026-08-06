import { access, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const root = process.cwd()
const webAssets = path.join(root, 'apps/web/dist/assets')
const budgets = {
  largestJavaScriptGzip: 105 * 1024,
  totalCssGzip: 10 * 1024,
  totalJavaScriptGzip: 140 * 1024,
}

async function mustExist(relativePath) {
  await access(path.join(root, relativePath))
}

async function mustNotExist(relativePath) {
  try {
    await access(path.join(root, relativePath))
  } catch {
    return
  }
  throw new Error(`Legacy release path still exists: ${relativePath}`)
}

async function mustContainNoFiles(relativePath) {
  try {
    const entries = await readdir(path.join(root, relativePath), {
      recursive: true,
    })
    const containsFile = (
      await Promise.all(
        entries.map((entry) => stat(path.join(root, relativePath, entry))),
      )
    ).some((entry) => entry.isFile())
    if (containsFile) {
      throw new Error(`Legacy release directory is not empty: ${relativePath}`)
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

await Promise.all([
  mustExist('apps/api/dist/server.js'),
  mustExist('apps/web/dist/index.html'),
  mustExist('apps/web/dist/manifest.webmanifest'),
  mustExist('apps/web/dist/pr0gbarz-mark.svg'),
])

await Promise.all(
  ['server.js', 'screenshot.png'].map((item) => mustNotExist(item)),
)
await Promise.all(
  ['lib', 'plugins', 'routes', 'sql', 'views', 'public'].map((item) =>
    mustContainNoFiles(item),
  ),
)

const lockfile = await readFile(path.join(root, 'package-lock.json'), 'utf8')
for (const dependency of [
  'liquidjs',
  'milligram',
  'progressbar.js',
  'sparkline',
]) {
  if (lockfile.toLowerCase().includes(dependency)) {
    throw new Error(
      `Legacy dependency remains in package-lock.json: ${dependency}`,
    )
  }
}

const assets = await readdir(webAssets)
const measured = await Promise.all(
  assets
    .filter((asset) => asset.endsWith('.js') || asset.endsWith('.css'))
    .map(async (asset) => {
      const filePath = path.join(webAssets, asset)
      const contents = await readFile(filePath)
      return {
        asset,
        bytes: (await stat(filePath)).size,
        gzipBytes: gzipSync(contents).byteLength,
        kind: asset.endsWith('.js') ? 'javascript' : 'css',
      }
    }),
)

const javascript = measured.filter((asset) => asset.kind === 'javascript')
const css = measured.filter((asset) => asset.kind === 'css')
const totalJavaScriptGzip = javascript.reduce(
  (total, asset) => total + asset.gzipBytes,
  0,
)
const totalCssGzip = css.reduce((total, asset) => total + asset.gzipBytes, 0)
const largestJavaScriptGzip = Math.max(
  0,
  ...javascript.map((asset) => asset.gzipBytes),
)

if (totalJavaScriptGzip > budgets.totalJavaScriptGzip) {
  throw new Error(
    `JavaScript gzip budget exceeded: ${String(totalJavaScriptGzip)} > ${String(budgets.totalJavaScriptGzip)} bytes`,
  )
}
if (largestJavaScriptGzip > budgets.largestJavaScriptGzip) {
  throw new Error(
    `Largest JavaScript chunk budget exceeded: ${String(largestJavaScriptGzip)} > ${String(budgets.largestJavaScriptGzip)} bytes`,
  )
}
if (totalCssGzip > budgets.totalCssGzip) {
  throw new Error(
    `CSS gzip budget exceeded: ${String(totalCssGzip)} > ${String(budgets.totalCssGzip)} bytes`,
  )
}

process.stdout.write(
  `${JSON.stringify({ budgets, measured, status: 'ok' }, null, 2)}\n`,
)
