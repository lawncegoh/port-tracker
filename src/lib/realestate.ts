export type RatePeriod = { start: Date; rate: number };
export type Stage = { name: string; percent: number; date?: Date | null };

export function defaultProgressiveStages(): Stage[] {
  // Percentages as decimals summing to 1.0
  return [
    { name: 'Booking Fee', percent: 0.05 },
    { name: 'S&P within 8 weeks', percent: 0.15 },
    { name: 'Foundation', percent: 0.10 },
    { name: 'Reinforced Concrete Framework', percent: 0.10 },
    { name: 'Walls', percent: 0.05 },
    { name: 'Ceiling', percent: 0.05 },
    { name: 'Doors & Windows, Plumbing & Plastering', percent: 0.05 },
    { name: 'TOP/CSC', percent: 0.25 },
    { name: 'Completion', percent: 0.20 },
  ];
}

export function normalizeRateSchedule(baseRate: number, purchaseDate: Date, schedule?: RatePeriod[]): RatePeriod[] {
  const base: RatePeriod = { start: purchaseDate, rate: baseRate };
  const all = [base, ...(schedule || [])]
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  // dedupe by start date
  const out: RatePeriod[] = [];
  for (const r of all) {
    if (!out.length || new Date(out[out.length - 1].start).getTime() !== new Date(r.start).getTime()) out.push(r);
    else out[out.length - 1] = r;
  }
  return out;
}

export function computeDisbursementAllocation(purchasePrice: number, downPayment: number, loanPrincipal: number, stages: Stage[], asOf: Date): {
  equityPaid: number;
  loanDisbursed: number;
  loanDisbursements: Array<{ date: Date; amount: number }>;
} {
  const stagesSorted = [...stages].filter(s => s.date).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  let equityLeft = downPayment;
  let loanLeft = loanPrincipal;
  let loanDisbursed = 0;
  const loanDisbursements: Array<{ date: Date; amount: number }> = [];
  let equityPaid = 0;
  for (const s of stagesSorted) {
    const when = new Date(s.date!);
    if (when > asOf) break;
    const due = purchasePrice * s.percent;
    if (equityLeft >= due) {
      equityLeft -= due;
      equityPaid += due;
    } else {
      const fromEquity = Math.max(0, equityLeft);
      const needFromLoan = Math.min(loanLeft, due - fromEquity);
      equityPaid += fromEquity;
      equityLeft -= fromEquity;
      loanLeft -= needFromLoan;
      loanDisbursed += needFromLoan;
      if (needFromLoan > 0) loanDisbursements.push({ date: when, amount: needFromLoan });
    }
  }
  return { equityPaid, loanDisbursed, loanDisbursements };
}

export function daysBetween(a: Date, b: Date): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// Interest-only accrual on disbursed principal until loanStartDate
export function interestAccruedPreStart(loanDisbursements: Array<{ date: Date; amount: number }>, rateSchedule: RatePeriod[], startDate: Date, asOf: Date): number {
  const end = startDate < asOf ? startDate : asOf;
  // Build timeline of principal outstanding changes
  const events: Array<{ t: Date; deltaPrincipal: number; rate?: number }> = [];
  for (const d of loanDisbursements) {
    if (d.date <= end) events.push({ t: d.date, deltaPrincipal: d.amount });
  }
  // Rate change events
  for (const r of rateSchedule) {
    if (r.start <= end) events.push({ t: r.start, deltaPrincipal: 0, rate: r.rate });
  }
  events.sort((x, y) => new Date(x.t).getTime() - new Date(y.t).getTime());
  if (!events.length) return 0;
  let principal = 0;
  let rate = rateSchedule[0]?.rate ?? 0;
  let last = events[0].t;
  let acc = 0;
  for (const e of events) {
    if (e.t > last) {
      const d = daysBetween(last, e.t);
      acc += principal * rate * (d / 365);
      last = e.t;
    }
    if (typeof e.rate === 'number') rate = e.rate;
    principal += e.deltaPrincipal;
  }
  const d = daysBetween(last, end);
  acc += principal * rate * (d / 365);
  return acc;
}

// Amortization with possible repricing; recomputes payment at each rate change
export function amortizationPaid(startPrincipal: number, rateSchedule: RatePeriod[], startDate: Date, termMonths: number, asOf: Date): { interest: number; principal: number; remaining: number } {
  if (termMonths <= 0 || startPrincipal <= 0 || startDate >= asOf) return { interest: 0, principal: 0, remaining: startPrincipal };
  // Sort schedule and find the active rate at startDate
  const sched = [...rateSchedule].sort((a, b) => a.start.getTime() - b.start.getTime());
  if (!sched.length) return { interest: 0, principal: 0, remaining: startPrincipal };

  function addMonths(date: Date, m: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + m);
    return d;
  }

  let remaining = startPrincipal;
  let paidInterest = 0;
  let paidPrincipal = 0;
  let currentDate = new Date(startDate);
  let monthsLeft = termMonths;

  // start index = last schedule whose start <= currentDate
  let i = Math.max(0, sched.findIndex(r => r.start > currentDate) - 1);
  if (i === -1) i = 0;

  while (monthsLeft > 0 && currentDate < asOf && remaining > 0) {
    const period = sched[i] || sched[sched.length - 1];
    const nextReprice = sched[i + 1]?.start || addMonths(currentDate, monthsLeft);
    const r = period.rate / 12;
    const payment = r === 0 ? remaining / monthsLeft : (remaining * r) / (1 - Math.pow(1 + r, -monthsLeft));
    while (monthsLeft > 0 && currentDate < asOf && currentDate < nextReprice && remaining > 0) {
      const interest = remaining * r;
      const principal = Math.min(remaining, payment - interest);
      paidInterest += interest;
      paidPrincipal += principal;
      remaining -= principal;
      monthsLeft -= 1;
      currentDate = addMonths(currentDate, 1);
    }
    if (currentDate >= nextReprice) i = Math.min(i + 1, sched.length - 1);
    else break;
  }
  return { interest: paidInterest, principal: paidPrincipal, remaining };
}
