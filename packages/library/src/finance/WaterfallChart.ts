import type { Theme, WaterfallBar, WaterfallOptions } from '@tradecanvas/commons';
import { BaseFinanceChart, FinanceCrosshair, renderWaterfall } from '@tradecanvas/core';

export class WaterfallChart extends BaseFinanceChart {
  private options: WaterfallOptions;
  private crosshair: FinanceCrosshair | null = null;

  constructor(container: HTMLElement, options: WaterfallOptions) {
    super(container, options.theme);
    this.options = options;

    if (options.crosshair !== false) {
      this.crosshair = new FinanceCrosshair(this.canvas, () => this.requestRender());
    }

    this.requestRender();
  }

  protected renderChart(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: Theme,
  ): void {
    const pos = this.crosshair?.getPosition() ?? null;
    renderWaterfall(ctx, width, height, this.options, theme, pos);
  }

  update(data: WaterfallBar[]): void {
    this.options = { ...this.options, data };
    this.requestRender();
  }

  setOptions(opts: Partial<WaterfallOptions>): void {
    this.options = { ...this.options, ...opts };
    this.requestRender();
  }

  destroy(): void {
    this.crosshair?.destroy();
    super.destroy();
  }
}
