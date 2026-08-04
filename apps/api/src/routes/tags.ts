import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import {
  CreateTagSchema,
  TagListQuerySchema,
  TagListSchema,
  TagSchema,
} from '@pr0gbarz/contracts'
import type { FastifyInstance } from 'fastify'

import type { WorkspaceService } from '../services/workspace-service.js'
import { errorResponseSchemas } from './schemas.js'

export function registerTagRoutes(
  app: FastifyInstance,
  service: WorkspaceService,
): void {
  const typed = app.withTypeProvider<TypeBoxTypeProvider>()

  typed.get(
    '/api/v1/tags',
    {
      schema: {
        querystring: TagListQuerySchema,
        response: { 200: TagListSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.listTags(request.query),
  )

  typed.post(
    '/api/v1/tags',
    {
      schema: {
        body: CreateTagSchema,
        response: { 201: TagSchema, ...errorResponseSchemas },
      },
    },
    (request, reply) => {
      reply.code(201)
      return service.createTag(request.body)
    },
  )
}
