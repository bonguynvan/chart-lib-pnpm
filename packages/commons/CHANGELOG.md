# @tradecanvas/commons

## 0.2.0

### Minor Changes

- Add 4 finance chart components (SparklineChart, DepthChart, EquityCurveChart, HeatmapChart), client-side order matching engine with trade history, and comprehensive developer documentation.

  Features:

  - SparklineChart: tiny inline line/area chart for dashboards
  - DepthChart: bid/ask order book visualization with crosshair
  - EquityCurveChart: portfolio equity with drawdown shading and benchmark
  - HeatmapChart: colored cell grid with treemap layout
  - Order matching engine: auto-fills limit/stop orders with spread and commission
  - Trade history with win rate and PnL stats
  - Toast notifications for order fills and SL/TP triggers
  - Trade-on-chart via built-in right-click context menu
  - TC prefix on all generated IDs
  - Auto-scale includes overlay indicator values
  - StackBlitz interactive sandboxes (Vanilla JS, React, Svelte, Vue)
  - Panel indicators now render immediately (no interaction needed)

  Bug fixes:

  - Stop orders show correct STOP label
  - Fix workspace:\* deps in published packages
