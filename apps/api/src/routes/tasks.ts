import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import {
  CreateTaskSchema,
  ErrorResponseSchema,
  IdParamsSchema,
  NoContentSchema,
  ProgressEventListQuerySchema,
  ProgressEventListSchema,
  ProjectIdParamsSchema,
  TaskListQuerySchema,
  TaskListSchema,
  TaskSchema,
  TaskTagParamsSchema,
  TaskIdParamsSchema,
  UpdateTaskSchema,
} from '@pr0gbarz/contracts'
import type { FastifyInstance } from 'fastify'

import type { WorkspaceService } from '../services/workspace-service.js'
import { errorResponseSchemas } from './schemas.js'

export function registerTaskRoutes(
  app: FastifyInstance,
  service: WorkspaceService,
): void {
  const typed = app.withTypeProvider<TypeBoxTypeProvider>()

  typed.get(
    '/api/v1/projects/:projectId/tasks',
    {
      schema: {
        params: ProjectIdParamsSchema,
        querystring: TaskListQuerySchema,
        response: { 200: TaskListSchema, ...errorResponseSchemas },
      },
    },
    (request) =>
      service.listTasks(request.params.projectId, request.query),
  )

  typed.post(
    '/api/v1/projects/:projectId/tasks',
    {
      schema: {
        body: CreateTaskSchema,
        params: ProjectIdParamsSchema,
        response: { 201: TaskSchema, ...errorResponseSchemas },
      },
    },
    (request, reply) => {
      reply.code(201)
      return service.createTask(request.params.projectId, request.body)
    },
  )

  typed.get(
    '/api/v1/tasks/:id',
    {
      schema: {
        params: IdParamsSchema,
        response: { 200: TaskSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.getTask(request.params.id),
  )

  typed.patch(
    '/api/v1/tasks/:id',
    {
      schema: {
        body: UpdateTaskSchema,
        params: IdParamsSchema,
        response: { 200: TaskSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.updateTask(request.params.id, request.body),
  )

  typed.delete(
    '/api/v1/tasks/:id',
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
      service.archiveTask(request.params.id)
      reply.code(204)
      return null
    },
  )

  typed.get(
    '/api/v1/tasks/:taskId/progress-events',
    {
      schema: {
        params: TaskIdParamsSchema,
        querystring: ProgressEventListQuerySchema,
        response: { 200: ProgressEventListSchema, ...errorResponseSchemas },
      },
    },
    (request) =>
      service.listProgressEvents(request.params.taskId, request.query),
  )

  typed.put(
    '/api/v1/tasks/:taskId/tags/:tagId',
    {
      schema: {
        params: TaskTagParamsSchema,
        response: { 200: TaskSchema, ...errorResponseSchemas },
      },
    },
    (request) =>
      service.addTagToTask(request.params.taskId, request.params.tagId),
  )

  typed.delete(
    '/api/v1/tasks/:taskId/tags/:tagId',
    {
      schema: {
        params: TaskTagParamsSchema,
        response: {
          204: NoContentSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    (request, reply) => {
      service.removeTagFromTask(request.params.taskId, request.params.tagId)
      reply.code(204)
      return null
    },
  )
}
