import type { ViewportState } from '@tradecanvas/commons';
import type { DrawingManager } from './DrawingManager.js';

export class DrawingRenderer {
  constructor(private manager: DrawingManager) {}

  render(ctx: CanvasRenderingContext2D, viewport: ViewportState): void {
    this.manager.render(ctx, viewport);
  }
}
