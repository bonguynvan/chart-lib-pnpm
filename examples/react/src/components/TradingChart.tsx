import { useRef, useEffect } from 'react';
import {
  Chart,
  BinanceAdapter,
  DARK_THEME,
  LIGHT_THEME,
} from '@tradecanvas/chart';
import type { ChartType, TimeFrame } from '@tradecanvas/chart';

interface TradingChartProps {
  symbol: string;
  timeframe: TimeFrame;
  theme?: 'dark' | 'light';
  chartType?: ChartType;
  indicators?: string[];
  className?: string;
  style?: React.CSSProperties;
}

function TradingChart({
  symbol,
  timeframe,
  theme = 'dark',
  chartType = 'candlestick',
  indicators = [],
  className,
  style,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const indicatorIdsRef = useRef<Map<string, string>>(new Map());
  const prevSymbolRef = useRef(symbol);
  const prevTimeframeRef = useRef(timeframe);

  // Create chart on mount, destroy on unmount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = new Chart(container, {
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

    chartRef.current = chart;
    indicatorIdsRef.current = new Map();

    // Connect to stream
    const adapter = new BinanceAdapter();
    chart.connect({
      adapter,
      symbol,
      timeframe,
      historyLimit: 500,
    });

    return () => {
      chart.disconnectStream();
      chart.destroy();
      chartRef.current = null;
      indicatorIdsRef.current.clear();
    };
    // Only run on mount/unmount. Prop changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle symbol/timeframe changes -- reconnect stream
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const symbolChanged = prevSymbolRef.current !== symbol;
    const timeframeChanged = prevTimeframeRef.current !== timeframe;

    if (symbolChanged || timeframeChanged) {
      prevSymbolRef.current = symbol;
      prevTimeframeRef.current = timeframe;

      chart.disconnectStream();
      const adapter = new BinanceAdapter();
      chart.connect({
        adapter,
        symbol,
        timeframe,
        historyLimit: 500,
      });

      chart.setWatermark(symbol.replace('USDT', '/USDT'), {
        fontSize: 48,
        color: 'rgba(255,255,255,0.03)',
      });
    }
  }, [symbol, timeframe]);

  // Handle theme changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setTheme(theme === 'dark' ? DARK_THEME : LIGHT_THEME);
  }, [theme]);

  // Handle chartType changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setChartType(chartType);
  }, [chartType]);

  // Handle indicator changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const current = indicatorIdsRef.current;
    const desired = new Set(indicators);

    // Remove indicators no longer in the list
    for (const [name, instanceId] of current) {
      if (!desired.has(name)) {
        chart.removeIndicator(instanceId);
        current.delete(name);
      }
    }

    // Add new indicators
    for (const name of indicators) {
      if (!current.has(name)) {
        const instanceId = chart.addIndicator(name);
        if (instanceId) {
          current.set(name, instanceId);
        }
      }
    }
  }, [indicators]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}

export default TradingChart;
