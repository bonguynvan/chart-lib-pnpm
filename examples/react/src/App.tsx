import { useState, useMemo, useCallback } from 'react';
import TradingChart from './components/TradingChart.tsx';
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
        <div className="separator" />

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

        <div className="separator" />

        <div className="btn-group">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`btn ${timeframe === tf.value ? 'btn-active' : ''}`}
              onClick={() => setTimeframe(tf.value)}
            >
              {tf.label}
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

        <div className="btn-group">
          {INDICATORS.map((ind) => (
            <button
              key={ind.id}
              className={`btn ${activeIndicators.has(ind.id) ? 'btn-active' : ''}`}
              onClick={() => toggleIndicator(ind.id)}
            >
              {ind.label}
            </button>
          ))}
        </div>

        <div className="separator" />

        <button
          className="btn"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          Theme
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
