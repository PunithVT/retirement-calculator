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
    // Withdrawal step-up: how the year-over-year retirement withdrawal grows.
    // Default = general inflation (the typical retirement model), but
    // overridable so users can stress-test "flat withdrawals" or "above CPI".
    const wStep = (p.withdrawalStepUp != null && !isNaN(p.withdrawalStepUp))
      ? p.withdrawalStepUp / 100
      : i;
    const monthlyR1 = Math.pow(1 + r1, 1 / 12) - 1;

    let corpus = p.existingCorpus;
    let sip = p.monthlySip;
    let totalInvested = p.existingCorpus;
    let magicYear = null;
    let magicYearReturns = 0;
    let magicYearContrib = 0;
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
        magicYearReturns = grewBy;
        magicYearContrib = contributedThisYear;
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
      // General expenses grow at withdrawal step-up; healthcare keeps its own (typically higher) rate.
      const yGen = firstYearGen * Math.pow(1 + wStep, y - 1);
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
          const ekGen = firstYearGen * Math.pow(1 + wStep, k - 1);
          const ekHealth = firstYearHealth * Math.pow(1 + ih, k - 1);
          series.push({ age: p.retirementAge + k, corpus: 0, phase: "short", expense: ekGen + ekHealth });
        }
        return {
          series, retireCorpus, firstYearExpense, firstYearGen, firstYearHealth,
          lastsTill, endingCorpus, totalInvested,
          magicYear, magicYearReturns, magicYearContrib,
          finalYearExpense: yearExpense,
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
      lastsTill, endingCorpus, totalInvested,
      magicYear, magicYearReturns, magicYearContrib,
      finalYearExpense,
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
  function render(inputs, sim, additionalNeeded, costLate, flatSim) {
    // Inflation projection banner: ₹X today → ₹Y in N years
    const yrs = Math.max(0, inputs.retirementAge - inputs.currentAge);
    const totalToday = (inputs.monthlyExpense || 0) + (inputs.monthlyHealth || 0);
    const totalRetire = sim.firstYearExpense / 12;
    const infBanner = $("inflationBanner");
    if (infBanner) {
      $("ibToday").textContent = fmtINR(totalToday);
      $("ibFuture").textContent = fmtINR(totalRetire);
      $("ibYears").textContent = yrs;
      $("ibInf").textContent = inputs.inflation;
    }

    // Magic Year banner
    const myBanner = $("magicYearBanner");
    if (myBanner) {
      if (sim.magicYear) {
        myBanner.classList.remove("hidden");
        $("myAge").textContent = sim.magicYear;
        $("myReturns").textContent = fmtINR(sim.magicYearReturns);
        $("myContrib").textContent = fmtINR(sim.magicYearContrib);
      } else {
        myBanner.classList.add("hidden");
      }
    }

    // Harvest section: starting monthly withdrawal
    const harvestStart = $("harvestStart");
    if (harvestStart) {
      $("harvestStart").textContent = fmtINR(sim.firstYearExpense / 12);
      $("harvestStartCalc").textContent = `${fmtINR(totalToday)}/mo today × ${inputs.inflation}% inflation × ${yrs} years`;
    }

    // Step-up vs flat delta
    const flatBox = $("flatCompareBox");
    if (flatBox) {
      if (flatSim && inputs.stepUpPct > 0) {
        const delta = sim.retireCorpus - flatSim.retireCorpus;
        flatBox.classList.remove("hidden");
        $("flatWith").textContent = fmtINR(sim.retireCorpus);
        $("flatWithout").textContent = fmtINR(flatSim.retireCorpus);
        $("flatDelta").textContent = (delta >= 0 ? "+" : "") + fmtINR(delta);
        $("flatStepPct").textContent = inputs.stepUpPct;
      } else {
        flatBox.classList.add("hidden");
      }
    }

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
    drawChart(sim, flatSim);
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
  // Module-scoped state so hover redraws don't have to recompute geometry.
  let chartCtx = null;

  function drawChart(sim, flatSim) {
    const canvas = $("chart");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const cssW = canvas.clientWidth || 900;
    const cssH = cssW < 480 ? 260 : 340;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const PAD = { top: 28, right: 24, bottom: 38, left: 64 };
    const w = cssW - PAD.left - PAD.right;
    const h = cssH - PAD.top - PAD.bottom;

    const data = sim.series;
    if (!data.length) return;

    const minAge = data[0].age;
    const maxAge = data[data.length - 1].age;
    const flatData = flatSim ? flatSim.series : null;
    const maxCorpus = Math.max(
      ...data.map(d => d.corpus),
      flatData ? Math.max(...flatData.map(d => d.corpus)) : 0,
      1,
    );

    const css = getComputedStyle(document.body);
    const fg = (css.getPropertyValue("--fg") || "#0b1220").trim();
    const muted = (css.getPropertyValue("--muted") || "#64748b").trim();
    const border = (css.getPropertyValue("--border") || "#e2e8f0").trim();
    const bgAlt = (css.getPropertyValue("--bg-alt") || "#f1f5f9").trim();

    const xFor = (age) => PAD.left + (w * (age - minAge)) / Math.max(1, maxAge - minAge);
    const yFor = (v) => PAD.top + h - (h * Math.max(0, v)) / maxCorpus;

    // Persist what hover() needs
    chartCtx = {
      canvas, ctx, dpr,
      cssW, cssH,
      PAD, w, h,
      data, flatData,
      minAge, maxAge, maxCorpus,
      sim, flatSim,
      xFor, yFor,
      colors: { fg, muted, border, bgAlt },
      hoverAge: null,
    };

    paint();
    bindHover();
  }

  function paint() {
    const c = chartCtx;
    if (!c) return;
    const { ctx, cssW, cssH, PAD, w, h, data, flatData, minAge, maxAge, maxCorpus,
            sim, xFor, yFor, colors } = c;

    ctx.clearRect(0, 0, cssW, cssH);

    // Y gridlines (round nice ticks)
    const niceMax = niceCeil(maxCorpus);
    const tickCount = 4;
    ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    for (let t = 0; t <= tickCount; t++) {
      const v = (niceMax / tickCount) * t;
      const y = PAD.top + h - (h * v) / maxCorpus;
      ctx.strokeStyle = colors.border + "60";
      ctx.lineWidth = 1;
      ctx.setLineDash(t === 0 ? [] : [2, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + w, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = colors.muted;
      ctx.textAlign = "right";
      ctx.fillText(fmtINR(v), PAD.left - 10, y);
    }

    // X axis labels at round 5-year intervals (or finer if range is small)
    const span = maxAge - minAge;
    const desired = cssW < 480 ? 4 : (cssW < 720 ? 6 : 9);
    const stepRaw = span / desired;
    const xStep = stepRaw <= 1 ? 1 : stepRaw <= 2 ? 2 : stepRaw <= 5 ? 5 : 10;
    const startTick = Math.ceil(minAge / xStep) * xStep;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = colors.muted;
    for (let age = startTick; age <= maxAge; age += xStep) {
      const x = xFor(age);
      ctx.fillText(age, x, PAD.top + h + 10);
    }

    // Phase background bands (very subtle): retirement gets a light blue band
    const retAge = (data.find(d => d.phase === "ret") || {}).age;
    if (retAge != null) {
      ctx.fillStyle = "#0ea5e911";
      ctx.fillRect(xFor(retAge), PAD.top, (xFor(maxAge) - xFor(retAge)), h);
    }

    // Flat / no step-up comparison (behind main)
    if (flatData) {
      const flatAcc = flatData.filter(d => d.phase === "acc");
      if (flatAcc.length > 1) {
        ctx.strokeStyle = colors.muted;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        flatAcc.forEach((d, i) => {
          const x = xFor(d.age), y = yFor(d.corpus);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // ---------------- Main corpus line: smooth via Catmull-Rom -> bezier ---
    // Combine accumulation + retirement (excluding zero-padded short tail) into one sequence,
    // so the green-to-blue transition is seamless. Fill below with a colour gradient.
    const live = data.filter(d => d.phase !== "short" && d.corpus > 0);
    const shortTail = data.filter(d => d.phase === "short");

    if (live.length > 1) {
      // Fill area first
      const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + h);
      grad.addColorStop(0, "#22c55e44");
      grad.addColorStop(1, "#22c55e08");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(xFor(live[0].age), PAD.top + h);
      smoothPath(ctx, live, xFor, yFor);
      ctx.lineTo(xFor(live[live.length - 1].age), PAD.top + h);
      ctx.closePath();
      ctx.fill();

      // Stroke accumulation in green up to retirement, retirement in blue after
      const accLive = live.filter(d => d.phase === "acc");
      const retLive = live.filter(d => d.phase === "ret");

      if (accLive.length > 1) {
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        smoothPath(ctx, accLive, xFor, yFor, true);
        ctx.stroke();
      }
      if (retLive.length > 1) {
        // Connect retirement segment to last accumulation point so there's no gap.
        const conn = accLive.length ? [accLive[accLive.length - 1], ...retLive] : retLive;
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        smoothPath(ctx, conn, xFor, yFor, true);
        ctx.stroke();
      }
    }

    // Shortfall: clean red zero-line + fade-out box, no floating dashed line
    if (shortTail.length) {
      const x0 = xFor(shortTail[0].age);
      const x1 = xFor(shortTail[shortTail.length - 1].age);
      ctx.fillStyle = "#ef444420";
      ctx.fillRect(x0, PAD.top, x1 - x0, h);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x0, PAD.top + h - 0.5);
      ctx.lineTo(x1, PAD.top + h - 0.5);
      ctx.stroke();
    }

    // Vertical markers ------------------------------------------------------
    // Retirement
    if (retAge != null) {
      const x = xFor(retAge);
      ctx.strokeStyle = colors.muted + "AA";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + h); ctx.stroke();
      ctx.setLineDash([]);
      drawTag(ctx, x, PAD.top - 2, `Retire @ ${retAge}`, colors.fg, colors.bgAlt, colors.border);
    }

    // Magic Year
    if (sim.magicYear && sim.magicYear >= minAge && sim.magicYear <= maxAge) {
      const x = xFor(sim.magicYear);
      ctx.strokeStyle = "#f59e0b";
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, PAD.top + h); ctx.stroke();
      ctx.setLineDash([]);
      drawTag(ctx, x, PAD.top - 2, `Magic Yr ${sim.magicYear}`, "#f59e0b", "#fff7ed", "#fde68a");
    }

    // Peak corpus marker
    let peak = data[0];
    data.forEach(d => { if (d.corpus > peak.corpus) peak = d; });
    if (peak && peak.corpus > 0) {
      const px = xFor(peak.age), py = yFor(peak.corpus);
      ctx.fillStyle = "#16a34a";
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Avoid labelling if peak is at retirement (already labelled there)
      if (Math.abs(peak.age - retAge) > 0) {
        const lbl = `Peak ${fmtINR(peak.corpus)}`;
        ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
        const tw = ctx.measureText(lbl).width + 12;
        const lx = Math.min(PAD.left + w - tw, Math.max(PAD.left, px - tw / 2));
        drawTag(ctx, lx + tw / 2, py - 14, lbl, "#15803d", "#dcfce7", "#86efac");
      }
    }

    // Money runs out marker
    if (sim.ranOut) {
      const ageOut = Math.floor(sim.lastsTill);
      const x = xFor(ageOut);
      const y = PAD.top + h;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      drawTag(ctx, x, y - 24, `Runs out @ ${ageOut}`, "#b91c1c", "#fee2e2", "#fca5a5");
    }

    // Hover indicator on top of everything
    drawHover();
  }

  // ----- helpers ------------------------------------------------------------
  function smoothPath(ctx, pts, xFor, yFor, beginIsMove) {
    // Catmull-Rom -> Bezier conversion. Smooth curve through all points.
    if (pts.length < 2) return;
    const X = pts.map(p => xFor(p.age));
    const Y = pts.map(p => yFor(p.corpus));
    if (beginIsMove) ctx.moveTo(X[0], Y[0]);
    else ctx.lineTo(X[0], Y[0]);
    for (let i = 0; i < pts.length - 1; i++) {
      const x0 = X[i - 1] !== undefined ? X[i - 1] : X[i];
      const y0 = Y[i - 1] !== undefined ? Y[i - 1] : Y[i];
      const x1 = X[i], y1 = Y[i];
      const x2 = X[i + 1], y2 = Y[i + 1];
      const x3 = X[i + 2] !== undefined ? X[i + 2] : x2;
      const y3 = Y[i + 2] !== undefined ? Y[i + 2] : y2;
      const cp1x = x1 + (x2 - x0) / 6;
      const cp1y = y1 + (y2 - y0) / 6;
      const cp2x = x2 - (x3 - x1) / 6;
      const cp2y = y2 - (y3 - y1) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    }
  }

  function niceCeil(v) {
    if (v <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    const m = v / exp;
    let nm;
    if (m <= 1) nm = 1;
    else if (m <= 2) nm = 2;
    else if (m <= 2.5) nm = 2.5;
    else if (m <= 5) nm = 5;
    else nm = 10;
    return nm * exp;
  }

  function drawTag(ctx, cx, cy, text, fg, bg, stroke) {
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    const padX = 6, padY = 3;
    const tw = ctx.measureText(text).width;
    const w = tw + padX * 2;
    const h = 18;
    const x = Math.max(cx - w / 2, 2);
    const y = Math.max(cy - h, 2);
    ctx.fillStyle = bg;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + padX, y + h / 2 + 0.5);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // -- Hover tooltip ---------------------------------------------------------
  function bindHover() {
    if (!chartCtx) return;
    const { canvas } = chartCtx;
    if (canvas.__rcHoverBound) return;
    canvas.__rcHoverBound = true;
    canvas.addEventListener("mousemove", onHover);
    canvas.addEventListener("touchmove", (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      onHover({ clientX: t.clientX, clientY: t.clientY, target: canvas });
    }, { passive: true });
    canvas.addEventListener("mouseleave", () => {
      if (chartCtx) { chartCtx.hoverAge = null; paint(); hideTip(); }
    });
  }

  function onHover(e) {
    if (!chartCtx) return;
    const { canvas, PAD, w, minAge, maxAge } = chartCtx;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    if (cx < PAD.left || cx > PAD.left + w) {
      chartCtx.hoverAge = null;
      paint();
      hideTip();
      return;
    }
    const age = Math.round(minAge + ((cx - PAD.left) / w) * (maxAge - minAge));
    chartCtx.hoverAge = Math.max(minAge, Math.min(maxAge, age));
    paint();
    showTip(rect);
  }

  function drawHover() {
    const c = chartCtx;
    if (!c || c.hoverAge == null) return;
    const { ctx, PAD, h, xFor, yFor, data, flatData, colors } = c;
    const point = data.find(d => d.age === c.hoverAge) || data[data.length - 1];
    const x = xFor(point.age);
    ctx.strokeStyle = colors.muted + "AA";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, PAD.top);
    ctx.lineTo(x, PAD.top + h);
    ctx.stroke();
    ctx.setLineDash([]);
    if (point.corpus > 0) {
      const y = yFor(point.corpus);
      ctx.fillStyle = point.phase === "acc" ? "#16a34a" : "#0ea5e9";
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (flatData) {
      const fp = flatData.find(d => d.age === c.hoverAge);
      if (fp && fp.corpus > 0) {
        const y = yFor(fp.corpus);
        ctx.fillStyle = colors.muted;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function showTip(rect) {
    const c = chartCtx;
    if (!c || c.hoverAge == null) return;
    const tip = ensureTip();
    const { data, flatData, sim, xFor, PAD, w } = c;
    const point = data.find(d => d.age === c.hoverAge) || data[data.length - 1];
    const flat = flatData ? flatData.find(d => d.age === c.hoverAge) : null;
    const phaseLabel =
      point.phase === "acc" ? "Building" :
      point.phase === "ret" ? "Drawing down" :
      point.phase === "short" ? "Money out" : "";

    const lines = [
      `<div class="tip-age">Age ${point.age}<span class="tip-phase">${phaseLabel}</span></div>`,
      `<div class="tip-row"><span>Corpus</span><strong>${fmtINR(point.corpus)}</strong></div>`,
    ];
    if (point.expense != null) {
      lines.push(`<div class="tip-row"><span>Yearly draw</span><strong>${fmtINR(point.expense)}</strong></div>`);
    }
    if (flat && flat.corpus > 0 && point.phase === "acc") {
      lines.push(`<div class="tip-row tip-flat"><span>Flat (no step-up)</span><strong>${fmtINR(flat.corpus)}</strong></div>`);
    }
    tip.innerHTML = lines.join("");
    tip.classList.add("visible");

    // Position tip
    const x = xFor(point.age);
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    let leftPx = rect.left + window.scrollX + x - tipW / 2;
    leftPx = Math.max(rect.left + window.scrollX + 4, Math.min(rect.left + window.scrollX + rect.width - tipW - 4, leftPx));
    let topPx = rect.top + window.scrollY + PAD.top - tipH - 8;
    if (topPx < window.scrollY + 4) topPx = rect.top + window.scrollY + PAD.top + 14;
    tip.style.left = leftPx + "px";
    tip.style.top = topPx + "px";
  }

  function ensureTip() {
    let tip = document.getElementById("rc-chart-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "rc-chart-tip";
      tip.className = "rc-chart-tip";
      document.body.appendChild(tip);
    }
    return tip;
  }
  function hideTip() {
    const tip = document.getElementById("rc-chart-tip");
    if (tip) tip.classList.remove("visible");
  }

  // -- Event wiring ----------------------------------------------------------
  function readInputs() {
    const wInput = $("withdrawalStepUp");
    const wRaw = wInput && wInput.value !== "" ? parseFloat(wInput.value) : NaN;
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
      withdrawalStepUp: isNaN(wRaw) ? null : wRaw,
    };
  }

  // Non-blocking validation — paints inline error markers and returns
  // whether the inputs form a valid retirement plan to simulate.
  function validate(inputs) {
    const errors = {};
    // Only flag age relationships when both values are filled in plausibly,
    // so users can keep typing without being interrupted mid-entry.
    if (inputs.currentAge >= 18 && inputs.retirementAge > 0 &&
        inputs.retirementAge <= inputs.currentAge) {
      errors.retirementAge = "Must be greater than current age";
    }
    if (inputs.retirementAge > 0 && inputs.lifeExpectancy > 0 &&
        inputs.lifeExpectancy <= inputs.retirementAge) {
      errors.lifeExpectancy = "Must be greater than retirement age";
    }
    paintFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function paintFieldErrors(errors) {
    ["currentAge", "retirementAge", "lifeExpectancy"].forEach((id) => {
      const input = $(id);
      if (!input) return;
      const wrap = input.closest(".field");
      const msg = errors[id];
      if (wrap) wrap.classList.toggle("field-invalid", !!msg);
      let errEl = wrap && wrap.querySelector(".field-error");
      if (msg) {
        if (!errEl) {
          errEl = document.createElement("small");
          errEl.className = "field-error";
          errEl.setAttribute("role", "alert");
          wrap.appendChild(errEl);
        }
        errEl.textContent = msg;
      } else if (errEl) {
        errEl.remove();
      }
    });
  }

  function calculate() {
    const inputs = readInputs();
    // If the age relationships aren't valid, surface the inline error
    // and skip the simulation — but never alert() and never block typing.
    if (!validate(inputs)) return;
    const sim = simulate(inputs);
    const additional = sim.ranOut ? requiredAdditionalSip(inputs) : 0;
    const costLate = solveStartingLate(inputs, 10);

    // Comparison: same inputs but with step-up disabled (flat SIP).
    // We only need the accumulation-phase corpus over time, not the retirement run.
    let flatSim = null;
    if (inputs.mode === "sip" && inputs.stepUpPct > 0) {
      flatSim = simulate({ ...inputs, stepUpPct: 0 });
    }

    render(inputs, sim, additional, costLate, flatSim);
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
        // Longer debounce on the age fields so the user can finish typing
        // before validation flags an incomplete relationship.
        const delay = ["currentAge", "retirementAge", "lifeExpectancy"].includes(el.id) ? 600 : 350;
        window.__rcTimer = setTimeout(calculate, delay);
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
