// helpers.js
const PADDING = 0;
const RADIUS = 20;

const n = (v, d = 0) => {
  const val = v?.__getValue?.() ?? v?._value ?? v; // Animated.Value | number
  const num = Number(val);
  return Number.isFinite(num) ? num : d;
};

export const svgMaskPath = ({size, position, canvasSize}) => {
  const cw = n(canvasSize?.x, 0);
  const ch = n(canvasSize?.y, 0);
  if (cw <= 0 || ch <= 0) return 'M0,0H0V0H0V0Z';

  const px = n(position?.x, 0) + 3;
  const py = n(position?.y, 0) + 18;
  const sx = n(size?.x, 0) - 10;
  const sy = n(size?.y, 0);

  let x = Math.max(0, px - PADDING);
  let y = Math.max(0, py - PADDING);
  let w = Math.max(1, sx + PADDING * 2);
  let h = Math.max(1, sy + PADDING * 2);

  if (x + w > cw) w = Math.max(1, cw - x);
  if (y + h > ch) h = Math.max(1, ch - y);

  const r = Math.max(0, Math.min(RADIUS, w / 2, h / 2));

  return [
    `M0,0H${cw}V${ch}H0V0Z`,
    `M${x + r},${y}`,
    `h${w - 2 * r}`,
    `a${r},${r} 0 0 1 ${r},${r}`,
    `v${h - 2 * r}`,
    `a${r},${r} 0 0 1 -${r},${r}`,
    `h-${w - 2 * r}`,
    `a${r},${r} 0 0 1 -${r},-${r}`,
    `v-${h - 2 * r}`,
    `a${r},${r} 0 0 1 ${r},-${r}Z`,
  ].join(' ');
};

export const StepBadge = ({currentStepNumber}) => {
  return null;
};
