# i18n reference

Load this after `SKILL.md` when implementing or reviewing localization. Verify library APIs against current documentation.

## File layout

```text
locales/
  en.json
  ru.json
  uz-Latn.json
  uz-Cyrl.json
```

```json
{
  "chat": {
    "send": { "button": "Send" },
    "files": "{count, plural, one {# file selected} other {# files selected}}"
  }
}
```

- Keep one flat or shallowly nested key scheme across all files, and add a CI check that every locale has the same keys.
- Keep default-locale messages in code review; translators receive keys with descriptions.

## Library choices

- React: `react-i18next` with ICU plugin, or `react-intl` (FormatJS) for ICU by default.
- Vue: `vue-i18n`. Svelte: `svelte-i18n`. Vanilla or framework-neutral: `@formatjs/intl` or `i18next`.
- Prefer a library that supports ICU MessageFormat, lazy-loaded locale files, and TypeScript key checking.

## Intl snippets

```ts
const locale = 'uz-Latn';
new Intl.NumberFormat(locale, { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(1250000);
new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Tashkent' }).format(date);
new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-2, 'day');
new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(['A', 'B', 'C']);
new Intl.PluralRules('ru').select(3);                       // 'few'
['b', 'a', 'ä'].sort(new Intl.Collator(locale).compare);   // locale-aware sort
```

- Check that the runtime has data for `uz-Latn` and `uz-Cyrl`; fall back to `uz` and test the output you ship.
- Create formatter objects once and reuse them; construction is more expensive than formatting.

## Locale detection and document state

```ts
function pickLocale(supported: string[], saved?: string): string {
  if (saved && supported.includes(saved)) return saved;
  for (const tag of navigator.languages) {
    const match = supported.find((s) => s.toLowerCase() === tag.toLowerCase())
      ?? supported.find((s) => s.split('-')[0] === tag.split('-')[0]);
    if (match) return match;
  }
  return supported[0];
}
document.documentElement.lang = locale;
document.documentElement.dir = ['ar', 'he', 'fa', 'ur'].includes(locale.split('-')[0]) ? 'rtl' : 'ltr';
```

- Map a bare `uz` from the browser to your default Uzbek script and let the user switch.
- Use CSS logical properties (`margin-inline-start`, `padding-inline`) so RTL needs no rewrite.

## Uzbek notes

- Scripts: Latin (official since the 1990s reforms, `uz-Latn`) and Cyrillic (`uz-Cyrl`). Offer both if your audience uses both, and never auto-mix them.
- Letters `Oʻ`, `Gʻ`, `Sh`, `Ch`, and `ʼ` (tutuq belgisi): normalize U+02BB, U+2018, U+2019, U+0027, and backtick when matching user input.
- Fonts: confirm the font includes the modifier letters and Cyrillic Uzbek letters (`Ўў`, `Ққ`, `Ғғ`, `Ҳҳ`).
- Currency code `UZS`; time zone `Asia/Tashkent` (UTC+5, no daylight saving).
- Have a native speaker review UI wording, formality, and numerals before release.

## SEO for multilingual sites

```html
<link rel="alternate" hreflang="uz-Latn" href="https://example.com/uz/" />
<link rel="alternate" hreflang="uz-Cyrl" href="https://example.com/uz-cyrl/" />
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

- Give each language its own URL, canonical, title, and description, and include each in the sitemap. See `web-seo` for the rest.

## Testing

- Pseudo-locale: wrap and expand strings (`[Ĺöñĝéŕ téxt !!!]`) to expose hardcoded text and clipping.
- CI: fail on missing or unused keys and on placeholder mismatches between locales.
- Unit-test plural messages with `0`, `1`, `2`, `5`, `21`, and `1.5`.
- Visual check each locale at mobile width.

## Sources

- Unicode CLDR plural rules: https://cldr.unicode.org/index/cldr-spec/plural-rules
- ICU MessageFormat: https://unicode-org.github.io/icu/userguide/format_parse/messages/
- MDN Intl: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl
- W3C internationalization articles: https://www.w3.org/International/articles/
- Google hreflang guidance: https://developers.google.com/search/docs/specialty/international/localized-versions
