import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AlertCircle, Loader2, MapPin, Search, SearchX, X } from 'lucide-react'
import { isCanceled, searchCities } from '../lib/api'
import { MESSAGES, SEARCH_DEBOUNCE_MS } from '../lib/constants'
import type { ApiError, City } from '../lib/types'
import { cn } from '../lib/utils'

interface SearchBarProps {
  onSelect: (city: City) => void
}

type SearchStatus = 'idle' | 'loading' | 'done' | 'error'

export function SearchBar({ onSelect }: SearchBarProps) {
  /* The combobox owns its own state; App only receives the chosen city. */
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [error, setError] = useState('')
  const [validation, setValidation] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /*
   * Wait for a pause in typing, then search. The cleanup cancels both the
   * timer and any in-flight request, so fast typing can never show stale
   * suggestions out of order.
   */
  useEffect(() => {
    const label = selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : ''
    if (selectedCity && query === label) return

    const term = query.trim()
    if (term.length < 2) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(term, controller.signal)
        setSuggestions(results)
        setStatus('done')
        setActiveIndex(-1)
      } catch (caught) {
        if (isCanceled(caught)) return
        setSuggestions([])
        setStatus('error')
        setError((caught as ApiError).message || MESSAGES.server)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, selectedCity])

  function selectCity(city: City) {
    setSelectedCity(city)
    setQuery(`${city.name}, ${city.country}`)
    setSuggestions([])
    setStatus('idle')
    setError('')
    setValidation('')
    setIsOpen(false)
    onSelect(city)
  }

  /* Clearing keeps focus in the field so the user can type a new city. */
  function clearSearch() {
    setQuery('')
    setSelectedCity(null)
    setSuggestions([])
    setStatus('idle')
    setError('')
    setValidation('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  function validateBlur() {
    const term = query.trim()

    /* Blur mirrors submit so the message appears before the user presses Enter. */
    if (!term) return setValidation(MESSAGES.emptyCity)
    if (selectedCity) return setValidation('')
    if (status === 'loading') return setValidation(MESSAGES.selectCity)
    if (status === 'error') return setValidation(error)
    if (status === 'done' && suggestions.length === 0) return setValidation(MESSAGES.noResults)
    setValidation(MESSAGES.selectCity)
  }

  function handleSubmit() {
    const term = query.trim()

    if (!term) return setValidation(MESSAGES.emptyCity)
    if (selectedCity) return onSelect(selectedCity)
    if (status === 'loading') return
    if (status === 'error') return setValidation(error)
    if (suggestions.length === 1) return selectCity(suggestions[0])
    if (status === 'done' && suggestions.length === 0) {
      setIsOpen(true)
      return setValidation(MESSAGES.noResults)
    }

    setIsOpen(true)
    setValidation(MESSAGES.selectCity)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    /* Arrow keys move through results; Enter picks the active one. */
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (isOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
        selectCity(suggestions[activeIndex])
      } else {
        handleSubmit()
      }
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const term = query.trim()
  /* Results stay open until a city is picked or Escape closes the list. */
  const showDropdown = isOpen && term.length > 0

  return (
    <div className="w-full max-w-[520px]">
      <div className="relative">
        <label htmlFor="city-search" className="sr-only">
          Search a city
        </label>
        {/* Combobox ARIA keeps screen readers in sync with the visual list. */}
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="city-search"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="city-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(validation)}
          aria-describedby={validation ? 'city-search-error' : undefined}
          placeholder="Search a city"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            const value = event.target.value
            setQuery(value)
            setSelectedCity(null)
            setValidation('')
            setIsOpen(true)
            setSuggestions([])

            if (value.trim().length >= 2) {
              setStatus('loading')
              setError('')
            } else {
              setStatus('idle')
              setError('')
            }
          }}
          onFocus={() => {
            setIsOpen(true)
            setValidation('')
          }}
          onBlur={() => {
            setIsOpen(false)
            validateBlur()
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-12 w-full rounded-xl border bg-card pr-20 pl-11 text-sm shadow-card outline-none placeholder:text-muted',
            validation ? 'border-danger/60' : 'border-line focus:border-brand/50',
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-medium text-muted">
            Enter
          </span>
        )}

        {showDropdown && (
          <div
            onMouseDown={(event) => event.preventDefault()}
            className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-line bg-card shadow-card"
          >
            {term.length < 2 && (
              <p className="px-3.5 py-3 text-xs text-muted">{MESSAGES.searchHint}</p>
            )}

            {term.length >= 2 && status === 'loading' && (
              <p className="flex items-center gap-2 px-3.5 py-3 text-xs text-muted">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                {MESSAGES.searching}
              </p>
            )}

            {term.length >= 2 && status === 'error' && (
              <p className="flex items-start gap-2 px-3.5 py-3 text-xs text-danger">
                <AlertCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {term.length >= 2 && status === 'done' && suggestions.length === 0 && (
              <p className="flex items-start gap-2 px-3.5 py-3 text-xs text-muted">
                <SearchX size={14} className="mt-px shrink-0" aria-hidden="true" />
                {MESSAGES.noResults}
              </p>
            )}

            {suggestions.length > 0 && (
              <ul
                id="city-suggestions"
                role="listbox"
                aria-label="City suggestions"
                className="max-h-72 overflow-y-auto py-1"
              >
                {suggestions.map((city, index) => (
                  <li key={`${city.id ?? city.name}-${index}`} role="presentation">
                    <button
                      id={`city-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onClick={() => selectCity(city)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 px-3.5 text-left text-sm transition-colors',
                        index === activeIndex ? 'bg-panel' : 'hover:bg-panel',
                      )}
                    >
                      <MapPin size={15} className="shrink-0 text-muted" aria-hidden="true" />
                      <span className="truncate font-medium">{city.name}</span>
                      <span className="ml-auto truncate text-xs text-muted">{city.country}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {validation && (
        <p id="city-search-error" role="alert" className="mt-1.5 pl-1 text-xs text-danger">
          {validation}
        </p>
      )}
    </div>
  )
}
