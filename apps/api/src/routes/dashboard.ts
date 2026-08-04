import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { DashboardSchema } from '@pr0gbarz/contracts'
import type { FastifyInstance } from 'fastify'

import type { WorkspaceService } from '../services/workspace-service.js'
import { errorResponseSchemas } from './schemas.js'

export function registerDashboardRoute(
  app: FastifyInstance,
  service: WorkspaceService,
): void {
  app.withTypeProvider<TypeBoxTypeProvider>().get(
    '/api/v1/dashboard',
    {
      schema: {
        response: { 200: DashboardSchema, ...errorResponseSchemas },
      },
    },
    () => service.dashboard(),
  )
}
