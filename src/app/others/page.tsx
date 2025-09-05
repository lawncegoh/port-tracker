"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Plus, Edit, Trash2, DollarSign, CreditCard, Home, PiggyBank } from "lucide-react";

export default function OthersPage() {
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities'>('assets');

  // Mock data - in a real app this would come from the repository
  const assets: any[] = [];
  const liabilities: any[] = [];

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'CASH': return 'default';
      case 'CRYPTO': return 'secondary';
      case 'PRIVATE_INVESTMENT': return 'outline';
      default: return 'default';
    }
  };

  const getLiabilityTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD': return 'destructive';
      case 'LOAN': return 'secondary';
      case 'MORTGAGE': return 'outline';
      default: return 'default';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'CASH': return <DollarSign className="h-4 w-4" />;
      case 'CRYPTO': return <PiggyBank className="h-4 w-4" />;
      case 'PRIVATE_INVESTMENT': return <Home className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getLiabilityTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD': return <CreditCard className="h-4 w-4" />;
      case 'LOAN': return <DollarSign className="h-4 w-4" />;
      case 'MORTGAGE': return <Home className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const handleAddAsset = () => {
    // TODO: Implement add asset modal/form
    console.log('Add asset clicked');
  };

  const handleEditAsset = (assetId: string) => {
    // TODO: Implement edit asset modal/form
    console.log('Edit asset clicked:', assetId);
  };

  const handleDeleteAsset = (assetId: string) => {
    // TODO: Implement delete asset confirmation
    console.log('Delete asset clicked:', assetId);
  };

  const handleAddLiability = () => {
    // TODO: Implement add liability modal/form
    console.log('Add liability clicked');
  };

  const handleEditLiability = (liabilityId: string) => {
    // TODO: Implement edit liability modal/form
    console.log('Edit liability clicked:', liabilityId);
  };

  const handleDeleteLiability = (liabilityId: string) => {
    // TODO: Implement delete liability confirmation
    console.log('Delete liability clicked:', liabilityId);
  };

  const handleUpdateAssetValue = (assetId: string) => {
    // TODO: Implement asset value update modal
    console.log('Update asset value clicked:', assetId);
  };

  const handleUpdateLiabilityBalance = (liabilityId: string) => {
    // TODO: Implement liability balance update modal
    console.log('Update liability balance clicked:', liabilityId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Assets"
              value={`$${totalAssets.toLocaleString()}`}
              subtitle="Other assets value"
            />
            <MetricCard
              title="Total Liabilities"
              value={`$${totalLiabilities.toLocaleString()}`}
              subtitle="Outstanding debt"
            />
            <MetricCard
              title="Net Worth"
              value={`$${netWorth.toLocaleString()}`}
              subtitle="Assets - Liabilities"
              trend={{ 
                value: netWorth > 0 ? 5.2 : -2.1, 
                isPositive: netWorth > 0 
              }}
            />
            <MetricCard
              title="Monthly Payments"
              value={`$${liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0).toLocaleString()}`}
              subtitle="Total monthly debt payments"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 border-b">
            <Button
              variant={activeTab === 'assets' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('assets')}
            >
              Assets
            </Button>
            <Button
              variant={activeTab === 'liabilities' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('liabilities')}
            >
              Liabilities
            </Button>
          </div>

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              {/* Asset Cards */}
              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-muted rounded-lg p-8">
                    <h3 className="text-lg font-semibold mb-2">No Assets Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first asset to track cash, crypto, and other investments.
                    </p>
                    <Button onClick={handleAddAsset} className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add Your First Asset
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <Card key={asset.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getAssetTypeIcon(asset.type)}
                            {asset.name}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAsset(asset.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={getAssetTypeColor(asset.type) as any}>
                            {asset.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {asset.currency}
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          ${asset.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last updated: {asset.lastUpdated.toLocaleDateString()}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateAssetValue(asset.id)}
                            className="w-full"
                          >
                            Update Value
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Asset Button */}
              <div className="flex justify-center">
                <Button onClick={handleAddAsset} className="px-8 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Asset
                </Button>
              </div>

              {/* Assets Table */}
              <TableWrapper title="Assets Overview">
                {assets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No assets found. Add your first asset to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>
                            <Badge variant={getAssetTypeColor(asset.type) as any}>
                              {asset.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>${asset.value.toLocaleString()}</TableCell>
                          <TableCell>{asset.currency}</TableCell>
                          <TableCell>{asset.lastUpdated.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditAsset(asset.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
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
            </div>
          )}

          {/* Liabilities Tab */}
          {activeTab === 'liabilities' && (
            <div className="space-y-6">
              {/* Liability Cards */}
              {liabilities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-muted rounded-lg p-8">
                    <h3 className="text-lg font-semibold mb-2">No Liabilities Added</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first liability to track loans, credit cards, and other debt.
                    </p>
                    <Button onClick={handleAddLiability} className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add Your First Liability
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liabilities.map((liability) => (
                    <Card key={liability.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getLiabilityTypeIcon(liability.type)}
                            {liability.name}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditLiability(liability.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteLiability(liability.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={getLiabilityTypeColor(liability.type) as any}>
                            {liability.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Due: {liability.dueDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          ${liability.balance.toLocaleString()}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Interest Rate</p>
                            <p className="font-medium">{liability.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monthly Payment</p>
                            <p className="font-medium">${liability.monthlyPayment.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateLiabilityBalance(liability.id)}
                            className="w-full"
                          >
                            Update Balance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Liability Button */}
              <div className="flex justify-center">
                <Button onClick={handleAddLiability} className="px-8 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Liability
                </Button>
              </div>

              {/* Liabilities Table */}
              <TableWrapper title="Liabilities Overview">
                {liabilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No liabilities found. Add your first liability to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Monthly Payment</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liabilities.map((liability) => (
                        <TableRow key={liability.id}>
                          <TableCell className="font-medium">{liability.name}</TableCell>
                          <TableCell>
                            <Badge variant={getLiabilityTypeColor(liability.type) as any}>
                              {liability.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            ${liability.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>{liability.interestRate}%</TableCell>
                          <TableCell>${liability.monthlyPayment.toLocaleString()}</TableCell>
                          <TableCell>{liability.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditLiability(liability.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteLiability(liability.id)}>
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
            </div>
          )}

          {/* Net Worth Chart */}
          <ChartCard title="Net Worth Breakdown">
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Net worth breakdown chart will be displayed here</p>
            </div>
          </ChartCard>
        </div>
      </main>
    </div>
  );
}
