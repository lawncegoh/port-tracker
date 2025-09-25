"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getClientRepo as getRepo } from "@/lib/repo/client";
import { RealEstateProperty } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function RealEstatePage() {
  const queryClient = useQueryClient();

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listProperties();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (property: RealEstateProperty) => {
      const repo = await getRepo();
      await repo.saveProperty(property);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const repo = await getRepo();
      await repo.deleteProperty(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] })
  });

  const [form, setForm] = useState({
    name: '',
    purchasePrice: '',
    currentValue: '',
    loanPrincipal: ''
  });

  // Simple repricing calculator state
  const [remainingBalance, setRemainingBalance] = useState<string>('');
  const [annualRatePct, setAnnualRatePct] = useState<string>('');
  const [tenorMonths, setTenorMonths] = useState<string>('');
  const [tenorUnit, setTenorUnit] = useState<'months' | 'years'>('months');
  const [calcPropertyId, setCalcPropertyId] = useState<string>('');
  const [paymentStartDate, setPaymentStartDate] = useState<string>('');
  const todayStr = new Date().toISOString().slice(0,10);

  // Snapshot lock (local persistence)
  type Snapshot = { balance: number; ratePct: number; months: number; lockedAt: string; startDate?: string; validUntil?: string; unit?: 'months' | 'years' };
  const SNAP_KEY = 'loanRepriceSnapshot';
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [cpfMode, setCpfMode] = useState<'manual' | 'auto'>('manual');
  const [cpfManual, setCpfManual] = useState<string>('');
  const [cpfSalary, setCpfSalary] = useState<string>('');
  const [cpfAge, setCpfAge] = useState<string>('');
  const [cpfOWCeiling, setCpfOWCeiling] = useState<string>('8000');
  const OA_KEY = 'cpfOASettings';
  const [oaBalance, setOaBalance] = useState<string>('');
  const [oaDrawdown, setOaDrawdown] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      if (raw) {
        const snap = JSON.parse(raw);
        setSnapshot(snap);
        // Auto-restore snapshot into inputs so cards reflect saved values
        setRemainingBalance(String(snap.balance ?? ''));
        setAnnualRatePct(String(snap.ratePct ?? ''));
        if (snap?.unit === 'years') {
          setTenorUnit('years');
          setTenorMonths(String(Math.round((snap.months || 0) / 12)));
        } else {
          setTenorUnit('months');
          setTenorMonths(String(snap.months ?? ''));
        }
        if (typeof snap?.startDate === 'string') setPaymentStartDate(snap.startDate);
        if (typeof snap?.validUntil === 'string') setValidUntil(snap.validUntil);
      }
      const oaRaw = localStorage.getItem(OA_KEY);
      if (oaRaw) {
        const parsed = JSON.parse(oaRaw);
        if (typeof parsed?.balance === 'number') setOaBalance(String(parsed.balance));
        if (typeof parsed?.drawdown === 'number') setOaDrawdown(String(parsed.drawdown));
        if (typeof parsed?.salary === 'number') setCpfSalary(String(parsed.salary));
        if (typeof parsed?.age === 'number') setCpfAge(String(parsed.age));
        if (typeof parsed?.owCeiling === 'number') setCpfOWCeiling(String(parsed.owCeiling));
        if (parsed?.mode === 'manual' || parsed?.mode === 'auto') setCpfMode(parsed.mode);
        if (typeof parsed?.manual === 'number') setCpfManual(String(parsed.manual));
      }
    } catch {}
  }, []);

  const [validUntil, setValidUntil] = useState<string>('');

  const lockSnapshot = () => {
    const L = parseFloat(remainingBalance);
    const r = parseFloat(annualRatePct);
    const nRaw = parseInt(tenorMonths);
    const n = tenorUnit === 'years' ? (isNaN(nRaw) ? NaN : nRaw * 12) : nRaw;
    if (isNaN(L) || L <= 0 || isNaN(r) || r < 0 || isNaN(n) || n <= 0) return;
    const snap: Snapshot = { balance: L, ratePct: r, months: n, lockedAt: new Date().toISOString(), startDate: paymentStartDate || undefined, validUntil: validUntil || undefined, unit: tenorUnit };
    try {
      localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
      setSnapshot(snap);
    } catch {}
  };

  const restoreSnapshot = () => {
    if (!snapshot) return;
    setRemainingBalance(String(snapshot.balance));
    setAnnualRatePct(String(snapshot.ratePct));
    if (snapshot.unit === 'years') {
      setTenorUnit('years');
      setTenorMonths(String(Math.round(snapshot.months / 12)));
    } else {
      setTenorUnit('months');
      setTenorMonths(String(snapshot.months));
    }
    if (snapshot.startDate) setPaymentStartDate(snapshot.startDate);
    if (snapshot.validUntil) setValidUntil(snapshot.validUntil);
  };

  const clearSnapshot = () => {
    try { localStorage.removeItem(SNAP_KEY); } catch {}
    setSnapshot(null);
  };

  const saveOASettings = () => {
    const bal = parseFloat(oaBalance);
    const dd = parseFloat(oaDrawdown);
    const sal = parseFloat(cpfSalary);
    const ageNum = parseFloat(cpfAge);
    const ceiling = parseFloat(cpfOWCeiling);
    const manualAmt = parseFloat(cpfManual);
    if (isNaN(bal) || bal < 0 || isNaN(dd) || dd < 0) return;
    try {
      localStorage.setItem(
        OA_KEY,
        JSON.stringify({
          balance: bal,
          drawdown: dd,
          salary: isNaN(sal) || sal < 0 ? 0 : sal,
          age: isNaN(ageNum) || ageNum < 0 ? 0 : ageNum,
          owCeiling: isNaN(ceiling) || ceiling < 0 ? 8000 : ceiling,
          mode: cpfMode,
          manual: isNaN(manualAmt) || manualAmt < 0 ? 0 : manualAmt,
        })
      );
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const purchasePrice = parseFloat(form.purchasePrice);
    const currentValue = parseFloat(form.currentValue);
    const loanPrincipal = parseFloat(form.loanPrincipal);
    if (!form.name || isNaN(purchasePrice) || isNaN(currentValue) || isNaN(loanPrincipal)) return;

    const property: RealEstateProperty = {
      id: Date.now().toString(),
      name: form.name,
      purchasePrice,
      downPayment: purchasePrice - loanPrincipal,
      loanPrincipal,
      interestRate: 0,
      loanTerm: 0,
      currentValue,
      monthlyPayment: 0,
      purchaseDate: new Date()
    };

    saveMutation.mutate(property);
    setForm({ name: '', purchasePrice: '', currentValue: '', loanPrincipal: '' });
  };

  const totalEquity = properties.reduce(
    (sum: number, p: RealEstateProperty) => sum + (p.currentValue - p.loanPrincipal),
    0
  );

  // Simple amortized monthly payment calculation
  const calc = (() => {
    const L = parseFloat(remainingBalance);
    const ratePct = parseFloat(annualRatePct);
    const nRaw = parseInt(tenorMonths);
    const n = tenorUnit === 'years' ? (isNaN(nRaw) ? NaN : nRaw * 12) : nRaw;
    if (isNaN(L) || L <= 0 || isNaN(ratePct) || ratePct < 0 || isNaN(n) || n <= 0) return null;
    const r = (ratePct / 100) / 12; // monthly rate
    const payment = r === 0 ? (L / n) : (L * r) / (1 - Math.pow(1 + r, -n));
    const totalPaid = payment * n;
    const totalInterest = totalPaid - L;
    return { payment, totalPaid, totalInterest, L, r, n };
  })();

  // Helper: months between two YYYY-MM-DD dates
  function monthsBetween(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (e.getDate() < s.getDate()) months -= 1; // round down
    return Math.max(0, months);
  }

  // Remaining balance after m months
  function remainingAfterMonths(L: number, r: number, n: number, m: number, payment: number): number {
    if (m <= 0) return L;
    if (m >= n) return 0;
    if (r === 0) return Math.max(0, L - payment * m);
    const pow = Math.pow(1 + r, m);
    const bal = L * pow - payment * ((pow - 1) / r);
    return Math.max(0, bal);
  }

  const monthsPaid = monthsBetween(paymentStartDate, todayStr);
  const asOfRemaining = (() => {
    if (!calc) return null;
    const m = Math.min(calc.n, Math.max(0, monthsPaid));
    return remainingAfterMonths(calc.L, calc.r, calc.n, m, calc.payment);
  })();

  const selectedForCalc = useMemo(() => properties.find(p => p.id === calcPropertyId) || null, [properties, calcPropertyId]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Equity" value={`$${totalEquity.toLocaleString()}`} subtitle="Real estate" />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Purchase Price" type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
          <Input placeholder="Current Value" type="number" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} />
          <Input placeholder="Loan Principal" type="number" value={form.loanPrincipal} onChange={e => setForm({ ...form, loanPrincipal: e.target.value })} />
          <Button type="submit" className="md:col-span-4">Add Property</Button>
        </form>

        <TableWrapper title="Properties">
          {properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No properties added yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Loan Balance</TableHead>
                  <TableHead>Equity</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p: RealEstateProperty) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>${p.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell>${p.currentValue.toLocaleString()}</TableCell>
                    <TableCell>${p.loanPrincipal.toLocaleString()}</TableCell>
                    <TableCell className={p.currentValue - p.loanPrincipal >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${(p.currentValue - p.loanPrincipal).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => { setRemainingBalance(String(p.loanPrincipal)); setCalcPropertyId(p.id); }}>
                          Use in calculator
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableWrapper>

        {/* Simple loan repricing calculator */}
        <TableWrapper title="Loan Repricing Calculator">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm block mb-1">Remaining Balance (principal)</label>
              <Input placeholder="e.g. 500000" type="number" value={remainingBalance} onChange={e => setRemainingBalance(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Annual Interest Rate (%)</label>
              <Input placeholder="e.g. 3.5" type="number" step="0.01" value={annualRatePct} onChange={e => setAnnualRatePct(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1">Tenor ({tenorUnit === 'years' ? 'years' : 'months'})</label>
              <div className="flex gap-2">
                <Input placeholder={tenorUnit === 'years' ? 'e.g. 25' : 'e.g. 300'} type="number" value={tenorMonths} onChange={e => setTenorMonths(e.target.value)} />
                <select className="border rounded-md px-2 py-2 h-9" value={tenorUnit} onChange={e => setTenorUnit(e.target.value as 'months' | 'years')}>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm block mb-1">Payments started on</label>
              <Input type="date" value={paymentStartDate} onChange={e => setPaymentStartDate(e.target.value)} />
            </div>
            <div className="flex items-end text-sm text-muted-foreground">
              {monthsPaid > 0 ? `${monthsPaid} instalment(s) paid since ${paymentStartDate || '—'} (to today)` : 'No instalments paid yet'}
            </div>
            <div>
              <label className="text-sm block mb-1">Valid until (optional)</label>
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              {snapshot ? (
                <div>
                  Saved {new Date(snapshot.lockedAt).toLocaleString()} — Balance: ${snapshot.balance.toLocaleString()}, Rate: {snapshot.ratePct}% , Tenor: {snapshot.months}m{snapshot.unit==='years'?' (yrs mode)':''}{snapshot.validUntil?`, until ${snapshot.validUntil}`:''}
                </div>
              ) : (
                <div>No setup saved yet.</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={lockSnapshot}>Save Setup</Button>
              <Button type="button" variant="outline" onClick={restoreSnapshot} disabled={!snapshot}>Restore</Button>
              <Button type="button" variant="ghost" onClick={clearSnapshot} disabled={!snapshot}>Clear</Button>
            </div>
          </div>

          {calc && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard title="Monthly Payment" value={`$${calc.payment.toFixed(2)}`} subtitle="Amortized payment" />
              <MetricCard title="Total Interest" value={`$${calc.totalInterest.toFixed(2)}`} subtitle={`Over ${calc.n} months`} />
              <MetricCard title="Total Paid" value={`$${calc.totalPaid.toFixed(2)}`} subtitle="Principal + interest" />
              {typeof asOfRemaining === 'number' && (
                <MetricCard title="Remaining (today)" value={`$${asOfRemaining.toFixed(2)}`} subtitle={monthsPaid>0?`${monthsPaid} paid so far`:'No payments yet'} />
              )}
            </div>
          )}

          {calc && selectedForCalc && typeof asOfRemaining === 'number' && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard title="Property Equity (as-of)" value={`$${(selectedForCalc.currentValue - asOfRemaining).toLocaleString()}`} subtitle={selectedForCalc.name} />
            </div>
          )}

          {/* CPF OA Contribution */}
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm block mb-1">CPF Input Mode</label>
                <select className="border rounded-md px-2 py-2 h-9 w-full" value={cpfMode} onChange={e => setCpfMode(e.target.value as 'manual' | 'auto')}>
                  <option value="manual">Manual monthly OA amount</option>
                  <option value="auto">Auto from salary & age</option>
                </select>
              </div>
              {cpfMode === 'manual' ? (
                <div>
                  <label className="text-sm block mb-1">Monthly CPF OA (S$)</label>
                  <Input placeholder="e.g. 1500" type="number" value={cpfManual} onChange={e => setCpfManual(e.target.value)} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm block mb-1">Gross Salary (S$)</label>
                    <Input placeholder="e.g. 6000" type="number" value={cpfSalary} onChange={e => setCpfSalary(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">Age</label>
                    <Input placeholder="e.g. 32" type="number" value={cpfAge} onChange={e => setCpfAge(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {(() => {
              const payment = calc?.payment ?? 0;
              let cpfOA = 0;
              if (cpfMode === 'manual') {
                const v = parseFloat(cpfManual);
                cpfOA = isNaN(v) || v < 0 ? 0 : v;
              } else {
                const ceiling = Math.max(parseFloat(cpfOWCeiling || '8000') || 8000, 0);
                const sal = Math.min(Math.max(parseFloat(cpfSalary || '0'), 0), ceiling);
                const age = parseFloat(cpfAge || '0');
                const oaPct = (() => {
                  if (isNaN(age) || age <= 0) return 0;
                  if (age <= 35) return 23;
                  if (age <= 45) return 21;
                  if (age <= 50) return 19;
                  if (age <= 55) return 15;
                  if (age <= 60) return 12;
                  if (age <= 65) return 3.5;
                  if (age <= 70) return 1;
                  return 1;
                })();
                cpfOA = sal * (oaPct / 100);
              }
              const cash = Math.max(0, payment - cpfOA);
              const coverPct = payment > 0 ? Math.min(100, (cpfOA / payment) * 100) : 0;
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MetricCard title="CPF OA Contribution" value={`$${cpfOA.toFixed(2)}`} subtitle={cpfMode === 'auto' ? `Auto (OW ceiling S$${(parseFloat(cpfOWCeiling||'8000')||8000).toLocaleString()})` : 'Manual input'} />
                  <MetricCard title="Cash Payment" value={`$${cash.toFixed(2)}`} subtitle={`${coverPct.toFixed(0)}% covered by CPF`} />
                  {(() => {
                    const bal = Math.max(parseFloat(oaBalance || '0') || 0, 0);
                    const draw = Math.max(parseFloat(oaDrawdown || '0') || 0, 0);
                    if (draw <= 0) return <MetricCard title="OA Runway" value={`—`} subtitle="Set monthly drawdown" />;
                    if (cpfOA >= draw) return <MetricCard title="OA Runway" value={`No depletion`} subtitle="Contribution >= drawdown" />;
                    let months = 0;
                    let b = bal;
                    while (months < 1000 && b + cpfOA >= draw) {
                      b = b + cpfOA - draw;
                      months++;
                    }
                    const end = new Date(todayStr + 'T00:00:00');
                    end.setMonth(end.getMonth() + months);
                    const endLabel = isFinite(months) ? end.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—';
                    return <MetricCard title="OA Runway" value={`${months} mo`} subtitle={`Until ${endLabel}`} />;
                  })()}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div>
                <label className="text-sm block mb-1">OW Ceiling for Auto (S$)</label>
                <Input placeholder="8000" type="number" value={cpfOWCeiling} onChange={e => setCpfOWCeiling(e.target.value)} />
              </div>
              <div>
                <label className="text-sm block mb-1">OA Current Balance (S$)</label>
                <Input placeholder="e.g. 20000" type="number" value={oaBalance} onChange={e => setOaBalance(e.target.value)} />
              </div>
              <div>
                <label className="text-sm block mb-1">OA Monthly Drawdown (S$)</label>
                <Input placeholder="e.g. 2000 (or up to 8000)" type="number" value={oaDrawdown} onChange={e => setOaDrawdown(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={saveOASettings}>Save OA Settings</Button>
              </div>
            </div>
          </div>
        </TableWrapper>
      </main>
    </div>
  );
}
