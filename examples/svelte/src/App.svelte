<script lang="ts">
  import TradingChart from './components/TradingChart.svelte';
  import type { ChartType, TimeFrame } from '@tradecanvas/chart';

  const SYMBOLS = [
    { value: 'BTCUSDT', label: 'BTC/USDT' },
    { value: 'ETHUSDT', label: 'ETH/USDT' },
    { value: 'SOLUSDT', label: 'SOL/USDT' },
    { value: 'BNBUSDT', label: 'BNB/USDT' },
  ];

  const TIMEFRAMES: { value: TimeFrame; label: string }[] = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
  ];

  const CHART_TYPES: { value: ChartType; label: string }[] = [
    { value: 'candlestick', label: 'Candlestick' },
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' },
    { value: 'bar', label: 'Bar (OHLC)' },
    { value: 'heikinAshi', label: 'Heikin Ashi' },
    { value: 'hollowCandle', label: 'Hollow Candle' },
    { value: 'baseline', label: 'Baseline' },
  ];

  const INDICATORS = [
    { id: 'sma', label: 'SMA' },
    { id: 'ema', label: 'EMA' },
    { id: 'bollinger', label: 'BB' },
    { id: 'rsi', label: 'RSI' },
    { id: 'macd', label: 'MACD' },
  ];

  let symbol = $state('BTCUSDT');
  let timeframe = $state<TimeFrame>('5m');
  let chartType = $state<ChartType>('candlestick');
  let theme = $state<'dark' | 'light'>('dark');
  let activeIndicators = $state(new Set<string>());

  const isDark = $derived(theme === 'dark');
  const indicators = $derived(Array.from(activeIndicators));

  function toggleIndicator(id: string) {
    const next = new Set(activeIndicators);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    activeIndicators = next;
  }
</script>

<div class="app" class:theme-dark={isDark} class:theme-light={!isDark}>
  <header class="toolbar">
    <h1 class="logo">TradeCanvas</h1>
    <div class="separator"></div>

    <select class="select" bind:value={symbol}>
      {#each SYMBOLS as s}
        <option value={s.value}>{s.label}</option>
      {/each}
    </select>

    <div class="separator"></div>

    <div class="btn-group">
      {#each TIMEFRAMES as tf}
        <button
          class="btn"
          class:btn-active={timeframe === tf.value}
          onclick={() => (timeframe = tf.value)}
        >
          {tf.label}
        </button>
      {/each}
    </div>

    <div class="separator"></div>

    <select class="select" bind:value={chartType}>
      {#each CHART_TYPES as ct}
        <option value={ct.value}>{ct.label}</option>
      {/each}
    </select>

    <div class="separator"></div>

    <div class="btn-group">
      {#each INDICATORS as ind}
        <button
          class="btn"
          class:btn-active={activeIndicators.has(ind.id)}
          onclick={() => toggleIndicator(ind.id)}
        >
          {ind.label}
        </button>
      {/each}
    </div>

    <div class="separator"></div>

    <button class="btn" onclick={() => (theme = isDark ? 'light' : 'dark')}>
      Theme
    </button>
  </header>

  <main class="chart-area">
    <TradingChart {symbol} {timeframe} {chartType} {theme} {indicators} />
  </main>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .theme-dark {
    --bg: #0a0a0f;
    --bg-elevated: #111118;
    --border: #1e1e2e;
    --text: #e1e1e6;
    --text-muted: #6b6b7b;
    --text-dim: #a1a1aa;
    --accent: #3b82f6;
  }

  .theme-light {
    --bg: #f8f8fa;
    --bg-elevated: #ffffff;
    --border: #e0e0e8;
    --text: #1a1a2e;
    --text-muted: #8888a0;
    --text-dim: #555566;
    --accent: #2563eb;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
    color: var(--text);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 12px;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .chart-area {
    flex: 1;
    min-height: 0;
  }

  .logo {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  .separator {
    width: 1px;
    height: 20px;
    background: var(--border);
    flex-shrink: 0;
  }

  .select {
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    outline: none;
  }

  .select:focus {
    border-color: var(--accent);
  }

  .btn-group {
    display: flex;
    gap: 2px;
  }

  .btn {
    padding: 4px 8px;
    font-size: 12px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
    white-space: nowrap;
  }

  .btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text);
  }

  .theme-light .btn:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .btn-active {
    background: var(--accent);
    color: #ffffff;
  }

  .btn-active:hover {
    background: var(--accent);
    color: #ffffff;
  }
</style>
