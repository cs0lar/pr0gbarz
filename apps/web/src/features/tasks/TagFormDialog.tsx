import { Button, Dialog } from '@pr0gbarz/ui'
import { type SyntheticEvent, useId } from 'react'

import { ApiError } from '../../api/client.js'
import { useCreateTag } from './queries.js'

export function TagFormDialog({
  onClose,
  onSaved,
  open,
}: {
  onClose: () => void
  onSaved: (id: number) => void
  open: boolean
}) {
  const prefix = useId()
  const create = useCreateTag()

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const labelEntry = data.get('label')
    const colorEntry = data.get('color')
    const label = typeof labelEntry === 'string' ? labelEntry.trim() : ''
    const color = typeof colorEntry === 'string' ? colorEntry.trim() : ''
    try {
      const tag = await create.mutateAsync({ color: color || null, label })
      onSaved(tag.id)
    } catch {
      // The mutation error is presented below.
    }
  }

  return (
    <Dialog
      description="Tags can be reused across every project."
      onClose={onClose}
      open={open}
      title="Create a tag"
    >
      <form
        className="tag-form"
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <label htmlFor={`${prefix}-label`}>Label</label>
        <input
          autoFocus
          id={`${prefix}-label`}
          maxLength={60}
          name="label"
          required
        />
        <label htmlFor={`${prefix}-color`}>Colour</label>
        <input
          defaultValue="#5b45d6"
          id={`${prefix}-color`}
          name="color"
          type="color"
        />
        {create.error ? (
          <p className="form-error" role="alert">
            {create.error instanceof ApiError
              ? create.error.message
              : 'The tag could not be created.'}
          </p>
        ) : null}
        <div className="dialog-actions">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={create.isPending} type="submit">
            {create.isPending ? 'Creating…' : 'Create tag'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
