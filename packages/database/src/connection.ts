import { drizzle } from 'drizzle-orm/node-sqlite'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import { defineRelations } from 'drizzle-orm/relations'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

import { DatabaseIdentityError } from './errors.js'
import * as schema from './schema.js'

const defaultMigrationsFolder = fileURLToPath(
  new URL('../drizzle/', import.meta.url),
)

interface DatabaseIdentity {
  majorVersion: number
  product: string
}

export interface OpenDatabaseOptions {
  databasePath: string
  migrationsFolder?: string
}

function createOrm(client: DatabaseSync) {
  return drizzle({ client, relations: defineRelations(schema) })
}

export type Pr0gbarzDatabase = ReturnType<typeof createOrm>

export interface DatabaseConnection {
  readonly client: DatabaseSync
  readonly databasePath: string
  readonly db: Pr0gbarzDatabase
  close(): void
  verifyIntegrity(): DatabaseIntegrity
}

export interface DatabaseIntegrity {
  foreignKeysValid: boolean
  quickCheck: string
}

async function pathExists(databasePath: string): Promise<boolean> {
  try {
    await stat(databasePath)
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false
    }

    throw error
  }
}

function readIdentity(client: DatabaseSync): DatabaseIdentity | undefined {
  const row = client
    .prepare(
      'SELECT product, major_version AS majorVersion FROM app_metadata WHERE id = 1',
    )
    .get()

  if (
    row === undefined ||
    typeof row.product !== 'string' ||
    typeof row.majorVersion !== 'number'
  ) {
    return undefined
  }

  return {
    majorVersion: row.majorVersion,
    product: row.product,
  }
}

function identifyExistingDatabase(databasePath: string): void {
  let client: DatabaseSync | undefined

  try {
    client = new DatabaseSync(databasePath, {
      readOnly: true,
      timeout: 5_000,
    })

    const tableRows = client
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
    const tableNames = tableRows.flatMap((row) =>
      typeof row.name === 'string' ? [row.name] : [],
    )

    if (tableNames.some((name) => name.startsWith('pgbz_'))) {
      throw new DatabaseIdentityError(
        'DATABASE_LEGACY',
        databasePath,
        `The database at "${databasePath}" belongs to pr0gbarz v1. Version 2 requires a new database file.`,
      )
    }

    if (!tableNames.includes('app_metadata')) {
      throw new DatabaseIdentityError(
        'DATABASE_UNKNOWN',
        databasePath,
        `The database at "${databasePath}" is not identified as a pr0gbarz v2 database and was not modified.`,
      )
    }

    const identity = readIdentity(client)

    if (identity?.product !== schema.productIdentifier) {
      throw new DatabaseIdentityError(
        'DATABASE_UNKNOWN',
        databasePath,
        `The database at "${databasePath}" has an unknown product identity and was not modified.`,
      )
    }

    if (identity.majorVersion !== schema.databaseMajorVersion) {
      throw new DatabaseIdentityError(
        'DATABASE_VERSION_UNSUPPORTED',
        databasePath,
        `The database at "${databasePath}" uses unsupported pr0gbarz database major version ${String(identity.majorVersion)}.`,
      )
    }
  } catch (error) {
    if (error instanceof DatabaseIdentityError) {
      throw error
    }

    throw new DatabaseIdentityError(
      'DATABASE_MALFORMED',
      databasePath,
      `The database at "${databasePath}" is not a readable SQLite database and was not modified.`,
      { cause: error },
    )
  } finally {
    client?.close()
  }
}

function configureConnection(client: DatabaseSync): void {
  client.exec('PRAGMA foreign_keys = ON')
  client.exec('PRAGMA journal_mode = WAL')
  client.exec('PRAGMA synchronous = NORMAL')
}

function verifyIntegrity(client: DatabaseSync): DatabaseIntegrity {
  const quickCheckRow = client.prepare('PRAGMA quick_check').get()
  const quickCheck = quickCheckRow?.quick_check
  const foreignKeyViolations = client.prepare('PRAGMA foreign_key_check').all()

  return {
    foreignKeysValid: foreignKeyViolations.length === 0,
    quickCheck: typeof quickCheck === 'string' ? quickCheck : 'unknown',
  }
}

export async function openDatabase(
  options: OpenDatabaseOptions,
): Promise<DatabaseConnection> {
  const databasePath = path.resolve(options.databasePath)
  const exists = await pathExists(databasePath)

  if (exists) {
    identifyExistingDatabase(databasePath)
  } else {
    await mkdir(path.dirname(databasePath), { recursive: true })
  }

  const client = new DatabaseSync(databasePath, { timeout: 5_000 })

  try {
    configureConnection(client)
    const db = createOrm(client)
    migrate(db, {
      migrationsFolder: options.migrationsFolder ?? defaultMigrationsFolder,
    })

    const integrity = verifyIntegrity(client)

    if (integrity.quickCheck !== 'ok' || !integrity.foreignKeysValid) {
      throw new Error(
        `Database integrity verification failed for "${databasePath}".`,
      )
    }

    return {
      client,
      databasePath,
      db,
      close: () => {
        client.close()
      },
      verifyIntegrity: () => verifyIntegrity(client),
    }
  } catch (error) {
    client.close()
    throw error
  }
}

export function inspectDatabaseIdentity(databasePath: string): void {
  identifyExistingDatabase(path.resolve(databasePath))
}
