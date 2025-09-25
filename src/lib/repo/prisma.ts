import 'server-only';
import { prisma } from '@/lib/prisma';
import {
  Liability,
  NetWorthSnapshot,
  OtherAsset,
  Position,
  RealEstateProperty,
  Trade,
  PortfolioStats,
  Expense,
} from '@/lib/types';
import { Repo } from './interface';
import { Prisma } from '@prisma/client';
import type {
  Liability as LiabilityModel,
  NetWorthSnapshot as NetWorthSnapshotModel,
  OtherAsset as OtherAssetModel,
  Position as PositionModel,
  RealEstateProperty as RealEstatePropertyModel,
  Trade as TradeModel,
  Expense as ExpenseModel,
} from '@prisma/client';

type RateScheduleJson = Array<{ start: string; rate: number }>;
type DisbursementJson = Array<{ name: string; percent: number; date?: string | null }>;
function serializeRateSchedule(rateSchedule: RealEstateProperty['rateSchedule']): RateScheduleJson | undefined {
  if (!rateSchedule) return undefined;
  const cleaned = rateSchedule
    .map((entry) => {
      const startDate =
        entry.start instanceof Date
          ? entry.start
          : entry.start
          ? new Date(entry.start)
          : null;
      if (!startDate || Number.isNaN(startDate.getTime())) return null;
      return {
        start: startDate.toISOString(),
        rate: entry.rate,
      };
    })
    .filter(Boolean) as RateScheduleJson;
  return cleaned.length ? cleaned : undefined;
}

function deserializeRateSchedule(json: unknown): RealEstateProperty['rateSchedule'] {
  if (!Array.isArray(json)) return undefined;
  const entries = json
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as { start?: string; rate?: number };
      if (!e.start || typeof e.start !== 'string') return null;
      if (typeof e.rate !== 'number') return null;
      const start = new Date(e.start);
      if (Number.isNaN(start.getTime())) return null;
      return {
        start,
        rate: e.rate,
      };
    })
    .filter(Boolean) as NonNullable<RealEstateProperty['rateSchedule']>;
  return entries.length ? entries : undefined;
}

function serializeDisbursementSchedule(
  schedule: RealEstateProperty['disbursementSchedule'],
): DisbursementJson | undefined {
  if (!schedule) return undefined;
  const cleaned = schedule
    .map((entry) => {
      const date =
        entry.date instanceof Date
          ? entry.date
          : entry.date
          ? new Date(entry.date)
          : null;
      return {
        name: entry.name,
        percent: entry.percent,
        date: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
      };
    })
    .filter((entry) => typeof entry.name === 'string' && typeof entry.percent === 'number');
  return cleaned.length ? (cleaned as DisbursementJson) : undefined;
}

function deserializeDisbursementSchedule(json: unknown): RealEstateProperty['disbursementSchedule'] {
  if (!Array.isArray(json)) return undefined;
  const entries = json
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as { name?: string; percent?: number; date?: string | null };
      if (typeof e.name !== 'string' || typeof e.percent !== 'number') return null;
      const date = e.date ? new Date(e.date) : undefined;
      if (date && Number.isNaN(date.getTime())) {
        return {
          name: e.name,
          percent: e.percent,
          date: undefined,
        };
      }
      return {
        name: e.name,
        percent: e.percent,
        date,
      };
    })
    .filter(Boolean) as NonNullable<RealEstateProperty['disbursementSchedule']>;
  return entries.length ? entries : undefined;
}

export class PrismaRepo implements Repo {
  constructor(private readonly userId: string) {}

  async initialize(): Promise<void> {}

  async close(): Promise<void> {}

  // Positions
  private mapPosition(record: PositionModel): Position {
    return {
      id: record.id,
      symbol: record.symbol,
      quantity: record.quantity,
      costBasis: record.costBasis,
      marketValue: record.marketValue,
      unrealizedPnL: record.unrealizedPnL,
      realizedPnL: record.realizedPnL,
      account: record.account,
      lastUpdated: record.lastUpdated,
    };
  }

