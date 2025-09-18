export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  account: string;
  lastUpdated: Date;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL' | 'BUY_TO_COVER' | 'SELL_SHORT';
  quantity: number;
  price: number;
  commission: number;
  timestamp: Date;
  account: string;
}

export interface RealEstateProperty {
  id: string;
  name: string;
  purchasePrice: number;
  downPayment: number;
  loanPrincipal: number;
  interestRate: number;
  loanTerm: number; // in years
  currentValue: number;
  monthlyPayment: number;
  purchaseDate: Date;
  // Optional modeling fields
  loanStartDate?: Date | null;
  loanTermMonths?: number; // overrides loanTerm when provided
  rateSchedule?: Array<{
    start: Date; // effective date
    rate: number; // annual rate in decimal, e.g., 0.035
  }>;
  disbursementSchedule?: Array<{
    name: string;
    percent: number; // 0..1 of purchase price
    date?: Date | null; // when the stage is/was paid
  }>;
}

export interface OtherAsset {
  id: string;
  name: string;
  type: 'CASH' | 'CRYPTO' | 'PRIVATE_INVESTMENT' | 'CPF' | 'OTHER';
  value: number;
  currency: string;
  lastUpdated: Date;
}

export interface Liability {
  id: string;
  name: string;
  type: 'LOAN' | 'CREDIT_CARD' | 'MORTGAGE' | 'OTHER';
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: Date;
}

export interface NetWorthSnapshot {
  id: string;
  timestamp: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    brokerage: number;
    realEstate: number;
    otherAssets: number;
    liabilities: number;
  };
}

export interface PortfolioStats {
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  ytdReturn: number;
  monthlyReturns: Array<{
    month: string;
    return: number;
  }>;
}

export interface Expense {
  id: string;
  date: Date; // transaction date
  description: string;
  amount: number;
  currency: string; // e.g. SGD, USD
  category: string; // e.g. Food, Transport, Bills
  paymentMethod?: string; // e.g. Card, Cash
  status?: 'to_submit' | 'to_verify' | 'cleared' | 'rejected';
  // When true, this expense is intended to recur monthly.
  // Used primarily for UI validation (allow future-dated entries only when recurring).
  recurringMonthly?: boolean;
  createdAt: Date;
}
