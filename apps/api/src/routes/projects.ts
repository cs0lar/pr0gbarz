import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import {
  CreateProjectSchema,
  ErrorResponseSchema,
  IdParamsSchema,
  NoContentSchema,
  ProjectListQuerySchema,
  ProjectListSchema,
  ProjectSchema,
  UpdateProjectSchema,
} from '@pr0gbarz/contracts'
import type { FastifyInstance } from 'fastify'

import type { WorkspaceService } from '../services/workspace-service.js'
import { errorResponseSchemas } from './schemas.js'

export function registerProjectRoutes(
  app: FastifyInstance,
  service: WorkspaceService,
): void {
  const typed = app.withTypeProvider<TypeBoxTypeProvider>()

  typed.get(
    '/api/v1/projects',
    {
      schema: {
        querystring: ProjectListQuerySchema,
        response: { 200: ProjectListSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.listProjects(request.query),
  )

  typed.post(
    '/api/v1/projects',
    {
      schema: {
        body: CreateProjectSchema,
        response: { 201: ProjectSchema, ...errorResponseSchemas },
      },
    },
    (request, reply) => {
      reply.code(201)
      return service.createProject(request.body)
    },
  )

  typed.get(
    '/api/v1/projects/:id',
    {
      schema: {
        params: IdParamsSchema,
        response: { 200: ProjectSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.getProject(request.params.id),
  )

  typed.patch(
    '/api/v1/projects/:id',
    {
      schema: {
        body: UpdateProjectSchema,
        params: IdParamsSchema,
        response: { 200: ProjectSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.updateProject(request.params.id, request.body),
  )

  typed.delete(
    '/api/v1/projects/:id',
    {
      schema: {
        params: IdParamsSchema,
        response: {
          204: NoContentSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    (request, reply) => {
      service.archiveProject(request.params.id)
      reply.code(204)
      return null
    },
  )
}
