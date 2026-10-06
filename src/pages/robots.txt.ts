import type { APIRoute } from 'astro'

// Generated, not static: until the site is on its final origin it must not be
// crawled at all, so we never have to migrate search engines off the Pages URL.
// One env var moves it, consistently with the per-page noindex.
export const GET: APIRoute = ({ site }) => {
  const indexable = process.env.SITE_INDEXABLE === 'true'
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site).href

  const body = indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`
    : `# Staging origin — indexing is held until rulefeed.eu is serving.\nUser-agent: *\nDisallow: /\n`

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
