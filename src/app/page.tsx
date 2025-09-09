"use client";

import { Navigation } from "@/components/navigation";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getRepo } from "@/lib/repo/factory";
import {
  Position,
  RealEstateProperty,
  OtherAsset,
  Liability,
} from "@/lib/types";

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

  const { data: assets = [] } = useQuery<OtherAsset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listAssets();
    }
  });

  const { data: liabilities = [] } = useQuery<Liability[]>({
    queryKey: ['liabilities'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listLiabilities();
    }
  });

  // Calculate totals
  const totalPortfolioValue = positions.reduce(
    (sum: number, pos: Position) => sum + pos.marketValue,
    0
  );
  const totalRealEstateEquity = properties.reduce(
    (sum: number, prop: RealEstateProperty) =>
      sum + (prop.currentValue - prop.loanPrincipal),
    0
  );
  const totalOtherAssets = assets.reduce(
    (sum: number, asset: OtherAsset) => sum + asset.value,
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum: number, liab: Liability) => sum + liab.balance,
    0
  );
  
  const totalNetWorth = totalPortfolioValue + totalRealEstateEquity + totalOtherAssets - totalLiabilities;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Net Worth Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Net Worth"
              value={totalNetWorth > 0 ? `$${totalNetWorth.toLocaleString()}` : "Add data to view"}
              subtitle={totalNetWorth > 0 ? "As of today" : "Add positions and assets"}
            />
            <MetricCard
              title="Portfolio Value"
              value={totalPortfolioValue > 0 ? `$${totalPortfolioValue.toLocaleString()}` : "Add positions to view"}
              subtitle={totalPortfolioValue > 0 ? "Brokerage accounts" : "Add your brokerage positions"}
            />
            <MetricCard
              title="Real Estate Equity"
              value={totalRealEstateEquity > 0 ? `$${totalRealEstateEquity.toLocaleString()}` : "Add properties to view"}
              subtitle={totalRealEstateEquity > 0 ? "Property values" : "Add real estate properties"}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Asset Allocation">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {totalPortfolioValue > 0 || totalRealEstateEquity > 0 || totalOtherAssets > 0 ? (
                  <div className="text-center">
                    <p>Portfolio: ${totalPortfolioValue.toLocaleString()}</p>
                    <p>Real Estate: ${totalRealEstateEquity.toLocaleString()}</p>
                    <p>Other Assets: ${totalOtherAssets.toLocaleString()}</p>
                  </div>
                ) : (
                  <p>Add assets to view allocation</p>
                )}
              </div>
            </ChartCard>
            
            <ChartCard title="Liabilities Breakdown">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {totalLiabilities > 0 ? (
                  <div className="text-center">
                    <p>Total Liabilities: ${totalLiabilities.toLocaleString()}</p>
                    <p>Net Worth: ${totalNetWorth.toLocaleString()}</p>
                  </div>
                ) : (
                  <p>Add liabilities to view breakdown</p>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="YTD Return"
              value={"Calculate from trades"}
              subtitle="Portfolio performance"
            />
            <MetricCard
              title="Volatility"
              value={"Calculate from trades"}
              subtitle="Annualized"
            />
            <MetricCard
              title="Max Drawdown"
              value={"Calculate from trades"}
              subtitle="Peak to trough"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
