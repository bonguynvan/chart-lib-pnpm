import type { IndicatorPlugin } from '@tradecanvas/commons';
import type { IndicatorEngine } from '@tradecanvas/core';

export class PluginManager {
  constructor(private indicatorEngine: IndicatorEngine) {}

  registerIndicator(plugin: IndicatorPlugin): void {
    this.indicatorEngine.register(plugin);
  }
}
