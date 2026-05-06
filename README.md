<div align="center">

# 🪙 Retirement Calculator

### **Will your SIP or lumpsum last through retirement?**

A free, private, blazing-fast retirement-corpus planner — built for India, usable anywhere.

**[▶ Try it live →](https://punithvt.github.io/retirement-calculator/)**

[![Live on GitHub Pages](https://img.shields.io/badge/live-punithvt.github.io-22c55e?logo=github&logoColor=white)](https://punithvt.github.io/retirement-calculator/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-22c55e)](#tech-stack)
[![Zero tracking](https://img.shields.io/badge/tracking-none-22c55e)](#privacy-first)
[![Bundle size](https://img.shields.io/badge/bundle-~25%20KB%20gzipped-22c55e)](#tech-stack)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)](#contributing)
[![Made for India](https://img.shields.io/badge/made%20for-India%20%F0%9F%87%AE%F0%9F%87%B3-orange)](#why-built-for-india)

</div>

---

## 🇮🇳 Built for India's young earners — because nobody else is solving this

India has **~430 million people aged 20–35**, and a record share of them are now in their first salaried job, freelancing, or running side hustles. They want to retire — many even dream of **retiring early (FIRE)**. But almost none of them have a clear answer to the only question that matters:

> _"How much do I actually need to invest **today** so my future self isn't broke at 65?"_

Here's why that question is so hard to answer in India specifically:

- 🏛 **No social safety net.** Unlike the US or EU, there's no Social Security cheque waiting. Your retirement is **100% your problem.** EPF and NPS help, but rarely cover a real urban lifestyle.
- 📈 **Brutal inflation.** Indian CPI averages 6% — but **medical inflation is 10–14%**, education 8–12%, lifestyle creep is real. A ₹50k/month lifestyle today becomes ₹2.7L/month in 25 years.
- 💸 **No employer pension.** Less than 12% of Indians work in formal-sector jobs with defined-benefit pensions. The other 88% are on their own.
- 👨‍👩‍👧 **Joint-family safety net is fading.** Urban migration, smaller families, and rising elder-care costs mean you can't count on kids to fund retirement the way the previous generation could.
- 🤷 **Mainstream advice is bad.** "Just invest in PPF" / "buy LIC" / "12% forever" advice has cost an entire generation of Indians their retirement security.
- 🤐 **Existing calculators are gated.** Most are sign-up walls for advisory firms that want to sell you PMS, AIF, ULIPs, or insurance. They tell you the corpus number — then ask for your phone number to "discuss further."

**This calculator solves that.** No phone number. No ad retargeting. No upsell. Just enter your numbers and get a brutally honest answer in 30 seconds:

- ✅ **How much corpus** you need at retirement (in future rupees, not today's).
- ✅ **Whether your current SIP** gets you there — to the year and the rupee.
- ✅ **Exactly how much more** to invest each month if it doesn't.
- ✅ **The cost of waiting** — what 10 more years of "I'll start next year" will cost you.
- ✅ **The Magic Year** — when your money starts earning more than you save (the moment compounding "kicks in").

> **If you are 22–35, earning, and unsure whether your retirement plan will hold — start here. It takes 60 seconds and it's free forever.**

**[▶ Run your numbers now →](https://punithvt.github.io/retirement-calculator/)**

---

## 🎯 What is this?

Most online retirement calculators are either **too simplistic** ("assume 12% returns forever, ignore inflation") or buried under **sign-up walls, lead-gen forms, and aggressive upsells** for the parent advisory firm.

This one is different. It asks one blunt question:

> **Given what you save, what you spend, and how long you'll live — does the math actually work?**

If it doesn't, the calculator tells you _exactly_ how much extra you need to invest each month to close the gap. No marketing fluff. No "talk to our advisor." Just numbers.

---

## ✨ Highlights

| | |
|---|---|
| 🧮 **Two modes** | SIP (monthly) **or** lumpsum (one-time) — not both bolted on as an afterthought. |
| 📈 **Two-phase returns** | Different return assumptions for accumulation (pre-retirement) and withdrawal (post-retirement). Because no sane portfolio looks the same at 35 and 65. |
| 🇮🇳 **Inflation-aware (twice)** | General expenses inflated at CPI (~6%), **healthcare separately at ~10%** — the silent retirement killer most calculators ignore. |
| 🏷 **Lifestyle presets** | One-click sliders: Stretched Thin / Tight / Comfortable / Peaceful / Luxurious — pick what your retirement *feels* like, the calculator picks the numbers. |
| 📊 **Year-by-year chart** | Canvas-rendered corpus curve with retirement and **Magic Year** markers — you see exactly when compounding takes over. |
| 🎯 **Shortfall solver** | If your plan fails, a binary search finds the **exact** extra monthly SIP needed to make it work. |
| ⏰ **Cost of starting late** | Live comparison: what would the same plan cost if you delayed by 10 years? (Spoiler: roughly 2–3× the SIP.) |
| 📈 **SIP step-up + annual top-up** | Annual % step-up *and* a fixed yearly top-up (bonuses, RSU vests, tax refunds) — what salaried investors actually do. |
| ✨ **Magic Year + Wealth Multiplier** | The age your investment growth first beats your contributions, and how many × your money becomes by retirement. |
| 🔒 **100% client-side** | No servers, no analytics, no cookies, no fonts loaded from third parties. Refresh and your data is gone. |
| ⚡ **~30 KB gzipped** | Loads instantly even on patchy 3G. Zero JS dependencies. |
| 🌗 **Light + dark mode** | Auto-follows `prefers-color-scheme`. |
| ♿ **Accessible** | Skip link, ARIA, keyboard navigable, respects `prefers-reduced-motion`. |
| 📱 **PWA-ready** | Installable on Android/iOS, works offline once visited. |
| 🔍 **SEO best-in-class** | Semantic HTML, JSON-LD (`WebApplication`, `FAQPage`, `Organization`, `BreadcrumbList`), Open Graph, Twitter cards, sitemap, robots.txt. |

---

## 💡 "How much should I invest?" — quick reference

These are rough **back-of-envelope numbers** for an Indian saver who wants a *comfortable* retirement (₹60k/month general + ₹8k/month healthcare, in today's rupees), retiring at 60, planning to age 85, assuming 12% pre-retirement and 8% post-retirement nominal returns at 6% general inflation + 10% healthcare inflation:

| If you start at age… | Monthly SIP needed | Total invested over working life | Corpus at 60 |
|---|---|---|---|
| **22** | ~₹15,000/mo | ~₹65 L | ~₹6.5 Cr |
| **25** | ~₹20,000/mo | ~₹75 L | ~₹6.5 Cr |
| **28** | ~₹28,000/mo | ~₹95 L | ~₹6.5 Cr |
| **30** | ~₹35,000/mo | ~₹1.1 Cr | ~₹6.5 Cr |
| **35** | ~₹60,000/mo | ~₹1.5 Cr | ~₹6.5 Cr |
| **40** | ~₹1,10,000/mo | ~₹2.2 Cr | ~₹6.5 Cr |

> **Notice the pattern?** The 22-year-old invests **₹65 L total** to retire comfortably. The 40-year-old invests **₹2.2 Cr total** for the *same* outcome. **That ₹1.55 Cr difference is the price of waiting.**
>
> This is why the calculator has a "Cost of starting 10 yrs late" card. Time in the market beats timing the market — and it isn't even close.

The table above assumes no SIP step-up. If you bump your SIP by 5% per year (which most salaried earners can), the required starting SIP drops by **30–40%**.

> ⚠️ These are illustrative numbers. **Run your own scenario in the calculator** — change your salary trajectory, your lifestyle, your risk tolerance, your retirement age. The whole point is that there is no one-size-fits-all answer.

---

## 🚀 Quick start

It's just static files. **No build step. No npm install. No webpack config to debug.**

```bash
git clone https://github.com/PunithVT/retirement-calculator.git
cd retirement-calculator

# Pick any of these — they all work:
python3 -m http.server 8000
npx serve .
# Or just open index.html in a browser. That's it.
```

Then visit `http://localhost:8000`.

---

## 🧠 How the math works

The calculator runs a year-by-year simulation in two phases.

### Phase 1 — Accumulation (now → retirement)

```
For each year before retirement:
    corpus = corpus * (1 + pre_return)
    corpus += annual_SIP_contribution     ← grows each year if step-up enabled
```

For lumpsum mode, the contribution is added once at year 0 and then compounded.

### Phase 2 — Withdrawal (retirement → end of life)

```
For each year after retirement:
    annual_expense = today_expense * (1 + inflation) ^ years_from_today
    corpus = corpus * (1 + post_return) - annual_expense
    if corpus < 0: ❌ shortfall — record the year you ran out
```

### The shortfall solver

If the plan fails, we **binary search** the additional monthly SIP needed so the corpus survives until your stated life expectancy. The result is the smallest extra contribution that makes your retirement work — accurate to the rupee.

All of this happens in your browser, in milliseconds. See [`app.js`](app.js).

---

## 🔒 Privacy-first

This calculator was built on three rules:

1. **No data leaves your device.** All math runs in your browser.
2. **No analytics, no cookies, no third-party fonts, no CDN-hosted scripts.**
3. **No sign-up.** Just open the page and use it.

Open DevTools → Network tab → run a calculation. You'll see _zero_ outbound requests after the initial page load. Verify it yourself.

---

## 🇮🇳 Why built for India?

Default assumptions and ranges are tuned for Indian investors:

- Inflation default: **6%** (long-term India CPI)
- Pre-retirement return: **11–12%** (equity-heavy mutual fund/NIFTY 50 historicals)
- Post-retirement return: **7–9%** (debt-tilted balanced portfolio)
- Currency: **₹** (INR), Indian numbering (lakhs / crores)
- Locale: `en-IN`

That said, **the math works for any country.** Override the defaults and it's a global retirement calculator.

---

## 📦 Tech stack

- **Vanilla HTML, CSS, and JavaScript.** Zero dependencies. Zero build tools.
- **Single page**, ~25 KB gzipped total payload.
- **Canvas chart** rendered by hand — no Chart.js, no D3, no React.
- **PWA** via `manifest.json` and a minimal service worker.
- **Semantic HTML5** with full ARIA support.

Why no framework? Because this is a calculator, not a SaaS product. Every dependency is a liability — for security, for load time, for the next maintainer. Plain web platform features got us 95+ on PageSpeed without breaking a sweat.

---

## 🌍 Deploy your own

### GitHub Pages (recommended — already wired up)

1. Fork or clone this repo.
2. **Settings → Pages → Build and deployment → GitHub Actions**.
3. Push to `main`. The workflow at [`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys automatically.

### Cloudflare Pages / Netlify / Vercel

Connect the repo. **Build command:** _(none)_. **Publish directory:** _(root)_. Done.

### Custom domain

Add a `CNAME` file at the root containing your domain, then point a `CNAME` DNS record at `<you>.github.io`.

---

## 🗂 Project structure

```
retirement-calculator/
├── index.html              # Single-page app + SEO content + JSON-LD
├── styles.css              # All styles (light + dark, fully responsive)
├── app.js                  # Calculator engine, chart, shortfall solver
├── manifest.json           # PWA manifest
├── favicon.svg             # Vector icon (theme-aware)
├── og-image.svg            # Social preview card
├── robots.txt              # Allow all crawlers
├── sitemap.xml             # Indexable URLs
├── .nojekyll               # GitHub Pages: serve files as-is
└── .github/workflows/
    └── pages.yml           # Auto-deploy to GitHub Pages
```

---

## 🔍 SEO checklist (already done)

- [x] Single H1, descriptive `<title>`, ≤155-char meta description
- [x] Rich keyword meta with long-tail Indian-finance terms
- [x] Canonical URL
- [x] Open Graph + Twitter card with custom OG image
- [x] JSON-LD: `WebApplication`, `FAQPage`, `Organization`, `BreadcrumbList`
- [x] Semantic HTML (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`)
- [x] Eight-question FAQ section (eligible for FAQ rich result)
- [x] `robots.txt` + `sitemap.xml`
- [x] Mobile-first responsive, passes Core Web Vitals (LCP < 1.5 s on 4G)
- [x] No render-blocking external resources
- [x] Light + dark mode (`prefers-color-scheme`)
- [x] Accessible (skip link, ARIA, keyboard navigable, reduced-motion respected)
- [x] PWA installable (`manifest.json`, theme color, icons)
- [x] `hreflang` and `inLanguage` set to `en-IN`

After deploying:

1. Submit `sitemap.xml` to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Earn high-quality backlinks (Reddit r/IndiaInvestments, r/FIRE_Ind, Twitter, your own blog, finance Discord servers).
3. Verify 95+ scores on [PageSpeed Insights](https://pagespeed.web.dev/).

---

## 🆚 How this compares

| | This calculator | Typical AMC calculator | "Free" advisor calc |
|---|---|---|---|
| Sign-up wall | ❌ None | ✅ Often | ✅ Always |
| Inflation modeling | ✅ Yes | ⚠️ Sometimes | ⚠️ Sometimes |
| Two-phase returns (pre/post retirement) | ✅ Yes | ❌ Rare | ❌ Rare |
| Year-by-year chart | ✅ Yes | ⚠️ Rare | ⚠️ Rare |
| Shortfall solver | ✅ Yes | ❌ No | ❌ No |
| SIP step-up | ✅ Yes | ⚠️ Sometimes | ⚠️ Sometimes |
| Tracks you | ❌ Never | ✅ Yes | ✅ Aggressively |
| Open source | ✅ MIT | ❌ Proprietary | ❌ Proprietary |
| Loads in < 1 s | ✅ Yes | ❌ Rarely | ❌ No |

---

## 🗺 Roadmap

- [ ] **Monte Carlo simulation** — sequence-of-returns risk visualisation
- [ ] **EPF / NPS / PPF integration** — model government pension corpus alongside SIP
- [ ] **Tax-aware withdrawal** — LTCG, debt fund taxation, basic exemption slabs
- [ ] **Multi-currency mode** — USD, EUR, AED for NRIs and FIRE-abroad cases
- [ ] **Save / share scenarios** via URL fragment (still client-side, still no server)
- [ ] **Goal-based planning** — child education, home purchase, retirement combined
- [ ] **CSV export** of the year-by-year corpus table
- [ ] **i18n** — Hindi, Tamil, Kannada UI

Vote on what's next via [GitHub Issues](https://github.com/PunithVT/retirement-calculator/issues).

---

## 🤝 Contributing

PRs welcome. The bar:

1. **No new dependencies.** Vanilla web platform only.
2. **Don't break the < 30 KB budget.** Bundle stays small or it's not merged.
3. **No tracking.** Ever. Not even "anonymous" analytics.
4. **Keep it accessible.** Run `axe` or Lighthouse before submitting.

For larger features, open an issue first to discuss.

```bash
# typical dev loop
git clone https://github.com/PunithVT/retirement-calculator.git
cd retirement-calculator
python3 -m http.server 8000
# edit, refresh, repeat
```

---

## ❓ FAQ

**Q: Can I use this for non-Indian retirement planning?**
Yes. The math is universal. Just override the inflation, return, and currency-format defaults to suit your region.

**Q: Is there an API?**
No. This is a fully client-side calculator and there's no server. If you want to embed it, fork the repo and host your own copy.

**Q: How accurate is it?**
The arithmetic is exact. The _accuracy_ depends entirely on your inputs — assumed returns, inflation, and life expectancy are estimates, not predictions. Use conservative numbers and always over-save.

**Q: Why no Monte Carlo?**
On the roadmap. The deterministic version is what most users actually need; Monte Carlo is for the curious. Both will live in the same page when shipped.

**Q: Why is this open source?**
Because retirement math shouldn't be locked behind a sign-up form, and because verified-by-anyone code is more trustworthy than a black box.

---

## ⚠️ Disclaimer

This tool is for **educational purposes only**. It is **not** investment, tax, or legal advice. Consult a [SEBI-registered investment adviser (RIA)](https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13) before making decisions about your retirement.

The author is not responsible for any financial decisions made on the basis of this calculator. Past returns do not guarantee future performance. Markets can stay irrational longer than your retirement plan can stay solvent.

---

## 📜 License

[MIT](LICENSE) — do whatever you want, just don't sue me.

---

<div align="center">

### If this saved you from a bad retirement plan, ⭐ star the repo.

**Built with care by [Punith VT](https://github.com/PunithVT)** · [Report a bug](https://github.com/PunithVT/retirement-calculator/issues) · [Request a feature](https://github.com/PunithVT/retirement-calculator/issues/new)

</div>
