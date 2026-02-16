/**
 * SVG primitive builders for generating pattern animations.
 * All functions return raw SVG string fragments.
 */

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  bg: '#ffffff',
  bgSecondary: '#f9fafb',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  highlight: '#dbeafe',
  visited: '#c4b5fd',
  cellBg: '#f3f4f6',
}

/** Wrap SVG content in a complete SVG document */
export function svgDocument(content: string, styles?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    ${arrowMarkerDef()}
    ${arrowMarkerDef('arrow-green', COLORS.secondary)}
    ${arrowMarkerDef('arrow-blue', COLORS.primary)}
    ${arrowMarkerDef('arrow-gray', COLORS.border)}
  </defs>
  ${styles ? `<style>${styles}</style>` : ''}
  <rect width="800" height="400" fill="${COLORS.bg}" rx="8"/>
  ${content}
</svg>`
}

export function arrowMarkerDef(id = 'arrow', color = COLORS.text): string {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"/>
  </marker>`
}

// --- Primitive builders ---

interface RectOpts {
  fill?: string; stroke?: string; strokeWidth?: number
  rx?: number; id?: string; className?: string; opacity?: number
}

export function rect(x: number, y: number, w: number, h: number, opts: RectOpts = {}): string {
  const attrs = [
    `x="${x}" y="${y}" width="${w}" height="${h}"`,
    `fill="${opts.fill ?? COLORS.cellBg}"`,
    opts.stroke ? `stroke="${opts.stroke}" stroke-width="${opts.strokeWidth ?? 1}"` : '',
    opts.rx ? `rx="${opts.rx}"` : '',
    opts.id ? `id="${opts.id}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.opacity !== undefined ? `opacity="${opts.opacity}"` : '',
  ].filter(Boolean).join(' ')
  return `<rect ${attrs}/>`
}

interface CircleOpts {
  fill?: string; stroke?: string; strokeWidth?: number
  id?: string; className?: string; opacity?: number
}

export function circle(cx: number, cy: number, r: number, opts: CircleOpts = {}): string {
  const attrs = [
    `cx="${cx}" cy="${cy}" r="${r}"`,
    `fill="${opts.fill ?? COLORS.cellBg}"`,
    opts.stroke ? `stroke="${opts.stroke}" stroke-width="${opts.strokeWidth ?? 2}"` : '',
    opts.id ? `id="${opts.id}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.opacity !== undefined ? `opacity="${opts.opacity}"` : '',
  ].filter(Boolean).join(' ')
  return `<circle ${attrs}/>`
}

interface TextOpts {
  fill?: string; fontSize?: number; anchor?: string
  fontWeight?: string; id?: string; className?: string
  dy?: string; fontFamily?: string
}

export function text(x: number, y: number, content: string, opts: TextOpts = {}): string {
  const attrs = [
    `x="${x}" y="${y}"`,
    `fill="${opts.fill ?? COLORS.text}"`,
    `font-size="${opts.fontSize ?? 14}"`,
    `text-anchor="${opts.anchor ?? 'middle'}"`,
    `dominant-baseline="central"`,
    opts.fontWeight ? `font-weight="${opts.fontWeight}"` : '',
    opts.id ? `id="${opts.id}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.dy ? `dy="${opts.dy}"` : '',
    `font-family="system-ui, -apple-system, sans-serif"`,
  ].filter(Boolean).join(' ')
  return `<text ${attrs}>${content}</text>`
}

interface LineOpts {
  stroke?: string; strokeWidth?: number; markerEnd?: string
  id?: string; className?: string; strokeDasharray?: string; opacity?: number
}

export function line(x1: number, y1: number, x2: number, y2: number, opts: LineOpts = {}): string {
  const attrs = [
    `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`,
    `stroke="${opts.stroke ?? COLORS.text}"`,
    `stroke-width="${opts.strokeWidth ?? 2}"`,
    opts.markerEnd ? `marker-end="url(#${opts.markerEnd})"` : '',
    opts.id ? `id="${opts.id}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.strokeDasharray ? `stroke-dasharray="${opts.strokeDasharray}"` : '',
    opts.opacity !== undefined ? `opacity="${opts.opacity}"` : '',
  ].filter(Boolean).join(' ')
  return `<line ${attrs}/>`
}

