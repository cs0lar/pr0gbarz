import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastifyStatic from '@fastify/static'
import {
  ErrorResponseSchema,
  HealthSchema,
  ReadinessSchema,
} from '@pr0gbarz/contracts'
import {
  createWorkspaceRepository,
  type DatabaseConnection,
} from '@pr0gbarz/database'
import Fastify, {
  type FastifyInstance,
  type FastifySchemaValidationError,
} from 'fastify'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { AppError } from './errors.js'
import { registerApiRoutes } from './routes/index.js'
import { WorkspaceService } from './services/workspace-service.js'

export interface BuildAppOptions {
  database?: DatabaseConnection
  logger?: boolean
  now?: () => Date
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

function validationFieldErrors(
  validation: FastifySchemaValidationError[],
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of validation) {
    const missingProperty = issue.params.missingProperty
    const field =
      typeof missingProperty === 'string'
        ? missingProperty
        : issue.instancePath.replace(/^\//, '').replaceAll('/', '.') ||
          'request'
    const messages = fieldErrors[field] ?? []
    messages.push(issue.message ?? 'is invalid')
    fieldErrors[field] = messages
  }

  return fieldErrors
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false })

  if (options.database) {
    app.addHook('onClose', () => {
      options.database?.close()
    })
  }

  app.setErrorHandler((error, request, reply) => {
    const validation =
      typeof error === 'object' &&
      error !== null &&
      'validation' in error &&
      Array.isArray(error.validation)
        ? (error.validation as FastifySchemaValidationError[])
        : undefined

    if (validation) {
      return reply.code(400).send({
        code: 'VALIDATION_ERROR',
        fieldErrors: validationFieldErrors(validation),
        message: 'The request did not pass validation.',
      })
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        code: error.code,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return reply.code(409).send({
        code: 'CONFLICT',
        message: 'The requested record conflicts with an existing record.',
      })
    }

    request.log.error({ err: error }, 'Unhandled request error')
    return reply.code(500).send({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    })
  })

  const typed = app.withTypeProvider<TypeBoxTypeProvider>()

  typed.get('/health', { schema: { response: { 200: HealthSchema } } }, () => ({
    status: 'ok' as const,
  }))

  typed.get(
    '/ready',
    {
      schema: {
        response: { 200: ReadinessSchema, 503: ErrorResponseSchema },
      },
    },
    (_request, reply) => {
      const integrity = options.database?.verifyIntegrity()

      if (
        !integrity ||
        !integrity.foreignKeysValid ||
        integrity.quickCheck !== 'ok'
      ) {
        reply.code(503)
        return {
          code: 'NOT_READY',
          message: 'The database is not ready.',
        }
      }

      return { database: 'ready' as const, status: 'ok' as const }
    },
  )

  if (options.database) {
    registerApiRoutes(
      app,
      new WorkspaceService(createWorkspaceRepository(options.database.db), {
        now: options.now,
      }),
    )
  }

  const staticRoot = options.staticRoot ?? defaultStaticRoot
  let staticAssetsRegistered = false

  if (staticRoot !== false && (await directoryExists(staticRoot))) {
    await app.register(fastifyStatic, {
      root: path.resolve(staticRoot),
      wildcard: false,
    })
    staticAssetsRegistered = true
  }

  app.setNotFoundHandler((request, reply) => {
    if (
      staticAssetsRegistered &&
      request.method === 'GET' &&
      !request.url.startsWith('/api/') &&
      !request.url.startsWith('/health') &&
      !request.url.startsWith('/ready')
    ) {
      return reply.sendFile('index.html')
    }

    return reply.code(404).send({
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    })
  })

  return app
}
