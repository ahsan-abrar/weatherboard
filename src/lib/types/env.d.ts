/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_KEY?: string
  readonly VITE_GEODB_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
