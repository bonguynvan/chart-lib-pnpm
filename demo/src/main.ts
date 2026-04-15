import {
  Chart,
  BinanceAdapter,
  DARK_THEME,
  LIGHT_THEME,
} from '@tradecanvas/chart';
import type { ChartType, DrawingToolType, TimeFrame } from '@tradecanvas/chart';

// ─── State ──────────────────────────────────────────────────────────────────
let currentSymbol = 'BTCUSDT';
let currentTf: TimeFrame = '5m';
let isDark = true;
const activeIndicators = new Map<string, string>(); // indicatorId -> instanceId
let activeDrawingTool: string | null = null;

// ─── DOM refs ───────────────────────────────────────────────────────────────
const container = document.getElementById('chart-container')!;
const symbolSelect = document.getElementById('symbol') as HTMLSelectElement;
const chartTypeSelect = document.getElementById('chart-type') as HTMLSelectElement;
const timeframeGroup = document.getElementById('timeframes')!;
const indicatorGroup = document.getElementById('indicators')!;
const drawingGroup = document.getElementById('drawings')!;
const statusDot = document.getElementById('status-dot')!;
const statusText = document.getElementById('status-text')!;
const statusSymbol = document.getElementById('status-symbol')!;
const installBtn = document.getElementById('install-btn')!;
const copyCodeBtn = document.getElementById('copy-code')!;

// ─── Chart Type mapping (HTML value -> library type) ────────────────────────
const CHART_TYPE_MAP: Record<string, ChartType> = {
  'candlestick': 'candlestick',
  'line': 'line',
  'area': 'area',
  'hollow-candle': 'hollowCandle',
  'heikin-ashi': 'heikinAshi',
};

// ─── Drawing tool mapping (HTML data-draw -> library type) ──────────────────
const DRAWING_MAP: Record<string, DrawingToolType> = {
  'trendline': 'trendLine',
  'horizontal-line': 'horizontalLine',
  'fibonacci-retracement': 'fibRetracement',
  'rectangle': 'rectangle',
  'measure': 'measure',
};

// ─── Create chart ───────────────────────────────────────────────────────────
const chart = new Chart(container, {
  chartType: 'candlestick',
  theme: DARK_THEME,
  autoScale: true,
  rightMargin: 5,
  crosshair: { mode: 'magnet' },
  watermark: {
    text: 'TradeCanvas',
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

// ─── Connection ─────────────────────────────────────────────────────────────
function setStatus(state: 'connecting' | 'connected' | 'error', message: string): void {
  statusDot.className = 'status-dot';
  if (state === 'connected') {
    statusDot.classList.add('connected');
  } else if (state === 'error') {
    statusDot.classList.add('error');
  }
  statusText.textContent = message;
}

async function connectStream(): Promise<void> {
  setStatus('connecting', 'Connecting...');
  statusSymbol.textContent = `${currentSymbol} ${currentTf}`;

  try {
    chart.disconnectStream();
    const adapter = new BinanceAdapter();
    await chart.connect({
      adapter,
      symbol: currentSymbol,
      timeframe: currentTf,
      historyLimit: 500,
    });

    chart.setWatermark(currentSymbol.replace('USDT', ' / USDT'), {
      fontSize: 48,
      color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    });

    setStatus('connected', 'Live');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    setStatus('error', message);
  }
}

// ─── Symbol selector ────────────────────────────────────────────────────────
symbolSelect.addEventListener('change', () => {
  currentSymbol = symbolSelect.value;
  connectStream();
});

// ─── Timeframe buttons ──────────────────────────────────────────────────────
timeframeGroup.addEventListener('click', (e: Event) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const tf = btn.dataset.tf;
  if (!tf) return;

  timeframeGroup.querySelectorAll('.tb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTf = tf as TimeFrame;
  connectStream();
});

// ─── Chart type selector ────────────────────────────────────────────────────
chartTypeSelect.addEventListener('change', () => {
  const chartType = CHART_TYPE_MAP[chartTypeSelect.value];
  if (chartType) {
    chart.setChartType(chartType);
  }
});

// ─── Indicator toggles ─────────────────────────────────────────────────────
indicatorGroup.addEventListener('click', (e: Event) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const ind = btn.dataset.ind;
  if (!ind) return;

  if (activeIndicators.has(ind)) {
    const instanceId = activeIndicators.get(ind)!;
    chart.removeIndicator(instanceId);
    activeIndicators.delete(ind);
    btn.classList.remove('active');
  } else {
    const instanceId = chart.addIndicator(ind);
    if (instanceId) {
      activeIndicators.set(ind, instanceId);
      btn.classList.add('active');
    }
  }
});

// ─── Drawing tool toggles ──────────────────────────────────────────────────
drawingGroup.addEventListener('click', (e: Event) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const drawKey = btn.dataset.draw;
  if (!drawKey) return;
  const toolType = DRAWING_MAP[drawKey];
  if (!toolType) return;

  if (activeDrawingTool === drawKey) {
    chart.setDrawingTool(null);
    activeDrawingTool = null;
    btn.classList.remove('active');
  } else {
    drawingGroup.querySelectorAll('.tb').forEach(b => {
      if ((b as HTMLElement).dataset.draw) b.classList.remove('active');
    });
    chart.setDrawingTool(toolType);
    activeDrawingTool = drawKey;
    btn.classList.add('active');
  }
});

// ─── Theme toggle ───────────────────────────────────────────────────────────
document.getElementById('btn-theme')!.addEventListener('click', () => {
  isDark = !isDark;
  chart.setTheme(isDark ? DARK_THEME : LIGHT_THEME);
  document.body.classList.toggle('light', !isDark);
  chart.setWatermark(currentSymbol.replace('USDT', ' / USDT'), {
    fontSize: 48,
    color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  });
});

// ─── Screenshot ─────────────────────────────────────────────────────────────
document.getElementById('btn-screenshot')!.addEventListener('click', () => {
  chart.screenshot();
});

// ─── Copy install command ───────────────────────────────────────────────────
installBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('npm install @tradecanvas/chart');
    installBtn.classList.add('copied');
    const icon = installBtn.querySelector('.copy-icon') as HTMLElement;
    const originalText = icon.textContent;
    icon.textContent = 'COPIED';
    setTimeout(() => {
      installBtn.classList.remove('copied');
      icon.textContent = originalText;
    }, 2000);
  } catch {
    // Clipboard API not available, ignore silently
  }
});

// ─── Copy quick-start code ──────────────────────────────────────────────────
const QUICK_START_CODE = `import { Chart, BinanceAdapter } from '@tradecanvas/chart'

// Create a chart
const chart = new Chart(document.getElementById('chart')!, {
  theme: 'dark',
  autoScale: true,
  features: {
    drawings: true,
    indicators: true,
    trading: true,
    volume: true,
  },
})

// Connect to live Binance data
const adapter = new BinanceAdapter()
chart.connect({
  adapter,
  symbol: 'BTCUSDT',
  timeframe: '5m',
  historyLimit: 300,
})`;

copyCodeBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(QUICK_START_CODE);
    const original = copyCodeBtn.textContent;
    copyCodeBtn.textContent = 'Copied';
    setTimeout(() => {
      copyCodeBtn.textContent = original;
    }, 2000);
  } catch {
    // Clipboard API not available, ignore silently
  }
});

// ─── Boot ───────────────────────────────────────────────────────────────────
connectStream();
