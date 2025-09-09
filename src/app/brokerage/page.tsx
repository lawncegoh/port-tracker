"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getRepo } from "@/lib/repo/factory";
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
    marketValue: '',
    account: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseFloat(form.quantity);
    const costBasis = parseFloat(form.costBasis);
    const marketValue = parseFloat(form.marketValue);
    if (!form.symbol || isNaN(quantity) || isNaN(costBasis) || isNaN(marketValue)) return;

    const position: Position = {
      id: Date.now().toString(),
      symbol: form.symbol,
      quantity,
      costBasis,
      marketValue,
      unrealizedPnL: marketValue - costBasis,
      realizedPnL: 0,
      account: form.account || 'MAIN',
      lastUpdated: new Date()
    };

    saveMutation.mutate(position);
    setForm({ symbol: '', quantity: '', costBasis: '', marketValue: '', account: '' });
  };

  const totalMarketValue = positions.reduce(
    (sum: number, p: Position) => sum + p.marketValue,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Market Value" value={`$${totalMarketValue.toLocaleString()}`} subtitle="Brokerage positions" />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
          <Input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          <Input placeholder="Cost Basis" type="number" value={form.costBasis} onChange={e => setForm({ ...form, costBasis: e.target.value })} />
          <Input placeholder="Market Value" type="number" value={form.marketValue} onChange={e => setForm({ ...form, marketValue: e.target.value })} />
          <Input placeholder="Account" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} />
          <Button type="submit" className="md:col-span-5">Add Position</Button>
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
                  <TableHead>Cost Basis</TableHead>
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
                    <TableCell>${p.marketValue.toFixed(2)}</TableCell>
                    <TableCell className={p.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${p.unrealizedPnL.toFixed(2)}
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
      </main>
    </div>
  );
}

