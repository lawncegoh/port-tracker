export interface IBKRCSVRow {
  // Common fields that appear in most IBKR exports
  account?: string;
  symbol?: string;
  description?: string;
  quantity?: number;
  price?: number;
  marketValue?: number;
  costBasis?: number;
  unrealizedPnL?: number;
  realizedPnL?: number;
  commission?: number;
  timestamp?: Date;
  side?: 'BUY' | 'SELL' | 'BUY_TO_COVER' | 'SELL_SHORT';
  currency?: string;
  exchange?: string;
  secType?: string;
  multiplier?: number;
  expiry?: Date;
  strike?: number;
  putCall?: 'P' | 'C';
  
  // Additional fields that may appear
  [key: string]: unknown;
}

export interface IBKRCSVParseOptions {
  includeHeaders?: boolean;
  dateFormat?: string;
  timeFormat?: string;
  includeCanceledTrades?: boolean;
  includeCurrencyRates?: boolean;
  includeAuditTrail?: boolean;
  breakoutByDay?: boolean;
}

export class IBKRCSVParser {
  private options: IBKRCSVParseOptions;

  constructor(options: IBKRCSVParseOptions = {}) {
    this.options = {
      includeHeaders: true,
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm:ss',
      includeCanceledTrades: false,
      includeCurrencyRates: false,
      includeAuditTrail: false,
      breakoutByDay: false,
      ...options
    };
  }

  parseCSV(csvContent: string): IBKRCSVRow[] {
    const lines = csvContent.trim().split('\n');
    const rows: IBKRCSVRow[] = [];
    
    // Skip header row if not including headers
    const startIndex = this.options.includeHeaders ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const row = this.parseCSVLine(line);
      if (row) {
        rows.push(row);
      }
    }
    
