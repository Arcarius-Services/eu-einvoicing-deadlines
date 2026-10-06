import type { APIRoute } from 'astro'

// Generated, not static: while the site is on a working title it must not be
// crawled at all. One env var moves it, consistently with the per-page noindex.
export const GET: APIRoute = ({ site }) => {
  const indexable = process.env.SITE_INDEXABLE === 'true'
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site).href

  const body = indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`
    : `# Working title pending brand sign-off — nothing here should be indexed yet.\nUser-agent: *\nDisallow: /\n`

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
