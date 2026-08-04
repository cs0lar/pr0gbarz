import { createContext, useContext } from 'react'

export interface ToastInput {
  action?: { label: string; onClick: () => void }
  message: string
  tone?: 'neutral' | 'positive'
}

export const ToastContext = createContext<
  ((toast: ToastInput) => void) | undefined
>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider.')
  return context
}
