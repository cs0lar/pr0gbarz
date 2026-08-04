// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { Button, Dialog, EmptyState, Progress } from './index.js'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  })
})

describe('UI primitives', () => {
  it('exposes progress to assistive technology', () => {
    render(<Progress label="Launch progress" value={58.6} />)
    expect(
      screen.getByRole('progressbar', { name: 'Launch progress' }),
    ).toHaveAttribute('aria-valuenow', '59')
  })

  it('renders an actionable empty state', async () => {
    const user = userEvent.setup()
    const action = vi.fn()
    render(
      <EmptyState
        action={<Button onClick={action}>Create one</Button>}
        description="Start with a meaningful outcome."
        title="No projects"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Create one' }))
    expect(action).toHaveBeenCalledOnce()
  })

  it('labels and dismisses a modal dialog', async () => {
    const user = userEvent.setup()
    const close = vi.fn()
    render(
      <Dialog onClose={close} open title="Confirm archive">
        <p>Restore this project at any time.</p>
      </Dialog>,
    )

    expect(
      screen.getByRole('dialog', { name: 'Confirm archive' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(close).toHaveBeenCalled()
  })
})
