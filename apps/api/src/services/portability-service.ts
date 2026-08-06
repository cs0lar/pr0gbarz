import type {
  BackupCounts,
  BackupData,
  CsvExportQuery,
  ImportRequest,
  ImportResult,
  JsonBackup,
} from '@pr0gbarz/contracts'
import {
  importDatabaseSnapshot,
  readDatabaseSnapshot,
  type DatabaseConnection,
} from '@pr0gbarz/database'
import { createHash } from 'node:crypto'

import { conflict, invalidImport } from '../errors.js'

function timestamp(value: Date | null): string | null {
  return value?.toISOString() ?? null
}

function backupData(connection: DatabaseConnection): BackupData {
  const snapshot = readDatabaseSnapshot(connection.db)
  return {
    progressEvents: snapshot.progressEvents.map((event) => ({
      ...event,
      occurredAt: event.occurredAt.toISOString(),
    })),
    projects: snapshot.projects.map((project) => ({
      ...project,
      archivedAt: timestamp(project.archivedAt),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    })),
    tags: snapshot.tags.map((tag) => ({
      ...tag,
      createdAt: tag.createdAt.toISOString(),
    })),
    taskTags: snapshot.taskTags,
    tasks: snapshot.tasks.map((task) => ({
      ...task,
      archivedAt: timestamp(task.archivedAt),
      completedAt: timestamp(task.completedAt),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })),
  }
}

function counts(data: BackupData): BackupCounts {
  return {
    progressEvents: data.progressEvents.length,
    projects: data.projects.length,
    tags: data.tags.length,
    taskTags: data.taskTags.length,
    tasks: data.tasks.length,
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function hashData(data: BackupData): string {
  return createHash('sha256').update(canonicalJson(data)).digest('hex')
}

function collectionHashes(data: BackupData) {
  return {
    progressEvents: createHash('sha256')
      .update(canonicalJson(data.progressEvents))
      .digest('hex'),
    projects: createHash('sha256')
      .update(canonicalJson(data.projects))
      .digest('hex'),
    tags: createHash('sha256').update(canonicalJson(data.tags)).digest('hex'),
    taskTags: createHash('sha256')
      .update(canonicalJson(data.taskTags))
      .digest('hex'),
    tasks: createHash('sha256').update(canonicalJson(data.tasks)).digest('hex'),
  }
}

function csvCell(value: null | number | string): string {
  if (value === null) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export class PortabilityService {
  readonly #connection: DatabaseConnection
  readonly #now: () => Date

  constructor(
    connection: DatabaseConnection,
    now: () => Date = () => new Date(),
  ) {
    this.#connection = connection
    this.#now = now
  }

  exportJson(): JsonBackup {
    const data = backupData(this.#connection)
    return {
      data,
      exportedAt: this.#now().toISOString(),
      format: 'pr0gbarz-json-backup',
      integrity: {
        algorithm: 'sha256',
        collectionHashes: collectionHashes(data),
        counts: counts(data),
        dataHash: hashData(data),
      },
      product: 'pr0gbarz',
      version: 1,
    }
  }

  importJson(request: ImportRequest): ImportResult {
    const actualCounts = counts(request.backup.data)
    if (
      JSON.stringify(actualCounts) !==
      JSON.stringify(request.backup.integrity.counts)
    ) {
      throw invalidImport(
        'Backup record counts do not match its integrity metadata.',
      )
    }
    const actualHash = hashData(request.backup.data)
    const actualCollectionHashes = collectionHashes(request.backup.data)
    for (const collection of Object.keys(
      actualCollectionHashes,
    ) as (keyof typeof actualCollectionHashes)[]) {
      if (
        actualCollectionHashes[collection] !==
        request.backup.integrity.collectionHashes[collection]
      ) {
        throw invalidImport(
          `Backup ${collection} do not match their SHA-256 integrity hash.`,
        )
      }
    }
    if (actualHash !== request.backup.integrity.dataHash) {
      throw invalidImport(
        'Backup data does not match its SHA-256 integrity hash.',
      )
    }

    try {
      importDatabaseSnapshot(this.#connection.db, request.backup.data, {
        apply: request.mode === 'apply',
        conflictPolicy: request.conflictPolicy,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('The database already contains projects.')
      ) {
        throw conflict(error.message)
      }
      throw invalidImport(
        error instanceof Error
          ? `Backup could not be imported: ${error.message}`
          : 'Backup could not be imported.',
      )
    }

    return {
      applied: request.mode === 'apply',
      counts: actualCounts,
      message:
        request.mode === 'apply'
          ? 'Backup imported transactionally.'
          : 'Dry run passed; no data was changed.',
      valid: true,
    }
  }

  exportTasksCsv(query: CsvExportQuery): string {
    const data = backupData(this.#connection)
    const tagLabels = new Map(data.tags.map((tag) => [tag.id, tag.label]))
    const tagsByTask = new Map<number, string[]>()
    for (const relation of data.taskTags) {
      const label = tagLabels.get(relation.tagId)
      if (!label) continue
      const labels = tagsByTask.get(relation.taskId) ?? []
      labels.push(label)
      tagsByTask.set(relation.taskId, labels)
    }
    const projectNames = new Map(
      data.projects.map((project) => [project.id, project.name]),
    )
    const header = [
      'id',
      'project_id',
      'project',
      'name',
      'description',
      'status',
      'priority',
      'progress',
      'start_date',
      'due_date',
      'tags',
      'archived_at',
      'created_at',
      'updated_at',
    ]
    const rows = data.tasks
      .filter(
        (task) =>
          query.projectId === undefined || task.projectId === query.projectId,
      )
      .map((task) =>
        [
          task.id,
          task.projectId,
          projectNames.get(task.projectId) ?? '',
          task.name,
          task.description,
          task.status,
          task.priority,
          task.progress,
          task.startDate,
          task.dueDate,
          (tagsByTask.get(task.id) ?? []).sort().join('; '),
          task.archivedAt,
          task.createdAt,
          task.updatedAt,
        ]
          .map(csvCell)
          .join(','),
      )
    return [header.join(','), ...rows].join('\r\n') + '\r\n'
  }
}
