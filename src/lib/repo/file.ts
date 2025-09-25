import 'server-only';
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
import fs from 'fs';
import path from 'path';

type StoreShape = {
  positions: Position[];
  trades: Trade[];
  properties: RealEstateProperty[];
  assets: OtherAsset[];
  liabilities: Liability[];
  snapshots: NetWorthSnapshot[];
  expenses: Expense[];
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function reviveDates<T>(obj: T): T {
  // Revive known date fields to Date objects
  function revive(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      // attempt to parse ISO date strings
      const d = new Date(value);
      if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}T/.test(value)) {
        return d;
      }
      return value;
    }
    if (Array.isArray(value)) return value.map((v) => revive(v));
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return Object.fromEntries(Object.entries(record).map(([key, val]) => [key, revive(val)]));
    }
    return value;
  }
  return revive(obj) as T;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore(): StoreShape {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      positions: [],
      trades: [],
      properties: [],
      assets: [],
      liabilities: [],
      snapshots: [],
      expenses: [],
    };
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    const revived = reviveDates(JSON.parse(raw)) as Partial<StoreShape>;
    return {
      positions: revived.positions ?? [],
      trades: revived.trades ?? [],
      properties: revived.properties ?? [],
      assets: revived.assets ?? [],
      liabilities: revived.liabilities ?? [],
      snapshots: revived.snapshots ?? [],
      expenses: revived.expenses ?? [],
    };
  } catch {
    return {
      positions: [],
      trades: [],
      properties: [],
      assets: [],
      liabilities: [],
      snapshots: [],
      expenses: [],
    };
  }
}

function saveStore(store: StoreShape) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

export class FileRepo implements Repo {
  private store: StoreShape = loadStore();

  async initialize(): Promise<void> {
    this.store = loadStore();
  }

  async close(): Promise<void> {
    // noop for file-backed
  }

  // Positions
  async savePosition(position: Position): Promise<void> {
    const idx = this.store.positions.findIndex((p) => p.id === position.id);
    if (idx >= 0) this.store.positions[idx] = position; else this.store.positions.push(position);
    saveStore(this.store);
  }
  async getPosition(id: string): Promise<Position | null> {
    return this.store.positions.find((p) => p.id === id) || null;
  }
  async listPositions(account?: string): Promise<Position[]> {
    return account ? this.store.positions.filter((p) => p.account === account) : this.store.positions;
  }
  async deletePosition(id: string): Promise<void> {
    this.store.positions = this.store.positions.filter((p) => p.id !== id);
    saveStore(this.store);
  }

  // Trades
  async saveTrade(trade: Trade): Promise<void> {
    const idx = this.store.trades.findIndex((t) => t.id === trade.id);
    if (idx >= 0) this.store.trades[idx] = trade; else this.store.trades.push(trade);
    saveStore(this.store);
  }
  async getTrade(id: string): Promise<Trade | null> {
    return this.store.trades.find((t) => t.id === id) || null;
  }
  async listTrades(symbol?: string, account?: string, startDate?: Date, endDate?: Date): Promise<Trade[]> {
    let trades = [...this.store.trades];
    if (symbol) trades = trades.filter((t) => t.symbol === symbol);
    if (account) trades = trades.filter((t) => t.account === account);
    if (startDate) trades = trades.filter((t) => t.timestamp >= startDate);
    if (endDate) trades = trades.filter((t) => t.timestamp <= endDate);
    return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  async deleteTrade(id: string): Promise<void> {
    this.store.trades = this.store.trades.filter((t) => t.id !== id);
    saveStore(this.store);
  }

  // Properties
  async saveProperty(property: RealEstateProperty): Promise<void> {
    const idx = this.store.properties.findIndex((p) => p.id === property.id);
    if (idx >= 0) this.store.properties[idx] = property; else this.store.properties.push(property);
    saveStore(this.store);
  }
  async getProperty(id: string): Promise<RealEstateProperty | null> {
    return this.store.properties.find((p) => p.id === id) || null;
  }
  async listProperties(): Promise<RealEstateProperty[]> {
    return this.store.properties;
  }
  async deleteProperty(id: string): Promise<void> {
    this.store.properties = this.store.properties.filter((p) => p.id !== id);
    saveStore(this.store);
  }

  // Assets
  async saveAsset(asset: OtherAsset): Promise<void> {
    const idx = this.store.assets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) this.store.assets[idx] = asset; else this.store.assets.push(asset);
    saveStore(this.store);
  }
  async getAsset(id: string): Promise<OtherAsset | null> {
    return this.store.assets.find((a) => a.id === id) || null;
  }
  async listAssets(type?: string): Promise<OtherAsset[]> {
    return type ? this.store.assets.filter((a) => a.type === type) : this.store.assets;
  }
  async deleteAsset(id: string): Promise<void> {
    this.store.assets = this.store.assets.filter((a) => a.id !== id);
    saveStore(this.store);
  }

