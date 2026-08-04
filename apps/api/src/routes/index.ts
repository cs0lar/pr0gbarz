import type { FastifyInstance } from 'fastify'

import type { WorkspaceService } from '../services/workspace-service.js'
import { registerDashboardRoute } from './dashboard.js'
import { registerProjectRoutes } from './projects.js'
import { registerTagRoutes } from './tags.js'
import { registerTaskRoutes } from './tasks.js'

export function registerApiRoutes(
  app: FastifyInstance,
  service: WorkspaceService,
): void {
  registerDashboardRoute(app, service)
  registerProjectRoutes(app, service)
  registerTaskRoutes(app, service)
  registerTagRoutes(app, service)
}
