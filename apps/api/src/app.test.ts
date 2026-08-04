import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { buildApp } from './app.js'

const openApps: Awaited<ReturnType<typeof buildApp>>[] = []
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(openApps.splice(0).map((app) => app.close()))
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, {
        force: true,
        recursive: true,
      }),
    ),
  )
})

describe('buildApp', () => {
  it('exposes a minimal status endpoint', async () => {
    const app = await buildApp({ staticRoot: false })
    openApps.push(app)

    const response = await app.inject({ method: 'GET', url: '/api/status' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      name: 'pr0gbarz',
      status: 'ok',
      version: 2,
    })
  })

  it('returns a conventional not-found response without static assets', async () => {
    const app = await buildApp({ staticRoot: false })
    openApps.push(app)

    const response = await app.inject({ method: 'GET', url: '/missing' })

    expect(response.statusCode).toBe(404)
  })

  it('serves the web entry point and falls back to it for client routes', async () => {
    const staticRoot = await mkdtemp(path.join(tmpdir(), 'pr0gbarz-web-'))
    temporaryDirectories.push(staticRoot)
    await writeFile(
      path.join(staticRoot, 'index.html'),
      '<!doctype html><title>pr0gbarz test shell</title>',
      'utf8',
    )

    const app = await buildApp({ staticRoot })
    openApps.push(app)

    const rootResponse = await app.inject({ method: 'GET', url: '/' })
    const clientRouteResponse = await app.inject({
      method: 'GET',
      url: '/projects/example',
    })

    expect(rootResponse.statusCode).toBe(200)
    expect(rootResponse.body).toContain('pr0gbarz test shell')
    expect(clientRouteResponse.statusCode).toBe(200)
    expect(clientRouteResponse.body).toContain('pr0gbarz test shell')
  })
})
