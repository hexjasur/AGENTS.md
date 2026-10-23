---
name: web-seo
description: Improve discoverability of public web pages with crawlable architecture, semantic content, titles, metadata, links, structured data, sitemap, and robots behavior. Use for public routes, SEO audits, search previews, and indexing issues.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Web SEO

Build for people first, then make the same useful structure clear to crawlers. Avoid tricks and do not promise rankings.

## Workflow

1. Inventory public routes, canonical URLs, rendering mode, indexability rules, language/locale behavior, and internal links.
2. Give every indexable page a unique, accurate `<title>`, useful description, clear primary heading, semantic content, and descriptive link text.
3. Make important content and links crawlable in rendered HTML; handle client-side routing, redirects, 404s, canonical URLs, sitemap, and robots rules deliberately.
4. Add valid structured data only when it represents visible page content and matches the relevant Google Search feature.
5. Validate with rendered-page inspection, Search Console tools when available, Lighthouse SEO audits, and link/metadata checks.

## Guardrails

- Do not keyword-stuff, hide text, create doorway pages, or generate misleading structured data.
- Do not block essential CSS/JavaScript required to understand the page.
- Treat `robots.txt` as a crawl instruction, not access control.
- Read `references/seo.md` for the practical checklist and official Google Search references.
