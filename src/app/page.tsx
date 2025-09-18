"use client";

import { Navigation } from "@/components/navigation";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { useQuery } from "@tanstack/react-query";
import { getClientRepo as getRepo } from "@/lib/repo/client";
import { Position, RealEstateProperty, Expense } from "@/lib/types";
import { useState, useMemo } from "react";

export default function Dashboard() {
  // Fetch portfolio data
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listPositions();
    }
  });

  const { data: properties = [] } = useQuery<RealEstateProperty[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listProperties();
    }
  });

  // Budget month + expenses for category split
  function ym(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
  const [budgetMonth, setBudgetMonth] = useState<string>(() => ym(new Date()));
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses', budgetMonth],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listExpenses(budgetMonth);
    }
  });

  // Brokerage settings (margin/loan) and FX for USDSGD
  const { data: brokerageSettings } = useQuery<{ marginLoan: number }>({
    queryKey: ['brokerage-settings'],
    queryFn: async () => {
      const res = await fetch('/api/brokerage/settings');
      if (!res.ok) return { marginLoan: 0 };
      return res.json();
    }
  });
  const { data: usdsgdQuote } = useQuery<{ symbol: string; price: number }>({
    queryKey: ['fx', 'USDSGD=X'],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/quote?symbol=USDSGD=X');
      if (!res.ok) throw new Error('fx failed');
      return res.json();
    }
  });

  // Calculate totals
  const totalPortfolioValue = positions.reduce(
    (sum: number, pos: Position) => sum + pos.marketValue,
    0
  );
  const marginLoan = Number(brokerageSettings?.marginLoan || 0);
  const netLiqUSD = totalPortfolioValue - marginLoan;
  const usdsgd = Number(usdsgdQuote?.price || 0);
  const netLiqSGD = usdsgd > 0 ? netLiqUSD * usdsgd : 0;
  const totalRealEstateEquity = properties.reduce(
    (sum: number, prop: RealEstateProperty) =>
      sum + (prop.currentValue - prop.loanPrincipal),
    0
  );
  // Net worth focuses on brokerage net liq (SGD) + real estate equity
  const totalNetWorth = netLiqSGD + totalRealEstateEquity;

  // Budget category split data
  const catSplit = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category)||0)+e.amount);
    const total = Array.from(map.values()).reduce((s,v)=>s+v,0);
    const entries = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]);
    return { total, entries };
  }, [expenses]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Net Worth Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Net Worth"
              value={totalNetWorth > 0 ? `S$${totalNetWorth.toLocaleString()}` : "Add data to view"}
              subtitle={totalNetWorth > 0 ? "As of today" : "Add positions and properties"}
            />
            <MetricCard
              title="Portfolio (Net Liq, SGD)"
              value={netLiqSGD > 0 ? `S$${netLiqSGD.toLocaleString()}` : "Add positions to view"}
              subtitle={usdsgd > 0 ? `USDSGD=${usdsgd.toFixed(4)}` : "Brokerage accounts"}
            />
            <MetricCard
              title="Real Estate Equity"
              value={totalRealEstateEquity > 0 ? `$${totalRealEstateEquity.toLocaleString()}` : "Add properties to view"}
              subtitle={totalRealEstateEquity > 0 ? "Property values" : "Add real estate properties"}
            />
          </div>

          {/* Budget Category Split (Pie) */}
          <ChartCard title="Budget: Category Split">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Pie or placeholder */}
              {catSplit.total > 0 ? (
                (() => {
                  const size = 180; const r = 80; const cx = size/2; const cy = size/2;
                  const circumference = 2 * Math.PI * r;
                  const colors = ['#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#22c55e','#eab308','#f97316','#06b6d4'];
                  let offset = 0;
                  return (
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={20} />
                      {catSplit.entries.map(([cat, amt], i) => {
                        const frac = amt / catSplit.total;
                        const len = frac * circumference;
                        const dashArray = `${len} ${circumference - len}`;
                        const circle = (
                          <circle key={cat}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth={20}
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += len; return circle;
                      })}
                    </svg>
                  );
                })()
              ) : (
                <div className="h-44 w-full flex items-center justify-center text-muted-foreground">No spending data</div>
              )}

              {/* Legend and controls (always visible) */}
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm">Month</label>
                  <select className="border rounded-md px-2 py-2 h-9" value={budgetMonth} onChange={e => setBudgetMonth(e.target.value)}>
                    {Array.from({length:12}).map((_,i)=>{
                      const d = new Date(); d.setMonth(d.getMonth()-i); const m = ym(d);
                      return <option key={m} value={m}>{m}</option>;
                    })}
                  </select>
                </div>
                {catSplit.total > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {catSplit.entries.map(([cat, amt], i) => (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{backgroundColor: ['#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#22c55e','#eab308','#f97316','#06b6d4'][i % 10]}}></span>
                        <span className="text-muted-foreground">{cat}</span>
                        <span>${amt.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </ChartCard>

          {/* Removed performance metrics per request */}
        </div>
      </main>
    </div>
  );
}
