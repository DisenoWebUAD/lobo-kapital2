## Project context

Lobo Kapital is an Astro landing with shared product pages. Preserve its current Figtree typography, red/white/gray palette, rounded controls and existing animations when making focused changes.

The current routes are `/`, `/credito-personal/`, `/creditos-pymes/`, `/credito-en-cuenta-corriente/`, `/tarjetas/`, `/arrendamiento/`, `/arrendamiento-financiero/`, `/factoraje/`, `/nosotros/`, `/faq/`, `/legal/` and `/une/`. Personal and business loans are the main credit products; cards retain their own page and homepage promotion. Account credit and both leases belong to PyMEs; `/arrendamiento/` remains pure leasing. Preserve the existing product routes unless the requested task changes their scope.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Product data and simulations

- `src/data/credits.ts` contains the displayed loan conditions and CAT disclosures. Product information is still provisional; do not turn reference assumptions into confirmed rates, commissions or benefits. Represent unpublished contractual pricing with `null`, not zero.
- `src/lib/loan-simulation.ts` contains the product-specific assumptions and shared calculation. `personal-loan-simulation.ts` preserves the personal calculator API. The public personal and business calculators expose amount and term, exclude unconfirmed insurance and keep the opening fee outside the monthly payment.
- `src/data/financing-products.ts` centralizes the other business products and fixed CAT references. `src/lib/financing-simulation.ts` preserves the source calculation engines, including detailed schedules for auditing. Pure leasing has no terminal purchase charge or applicable CAT.
- `src/lib/financing-estimates.ts` adapts those engines for the simplified public calculators and centralizes their interface assumptions. Revolving credit uses amount and days: the modeled new line equals the full disposition and opening is based on that amount. Its monthly payment is a 30-day reference, with capital and the last period's interest returned in the final payment; actual payments depend on dates and line movements. Keep total interest and initial charges separate, without inferring a contractual calendar or fixed monthly payment. Financial leasing uses asset, value and term with optional advance and a fixed residual by asset; pure leasing uses value and term. Factoring compares both recourse modes using invoice value and days, with the line equal to invoices, a 90% advance, one administration charge and opening included as illustrative assumptions. Keep insurance and services excluded, inputs in whole pesos and results in cents; do not duplicate these assumptions in components.
- The business simulator models a simple loan with a mortgage guarantee. Its pending CAT must remain distinct from the published CAT for a guarantor-backed loan. Published CAT disclosures are fixed references, not values recalculated by the simulator.
- `src/lib/currency-input.ts` handles whole-peso loan amounts, formatting and caret preservation. Keep the currency prefix attached during editing; calculated payments retain cents.
- Final pricing, insurance, guarantee terms, CAT validity and institutional/contact details still require confirmation before publication. Update the active data and calculation modules when those definitions are supplied, rather than duplicating figures in documentation.

## Shared components

- `FontHead.astro` uses Astro's Fonts API to preload the local Figtree variable font on every route. Its configuration reads the existing Fontsource package and generates metric-adjusted fallbacks; use `--font-figtree` instead of adding separate font CSS imports.
- `Footer.astro` shows Grupo Lobo branding together with the CONDUSEF, CNBV and Buró logos on every route. Keep both blocks visible rather than switching them by page.
- `RegulatoryLogos.astro` shares the three logos between the footer and the homepage band. The band sits between the hero image and the `brand-tab`; its height must remain in the page flow so the tab and following content stay aligned on mobile.
- `LoanRequirements.astro`, `LoanConditions.astro` and `LoanCalculator.astro` share the presentation between personal and business credit. The `PersonalLoan*` wrappers preserve existing imports. Keep product-specific content and assumptions separate from shared layout and interaction.
- `FinancingCalculator.astro` shares the other four simulators. Its custom element owns validation, whole-peso currency editing, live recalculation and payment summaries through `financing-calculator-client.ts`, with disconnect cleanup. Recalculate valid edits immediately and hide previous results while inputs are invalid. Present concise initial, periodic and final amounts where applicable, with optional purchase and factoring reserve separate. The public interface has no schedule tables, revolving date or separate line field, editable residual, insurance or services fields; preserve the detailed engines for source comparison instead of exposing their audit inputs.
- `EditorialCard.astro` shares the photographic cards for loan uses, business solutions and lease assets. The contextual scenes in `src/assets/editorial/` were generated with imagegen; their prompts are recorded in `prompts.json`. They illustrate uses and sectors rather than actual customers or an equipment catalogue. Keep images local, responsive and lazy-loaded, with text on solid surfaces.
- `LeadForm.astro` is shared across the homepage and product pages, with product preselection and contextual fields from `src/data/contact.ts`. Validation and email preparation live in `src/lib/contact-form.ts`. Contact currently opens a `mailto` draft; direct web delivery remains pending. A prepared draft or validated form does not confirm delivery.
- `FormSelect.astro` synchronizes its custom control with a native select for form values and validation. Preserve keyboard interaction, focus handling and the native fallback.
- `/faq/` gathers general and product questions from `src/data/faqs.ts`, using native exclusive accordions. Keep detailed conditions and simulations on the product pages and link to them from answers. FAQ copy must reflect the current contact behavior and provisional pricing without promising approval or fixed processing times.
- `/nosotros/` follows the institutional mockup with an introduction, a photographic banner and four values. The header's “Conócenos” link points to this page. Keep its regulatory wording aligned with `/legal/` and use the current shared footer.
- `/legal/` contains the privacy notice, institutional information and general conditions. `/une/` has the dedicated UNE, personal-data and integrity contacts. `src/data/legal.ts` centralizes legal links, institutional contacts and official transparency links shown in the shared footer; `privacy-notice.ts` contains the complete notice. Keep the legal page's current-site disclosure aligned with the actual contact and simulation behavior when those features change. `/privacidad` redirects to `/legal/`; the old `/legal/#atencion` anchor links to `/une/`.
- Pages use Astro's `ClientRouter`. Initialize page scripts after `astro:page-load` without duplicate listeners, and clean up listeners/observers when components disconnect where applicable.
- `Header.astro` owns scroll-direction visibility and the homepage's `data-scrolled` surface. Keep it visible while menus are open or navigation has keyboard focus; preserve touch, hover, reduced-motion and history-restoration behavior.
- `credit-heroes.css` shares the hero layout and responsive type scale for personal credit and cards. Keep their stacked text and image on the same container, preserve the short-viewport readability fallback, and change common responsive rules here rather than duplicating them per product.
- `PageReveals.astro` adds opt-in, once-only entrances to interior editorial sections through `data-page-reveal` (`rise`, `fade`, or `image`) and row-based `data-page-reveal-group`. Keep heroes, calculators, forms, FAQ interactions and legal/UNE content immediate. Preserve its no-JavaScript and reduced-motion fallbacks; the homepage's `HomeMotion.astro` remains separate.

## Validation

Use `pnpm check` and `pnpm build` for component or script changes. Run `pnpm test` when changing loan calculations, currency editing or contact validation. Check affected interfaces on desktop and mobile, including keyboard behavior and navigation between product pages. Documentation-only changes need reference and diff checks, not an application build.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
