// Public build configuration only. An empty WS override follows the page's
// scheme/host, so HTTPS automatically uses WSS through the same gateway.
export const API_BASE = import.meta.env.VITE_BACKEND_HTTP_URL || '/api/ai'
export const AUTH_API_BASE = import.meta.env.VITE_AUTH_BACKEND_HTTP_URL || '/api/auth'
const defaultWs = window.location.hostname === 'duallibrasai.vercel.app'
  ? 'wss://duallibras-ai.onrender.com/api/ai/ws'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ai/ws`
const configuredWs = new URL(import.meta.env.VITE_BACKEND_WS_URL || defaultWs)
// Compatibility with the old Render deployment before the unified gateway.
if (configuredWs.hostname === 'duallibras-ai.onrender.com' && configuredWs.pathname === '/ws') {
  configuredWs.pathname = '/api/ai/ws'
}
export const WS_URL = configuredWs.toString()
