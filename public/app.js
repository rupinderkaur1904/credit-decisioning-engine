const API_BASE = '';

/* ============================================================
   Tabs
   ============================================================ */

const tabs = document.querySelectorAll('.tab');
const panels = {
  simulate: document.getElementById('panel-simulate'),
  workflow: document.getElementById('panel-workflow')
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      t.classList.remove('is-active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');

    Object.values(panels).forEach((p) => p.classList.remove('is-active'));
    panels[tab.dataset.tab].classList.add('is-active');
  });
});

/* ============================================================
   Shared helpers
   ============================================================ */

function formatCurrency(value) {
  return '₹' + Number(value).toLocaleString('en-IN');
}

async function postJSON(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, data };
  }
  return data;
}

async function getJSON(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const data = await response.json();
  if (!response.ok) {
    throw { status: response.status, data };
  }
  return data;
}

/* ============================================================
   Gauge (semicircle, score range -90..90)
   ============================================================ */

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const GAUGE_CX = 150;
const GAUGE_CY = 150;
const GAUGE_R = 110;

document.getElementById('gauge-track').setAttribute(
  'd',
  describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, 360)
);

function scoreToAngle(score) {
  // score -90..90  ->  angle 180..360 (SVG angle: 180=left, 270=top, 360=right)
  const clamped = Math.max(-90, Math.min(90, score));
  return 270 + clamped;
}

function colorForScore(score) {
  if (score >= 40) return getComputedStyle(document.documentElement).getPropertyValue('--positive').trim();
  if (score >= 0) return getComputedStyle(document.documentElement).getPropertyValue('--neutral').trim();
  return getComputedStyle(document.documentElement).getPropertyValue('--negative').trim();
}

function updateGauge(score) {
  const angle = scoreToAngle(score);
  const progressPath = document.getElementById('gauge-progress');
  progressPath.setAttribute('d', describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, angle));
  progressPath.style.stroke = colorForScore(score);

  const needle = document.getElementById('gauge-needle');
  needle.style.transform = `rotate(${score}deg)`;

  document.getElementById('score-number').textContent = score;
  document.getElementById('score-number').style.color = colorForScore(score);
}

/* ============================================================
   Simulator
   ============================================================ */

const sliders = {
  income: document.getElementById('s-income'),
  debt: document.getElementById('s-debt'),
  credit: document.getElementById('s-credit'),
  loan: document.getElementById('s-loan'),
  tenure: document.getElementById('s-tenure')
};

function syncSliderLabels() {
  document.getElementById('v-income').textContent = formatCurrency(sliders.income.value);
  document.getElementById('v-debt').textContent = formatCurrency(sliders.debt.value);
  document.getElementById('v-credit').textContent = sliders.credit.value;
  document.getElementById('v-loan').textContent = formatCurrency(sliders.loan.value);
  document.getElementById('v-tenure').textContent = `${sliders.tenure.value} months`;
}

function renderFactors(factors) {
  const container = document.getElementById('sim-factors');
  container.innerHTML = '';

  const labels = {
    debt_to_income_ratio: 'Debt-to-Income',
    credit_score: 'Credit Score',
    loan_to_income_ratio: 'Loan-to-Income'
  };

  for (const factor of factors) {
    const sign = factor.contribution > 0 ? '+' : '';
    const cls = factor.contribution > 0 ? 'positive' : factor.contribution < 0 ? 'negative' : 'zero';
    const widthPct = (Math.abs(factor.contribution) / 30) * 50; // half-track = 30pts max

    const el = document.createElement('div');
    el.className = 'factor';
    el.innerHTML = `
      <div class="factor__row">
        <span class="factor__name">${labels[factor.factorName] || factor.factorName}</span>
        <span class="factor__contribution ${cls}">${sign}${factor.contribution}</span>
      </div>
      <div class="factor__bar-track">
        <div class="factor__bar-fill" style="
          width:${widthPct}%;
          background:var(--${cls === 'zero' ? 'neutral' : cls});
          ${factor.contribution >= 0 ? 'left:50%;' : `left:${50 - widthPct}%;`}
        "></div>
      </div>
      <p class="factor__detail">${factor.detail}</p>
    `;
    container.appendChild(el);
  }
}

