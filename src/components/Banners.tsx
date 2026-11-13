import { PREVIEW_STATES } from '../constants'

/**
 * Reviewers can force each app state without waiting for real network or
 * permission failures. The state is wired up in the next step.
 */
export function PreviewBar() {
  return (
    <section className="mt-10 flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-card px-5 py-4 shadow-card">
      <span className="mr-1.5 text-sm text-muted">Preview states:</span>
      {PREVIEW_STATES.map((state) => (
        <button
          key={state.id}
          type="button"
          className="min-h-9 rounded-lg border border-line bg-card px-3.5 text-xs font-medium transition-colors hover:bg-panel"
        >
          {state.label}
        </button>
      ))}
    </section>
  )
}
