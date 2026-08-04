import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface BuildAppOptions {
  logger?: boolean
  staticRoot?: false | string
}

const defaultStaticRoot = fileURLToPath(
  new URL('../../web/dist/', import.meta.url),
)

async function directoryExists(directory: string): Promise<boolean> {
  try {
    await access(directory)
    return true
  } catch {
    return false
  }
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false })

  app.get('/api/status', () => ({
    name: 'pr0gbarz',
    status: 'ok',
    version: 2,
  }))

  const staticRoot = options.staticRoot ?? defaultStaticRoot

  if (staticRoot !== false && (await directoryExists(staticRoot))) {
    await app.register(fastifyStatic, {
      root: path.resolve(staticRoot),
      wildcard: false,
    })

    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) {
        return reply.sendFile('index.html')
      }

      return reply.code(404).send({
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      })
    })
  }

  return app
}
