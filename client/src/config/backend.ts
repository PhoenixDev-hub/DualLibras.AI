export const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST ?? 'localhost'
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT ?? '5455'
export const API_BASE =
  import.meta.env.VITE_BACKEND_HTTP_URL ?? `http://${BACKEND_HOST}:${BACKEND_PORT}`
export const AUTH_API_BASE =
  import.meta.env.VITE_AUTH_BACKEND_HTTP_URL ?? 'http://localhost:4000'
export const WS_URL =
  import.meta.env.VITE_BACKEND_WS_URL ?? `ws://${BACKEND_HOST}:${BACKEND_PORT}/ws`
