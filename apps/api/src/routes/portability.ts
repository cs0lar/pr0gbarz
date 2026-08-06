import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import {
  CsvExportQuerySchema,
  ImportRequestSchema,
  ImportResultSchema,
  JsonBackupSchema,
} from '@pr0gbarz/contracts'
import type { FastifyInstance } from 'fastify'
import { Type } from 'typebox'

import type { PortabilityService } from '../services/portability-service.js'
import { errorResponseSchemas } from './schemas.js'

export function registerPortabilityRoutes(
  app: FastifyInstance,
  service: PortabilityService,
): void {
  const typed = app.withTypeProvider<TypeBoxTypeProvider>()

  typed.get(
    '/api/v1/export/json',
    { schema: { response: { 200: JsonBackupSchema, ...errorResponseSchemas } } },
    () => service.exportJson(),
  )

  typed.get(
    '/api/v1/export/tasks.csv',
    {
      schema: {
        querystring: CsvExportQuerySchema,
        response: { 200: Type.String(), ...errorResponseSchemas },
      },
    },
    (request, reply) => {
      reply.header('content-disposition', 'attachment; filename="pr0gbarz-tasks.csv"')
      reply.type('text/csv; charset=utf-8')
      return service.exportTasksCsv(request.query)
    },
  )

  typed.post(
    '/api/v1/import/json',
    {
      schema: {
        body: ImportRequestSchema,
        response: { 200: ImportResultSchema, ...errorResponseSchemas },
      },
    },
    (request) => service.importJson(request.body),
  )
}
