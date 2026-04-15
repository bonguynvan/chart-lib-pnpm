<template>
  <div ref="chartContainer" class="chart-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  Chart,
  BinanceAdapter,
  DARK_THEME,
  LIGHT_THEME,
} from '@tradecanvas/chart';
import type { ChartType, TimeFrame } from '@tradecanvas/chart';

const props = withDefaults(
  defineProps<{
    symbol?: string;
    timeframe?: TimeFrame;
    chartType?: ChartType;
    theme?: 'dark' | 'light';
    indicators?: string[];
  }>(),
  {
    symbol: 'BTCUSDT',
    timeframe: '5m',
    chartType: 'candlestick',
    theme: 'dark',
    indicators: () => [],
  },
);

const chartContainer = ref<HTMLDivElement>();
let chart: Chart | null = null;
const indicatorIds = new Map<string, string>();

onMounted(() => {
  if (!chartContainer.value) return;

  chart = new Chart(chartContainer.value, {
    chartType: props.chartType,
    theme: props.theme === 'dark' ? DARK_THEME : LIGHT_THEME,
    autoScale: true,
    rightMargin: 5,
    crosshair: { mode: 'magnet' },
    watermark: {
      text: props.symbol.replace('USDT', '/USDT'),
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
  chart.connect({
    adapter,
    symbol: props.symbol,
    timeframe: props.timeframe,
    historyLimit: 500,
  });
});

onUnmounted(() => {
  if (chart) {
    chart.disconnectStream();
    chart.destroy();
    chart = null;
  }
});

// Reconnect on symbol or timeframe change
watch(
  () => [props.symbol, props.timeframe] as const,
  ([newSymbol, newTimeframe]) => {
    if (!chart) return;
    chart.disconnectStream();
    const adapter = new BinanceAdapter();
    chart.connect({
      adapter,
      symbol: newSymbol,
      timeframe: newTimeframe,
      historyLimit: 500,
    });
    chart.setWatermark(newSymbol.replace('USDT', '/USDT'), {
      fontSize: 48,
      color: 'rgba(255,255,255,0.03)',
    });
  },
);

// Theme changes
watch(
  () => props.theme,
  (newTheme) => {
    if (!chart) return;
    chart.setTheme(newTheme === 'dark' ? DARK_THEME : LIGHT_THEME);
  },
);

// Chart type changes
watch(
  () => props.chartType,
  (newType) => {
    if (!chart) return;
    chart.setChartType(newType);
  },
);

// Indicator sync
watch(
  () => props.indicators,
  (newIndicators) => {
    if (!chart) return;
    const desired = new Set(newIndicators);

    for (const [name, instanceId] of indicatorIds) {
      if (!desired.has(name)) {
        chart.removeIndicator(instanceId);
        indicatorIds.delete(name);
      }
    }

    for (const name of newIndicators) {
      if (!indicatorIds.has(name)) {
        const instanceId = chart.addIndicator(name);
        if (instanceId) {
          indicatorIds.set(name, instanceId);
        }
      }
    }
  },
  { deep: true },
);
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}
</style>
