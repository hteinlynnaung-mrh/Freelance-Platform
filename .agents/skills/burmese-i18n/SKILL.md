---
name: burmese-i18n
description: Apply English/Burmese i18n patterns for the Archer web app, including selective translation, locale-aware typography, language switching, and Burmese layout validation. Use when adding or changing translated UI, copy, language selectors, or text styling in this project.
disable-model-invocation: true
---

# Burmese i18n for Archer

This is a project-local skill. Apply it only to this repository; do not install or copy it into a global skills directory.

## Product principles

The following requirements are intentional:

> Burmese text are typically complex and need more vertical space.
>
> in dual or multiple language system, Burmese text should not have fixed line-height instead let font handle proper line-height or have bigger line-height when choosing Burmese language.
>
> we should not use single styling for text because english and Burmese require different typography styling.
>
> our system should use proper styling based on user chosen language.
>
> No all term should be translated to Burmese. Most technical terms and well known UI terms are better left as english.

## Translation rules

- Keep English and Burmese translation keys in the same translation module. Add the same key to both locales unless a value is deliberately identical.
- Use the existing i18n provider and `t()` helper instead of hardcoding user-facing sentences in components. Preserve interpolation placeholders and grammatical context.
- Do not translate every term. Keep technical, product, brand, and widely understood UI terms in English when that is clearer: `API`, `URL`, `email`, `password`, `dashboard`, `project`, `client`, `freelancer`, `React`, `USD`, and `THB` are examples. Translate the surrounding sentence naturally.
- Keep brand names, usernames, IDs, code, URLs, email addresses, and machine-readable values unchanged.
- Format dates, numbers, and currency from locale-aware utilities. Show USD and Thai Baht (`THB`/`฿`) as distinct currencies; do not silently convert values.
- Update accessible names and helpful status messages along with visible copy. Set the document language to `en` or `my` when the selected locale changes.

## Language-aware typography

Never assume one text style works for both locales.

- Expose the selected language on the document root, preferably with both `lang="en|my"` and `data-language="en|my"` (or the equivalent project convention).
- Use language-scoped CSS variables or selectors. English may use a compact line-height, but Burmese must use `line-height: normal` or a deliberately larger, font-appropriate value; never force a small fixed line-height that can clip stacked marks.
- Prefer a Burmese-capable font stack with sensible fallbacks. Do not add a remote font dependency unless the task explicitly requests it and the project already permits it.
- Do not apply custom letter spacing to Burmese text. Use the font's natural glyph spacing; avoid positive or negative `letter-spacing` values on Burmese headings, body text, labels, buttons, and mixed-language blocks unless a font-specific accessibility fix is verified.
- Let Burmese text grow vertically: use natural height, allow wrapping, and increase block/control padding where needed. Avoid fixed heights, single-line assumptions, aggressive `line-clamp`, `overflow: hidden`, and vertical centering that clips multi-line Burmese text.
- Apply Burmese-specific spacing to headings, buttons, tabs, navigation, form controls, cards, empty states, and validation messages—not only to body paragraphs.
- Preserve responsive behavior at narrow widths. Test long Burmese strings and mixed English/Burmese strings rather than checking only the shortest translation.

Example baseline:

```css
:root {
  --body-line-height: 1.45;
  --control-line-height: 1.25;
}

[data-language="my"] {
  --body-line-height: normal;
  --control-line-height: 1.7;
  --text-block-gap: 1.1rem;
}

body {
  line-height: var(--body-line-height);
}

[data-language="my"] button,
[data-language="my"] input,
[data-language="my"] select {
  line-height: var(--control-line-height);
  min-height: 2.75rem;
}
```

Treat these values as a starting point. Let the selected font and rendered text determine the final spacing.

## Archer implementation workflow

1. Add or update the key in `app/src/i18n/translations.ts` for both `en` and `my`.
2. Use `useI18n()` and `t("key")` in the component. Keep intentional English technical terms in the Burmese value.
3. Ensure the provider updates persisted language state and the document `lang`/`data-language` attributes.
4. Add or adjust language-scoped rules in `app/src/i18n.css` or the component stylesheet. Prefer natural height over fixed dimensions.
5. Check both locales at desktop and narrow mobile widths. Look for clipped glyphs, crowded controls, broken wrapping, awkward mixed-language sentences, and untranslated user-facing text.
6. Run the app typecheck/build before handing off UI changes.

## Review checklist

- [ ] English and Burmese keys are present and placeholders match.
- [ ] Technical, brand, and well-known UI terms were kept in English where that reads naturally.
- [ ] The selected locale reaches the document root and accessible labels.
- [ ] Burmese has font-appropriate line-height and enough vertical space.
- [ ] Burmese text does not use custom letter spacing or forced tracking.
- [ ] No fixed-height or overflow rule clips Burmese text.
- [ ] USD and THB remain distinguishable and are not silently converted.
- [ ] Both locales were checked with long and mixed-language strings.
