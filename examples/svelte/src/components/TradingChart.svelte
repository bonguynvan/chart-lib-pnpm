<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    BinanceAdapter,
    DARK_THEME,
    LIGHT_THEME,
  } from '@tradecanvas/chart';
  import type { ChartType, TimeFrame } from '@tradecanvas/chart';

  interface Props {
    symbol?: string;
    timeframe?: TimeFrame;
    chartType?: ChartType;
    theme?: 'dark' | 'light';
    indicators?: string[];
  }

  let {
    symbol = 'BTCUSDT',
    timeframe = '5m' as TimeFrame,
    chartType = 'candlestick' as ChartType,
    theme = 'dark',
    indicators = [] as string[],
  }: Props = $props();

  let container: HTMLDivElement;
  let chart: Chart | null = null;
  const indicatorIds = new Map<string, string>();

  onMount(() => {
    chart = new Chart(container, {
      chartType,
      theme: theme === 'dark' ? DARK_THEME : LIGHT_THEME,
      autoScale: true,
      rightMargin: 5,
      crosshair: { mode: 'magnet' },
      watermark: {
        text: symbol.replace('USDT', '/USDT'),
        fontSize: 48,
        color: 'rgba(255,255,255,0.03)',
      },
      features: {
        drawings: true,
        drawingMagnet: true,
        drawingUndoRedo: true,
        indicators: true,
        trading: true,
        volume: true,
        legend: true,
        crosshair: true,
        keyboard: true,
        screenshot: true,
        alerts: true,
        barCountdown: true,
        logScale: true,
        watermark: true,
      },
    });

    const adapter = new BinanceAdapter();
    chart.connect({ adapter, symbol, timeframe, historyLimit: 500 });
  });

  onDestroy(() => {
    if (chart) {
      chart.disconnectStream();
      chart.destroy();
      chart = null;
    }
  });

  // Reconnect when symbol or timeframe changes
  $effect(() => {
    if (!chart) return;
    // Read reactive props
    const _s = symbol;
    const _tf = timeframe;

    chart.disconnectStream();
    const adapter = new BinanceAdapter();
    chart.connect({ adapter, symbol: _s, timeframe: _tf, historyLimit: 500 });
    chart.setWatermark(_s.replace('USDT', '/USDT'), {
      fontSize: 48,
      color: 'rgba(255,255,255,0.03)',
    });
  });

  // Theme changes
  $effect(() => {
    if (!chart) return;
    chart.setTheme(theme === 'dark' ? DARK_THEME : LIGHT_THEME);
  });

  // Chart type changes
  $effect(() => {
    if (!chart) return;
    chart.setChartType(chartType);
  });

  // Indicator sync
  $effect(() => {
    if (!chart) return;
    const desired = new Set(indicators);

    for (const [name, instanceId] of indicatorIds) {
      if (!desired.has(name)) {
        chart.removeIndicator(instanceId);
        indicatorIds.delete(name);
      }
    }

    for (const name of indicators) {
      if (!indicatorIds.has(name)) {
        const instanceId = chart.addIndicator(name);
        if (instanceId) {
          indicatorIds.set(name, instanceId);
        }
      }
    }
  });
</script>

<div bind:this={container} class="chart-container"></div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
