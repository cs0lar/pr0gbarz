import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from 'react'

function classes(...values: (false | null | string | undefined)[]) {
  return values.filter(Boolean).join(' ')
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'compact' | 'default'
  variant?: 'danger' | 'ghost' | 'primary' | 'secondary'
}

export function Button({
  className,
  size = 'default',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={classes(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        className,
      )}
      type={type}
      {...props}
    />
  )
}

export function IconButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={classes('ui-icon-button', className)}
      size="compact"
      variant="ghost"
      {...props}
    />
  )
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={classes('ui-card', className)} {...props} />
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'danger' | 'neutral' | 'positive' | 'warning'
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={classes('ui-badge', `ui-badge--${tone}`, className)}
      {...props}
    />
  )
}

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: number
}

export function Progress({ className, label, value, ...props }: ProgressProps) {
  const bounded = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={bounded}
      className={classes('ui-progress', className)}
      role="progressbar"
      {...props}
    >
      <span
        className="ui-progress__fill"
        style={{ width: `${String(bounded)}%` }}
      />
    </div>
  )
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function Skeleton({ className, lines = 3, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={classes('ui-skeleton', className)}
      {...props}
    >
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  action?: ReactNode
  description: string
  icon?: ReactNode
  title: string
}

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div className={classes('ui-empty-state', className)} {...props}>
      {icon ? (
        <div className="ui-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </div>
  )
}

export interface DialogProps {
  children: ReactNode
  description?: string
  onClose: () => void
  open: boolean
  title: string
}

export function Dialog({
  children,
  description,
  onClose,
  open,
  title,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      aria-describedby={description ? 'ui-dialog-description' : undefined}
      aria-labelledby="ui-dialog-title"
      className="ui-dialog"
      onCancel={onClose}
      onClose={onClose}
      ref={ref}
    >
      <div className="ui-dialog__heading">
        <div>
          <h2 id="ui-dialog-title">{title}</h2>
          {description ? <p id="ui-dialog-description">{description}</p> : null}
        </div>
        <IconButton aria-label="Close dialog" onClick={onClose}>
          <span aria-hidden="true">×</span>
        </IconButton>
      </div>
      {children}
    </dialog>
  )
}

export function VisuallyHidden({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={classes('ui-visually-hidden', className)} {...props} />
  )
}
