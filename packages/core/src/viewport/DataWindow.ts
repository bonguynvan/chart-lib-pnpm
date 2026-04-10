import type { DataSeries, ViewportState } from '@tradecanvas/commons';
import { sliceVisibleData } from '@tradecanvas/commons';

export function getVisibleData(data: DataSeries, viewport: ViewportState): DataSeries {
  return sliceVisibleData(data, viewport.visibleRange.from, viewport.visibleRange.to);
}
