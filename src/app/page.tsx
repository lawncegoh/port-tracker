"use client";

import { Navigation } from "@/components/navigation";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getClientRepo as getRepo } from "@/lib/repo/client";
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
  const totalOtherAssets = assets.reduce(
    (sum: number, asset: OtherAsset) => sum + asset.value,
    0
  );
  const totalLiabilities = liabilities.reduce(
    (sum: number, liab: Liability) => sum + liab.balance,
    0
  );
  
  // Total Net Worth uses Net Liq (SGD) for brokerage portion
  const totalNetWorth = netLiqSGD + totalRealEstateEquity + totalOtherAssets - totalLiabilities;

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
              subtitle={totalNetWorth > 0 ? "As of today" : "Add positions and assets"}
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

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Asset Allocation">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {netLiqSGD > 0 || totalRealEstateEquity > 0 || totalOtherAssets > 0 ? (
                  <div className="text-center">
                    <p>Portfolio (NLV, SGD): S${netLiqSGD.toLocaleString()}</p>
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
                    <p>Net Worth: S${totalNetWorth.toLocaleString()}</p>
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
