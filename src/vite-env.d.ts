/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YAXXA_API_BASE_URL?: string;
  readonly VITE_YAXXA_API_TOKEN?: string;
  readonly VITE_YAXXA_API_TENANT_IDS?: string;
  readonly VITE_PORTAL_DATA_SOURCE?: "mock" | "bridge" | "backend";
  readonly VITE_PORTAL_AUTH_MODE?: "mock" | "backend";
  readonly VITE_PORTAL_API_BASE_URL?: string;
  readonly VITE_PORTAL_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
