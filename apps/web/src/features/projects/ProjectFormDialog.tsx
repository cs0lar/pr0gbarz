import type { CreateProject, ProjectResponse } from '@pr0gbarz/contracts'
import { Button, Dialog } from '@pr0gbarz/ui'
import { type CSSProperties, type SyntheticEvent, useId } from 'react'

import { ApiError } from '../../api/client.js'
import { useCreateProject, useUpdateProject } from './queries.js'

const accents = ['#5b45d6', '#147b58', '#b45309', '#b42332', '#2563a8']

export interface ProjectFormDialogProps {
  onClose: () => void
  onSaved: (project: ProjectResponse) => void
  open: boolean
  project?: ProjectResponse | undefined
}

function optionalText(data: FormData, key: string): string | null {
  const entry = data.get(key)
  const value = typeof entry === 'string' ? entry.trim() : ''
  return value === '' ? null : value
}

export function ProjectFormDialog({
  onClose,
  onSaved,
  open,
  project,
}: ProjectFormDialogProps) {
  const create = useCreateProject()
  const update = useUpdateProject()
  const prefix = useId()
  const pending = create.isPending || update.isPending
  const error = create.error ?? update.error

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input: CreateProject = {
      accentColor: optionalText(data, 'accentColor'),
      description: optionalText(data, 'description'),
      name: optionalText(data, 'name') ?? '',
      startDate: optionalText(data, 'startDate'),
      targetDate: optionalText(data, 'targetDate'),
    }

    try {
      const saved = project
        ? await update.mutateAsync({ id: project.id, input })
        : await create.mutateAsync(input)
      onSaved(saved)
    } catch {
      // The mutation exposes the actionable API error in the form below.
    }
  }

  return (
    <Dialog
      description={
        project
          ? 'Update the project details used throughout your workspace.'
          : 'Start with a clear outcome. Tasks can be added in the next workspace phase.'
      }
      onClose={onClose}
      open={open}
      title={project ? 'Edit project' : 'Create a project'}
    >
      <form
        className="project-form"
        onSubmit={(event) => {
          void submit(event)
        }}
      >
        <label htmlFor={`${prefix}-name`}>
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          autoFocus
          defaultValue={project?.name ?? ''}
          id={`${prefix}-name`}
          maxLength={120}
          name="name"
          required
        />

        <label htmlFor={`${prefix}-description`}>Description</label>
        <textarea
          defaultValue={project?.description ?? ''}
          id={`${prefix}-description`}
          maxLength={5_000}
          name="description"
          rows={4}
        />

        <fieldset>
          <legend>Accent colour</legend>
          <div className="accent-options">
            {accents.map((accent) => (
              <label
                key={accent}
                style={{ '--accent-choice': accent } as CSSProperties}
              >
                <input
                  defaultChecked={project?.accentColor === accent}
                  name="accentColor"
                  type="radio"
                  value={accent}
                />
                <span aria-hidden="true" />
                <span className="ui-visually-hidden">{accent}</span>
              </label>
            ))}
            <label className="accent-none">
              <input
                defaultChecked={!project?.accentColor}
                name="accentColor"
                type="radio"
                value=""
              />
              None
            </label>
          </div>
        </fieldset>

        <div className="form-columns">
          <div>
            <label htmlFor={`${prefix}-start`}>Start date</label>
            <input
              defaultValue={project?.startDate ?? ''}
              id={`${prefix}-start`}
              name="startDate"
              type="date"
            />
          </div>
          <div>
            <label htmlFor={`${prefix}-target`}>Target date</label>
            <input
              defaultValue={project?.targetDate ?? ''}
              id={`${prefix}-target`}
              min={project?.startDate ?? undefined}
              name="targetDate"
              type="date"
            />
          </div>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error instanceof ApiError
              ? error.message
              : 'The project could not be saved. Try again.'}
          </p>
        ) : null}

        <div className="dialog-actions">
          <Button disabled={pending} onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? 'Saving…' : project ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
