export type DatabaseIdentityErrorCode =
  | 'DATABASE_LEGACY'
  | 'DATABASE_MALFORMED'
  | 'DATABASE_UNKNOWN'
  | 'DATABASE_VERSION_UNSUPPORTED'

export class DatabaseIdentityError extends Error {
  readonly code: DatabaseIdentityErrorCode
  readonly databasePath: string

  constructor(
    code: DatabaseIdentityErrorCode,
    databasePath: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'DatabaseIdentityError'
    this.code = code
    this.databasePath = databasePath
  }
}
