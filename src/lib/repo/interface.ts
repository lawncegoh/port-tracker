import {
  Position,
  Trade,
  RealEstateProperty,
  OtherAsset,
  Liability,
  NetWorthSnapshot,
  PortfolioStats,
  Expense,
} from '@/lib/types';

export interface Repo {
  // lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;

  // positions
  savePosition(position: Position): Promise<void>;
  getPosition(id: string): Promise<Position | null>;
  listPositions(account?: string): Promise<Position[]>;
  deletePosition(id: string): Promise<void>;

  // trades
  saveTrade(trade: Trade): Promise<void>;
  getTrade(id: string): Promise<Trade | null>;
  listTrades(
    symbol?: string,
    account?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Trade[]>;
  deleteTrade(id: string): Promise<void>;

  // real estate properties
  saveProperty(property: RealEstateProperty): Promise<void>;
  getProperty(id: string): Promise<RealEstateProperty | null>;
  listProperties(): Promise<RealEstateProperty[]>;
  deleteProperty(id: string): Promise<void>;

  // other assets
  saveAsset(asset: OtherAsset): Promise<void>;
  getAsset(id: string): Promise<OtherAsset | null>;
  listAssets(type?: string): Promise<OtherAsset[]>;
  deleteAsset(id: string): Promise<void>;

  // liabilities
  saveLiability(liability: Liability): Promise<void>;
  getLiability(id: string): Promise<Liability | null>;
  listLiabilities(type?: string): Promise<Liability[]>;
  deleteLiability(id: string): Promise<void>;

  // net worth snapshots
  saveSnapshot(snapshot: NetWorthSnapshot): Promise<void>;
  getSnapshot(id: string): Promise<NetWorthSnapshot | null>;
  listSnapshots(startDate?: Date, endDate?: Date): Promise<NetWorthSnapshot[]>;
  getLatestSnapshot(): Promise<NetWorthSnapshot | null>;

  // portfolio statistics
  getPortfolioStats(startDate?: Date, endDate?: Date): Promise<PortfolioStats>;

  // expenses (budget)
  saveExpense(expense: Expense): Promise<void>;
  getExpense(id: string): Promise<Expense | null>;
  listExpenses(month?: string): Promise<Expense[]>; // month: 'YYYY-MM'
  deleteExpense(id: string): Promise<void>;
}
