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

