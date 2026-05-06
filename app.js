// Retirement Calculator — vanilla JS, no dependencies.
// All math runs locally; nothing leaves the browser.

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = { mode: "sip" };

  const fmtINR = (n) => {
    if (!isFinite(n)) return "—";
    const abs = Math.abs(n);
    let v, suffix;
    if (abs >= 1e7) { v = n / 1e7; suffix = " Cr"; }
    else if (abs >= 1e5) { v = n / 1e5; suffix = " L"; }
    else { v = n; suffix = ""; }
    const formatted = v.toLocaleString("en-IN", {
      maximumFractionDigits: abs >= 1e7 || abs >= 1e5 ? 2 : 0,
    });
    return "₹" + formatted + suffix;
  };

  const fmtMult = (n) => isFinite(n) ? n.toFixed(1) + "×" : "—";
  const num = (id) => parseFloat($(id).value) || 0;

  function setMode(mode) {
    state.mode = mode;
    const sipBtn = $("mode-sip");
    const lumpBtn = $("mode-lumpsum");
    sipBtn.classList.toggle("active", mode === "sip");
    lumpBtn.classList.toggle("active", mode === "lumpsum");
    sipBtn.setAttribute("aria-selected", mode === "sip");
    lumpBtn.setAttribute("aria-selected", mode === "lumpsum");
    $("field-sip").classList.toggle("hidden", mode !== "sip");
    $("field-lumpsum").classList.toggle("hidden", mode !== "lumpsum");
  }

  // -- Core simulation -------------------------------------------------------
  function simulate(p) {
    const yearsToRetire = Math.max(0, p.retirementAge - p.currentAge);
    const retireYears = Math.max(0, p.lifeExpectancy - p.retirementAge);

    const r1 = p.preReturn / 100;
    const r2 = p.postReturn / 100;
    const i = p.inflation / 100;
    const ih = p.healthInflation / 100;
    const stepUp = p.stepUpPct / 100;
    const monthlyR1 = Math.pow(1 + r1, 1 / 12) - 1;

    let corpus = p.existingCorpus;
    let sip = p.monthlySip;
    let totalInvested = p.existingCorpus;
    let magicYear = null;          // first year where growth > contribution
    const series = [];
    series.push({ age: p.currentAge, corpus, phase: "acc" });

    if (p.mode === "lumpsum") {
      corpus += p.lumpsum;
      totalInvested += p.lumpsum;
    }

    for (let y = 1; y <= yearsToRetire; y++) {
      const startCorpus = corpus;
      let contributedThisYear = 0;

      if (p.mode === "sip") {
        for (let m = 0; m < 12; m++) {
          corpus = corpus * (1 + monthlyR1) + sip;
          contributedThisYear += sip;
        }
        if (p.annualTopUp > 0) {
          corpus += p.annualTopUp;
          contributedThisYear += p.annualTopUp;
        }
      } else {
        corpus = corpus * (1 + r1);
        if (p.annualTopUp > 0) {
          corpus += p.annualTopUp;
          contributedThisYear += p.annualTopUp;
        }
      }

      const grewBy = corpus - startCorpus - contributedThisYear;
      totalInvested += contributedThisYear;

      if (magicYear === null && contributedThisYear > 0 && grewBy > contributedThisYear) {
        magicYear = p.currentAge + y;
      }

      if (p.mode === "sip") sip = sip * (1 + stepUp);

      series.push({ age: p.currentAge + y, corpus, phase: "acc" });
    }

    const retireCorpus = corpus;
    const firstYearGen = p.monthlyExpense * 12 * Math.pow(1 + i, yearsToRetire);
    const firstYearHealth = p.monthlyHealth * 12 * Math.pow(1 + ih, yearsToRetire);
    const firstYearExpense = firstYearGen + firstYearHealth;

    let lastsTill = p.retirementAge;
    let endingCorpus = corpus;
    let finalYearExpense = firstYearExpense;

    for (let y = 1; y <= retireYears; y++) {
      const yGen = firstYearGen * Math.pow(1 + i, y - 1);
      const yHealth = firstYearHealth * Math.pow(1 + ih, y - 1);
      const yearExpense = yGen + yHealth;

      corpus -= yearExpense;
      if (corpus < 0) {
        const prevCorpus = corpus + yearExpense;
        const fraction = prevCorpus / yearExpense;
        lastsTill = p.retirementAge + (y - 1) + fraction;
        endingCorpus = corpus;
        series.push({ age: p.retirementAge + y, corpus: 0, phase: "ret", expense: yearExpense });
        for (let k = y + 1; k <= retireYears; k++) {
          const ekGen = firstYearGen * Math.pow(1 + i, k - 1);
          const ekHealth = firstYearHealth * Math.pow(1 + ih, k - 1);
          series.push({ age: p.retirementAge + k, corpus: 0, phase: "short", expense: ekGen + ekHealth });
        }
        return {
          series, retireCorpus, firstYearExpense, firstYearGen, firstYearHealth,
          lastsTill, endingCorpus, totalInvested, magicYear, finalYearExpense: yearExpense,
          ranOut: true,
        };
      }
      corpus = corpus * (1 + r2);
      series.push({ age: p.retirementAge + y, corpus, phase: "ret", expense: yearExpense });
      lastsTill = p.retirementAge + y;
      endingCorpus = corpus;
      finalYearExpense = yearExpense;
    }

    return {
      series, retireCorpus, firstYearExpense, firstYearGen, firstYearHealth,
      lastsTill, endingCorpus, totalInvested, magicYear, finalYearExpense,
      ranOut: false,
    };
  }

  function requiredAdditionalSip(inputs) {
    if (inputs.mode !== "sip") return solveAdditionalLumpsum(inputs);
    let lo = 0, hi = 1e7;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      const sim = simulate({ ...inputs, monthlySip: inputs.monthlySip + mid });
      if (sim.ranOut) lo = mid; else hi = mid;
      if (hi - lo < 100) break;
    }
    return Math.ceil(hi);
  }

  function solveAdditionalLumpsum(inputs) {
    let lo = 0, hi = 1e9;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      const sim = simulate({ ...inputs, lumpsum: inputs.lumpsum + mid });
      if (sim.ranOut) lo = mid; else hi = mid;
      if (hi - lo < 1000) break;
    }
    return Math.ceil(hi);
  }

  // -- Cost of starting late: extra monthly SIP needed if you delay 10 yrs --
  function solveStartingLate(inputs, delayYears = 10) {
    if (inputs.mode !== "sip") return null;
    const lateInputs = {
      ...inputs,
      currentAge: inputs.currentAge + delayYears,
      existingCorpus: 0,           // assume late starter has nothing yet
      monthlySip: 0,
    };
    if (lateInputs.currentAge >= lateInputs.retirementAge - 2) return null;
    let lo = 0, hi = 5e6;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      const sim = simulate({ ...lateInputs, monthlySip: mid });
      if (sim.ranOut) lo = mid; else hi = mid;
      if (hi - lo < 500) break;
    }
    return Math.ceil(hi);
  }

  // -- Render ----------------------------------------------------------------
  function render(inputs, sim, additionalNeeded, costLate) {
    const verdict = $("verdict");
    const verdictSub = $("verdictSub");
    const headline = $("resultHeadline");
    headline.classList.remove("ok", "warn", "bad");

    if (sim.ranOut) {
      const at = Math.floor(sim.lastsTill);
      headline.classList.add("bad");
      verdict.textContent = `Plan at risk — money runs out at age ${at}.`;
      verdictSub.textContent = `You'd need ${fmtINR(additionalNeeded)} ${inputs.mode === "sip" ? "more per month" : "extra lumpsum"} to last to ${inputs.lifeExpectancy}.`;
    } else {
      const surplus = sim.endingCorpus;
      if (surplus > sim.retireCorpus * 0.25) {
        headline.classList.add("ok");
        verdict.textContent = `On track — corpus lasts past ${inputs.lifeExpectancy} with ${fmtINR(surplus)} legacy left.`;
        verdictSub.textContent = `Comfortable buffer for healthcare emergencies, longer life, or inheritance.`;
      } else {
        headline.classList.add("warn");
        verdict.textContent = `Tight but workable — money lasts to ${inputs.lifeExpectancy}.`;
        verdictSub.textContent = `Limited margin for error. Consider raising SIP or trimming expected lifestyle.`;
      }
    }

    $("corpusAtRetirement").textContent = fmtINR(sim.retireCorpus);
    $("corpusAtRetirementSub").textContent = `at age ${inputs.retirementAge}`;
    $("firstYearExpense").textContent = fmtINR(sim.firstYearExpense);
    $("firstYearExpenseSub").textContent = `${fmtINR(sim.firstYearExpense / 12)}/mo in year 1 of retirement`;

    if (sim.ranOut) {
      const at = Math.floor(sim.lastsTill);
      $("lastsTill").textContent = `${at}`;
      $("lastsTillSub").textContent = `${inputs.lifeExpectancy - at} years short`;
    } else {
      $("lastsTill").textContent = `${inputs.lifeExpectancy}+`;
      $("lastsTillSub").textContent = `corpus survives full plan`;
    }

    if (sim.ranOut) {
      $("shortfall").textContent = "Shortfall";
      $("shortfallSub").textContent = `Need more savings`;
    } else {
      $("shortfall").textContent = fmtINR(sim.endingCorpus);
      $("shortfallSub").textContent = `surplus at age ${inputs.lifeExpectancy}`;
    }

    if (sim.ranOut) {
      $("requiredSip").textContent = inputs.mode === "sip"
        ? fmtINR(additionalNeeded) + "/mo"
        : fmtINR(additionalNeeded);
      $("requiredSipSub").textContent = inputs.mode === "sip"
        ? "extra monthly SIP to last to plan"
        : "extra lumpsum to last to plan";
    } else {
      $("requiredSip").textContent = "₹0";
      $("requiredSipSub").textContent = "you're on track";
    }

    // Secondary stats
    if (sim.magicYear) {
      $("magicYear").textContent = `Age ${sim.magicYear}`;
      $("magicYearSub").textContent = `growth first overtakes contributions`;
    } else {
      $("magicYear").textContent = "—";
      $("magicYearSub").textContent = `not reached before retirement`;
    }

    const mult = sim.totalInvested > 0 ? sim.retireCorpus / sim.totalInvested : 0;
    $("wealthMultiplier").textContent = fmtMult(mult);
    $("wealthMultiplierSub").textContent = `${fmtINR(sim.retireCorpus)} from ${fmtINR(sim.totalInvested)}`;

    $("finalYearWithdraw").textContent = fmtINR(sim.finalYearExpense / 12);
    $("finalYearWithdrawSub").textContent = sim.ranOut
      ? `monthly need when money ran out`
      : `monthly need at age ${inputs.lifeExpectancy}`;

    $("totalInvested").textContent = fmtINR(sim.totalInvested);
    $("totalInvestedSub").textContent = inputs.mode === "sip"
      ? `over ${inputs.retirementAge - inputs.currentAge} years of saving`
      : `lumpsum + existing + top-ups`;

    if (costLate !== null && costLate !== undefined) {
      $("costOfDelay").textContent = fmtINR(costLate) + "/mo";
      const ratio = inputs.monthlySip > 0 ? (costLate / inputs.monthlySip) : 0;
      $("costOfDelaySub").textContent = ratio > 0
        ? `≈ ${ratio.toFixed(1)}× your current SIP — that's the price of waiting`
        : `extra monthly SIP needed if you start at ${inputs.currentAge + 10}`;
    } else {
      $("costOfDelay").textContent = "—";
      $("costOfDelaySub").textContent = `enable SIP mode to see`;
    }

    renderBreakdown(inputs, sim);
    drawChart(sim);
  }

  // -- Year-1 expense category breakdown -------------------------------------
  function renderBreakdown(inputs, sim) {
    $("bdGenToday").textContent = inputs.monthlyExpense.toLocaleString("en-IN");
    $("bdHealthToday").textContent = inputs.monthlyHealth.toLocaleString("en-IN");
    $("bdYears").textContent = Math.max(0, inputs.retirementAge - inputs.currentAge);

    // Synthesize a typical Indian retirement spend split from the general expense,
    // then show healthcare separately (it's already inflated separately).
    const genFutureMonth = sim.firstYearGen / 12;
    const healthFutureMonth = sim.firstYearHealth / 12;

    // Typical breakdown of "general" spend (rough heuristic for visualisation).
    const cats = [
      { name: "Food & Groceries",   share: 0.40, color: "#22c55e" },
      { name: "Utilities & Housing", share: 0.30, color: "#0ea5e9" },
      { name: "Leisure & Travel",   share: 0.20, color: "#a78bfa" },
      { name: "Emergency Buffer",   share: 0.10, color: "#94a3b8" },
    ];

    const list = $("bdList");
    list.innerHTML = "";
    const total = genFutureMonth + healthFutureMonth;

    // Healthcare row first (its own inflation rate makes it the standout)
    list.appendChild(bdRow("Healthcare (10% inflation)", healthFutureMonth, total, "#ef4444"));
    cats.forEach((c) => {
      list.appendChild(bdRow(c.name, genFutureMonth * c.share, total, c.color));
    });
  }

  function bdRow(name, monthly, total, color) {
    const li = document.createElement("li");
    li.className = "bd-row";
    const pct = total > 0 ? Math.round((monthly / total) * 100) : 0;
    li.innerHTML = `
      <div class="bd-row-head">
        <span class="bd-name"><i class="sw" style="background:${color}"></i>${name}</span>
        <span class="bd-amt">${fmtINR(monthly)}<span class="bd-pct">${pct}%</span></span>
      </div>
      <div class="bd-bar"><div class="bd-fill" style="width:${pct}%;background:${color}"></div></div>
    `;
    return li;
  }

  // -- Chart (canvas) --------------------------------------------------------
  function drawChart(sim) {
    const canvas = $("chart");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const cssW = canvas.clientWidth || 900;
    const cssH = 320;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const PAD = { top: 20, right: 20, bottom: 36, left: 70 };
    const w = cssW - PAD.left - PAD.right;
    const h = cssH - PAD.top - PAD.bottom;

    const data = sim.series;
    if (!data.length) return;

    const minAge = data[0].age;
    const maxAge = data[data.length - 1].age;
    const maxCorpus = Math.max(...data.map(d => d.corpus), 1);

    const css = getComputedStyle(document.body);
    const fg = css.getPropertyValue("--fg") || "#0b1220";
    const muted = css.getPropertyValue("--muted") || "#64748b";
    const border = css.getPropertyValue("--border") || "#e2e8f0";

    ctx.strokeStyle = border.trim();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + h);
    ctx.lineTo(PAD.left + w, PAD.top + h);
    ctx.stroke();

    ctx.fillStyle = muted.trim();
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const v = (maxCorpus / ticks) * t;
      const y = PAD.top + h - (h * t) / ticks;
      ctx.strokeStyle = border.trim() + "80";
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + w, y);
      ctx.stroke();
      ctx.fillText(fmtINR(v), PAD.left - 8, y);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xStep = Math.max(1, Math.round((maxAge - minAge) / 8));
    for (let age = minAge; age <= maxAge; age += xStep) {
      const x = PAD.left + (w * (age - minAge)) / Math.max(1, maxAge - minAge);
      ctx.fillText(age, x, PAD.top + h + 8);
    }

    const xFor = (age) => PAD.left + (w * (age - minAge)) / Math.max(1, maxAge - minAge);
    const yFor = (v) => PAD.top + h - (h * v) / maxCorpus;

    const drawSegment = (filterFn, color, fill = true) => {
      const pts = data.filter(filterFn);
      if (pts.length < 2) return;
      ctx.beginPath();
      pts.forEach((d, idx) => {
        const x = xFor(d.age), y = yFor(d.corpus);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      if (fill) {
        ctx.lineTo(xFor(pts[pts.length - 1].age), PAD.top + h);
        ctx.lineTo(xFor(pts[0].age), PAD.top + h);
        ctx.closePath();
        ctx.fillStyle = color + "22";
        ctx.fill();
      }
    };

    const accIdx = data.findIndex(d => d.phase !== "acc");
    if (accIdx > 0) {
      drawSegment((_, i) => i <= accIdx, "#22c55e");
    } else {
      drawSegment(d => d.phase === "acc", "#22c55e");
    }
    drawSegment(d => d.phase === "ret", "#0ea5e9");
    drawSegment(d => d.phase === "short", "#ef4444", false);

    // Retirement age marker
    const retAge = data.find(d => d.phase === "ret")?.age ?? null;
    if (retAge) {
      const x = xFor(retAge);
      ctx.strokeStyle = muted.trim() + "80";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = fg.trim();
      ctx.textAlign = "left";
      ctx.fillText("retirement", x + 4, PAD.top + 4);
    }

    // Magic Year marker
    if (sim.magicYear && sim.magicYear >= minAge && sim.magicYear <= maxAge) {
      const x = xFor(sim.magicYear);
      ctx.strokeStyle = "#f59e0b";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#f59e0b";
      ctx.textAlign = "left";
      ctx.fillText("magic year", x + 4, PAD.top + 18);
    }
  }

  // -- Event wiring ----------------------------------------------------------
  function readInputs() {
    return {
      mode: state.mode,
      currentAge: num("currentAge"),
      retirementAge: num("retirementAge"),
      lifeExpectancy: num("lifeExpectancy"),
      monthlySip: num("monthlySip"),
      lumpsum: num("lumpsum"),
      existingCorpus: num("existingCorpus"),
      monthlyExpense: num("monthlyExpense"),
      monthlyHealth: num("monthlyHealth"),
      preReturn: num("preReturn"),
      postReturn: num("postReturn"),
      inflation: num("inflation"),
      healthInflation: num("healthInflation"),
      stepUpPct: num("stepUp"),
      annualTopUp: num("annualTopUp"),
    };
  }

  function validate(inputs) {
    if (inputs.retirementAge <= inputs.currentAge) {
      alert("Retirement age must be greater than current age.");
      return false;
    }
    if (inputs.lifeExpectancy <= inputs.retirementAge) {
      alert("Life expectancy must be greater than retirement age.");
      return false;
    }
    return true;
  }

  function calculate() {
    const inputs = readInputs();
    if (!validate(inputs)) return;
    const sim = simulate(inputs);
    const additional = sim.ranOut ? requiredAdditionalSip(inputs) : 0;
    const costLate = solveStartingLate(inputs, 10);
    render(inputs, sim, additional, costLate);
  }

  function bindPresets() {
    const buttons = document.querySelectorAll(".preset");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        $("monthlyExpense").value = btn.dataset.gen;
        $("monthlyHealth").value = btn.dataset.health;
        calculate();
      });
    });
  }

  function init() {
    $("mode-sip").addEventListener("click", (e) => { e.preventDefault(); setMode("sip"); calculate(); });
    $("mode-lumpsum").addEventListener("click", (e) => { e.preventDefault(); setMode("lumpsum"); calculate(); });
    $("calc-form").addEventListener("submit", (e) => { e.preventDefault(); calculate(); });
    $("reset-btn").addEventListener("click", () => setTimeout(calculate, 0));

    document.querySelectorAll("#calc-form input").forEach((el) => {
      el.addEventListener("input", () => {
        clearTimeout(window.__rcTimer);
        window.__rcTimer = setTimeout(calculate, 250);
      });
    });

    window.addEventListener("resize", () => {
      clearTimeout(window.__rcResize);
      window.__rcResize = setTimeout(calculate, 150);
    });

    bindPresets();
    $("year").textContent = new Date().getFullYear();

    setMode("sip");
    calculate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