let simulateTimer = null;

function runSimulation() {
  syncSliderLabels();

  clearTimeout(simulateTimer);
  simulateTimer = setTimeout(async () => {
    const body = {
      income: Number(sliders.income.value),
      existingDebt: Number(sliders.debt.value),
      creditScore: Number(sliders.credit.value),
      loanAmount: Number(sliders.loan.value),
      tenureMonths: Number(sliders.tenure.value)
    };

    try {
      const result = await postJSON('/applications/simulate', body);

      updateGauge(result.score);

      const riskBadge = document.getElementById('badge-risk');
      riskBadge.textContent = `${result.riskTier} RISK`;
      riskBadge.className = 'badge ' + (result.riskTier === 'LOW' ? 'positive' : result.riskTier === 'HIGH' ? 'negative' : '');

      const outcomeBadge = document.getElementById('badge-outcome');
      outcomeBadge.textContent = result.outcome;
      outcomeBadge.className = 'badge ' + (result.outcome === 'APPROVED' ? 'positive' : 'negative');

      renderFactors(result.factors);
    } catch (err) {
      console.error('Simulation failed', err);
    }
  }, 120);
}

Object.values(sliders).forEach((slider) => slider.addEventListener('input', runSimulation));

// Initial render
runSimulation();

/* ============================================================
   Workflow forms
   ============================================================ */

function formToObject(form) {
  const data = {};
  new FormData(form).forEach((value, key) => { data[key] = value; });
  return data;
}

function toNumbers(obj, keys) {
  const result = { ...obj };
  keys.forEach((key) => { if (result[key] !== undefined) result[key] = Number(result[key]); });
  return result;
}

function showError(el, err) {
  const msg = err.data?.errors?.join('\n') || err.data?.error || 'Request failed';
  el.className = 'result error';
  el.textContent = msg;
}

// Toggle a submit button between its resting label and a "Working…" state
// while a request is in flight, so a slow request doesn't look frozen.
function setLoading(button, isLoading, loadingText = 'Working…') {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

// Marks a step's numbered marker as complete once its request has succeeded.
function markStepDone(form) {
  const marker = form.closest('.step')?.querySelector('.step__marker');
  if (marker) marker.classList.add('is-done');
}

function appendHint(el, text) {
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = text;
  el.appendChild(hint);
}

function renderApplicantCard(el, applicant) {
  el.innerHTML = '';
  el.className = 'result';
  const card = document.createElement('div');
  card.className = 'decision-card';
  const h4 = document.createElement('h4');
h4.textContent = `Applicant #${applicant.id} — ${applicant.name}`;

const p1 = document.createElement('p');
p1.textContent = `Income: ${formatCurrency(applicant.income)} · Existing debt: ${formatCurrency(applicant.existingDebt)}`;

const p2 = document.createElement('p');
p2.innerHTML = `Credit score: <strong>${applicant.creditScore}</strong>`; // safe: creditScore is a validated integer, not free text

card.append(h4, p1, p2);
  el.appendChild(card);
  appendHint(el, `Applicant ID ${applicant.id} carried into Step 02 below.`);
}

function renderApplicationCard(el, application) {
  el.innerHTML = '';
  el.className = 'result';
  const card = document.createElement('div');
  card.className = 'decision-card';
  card.innerHTML = `
    <h4>Application #${application.id}</h4>
    <p>Applicant ID: <strong>${application.applicantId}</strong></p>
    <p>Loan amount: ${formatCurrency(application.loanAmount)} · Tenure: ${application.tenureMonths} months</p>
  `;
  el.appendChild(card);
  appendHint(el, `Application ID ${application.id} carried into Step 03 below.`);
}

document.getElementById('applicantForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById('applicantResult');
  const button = e.target.querySelector('button');
  setLoading(button, true);
  try {
    const raw = formToObject(e.target);
    const body = toNumbers(raw, ['income', 'existingDebt', 'creditScore']);
    const data = await postJSON('/applicants', body);
    renderApplicantCard(resultEl, data);
    document.querySelector('#applicationForm [name="applicantId"]').value = data.id;
    markStepDone(e.target);
    e.target.reset();
  } catch (err) {
    showError(resultEl, err);
  } finally {
    setLoading(button, false);
  }
});

