"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getClientRepo as getRepo } from "@/lib/repo/client";
import { Position } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function BrokeragePage() {
  const queryClient = useQueryClient();

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listPositions();
    }
  });

  // Brokerage settings: margin/loan amount persisted in local repo via API
  const { data: settings } = useQuery<{ marginLoan: number }>({
    queryKey: ['brokerage-settings'],
    queryFn: async () => {
      const res = await fetch('/api/brokerage/settings');
      if (!res.ok) return { marginLoan: 0 };
      return res.json();
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (marginLoan: number) => {
      await fetch('/api/brokerage/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marginLoan }) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brokerage-settings'] })
  });

  const saveMutation = useMutation({
    mutationFn: async (position: Position) => {
      const repo = await getRepo();
      await repo.savePosition(position);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const repo = await getRepo();
      await repo.deletePosition(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] })
  });

  const [form, setForm] = useState({
    symbol: '',
    quantity: '',
    costBasis: '',
    account: 'MAIN',
    customAccount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(form.quantity);
    const costPerShare = parseFloat(form.costBasis);
    if (!form.symbol || isNaN(quantity) || isNaN(costPerShare)) return;

    // Fetch price on submit only; fallback to manual input if it fails
    let marketPrice: number | null = null;
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(form.symbol)}`);
      if (res.ok) {
        const quote = await res.json() as { symbol: string; price: number };
        marketPrice = Number(quote.price);
      }
    } catch {}
    if (marketPrice == null || isNaN(marketPrice)) {
      const manual = window.prompt('Price lookup failed. Enter price manually:');
      if (!manual) return;
      const p = parseFloat(manual);
      if (isNaN(p)) return;
      marketPrice = p;
    }
    const marketValue = marketPrice * quantity;
    const totalCostBasis = costPerShare * quantity;

    const account = form.account === '__CUSTOM__' ? (form.customAccount || 'MAIN') : (form.account || 'MAIN');

    const position: Position = {
      id: Date.now().toString(),
      symbol: form.symbol,
      quantity,
      costBasis: totalCostBasis,
      marketValue,
      unrealizedPnL: marketValue - totalCostBasis,
      realizedPnL: 0,
      account,
      lastUpdated: new Date()
    };

    saveMutation.mutate(position);
    setForm({ symbol: '', quantity: '', costBasis: '', account: 'MAIN', customAccount: '' });
  };

  const totalMarketValue = positions.reduce(
    (sum: number, p: Position) => sum + p.marketValue,
    0
  );
  const marginLoan = Number(settings?.marginLoan || 0);
  const netLiq = totalMarketValue - marginLoan;

  // FX: USD/SGD to show Net Liq in SGD equivalent
  const { data: usdsgdQuote } = useQuery<{ symbol: string; price: number }>({
    queryKey: ['fx', 'USDSGD=X'],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/quote?symbol=USDSGD=X');
      if (!res.ok) throw new Error('fx failed');
      return res.json();
    }
  });
  const netLiqSGD = useMemo(() => {
    const fx = Number(usdsgdQuote?.price || 0);
    return fx > 0 ? netLiq * fx : null;
  }, [usdsgdQuote?.price, netLiq]);

  // Live quotes for symbols to show beside P&L
  const symbols = useMemo(() => Array.from(new Set(positions.map(p => p.symbol))).filter(Boolean), [positions]);
  const quoteQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ['quote', s],
      staleTime: 60_000,
      queryFn: async () => {
        const res = await fetch(`/api/quote?symbol=${encodeURIComponent(s)}`);
        if (!res.ok) throw new Error('quote failed');
        return res.json() as Promise<{ symbol: string; price: number; currency?: string }>;
      }
    }))
  });
  const quoteMap = useMemo(() => {
    const m = new Map<string, { price: number; currency?: string }>();
    quoteQueries.forEach((q, i) => {
      const sym = symbols[i];
      if (q.data && sym) m.set(sym, { price: Number(q.data.price), currency: q.data.currency });
    });
    return m;
  }, [quoteQueries, symbols]);

  // Derive commonly used accounts for dropdown
  const accountOptions = useMemo(() => {
    const set = new Set<string>(['MAIN']);
    for (const p of positions) set.add(p.account);
    return Array.from(set);
  }, [positions]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Market Value (USD)" value={`$${totalMarketValue.toLocaleString()}`} subtitle="Brokerage positions" />
          <MetricCard title="Margin / Loan (USD)" value={`$${marginLoan.toLocaleString()}`} subtitle="Borrowed amount" />
          <MetricCard title="Net Liq Value (USD)" value={`$${netLiq.toLocaleString()}`} subtitle="Market - Margin" />
        </div>
        {netLiqSGD !== null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Net Liq (SGD)" value={`S$${netLiqSGD.toLocaleString()}`} subtitle={`FX: USDSGD=${usdsgdQuote?.price?.toFixed(4)}`} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          <div className="space-y-1">
            <Input placeholder="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1">
            <Input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Input placeholder="Cost Basis (per share)" type="number" value={form.costBasis} onChange={e => setForm({ ...form, costBasis: e.target.value })} />
          </div>
          <div className="space-y-1">
            <select className="border rounded-md px-2 py-2 w-full h-9" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>
              {accountOptions.map((acc) => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
              <option value="__CUSTOM__">Add new account…</option>
            </select>
            {form.account === '__CUSTOM__' && (
              <Input placeholder="New account name" value={form.customAccount} onChange={e => setForm({ ...form, customAccount: e.target.value })} />
            )}
          </div>
          <div className="space-y-1 flex items-center">
            <Button type="submit" className="w-full">Add Position</Button>
          </div>
        </form>

        <TableWrapper title="Positions">
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No positions added yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost Basis (total)</TableHead>
                  <TableHead>Avg Cost/Share</TableHead>
                  <TableHead>Market Value</TableHead>
                  <TableHead>Unrealized P&L</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p: Position) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.symbol}</TableCell>
                    <TableCell>{p.quantity}</TableCell>
                    <TableCell>${p.costBasis.toFixed(2)}</TableCell>
                    <TableCell>${(p.costBasis / p.quantity).toFixed(4)}</TableCell>
                    <TableCell>
                      ${p.marketValue.toFixed(2)}
                    </TableCell>
                    <TableCell className={p.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${p.unrealizedPnL.toFixed(2)}
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const q = quoteMap.get(p.symbol);
                          if (!q) return 'Live: …';
                          const liveMV = q.price * p.quantity;
                          return `Live MV: $${liveMV.toFixed(2)} (@ $${q.price.toFixed(2)})`;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>{p.account}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableWrapper>

        <TableWrapper title="Brokerage Settings">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('marginLoan') as HTMLInputElement);
              const val = parseFloat(input.value || '0');
              if (!isNaN(val) && val >= 0) updateSettings.mutate(val);
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
          >
            <div>
              <label className="text-sm block mb-1">Margin / Loan Amount</label>
              <Input name="marginLoan" type="number" defaultValue={settings?.marginLoan ?? 0} />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" disabled={updateSettings.isPending}>Save</Button>
            </div>
          </form>
        </TableWrapper>
      </main>
    </div>
  );
}
