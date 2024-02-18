import { context } from 'esbuild'

const ctx = await context({
  entryPoints: ['src/extension.ts'],
  outdir: 'out',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  sourcemap: true,
  external: ['vscode'],
  logLevel: 'info',
  mainFields: ['module', 'main']
})

await ctx.watch()
