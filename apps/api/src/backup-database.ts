import 'dotenv/config'

import { inspectDatabaseIdentity } from '@pr0gbarz/database'
import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { backup, DatabaseSync } from 'node:sqlite'

import { loadConfig } from './config.js'

function outputArgument(arguments_: string[]): string {
  const index = arguments_.indexOf('--output')
  const value = index >= 0 ? arguments_[index + 1]?.trim() : undefined
  if (!value) {
    throw new Error('Usage: npm run backup -- --output <new-backup-file>')
  }
  return path.resolve(value)
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function verifyBackup(filePath: string): void {
  inspectDatabaseIdentity(filePath)
  const copy = new DatabaseSync(filePath, { readOnly: true, timeout: 5_000 })
  try {
    const quickCheck = copy.prepare('PRAGMA quick_check').get()?.quick_check
    const foreignKeyViolations = copy.prepare('PRAGMA foreign_key_check').all()
    if (quickCheck !== 'ok' || foreignKeyViolations.length > 0) {
      throw new Error(`Backup integrity verification failed: ${filePath}`)
    }
  } finally {
    copy.close()
  }
}

async function run(): Promise<void> {
  const sourcePath = path.resolve(loadConfig().databasePath)
  const outputPath = outputArgument(process.argv.slice(2))
  if (sourcePath === outputPath) {
    throw new Error('Backup output must be different from DATABASE_PATH.')
  }
  if (await exists(outputPath)) {
    throw new Error(`Backup output already exists: ${outputPath}`)
  }

  inspectDatabaseIdentity(sourcePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  const source = new DatabaseSync(sourcePath, {
    readOnly: true,
    timeout: 5_000,
  })
  try {
    await backup(source, outputPath)
  } finally {
    source.close()
  }

  verifyBackup(outputPath)
  process.stdout.write(`Created verified SQLite backup: ${outputPath}\n`)
}

run().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Database backup failed.'}\n`,
  )
  process.exitCode = 1
})
