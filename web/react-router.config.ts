import type { Config } from '@react-router/dev/config'

// SPA mode: everything renders in the browser; no server loaders.
export default {
  ssr: false,
} satisfies Config
