import type { OrderSide } from '@tradecanvas/chart';

export interface TradeRecord {
  id: string;
  type: 'fill' | 'stopLoss' | 'takeProfit' | 'manual_close';
  side: OrderSide;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  commission: number;
  timestamp: number;
  symbol: string;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalCommission: number;
}

const STORAGE_KEY = 'tc-demo-history';

export class TradeHistory {
  private records: TradeRecord[] = [];

  constructor() {
    this.load();
  }

  add(record: TradeRecord): void {
    this.records = [record, ...this.records];
    this.save();
  }

  getAll(): TradeRecord[] {
    return [...this.records];
  }

  getRecent(count: number): TradeRecord[] {
    return this.records.slice(0, count);
  }

  getStats(): TradeStats {
    const closedTrades = this.records.filter(r => r.pnl !== undefined);
    const wins = closedTrades.filter(r => (r.pnl ?? 0) > 0).length;
    const losses = closedTrades.filter(r => (r.pnl ?? 0) <= 0).length;
    const totalPnl = closedTrades.reduce((sum, r) => sum + (r.pnl ?? 0), 0);
    const totalCommission = this.records.reduce((sum, r) => sum + r.commission, 0);

    return {
      totalTrades: this.records.length,
      wins,
      losses,
      winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
      totalPnl,
      totalCommission,
    };
  }

  clear(): void {
    this.records = [];
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch {
      this.records = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // storage full or unavailable
    }
  }
}
