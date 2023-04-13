import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: 'vitest.setup.js',
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**/*']
  },
})

