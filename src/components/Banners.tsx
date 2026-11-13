import { AlertCircle, BellOff, CloudOff, RotateCcw, WifiOff } from 'lucide-react'
import { MESSAGES, PREVIEW_STATES } from '../lib/constants'
import type { PreviewState } from '../lib/types'
import { cn, formatTime } from '../lib/utils'

interface PreviewBarProps {
  value: PreviewState
  onChange: (state: PreviewState) => void
}

/**
 * Reviewers can force each app state without waiting for real network or
 * permission failures. Clicking the active state returns to live data.
 */
export function PreviewBar({ value, onChange }: PreviewBarProps) {
  return (
    <section className="mt-10 flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-card px-5 py-4 shadow-card">
      <span className="mr-1.5 text-sm text-muted">Preview states:</span>

      {PREVIEW_STATES.map((state) => {
        const active = value === state.id

        return (
          <button
            key={state.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? 'live' : state.id)}
            className={cn(
              'min-h-11 rounded-lg border px-3.5 text-xs font-medium transition-colors lg:min-h-9',
              active
                ? 'border-ink bg-ink text-page'
                : 'border-line bg-card hover:bg-panel',
            )}
          >
            {state.label}
          </button>
        )
      })}

      {value !== 'live' && (
        <button
          type="button"
          onClick={() => onChange('live')}
          className="ml-auto flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:text-ink lg:min-h-9"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Back to live
        </button>
      )}
    </section>
  )
}

export function OfflineBanner({ updatedAt }: { updatedAt?: number }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-card border border-sun/40 bg-sun/10 px-4 py-3"
    >
      <WifiOff size={18} className="mt-0.5 shrink-0 text-sun" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{MESSAGES.offlineBanner}</p>
        {updatedAt && (
          <p className="mt-0.5 text-xs text-muted">Last updated {formatTime(updatedAt)}</p>
        )}
      </div>
    </div>
  )
}

export function NotificationBlockedBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-card border border-danger/30 bg-danger/10 px-4 py-3"
    >
      <BellOff size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      <p className="text-sm">{MESSAGES.notificationsBlocked}</p>
    </div>
  )
}

export function NoticeBanner({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-card border border-danger/30 bg-danger/10 px-4 py-3"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function FetchError({
  message = MESSAGES.network,
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <section
      role="alert"
      className="rounded-card border border-line bg-card px-6 py-16 text-center shadow-card"
    >
      <CloudOff size={36} className="mx-auto text-muted" aria-hidden="true" />
      <h2 className="mt-4 font-display text-3xl">Could not load the weather</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 min-h-11 rounded-lg bg-ink px-5 text-sm font-medium text-page"
      >
        Try again
      </button>
    </section>
  )
}

/** Grey placeholders keep the page height stable while data loads. */
export function WeatherSkeleton() {
  return (
    <div role="status" aria-busy="true" className="animate-pulse">
      <span className="sr-only">Loading weather</span>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="h-4 w-24 rounded bg-line" />
          <div className="mt-3 h-16 w-56 rounded-lg bg-line" />
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <div className="h-32 w-48 rounded-xl bg-line sm:w-56" />
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-line" />
            <div className="h-4 w-20 rounded bg-line" />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card px-5 py-4">
            <div className="h-3 w-16 rounded bg-line" />
            <div className="mt-2 h-7 w-20 rounded bg-line" />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="h-8 w-40 rounded bg-line" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 py-2">
              <div className="h-3 w-12 rounded bg-line" />
              <div className="size-5 rounded-full bg-line" />
              <div className="h-3 w-28 rounded bg-line" />
              <div className="h-2 flex-1 rounded-full bg-line" />
              <div className="h-3 w-8 rounded bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
