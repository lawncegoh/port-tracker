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

function ymd(date: Date = new Date()) {
  // Local timezone YYYY-MM-DD for input[type=date]
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
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

  // Fetch all expenses for month-on-month visualization
  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses', 'all'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listExpenses();
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

  // Category filter state for expenses table
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const toggleCategoryFilter = (cat: string) => {
    setCategoryFilter((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };
  const clearCategoryFilter = () => setCategoryFilter([]);

  const [form, setForm] = useState({
    date: ymd(),
    description: '',
    amount: '',
    currency: 'SGD',
    category: 'General',
    paymentMethod: 'Card',
    recurringMonthly: false,
  });
  // previously used for future-date validation; no longer needed

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: ymd(),
    description: '',
    amount: '',
    currency: 'SGD',
    category: 'General',
    paymentMethod: 'Card',
    recurringMonthly: false,
  });
  // no edit error state needed now

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
      recurringMonthly: form.recurringMonthly || undefined,
      status: 'cleared',
      createdAt: new Date()
    };
    saveMutation.mutate(exp);
    setForm({ date: ymd(), description: '', amount: '', currency: 'SGD', category: 'General', paymentMethod: 'Card', recurringMonthly: false });
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

  const filteredExpenses = useMemo(() => {
    if (!categoryFilter.length) return expenses;
    const set = new Set(categoryFilter);
    return expenses.filter(e => set.has(e.category));
  }, [expenses, categoryFilter]);

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

  // MoM stacked columns per category
  // Build a stable category order from the last 12 months of expenses,
  // not just the currently selected month (prevents empty stacks when the
  // current month has no spend).
  const catOrder = useMemo(() => {
    // Prefer the current month's category order to match the left legend colors
    const currentEntries = Array.from(summary.totalsByCat.entries());
    if (currentEntries.length > 0) {
      return currentEntries.sort((a,b)=> b[1]-a[1]).map(([c])=>c);
    }
    // Otherwise, derive from the last 12 months so MoM isn't empty
    const last12 = months.slice(0, 12); // most recent first
    const totals = new Map<string, number>();
    for (const e of allExpenses) {
      const key = ym(new Date(e.date));
      if (!last12.includes(key)) continue;
      totals.set(e.category, (totals.get(e.category) || 0) + e.amount);
    }
    return Array.from(totals.entries()).sort((a,b)=> b[1]-a[1]).map(([c])=>c);
  }, [summary, allExpenses, months]);
  const catColors = ['#2563eb','#16a34a','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#22c55e','#eab308','#f97316','#06b6d4'];
  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    catOrder.forEach((c, i) => m.set(c, catColors[i % catColors.length]));
    return m;
  }, [catOrder]);

  const momCatData = useMemo(() => {
    const last12 = months.slice(0, 12).reverse(); // chronological
    const out = last12.map((m) => {
      const monthTotals = new Map<string, number>();
      for (const c of catOrder) monthTotals.set(c, 0);
      for (const e of allExpenses) {
        const key = ym(new Date(e.date));
        if (key !== m) continue;
        if (!monthTotals.has(e.category)) monthTotals.set(e.category, 0);
        monthTotals.set(e.category, (monthTotals.get(e.category) || 0) + e.amount);
      }
      const total = Array.from(monthTotals.values()).reduce((s,v)=>s+v,0);
      return { month: m, total, byCat: monthTotals } as { month: string; total: number; byCat: Map<string, number> };
    });
    return out;
  }, [allExpenses, months, catOrder]);

  const momMax = useMemo(() => (momCatData.reduce((mx, d) => Math.max(mx, d.total), 0) || 1), [momCatData]);

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

        {/* Left/Right split: left = category visuals, right = MoM chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Stacked bars: category split */}
            <TableWrapper title="Category Split (Stacked Bars)">
              {summary.total > 0 ? (
                <div className="space-y-6">
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
          </div>

          {/* Right: Month-on-Month stacked columns (by category) */}
          <div>
            <TableWrapper title="Month-on-Month Total Spend">
              {momCatData.length > 0 ? (
                <div className="w-full">
                  <div className="flex gap-2 border rounded-md p-3">
                    {/* Y axis */}
                    <div className="flex flex-col justify-between text-[10px] w-14 pr-1 text-muted-foreground">
                      {Array.from({length:5}).map((_,i)=>{
                        const val = Math.round(momMax * (1 - i/4));
                        return <div key={i}>${val.toLocaleString()}</div>;
                      })}
                    </div>
                    {/* Bars with grid lines */}
                    <div className="relative flex-1">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {Array.from({length:5}).map((_,i)=>(
                          <div key={i} className="border-t border-border/30"></div>
                        ))}
                      </div>
                      <div className="relative h-64 md:h-72 w-full grid grid-cols-12 items-end gap-2 px-1">
                        {momCatData.map((d, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                              {catOrder.map((c) => {
                                const amt = d.byCat.get(c) || 0;
                                if (amt <= 0) return null;
                                const h = (amt / momMax) * 100;
                                return <div key={c} style={{ height: `${h}%`, backgroundColor: colorMap.get(c) }} />;
                              })}
                            </div>
                            <div className="text-[10px] text-muted-foreground whitespace-nowrap">{d.month.slice(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">No month-on-month data yet.</div>
              )}
            </TableWrapper>
          </div>
        </div>

        {/* Add expense */}
        <div className="w-full overflow-x-auto">
        <form onSubmit={handleAdd} className="space-y-3 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-3 items-start">
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <Input placeholder="Currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
            <select className="border rounded-md px-2 py-2 h-9" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['General','Food','Transport','Groceries','Bills','Mortgage','Entertainment','Travel','Health','Shopping','Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border rounded-md px-2 py-2 h-9" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              {['Card','PayLah','Vouchers'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={form.recurringMonthly} onChange={e => setForm({ ...form, recurringMonthly: e.target.checked })} />
              Recurring monthly
            </label>
            <Button type="submit" className="whitespace-nowrap shrink-0 min-w-[120px]">Add Expense</Button>
          </div>
        </form>
        </div>

        {/* Expenses list */}
        <TableWrapper title="Expenses">
          {/* Category filter controls */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              variant={categoryFilter.length === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={clearCategoryFilter}
            >All</Button>
            {Array.from(summary.totalsByCat.keys()).sort().map((cat) => {
              const active = categoryFilter.includes(cat);
              return (
                <Button key={cat} variant={active ? 'default' : 'outline'} size="sm" onClick={() => toggleCategoryFilter(cat)}>
                  {cat}
                </Button>
              );
            })}
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No expenses yet for {month}{categoryFilter.length ? ' (filtered)' : ''}.</div>
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
                  {filteredExpenses.map((e) => {
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
                            <div className="flex items-center gap-3">
                              <select className="border rounded-md px-2 py-2 h-9" value={editForm.paymentMethod} onChange={ev => setEditForm({ ...editForm, paymentMethod: ev.target.value })}>
                                {['Card','PayLah','Vouchers'].map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input type="checkbox" checked={editForm.recurringMonthly} onChange={ev => setEditForm({ ...editForm, recurringMonthly: ev.target.checked })} />
                                Recurring monthly
                              </label>
                            </div>
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
                                    recurringMonthly: editForm.recurringMonthly || undefined,
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
                                    date: ymd(new Date(e.date)),
                                    description: e.description,
                                    amount: String(e.amount),
                                    currency: e.currency,
                                    category: e.category,
                                    paymentMethod: e.paymentMethod || 'Card',
                                    recurringMonthly: e.recurringMonthly || false,
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
