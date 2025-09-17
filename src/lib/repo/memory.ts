import { Repo } from './interface';
import {
  Position,
  Trade,
  RealEstateProperty,
  OtherAsset,
  Liability,
  NetWorthSnapshot,
  PortfolioStats
} from '@/lib/types';
import { Expense } from '@/lib/types';

export class MemoryRepo implements Repo {
  private positions: Position[] = [];
  private trades: Trade[] = [];
  private properties: RealEstateProperty[] = [];
  private assets: OtherAsset[] = [];
  private liabilities: Liability[] = [];
  private snapshots: NetWorthSnapshot[] = [];
  private expenses: Expense[] = [];

  async initialize(): Promise<void> {
    // Initialize empty repository
  }

  async close(): Promise<void> {
    // Clear all data
    this.positions = [];
    this.trades = [];
    this.properties = [];
    this.assets = [];
    this.liabilities = [];
    this.snapshots = [];
    this.expenses = [];
  }

  // Positions
  async savePosition(position: Position): Promise<void> {
    const index = this.positions.findIndex(p => p.id === position.id);
    if (index !== -1) {
      this.positions[index] = position;
    } else {
      this.positions.push(position);
    }
  }

  async getPosition(id: string): Promise<Position | null> {
    return this.positions.find(p => p.id === id) || null;
  }

  async listPositions(account?: string): Promise<Position[]> {
    if (account) {
      return this.positions.filter(p => p.account === account);
    }
    return this.positions;
  }

  async deletePosition(id: string): Promise<void> {
    const index = this.positions.findIndex(p => p.id === id);
    if (index !== -1) {
      this.positions.splice(index, 1);
    }
  }

  // Trades
  async saveTrade(trade: Trade): Promise<void> {
    const index = this.trades.findIndex(t => t.id === trade.id);
    if (index !== -1) {
      this.trades[index] = trade;
    } else {
      this.trades.push(trade);
    }
  }

  async getTrade(id: string): Promise<Trade | null> {
    return this.trades.find(t => t.id === id) || null;
  }

  async listTrades(symbol?: string, account?: string, startDate?: Date, endDate?: Date): Promise<Trade[]> {
    let trades = this.trades;
    
    if (symbol) {
      trades = trades.filter(t => t.symbol === symbol);
    }
    if (account) {
      trades = trades.filter(t => t.account === account);
    }
    if (startDate) {
      trades = trades.filter(t => t.timestamp >= startDate);
    }
    if (endDate) {
      trades = trades.filter(t => t.timestamp <= endDate);
    }
    
    return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async deleteTrade(id: string): Promise<void> {
    const index = this.trades.findIndex(t => t.id === id);
    if (index !== -1) {
      this.trades.splice(index, 1);
    }
  }

  // Real Estate Properties
  async saveProperty(property: RealEstateProperty): Promise<void> {
    const index = this.properties.findIndex(p => p.id === property.id);
    if (index !== -1) {
      this.properties[index] = property;
    } else {
      this.properties.push(property);
    }
  }

  async getProperty(id: string): Promise<RealEstateProperty | null> {
    return this.properties.find(p => p.id === id) || null;
  }

  async listProperties(): Promise<RealEstateProperty[]> {
    return this.properties;
  }

  async deleteProperty(id: string): Promise<void> {
    const index = this.properties.findIndex(p => p.id === id);
    if (index !== -1) {
      this.properties.splice(index, 1);
    }
  }

  // Other Assets
  async saveAsset(asset: OtherAsset): Promise<void> {
    const index = this.assets.findIndex(a => a.id === asset.id);
    if (index !== -1) {
      this.assets[index] = asset;
    } else {
      this.assets.push(asset);
    }
  }

  async getAsset(id: string): Promise<OtherAsset | null> {
    return this.assets.find(a => a.id === id) || null;
  }

  async listAssets(type?: string): Promise<OtherAsset[]> {
    if (type) {
      return this.assets.filter(a => a.type === type);
    }
    return this.assets;
  }

  async deleteAsset(id: string): Promise<void> {
    const index = this.assets.findIndex(a => a.id === id);
    if (index !== -1) {
      this.assets.splice(index, 1);
    }
  }

  // Liabilities
  async saveLiability(liability: Liability): Promise<void> {
    const index = this.liabilities.findIndex(l => l.id === liability.id);
    if (index !== -1) {
      this.liabilities[index] = liability;
    } else {
      this.liabilities.push(liability);
    }
  }

  async getLiability(id: string): Promise<Liability | null> {
    return this.liabilities.find(l => l.id === id) || null;
  }

  async listLiabilities(type?: string): Promise<Liability[]> {
    if (type) {
      return this.liabilities.filter(l => l.type === type);
    }
    return this.liabilities;
  }

  async deleteLiability(id: string): Promise<void> {
    const index = this.liabilities.findIndex(l => l.id === id);
    if (index !== -1) {
      this.liabilities.splice(index, 1);
    }
  }

  // Net Worth Snapshots
  async saveSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
    const index = this.snapshots.findIndex(s => s.id === snapshot.id);
    if (index !== -1) {
      this.snapshots[index] = snapshot;
    } else {
      this.snapshots.push(snapshot);
    }
  }

  async getSnapshot(id: string): Promise<NetWorthSnapshot | null> {
    return this.snapshots.find(s => s.id === id) || null;
  }

  async listSnapshots(startDate?: Date, endDate?: Date): Promise<NetWorthSnapshot[]> {
    let snapshots = this.snapshots;
    
    if (startDate) {
      snapshots = snapshots.filter(s => s.timestamp >= startDate);
    }
    if (endDate) {
      snapshots = snapshots.filter(s => s.timestamp <= endDate);
    }
    
    return snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLatestSnapshot(): Promise<NetWorthSnapshot | null> {
    if (this.snapshots.length === 0) return null;
    
    return this.snapshots.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  // Portfolio Statistics
  async getPortfolioStats(startDate?: Date, endDate?: Date): Promise<PortfolioStats> {
    // Calculate basic stats from trades and positions
    const trades = await this.listTrades(undefined, undefined, startDate, endDate);
    
    // Simple calculation - in a real app, this would be more sophisticated
    const totalPnL = trades.reduce((sum, trade) => {
      if (trade.side === 'BUY') {
        return sum - (trade.quantity * trade.price + trade.commission);
      } else {
        return sum + (trade.quantity * trade.price - trade.commission);
      }
    }, 0);

    return {
      totalReturn: totalPnL,
      volatility: 0, // Will be calculated when data is available
      sharpeRatio: 0, // Will be calculated when data is available
      maxDrawdown: 0, // Will be calculated when data is available
      ytdReturn: 0, // Will be calculated when data is available
      monthlyReturns: []
    };
  }

  // Expenses
  async saveExpense(expense: Expense): Promise<void> {
    const idx = this.expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) this.expenses[idx] = expense; else this.expenses.push(expense);
  }
  async getExpense(id: string): Promise<Expense | null> {
    return this.expenses.find(e => e.id === id) || null;
  }
  async listExpenses(month?: string): Promise<Expense[]> {
    let list = this.expenses;
    if (month) {
      list = list.filter(e => {
        const m = `${e.date.getFullYear()}-${String(e.date.getMonth()+1).padStart(2,'0')}`;
        return m === month;
      });
    }
    return list.sort((a,b) => b.date.getTime() - a.date.getTime());
  }
  async deleteExpense(id: string): Promise<void> {
    this.expenses = this.expenses.filter(e => e.id !== id);
  }
}