  // Liabilities
  async saveLiability(liability: Liability): Promise<void> {
    const idx = this.store.liabilities.findIndex((l) => l.id === liability.id);
    if (idx >= 0) this.store.liabilities[idx] = liability; else this.store.liabilities.push(liability);
    saveStore(this.store);
  }
  async getLiability(id: string): Promise<Liability | null> {
    return this.store.liabilities.find((l) => l.id === id) || null;
  }
  async listLiabilities(type?: string): Promise<Liability[]> {
    return type ? this.store.liabilities.filter((l) => l.type === type) : this.store.liabilities;
  }
  async deleteLiability(id: string): Promise<void> {
    this.store.liabilities = this.store.liabilities.filter((l) => l.id !== id);
    saveStore(this.store);
  }

  // Snapshots
  async saveSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
    const idx = this.store.snapshots.findIndex((s) => s.id === snapshot.id);
    if (idx >= 0) this.store.snapshots[idx] = snapshot; else this.store.snapshots.push(snapshot);
    saveStore(this.store);
  }
  async getSnapshot(id: string): Promise<NetWorthSnapshot | null> {
    return this.store.snapshots.find((s) => s.id === id) || null;
  }
  async listSnapshots(startDate?: Date, endDate?: Date): Promise<NetWorthSnapshot[]> {
    let snaps = [...this.store.snapshots];
    if (startDate) snaps = snaps.filter((s) => s.timestamp >= startDate);
    if (endDate) snaps = snaps.filter((s) => s.timestamp <= endDate);
    return snaps.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  async getLatestSnapshot(): Promise<NetWorthSnapshot | null> {
    if (this.store.snapshots.length === 0) return null;
    return this.store.snapshots.reduce((latest, current) => current.timestamp > latest.timestamp ? current : latest);
  }

  async getPortfolioStats(): Promise<PortfolioStats> {
    // Basic placeholder; matches MemoryRepo
    return {
      totalReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      ytdReturn: 0,
      monthlyReturns: []
    };
  }

  // Expenses
  async saveExpense(expense: Expense): Promise<void> {
    const idx = this.store.expenses.findIndex((e) => e.id === expense.id);
    if (idx >= 0) this.store.expenses[idx] = expense; else this.store.expenses.push(expense);
    saveStore(this.store);
  }
  async getExpense(id: string): Promise<Expense | null> {
    return this.store.expenses.find((e) => e.id === id) || null;
  }
  async listExpenses(month?: string): Promise<Expense[]> {
    let list = [...this.store.expenses];
    if (month) {
      list = list.filter(e => `${e.date.getFullYear()}-${String(e.date.getMonth()+1).padStart(2,'0')}` === month);
    }
    return list.sort((a,b)=> b.date.getTime()-a.date.getTime());
  }
  async deleteExpense(id: string): Promise<void> {
    this.store.expenses = this.store.expenses.filter((e) => e.id !== id);
    saveStore(this.store);
  }
}