  async savePosition(position: Position): Promise<void> {
    const existing = await prisma.position.findUnique({ where: { id: position.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const data = {
      symbol: position.symbol,
      quantity: position.quantity,
      costBasis: position.costBasis,
      marketValue: position.marketValue,
      unrealizedPnL: position.unrealizedPnL,
      realizedPnL: position.realizedPnL,
      account: position.account,
      lastUpdated: position.lastUpdated,
      userId: this.userId,
    };

    if (existing) {
      await prisma.position.update({ where: { id: position.id }, data });
    } else {
      await prisma.position.create({ data: { ...data, id: position.id } });
    }
  }

  async getPosition(id: string): Promise<Position | null> {
    const record = await prisma.position.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapPosition(record);
  }

  async listPositions(account?: string): Promise<Position[]> {
    const records = await prisma.position.findMany({
      where: { userId: this.userId, ...(account ? { account } : {}) },
      orderBy: { lastUpdated: 'desc' },
    });
    return records.map((record) => this.mapPosition(record));
  }

  async deletePosition(id: string): Promise<void> {
    const record = await prisma.position.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return;
    await prisma.position.delete({ where: { id } });
  }

  // Trades
  private mapTrade(record: TradeModel): Trade {
    return {
      id: record.id,
      symbol: record.symbol,
      side: record.side as Trade['side'],
      quantity: record.quantity,
      price: record.price,
      commission: record.commission,
      timestamp: record.timestamp,
      account: record.account,
    };
  }

  async saveTrade(trade: Trade): Promise<void> {
    const existing = await prisma.trade.findUnique({ where: { id: trade.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const data = {
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      commission: trade.commission,
      timestamp: trade.timestamp,
      account: trade.account,
      userId: this.userId,
    };

    if (existing) {
      await prisma.trade.update({ where: { id: trade.id }, data });
    } else {
      await prisma.trade.create({ data: { ...data, id: trade.id } });
    }
  }

  async getTrade(id: string): Promise<Trade | null> {
    const record = await prisma.trade.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapTrade(record);
  }

  async listTrades(symbol?: string, account?: string, startDate?: Date, endDate?: Date): Promise<Trade[]> {
    const records = await prisma.trade.findMany({
      where: {
        userId: this.userId,
        ...(symbol ? { symbol } : {}),
        ...(account ? { account } : {}),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
    return records.map((record) => this.mapTrade(record));
  }

  async deleteTrade(id: string): Promise<void> {
    const record = await prisma.trade.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return;
    await prisma.trade.delete({ where: { id } });
  }

  // Properties
  private mapProperty(record: RealEstatePropertyModel): RealEstateProperty {
    return {
      id: record.id,
      name: record.name,
      purchasePrice: record.purchasePrice,
      downPayment: record.downPayment,
      loanPrincipal: record.loanPrincipal,
      interestRate: record.interestRate,
      loanTerm: record.loanTerm,
      currentValue: record.currentValue,
      monthlyPayment: record.monthlyPayment,
      purchaseDate: record.purchaseDate,
      loanStartDate: record.loanStartDate ?? undefined,
      loanTermMonths: record.loanTermMonths ?? undefined,
      rateSchedule: deserializeRateSchedule(record.rateSchedule),
      disbursementSchedule: deserializeDisbursementSchedule(record.disbursementSchedule),
    };
  }

  async saveProperty(property: RealEstateProperty): Promise<void> {
    const existing = await prisma.realEstateProperty.findUnique({ where: { id: property.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const rateScheduleJson = serializeRateSchedule(property.rateSchedule);
    const disbursementScheduleJson = serializeDisbursementSchedule(
      property.disbursementSchedule,
    );

    const baseData = {
      name: property.name,
      purchasePrice: property.purchasePrice,
      downPayment: property.downPayment,
      loanPrincipal: property.loanPrincipal,
      interestRate: property.interestRate,
      loanTerm: property.loanTerm,
      currentValue: property.currentValue,
      monthlyPayment: property.monthlyPayment,
      purchaseDate: property.purchaseDate,
      loanStartDate: property.loanStartDate ?? null,
      loanTermMonths: property.loanTermMonths ?? null,
      userId: this.userId,
    };

    if (existing) {
      await prisma.realEstateProperty.update({
        where: { id: property.id },
        data: {
          ...baseData,
          rateSchedule:
            rateScheduleJson ?? Prisma.NullableJsonNullValueInput.DbNull,
          disbursementSchedule:
            disbursementScheduleJson ?? Prisma.NullableJsonNullValueInput.DbNull,
        },
      });
    } else {
      const createData: Prisma.RealEstatePropertyUncheckedCreateInput = {
        id: property.id,
        ...baseData,
        rateSchedule:
          rateScheduleJson ?? Prisma.JsonNullValueInput.JsonNull,
        disbursementSchedule:
          disbursementScheduleJson ?? Prisma.JsonNullValueInput.JsonNull,
      };

      await prisma.realEstateProperty.create({ data: createData });
    }
  }

  async getProperty(id: string): Promise<RealEstateProperty | null> {
    const record = await prisma.realEstateProperty.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapProperty(record);
  }

  async listProperties(): Promise<RealEstateProperty[]> {
    const records = await prisma.realEstateProperty.findMany({
      where: { userId: this.userId },
      orderBy: { updatedAt: 'desc' },
    });
    return records.map((record) => this.mapProperty(record));
  }

  async deleteProperty(id: string): Promise<void> {
    const record = await prisma.realEstateProperty.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return;
    await prisma.realEstateProperty.delete({ where: { id } });
  }

  // Assets
  private mapAsset(record: OtherAssetModel): OtherAsset {
    return {
      id: record.id,
      name: record.name,
      type: record.type as OtherAsset['type'],
      value: record.value,
      currency: record.currency,
      lastUpdated: record.lastUpdated,
    };
  }

  async saveAsset(asset: OtherAsset): Promise<void> {
    const existing = await prisma.otherAsset.findUnique({ where: { id: asset.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const data = {
      name: asset.name,
      type: asset.type,
      value: asset.value,
      currency: asset.currency,
      lastUpdated: asset.lastUpdated,
      userId: this.userId,
    };

    if (existing) {
      await prisma.otherAsset.update({ where: { id: asset.id }, data });
    } else {
      await prisma.otherAsset.create({ data: { ...data, id: asset.id } });
    }
  }

  async getAsset(id: string): Promise<OtherAsset | null> {
    const record = await prisma.otherAsset.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapAsset(record);
  }

  async listAssets(type?: string): Promise<OtherAsset[]> {
    const records = await prisma.otherAsset.findMany({
      where: { userId: this.userId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return records.map((record) => this.mapAsset(record));
  }

  async deleteAsset(id: string): Promise<void> {
    const record = await prisma.otherAsset.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return;
    await prisma.otherAsset.delete({ where: { id } });
  }

  // Liabilities
  private mapLiability(record: LiabilityModel): Liability {
    return {
      id: record.id,
      name: record.name,
      type: record.type as Liability['type'],
      balance: record.balance,
      interestRate: record.interestRate,
      monthlyPayment: record.monthlyPayment,
      dueDate: record.dueDate,
    };
  }

  async saveLiability(liability: Liability): Promise<void> {
    const existing = await prisma.liability.findUnique({ where: { id: liability.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const data = {
      name: liability.name,
      type: liability.type,
      balance: liability.balance,
      interestRate: liability.interestRate,
      monthlyPayment: liability.monthlyPayment,
      dueDate: liability.dueDate,
      userId: this.userId,
    };

    if (existing) {
      await prisma.liability.update({ where: { id: liability.id }, data });
    } else {
      await prisma.liability.create({ data: { ...data, id: liability.id } });
    }
  }

  async getLiability(id: string): Promise<Liability | null> {
    const record = await prisma.liability.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapLiability(record);
  }

  async listLiabilities(type?: string): Promise<Liability[]> {
    const records = await prisma.liability.findMany({
      where: { userId: this.userId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: 'desc' },
    });
    return records.map((record) => this.mapLiability(record));
  }

  async deleteLiability(id: string): Promise<void> {
    const record = await prisma.liability.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return;
    await prisma.liability.delete({ where: { id } });
  }

  // Net worth snapshots
  private mapSnapshot(record: NetWorthSnapshotModel): NetWorthSnapshot {
    return {
      id: record.id,
      timestamp: record.timestamp,
      totalAssets: record.totalAssets,
      totalLiabilities: record.totalLiabilities,
      netWorth: record.netWorth,
      breakdown: record.breakdown as NetWorthSnapshot['breakdown'],
    };
  }

  async saveSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
    const existing = await prisma.netWorthSnapshot.findUnique({ where: { id: snapshot.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const data = {
      timestamp: snapshot.timestamp,
      totalAssets: snapshot.totalAssets,
      totalLiabilities: snapshot.totalLiabilities,
      netWorth: snapshot.netWorth,
      breakdown: snapshot.breakdown,
      userId: this.userId,
    };

    if (existing) {
      await prisma.netWorthSnapshot.update({ where: { id: snapshot.id }, data });
    } else {
      await prisma.netWorthSnapshot.create({ data: { ...data, id: snapshot.id } });
    }
  }

  async getSnapshot(id: string): Promise<NetWorthSnapshot | null> {
    const record = await prisma.netWorthSnapshot.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapSnapshot(record);
  }

  async listSnapshots(startDate?: Date, endDate?: Date): Promise<NetWorthSnapshot[]> {
    const records = await prisma.netWorthSnapshot.findMany({
      where: {
        userId: this.userId,
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
    return records.map((record) => this.mapSnapshot(record));
  }

  async getLatestSnapshot(): Promise<NetWorthSnapshot | null> {
    const record = await prisma.netWorthSnapshot.findFirst({
      where: { userId: this.userId },
      orderBy: { timestamp: 'desc' },
    });
    return record ? this.mapSnapshot(record) : null;
  }

  async getPortfolioStats(startDate?: Date, endDate?: Date): Promise<PortfolioStats> {
    if (startDate || endDate) {
      // Range parameters reserved for future statistical calculations.
    }
    return {
      totalReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      ytdReturn: 0,
      monthlyReturns: [],
    };
  }

  // Expenses
  private mapExpense(record: ExpenseModel): Expense {
    return {
      id: record.id,
      date: record.date,
      description: record.description,
      amount: record.amount,
      currency: record.currency,
      category: record.category,
      paymentMethod: record.paymentMethod ?? undefined,
      status: (record.status ?? undefined) as Expense['status'],
      recurringMonthly: record.recurringMonthly ?? undefined,
      createdAt: record.createdAt,
    };
  }

  async saveExpense(expense: Expense): Promise<void> {
    const existing = await prisma.expense.findUnique({ where: { id: expense.id } });
    if (existing && existing.userId !== this.userId) {
      throw new Error('NOT_FOUND');
    }

    const data = {
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      paymentMethod: expense.paymentMethod ?? null,
      status: expense.status ?? null,
      recurringMonthly: expense.recurringMonthly ?? null,
      createdAt: expense.createdAt ?? new Date(),
      userId: this.userId,
    };

    if (existing) {
      await prisma.expense.update({ where: { id: expense.id }, data });
    } else {
      await prisma.expense.create({ data: { ...data, id: expense.id } });
    }
  }

  async getExpense(id: string): Promise<Expense | null> {
    const record = await prisma.expense.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return null;
    return this.mapExpense(record);
  }

  async listExpenses(month?: string): Promise<Expense[]> {
    const filters: Prisma.ExpenseWhereInput = { userId: this.userId };
    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = Number(yearStr);
      const monthNum = Number(monthStr);
      if (!isNaN(year) && !isNaN(monthNum)) {
        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
        filters.date = { gte: start, lte: end };
      }
    }

    const records = await prisma.expense.findMany({
      where: filters,
      orderBy: { date: 'desc' },
    });
    return records.map((record) => this.mapExpense(record));
  }

  async deleteExpense(id: string): Promise<void> {
    const record = await prisma.expense.findUnique({ where: { id } });
    if (!record || record.userId !== this.userId) return;
    await prisma.expense.delete({ where: { id } });
  }
}
