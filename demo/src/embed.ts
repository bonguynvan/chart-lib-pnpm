import { ChartWidget } from '@tradecanvas/chart/widget';
import { BinanceAdapter, DARK_THEME, LIGHT_THEME } from '@tradecanvas/chart';
import type { ChartType, TimeFrame } from '@tradecanvas/chart';

const params = new URLSearchParams(window.location.search);

const symbol = params.get('symbol') ?? 'BTCUSDT';
const timeframe = (params.get('tf') ?? params.get('timeframe') ?? '5m') as TimeFrame;
const themeName = params.get('theme') ?? 'dark';
const chartType = (params.get('type') ?? 'candlestick') as ChartType;
const indicators = params.get('indicators')?.split(',').filter(Boolean) ?? [];
const historyLimit = parseInt(params.get('limit') ?? '500', 10) || 500;
const hideToolbar = params.get('toolbar') === 'false';

const theme = themeName === 'light' ? LIGHT_THEME : DARK_THEME;

if (themeName === 'light') {
  document.body.style.background = '#fafafa';
}

const container = document.getElementById('chart')!;

const widget = new ChartWidget(container, {
  symbol,
  timeframe,
  theme: themeName as 'dark' | 'light',
  adapter: new BinanceAdapter(),
  historyLimit,
  chartType,
  onReady: (chart) => {
    for (const id of indicators) {
      chart.addIndicator(id);
    }
  },
});
