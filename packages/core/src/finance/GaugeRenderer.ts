import type { GaugeOptions, GaugeZone, Theme } from '@tradecanvas/commons';

const DEG_TO_RAD = Math.PI / 180;
const DEFAULT_START_DEG = 135;  // bottom-left (canvas: angle measured from +x axis, clockwise)
const DEFAULT_END_DEG = 405;    // bottom-right (135 + 270)
const DEFAULT_THICKNESS = 0.25;

interface GaugeGeometry {
  cx: number;
  cy: number;
  radius: number;
  innerRadius: number;
  startAngle: number;
  endAngle: number;
  angleRange: number;
  min: number;
  max: number;
  range: number;
}

function defaultValueFormat(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  if (Number.isInteger(v)) return v.toFixed(0);
  return v.toFixed(1);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function computeGeometry(
  width: number,
  height: number,
  options: GaugeOptions,
): GaugeGeometry {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const range = (max - min) || 1;

  const startAngle = (options.startAngle ?? DEFAULT_START_DEG) * DEG_TO_RAD;
  const endAngle = (options.endAngle ?? DEFAULT_END_DEG) * DEG_TO_RAD;
  const thicknessRatio = options.thickness ?? DEFAULT_THICKNESS;

  // Leave room for labels
  const margin = 24;
  const cx = width / 2;
  // Bias center down a bit so the open bottom has room for labels
  const cy = height / 2 + height * 0.05;
  const radius = Math.max(10, Math.min(width, height) / 2 - margin);
  const innerRadius = Math.max(2, radius * (1 - thicknessRatio));

  return {
    cx,
    cy,
    radius,
    innerRadius,
    startAngle,
    endAngle,
    angleRange: endAngle - startAngle,
    min,
    max,
    range,
  };
}

function valueToAngle(value: number, geo: GaugeGeometry): number {
  const t = clamp((value - geo.min) / geo.range, 0, 1);
  return geo.startAngle + geo.angleRange * t;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bg: string,
): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

function drawTrackArc(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  trackColor: string,
): void {
  ctx.beginPath();
  ctx.arc(geo.cx, geo.cy, geo.radius, geo.startAngle, geo.endAngle, false);
  ctx.arc(geo.cx, geo.cy, geo.innerRadius, geo.endAngle, geo.startAngle, true);
  ctx.closePath();
  ctx.fillStyle = trackColor;
  ctx.fill();
}

function drawZoneArc(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  zone: GaugeZone,
): void {
  const from = clamp(zone.from, geo.min, geo.max);
  const to = clamp(zone.to, geo.min, geo.max);
  if (to <= from) return;

  const a0 = valueToAngle(from, geo);
  const a1 = valueToAngle(to, geo);

  ctx.beginPath();
  ctx.arc(geo.cx, geo.cy, geo.radius, a0, a1, false);
  ctx.arc(geo.cx, geo.cy, geo.innerRadius, a1, a0, true);
  ctx.closePath();
  ctx.fillStyle = zone.color;
  ctx.fill();
}

function drawValueArc(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  value: number,
  color: string,
  alpha: number,
): void {
  const valueAngle = valueToAngle(value, geo);
  if (valueAngle <= geo.startAngle) return;

  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(geo.cx, geo.cy, geo.radius, geo.startAngle, valueAngle, false);
  ctx.arc(geo.cx, geo.cy, geo.innerRadius, valueAngle, geo.startAngle, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawNeedle(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  value: number,
  color: string,
): void {
  const angle = valueToAngle(value, geo);
  // Cache trig
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const tipRadius = geo.radius - 2;
  const baseRadius = geo.innerRadius * 0.25;

  // Needle as a narrow triangle for better presence; all in one path.
  const perpX = -sin;
  const perpY = cos;
  const baseHalf = 4;

  const tipX = geo.cx + cos * tipRadius;
  const tipY = geo.cy + sin * tipRadius;
  const leftX = geo.cx + perpX * baseHalf - cos * baseRadius;
  const leftY = geo.cy + perpY * baseHalf - sin * baseRadius;
  const rightX = geo.cx - perpX * baseHalf - cos * baseRadius;
  const rightY = geo.cy - perpY * baseHalf - sin * baseRadius;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Center hub
  ctx.beginPath();
  ctx.arc(geo.cx, geo.cy, Math.max(4, geo.innerRadius * 0.12), 0, Math.PI * 2);
  ctx.fill();
}

function drawCenterLabel(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  valueText: string,
  subtitle: string | undefined,
  theme: Theme,
): void {
  const mainSize = Math.round(geo.innerRadius * 0.55);
  const subSize = Math.round(theme.font.sizeMedium);

  ctx.fillStyle = theme.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${mainSize}px ${theme.font.family}`;

  const hasSubtitle = !!subtitle;
  const mainY = hasSubtitle ? geo.cy - subSize * 0.6 : geo.cy - mainSize * 0.1;
  ctx.fillText(valueText, geo.cx, mainY);

  if (hasSubtitle) {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `${subSize}px ${theme.font.family}`;
    ctx.fillText(subtitle!, geo.cx, geo.cy + mainSize * 0.55);
  }
}

function drawEndLabels(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  valueFormat: (v: number) => string,
  theme: Theme,
): void {
  ctx.fillStyle = theme.textSecondary;
  ctx.font = `${theme.font.sizeSmall}px ${theme.font.family}`;

  // Min at start angle, max at end angle — positioned slightly outside the track
  const labelRadius = geo.radius + 10;

  const minCos = Math.cos(geo.startAngle);
  const minSin = Math.sin(geo.startAngle);
  const maxCos = Math.cos(geo.endAngle);
  const maxSin = Math.sin(geo.endAngle);

  const minX = geo.cx + minCos * labelRadius;
  const minY = geo.cy + minSin * labelRadius;
  const maxX = geo.cx + maxCos * labelRadius;
  const maxY = geo.cy + maxSin * labelRadius;

  ctx.textBaseline = 'middle';
  ctx.textAlign = minCos < -0.2 ? 'right' : minCos > 0.2 ? 'left' : 'center';
  ctx.fillText(valueFormat(geo.min), minX, minY);

  ctx.textAlign = maxCos < -0.2 ? 'right' : maxCos > 0.2 ? 'left' : 'center';
  ctx.fillText(valueFormat(geo.max), maxX, maxY);
}

function drawZoneLabels(
  ctx: CanvasRenderingContext2D,
  geo: GaugeGeometry,
  zones: readonly GaugeZone[],
  theme: Theme,
): void {
  ctx.fillStyle = theme.textSecondary;
  ctx.font = `${theme.font.sizeSmall}px ${theme.font.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const labelRadius = (geo.radius + geo.innerRadius) / 2;

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    if (!zone.label) continue;
    const mid = (clamp(zone.from, geo.min, geo.max) + clamp(zone.to, geo.min, geo.max)) / 2;
    const angle = valueToAngle(mid, geo);
    const x = geo.cx + Math.cos(angle) * labelRadius;
    const y = geo.cy + Math.sin(angle) * labelRadius;
    ctx.fillText(zone.label, x, y);
  }
}

export function renderGauge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: GaugeOptions,
  theme: Theme,
  displayValue: number,
): void {
  if (width <= 0 || height <= 0) return;

  const geo = computeGeometry(width, height, options);
  const trackColor = options.trackColor ?? theme.grid;
  const needleColor = options.needleColor ?? theme.text;
  const showValue = options.showValue !== false;
  const showZoneLabels = options.showZoneLabels === true;
  const valueFormat = options.valueFormat ?? defaultValueFormat;

  const clampedValue = clamp(displayValue, geo.min, geo.max);

  drawBackground(ctx, width, height, theme.background);

  // 1. Track
  drawTrackArc(ctx, geo, trackColor);

  // 2. Zones
  const zones = options.zones;
  if (zones && zones.length > 0) {
    for (let i = 0; i < zones.length; i++) {
      drawZoneArc(ctx, geo, zones[i]);
    }
  }

  // 3. Value arc — subtle tint using needle color (or text color) so the filled
  // portion reads even when zones are transparent.
  drawValueArc(ctx, geo, clampedValue, needleColor, 0.12);

  // 4. Needle + hub
  drawNeedle(ctx, geo, clampedValue, needleColor);

  // 5. Center labels
  if (showValue) {
    drawCenterLabel(ctx, geo, valueFormat(clampedValue), options.label, theme);
  }

  // 6. Min/max labels
  drawEndLabels(ctx, geo, valueFormat, theme);

  // 7. Zone labels
  if (showZoneLabels && zones && zones.length > 0) {
    drawZoneLabels(ctx, geo, zones, theme);
  }
}
