"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit, Trash2, Calculator } from "lucide-react";
import { RealEstateProperty } from "@/lib/types";

export default function RealEstatePage() {
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch properties data
  const { data: properties = [] } = useQuery<RealEstateProperty[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      // In a real app, this would fetch from the repository
      // For now, return empty array - will be populated when properties are added
      return [] as RealEstateProperty[];
    }
  });

  const totalEquity = properties.reduce(
    (sum: number, prop: RealEstateProperty) =>
      sum + (prop.currentValue - prop.loanPrincipal),
    0
  );

  const totalLoanBalance = properties.reduce(
    (sum: number, prop: RealEstateProperty) => sum + prop.loanPrincipal,
    0
  );

  const handleAddProperty = () => {
    // TODO: Implement add property modal/form
    console.log('Add property clicked');
    setShowAddForm(true);
  };

  const handleEditProperty = (propertyId: string) => {
    // TODO: Implement edit property modal/form
    console.log('Edit property clicked:', propertyId);
  };

  const handleDeleteProperty = (propertyId: string) => {
    // TODO: Implement delete property confirmation
    console.log('Delete property clicked:', propertyId);
  };

  const handleCalculateAmortization = (propertyId: string) => {
    // TODO: Implement amortization schedule calculation
    console.log('Calculate amortization clicked:', propertyId);
  };

  const handleUpdatePropertyValue = (propertyId: string) => {
    // TODO: Implement property value update modal
    console.log('Update property value clicked:', propertyId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Real Estate Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Properties"
              value={properties.length}
              subtitle="Owned properties"
            />
            <MetricCard
              title="Total Equity"
              value={`$${totalEquity.toLocaleString()}`}
              subtitle="Net property value"
            />
            <MetricCard
              title="Total Loan Balance"
              value={`$${totalLoanBalance.toLocaleString()}`}
              subtitle="Outstanding mortgages"
            />
            <MetricCard
              title="Monthly Payments"
              value={`$${properties.reduce(
                (sum: number, p: RealEstateProperty) => sum + p.monthlyPayment,
                0
              ).toLocaleString()}`}
              subtitle="Total mortgage payments"
            />
          </div>

          {/* Property Cards */}
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted rounded-lg p-8">
                <h3 className="text-lg font-semibold mb-2">No Properties Added</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first property to track real estate investments.
                </p>
                <Button onClick={handleAddProperty} className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Your First Property
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {properties.map((property: RealEstateProperty) => (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{property.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProperty(property.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Purchase Price</p>
                        <p className="font-medium">${property.purchasePrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Value</p>
                        <p className="font-medium">${property.currentValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Down Payment</p>
                        <p className="font-medium">${property.downPayment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Loan Balance</p>
                        <p className="font-medium">${property.loanPrincipal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Rate</p>
                        <p className="font-medium">{property.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p className="font-medium">${property.monthlyPayment.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Equity</span>
                        <span className="font-semibold text-green-600">
                          ${(property.currentValue - property.loanPrincipal).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCalculateAmortization(property.id)}
                        className="flex items-center gap-2"
                      >
                        <Calculator className="h-4 w-4" />
                        Amortization
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdatePropertyValue(property.id)}
                      >
                        Update Value
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add Property Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleAddProperty}
              className="px-8 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New Property
            </Button>
          </div>

          {/* Loan Amortization Chart */}
          <ChartCard title="Loan Balance Over Time">
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Loan amortization chart will be displayed here</p>
            </div>
          </ChartCard>

          {/* Properties Table */}
          <TableWrapper title="Property Details">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Loan Balance</TableHead>
                  <TableHead>Equity</TableHead>
                  <TableHead>Monthly Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property: RealEstateProperty) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{new Date(property.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>${property.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell>${property.currentValue.toLocaleString()}</TableCell>
                    <TableCell>${property.loanPrincipal.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ${(property.currentValue - property.loanPrincipal).toLocaleString()}
                    </TableCell>
                    <TableCell>${property.monthlyPayment.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProperty(property.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </div>
      </main>
    </div>
  );
}
