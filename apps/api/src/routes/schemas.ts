import { ErrorResponseSchema } from '@pr0gbarz/contracts'

export const errorResponseSchemas = {
  400: ErrorResponseSchema,
  404: ErrorResponseSchema,
  409: ErrorResponseSchema,
  500: ErrorResponseSchema,
}
