import { createRequire } from 'node:module'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig, loadEnv } from 'vite'

const require = createRequire(import.meta.url)

// The Vite plugin shells out through @sentry/cli 2.x, which skips artifact
// bundles unless the server also advertises release file uploads. Errclue only
// implements artifact bundles, and sentry-cli 3 uploads those directly.
function useSentryCli3(): void {
  if (process.env.SENTRY_BINARY_PATH) return
  const cli = require('@sentry/cli') as { SentryCli: { getPath: () => string } }
  process.env.SENTRY_BINARY_PATH = cli.SentryCli.getPath()
}

// Same value as Sentry.init({ release }) in src/instrument.ts.
const sentryRelease = 'vite-react-typescript-starter@0.0.0'

// Local errclue is plain HTTP. A shell HTTP proxy must not intercept the upload.
function allowLocalSentryUpload(): void {
  const hosts = ['localhost', '127.0.0.1', '::1']
  for (const key of ['NO_PROXY', 'no_proxy'] as const) {
    const current = (process.env[key] ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    process.env[key] = [...new Set([...current, ...hosts])].join(',')
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  allowLocalSentryUpload()
  useSentryCli3()
  const env = loadEnv(mode, process.cwd(), '')
  const authToken = env.SENTRY_AUTH_TOKEN
  if (command === 'build' && !authToken) {
    throw new Error(
      'SENTRY_AUTH_TOKEN is missing. Add it to .env.local so production builds can upload source maps.',
    )
  }

  return {
    build: {
      sourcemap: 'hidden',
    },
    plugins: [
      react(),
      sentryVitePlugin({
        url: env.SENTRY_URL || 'http://localhost:3001',
        org: env.SENTRY_ORG || 'aa',
        project: env.SENTRY_PROJECT || 'test',
        authToken,
        telemetry: false,
        errorHandler(error) {
          throw error
        },
        release: {
          name: sentryRelease,
          // Errclue accepts artifact bundles. It does not implement the Releases API.
          create: false,
          finalize: false,
          setCommits: false,
        },
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
    ],
  }
})
