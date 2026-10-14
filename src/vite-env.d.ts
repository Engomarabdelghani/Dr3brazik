/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Node API, e.g. https://api.dr3brazik.com/api. Defaults to /api. */
  readonly VITE_API_BASE_URL?: string;
  /** development | staging | production */
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
