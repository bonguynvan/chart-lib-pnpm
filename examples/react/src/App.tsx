import { useState, useMemo, useCallback } from 'react';
import TradingChart from './components/TradingChart.tsx';
import type { ChartType, TimeFrame } from '@tradecanvas/chart';

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
];

const TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

const TIMEFRAME_LABELS: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
};

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'candlestick', label: 'Candlestick' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'bar', label: 'Bar' },
  { value: 'heikinAshi', label: 'Heikin Ashi' },
  { value: 'hollowCandle', label: 'Hollow Candle' },
  { value: 'baseline', label: 'Baseline' },
];

const INDICATORS = [
  { id: 'sma', label: 'SMA' },
  { id: 'ema', label: 'EMA' },
  { id: 'bollinger', label: 'Bollinger' },
  { id: 'rsi', label: 'RSI' },
  { id: 'macd', label: 'MACD' },
];

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState<TimeFrame>('5m');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(
    new Set(),
  );

  const isDark = theme === 'dark';

  const indicators = useMemo(
    () => Array.from(activeIndicators),
    [activeIndicators],
  );

  const toggleIndicator = useCallback((id: string) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className={`app ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <header className="toolbar">
        <h1 className="logo">TradeCanvas</h1>

        <select
          className="select"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          {SYMBOLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="button-group">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`btn ${timeframe === tf ? 'btn-active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {TIMEFRAME_LABELS[tf] ?? tf}
            </button>
          ))}
        </div>

        <div className="separator" />

        <select
          className="select"
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
        >
          {CHART_TYPES.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label}
            </option>
          ))}
        </select>

        <div className="separator" />

        <div className="indicator-group">
          {INDICATORS.map((ind) => (
            <label key={ind.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={activeIndicators.has(ind.id)}
                onChange={() => toggleIndicator(ind.id)}
              />
              <span>{ind.label}</span>
            </label>
          ))}
        </div>

        <div className="separator" />

        <button
          className="btn"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="chart-area">
        <TradingChart
          symbol={symbol}
          timeframe={timeframe}
          theme={theme}
          chartType={chartType}
          indicators={indicators}
        />
      </main>
    </div>
  );
}

export default App;
