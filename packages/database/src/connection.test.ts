import { sql } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { openDatabase, type DatabaseConnection } from './connection.js'
import { DatabaseIdentityError } from './errors.js'
import { createRepositories } from './repositories.js'
import { projects } from './schema.js'

const connections: DatabaseConnection[] = []
const temporaryDirectories: string[] = []

afterEach(async () => {
  for (const connection of connections.splice(0)) {
    connection.close()
  }

  const { rm } = await import('node:fs/promises')
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

async function temporaryDatabasePath(
  name = 'pr0gbarz.sqlite',
): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'pr0gbarz-database-'))
  temporaryDirectories.push(directory)
  return path.join(directory, name)
}

async function expectRejectionWithoutModification(
  databasePath: string,
  code:
    | 'DATABASE_LEGACY'
    | 'DATABASE_MALFORMED'
    | 'DATABASE_UNKNOWN'
    | 'DATABASE_VERSION_UNSUPPORTED',
): Promise<void> {
  const before = await readFile(databasePath)

  await expect(openDatabase({ databasePath })).rejects.toMatchObject({
    code,
  } satisfies Partial<DatabaseIdentityError>)

  expect(await readFile(databasePath)).toEqual(before)
}

describe('openDatabase', () => {
  it('creates and identifies a fresh v2 database', async () => {
    const databasePath = await temporaryDatabasePath()
    const connection = await openDatabase({ databasePath })
    connections.push(connection)

    const identity = connection.client
      .prepare(
        'SELECT product, major_version AS majorVersion FROM app_metadata WHERE id = 1',
      )
      .get()
    const tables = connection.client
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => row.name)

    expect(identity).toEqual({ majorVersion: 2, product: 'pr0gbarz' })
    expect(tables).toEqual([
      '__drizzle_migrations',
      'app_metadata',
      'progress_events',
      'projects',
      'tags',
      'task_tags',
      'tasks',
    ])
    expect(connection.verifyIntegrity()).toEqual({
      foreignKeysValid: true,
      quickCheck: 'ok',
    })
  })

  it('reopens a v2 database without applying the migration twice', async () => {
    const databasePath = await temporaryDatabasePath()
    const firstConnection = await openDatabase({ databasePath })
    firstConnection.close()

    const secondConnection = await openDatabase({ databasePath })
    connections.push(secondConnection)

    const migrationCount = secondConnection.client
      .prepare('SELECT count(*) AS count FROM __drizzle_migrations')
      .get()?.count
    const metadataCount = secondConnection.client
      .prepare('SELECT count(*) AS count FROM app_metadata')
      .get()?.count

    expect(migrationCount).toBe(1)
    expect(metadataCount).toBe(1)
  })

  it('enforces names, progress, status, and foreign keys in SQLite', async () => {
    const databasePath = await temporaryDatabasePath()
    const connection = await openDatabase({ databasePath })
    connections.push(connection)

    expect(() => {
      connection.client.exec("INSERT INTO projects (name) VALUES ('   ')")
    }).toThrow(/constraint/i)
    expect(() => {
      connection.client.exec(
        "INSERT INTO tasks (project_id, name, progress) VALUES (999, 'Orphan', 10)",
      )
    }).toThrow(/foreign key/i)

    connection.client.exec("INSERT INTO projects (name) VALUES ('Launch')")

    expect(() => {
      connection.client.exec(
        "INSERT INTO tasks (project_id, name, progress) VALUES (1, 'Invalid', 101)",
      )
    }).toThrow(/constraint/i)
    expect(() => {
      connection.client.exec(
        "INSERT INTO tasks (project_id, name, status) VALUES (1, 'Invalid', 'unknown')",
      )
    }).toThrow(/constraint/i)
    expect(() => {
      connection.client.exec(
        "INSERT INTO tasks (project_id, name, due_date) VALUES (1, 'Invalid', '04/08/2026')",
      )
    }).toThrow(/constraint/i)
    expect(() => {
      connection.client.exec(
        "INSERT INTO tasks (project_id, name, status, progress) VALUES (1, 'Incomplete', 'completed', 99)",
      )
    }).toThrow(/constraint/i)
  })

  it('provides typed repository boundaries for core records', async () => {
    const databasePath = await temporaryDatabasePath()
    const connection = await openDatabase({ databasePath })
    connections.push(connection)
    const repositories = createRepositories(connection.db)

    const project = repositories.projects.create({ name: 'Launch' })
    const task = repositories.tasks.create({
      name: 'Ship release',
      projectId: project.id,
    })
    const tag = repositories.tags.create({
      label: 'Backend',
      normalizedName: 'backend',
    })

    expect(repositories.projects.findById(project.id)).toEqual(project)
    expect(repositories.tasks.findById(task.id)).toEqual(task)
    expect(repositories.tags.findByNormalizedName('backend')).toEqual(tag)
  })

  it('rolls back failed multi-write transactions', async () => {
    const databasePath = await temporaryDatabasePath()
    const connection = await openDatabase({ databasePath })
    connections.push(connection)

    expect(() =>
      connection.db.transaction((transaction) => {
        transaction.insert(projects).values({ name: 'Rolled back' }).run()
        throw new Error('Injected transaction failure')
      }),
    ).toThrow('Injected transaction failure')

    const result = connection.db.get<{ count: number }>(
      sql`SELECT count(*) AS count FROM projects`,
    )
    expect(result.count).toBe(0)
  })

  it('rolls back every statement in a failed migration', async () => {
    const databasePath = await temporaryDatabasePath()
    const migrationsFolder = path.join(
      path.dirname(databasePath),
      'broken-migrations',
    )
    const migrationDirectory = path.join(
      migrationsFolder,
      '20260804000000_broken_migration',
    )
    await mkdir(migrationDirectory, { recursive: true })
    await writeFile(
      path.join(migrationDirectory, 'migration.sql'),
      'CREATE TABLE should_roll_back (id INTEGER);--> statement-breakpoint\nTHIS IS NOT SQL;',
      'utf8',
    )

    await expect(
      openDatabase({ databasePath, migrationsFolder }),
    ).rejects.toThrow()

    const client = new DatabaseSync(databasePath, { readOnly: true })
    const rolledBackTable = client
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'should_roll_back'",
      )
      .get()
    const migrationCount = client
      .prepare('SELECT count(*) AS count FROM __drizzle_migrations')
      .get()?.count
    client.close()

    expect(rolledBackTable).toBeUndefined()
    expect(migrationCount).toBe(0)
  })

  it('rejects a v1 database without modifying it', async () => {
    const databasePath = await temporaryDatabasePath('legacy.sqlite')
    const legacy = new DatabaseSync(databasePath)
    legacy.exec('CREATE TABLE pgbz_project (id INTEGER PRIMARY KEY)')
    legacy.close()

    await expectRejectionWithoutModification(databasePath, 'DATABASE_LEGACY')
  })

  it('rejects an arbitrary SQLite database without modifying it', async () => {
    const databasePath = await temporaryDatabasePath('unknown.sqlite')
    const unknown = new DatabaseSync(databasePath)
    unknown.exec('CREATE TABLE unrelated (id INTEGER PRIMARY KEY)')
    unknown.close()

    await expectRejectionWithoutModification(databasePath, 'DATABASE_UNKNOWN')
  })

  it('rejects an unsupported pr0gbarz major version without modifying it', async () => {
    const databasePath = await temporaryDatabasePath('future.sqlite')
    const future = new DatabaseSync(databasePath)
    future.exec(`
      CREATE TABLE app_metadata (
        id INTEGER PRIMARY KEY,
        product TEXT NOT NULL,
        major_version INTEGER NOT NULL
      );
      INSERT INTO app_metadata (id, product, major_version)
      VALUES (1, 'pr0gbarz', 3);
    `)
    future.close()

    await expectRejectionWithoutModification(
      databasePath,
      'DATABASE_VERSION_UNSUPPORTED',
    )
  })

  it('rejects an existing empty file without modifying it', async () => {
    const databasePath = await temporaryDatabasePath('empty.sqlite')
    await writeFile(databasePath, '')

    await expectRejectionWithoutModification(databasePath, 'DATABASE_UNKNOWN')
  })

  it('rejects a malformed file without modifying it', async () => {
    const databasePath = await temporaryDatabasePath('malformed.sqlite')
    await writeFile(databasePath, 'this is not sqlite', 'utf8')

    await expectRejectionWithoutModification(databasePath, 'DATABASE_MALFORMED')
  })
})
