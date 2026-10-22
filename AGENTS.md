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
- `src/lib/loan-simulation.ts` contains the product-specific assumptions and shared calculation. `personal-loan-simulation.ts` preserves the personal calculator API. The public personal and business calculators expose amount and term plus an optional total-insurance adjustment. Insurance starts at zero, blank means zero, and the opening fee stays outside the monthly payment.
- `src/data/financing-products.ts` centralizes the other business products and fixed CAT references. `src/lib/financing-simulation.ts` preserves the source calculation engines, including detailed schedules for auditing. Pure leasing has no terminal purchase charge or applicable CAT.
- `src/lib/financing-estimates.ts` preserves the simplified calculator adapters and their API for compatibility. The public financing calculators use the detailed engines in `financing-simulation.ts`, without changing formulas. Revolving credit requires a civil start date and shows the first actual monthly rollup plus the capital-return payment. Reference lines initially follow the disposition/invoice amount until manually edited; opening fees use that line. Financial and pure leasing expose residual, insurance and services; financial advance remains visible. Factoring compares both recourse modes with adjustable line, opening inclusion, advance, administration count and expenses. Keep all money inputs in whole pesos, results in cents, and insurance/services at zero by default. No public payment tables.
- The business simulator models a simple loan with a mortgage guarantee. Its pending CAT must remain distinct from the published CAT for a guarantor-backed loan. Published CAT disclosures are fixed references, not values recalculated by the simulator.
- `src/lib/currency-input.ts` handles whole-peso loan amounts, formatting and caret preservation. Keep the currency prefix attached during editing; calculated payments retain cents.
- Final pricing, insurance, guarantee terms, CAT validity and institutional/contact details still require confirmation before publication. Update the active data and calculation modules when those definitions are supplied, rather than duplicating figures in documentation.

## Shared components

- `FontHead.astro` uses Astro's Fonts API to preload the local Figtree variable font on every route. Its configuration reads the existing Fontsource package and generates metric-adjusted fallbacks; use `--font-figtree` instead of adding separate font CSS imports.
- `Footer.astro` shows Grupo Lobo branding together with the CONDUSEF, CNBV and Buró logos on every route. Keep both blocks visible rather than switching them by page.
- `RegulatoryLogos.astro` shares the three logos between the footer and the homepage band. The band sits between the hero image and the `brand-tab`; its height must remain in the page flow so the tab and following content stay aligned on mobile.
- `LoanRequirements.astro`, `LoanConditions.astro` and `LoanCalculator.astro` share the presentation between personal and business credit. The `PersonalLoan*` wrappers preserve existing imports. Keep product-specific content and assumptions separate from shared layout and interaction.
- `FinancingCalculator.astro` shares the other four simulators. Its custom element owns accessible validation, whole-peso currency editing, live recalculation and payment summaries through `financing-calculator-client.ts`, with disconnect cleanup. Recalculate valid edits immediately and hide previous results and dynamic notices while inputs are invalid. Keep technical adjustments in native details, initial/periodic/final amounts concise, optional purchase and factoring reserve separate. Center the white result vertically on desktop and place notices across the full panel width. Do not add payment schedule tables.
- `EditorialCard.astro` shares the photographic cards for loan uses, business solutions and lease assets. The contextual scenes in `src/assets/editorial/` were generated with imagegen; their prompts are recorded in `prompts.json`. They illustrate uses and sectors rather than actual customers or an equipment catalogue. Keep images local, responsive and lazy-loaded, with text on solid surfaces.
- `LeadForm.astro` is shared across the homepage and product pages, with product preselection and contextual fields from `src/data/contact.ts`. Validation and email preparation live in `src/lib/contact-form.ts`. Contact currently opens a `mailto` draft; direct web delivery remains pending. A prepared draft or validated form does not confirm delivery.
- `FormSelect.astro` synchronizes its custom control with a native select for form values and validation. Preserve keyboard interaction, focus handling and the native fallback.
- `FinancingProcess.astro` and `ProductGuide.astro` follow the homepage solutions. The guide is at `#elige-tu-financiamiento`; link to it from the homepage business block and the secondary link at the end of the PyMEs dropdown, rather than repeating it in product heroes. Collect needs and relevant preferences progressively; these determine the alternatives and explain why to explore them. The only optional contextual input is the amount for simple business credit. Keep operating-age requirements on the product pages, outside this guide. Keep term selection in the product simulators, outside this guide. Confirm only when the simple-credit amount is within its reference range. Other notices appear only when the captured inputs require review against published references; keep the product and show “Requiere revisar tu caso”. Do not imply approval, eligibility or economic suitability. Update the result when answers change, with rules and explanatory logic centralized in the active guide modules. Preserve the homepage layout, existing product routes and direct links to all five products as the no-JavaScript alternative. Process answers locally with deterministic rules, without backend or AI calls, storage or delivery.
- `PymesSolutions.astro` presents the business loan's uses, benefits, audience and operation before its requirements. Do not duplicate it below the simulator or turn `/creditos-pymes/` into a general catalogue.
- The guide uses native radio groups and keyed product rows; keep shared `FormSelect` independent. `guide-motion.ts` owns interruptible, critically damped height changes (response 0.35 seconds), with inner-content measurement and no nested height springs. Keep results top-aligned at natural height, complete expanding geometry when it receives focus, respect reduced motion, and clean up animations, observers and timers on Astro navigation.
- `/faq/` gathers general and product questions from `src/data/faqs.ts`, using native exclusive accordions. Keep detailed conditions and simulations on the product pages and link to them from answers. FAQ copy must reflect the current contact behavior and provisional pricing without promising approval or fixed processing times.
- `/nosotros/` follows the institutional mockup with an introduction, a photographic banner and four values. The header's “Conócenos” link points to this page. Keep its regulatory wording aligned with `/legal/` and use the current shared footer.
- `/legal/` contains the privacy notice, institutional information and general conditions. `/une/` has the dedicated UNE, personal-data and integrity contacts. `src/data/legal.ts` centralizes legal links, institutional contacts and official transparency links shown in the shared footer; `privacy-notice.ts` contains the complete notice. Keep the legal page's current-site disclosure aligned with the actual contact and simulation behavior when those features change. `/privacidad` redirects to `/legal/`; the old `/legal/#atencion` anchor links to `/une/`.
- Pages use Astro's `ClientRouter`. Initialize page scripts after `astro:page-load` without duplicate listeners, and clean up listeners/observers when components disconnect where applicable.
- `Header.astro` owns scroll-direction visibility and the homepage's `data-scrolled` surface. Keep the existing behavior: hide while scrolling down and reveal while scrolling up; remain visible while menus are open or navigation has keyboard focus. Keep the clear theme, PyMEs before Personas, all five business products, and the homepage process link. Preserve touch, hover, keyboard, reduced-motion and history-restoration behavior.
- `credit-heroes.css` shares the hero layout and responsive type scale for personal credit, cards and the account-credit variant of `FinancingHero.astro`. Keep their stacked text and image on the same container, preserve the short-viewport readability fallback, and change common responsive rules here rather than duplicating them per product. `pymes-hero.css` shares the centered text and panoramic composition for business credit and financial leasing. Financial leasing keeps its longer copy and image in natural flow and uses a centered 3:2 frame on mobile. The financing heroes use dedicated generated scenes in `src/assets/financing-heroes/`, with their prompts recorded there; preserve the people, business activity and complete vehicle when cropping them.
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
