import { rm } from 'node:fs/promises'
import path from 'node:path'

import { inspectDatabaseIdentity } from './connection.js'

const confirmation = '--confirm=DELETE_V2_DATABASE'
const databaseArgument = process.argv.find((argument) =>
  argument.startsWith('--database='),
)

if (process.env.NODE_ENV === 'production') {
  throw new Error('The development reset command cannot run in production.')
}

if (!databaseArgument || !process.argv.includes(confirmation)) {
  throw new Error(
    'Usage: npm run db:reset:dev --workspace @pr0gbarz/database -- --database=/absolute/path/to/pr0gbarz.sqlite --confirm=DELETE_V2_DATABASE',
  )
}

const databasePath = path.resolve(databaseArgument.slice('--database='.length))

inspectDatabaseIdentity(databasePath)

for (const target of [
  databasePath,
  `${databasePath}-shm`,
  `${databasePath}-wal`,
]) {
  await rm(target, { force: true })
}

console.log(
  `Removed the confirmed disposable pr0gbarz v2 database: ${databasePath}`,
)
