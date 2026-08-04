import { Button, IconButton } from '@pr0gbarz/ui'
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import { ToastContext, type ToastInput } from './toast-context.js'

interface Toast extends ToastInput {
  id: number
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const nextId = useRef(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])
  const notify = useCallback((input: ToastInput) => {
    nextId.current += 1
    const id = nextId.current
    setToasts((current) => [...current.slice(-2), { ...input, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 5_000)
  }, [])
  const value = useMemo(() => notify, [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="toast-region"
        aria-label="Notifications"
        aria-live="polite"
        role="region"
      >
        {toasts.map((toast) => (
          <div
            className={`toast toast--${toast.tone ?? 'neutral'}`}
            key={toast.id}
          >
            <span>{toast.message}</span>
            {toast.action ? (
              <Button
                onClick={() => {
                  toast.action?.onClick()
                  dismiss(toast.id)
                }}
                size="compact"
                variant="ghost"
              >
                {toast.action.label}
              </Button>
            ) : null}
            <IconButton
              aria-label="Dismiss notification"
              onClick={() => {
                dismiss(toast.id)
              }}
            >
              <span aria-hidden="true">×</span>
            </IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
