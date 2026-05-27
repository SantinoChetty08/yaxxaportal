/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YAXXA_API_BASE_URL?: string;
  readonly VITE_YAXXA_API_TOKEN?: string;
  readonly VITE_YAXXA_API_TENANT_IDS?: string;
  readonly VITE_PORTAL_DATA_SOURCE?: "mock" | "bridge";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
