import { Search } from 'lucide-react'

export function SearchBar() {
  return (
    <div className="relative w-full max-w-[520px]">
      <label htmlFor="city-search" className="sr-only">
        Search a city
      </label>
      <Search
        size={18}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id="city-search"
        type="text"
        placeholder="Search a city"
        autoComplete="off"
        spellCheck={false}
        className="h-12 w-full rounded-xl border border-line bg-card pr-20 pl-11 text-sm shadow-card outline-none placeholder:text-muted focus:border-brand/50"
      />
      <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-medium text-muted">
        Enter
      </span>
    </div>
  )
}