document.getElementById('applicationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById('applicationResult');
  const button = e.target.querySelector('button');
  setLoading(button, true);
  try {
    const raw = formToObject(e.target);
    const body = toNumbers(raw, ['applicantId', 'loanAmount', 'tenureMonths']);
    const data = await postJSON('/applications', body);
    renderApplicationCard(resultEl, data);
    document.querySelector('#evaluateForm [name="applicationId"]').value = data.id;
    document.querySelector('#historyForm [name="applicantId"]').value = data.applicantId;
    markStepDone(e.target);
    e.target.reset();
  } catch (err) {
    showError(resultEl, err);
  } finally {
    setLoading(button, false);
  }
});

document.getElementById('evaluateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById('evaluateResult');
  const button = e.target.querySelector('button');
  setLoading(button, true);
  try {
    const raw = formToObject(e.target);
    const applicationId = Number(raw.applicationId);
    const data = await postJSON(`/applications/${applicationId}/evaluate`, {});

    const card = document.createElement('div');
    card.className = 'decision-card';
    card.innerHTML = `
      <h4>Decision #${data.decisionId}</h4>
      <p>Score: <strong>${data.score}</strong></p>
      <p>Risk Tier: <strong>${data.riskTier}</strong></p>
      <p class="${data.outcome === 'APPROVED' ? 'outcome-approved' : 'outcome-rejected'}">Outcome: ${data.outcome}</p>
    `;
    const list = document.createElement('div');
    data.factors.forEach((f) => {
      const p = document.createElement('p');
      const sign = f.contribution > 0 ? '+' : '';
      p.textContent = `${f.factorName}: ${sign}${f.contribution} — ${f.detail}`;
      list.appendChild(p);
    });
    card.appendChild(list);

    resultEl.innerHTML = '';
    resultEl.className = 'result';
    resultEl.appendChild(card);
    appendHint(resultEl, 'Step 04 below is pre-filled with this applicant — look up their full history.');
    markStepDone(e.target);
    e.target.reset();
  } catch (err) {
    showError(resultEl, err);
  } finally {
    setLoading(button, false);
  }
});

document.getElementById('historyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultEl = document.getElementById('historyResult');
  const button = e.target.querySelector('button');
  setLoading(button, true);
  try {
    const raw = formToObject(e.target);
    const applicantId = Number(raw.applicantId);
    const data = await getJSON(`/applicants/${applicantId}/decisions`);

    resultEl.innerHTML = '';
    resultEl.className = 'result';

    if (data.decisions.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty-history';
      p.textContent = 'No decisions found for this applicant.';
      resultEl.appendChild(p);
    } else {
      data.decisions.forEach((decision) => {
        const card = document.createElement('div');
        card.className = 'decision-card';
        card.innerHTML = `
          <h4>Application #${decision.applicationId} — Decision #${decision.decisionId}</h4>
          <p>Loan Amount: ${formatCurrency(decision.loanAmount)} · Tenure: ${decision.tenureMonths} months</p>
          <p>Score: <strong>${decision.score}</strong> · Risk Tier: <strong>${decision.riskTier}</strong></p>
          <p class="${decision.outcome === 'APPROVED' ? 'outcome-approved' : 'outcome-rejected'}">Outcome: ${decision.outcome}</p>
          <p>Decided: ${decision.decidedAt}</p>
        `;
        resultEl.appendChild(card);
      });
    }
    markStepDone(e.target);
    e.target.reset();
  } catch (err) {
    showError(resultEl, err);
  } finally {
    setLoading(button, false);
  }
});
