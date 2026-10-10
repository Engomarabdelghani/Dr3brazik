/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Node API, e.g. https://api.dr3brazik.com/api. Defaults to /api. */
  readonly VITE_API_BASE_URL?: string;
  /** development | staging | production */
  readonly VITE_APP_ENV?: string;
  /** Shows maintenance mode on storefront routes only when set to "true". */
  readonly VITE_MAINTENANCE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
