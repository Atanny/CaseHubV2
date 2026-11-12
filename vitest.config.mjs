import { defineConfig } from 'vitest/config'
import path from 'node:path'

const r = (p) => path.resolve(import.meta.dirname, p)

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: [
      { find: /^@server\//, replacement: r('server') + '/' },
      { find: /^@\//, replacement: r('src') + '/' },
      { find: 'next/dynamic', replacement: r('tests/shims/dynamic.js') },
    ],
  },
  test: {
    environment: 'node',
    // Default is plain node; tests needing a DOM declare `// @vitest-environment jsdom` at the top.
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
