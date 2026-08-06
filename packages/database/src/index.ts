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
  DashboardStats,
  Page,
  ProgressChange,
  ProjectListOptions,
  ProjectRepository,
  ProjectUpdateValues,
  ProjectWithStats,
  Repositories,
  TagListOptions,
  TagRepository,
  TaskListOptions,
  TaskRepository,
  TaskUpdateValues,
  TaskWithTags,
  WorkspaceRepository,
} from './repositories.js'
export {
  importDatabaseSnapshot,
  readDatabaseSnapshot,
  type DatabaseSnapshot,
  type ImportableSnapshot,
  type ImportConflictPolicy,
} from './portability.js'
export {
  createRepositories,
  createWorkspaceRepository,
} from './repositories.js'
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
