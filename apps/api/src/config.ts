export type RuntimeEnvironment = 'development' | 'test' | 'production'

export interface AppConfig {
  databasePath: string
  host: string
  nodeEnv: RuntimeEnvironment
  port: number
}

const runtimeEnvironments = new Set<RuntimeEnvironment>([
  'development',
  'test',
  'production',
])

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const nodeEnv = environment.NODE_ENV ?? 'development'

  if (!runtimeEnvironments.has(nodeEnv as RuntimeEnvironment)) {
    throw new Error(
      `NODE_ENV must be development, test, or production; received "${nodeEnv}"`,
    )
  }

  const configuredHost = environment.HOST?.trim()

  if (configuredHost === '') {
    throw new Error('HOST must not be empty when provided')
  }

  const host = configuredHost ?? '127.0.0.1'
  const configuredDatabasePath = environment.DATABASE_PATH?.trim()

  if (configuredDatabasePath === '') {
    throw new Error('DATABASE_PATH must not be empty when provided')
  }

  const databasePath = configuredDatabasePath ?? './data/pr0gbarz.sqlite'
  const rawPort = environment.PORT ?? '8080'
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `PORT must be a whole number from 1 through 65535; received "${rawPort}"`,
    )
  }

  return {
    databasePath,
    host,
    nodeEnv: nodeEnv as RuntimeEnvironment,
    port,
  }
}
