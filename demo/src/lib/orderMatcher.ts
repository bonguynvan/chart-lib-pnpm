import type { TradingOrder, TradingPosition, OrderSide } from '@tradecanvas/chart';

export interface MatcherConfig {
  spreadPercent: number;
  commissionPercent: number;
  slippagePercent: number;
}

export interface FillEvent {
  orderId: string;
  side: OrderSide;
  type: string;
  requestedPrice: number;
  fillPrice: number;
  quantity: number;
  commission: number;
  timestamp: number;
}

export interface StopOutEvent {
  positionId: string;
  side: OrderSide;
  exitPrice: number;
  entryPrice: number;
  quantity: number;
  pnl: number;
  reason: 'stopLoss' | 'takeProfit';
}

const DEFAULT_CONFIG: MatcherConfig = {
  spreadPercent: 0.05,
  commissionPercent: 0.1,
  slippagePercent: 0.02,
};

export class OrderMatcher {
  private config: MatcherConfig;

  constructor(config?: Partial<MatcherConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): MatcherConfig {
    return { ...this.config };
  }

  tick(
    currentPrice: number,
    orders: TradingOrder[],
    positions: TradingPosition[],
  ): { fills: FillEvent[]; stopOuts: StopOutEvent[] } {
    const fills = this.checkOrders(currentPrice, orders);
    const stopOuts = this.checkPositions(currentPrice, positions);
    return { fills, stopOuts };
  }

  private checkOrders(currentPrice: number, orders: TradingOrder[]): FillEvent[] {
    const fills: FillEvent[] = [];

    for (const order of orders) {
      if (!this.shouldFill(currentPrice, order)) continue;

      const fillPrice = this.computeFillPrice(order.price, order.side);
      const commission = this.computeCommission(fillPrice, order.quantity);

      fills.push({
        orderId: order.id,
        side: order.side,
        type: order.type,
        requestedPrice: order.price,
        fillPrice,
        quantity: order.quantity,
        commission,
        timestamp: Date.now(),
      });
    }

    return fills;
  }

  private shouldFill(currentPrice: number, order: TradingOrder): boolean {
    switch (order.type) {
      case 'limit':
        return order.side === 'buy'
          ? currentPrice <= order.price
          : currentPrice >= order.price;
      case 'stop':
        return order.side === 'buy'
          ? currentPrice >= order.price
          : currentPrice <= order.price;
      default:
        return false;
    }
  }

  private checkPositions(currentPrice: number, positions: TradingPosition[]): StopOutEvent[] {
    const stopOuts: StopOutEvent[] = [];

    for (const pos of positions) {
      const result = this.checkStopOut(currentPrice, pos);
      if (result) stopOuts.push(result);
    }

    return stopOuts;
  }

  private checkStopOut(currentPrice: number, pos: TradingPosition): StopOutEvent | null {
    const isLong = pos.side === 'buy';

    const hitSL = pos.stopLoss !== undefined && (
      isLong ? currentPrice <= pos.stopLoss : currentPrice >= pos.stopLoss
    );

    const hitTP = pos.takeProfit !== undefined && (
      isLong ? currentPrice >= pos.takeProfit : currentPrice <= pos.takeProfit
    );

    if (!hitSL && !hitTP) return null;

    const reason: 'stopLoss' | 'takeProfit' = hitSL ? 'stopLoss' : 'takeProfit';
    const triggerPrice = hitSL ? pos.stopLoss! : pos.takeProfit!;

    const exitPrice = isLong
      ? triggerPrice * (1 - this.config.spreadPercent / 100)
      : triggerPrice * (1 + this.config.spreadPercent / 100);

    const pnl = isLong
      ? (exitPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - exitPrice) * pos.quantity;

    return {
      positionId: pos.id,
      side: pos.side,
      exitPrice,
      entryPrice: pos.entryPrice,
      quantity: pos.quantity,
      pnl,
      reason,
    };
  }

  private computeFillPrice(requestedPrice: number, side: OrderSide): number {
    return side === 'buy'
      ? requestedPrice * (1 + this.config.spreadPercent / 100)
      : requestedPrice * (1 - this.config.spreadPercent / 100);
  }

  private computeCommission(fillPrice: number, quantity: number): number {
    return fillPrice * quantity * this.config.commissionPercent / 100;
  }
}
