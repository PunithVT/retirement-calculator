// Retirement Calculator — vanilla JS, no dependencies.
// All math runs locally; nothing leaves the browser.

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // -- State -----------------------------------------------------------------
  const state = { mode: "sip" };

  // -- Helpers ---------------------------------------------------------------
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

  const num = (id) => parseFloat($(id).value) || 0;

  // -- Mode toggle -----------------------------------------------------------
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
  // Returns { years: [{age, corpus, phase, expense?}], retireCorpus, lastsTill, endingCorpus, firstYearExpense }
  function simulate({
    currentAge, retirementAge, lifeExpectancy,
    monthlyExpense, preReturn, postReturn, inflation,
    existingCorpus, monthlySip, lumpsum, stepUpPct, mode,
  }) {
    const yearsToRetire = Math.max(0, retirementAge - currentAge);
    const retireYears = Math.max(0, lifeExpectancy - retirementAge);

    const r1 = preReturn / 100;       // pre-retirement return (annual)
    const r2 = postReturn / 100;      // post-retirement return (annual)
    const i = inflation / 100;        // inflation (annual)

    // --- Accumulation phase ---
    let corpus = existingCorpus;
    let sip = monthlySip;
    const stepUp = stepUpPct / 100;
    const monthlyR1 = Math.pow(1 + r1, 1 / 12) - 1;
    const series = [];
    series.push({ age: currentAge, corpus, phase: "acc" });

    if (mode === "lumpsum") {
      corpus += lumpsum;
    }

    for (let y = 1; y <= yearsToRetire; y++) {
      if (mode === "sip") {
        // 12 monthly contributions, compounded at monthly rate
        for (let m = 0; m < 12; m++) {
          corpus = corpus * (1 + monthlyR1) + sip;
        }
        sip = sip * (1 + stepUp);
      } else {
        corpus = corpus * (1 + r1);
      }
      series.push({ age: currentAge + y, corpus, phase: "acc" });
    }

    const retireCorpus = corpus;

    // First-year retirement expense in future rupees
    const firstYearExpense = monthlyExpense * 12 * Math.pow(1 + i, yearsToRetire);

    // --- Retirement phase ---
    let lastsTill = retirementAge; // in case money runs out immediately
    let yearOfDeath = lifeExpectancy;
    let endingCorpus = corpus;

    for (let y = 1; y <= retireYears; y++) {
      const yearExpense = firstYearExpense * Math.pow(1 + i, y - 1);
      // Withdraw at start of year, grow remainder
      corpus -= yearExpense;
      if (corpus < 0) {
        // Money ran out partway through this year
        // Estimate fractional year still funded
        const prevCorpus = corpus + yearExpense;
        const fraction = prevCorpus / yearExpense; // 0..1 of the year afforded
        lastsTill = retirementAge + (y - 1) + fraction;
        endingCorpus = corpus;
        // Push remaining years at 0 to keep chart length consistent
        series.push({ age: retirementAge + y, corpus: 0, phase: "ret", expense: yearExpense });
        for (let k = y + 1; k <= retireYears; k++) {
          series.push({ age: retirementAge + k, corpus: 0, phase: "short", expense: firstYearExpense * Math.pow(1 + i, k - 1) });
        }
        return {
          series,
          retireCorpus,
          firstYearExpense,
          lastsTill,
          endingCorpus,
          yearOfDeath,
          ranOut: true,
        };
      }
      corpus = corpus * (1 + r2);
      series.push({ age: retirementAge + y, corpus, phase: "ret", expense: yearExpense });
      lastsTill = retirementAge + y;
      endingCorpus = corpus;
    }

    return {
      series,
      retireCorpus,
      firstYearExpense,
      lastsTill,
      endingCorpus,
      yearOfDeath,
      ranOut: false,
    };
  }

  // -- Solve for additional SIP needed --------------------------------------
  function requiredAdditionalSip(inputs) {
    if (inputs.mode !== "sip") {
      // For lumpsum mode, solve for additional one-time amount instead
      return solveAdditionalLumpsum(inputs);
    }
    let lo = 0, hi = 1e7; // 0..1Cr/month upper bound
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

  // -- Render ----------------------------------------------------------------
  function render(inputs, sim, additionalNeeded) {
    const verdict = $("verdict");
    const verdictSub = $("verdictSub");
    const headline = $("resultHeadline");
    headline.classList.remove("ok", "warn", "bad");

    if (sim.ranOut) {
      const at = Math.floor(sim.lastsTill);
      headline.classList.add("bad");
      verdict.textContent = `Your money runs out at age ${at}.`;
      verdictSub.textContent = `You'd need ~${fmtINR(additionalNeeded)} ${inputs.mode === "sip" ? "more per month" : "extra lumpsum"} to last to ${inputs.lifeExpectancy}.`;
    } else {
      const surplus = sim.endingCorpus;
      if (surplus > sim.retireCorpus * 0.25) {
        headline.classList.add("ok");
        verdict.textContent = `You're set — corpus lasts past ${inputs.lifeExpectancy} with ${fmtINR(surplus)} left over.`;
        verdictSub.textContent = `Good buffer for healthcare emergencies, longer life expectancy, or legacy.`;
      } else {
        headline.classList.add("warn");
        verdict.textContent = `Tight but workable — your money lasts to ${inputs.lifeExpectancy}.`;
        verdictSub.textContent = `Limited margin for error. Consider a higher SIP or lower withdrawal.`;
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

    drawChart(sim);
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

    // Theme
    const css = getComputedStyle(document.body);
    const fg = css.getPropertyValue("--fg") || "#0b1220";
    const muted = css.getPropertyValue("--muted") || "#64748b";
    const border = css.getPropertyValue("--border") || "#e2e8f0";

    // Axes
    ctx.strokeStyle = border.trim();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + h);
    ctx.lineTo(PAD.left + w, PAD.top + h);
    ctx.stroke();

    // Y gridlines / labels
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

    // X labels (every ~5 years)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xStep = Math.max(1, Math.round((maxAge - minAge) / 8));
    for (let age = minAge; age <= maxAge; age += xStep) {
      const x = PAD.left + (w * (age - minAge)) / Math.max(1, maxAge - minAge);
      ctx.fillText(age, x, PAD.top + h + 8);
    }

    // Plot — split by phase to color differently
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

    // Need overlap between phases to keep line continuous
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
      preReturn: num("preReturn"),
      postReturn: num("postReturn"),
      inflation: num("inflation"),
      stepUpPct: num("stepUp"),
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
    render(inputs, sim, additional);
  }

  function init() {
    $("mode-sip").addEventListener("click", (e) => { e.preventDefault(); setMode("sip"); calculate(); });
    $("mode-lumpsum").addEventListener("click", (e) => { e.preventDefault(); setMode("lumpsum"); calculate(); });
    $("calc-form").addEventListener("submit", (e) => { e.preventDefault(); calculate(); });
    $("reset-btn").addEventListener("click", () => setTimeout(calculate, 0));

    // Live recalc on input
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
