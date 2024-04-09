import { defineConfig } from '@liangskyli/openapi-gen-ts'

export default defineConfig({
  genTsDir: './src/schema',
  // openapiPath: './src/data.json'
  openapiPath: new URL('http://127.0.0.1:13126/help')
})
