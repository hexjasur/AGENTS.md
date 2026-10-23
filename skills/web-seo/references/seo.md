# SEO reference

Load this after `SKILL.md` for audits, migrations, and implementation details.

## Per-page checklist

- [ ] One canonical URL, reachable with `200`, self-referencing `rel="canonical"` (absolute URL, preferred host and protocol)
- [ ] Unique `<title>` that describes the page; unique meta description written for people
- [ ] One primary `h1`, logical heading order, original body content
- [ ] `<html lang="…">` correct; `hreflang` set for real alternates with reciprocal links
- [ ] Main content and navigation present in rendered HTML without interaction
- [ ] Internal links are `<a href>` with descriptive text; no important page is orphaned
- [ ] Images use `<img>` with useful `alt`, correct dimensions, and modern formats
- [ ] Intentional `index` or `noindex` (meta or `X-Robots-Tag`); not blocked in `robots.txt` if it must be deindexed
- [ ] Valid structured data that matches visible content
- [ ] Open Graph and Twitter Card tags: `og:title`, `og:description`, `og:image` (absolute URL), `og:url`, `twitter:card`
- [ ] Good Core Web Vitals and mobile usability (see `web-performance`, `web-accessibility`)

## Status codes and redirects

| Situation | Response |
| --- | --- |
| Normal page | `200` |
| Permanent move | `301` or `308` to the final URL, no chains |
| Temporary move | `302` or `307` |
| Removed, no replacement | `410` (or `404`) |
| Unknown URL | real `404`, never a `200` "not found" page |
| Server trouble or maintenance | `503` with `Retry-After` |

## Robots and sitemaps

- `robots.txt` lives at the host root, controls crawling only, and is public. Never list secrets in it.
- Do not combine `Disallow` with `noindex` on the same URL; the crawler cannot see the `noindex`.
- XML sitemap: canonical indexable URLs only, under 50,000 URLs or 50 MB uncompressed per file, referenced from `robots.txt` and submitted in Search Console. Update `lastmod` only on meaningful changes.
- Block crawling of infinite spaces (internal search, filters, calendars) instead of relying on the sitemap.

## JavaScript sites

- Prefer static generation or server-side rendering for public content. Client-only rendering is indexable but slower and more fragile.
- Real URLs through the History API, never `#!` or hash routes, and a proper `404` for unknown routes.
- Do not depend on user events to reveal content or links. Do not use dynamic rendering as a long-term fix.

## Structured data

- Use JSON-LD in the page. Describe only visible content, include required properties, and keep it consistent with the page.
- Common useful types: `Organization`, `Article`, `Product` with `Offer` and review data, `BreadcrumbList`, `VideoObject`, `LocalBusiness`, `Event`, `JobPosting`.
- Check eligibility in current Google feature docs, since supported types and display change. Validate with the Rich Results Test and the Schema Markup Validator.
- Markup makes a page eligible for a feature. It does not guarantee ranking or display.

## Migrations

1. Crawl the old site and export every URL with traffic or links.
2. Map old URL to new URL one to one; avoid blanket redirects to the homepage.
3. Launch with `301`s, updated canonical, sitemap, internal links, and `hreflang`.
4. Keep old redirects live for at least a year. Monitor Search Console for errors and index drops, and compare traffic against the baseline.

## Sources

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Robots meta tag and X-Robots-Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Localized versions (hreflang)](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)
