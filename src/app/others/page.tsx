"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getClientRepo as getRepo } from "@/lib/repo/client";
import { OtherAsset, Liability } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function OthersPage() {
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listAssets();
    }
  });

  const { data: liabilities = [] } = useQuery({
    queryKey: ['liabilities'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listLiabilities();
    }
  });

  const saveAsset = useMutation({
    mutationFn: async (asset: OtherAsset) => {
      const repo = await getRepo();
      await repo.saveAsset(asset);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] })
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const repo = await getRepo();
      await repo.deleteAsset(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] })
  });

  const saveLiability = useMutation({
    mutationFn: async (liability: Liability) => {
      const repo = await getRepo();
      await repo.saveLiability(liability);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liabilities'] })
  });

  const deleteLiability = useMutation({
    mutationFn: async (id: string) => {
      const repo = await getRepo();
      await repo.deleteLiability(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liabilities'] })
  });

  const [assetForm, setAssetForm] = useState({ name: '', type: 'CASH', value: '', currency: 'USD' });
  const [liabilityForm, setLiabilityForm] = useState({ name: '', type: 'LOAN', balance: '' });

  const addAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(assetForm.value);
    if (!assetForm.name || isNaN(value)) return;
    const asset: OtherAsset = {
      id: Date.now().toString(),
      name: assetForm.name,
      type: assetForm.type as OtherAsset['type'],
      value,
      currency: assetForm.currency,
      lastUpdated: new Date()
    };
    saveAsset.mutate(asset);
    setAssetForm({ name: '', type: 'CASH', value: '', currency: 'USD' });
  };

  const addLiability = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(liabilityForm.balance);
    if (!liabilityForm.name || isNaN(balance)) return;
    const liability: Liability = {
      id: Date.now().toString(),
      name: liabilityForm.name,
      type: liabilityForm.type as Liability['type'],
      balance,
      interestRate: 0,
      monthlyPayment: 0,
      dueDate: new Date()
    };
    saveLiability.mutate(liability);
    setLiabilityForm({ name: '', type: 'LOAN', balance: '' });
  };

  const totalAssets = assets.reduce((sum: number, a: OtherAsset) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum: number, l: Liability) => sum + l.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Other Assets" value={`$${totalAssets.toLocaleString()}`} subtitle="Cash, CPF, etc." />
          <MetricCard title="Liabilities" value={`$${totalLiabilities.toLocaleString()}`} subtitle="Debts" />
          <MetricCard title="Net" value={`$${netWorth.toLocaleString()}`} subtitle="Assets minus liabilities" />
        </div>

        <form onSubmit={addAsset} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Name" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} />
          <select className="border rounded-md px-2 py-2" value={assetForm.type} onChange={e => setAssetForm({ ...assetForm, type: e.target.value })}>
            <option value="CASH">CASH</option>
            <option value="CRYPTO">CRYPTO</option>
            <option value="PRIVATE_INVESTMENT">PRIVATE_INVESTMENT</option>
            <option value="CPF">CPF</option>
            <option value="OTHER">OTHER</option>
          </select>
          <Input placeholder="Value" type="number" value={assetForm.value} onChange={e => setAssetForm({ ...assetForm, value: e.target.value })} />
          <Input placeholder="Currency" value={assetForm.currency} onChange={e => setAssetForm({ ...assetForm, currency: e.target.value })} />
          <Button type="submit">Add Asset</Button>
        </form>

        <TableWrapper title="Assets">
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No assets added yet.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a: OtherAsset) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell><Badge>{a.type}</Badge></TableCell>
                    <TableCell>${a.value.toLocaleString()}</TableCell>
                    <TableCell>{a.currency}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => deleteAsset.mutate(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableWrapper>

        <form onSubmit={addLiability} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Name" value={liabilityForm.name} onChange={e => setLiabilityForm({ ...liabilityForm, name: e.target.value })} />
          <select className="border rounded-md px-2 py-2" value={liabilityForm.type} onChange={e => setLiabilityForm({ ...liabilityForm, type: e.target.value })}>
            <option value="LOAN">LOAN</option>
            <option value="CREDIT_CARD">CREDIT_CARD</option>
            <option value="MORTGAGE">MORTGAGE</option>
            <option value="OTHER">OTHER</option>
          </select>
          <Input placeholder="Balance" type="number" value={liabilityForm.balance} onChange={e => setLiabilityForm({ ...liabilityForm, balance: e.target.value })} />
          <Button type="submit">Add Liability</Button>
        </form>

        <TableWrapper title="Liabilities">
          {liabilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No liabilities added yet.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.map((l: Liability) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell><Badge variant="destructive">{l.type}</Badge></TableCell>
                    <TableCell className="text-red-600">${l.balance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => deleteLiability.mutate(l.id)}>
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
