import { Type, type Static } from 'typebox'

import { ColorSchema } from './common.js'
import { TagSchema } from './tasks.js'

export const CreateTagSchema = Type.Object(
  {
    color: Type.Optional(ColorSchema),
    label: Type.String({ maxLength: 60, minLength: 1, pattern: '\\S' }),
  },
  { additionalProperties: false },
)

export const TagListQuerySchema = Type.Object(
  {
    limit: Type.Optional(
      Type.Integer({ default: 100, maximum: 200, minimum: 1 }),
    ),
    search: Type.Optional(Type.String({ maxLength: 60 })),
  },
  { additionalProperties: false },
)

export const TagListSchema = Type.Object(
  {
    items: Type.Array(TagSchema),
  },
  { additionalProperties: false },
)

export type CreateTag = Static<typeof CreateTagSchema>
export type TagListQuery = Static<typeof TagListQuerySchema>
export type TagListResponse = Static<typeof TagListSchema>
