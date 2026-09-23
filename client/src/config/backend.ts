// Public build configuration only. An empty WS override follows the page's
// scheme/host, so HTTPS automatically uses WSS through the same gateway.
export const API_BASE = import.meta.env.VITE_BACKEND_HTTP_URL || '/api/ai'
export const AUTH_API_BASE = import.meta.env.VITE_AUTH_BACKEND_HTTP_URL || '/api/auth'
export const WS_URL = import.meta.env.VITE_BACKEND_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ai/ws`
