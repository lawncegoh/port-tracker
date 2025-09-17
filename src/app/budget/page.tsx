"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getClientRepo as getRepo } from "@/lib/repo/client";
import { Expense } from "@/lib/types";
import { Trash2 } from "lucide-react";

function ym(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState<string>(() => ym(new Date()));

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', month],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listExpenses(month);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      const repo = await getRepo();
      await repo.saveExpense(expense);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', month] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const repo = await getRepo();
      await repo.deleteExpense(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', month] })
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    description: '',
    amount: '',
    currency: 'SGD',
    category: 'General',
    paymentMethod: 'Card',
  });

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: new Date().toISOString().slice(0,10),
    description: '',
    amount: '',
    currency: 'SGD',
    category: 'General',
    paymentMethod: 'Card',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.description || isNaN(amount)) return;
    const exp: Expense = {
      id: Date.now().toString(),
      date: new Date(form.date),
      description: form.description,
      amount,
      currency: form.currency || 'SGD',
      category: form.category || 'General',
      paymentMethod: form.paymentMethod,
      status: 'cleared',
      createdAt: new Date()
    };
    saveMutation.mutate(exp);
    setForm({ date: new Date().toISOString().slice(0,10), description: '', amount: '', currency: 'SGD', category: 'General', paymentMethod: 'Card' });
  };

  const summary = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const count = expenses.length;
    const totalsByCat = expenses.reduce((map, e) => map.set(e.category, (map.get(e.category) || 0) + e.amount), new Map<string, number>());
    let topCat = '';
    let topVal = 0;
    for (const [k,v] of totalsByCat.entries()) { if (v > topVal) { topVal = v; topCat = k; } }
    return { total, count, topCat, topVal, totalsByCat };
  }, [expenses]);

  // Month options: last 24 months including current
  const months = useMemo(() => {
    const out: string[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(ym(d));
    }
    return out; // already descending
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-semibold">Budget</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm">Month</label>
            <select className="border rounded-md px-2 py-2 h-9" value={month} onChange={e => setMonth(e.target.value)}>
              {months.map(m => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Total Spent" value={`$${summary.total.toFixed(2)}`} subtitle={month} />
          <MetricCard title="Transactions" value={`${summary.count}`} subtitle="Count" />
          <MetricCard title="Top Category" value={summary.topCat || '—'} subtitle={`$${summary.topVal.toFixed(2)}`} />
        </div>

        {/* Stacked bars: category split overall and by payment method */}
        <TableWrapper title="Category Split (Stacked Bars)">
          {summary.total > 0 ? (
            <div className="space-y-6">
              {/* Overall */}
              {(() => {
                const entries = Array.from(summary.totalsByCat.entries()).sort((a,b)=> b[1]-a[1]);
                const colors = [
                  '#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#22c55e','#eab308','#f97316','#06b6d4'
                ];
                const total = summary.total || 1;
                return (
                  <div>
                    <div className="mb-2 text-sm text-muted-foreground">Overall</div>
                    <div className="w-full h-6 rounded-md overflow-hidden flex border">
                      {entries.map(([cat, amt], i) => (
                        <div key={cat} title={`${cat}: $${amt.toFixed(2)}`}
                             style={{ width: `${(amt/total)*100}%`, backgroundColor: colors[i % colors.length] }} />
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {entries.map(([cat, amt], i) => (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm" style={{backgroundColor: colors[i % colors.length]}}></span>
                          <span className="text-muted-foreground">{cat}</span>
                          <span>${amt.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Removed per-payment-method stacked bars per request */}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">No spending to visualize for {month}.</div>
          )}
        </TableWrapper>

        {/* Category breakdown */}
        <TableWrapper title="By Category">
          {summary.totalsByCat && summary.totalsByCat.size > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(summary.totalsByCat.entries()).sort((a,b)=> b[1]-a[1]).map(([cat,amt]) => (
                    <TableRow key={cat}>
                      <TableCell className="font-medium">{cat}</TableCell>
                      <TableCell className="text-right">${amt.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">No spend by category yet.</div>
          )}
        </TableWrapper>

        {/* Add expense */}
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <Input placeholder="Currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          <select className="border rounded-md px-2 py-2 h-9" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {['General','Food','Transport','Groceries','Bills','Mortgage','Entertainment','Travel','Health','Shopping','Other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <select className="border rounded-md px-2 py-2 h-9" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              {['Card','PayLah','Vouchers'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Button type="submit" className="whitespace-nowrap">Add Expense</Button>
          </div>
        </form>

        {/* Expenses list */}
        <TableWrapper title="Expenses">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No expenses yet for {month}.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Expense</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => {
                    const isEditing = editId === e.id;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">
                          {isEditing ? (
                            <Input type="date" value={editForm.date} onChange={ev => setEditForm({ ...editForm, date: ev.target.value })} />
                          ) : (
                            new Date(e.date).toLocaleDateString()
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input value={editForm.description} onChange={ev => setEditForm({ ...editForm, description: ev.target.value })} />
                          ) : (
                            e.description
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Input className="w-28" type="number" value={editForm.amount} onChange={ev => setEditForm({ ...editForm, amount: ev.target.value })} />
                              <Input className="w-24" value={editForm.currency} onChange={ev => setEditForm({ ...editForm, currency: ev.target.value.toUpperCase() })} />
                            </div>
                          ) : (
                            <>{e.currency} ${e.amount.toFixed(2)}</>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <select className="border rounded-md px-2 py-2 h-9" value={editForm.category} onChange={ev => setEditForm({ ...editForm, category: ev.target.value })}>
                              {['General','Food','Transport','Groceries','Bills','Mortgage','Entertainment','Travel','Health','Shopping','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : (
                            e.category
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <select className="border rounded-md px-2 py-2 h-9" value={editForm.paymentMethod} onChange={ev => setEditForm({ ...editForm, paymentMethod: ev.target.value })}>
                              {['Card','PayLah','Vouchers'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            e.paymentMethod || '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const amt = parseFloat(editForm.amount);
                                  if (isNaN(amt)) return;
                                  const updated: Expense = {
                                    ...e,
                                    date: new Date(editForm.date),
                                    description: editForm.description,
                                    amount: amt,
                                    currency: editForm.currency,
                                    category: editForm.category,
                                    paymentMethod: editForm.paymentMethod,
                                  };
                                  const newMonth = ym(new Date(editForm.date));
                                  saveMutation.mutate(updated, {
                                    onSuccess: () => {
                                      // refresh current and possibly new month lists
                                      queryClient.invalidateQueries({ queryKey: ['expenses', month] });
                                      if (newMonth !== month) queryClient.invalidateQueries({ queryKey: ['expenses', newMonth] });
                                      setEditId(null);
                                    }
                                  } as any);
                                }}
                              >Save</Button>
                              <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditId(e.id);
                                  setEditForm({
                                    date: new Date(e.date).toISOString().slice(0,10),
                                    description: e.description,
                                    amount: String(e.amount),
                                    currency: e.currency,
                                    category: e.category,
                                    paymentMethod: e.paymentMethod || 'Card',
                                  });
                                }}
                              >Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(e.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TableWrapper>
      </main>
    </div>
  );
}
