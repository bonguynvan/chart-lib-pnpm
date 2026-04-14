import type { TimeFrame } from '../types/ohlc.js';

const TIMEFRAME_MS: Record<TimeFrame, number> = {
  '1s': 1_000,
  '5s': 5_000,
  '15s': 15_000,
  '30s': 30_000,
  '1m': 60_000,
  '3m': 180_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '45m': 2_700_000,
  '1h': 3_600_000,
  '2h': 7_200_000,
  '3h': 10_800_000,
  '4h': 14_400_000,
  '6h': 21_600_000,
  '8h': 28_800_000,
  '12h': 43_200_000,
  '1d': 86_400_000,
  '2d': 172_800_000,
  '3d': 259_200_000,
  '1w': 604_800_000,
  '2w': 1_209_600_000,
  '1M': 2_592_000_000,
  '3M': 7_776_000_000,
  '6M': 15_552_000_000,
  '12M': 31_536_000_000,
};

export function timeframeToMs(tf: TimeFrame): number {
  return TIMEFRAME_MS[tf];
}

export function formatTimestamp(timestamp: number, tf: TimeFrame): string {
  const d = new Date(timestamp);
  const ms = TIMEFRAME_MS[tf];
  if (ms >= 86_400_000) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (ms >= 3_600_000) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function alignToTimeframe(timestamp: number, tf: TimeFrame): number {
  const ms = TIMEFRAME_MS[tf];
  return Math.floor(timestamp / ms) * ms;
}
