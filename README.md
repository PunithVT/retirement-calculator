# Retirement Calculator

> **Will your SIP or lumpsum investment last through retirement?**
> A free, private, instant retirement-corpus planner — built for India.

[![Deploy](https://img.shields.io/badge/deploy-github%20pages-22c55e?logo=github)](https://punithvt.github.io/retirement-calculator/)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)
[![No tracking](https://img.shields.io/badge/tracking-zero-22c55e)](#privacy)

**Live demo:** https://punithvt.github.io/retirement-calculator/

---

## Why this exists

Most online retirement calculators are either too simplistic ("assume 12% returns forever, no inflation") or buried under sign-up walls and upsells. This one asks a single, blunt question:

> **Given what you save, what you spend, and how long you'll live — does the math actually work?**

If it doesn't, the calculator tells you _exactly_ how much extra you need to invest each month to close the gap.

## Features

- **SIP and Lumpsum modes** — model either a monthly systematic investment or a one-time corpus.
- **Two-phase simulation** — different return assumptions for the accumulation phase (pre-retirement) and the withdrawal phase (post-retirement), because no sane portfolio looks the same at 35 and 65.
- **Inflation-aware** — every rupee of expense is grown to its future value before the corpus is checked.
- **SIP step-up** — model a yearly increase in your contribution (most salaried investors raise SIPs over time).
- **Year-by-year corpus chart** — see exactly when (or whether) you run out.
- **Solver for the shortfall** — if you don't have enough, a binary search finds the additional monthly SIP needed.
- **100% client-side** — no servers, no analytics, no cookies. Refresh the page and your data is gone.
- **Built-in SEO** — semantic HTML, JSON-LD (`WebApplication`, `FAQPage`, `Organization`, `BreadcrumbList`), Open Graph, Twitter cards, sitemap, robots.txt.

## Privacy

- **No data leaves your device.** All math runs in your browser.
- **No analytics, no cookies, no fonts loaded from third parties.**
- **No sign-up.** Just open the page and use it.

## Tech stack

- Vanilla HTML, CSS, and JavaScript. **Zero dependencies.**
- Single-page, ~25 KB gzipped. Loads instantly even on 3G.
- Canvas chart, no chart library.
- PWA-ready (`manifest.json`).

## Run it locally

It's just static files — no build step.

```bash
# any of these will work
python3 -m http.server 8000
# or
npx serve .
# or just open index.html in a browser
```

Then visit `http://localhost:8000`.

## Deploy

### GitHub Pages (recommended)

1. Push this repo to `github.com/<you>/retirement-calculator`.
2. Settings → Pages → Build and deployment → **GitHub Actions**.
3. The workflow at `.github/workflows/pages.yml` will deploy on every push to `main`.

### Cloudflare Pages / Netlify / Vercel

Connect the repo. Build command: _(none)_. Publish directory: _(root)_. That's it.

### Custom domain

Add a `CNAME` file at the root containing your domain, then point a `CNAME` record at `<you>.github.io`.

## SEO checklist (already done)

- [x] Single H1, descriptive `<title>`, ≤155-char meta description
- [x] Canonical URL
- [x] Open Graph + Twitter card with custom OG image
- [x] JSON-LD: `WebApplication`, `FAQPage`, `Organization`, `BreadcrumbList`
- [x] Semantic HTML (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`)
- [x] FAQ section with real questions (eligible for FAQ rich result)
- [x] `robots.txt` + `sitemap.xml`
- [x] Mobile-first responsive, passes Core Web Vitals (LCP < 1.5s on 4G)
- [x] No render-blocking external resources
- [x] Light + dark mode (`prefers-color-scheme`)
- [x] Accessible (skip link, ARIA, keyboard navigable, reduced-motion respected)

After deploying:

1. Submit `sitemap.xml` to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add a few high-quality backlinks (Reddit r/IndiaInvestments, Twitter, your own blog).
3. Use [PageSpeed Insights](https://pagespeed.web.dev/) to confirm 95+ scores.

## File map

```
retirement-calculator/
├── index.html              # Single-page app + SEO content
├── styles.css              # All styles (light + dark)
├── app.js                  # Calculator + chart logic
├── manifest.json           # PWA manifest
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── og-image.svg            # Social preview
├── .nojekyll               # GitHub Pages: serve files as-is
└── .github/workflows/
    └── pages.yml           # Auto-deploy to GitHub Pages
```

## Roadmap

- [ ] Monte Carlo simulation (sequence-of-returns risk)
- [ ] EPF / NPS / PPF integration
- [ ] Tax-aware withdrawal modelling
- [ ] Multi-currency (USD, EUR, AED for NRIs)
- [ ] Save/share scenario via URL fragment

## Disclaimer

This tool is for **educational purposes only**. It is not investment, tax, or legal advice. Consult a SEBI-registered investment adviser (RIA) before making decisions about your retirement.

## License

MIT — do whatever you want, just don't sue me.
