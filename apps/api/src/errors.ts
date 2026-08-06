export type AppErrorCode =
  | 'CONFLICT'
  | 'INVALID_IMPORT'
  | 'INVALID_STATE'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION_ERROR'

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly fieldErrors: Record<string, string[]> | undefined
  readonly statusCode: number

  constructor(
    statusCode: number,
    code: AppErrorCode,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
  }
}

export function notFound(resource: string): AppError {
  return new AppError(404, 'NOT_FOUND', `${resource} was not found.`)
}

export function conflict(message: string): AppError {
  return new AppError(409, 'CONFLICT', message)
}

export function invalidState(message: string): AppError {
  return new AppError(409, 'INVALID_STATE', message)
}

export function invalidImport(message: string): AppError {
  return new AppError(400, 'INVALID_IMPORT', message)
}
