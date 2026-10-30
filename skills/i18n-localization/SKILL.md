---
name: i18n-localization
description: Internationalize and localize apps and websites: translation keys, ICU MessageFormat, plurals, the Intl API for dates, numbers, and currency, locale detection and fallback, RTL support, hreflang, and Uzbek in Latin and Cyrillic scripts. Use when adding multiple languages, extracting hardcoded strings, writing translation files, fixing plural or date formatting, supporting uz, ru, or en locales, or reviewing an app for localization bugs.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-30"
---

# i18n and Localization

Separate text from code, format with the platform's locale rules, and let translators work with full sentences and context. Add the infrastructure first, then the languages.

## Procedure

```text
- [ ] 1. Decide supported locales, default, fallback, and (for Uzbek) script
- [ ] 2. Extract every user-facing string into keyed messages
- [ ] 3. Use ICU MessageFormat for plurals, gender, and variables
- [ ] 4. Format dates, numbers, currency, and lists with Intl
- [ ] 5. Detect, persist, and switch locale; set lang and dir
- [ ] 6. Test with long text, missing keys, and pseudo-locale
```

1. Use BCP 47 tags: `en`, `ru`, `uz-Latn` (Uzbek Latin), `uz-Cyrl` (Uzbek Cyrillic). Pick one fallback chain (for example `uz-Latn` → `en`) and write it down. Do not mix the two Uzbek scripts in one locale; treat them as separate locales or transliterate with a reviewed tool.
2. Replace literals in components, errors, `aria-label`, `title`, `alt`, placeholders, and document titles. Use stable, descriptive keys (`chat.send.button`), not the English text.
3. Write whole sentences with named placeholders: `{count, plural, one {# file} other {# files}}`. Never concatenate fragments or build plurals with `if (n === 1)`. Give translators a description for each key.
4. Use `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`, `Intl.ListFormat`, and `Intl.PluralRules` with the active locale. Store dates as UTC ISO strings and format on display with an explicit time zone.
5. Order of detection: saved user choice, then `navigator.languages`, then default. Persist the choice. Update `<html lang>` and `dir` on change, and load only the active locale's messages.
6. Test with a pseudo-locale (expanded, accented text), 30 to 40 percent longer strings, missing keys (fall back visibly in development, fail CI), RTL if supported, and each script.

## Guardrails

- Never concatenate translated fragments to form a sentence; word order differs by language.
- Never hardcode date, number, or currency formats (`MM/DD/YYYY`, `.` as decimal separator).
- Never use the translated text as the lookup key or compare against it in logic.
- Never rely on flags to represent languages; use language names in their own language (`O‘zbekcha`, `Ўзбекча`, `Русский`).
- Never ship machine-translated text without human review for user-visible or legal content.
- Never put user-supplied or untrusted text into a message format string; pass it as a variable and escape it on output.
- Do not translate identifiers, code, log keys, or API fields.
- Do not size containers to English text; allow wrapping and growth.

## Gotchas

- Uzbek Latin uses the modifier letters `oʻ` and `gʻ` (U+02BB) and the apostrophe for the glottal stop (U+02BC). Keyboards often type the straight `'` or `‘`, so normalize search, sorting, and matching, and choose one form for display.
- Uzbek has plural categories `one` and `other`, but nouns after a number stay singular in running text (`5 ta fayl`), so check the plural form with a native speaker rather than copying English or Russian rules.
- Russian has four plural categories (`one`, `few`, `many`, `other`); an English-style two-form plural is wrong.
- `toLocaleUpperCase` and `localeCompare` depend on locale; Turkish and Azerbaijani `i` casing differ from English. Pass the locale explicitly.
- Cyrillic and Latin Uzbek differ in length and word shape; test layouts in both.
- Time zones and daylight saving cause off-by-one-day bugs; format with an explicit `timeZone`.
- Text in images and fixed-width buttons cannot be translated or resized.
- Sorting names with plain code-point order is wrong for most languages; use `Intl.Collator`.
- Machine-readable output (CSV, API) should stay locale-neutral; localize only for display.
- Search engines need one URL per language with `hreflang` alternates, not content swapped by cookie.

## Report format

State the supported locales and fallback, the message format used, the number of strings extracted, and which commands or tests ran (missing-key check, pseudo-locale, build). List findings by severity (broken text, wrong plural or date, untranslated, layout, SEO), each with location and fix. Say which translations a human still needs to review.

Read `references/i18n-reference.md` for library setup, ICU examples, Intl snippets, Uzbek notes, SEO tags, and sources.
