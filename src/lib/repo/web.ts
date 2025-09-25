import { Repo } from './interface';
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

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : (init?.headers as Record<string, string> | undefined)),
  } as Record<string, string>;

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  });
  if (res.status === 401) {
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export class WebRepo implements Repo {
  async initialize(): Promise<void> {}
  async close(): Promise<void> {}

  // positions
  async savePosition(position: Position): Promise<void> {
    await http('/api/positions', { method: 'POST', body: JSON.stringify(position) });
  }
  async getPosition(id: string): Promise<Position | null> {
    return http(`/api/positions/${id}`);
  }
  async listPositions(account?: string): Promise<Position[]> {
    const q = account ? `?account=${encodeURIComponent(account)}` : '';
    return http(`/api/positions${q}`);
  }
  async deletePosition(id: string): Promise<void> {
    await http(`/api/positions/${id}`, { method: 'DELETE' });
  }

  // trades
  async saveTrade(trade: Trade): Promise<void> {
    await http('/api/trades', { method: 'POST', body: JSON.stringify(trade) });
  }
  async getTrade(id: string): Promise<Trade | null> {
    return http(`/api/trades/${id}`);
  }
  async listTrades(symbol?: string, account?: string, startDate?: Date, endDate?: Date): Promise<Trade[]> {
    const params = new URLSearchParams();
    if (symbol) params.set('symbol', symbol);
    if (account) params.set('account', account);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    const q = params.toString();
    return http(`/api/trades${q ? `?${q}` : ''}`);
  }
  async deleteTrade(id: string): Promise<void> {
    await http(`/api/trades/${id}`, { method: 'DELETE' });
  }

  // properties
  async saveProperty(property: RealEstateProperty): Promise<void> {
    await http('/api/properties', { method: 'POST', body: JSON.stringify(property) });
  }
  async getProperty(id: string): Promise<RealEstateProperty | null> {
    return http(`/api/properties/${id}`);
  }
  async listProperties(): Promise<RealEstateProperty[]> {
    return http('/api/properties');
  }
  async deleteProperty(id: string): Promise<void> {
    await http(`/api/properties/${id}`, { method: 'DELETE' });
  }

  // assets
  async saveAsset(asset: OtherAsset): Promise<void> {
    await http('/api/assets', { method: 'POST', body: JSON.stringify(asset) });
  }
  async getAsset(id: string): Promise<OtherAsset | null> {
    return http(`/api/assets/${id}`);
  }
  async listAssets(type?: string): Promise<OtherAsset[]> {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return http(`/api/assets${q}`);
  }
  async deleteAsset(id: string): Promise<void> {
    await http(`/api/assets/${id}`, { method: 'DELETE' });
  }

  // liabilities
  async saveLiability(liability: Liability): Promise<void> {
    await http('/api/liabilities', { method: 'POST', body: JSON.stringify(liability) });
  }
  async getLiability(id: string): Promise<Liability | null> {
    return http(`/api/liabilities/${id}`);
  }
  async listLiabilities(type?: string): Promise<Liability[]> {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return http(`/api/liabilities${q}`);
  }
  async deleteLiability(id: string): Promise<void> {
    await http(`/api/liabilities/${id}`, { method: 'DELETE' });
  }

  // snapshots
  async saveSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
    await http('/api/snapshots', { method: 'POST', body: JSON.stringify(snapshot) });
  }
  async getSnapshot(id: string): Promise<NetWorthSnapshot | null> {
    return http(`/api/snapshots/${id}`);
  }
  async listSnapshots(startDate?: Date, endDate?: Date): Promise<NetWorthSnapshot[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    const q = params.toString();
    return http(`/api/snapshots${q ? `?${q}` : ''}`);
  }
  async getLatestSnapshot(): Promise<NetWorthSnapshot | null> {
    return http('/api/snapshots/latest');
  }

  // stats
  async getPortfolioStats(): Promise<PortfolioStats> {
    return http('/api/stats/portfolio');
  }

  // expenses
  async saveExpense(expense: Expense): Promise<void> {
    await http('/api/expenses', { method: 'POST', body: JSON.stringify(expense) });
  }
  async getExpense(id: string): Promise<Expense | null> {
    return http(`/api/expenses/${id}`);
  }
  async listExpenses(month?: string): Promise<Expense[]> {
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    return http(`/api/expenses${q}`);
  }
  async deleteExpense(id: string): Promise<void> {
    await http(`/api/expenses/${id}`, { method: 'DELETE' });
  }
}
