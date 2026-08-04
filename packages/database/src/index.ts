export {
  inspectDatabaseIdentity,
  openDatabase,
  type DatabaseConnection,
  type DatabaseIntegrity,
  type OpenDatabaseOptions,
  type Pr0gbarzDatabase,
} from './connection.js'
export {
  DatabaseIdentityError,
  type DatabaseIdentityErrorCode,
} from './errors.js'
export type {
  ProjectRepository,
  Repositories,
  TagRepository,
  TaskRepository,
} from './repositories.js'
export { createRepositories } from './repositories.js'
export {
  appMetadata,
  databaseMajorVersion,
  productIdentifier,
  progressEvents,
  projects,
  tags,
  taskPriorities,
  taskStatuses,
  taskTags,
  tasks,
  type NewProject,
  type NewTag,
  type NewTask,
  type ProgressEvent,
  type Project,
  type Tag,
  type Task,
} from './schema.js'