    return rows;
  }

  private parseCSVLine(line: string): IBKRCSVRow | null {
    // Handle CSV with potential commas in quoted fields
    const fields = this.parseCSVFields(line);
    
    if (fields.length < 3) return null; // Need at least some basic data
    
    const row: IBKRCSVRow = {};
    
    // Try to identify the type of row and parse accordingly
    if (this.isPositionRow(fields)) {
      return this.parsePositionRow(fields);
    } else if (this.isTradeRow(fields)) {
      return this.parseTradeRow(fields);
    } else if (this.isAccountRow(fields)) {
      return this.parseAccountRow(fields);
    }
    
    // Generic parsing for unknown formats
    return this.parseGenericRow(fields);
  }

  private parseCSVFields(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field
    fields.push(currentField.trim());
    
    return fields;
  }

  private isPositionRow(fields: string[]): boolean {
    // Check if this looks like a position row
    // Positions typically have symbol, quantity, market value, cost basis
    const hasSymbol = fields.some(field => /^[A-Z]{1,5}$/.test(field));
    const hasQuantity = fields.some(field => /^\d+(\.\d+)?$/.test(field));
    const hasValue = fields.some(field => /^\$?[\d,]+(\.\d{2})?$/.test(field));
    
    return hasSymbol && hasQuantity && hasValue;
  }

  private isTradeRow(fields: string[]): boolean {
    // Check if this looks like a trade row
    // Trades typically have date, symbol, side, quantity, price
    const hasDate = fields.some(field => /^\d{4}-\d{2}-\d{2}/.test(field));
    const hasSymbol = fields.some(field => /^[A-Z]{1,5}$/.test(field));
    const hasSide = fields.some(field => /^(BUY|SELL|BUY_TO_COVER|SELL_SHORT)$/i.test(field));
    
    return hasDate && hasSymbol && hasSide;
  }

  private isAccountRow(fields: string[]): boolean {
    // Check if this looks like an account summary row
    // Account rows typically have account number and balance info
    const hasAccount = fields.some(field => /^[A-Z0-9]{8,}$/.test(field));
    const hasBalance = fields.some(field => /^\$?[\d,]+(\.\d{2})?$/.test(field));
    
    return hasAccount && hasBalance;
  }

  private parsePositionRow(fields: string[]): IBKRCSVRow {
    const row: IBKRCSVRow = {};
    
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      
      // Try to identify field types based on content and position
      if (/^[A-Z]{1,5}$/.test(field)) {
        row.symbol = field;
      } else if (/^\d+(\.\d+)?$/.test(field)) {
        if (!row.quantity) {
          row.quantity = parseFloat(field);
        } else if (!row.price) {
          row.price = parseFloat(field);
        }
      } else if (/^\$?[\d,]+(\.\d{2})?$/.test(field)) {
        const value = parseFloat(field.replace(/[$,]/g, ''));
        if (!row.marketValue) {
          row.marketValue = value;
        } else if (!row.costBasis) {
          row.costBasis = value;
        } else if (!row.unrealizedPnL) {
          row.unrealizedPnL = value;
        }
      }
    }
    
    return row;
  }

  private parseTradeRow(fields: string[]): IBKRCSVRow {
    const row: IBKRCSVRow = {};
    
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      
      if (/^\d{4}-\d{2}-\d{2}/.test(field)) {
        row.timestamp = new Date(field);
      } else if (/^[A-Z]{1,5}$/.test(field)) {
        row.symbol = field;
      } else if (/^(BUY|SELL|BUY_TO_COVER|SELL_SHORT)$/i.test(field)) {
        row.side = field.toUpperCase() as IBKRCSVRow['side'];
      } else if (/^\d+(\.\d+)?$/.test(field)) {
        if (!row.quantity) {
          row.quantity = parseFloat(field);
        } else if (!row.price) {
          row.price = parseFloat(field);
        } else if (!row.commission) {
          row.commission = parseFloat(field);
        }
      }
    }
    
    return row;
  }

  private parseAccountRow(fields: string[]): IBKRCSVRow {
    const row: IBKRCSVRow = {};
    
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      
      if (/^[A-Z0-9]{8,}$/.test(field)) {
        row.account = field;
      } else if (/^\$?[\d,]+(\.\d{2})?$/.test(field)) {
        const value = parseFloat(field.replace(/[$,]/g, ''));
        if (!row.marketValue) {
          row.marketValue = value;
        }
      }
    }
    
    return row;
  }

  private parseGenericRow(fields: string[]): IBKRCSVRow {
    const row: IBKRCSVRow = {};
    
    // Try to extract any recognizable data
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      
      if (/^[A-Z]{1,5}$/.test(field)) {
        row.symbol = field;
      } else if (/^\d{4}-\d{2}-\d{2}/.test(field)) {
        row.timestamp = new Date(field);
      } else if (/^\d+(\.\d+)?$/.test(field)) {
        if (!row.quantity) {
          row.quantity = parseFloat(field);
        } else if (!row.price) {
          row.price = parseFloat(field);
        }
      } else if (/^\$?[\d,]+(\.\d{2})?$/.test(field)) {
        const value = parseFloat(field.replace(/[$,]/g, ''));
        if (!row.marketValue) {
          row.marketValue = value;
        }
      }
    }
    
    return row;
  }

  // Helper method to convert parsed rows to our internal types
  convertToPositions(rows: IBKRCSVRow[]) {
    return rows
      .filter(row => row.symbol && row.quantity)
      .map(row => ({
        id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: row.symbol!,
        quantity: row.quantity!,
        costBasis: row.costBasis || 0,
        marketValue: row.marketValue || 0,
        unrealizedPnL: row.unrealizedPnL || 0,
        realizedPnL: row.realizedPnL || 0,
        account: row.account || 'Unknown',
        lastUpdated: row.timestamp || new Date()
      }));
  }

  convertToTrades(rows: IBKRCSVRow[]) {
    return rows
      .filter(row => row.symbol && row.quantity && row.side && row.timestamp)
      .map(row => ({
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: row.symbol!,
        side: row.side!,
        quantity: row.quantity!,
        price: row.price || 0,
        commission: row.commission || 0,
        timestamp: row.timestamp!,
        account: row.account || 'Unknown'
      }));
  }
}

