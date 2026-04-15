<script lang="ts">
  import type { TradingPosition, TradingOrder, OrderSide } from '@tradecanvas/chart';
  import { X, RefreshCw, Clock } from 'lucide-svelte';
  import { OrderMatcher } from '../lib/orderMatcher';
  import type { FillEvent, StopOutEvent } from '../lib/orderMatcher';
  import { TradeHistory } from '../lib/tradeHistory';
  import type { TradeRecord, TradeStats } from '../lib/tradeHistory';

  const STORAGE_BALANCE = 'tc-demo-balance';
  const STORAGE_POSITIONS = 'tc-demo-positions';
  const STORAGE_ORDERS = 'tc-demo-orders';
  const INITIAL_BALANCE = 10000;

  interface Props {
    currentPrice: number;
    symbol: string;
    open: boolean;
    onClose: () => void;
    onPositionsChange: (positions: TradingPosition[]) => void;
    onOrdersChange: (orders: TradingOrder[]) => void;
    onToast?: (message: string, detail: string, type: 'fill-buy' | 'fill-sell' | 'sl' | 'tp') => void;
  }

  let { currentPrice, symbol, open, onClose, onPositionsChange, onOrdersChange, onToast }: Props = $props();
  let balance = $state(INITIAL_BALANCE);
  let positions: TradingPosition[] = $state([]);
  let orders: TradingOrder[] = $state([]);
  let nextId = $state(1);

  // Tabs
  let activeTab: 'trading' | 'history' = $state('trading');

  // Order matcher and trade history
  const matcher = new OrderMatcher();
  const history = new TradeHistory();
  const matcherConfig = matcher.getConfig();

  let historyStats: TradeStats = $state(history.getStats());
  let recentTrades: TradeRecord[] = $state(history.getRecent(20));

  function refreshHistory(): void {
    historyStats = history.getStats();
    recentTrades = history.getRecent(20);
  }

  // Load from localStorage on init
  function loadState(): void {
    try {
      const savedBalance = localStorage.getItem(STORAGE_BALANCE);
      if (savedBalance !== null) balance = parseFloat(savedBalance);

      const savedPositions = localStorage.getItem(STORAGE_POSITIONS);
      if (savedPositions) positions = JSON.parse(savedPositions);

      const savedOrders = localStorage.getItem(STORAGE_ORDERS);
      if (savedOrders) orders = JSON.parse(savedOrders);

      const maxPosId = positions.reduce((m, p) => Math.max(m, parseInt(p.id.replace('tc-pos-', ''), 10) || 0), 0);
      const maxOrdId = orders.reduce((m, o) => Math.max(m, parseInt(o.id.replace('tc-ord-', ''), 10) || 0), 0);
      nextId = Math.max(maxPosId, maxOrdId) + 1;
    } catch {
      // ignore parse errors
    }
  }

  loadState();

  function saveState(): void {
    localStorage.setItem(STORAGE_BALANCE, String(balance));
    localStorage.setItem(STORAGE_POSITIONS, JSON.stringify(positions));
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
  }

  function getDefaultQuantity(sym: string): number {
    const base = sym.replace('USDT', '');
    switch (base) {
      case 'BTC': return 0.1;
      case 'ETH': return 1.0;
      case 'SOL': return 10;
      case 'BNB': return 1;
      default: return 1;
    }
  }

  function generateId(prefix: string): string {
    const id = `${prefix}-${nextId}`;
    nextId += 1;
    return id;
  }

  function openPosition(side: OrderSide): void {
    if (currentPrice <= 0) return;
    const qty = getDefaultQuantity(symbol);
    const slMultiplier = side === 'buy' ? 0.98 : 1.02;
    const tpMultiplier = side === 'buy' ? 1.04 : 0.96;

    const newPos: TradingPosition = {
      id: generateId('tc-pos'),
      side,
      entryPrice: currentPrice,
      quantity: qty,
      stopLoss: parseFloat((currentPrice * slMultiplier).toFixed(2)),
      takeProfit: parseFloat((currentPrice * tpMultiplier).toFixed(2)),
    };

    positions = [...positions, newPos];
    saveState();
    onPositionsChange(positions);
  }

  function placeLimitOrder(side: OrderSide): void {
    if (currentPrice <= 0) return;
    const qty = getDefaultQuantity(symbol);
    const priceMultiplier = side === 'buy' ? 0.99 : 1.01;

    const newOrder: TradingOrder = {
      id: generateId('tc-ord'),
      side,
      type: 'limit',
      price: parseFloat((currentPrice * priceMultiplier).toFixed(2)),
      quantity: qty,
      label: 'LIMIT',
      draggable: true,
    };

    orders = [...orders, newOrder];
    saveState();
    onOrdersChange(orders);
  }

  function closePosition(posId: string): void {
    const pos = positions.find(p => p.id === posId);
    if (pos) {
      const pnl = computePnl(pos);
      balance = parseFloat((balance + pnl).toFixed(2));

      history.add({
        id: `trade-${Date.now()}`,
        type: 'manual_close',
        side: pos.side,
        entryPrice: pos.entryPrice,
        exitPrice: currentPrice,
        quantity: pos.quantity,
        pnl,
        commission: 0,
        timestamp: Date.now(),
        symbol,
      });
      refreshHistory();
    }
    positions = positions.filter(p => p.id !== posId);
    saveState();
    onPositionsChange(positions);
  }

  function cancelOrder(ordId: string): void {
    orders = orders.filter(o => o.id !== ordId);
    saveState();
    onOrdersChange(orders);
  }

  function resetAll(): void {
    balance = INITIAL_BALANCE;
    positions = [];
    orders = [];
    nextId = 1;
    history.clear();
    refreshHistory();
    saveState();
    onPositionsChange(positions);
    onOrdersChange(orders);
  }

  function computePnl(pos: TradingPosition): number {
    if (currentPrice <= 0) return 0;
    return pos.side === 'buy'
      ? (currentPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - currentPrice) * pos.quantity;
  }

  function computePnlPercent(pos: TradingPosition): number {
    if (pos.entryPrice <= 0) return 0;
    return pos.side === 'buy'
      ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
      : ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100;
  }

  const totalPnl = $derived(
    positions.reduce((sum, p) => sum + computePnl(p), 0)
  );

  const totalPnlPercent = $derived(
    balance > 0 ? (totalPnl / INITIAL_BALANCE) * 100 : 0
  );

  function formatUsd(v: number): string {
    const sign = v >= 0 ? '+' : '';
    return `${sign}$${v.toFixed(2)}`;
  }

  function formatPercent(v: number): string {
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}%`;
  }

  function formatPrice(v: number): string {
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  // --- Order Matching ---

  function processFill(fill: FillEvent): void {
    // Remove the filled order
    orders = orders.filter(o => o.id !== fill.orderId);

    // Create a new position at fill price
    const slMultiplier = fill.side === 'buy' ? 0.98 : 1.02;
    const tpMultiplier = fill.side === 'buy' ? 1.04 : 0.96;

    const newPos: TradingPosition = {
      id: generateId('tc-pos'),
      side: fill.side,
      entryPrice: fill.fillPrice,
      quantity: fill.quantity,
      stopLoss: parseFloat((fill.fillPrice * slMultiplier).toFixed(2)),
      takeProfit: parseFloat((fill.fillPrice * tpMultiplier).toFixed(2)),
    };

    positions = [...positions, newPos];
    balance = parseFloat((balance - fill.commission).toFixed(2));

    history.add({
      id: `trade-${Date.now()}-${fill.orderId}`,
      type: 'fill',
      side: fill.side,
      entryPrice: fill.fillPrice,
      quantity: fill.quantity,
      commission: fill.commission,
      timestamp: fill.timestamp,
      symbol,
    });

    onToast?.(
      `${fill.side === 'buy' ? 'Buy' : 'Sell'} ${fill.type.charAt(0).toUpperCase() + fill.type.slice(1)} Filled`,
      `${fill.quantity} @ ${formatPrice(fill.fillPrice)} | Commission: $${fill.commission.toFixed(2)}`,
      fill.side === 'buy' ? 'fill-buy' : 'fill-sell',
    );
  }

  function processStopOut(stopOut: StopOutEvent): void {
    // Remove the closed position
    positions = positions.filter(p => p.id !== stopOut.positionId);

    const commission = Math.abs(stopOut.exitPrice * stopOut.quantity * matcherConfig.commissionPercent / 100);
    const netPnl = stopOut.pnl - commission;
    balance = parseFloat((balance + netPnl).toFixed(2));

    const recordType = stopOut.reason === 'stopLoss' ? 'stopLoss' : 'takeProfit';

    history.add({
      id: `trade-${Date.now()}-${stopOut.positionId}`,
      type: recordType,
      side: stopOut.side,
      entryPrice: stopOut.entryPrice,
      exitPrice: stopOut.exitPrice,
      quantity: stopOut.quantity,
      pnl: netPnl,
      commission,
      timestamp: Date.now(),
      symbol,
    });

    const label = stopOut.reason === 'stopLoss' ? 'Stop Loss Hit' : 'Take Profit Hit';
    const toastType = stopOut.reason === 'stopLoss' ? 'sl' : 'tp';

    onToast?.(
      `${stopOut.side === 'buy' ? 'Long' : 'Short'} ${label}`,
      `Exit @ ${formatPrice(stopOut.exitPrice)} | PnL: ${formatUsd(netPnl)}`,
      toastType as 'sl' | 'tp',
    );
  }

  // Public tick method: called by parent on every price update
  export function tick(price: number): void {
    if (price <= 0 || (orders.length === 0 && positions.length === 0)) return;

    const { fills, stopOuts } = matcher.tick(price, orders, positions);

    if (fills.length === 0 && stopOuts.length === 0) return;

    for (const fill of fills) {
      processFill(fill);
    }

    for (const stopOut of stopOuts) {
      processStopOut(stopOut);
    }

    refreshHistory();
    saveState();
    onPositionsChange(positions);
    onOrdersChange(orders);
  }

  // Public method-like: update an order price (called from parent on orderModify event)
  export function updateOrderPrice(orderId: string, newPrice: number): void {
    orders = orders.map(o => o.id === orderId ? { ...o, price: newPrice } : o);
    saveState();
    onOrdersChange(orders);
  }

  // Public method: update position SL/TP (called from parent on positionModify event)
  export function updatePositionSlTp(positionId: string, stopLoss?: number, takeProfit?: number): void {
    positions = positions.map(p => {
      if (p.id !== positionId) return p;
      return {
        ...p,
        ...(stopLoss !== undefined ? { stopLoss } : {}),
        ...(takeProfit !== undefined ? { takeProfit } : {}),
      };
    });
    saveState();
    onPositionsChange(positions);
  }

  // Expose current state for parent to call setPositions/setOrders on mount
  export function getPositions(): TradingPosition[] { return positions; }
  export function getOrders(): TradingOrder[] { return orders; }
  export function getPositionCount(): number { return positions.length; }
  export function getTotalPnl(): number { return totalPnl; }

  // Open a position at a specific price (used by context menu)
  export function openPositionAtPrice(side: OrderSide, atPrice: number): void {
    if (atPrice <= 0) return;
    const qty = getDefaultQuantity(symbol);
    const slMultiplier = side === 'buy' ? 0.98 : 1.02;
    const tpMultiplier = side === 'buy' ? 1.04 : 0.96;

    const newPos: TradingPosition = {
      id: generateId('tc-pos'),
      side,
      entryPrice: atPrice,
      quantity: qty,
      stopLoss: parseFloat((atPrice * slMultiplier).toFixed(2)),
      takeProfit: parseFloat((atPrice * tpMultiplier).toFixed(2)),
    };

    positions = [...positions, newPos];
    saveState();
    onPositionsChange(positions);
  }

  // Place an order at a specific price (used by context menu / trade-on-chart)
  export function placeLimitOrderAtPrice(side: OrderSide, atPrice: number): void {
    placeOrderAtPrice(side, 'limit', atPrice);
  }

  export function placeOrderAtPrice(side: OrderSide, type: 'limit' | 'stop' | 'stopLimit' | 'market', atPrice: number): void {
    if (atPrice <= 0) return;
    const qty = getDefaultQuantity(symbol);

    const newOrder: TradingOrder = {
      id: generateId('tc-ord'),
      side,
      type,
      price: atPrice,
      quantity: qty,
      label: (type === 'stopLimit' ? 'STOP LIMIT' : type.toUpperCase()) as TradingOrder['label'],
      draggable: true,
    };

    orders = [...orders, newOrder];
    saveState();
    onOrdersChange(orders);
  }
</script>

{#if open}
  <div class="trading-popup">
    <div class="popup-header">
      <div class="header-left">
        <span class="header-title">Paper Trading</span>
        <span class="header-balance">${formatPrice(balance)}</span>
      </div>
      <div class="header-right">
        <span class="header-config">Spread: {matcherConfig.spreadPercent}% | Comm: {matcherConfig.commissionPercent}%</span>
        <button class="btn-close-popup" title="Close" onclick={onClose}>
          <X size={14} />
        </button>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn" class:active={activeTab === 'trading'} onclick={() => activeTab = 'trading'}>
        Trading
      </button>
      <button class="tab-btn" class:active={activeTab === 'history'} onclick={() => activeTab = 'history'}>
        <Clock size={10} />
        History
        {#if historyStats.totalTrades > 0}
          <span class="tab-badge">{historyStats.totalTrades}</span>
        {/if}
      </button>
    </div>

    {#if activeTab === 'trading'}
      {#if totalPnl !== 0}
        <div class="popup-pnl" class:profit={totalPnl >= 0} class:loss={totalPnl < 0}>
          PnL: {formatUsd(totalPnl)} ({formatPercent(totalPnlPercent)})
        </div>
      {/if}

      <div class="trading-content">
        <div class="trading-actions">
          <div class="action-group">
            <button class="btn-buy" onclick={() => openPosition('buy')}>Buy / Long</button>
            <button class="btn-limit-buy" onclick={() => placeLimitOrder('buy')}>Limit</button>
          </div>
          <div class="action-group">
            <button class="btn-sell" onclick={() => openPosition('sell')}>Sell / Short</button>
            <button class="btn-limit-sell" onclick={() => placeLimitOrder('sell')}>Limit</button>
          </div>
          <div class="action-group action-right">
            <span class="current-price">{formatPrice(currentPrice)}</span>
            <button class="btn-reset" title="Reset all" onclick={resetAll}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {#if positions.length > 0}
          <div class="section-label">Positions</div>
          <div class="list">
            {#each positions as pos (pos.id)}
              {@const pnl = computePnl(pos)}
              {@const pnlPct = computePnlPercent(pos)}
              <div class="row">
                <span class="side-tag" class:buy={pos.side === 'buy'} class:sell={pos.side === 'sell'}>
                  {pos.side === 'buy' ? 'LONG' : 'SHORT'}
                </span>
                <span class="mono">{pos.quantity}</span>
                <span class="dim">@</span>
                <span class="mono">{formatPrice(pos.entryPrice)}</span>
                <span class="spacer"></span>
                <span class="pnl-val" class:profit={pnl >= 0} class:loss={pnl < 0}>
                  {formatUsd(pnl)} ({formatPercent(pnlPct)})
                </span>
                <button class="btn-close" title="Close position" onclick={() => closePosition(pos.id)}>
                  <X size={10} />
                </button>
              </div>
            {/each}
          </div>
        {/if}

        {#if orders.length > 0}
          <div class="section-label">Orders</div>
          <div class="list">
            {#each orders as ord (ord.id)}
              <div class="row">
                <span class="side-tag" class:buy={ord.side === 'buy'} class:sell={ord.side === 'sell'}>
                  {ord.side === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <span class="order-type">{ord.type.toUpperCase()}</span>
                <span class="mono">{ord.quantity}</span>
                <span class="dim">@</span>
                <span class="mono">{formatPrice(ord.price)}</span>
                <span class="spacer"></span>
                <button class="btn-cancel" onclick={() => cancelOrder(ord.id)}>Cancel</button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- History Tab -->
      <div class="trading-content">
        {#if historyStats.totalTrades > 0}
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Trades</span>
              <span class="stat-value">{historyStats.totalTrades}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Win Rate</span>
              <span class="stat-value">{historyStats.winRate.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total PnL</span>
              <span class="stat-value" class:profit={historyStats.totalPnl >= 0} class:loss={historyStats.totalPnl < 0}>
                {formatUsd(historyStats.totalPnl)}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Commission</span>
              <span class="stat-value dim">-${historyStats.totalCommission.toFixed(2)}</span>
            </div>
          </div>

          <div class="section-label">Recent Trades</div>
          <div class="list">
            {#each recentTrades as trade (trade.id)}
              <div class="row history-row">
                <span class="trade-time">{formatTime(trade.timestamp)}</span>
                <span class="side-tag" class:buy={trade.side === 'buy'} class:sell={trade.side === 'sell'}>
                  {trade.side === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <span class="trade-type-label">{trade.type === 'stopLoss' ? 'SL' : trade.type === 'takeProfit' ? 'TP' : trade.type === 'manual_close' ? 'CLOSE' : 'FILL'}</span>
                <span class="mono">{formatPrice(trade.entryPrice)}</span>
                {#if trade.exitPrice}
                  <span class="dim">-></span>
                  <span class="mono">{formatPrice(trade.exitPrice)}</span>
                {/if}
                <span class="spacer"></span>
                {#if trade.pnl !== undefined}
                  <span class="pnl-val" class:profit={trade.pnl >= 0} class:loss={trade.pnl < 0}>
                    {formatUsd(trade.pnl)}
                  </span>
                {/if}
                {#if trade.commission > 0}
                  <span class="commission-val">-${trade.commission.toFixed(2)}</span>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">No trades yet</div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .trading-popup {
    position: absolute;
    top: 44px;
    right: 8px;
    width: 380px;
    max-height: 440px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 50;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .header-balance {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    color: var(--text-muted);
  }

  .header-config {
    font-size: 9px;
    color: var(--text-muted);
    opacity: 0.7;
    white-space: nowrap;
  }

  .btn-close-popup {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }

  .btn-close-popup:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
  }

  :global(body.light) .btn-close-popup:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
    font-family: inherit;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition);
  }

  .tab-btn:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.02);
  }

  :global(body.light) .tab-btn:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .tab-btn.active {
    color: var(--text);
    border-bottom-color: var(--accent, #3b82f6);
  }

  .tab-badge {
    font-size: 9px;
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 8px;
    color: var(--text-muted);
  }

  :global(body.light) .tab-badge {
    background: rgba(0, 0, 0, 0.06);
  }

  .popup-pnl {
    padding: 4px 12px;
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .popup-pnl.profit { color: var(--green); }
  .popup-pnl.loss { color: var(--red); }

  .trading-content {
    padding: 8px 12px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .trading-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .action-group {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .action-right {
    margin-left: auto;
    gap: 8px;
  }

  .current-price {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    color: var(--text-muted);
  }

  .btn-buy {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    font-family: inherit;
    border: none;
    border-radius: 4px;
    background: var(--green);
    color: white;
    cursor: pointer;
    transition: opacity var(--transition);
  }
  .btn-buy:hover { opacity: 0.85; }

  .btn-sell {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    font-family: inherit;
    border: none;
    border-radius: 4px;
    background: var(--red);
    color: white;
    cursor: pointer;
    transition: opacity var(--transition);
  }
  .btn-sell:hover { opacity: 0.85; }

  .btn-limit-buy,
  .btn-limit-sell {
    padding: 3px 8px;
    font-size: 10px;
    font-family: inherit;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: all var(--transition);
  }
  .btn-limit-buy:hover { border-color: var(--green); color: var(--green); }
  .btn-limit-sell:hover { border-color: var(--red); color: var(--red); }

  .btn-reset {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }
  .btn-reset:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text);
  }
  :global(body.light) .btn-reset:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .section-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 2px;
    margin-top: 4px;
  }

  .list {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
    font-size: 11px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: background var(--transition);
  }

  .row:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  :global(body.light) .row {
    border-bottom-color: rgba(0, 0, 0, 0.04);
  }

  :global(body.light) .row:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .side-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    letter-spacing: 0.02em;
  }
  .side-tag.buy {
    color: var(--green);
    background: rgba(16, 185, 129, 0.12);
  }
  .side-tag.sell {
    color: var(--red);
    background: rgba(239, 68, 68, 0.12);
  }

  .order-type {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .mono {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    color: var(--text);
  }

  .dim {
    color: var(--text-muted);
  }

  .spacer {
    flex: 1;
  }

  .pnl-val {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    font-weight: 500;
  }
  .pnl-val.profit { color: var(--green); }
  .pnl-val.loss { color: var(--red); }

  .btn-close {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition);
  }
  .btn-close:hover {
    background: rgba(239, 68, 68, 0.15);
    color: var(--red);
  }

  .btn-cancel {
    padding: 2px 8px;
    font-size: 10px;
    font-family: inherit;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: all var(--transition);
  }
  .btn-cancel:hover {
    border-color: var(--red);
    color: var(--red);
  }

  /* History tab styles */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 8px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  :global(body.light) .stat-item {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.06);
  }

  .stat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    font-weight: 500;
  }

  .stat-value {
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
  }

  .stat-value.profit { color: var(--green); }
  .stat-value.loss { color: var(--red); }
  .stat-value.dim { color: var(--text-muted); }

  .history-row {
    flex-wrap: wrap;
  }

  .trade-time {
    font-size: 9px;
    color: var(--text-muted);
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    min-width: 55px;
  }

  .trade-type-label {
    font-size: 9px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .commission-val {
    font-size: 9px;
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    color: var(--text-muted);
    opacity: 0.7;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