export function path(d: string, opts: LineOpts & { fill?: string } = {}): string {
  const attrs = [
    `d="${d}"`,
    `fill="${opts.fill ?? 'none'}"`,
    `stroke="${opts.stroke ?? COLORS.text}"`,
    `stroke-width="${opts.strokeWidth ?? 2}"`,
    opts.markerEnd ? `marker-end="url(#${opts.markerEnd})"` : '',
    opts.id ? `id="${opts.id}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.strokeDasharray ? `stroke-dasharray="${opts.strokeDasharray}"` : '',
    opts.opacity !== undefined ? `opacity="${opts.opacity}"` : '',
  ].filter(Boolean).join(' ')
  return `<path ${attrs}/>`
}

export function group(content: string, opts: { id?: string; className?: string; transform?: string } = {}): string {
  const attrs = [
    opts.id ? `id="${opts.id}"` : '',
    opts.className ? `class="${opts.className}"` : '',
    opts.transform ? `transform="${opts.transform}"` : '',
  ].filter(Boolean).join(' ')
  return `<g ${attrs}>${content}</g>`
}

// --- SMIL animation builders ---

interface AnimateOpts {
  attributeName: string; values: string; dur: string
  begin?: string; repeatCount?: string; fill?: string
  keyTimes?: string; calcMode?: string
}

export function animate(opts: AnimateOpts): string {
  const attrs = [
    `attributeName="${opts.attributeName}"`,
    `values="${opts.values}"`,
    `dur="${opts.dur}"`,
    opts.begin ? `begin="${opts.begin}"` : '',
    `repeatCount="${opts.repeatCount ?? 'indefinite'}"`,
    opts.fill ? `fill="${opts.fill}"` : '',
    opts.keyTimes ? `keyTimes="${opts.keyTimes}"` : '',
    opts.calcMode ? `calcMode="${opts.calcMode}"` : '',
  ].filter(Boolean).join(' ')
  return `<animate ${attrs}/>`
}

// --- Composite builders ---

/** Array cell: rectangle with centered text */
export function arrayCell(x: number, y: number, value: string, opts: {
  width?: number; height?: number; fill?: string; id?: string; className?: string
  textFill?: string; fontSize?: number; stroke?: string
} = {}): string {
  const w = opts.width ?? 60
  const h = opts.height ?? 50
  return group([
    rect(x, y, w, h, { fill: opts.fill ?? COLORS.cellBg, rx: 6, stroke: opts.stroke ?? COLORS.border, id: opts.id, className: opts.className }),
    text(x + w / 2, y + h / 2, value, { fill: opts.textFill ?? COLORS.text, fontSize: opts.fontSize ?? 16, fontWeight: '600' }),
  ].join('\n'))
}

/** Tree node: circle with centered text */
export function treeNode(cx: number, cy: number, value: string, opts: {
  r?: number; fill?: string; stroke?: string; id?: string; className?: string
} = {}): string {
  const r = opts.r ?? 22
  return group([
    circle(cx, cy, r, { fill: opts.fill ?? COLORS.cellBg, stroke: opts.stroke ?? COLORS.border, strokeWidth: 2, id: opts.id, className: opts.className }),
    text(cx, cy, value, { fontSize: 14, fontWeight: '600' }),
  ].join('\n'))
}

/** Tree edge: line between two nodes */
export function treeEdge(x1: number, y1: number, x2: number, y2: number, opts: {
  stroke?: string; id?: string; className?: string
} = {}): string {
  return line(x1, y1, x2, y2, { stroke: opts.stroke ?? COLORS.border, strokeWidth: 2, id: opts.id, className: opts.className })
}

/** Graph node: circle with label */
export function graphNode(cx: number, cy: number, label: string, opts: {
  r?: number; fill?: string; stroke?: string; id?: string; className?: string
} = {}): string {
  const r = opts.r ?? 24
  return group([
    circle(cx, cy, r, { fill: opts.fill ?? COLORS.cellBg, stroke: opts.stroke ?? COLORS.primary, strokeWidth: 2, id: opts.id, className: opts.className }),
    text(cx, cy, label, { fontSize: 14, fontWeight: '700' }),
  ].join('\n'))
}

/** Directed edge between graph nodes */
export function graphEdge(x1: number, y1: number, x2: number, y2: number, opts: {
  directed?: boolean; stroke?: string; id?: string; className?: string
} = {}): string {
  // Shorten line to not overlap with node circles (radius ~24)
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const r = 26
  const sx = x1 + (dx / len) * r
  const sy = y1 + (dy / len) * r
  const ex = x2 - (dx / len) * r
  const ey = y2 - (dy / len) * r
  return line(sx, sy, ex, ey, {
    stroke: opts.stroke ?? COLORS.border,
    strokeWidth: 2,
    markerEnd: opts.directed !== false ? 'arrow' : undefined,
    id: opts.id,
    className: opts.className,
  })
}

/** Pointer triangle pointing up at a position */
export function pointer(x: number, y: number, label: string, direction: 'up' | 'down' = 'up', opts: {
  color?: string; id?: string; className?: string
} = {}): string {
  const color = opts.color ?? COLORS.primary
  const triH = 12
  const triW = 10
  let tri: string
  if (direction === 'up') {
    tri = path(`M ${x} ${y} L ${x - triW / 2} ${y + triH} L ${x + triW / 2} ${y + triH} Z`, { fill: color, stroke: 'none' })
  } else {
    tri = path(`M ${x} ${y} L ${x - triW / 2} ${y - triH} L ${x + triW / 2} ${y - triH} Z`, { fill: color, stroke: 'none' })
  }
  const labelY = direction === 'up' ? y + triH + 14 : y - triH - 8
  return group([
    tri,
    text(x, labelY, label, { fill: color, fontSize: 13, fontWeight: '700' }),
  ].join('\n'), { id: opts.id, className: opts.className })
}

/** Grid cell for 2D DP */
export function gridCell(row: number, col: number, value: string, opts: {
  cellSize?: number; offsetX?: number; offsetY?: number
  fill?: string; id?: string; className?: string
} = {}): string {
  const s = opts.cellSize ?? 50
  const ox = opts.offsetX ?? 0
  const oy = opts.offsetY ?? 0
  const x = ox + col * s
  const y = oy + row * s
  return arrayCell(x, y, value, { width: s, height: s, fill: opts.fill, id: opts.id, className: opts.className })
}

/** Stack element (horizontal bar) */
export function stackElement(x: number, y: number, value: string, opts: {
  width?: number; height?: number; fill?: string; id?: string; className?: string
} = {}): string {
  return arrayCell(x, y, value, { width: opts.width ?? 70, height: opts.height ?? 36, fill: opts.fill, id: opts.id, className: opts.className })
}
