"use client";

import { Navigation } from "@/components/navigation";
import { TableWrapper } from "@/components/ui/table-wrapper";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { RefreshCw, Plus, Edit, Trash2, AlertCircle, Upload, Download, FileText } from "lucide-react";
import { getRepo } from "@/lib/repo/factory";
import { Position, Trade } from "@/lib/types";

export default function BrokeragePage() {
  const [activeTab, setActiveTab] = useState<'positions' | 'trades' | 'stats'>('positions');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDataType, setUploadDataType] = useState<'auto' | 'positions' | 'trades'>('auto');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch data using React Query
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listPositions();
    }
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.listTrades();
    }
  });

  const { data: summary } = useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      // Calculate summary from positions
      const totalMarketValue = positions.reduce(
        (sum: number, pos: Position) => sum + pos.marketValue,
        0
      );
      const totalCostBasis = positions.reduce(
        (sum: number, pos: Position) => sum + pos.costBasis,
        0
      );
      const totalUnrealizedPnL = positions.reduce(
        (sum: number, pos: Position) => sum + pos.unrealizedPnL,
        0
      );
      
      return {
        netAssetValue: totalMarketValue,
        cashBalance: 0, // Would come from account summary
        totalMarketValue,
        totalCostBasis,
        totalUnrealizedPnL
      };
    },
    enabled: positions.length > 0
  });

  const { data: stats } = useQuery({
    queryKey: ['portfolio-stats'],
    queryFn: async () => {
      const repo = await getRepo();
      return await repo.getPortfolioStats();
    },
    enabled: trades.length > 0
  });

  // Sync mutations
  const syncPositionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ibkr/positions', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to sync positions');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    }
  });

  const syncTradesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ibkr/trades', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to sync trades');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
    }
  });

  // CSV Upload mutation
  const uploadCSVMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/ibkr/upload-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh relevant queries
      if (data.positionsSaved > 0) {
        queryClient.invalidateQueries({ queryKey: ['positions'] });
        queryClient.invalidateQueries({ queryKey: ['summary'] });
      }
      if (data.tradesSaved > 0) {
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      }
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDataType('auto');
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    }
  });

  // Fetch from IBKR mutation
  const fetchFromIBKRMutation = useMutation({
    mutationFn: async () => {
      // Get saved credentials
      const flexToken = localStorage.getItem('ibkr_flex_token');
      const flexQueryId = localStorage.getItem('ibkr_flex_query_id');
      
      if (!flexToken || !flexQueryId) {
        throw new Error('IBKR credentials not found. Please configure them in Settings first.');
      }

      const response = await fetch('/api/ibkr/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flexToken,
          flexQueryId,
          version: '3',
          dataType: 'auto'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch from IBKR');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] });
      
      // Show success message
      alert(`Data fetched from IBKR successfully!\n\nPositions: ${data.positionsSaved || 0}\nTrades: ${data.tradesSaved || 0}\nTotal rows: ${data.rowsProcessed}`);
    },
    onError: (error) => {
      console.error('IBKR fetch failed:', error);
      alert(`Failed to fetch from IBKR: ${error.message}`);
    }
  });

  const totalMarketValue = positions.reduce(
    (sum: number, pos: Position) => sum + pos.marketValue,
    0
  );
  const totalUnrealizedPnL = positions.reduce(
    (sum: number, pos: Position) => sum + pos.unrealizedPnL,
    0
  );

  const handleAddPosition = () => {
    // TODO: Implement add position modal/form
    console.log('Add position clicked');
  };

  const handleEditPosition = (positionId: string) => {
    // TODO: Implement edit position modal/form
    console.log('Edit position clicked:', positionId);
  };

  const handleDeletePosition = (positionId: string) => {
    // TODO: Implement delete position confirmation
    console.log('Delete position clicked:', positionId);
  };

  const handleAddTrade = () => {
    // TODO: Implement add trade modal/form
    console.log('Add trade clicked');
  };

  const handleEditTrade = (tradeId: string) => {
    // TODO: Implement edit trade modal/form
    console.log('Edit trade clicked:', tradeId);
  };

  const handleDeleteTrade = (tradeId: string) => {
    // TODO: Implement delete trade confirmation
    console.log('Delete trade clicked:', tradeId);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setUploadFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('dataType', uploadDataType);

    try {
      await uploadCSVMutation.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    // Create sample CSV content
    const sampleCSV = `Symbol,Quantity,Cost Basis,Market Value,Unrealized P&L,Account
AAPL,100,175.50,178.20,270.00,IBKR-001
MSFT,50,320.00,325.80,290.00,IBKR-001
GOOGL,25,140.00,142.50,62.50,IBKR-001`;
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ibkr_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Market Value"
              value={positions.length > 0 ? `$${totalMarketValue.toLocaleString()}` : "Upload CSV to view"}
              subtitle={positions.length > 0 ? "All positions" : "Upload IBKR CSV export"}
            />
            <MetricCard
              title="Unrealized P&L"
              value={positions.length > 0 ? `$${totalUnrealizedPnL.toLocaleString()}` : "Upload CSV to view"}
              subtitle={positions.length > 0 ? "Current positions" : "Upload IBKR CSV export"}
            />
            <MetricCard
              title="Cash Balance"
              value={summary ? `$${summary.cashBalance?.toLocaleString()}` : "Upload CSV to view"}
              subtitle={summary ? "Available funds" : "Upload IBKR CSV export"}
            />
            <MetricCard
              title="Net Asset Value"
              value={summary ? `$${summary.netAssetValue?.toLocaleString()}` : "Upload CSV to view"}
              subtitle={summary ? "Total portfolio value" : "Upload IBKR CSV export"}
            />
          </div>

          {/* CSV Upload Section */}
          {positions.length === 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Import IBKR Data
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                To view your portfolio data, either upload a CSV export or fetch directly from IBKR using your configured credentials.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
                <Button 
                  onClick={() => fetchFromIBKRMutation.mutate()}
                  disabled={fetchFromIBKRMutation.isPending}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${fetchFromIBKRMutation.isPending ? 'animate-spin' : ''}`} />
                  {fetchFromIBKRMutation.isPending ? 'Fetching...' : 'Fetch from IBKR'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadSample}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Sample
                </Button>
              </div>
            </div>
          )}

          {/* Connection Status */}
          {positions.length === 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    No Portfolio Data
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Upload your IBKR CSV export to start tracking your portfolio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-2 border-b">
            <Button
              variant={activeTab === 'positions' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('positions')}
            >
              Positions
            </Button>
            <Button
              variant={activeTab === 'trades' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('trades')}
            >
              Trades
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('stats')}
            >
              Statistics
            </Button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'positions' && (
            <TableWrapper title="Current Positions" actions={
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchFromIBKRMutation.mutate()}
                  disabled={fetchFromIBKRMutation.isPending}
                  size="sm"
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${fetchFromIBKRMutation.isPending ? 'animate-spin' : ''}`} />
                  {fetchFromIBKRMutation.isPending ? 'Fetching...' : 'Fetch from IBKR'}
                </Button>
                <Button 
                  onClick={() => syncPositionsMutation.mutate()}
                  disabled={syncPositionsMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncPositionsMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncPositionsMutation.isPending ? 'Syncing...' : 'Sync Positions'}
                </Button>
                <Button onClick={handleAddPosition} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Position
                </Button>
                <Button 
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
              </div>
            }>
              {positions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No positions found. Upload IBKR CSV export to view your portfolio data.</p>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position: Position) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">{position.symbol}</TableCell>
                        <TableCell>{position.quantity.toLocaleString()}</TableCell>
                        <TableCell>${position.costBasis.toFixed(2)}</TableCell>
                        <TableCell>${position.marketValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={position.unrealizedPnL >= 0 ? 'default' : 'destructive'}>
                            ${position.unrealizedPnL.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>{position.account}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPosition(position.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePosition(position.id)}
                            >
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
          )}

          {activeTab === 'trades' && (
            <TableWrapper title="Trade History" actions={
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchFromIBKRMutation.mutate()}
                  disabled={fetchFromIBKRMutation.isPending}
                  size="sm"
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${fetchFromIBKRMutation.isPending ? 'animate-spin' : ''}`} />
                  {fetchFromIBKRMutation.isPending ? 'Fetching...' : 'Fetch from IBKR'}
                </Button>
                <Button 
                  onClick={() => syncTradesMutation.mutate()}
                  disabled={syncTradesMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncTradesMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncTradesMutation.isPending ? 'Syncing...' : 'Sync Trades'}
                </Button>
                <Button onClick={handleAddTrade} size="sm" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Trade
                </Button>
                <Button 
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
              </div>
            }>
              {trades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No trades found. Upload IBKR CSV export to view your trade history.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade: Trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>{new Date(trade.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'}>
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.quantity.toLocaleString()}</TableCell>
                        <TableCell>${trade.price.toFixed(2)}</TableCell>
                        <TableCell>${trade.commission.toFixed(2)}</TableCell>
                        <TableCell>{trade.account}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTrade(trade.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTrade(trade.id)}
                            >
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
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="YTD Return"
                  value={stats ? `${stats.ytdReturn}%` : 'Upload CSV to view'}
                  subtitle="Year to date"
                />
                <MetricCard
                  title="Volatility"
                  value={stats ? `${stats.volatility}%` : 'Upload CSV to view'}
                  subtitle="Annualized"
                />
                <MetricCard
                  title="Sharpe Ratio"
                  value={stats ? stats.sharpeRatio.toFixed(2) : 'Upload CSV to view'}
                  subtitle="Risk-adjusted return"
                />
              </div>

              {/* Monthly Returns Chart */}
              <ChartCard title="Monthly Returns">
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <p>Upload IBKR CSV export to view monthly returns chart</p>
                </div>
              </ChartCard>
            </div>
          )}
        </div>
      </main>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload IBKR CSV Export</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data Type</label>
                <select
                  value={uploadDataType}
                  onChange={(e) =>
                    setUploadDataType(
                      e.target.value as 'auto' | 'positions' | 'trades'
                    )
                  }
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="positions">Positions only</option>
                  <option value="trades">Trades only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-md bg-background"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Supported formats: CSV exports from IBKR Flex Queries</p>
                <p>• Auto-detect will try to identify positions and trades</p>
                <p>• File should include headers for best results</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
