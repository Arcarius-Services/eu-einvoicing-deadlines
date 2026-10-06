import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

// GitHub Pages project site. Both values move when Odysseus gives us the brand
// and a domain; nothing else in the codebase hardcodes a URL.
const SITE = process.env.SITE_URL ?? 'https://arcarius-services.github.io'
const BASE = process.env.SITE_BASE ?? '/eu-einvoicing-deadlines'

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
  build: { format: 'directory' },
})
