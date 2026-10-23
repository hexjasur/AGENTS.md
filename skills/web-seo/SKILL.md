---
name: web-seo
description: Improve discoverability of public web pages with crawlable architecture, unique titles and descriptions, canonical URLs, internal links, structured data, sitemaps, robots rules, and social previews. Use for public routes, SEO audits, indexing or "not showing in Google" problems, migrations and redirects, JavaScript-rendered sites, and share-card previews.
license: MIT
metadata:
  author: hexjasur
  version: "1.1.0"
---

# Web SEO

Build for people first, then make the same useful structure clear to crawlers. Fix indexing and rendering problems before polishing metadata, and never promise rankings.

## Procedure

```text
- [ ] 1. Inventory public routes and what should (not) be indexed
- [ ] 2. Confirm crawl and render: status, robots, canonical, rendered HTML
- [ ] 3. Titles, descriptions, headings, and content per page
- [ ] 4. Internal links, sitemap, redirects, and international targeting
- [ ] 5. Structured data and social previews that match visible content
- [ ] 6. Validate with real tools and record what was not tested
```

1. List indexable routes, utility pages to exclude, rendering mode (static, SSR, CSR), locales, and the canonical host.
2. Every indexable URL returns `200`, is not blocked by `robots.txt`, has no stray `noindex`, and exposes its main content and links in rendered HTML. Test with URL Inspection or the rendered DOM, not view-source alone.
3. Give each page a unique, accurate `<title>` (clear and concise), a useful meta description, one primary `h1`, and original content that answers the search intent.
4. Link pages with crawlable `<a href>` and descriptive anchor text. Keep an XML sitemap of canonical, indexable URLs with accurate `lastmod`. Use `301` or `308` for permanent moves and avoid redirect chains.
5. Add JSON-LD only for content visible on the page, using a type Google supports, and validate it. Set Open Graph and Twitter Card tags for share previews.
6. Run Lighthouse, Search Console (coverage, enhancements, Core Web Vitals) when available, and a link and redirect crawl.

## Guardrails

- Do not keyword-stuff, hide text, cloak, build doorway pages, or mark up content users cannot see.
- Do not block CSS or JavaScript that a page needs to render.
- `robots.txt` controls crawling, not indexing or access. To keep a page out of search, allow crawling and use `noindex` (meta or `X-Robots-Tag`), or require authentication.
- Do not rely on `rel="canonical"`, `noindex`, or `hreflang` that contradict each other or the sitemap.
- Do not publish scaled, low-value, or unreviewed AI-generated pages to manipulate rankings.
- Do not add structured data or claims you cannot support.

## Gotchas

- Content that appears only after a click, scroll, or login may never be indexed. Links built with `onclick` or `#` fragments are not crawled.
- Soft 404s (a `200` page that says "not found") waste crawl and hurt quality; return `404` or `410`.
- Parameterized, faceted, and session URLs create duplicates. Canonicalize, restrict, or avoid generating them.
- Changing URLs without redirects discards accumulated signals. Map every old URL to the closest new one and test.
- `hreflang` needs return links and self-references, and each locale needs its own canonical.
- Lazy-loaded images and content need real `<img>` and `src`/`srcset`, or an observer-triggered load that crawlers can trigger.
- `<meta name="keywords">` is ignored. Title and description are a snippet suggestion, not a guarantee.
- Google rarely shows FAQ and HowTo rich results now; check current feature documentation before investing in a markup type.
- To control use by AI features and crawlers, use the documented robots tokens and `nosnippet` or `data-nosnippet` rules. There is no special markup required to appear in AI features beyond being indexable and useful.

## Report format

For each issue: URL or pattern, evidence, impact, and fix, ordered by how many pages it affects. State what was inspected (rendered HTML, Search Console, crawl) and what was not.

Read `references/seo.md` for the per-page checklist, status-code table, structured data guidance, and sources.
