import 'dotenv/config'

import { openDatabase } from '@pr0gbarz/database'

import { buildApp } from './app.js'
import { loadConfig } from './config.js'

async function start(): Promise<void> {
  const config = loadConfig()
  const database = await openDatabase({ databasePath: config.databasePath })
  const app = await buildApp({ database, logger: true })

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    app.log.info({ signal }, 'Shutting down')
    await app.close()
    process.exitCode = 0
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ host: config.host, port: config.port })
  } catch (error) {
    app.log.error(error)
    await app.close()
    process.exitCode = 1
  }
}

void start()
