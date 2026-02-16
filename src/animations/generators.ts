/**
 * 20 pattern animation generators.
 * Each function returns a complete animated SVG string.
 */

import {
  COLORS, svgDocument, rect, circle, text, line, path, group,
  animate, arrayCell, treeNode, treeEdge, graphNode, graphEdge,
  pointer, gridCell, stackElement,
} from './svg-utils.js'

// ─── 1. Two Pointers ────────────────────────────────────────────

export function generateTwoPointers(): string {
  const values = [1, 3, 5, 7, 9, 11, 13, 15]
  const cellW = 60
  const gap = 8
  const startX = (800 - values.length * (cellW + gap) + gap) / 2
  const cellY = 140

  const dur = '6s'
  const steps = 4 // pointers take 4 steps to meet

  // Build keyTimes: stay at each position for a bit
  const keyTimes: number[] = []
  const leftXVals: number[] = []
  const rightXVals: number[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / (steps + 1)
    keyTimes.push(t)
    leftXVals.push(startX + i * (cellW + gap) + cellW / 2)
    rightXVals.push(startX + (values.length - 1 - i) * (cellW + gap) + cellW / 2)
  }
  // Hold at meeting point, then reset
  keyTimes.push(1)
  leftXVals.push(leftXVals[0])
  rightXVals.push(rightXVals[0])

  const cells = values.map((v, i) =>
    arrayCell(startX + i * (cellW + gap), cellY, String(v))
  ).join('\n')

  const lx = leftXVals[0]
  const rx = rightXVals[0]

  const leftPointer = group([
    path(`M 0 0 L -7 14 L 7 14 Z`, { fill: COLORS.secondary, stroke: 'none' }),
    text(0, 26, 'L', { fill: COLORS.secondary, fontSize: 13, fontWeight: '700' }),
    `<animateTransform attributeName="transform" type="translate"
      values="${leftXVals.map(x => `${x} ${cellY + 60}`).join(';')}"
      keyTimes="${keyTimes.join(';')}"
      dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>`,
  ].join('\n'))

  const rightPointer = group([
    path(`M 0 0 L -7 14 L 7 14 Z`, { fill: COLORS.primary, stroke: 'none' }),
    text(0, 26, 'R', { fill: COLORS.primary, fontSize: 13, fontWeight: '700' }),
    `<animateTransform attributeName="transform" type="translate"
      values="${rightXVals.map(x => `${x} ${cellY + 60}`).join(';')}"
      keyTimes="${keyTimes.join(';')}"
      dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>`,
  ].join('\n'))

  // Highlight current pair
  const styles = `
    .tp-title { font-size: 20px; font-weight: 700; }
    .tp-subtitle { font-size: 13px; fill: ${COLORS.textSecondary}; }
  `

  const content = [
    text(400, 40, 'Two Pointers', { fontSize: 20, fontWeight: '700', className: 'tp-title' }),
    text(400, 65, 'Move L and R pointers toward each other', { fontSize: 13, fill: COLORS.textSecondary }),
    // Index labels
    ...values.map((_, i) =>
      text(startX + i * (cellW + gap) + cellW / 2, cellY - 12, String(i), { fontSize: 11, fill: COLORS.textSecondary })
    ),
    cells,
    leftPointer,
    rightPointer,
    // Target label
    text(400, 340, 'Target: find pair summing to 16', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 2. Fast & Slow Pointers ────────────────────────────────────

export function generateFastSlowPointers(): string {
  // 6 nodes in a circle with a tail entering
  const cx = 400, cy = 200, radius = 110
  const nodeCount = 6
  const nodeR = 20

  // Node positions on a circle
  const nodes: { x: number; y: number; v: number }[] = []
  for (let i = 0; i < nodeCount; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / nodeCount
    nodes.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      v: i + 1,
    })
  }

  // Edges: each node points to next, forming a cycle
  const edges = nodes.map((n, i) => {
    const next = nodes[(i + 1) % nodeCount]
    return graphEdge(n.x, n.y, next.x, next.y, { directed: true, stroke: COLORS.border })
  }).join('\n')

  const nodeEls = nodes.map(n =>
    graphNode(n.x, n.y, String(n.v), { fill: COLORS.cellBg, stroke: COLORS.border })
  ).join('\n')

  // Slow pointer: moves 1 step at a time (0,1,2,3,4,5,0,1...)
  // Fast pointer: moves 2 steps at a time (0,2,4,0,2,4...)
  // They meet after 6 beats at position 0
  const beats = 7
  const dur = '7s'
  const slowPositions: number[] = []
  const fastPositions: number[] = []
  for (let i = 0; i <= beats; i++) {
    slowPositions.push(i % nodeCount)
    fastPositions.push((i * 2) % nodeCount)
  }

  const keyTimes = Array.from({ length: beats + 1 }, (_, i) => (i / beats).toFixed(3)).join(';')

  const slowCircle = `<circle r="26" fill="none" stroke="${COLORS.secondary}" stroke-width="3" opacity="0.8">
    <animateTransform attributeName="transform" type="translate"
      values="${slowPositions.map(i => `${nodes[i].x} ${nodes[i].y}`).join(';')}"
      keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
  </circle>`

  const fastCircle = `<circle r="30" fill="none" stroke="${COLORS.primary}" stroke-width="3" stroke-dasharray="6 4" opacity="0.8">
    <animateTransform attributeName="transform" type="translate"
      values="${fastPositions.map(i => `${nodes[i].x} ${nodes[i].y}`).join(';')}"
      keyTimes="${keyTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
  </circle>`

  const content = [
    text(400, 35, 'Fast & Slow Pointers', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Slow moves 1 step, Fast moves 2 steps — they meet in a cycle', { fontSize: 13, fill: COLORS.textSecondary }),
    edges,
    nodeEls,
    slowCircle,
    fastCircle,
    // Legend
    circle(280, 370, 6, { fill: COLORS.secondary }),
    text(298, 370, 'Slow (1x)', { fontSize: 12, fill: COLORS.textSecondary, anchor: 'start' }),
    circle(430, 370, 6, { fill: COLORS.primary }),
    text(448, 370, 'Fast (2x)', { fontSize: 12, fill: COLORS.textSecondary, anchor: 'start' }),
  ].join('\n')

  return svgDocument(content)
}

// ─── 3. Sliding Window ──────────────────────────────────────────

export function generateSlidingWindow(): string {
  const values = [2, 1, 5, 1, 3, 2, 8, 1, 3, 2]
  const cellW = 55
  const gap = 4
  const startX = (800 - values.length * (cellW + gap) + gap) / 2
  const cellY = 150
  const windowSize = 3

  const cells = values.map((v, i) =>
    arrayCell(startX + i * (cellW + gap), cellY, String(v), { width: cellW })
  ).join('\n')

  // Window slides from position 0 to position 7 (10-3)
  const positions = values.length - windowSize + 1
  const dur = '8s'

  // Window rect animates its x position
  const windowXValues = Array.from({ length: positions + 1 }, (_, i) => {
    const idx = Math.min(i, positions - 1)
    return startX + idx * (cellW + gap) - 3
  })
  // Hold at start, then move, then reset
  const kTimes = Array.from({ length: positions + 1 }, (_, i) => (i / positions).toFixed(3)).join(';')
  const windowW = windowSize * (cellW + gap) - gap + 6

  // Compute sums for each window position
  const sums = Array.from({ length: positions }, (_, i) =>
    values.slice(i, i + windowSize).reduce((a, b) => a + b, 0)
  )

  const windowRect = `<rect x="${windowXValues[0]}" y="${cellY - 4}" width="${windowW}" height="58"
    fill="${COLORS.primary}" opacity="0.15" rx="8" stroke="${COLORS.primary}" stroke-width="2">
    <animate attributeName="x" values="${windowXValues.join(';')}"
      keyTimes="${kTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
  </rect>`

  // Sum label follows the window
  const sumXValues = windowXValues.map(x => x + windowW / 2)
  const sumLabel = `<text x="${sumXValues[0]}" y="${cellY - 20}" text-anchor="middle"
    font-size="15" font-weight="700" fill="${COLORS.primary}"
    font-family="system-ui, -apple-system, sans-serif">
    <animate attributeName="x" values="${sumXValues.join(';')}"
      keyTimes="${kTimes}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>
    ${animate({ attributeName: 'textContent', values: [...sums, sums[0]].map(s => `Sum: ${s}`).join(';'), dur, keyTimes: kTimes, calcMode: 'discrete' })}
    Sum: ${sums[0]}
  </text>`

  const content = [
    text(400, 40, 'Sliding Window', { fontSize: 20, fontWeight: '700' }),
    text(400, 65, `Window of size ${windowSize} slides across the array`, { fontSize: 13, fill: COLORS.textSecondary }),
    // Index labels
    ...values.map((_, i) =>
      text(startX + i * (cellW + gap) + cellW / 2, cellY - 38, String(i), { fontSize: 11, fill: COLORS.textSecondary })
    ),
    windowRect,
    cells,
    sumLabel,
    text(400, 340, 'Find maximum sum subarray of size k', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content)
}

// ─── 4. Binary Search ───────────────────────────────────────────

export function generateBinarySearch(): string {
  const values = [2, 5, 8, 12, 16, 23, 38, 56]
  const cellW = 65
  const gap = 6
  const startX = (800 - values.length * (cellW + gap) + gap) / 2
  const cellY = 150

  const target = 23
  const dur = '6s'

  // Step 0: full range highlighted [0..7], mid=3 (12 < 23)
  // Step 1: right half [4..7], mid=5 (23 == 23) - found!
  // Step 2: hold on found, then reset

  const styles = `
    .bs-cell { transition: fill 0.3s; }
    @keyframes bsStep0 {
      0%, 15% { fill: ${COLORS.highlight}; }
      30%, 100% { fill: ${COLORS.cellBg}; }
    }
    @keyframes bsStep0Active {
      0%, 15% { fill: ${COLORS.warning}; }
      16%, 100% { fill: ${COLORS.cellBg}; }
    }
    @keyframes bsStep1 {
      30%, 55% { fill: ${COLORS.highlight}; }
      60%, 100% { fill: ${COLORS.cellBg}; }
    }
    @keyframes bsFound {
      55%, 85% { fill: ${COLORS.secondary}; }
      86%, 100% { fill: ${COLORS.cellBg}; }
    }
    @keyframes bsFade {
      0%, 15% { opacity: 1; }
      16%, 100% { opacity: 0.3; }
    }
    .bs-0 { animation: bsStep0 ${dur} infinite; }
    .bs-0-mid { animation: bsStep0Active ${dur} infinite; }
    .bs-1 { animation: bsStep1 ${dur} infinite; }
    .bs-found { animation: bsFound ${dur} infinite; }
    .bs-fade { animation: bsFade ${dur} infinite; }
  `

  // Cells with animation classes
  const cells = values.map((v, i) => {
    let cls = ''
    if (i <= 3) cls = i === 3 ? 'bs-0-mid' : 'bs-0'
    if (i >= 4) cls = i === 5 ? '' : 'bs-1'
    if (i === 5) cls = 'bs-found'
    if (i < 4) cls += ' bs-fade'
    return arrayCell(startX + i * (cellW + gap), cellY, String(v), { width: cellW, className: cls.trim() })
  }).join('\n')

  // Mid pointer
  const midX0 = startX + 3 * (cellW + gap) + cellW / 2
  const midX1 = startX + 5 * (cellW + gap) + cellW / 2

  const content = [
    text(400, 40, 'Binary Search', { fontSize: 20, fontWeight: '700' }),
    text(400, 65, `Target: ${target} — halve the search space each step`, { fontSize: 13, fill: COLORS.textSecondary }),
    // Index labels
    ...values.map((_, i) =>
      text(startX + i * (cellW + gap) + cellW / 2, cellY - 12, String(i), { fontSize: 11, fill: COLORS.textSecondary })
    ),
    cells,
    // "mid" pointer
    group([
      pointer(0, 0, 'mid', 'up', { color: COLORS.warning }),
      `<animateTransform attributeName="transform" type="translate"
        values="${midX0} ${cellY + 58};${midX0} ${cellY + 58};${midX1} ${cellY + 58};${midX1} ${cellY + 58}"
        keyTimes="0;0.28;0.30;1" dur="${dur}" repeatCount="indefinite" calcMode="discrete"/>`,
    ].join('\n')),
    // Comparison text
    `<text x="400" y="320" text-anchor="middle" font-size="15" fill="${COLORS.text}"
      font-family="system-ui, -apple-system, sans-serif" font-weight="600">
      ${animate({ attributeName: 'textContent', values: '12 < 23 → go right;12 < 23 → go right;23 = 23 → found!;23 = 23 → found!', dur, keyTimes: '0;0.15;0.30;1', calcMode: 'discrete' })}
      12 &lt; 23 → go right
    </text>`,
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 5. Cyclic Sort ─────────────────────────────────────────────

export function generateCyclicSort(): string {
  const cellW = 70
  const gap = 16
  const n = 4
  const startX = (800 - n * (cellW + gap) + gap) / 2
  const cellY = 160

  const dur = '8s'

  // State transitions: [3,1,4,2] → [4,1,3,2] → [2,1,3,4] → [1,2,3,4]
  const states = [
    [3, 1, 4, 2],
    [4, 1, 3, 2],
    [2, 1, 3, 4],
    [1, 2, 3, 4],
  ]

  const styles = `
    @keyframes csSwap {
      0%, 24% { opacity: 1; }
      25%, 49% { opacity: 1; }
      50%, 74% { opacity: 1; }
      75%, 100% { opacity: 1; }
    }
    ${states.map((state, si) => state.map((v, i) => `
      .cs-${si}-${i} {
        animation: csShow${si} ${dur} infinite;
      }
      @keyframes csShow${si} {
        ${si > 0 ? `0%, ${(si * 25) - 1}% { opacity: 0; }` : ''}
        ${si * 25}%, ${si < states.length - 1 ? `${(si + 1) * 25 - 1}%` : '100%'} { opacity: 1; }
        ${si < states.length - 1 ? `${(si + 1) * 25}%, 100% { opacity: 0; }` : ''}
      }
    `).join('')).join('')}
  `

  // Draw each state as a layer
  const layers = states.map((state, si) => {
    const cells = state.map((v, i) => {
      const isCorrect = v === i + 1
      return arrayCell(
        startX + i * (cellW + gap), cellY, String(v),
        { width: cellW, fill: isCorrect ? COLORS.secondary : COLORS.cellBg, className: `cs-${si}-${i}`, textFill: isCorrect ? '#fff' : COLORS.text }
      )
    }).join('\n')
    return group(cells, { className: `cs-layer-${si}` })
  }).join('\n')

  // Simplified: just show states changing with labels
  const stepLabels = [
    'arr[0]=3, swap with arr[2]',
    'arr[0]=4, swap with arr[3]',
    'arr[0]=2, swap with arr[1]',
    'Sorted!',
  ]

  const content = [
    text(400, 40, 'Cyclic Sort', { fontSize: 20, fontWeight: '700' }),
    text(400, 65, 'Place each number at its correct index', { fontSize: 13, fill: COLORS.textSecondary }),
    // Index labels
    ...Array.from({ length: n }, (_, i) =>
      text(startX + i * (cellW + gap) + cellW / 2, cellY - 15, `idx ${i}`, { fontSize: 11, fill: COLORS.textSecondary })
    ),
    layers,
    // Step label
    `<text x="400" y="310" text-anchor="middle" font-size="14" fill="${COLORS.primary}"
      font-family="system-ui, -apple-system, sans-serif" font-weight="600">
      ${animate({ attributeName: 'textContent', values: stepLabels.join(';'), dur, keyTimes: '0;0.25;0.50;0.75', calcMode: 'discrete' })}
      ${stepLabels[0]}
    </text>`,
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 6. Linked List Reversal ────────────────────────────────────

export function generateLinkedListReversal(): string {
  const n = 5
  const nodeR = 22
  const spacing = 120
  const startX = (800 - (n - 1) * spacing) / 2
  const nodeY = 180
  const dur = '8s'

  // Nodes
  const nodeEls = Array.from({ length: n }, (_, i) =>
    treeNode(startX + i * spacing, nodeY, String(i + 1), { stroke: COLORS.primary })
  ).join('\n')

  // Forward arrows: fade out one by one
  // Reverse arrows: fade in one by one
  const stepDur = 100 / (n + 1) // percentage per step

  const styles = Array.from({ length: n - 1 }, (_, i) => {
    const fadeOutStart = (i + 1) * stepDur
    const fadeInStart = (i + 1) * stepDur
    return `
      .fwd-${i} {
        animation: fadeOut${i} ${dur} infinite;
      }
      @keyframes fadeOut${i} {
        0%, ${fadeOutStart.toFixed(1)}% { opacity: 1; }
        ${(fadeOutStart + stepDur / 2).toFixed(1)}%, 100% { opacity: 0.15; }
      }
      .rev-${i} {
        animation: fadeIn${i} ${dur} infinite;
      }
      @keyframes fadeIn${i} {
        0%, ${fadeInStart.toFixed(1)}% { opacity: 0; }
        ${(fadeInStart + stepDur / 2).toFixed(1)}%, ${(100 - stepDur).toFixed(1)}% { opacity: 1; }
        100% { opacity: 0; }
      }
    `
  }).join('')

  const forwardArrows = Array.from({ length: n - 1 }, (_, i) => {
    const x1 = startX + i * spacing + nodeR + 4
    const x2 = startX + (i + 1) * spacing - nodeR - 4
    return line(x1, nodeY, x2, nodeY, { stroke: COLORS.text, markerEnd: 'arrow', className: `fwd-${i}` })
  }).join('\n')

  const reverseArrows = Array.from({ length: n - 1 }, (_, i) => {
    const x1 = startX + (i + 1) * spacing - nodeR - 4
    const x2 = startX + i * spacing + nodeR + 4
    return line(x1, nodeY, x2, nodeY, { stroke: COLORS.secondary, markerEnd: 'arrow-green', className: `rev-${i}` })
  }).join('\n')

  const content = [
    text(400, 40, 'In-place Linked List Reversal', { fontSize: 20, fontWeight: '700' }),
    text(400, 65, 'Reverse arrow direction one link at a time', { fontSize: 13, fill: COLORS.textSecondary }),
    forwardArrows,
    reverseArrows,
    nodeEls,
    // Before/after labels
    text(400, 310, '1 → 2 → 3 → 4 → 5  becomes  5 → 4 → 3 → 2 → 1', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 7. Tree DFS ────────────────────────────────────────────────

export function generateTreeDFS(): string {
  // Binary tree: 7 nodes, 3 levels
  const nodes = [
    { x: 400, y: 100, v: '1' },  // root
    { x: 250, y: 190, v: '2' },  // left
    { x: 550, y: 190, v: '3' },  // right
    { x: 175, y: 280, v: '4' },  // left-left
    { x: 325, y: 280, v: '5' },  // left-right
    { x: 475, y: 280, v: '6' },  // right-left
    { x: 625, y: 280, v: '7' },  // right-right
  ]
  const edges = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6],
  ]

  // Pre-order DFS: 1, 2, 4, 5, 3, 6, 7
  const visitOrder = [0, 1, 3, 4, 2, 5, 6]
  const dur = '7s'
  const stepPct = 100 / (visitOrder.length + 2) // +2 for pause at end

  const styles = visitOrder.map((nodeIdx, step) => {
    const start = (step + 1) * stepPct
    return `
      .dfs-node-${nodeIdx} {
        animation: dfsVisit${nodeIdx} ${dur} infinite;
      }
      @keyframes dfsVisit${nodeIdx} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
        ${(start + stepPct * 0.5).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${COLORS.secondary}; stroke: ${COLORS.secondary}; }
        100% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
      }
    `
  }).join('')

  const edgeEls = edges.map(([a, b]) =>
    treeEdge(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y)
  ).join('\n')

  const nodeEls = nodes.map((n, i) => {
    const r = 22
    return group([
      circle(n.x, n.y, r, { fill: COLORS.cellBg, stroke: COLORS.border, strokeWidth: 2, className: `dfs-node-${i}` }),
      text(n.x, n.y, n.v, { fontSize: 14, fontWeight: '600' }),
    ].join('\n'))
  }).join('\n')

  // Visit order badges
  const badges = visitOrder.map((nodeIdx, step) => {
    const n = nodes[nodeIdx]
    const start = (step + 1) * stepPct
    return `<text x="${n.x + 28}" y="${n.y - 18}" font-size="11" fill="${COLORS.secondary}"
      font-weight="700" font-family="system-ui, -apple-system, sans-serif" opacity="0">
      ${animate({ attributeName: 'opacity', values: `0;0;1;1;0`, dur, keyTimes: `0;${(start / 100).toFixed(3)};${((start + 1) / 100).toFixed(3)};${((100 - stepPct) / 100).toFixed(3)};1`, calcMode: 'discrete' })}
      #${step + 1}
    </text>`
  }).join('\n')

  const content = [
    text(400, 35, 'Tree DFS (Pre-order)', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Visit: root → left subtree → right subtree', { fontSize: 13, fill: COLORS.textSecondary }),
    edgeEls,
    nodeEls,
    badges,
    text(400, 370, 'Visit order: 1 → 2 → 4 → 5 → 3 → 6 → 7', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 8. Tree BFS ────────────────────────────────────────────────

export function generateTreeBFS(): string {
  const nodes = [
    { x: 400, y: 100, v: '1', level: 0 },
    { x: 250, y: 190, v: '2', level: 1 },
    { x: 550, y: 190, v: '3', level: 1 },
    { x: 175, y: 280, v: '4', level: 2 },
    { x: 325, y: 280, v: '5', level: 2 },
    { x: 475, y: 280, v: '6', level: 2 },
    { x: 625, y: 280, v: '7', level: 2 },
  ]
  const edges = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6],
  ]
  const levels = 3
  const dur = '6s'
  const stepPct = 100 / (levels + 2)

  const levelColors = [COLORS.primary, '#6366f1', '#8b5cf6']

  const styles = Array.from({ length: levels }, (_, level) => {
    const start = (level + 1) * stepPct
    return `
      .bfs-level-${level} {
        animation: bfsLevel${level} ${dur} infinite;
      }
      @keyframes bfsLevel${level} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
        ${(start + stepPct * 0.4).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${levelColors[level]}; stroke: ${levelColors[level]}; }
        100% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
      }
    `
  }).join('')

  const edgeEls = edges.map(([a, b]) =>
    treeEdge(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y)
  ).join('\n')

  const nodeEls = nodes.map((n, i) =>
    group([
      circle(n.x, n.y, 22, { fill: COLORS.cellBg, stroke: COLORS.border, strokeWidth: 2, className: `bfs-level-${n.level}` }),
      text(n.x, n.y, n.v, { fontSize: 14, fontWeight: '600', fill: '#fff' }),
    ].join('\n'))
  ).join('\n')

  // Level wave line
  const waveY = [100, 190, 280]
  const waveYValues = ['75', '75', ...waveY.map(y => String(y - 30)), '75'].join(';')
  const waveLine = `<line x1="100" y1="75" x2="700" y2="75" stroke="${COLORS.primary}" stroke-width="2" stroke-dasharray="8 4" opacity="0.4">
    <animate attributeName="y1" values="${waveYValues}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"
      keyTimes="0;${(stepPct / 100).toFixed(3)};${Array.from({ length: levels }, (_, i) => ((i + 1) * stepPct / 100).toFixed(3)).join(';')};1"/>
    <animate attributeName="y2" values="${waveYValues}" dur="${dur}" repeatCount="indefinite" calcMode="discrete"
      keyTimes="0;${(stepPct / 100).toFixed(3)};${Array.from({ length: levels }, (_, i) => ((i + 1) * stepPct / 100).toFixed(3)).join(';')};1"/>
  </line>`

  const content = [
    text(400, 35, 'Tree BFS (Level-order)', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Visit all nodes at each level before going deeper', { fontSize: 13, fill: COLORS.textSecondary }),
    edgeEls,
    nodeEls,
    text(400, 370, 'Level 0: [1] → Level 1: [2, 3] → Level 2: [4, 5, 6, 7]', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 9. Graph DFS ───────────────────────────────────────────────

export function generateGraphDFS(): string {
  const nodes = [
    { x: 130, y: 120, label: 'A' },
    { x: 300, y: 100, label: 'B' },
    { x: 470, y: 120, label: 'C' },
    { x: 180, y: 280, label: 'D' },
    { x: 400, y: 260, label: 'E' },
    { x: 570, y: 280, label: 'F' },
  ]
  const edges = [
    [0, 1], [0, 3], [1, 2], [1, 4], [2, 5], [3, 4], [4, 5],
  ]

  // DFS from A: A→B→C→F→(back)→E→D
  const visitOrder = [0, 1, 2, 5, 4, 3]
  const dur = '8s'
  const stepPct = 100 / (visitOrder.length + 2)

  const styles = visitOrder.map((nodeIdx, step) => {
    const start = (step + 1) * stepPct
    return `
      .gdfs-${nodeIdx} {
        animation: gdfsVisit${nodeIdx} ${dur} infinite;
      }
      @keyframes gdfsVisit${nodeIdx} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
        ${(start + stepPct * 0.4).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${COLORS.secondary}; }
        100% { fill: ${COLORS.cellBg}; }
      }
    `
  }).join('')

  const edgeEls = edges.map(([a, b]) =>
    graphEdge(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y, { directed: false, stroke: COLORS.border })
  ).join('\n')

  const nodeEls = nodes.map((n, i) =>
    group([
      circle(n.x, n.y, 24, { fill: COLORS.cellBg, stroke: COLORS.primary, strokeWidth: 2, className: `gdfs-${i}` }),
      text(n.x, n.y, n.label, { fontSize: 14, fontWeight: '700' }),
    ].join('\n'))
  ).join('\n')

  const content = [
    text(400, 35, 'Graph DFS', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Explore as deep as possible, then backtrack', { fontSize: 13, fill: COLORS.textSecondary }),
    edgeEls,
    nodeEls,
    text(400, 370, 'DFS from A: A → B → C → F → E → D', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 10. Graph BFS ──────────────────────────────────────────────

export function generateGraphBFS(): string {
  const nodes = [
    { x: 130, y: 120, label: 'A', dist: 0 },
    { x: 300, y: 100, label: 'B', dist: 1 },
    { x: 470, y: 120, label: 'C', dist: 2 },
    { x: 180, y: 280, label: 'D', dist: 1 },
    { x: 400, y: 260, label: 'E', dist: 2 },
    { x: 570, y: 280, label: 'F', dist: 3 },
  ]
  const edges = [
    [0, 1], [0, 3], [1, 2], [1, 4], [2, 5], [3, 4], [4, 5],
  ]

  const maxDist = 3
  const dur = '7s'
  const stepPct = 100 / (maxDist + 3)

  const distColors = [COLORS.primary, '#6366f1', '#8b5cf6', '#a855f7']

  const styles = Array.from({ length: maxDist + 1 }, (_, d) => {
    const start = (d + 1) * stepPct
    return `
      .gbfs-d${d} {
        animation: gbfsDist${d} ${dur} infinite;
      }
      @keyframes gbfsDist${d} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
        ${(start + stepPct * 0.4).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${distColors[d]}; }
        100% { fill: ${COLORS.cellBg}; }
      }
    `
  }).join('')

  const edgeEls = edges.map(([a, b]) =>
    graphEdge(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y, { directed: false, stroke: COLORS.border })
  ).join('\n')

  const nodeEls = nodes.map((n, i) =>
    group([
      circle(n.x, n.y, 24, { fill: COLORS.cellBg, stroke: COLORS.primary, strokeWidth: 2, className: `gbfs-d${n.dist}` }),
      text(n.x, n.y, n.label, { fontSize: 14, fontWeight: '700' }),
    ].join('\n'))
  ).join('\n')

  const content = [
    text(400, 35, 'Graph BFS', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Explore all neighbors at current distance before going further', { fontSize: 13, fill: COLORS.textSecondary }),
    edgeEls,
    nodeEls,
    // Distance legend
    ...distColors.map((c, d) =>
      group([
        circle(200 + d * 120, 370, 6, { fill: c }),
        text(216 + d * 120, 370, `dist=${d}`, { fontSize: 11, fill: COLORS.textSecondary, anchor: 'start' }),
      ].join('\n'))
    ),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 11. Union Find ─────────────────────────────────────────────

export function generateUnionFind(): string {
  // Two sets that merge
  const setA = [
    { x: 180, y: 180, label: '1' },
    { x: 120, y: 260, label: '2' },
    { x: 240, y: 260, label: '3' },
  ]
  const setB = [
    { x: 560, y: 180, label: '4' },
    { x: 500, y: 260, label: '5' },
    { x: 620, y: 260, label: '6' },
  ]

  const dur = '7s'

  const styles = `
    .uf-set-a {
      animation: ufSetA ${dur} infinite;
    }
    @keyframes ufSetA {
      0%, 35% { cx: attr(cx); }
      50%, 80% { transform: translateX(100px); }
      90%, 100% { transform: translateX(0); }
    }
    .uf-set-b {
      animation: ufSetB ${dur} infinite;
    }
    @keyframes ufSetB {
      0%, 35% { cx: attr(cx); }
      50%, 80% { transform: translateX(-100px); }
      90%, 100% { transform: translateX(0); }
    }
    .uf-circle-a {
      animation: ufCircleA ${dur} infinite;
    }
    @keyframes ufCircleA {
      0%, 35% { stroke-dashoffset: 0; }
      40%, 80% { r: 90; }
      90%, 100% { stroke-dashoffset: 0; }
    }
    .uf-bridge {
      animation: ufBridge ${dur} infinite;
    }
    @keyframes ufBridge {
      0%, 30% { opacity: 0; stroke-dashoffset: 200; }
      35%, 80% { opacity: 1; stroke-dashoffset: 0; }
      90%, 100% { opacity: 0; stroke-dashoffset: 200; }
    }
  `

  // Set circles (dashed outlines)
  const circleA = `<ellipse cx="180" cy="220" rx="100" ry="70" fill="none" stroke="${COLORS.secondary}" stroke-width="2" stroke-dasharray="8 4" opacity="0.5"/>`
  const circleB = `<ellipse cx="560" cy="220" rx="100" ry="70" fill="none" stroke="${COLORS.primary}" stroke-width="2" stroke-dasharray="8 4" opacity="0.5"/>`

  // Merged circle
  const mergedCircle = `<ellipse cx="370" cy="220" rx="280" ry="85" fill="none" stroke="${COLORS.visited}" stroke-width="3" stroke-dasharray="8 4" opacity="0">
    ${animate({ attributeName: 'opacity', values: '0;0;0.6;0.6;0', dur, keyTimes: '0;0.35;0.40;0.85;1', calcMode: 'discrete' })}
  </ellipse>`

  // Bridge edge (3 → 4)
  const bridge = `<line x1="262" y1="260" x2="478" y2="260" stroke="${COLORS.warning}" stroke-width="3" opacity="0">
    ${animate({ attributeName: 'opacity', values: '0;0;1;1;0', dur, keyTimes: '0;0.30;0.35;0.85;1', calcMode: 'discrete' })}
  </line>`

  const allNodes = [...setA, ...setB]
  const nodeEls = allNodes.map(n =>
    graphNode(n.x, n.y, n.label, { fill: COLORS.cellBg, stroke: setA.includes(n) ? COLORS.secondary : COLORS.primary })
  ).join('\n')

  // Tree edges within sets
  const edgesA = [
    line(180, 202, 120, 238, { stroke: COLORS.secondary, strokeWidth: 2 }),
    line(180, 202, 240, 238, { stroke: COLORS.secondary, strokeWidth: 2 }),
  ].join('\n')
  const edgesB = [
    line(560, 202, 500, 238, { stroke: COLORS.primary, strokeWidth: 2 }),
    line(560, 202, 620, 238, { stroke: COLORS.primary, strokeWidth: 2 }),
  ].join('\n')

  const content = [
    text(400, 35, 'Union Find', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Merge disjoint sets when an edge connects them', { fontSize: 13, fill: COLORS.textSecondary }),
    circleA, circleB,
    mergedCircle,
    edgesA, edgesB,
    bridge,
    nodeEls,
    // Step labels
    `<text x="400" y="360" text-anchor="middle" font-size="14" fill="${COLORS.textSecondary}"
      font-family="system-ui, -apple-system, sans-serif">
      ${animate({ attributeName: 'textContent', values: 'Two separate sets: {1,2,3} and {4,5,6};Two separate sets: {1,2,3} and {4,5,6};Union(3, 4) → merge into one set;Union(3, 4) → merge into one set;Two separate sets: {1,2,3} and {4,5,6}', dur, keyTimes: '0;0.30;0.35;0.85;1', calcMode: 'discrete' })}
      Two separate sets: {1,2,3} and {4,5,6}
    </text>`,
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 12. Topological Sort ───────────────────────────────────────

export function generateTopologicalSort(): string {
  // DAG: A→B, A→C, B→D, C→D, C→E, D→E
  const nodes = [
    { x: 160, y: 120, label: 'A' },
    { x: 340, y: 100, label: 'B' },
    { x: 340, y: 220, label: 'C' },
    { x: 520, y: 160, label: 'D' },
    { x: 660, y: 160, label: 'E' },
  ]
  const edges = [
    [0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 4],
  ]

  // Topological order: A, B, C, D, E (one valid ordering)
  const order = [0, 1, 2, 3, 4]
  const dur = '8s'
  const stepPct = 100 / (order.length + 2)

  const styles = order.map((nodeIdx, step) => {
    const start = (step + 1) * stepPct
    return `
      .topo-${nodeIdx} {
        animation: topoVisit${nodeIdx} ${dur} infinite;
      }
      @keyframes topoVisit${nodeIdx} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
        ${(start + stepPct * 0.4).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${COLORS.primary}; }
        100% { fill: ${COLORS.cellBg}; }
      }
    `
  }).join('')

  const edgeEls = edges.map(([a, b]) =>
    graphEdge(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y, { directed: true, stroke: COLORS.border })
  ).join('\n')

  const nodeEls = nodes.map((n, i) =>
    group([
      circle(n.x, n.y, 24, { fill: COLORS.cellBg, stroke: COLORS.primary, strokeWidth: 2, className: `topo-${i}` }),
      text(n.x, n.y, n.label, { fontSize: 14, fontWeight: '700' }),
    ].join('\n'))
  ).join('\n')

  // Result queue building at the bottom
  const queueY = 330
  const queueStartX = 240
  const queueCellW = 55
  const queueCells = order.map((nodeIdx, step) => {
    const start = (step + 1) * stepPct
    return `<g opacity="0">
      ${animate({ attributeName: 'opacity', values: '0;0;1;1;0', dur, keyTimes: `0;${(start / 100).toFixed(3)};${((start + 1) / 100).toFixed(3)};${((100 - stepPct) / 100).toFixed(3)};1`, calcMode: 'discrete' })}
      ${arrayCell(queueStartX + step * (queueCellW + 6), queueY - 20, nodes[nodeIdx].label, { width: queueCellW, height: 40, fill: COLORS.highlight })}
    </g>`
  }).join('\n')

  const content = [
    text(400, 35, 'Topological Sort', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Process nodes with no remaining dependencies first', { fontSize: 13, fill: COLORS.textSecondary }),
    edgeEls,
    nodeEls,
    text(240, queueY - 32, 'Result:', { fontSize: 12, fill: COLORS.textSecondary, anchor: 'end' }),
    queueCells,
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 13. Backtracking ───────────────────────────────────────────

export function generateBacktracking(): string {
  // Decision tree for generating subsets of {1, 2}
  // Root: []
  // Level 1: include 1 → [1], skip 1 → []
  // Level 2 under [1]: include 2 → [1,2], skip 2 → [1]
  // Level 2 under []: include 2 → [2], skip 2 → []
  const nodes = [
    { x: 400, y: 80, label: '{ }', result: false },
    { x: 250, y: 170, label: '+1', result: false },
    { x: 550, y: 170, label: 'skip', result: false },
    { x: 170, y: 270, label: '{1,2}', result: true },
    { x: 330, y: 270, label: '{1}', result: true },
    { x: 470, y: 270, label: '{2}', result: true },
    { x: 630, y: 270, label: '{ }', result: true },
  ]
  const edges = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6],
  ]

  // Exploration order (DFS): 0, 1, 3(result), back, 4(result), back, 2, 5(result), back, 6(result)
  const steps = [0, 1, 3, 4, 2, 5, 6]
  const dur = '8s'
  const stepPct = 100 / (steps.length + 2)

  const styles = steps.map((nodeIdx, step) => {
    const start = (step + 1) * stepPct
    const isResult = nodes[nodeIdx].result
    const color = isResult ? COLORS.secondary : COLORS.warning
    return `
      .bt-${nodeIdx} {
        animation: btVisit${nodeIdx} ${dur} infinite;
      }
      @keyframes btVisit${nodeIdx} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
        ${(start + stepPct * 0.3).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${isResult ? '#d1fae5' : COLORS.highlight}; stroke: ${color}; }
        100% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
      }
    `
  }).join('')

  const edgeEls = edges.map(([a, b]) =>
    treeEdge(nodes[a].x, nodes[a].y + 16, nodes[b].x, nodes[b].y - 16, { stroke: COLORS.border })
  ).join('\n')

  const nodeEls = nodes.map((n, i) =>
    group([
      rect(n.x - 32, n.y - 16, 64, 32, { fill: COLORS.cellBg, stroke: COLORS.border, rx: 8, className: `bt-${i}` }),
      text(n.x, n.y, n.label, { fontSize: 12, fontWeight: '600' }),
    ].join('\n'))
  ).join('\n')

  const content = [
    text(400, 30, 'Backtracking', { fontSize: 20, fontWeight: '700' }),
    text(400, 52, 'Explore all branches, collect valid results (subsets of {1,2})', { fontSize: 13, fill: COLORS.textSecondary }),
    edgeEls,
    nodeEls,
    text(400, 360, 'Results: {1,2}, {1}, {2}, { }', { fontSize: 14, fill: COLORS.secondary, fontWeight: '600' }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 14. Dynamic Programming 1D ─────────────────────────────────

export function generateDP1D(): string {
  // Fibonacci: dp[0..6]
  const vals = [0, 1, 1, 2, 3, 5, 8]
  const labels = vals.map((_, i) => `F(${i})`)
  const cellW = 70
  const gap = 10
  const startX = (800 - vals.length * (cellW + gap) + gap) / 2
  const cellY = 170

  const dur = '7s'
  const stepPct = 100 / (vals.length + 2)

  const styles = vals.map((_, i) => {
    const start = (i + 1) * stepPct
    return `
      .dp1-${i} {
        animation: dp1Fill${i} ${dur} infinite;
      }
      @keyframes dp1Fill${i} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
        ${(start + stepPct * 0.4).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${COLORS.primary}; }
        100% { fill: ${COLORS.cellBg}; }
      }
      .dp1-val-${i} {
        animation: dp1ValShow${i} ${dur} infinite;
      }
      @keyframes dp1ValShow${i} {
        0%, ${start.toFixed(1)}% { opacity: 0; }
        ${(start + stepPct * 0.4).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { opacity: 1; }
        100% { opacity: 0; }
      }
    `
  }).join('')

  const cellEls = vals.map((v, i) =>
    group([
      rect(startX + i * (cellW + gap), cellY, cellW, 50, {
        fill: COLORS.cellBg, stroke: COLORS.border, rx: 6, className: `dp1-${i}`,
      }),
      `<text x="${startX + i * (cellW + gap) + cellW / 2}" y="${cellY + 25}"
        text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="700"
        fill="#fff" font-family="system-ui, -apple-system, sans-serif" class="dp1-val-${i}">
        ${v}
      </text>`,
    ].join('\n'))
  ).join('\n')

  // Dependency arrows for i >= 2: dp[i-1] and dp[i-2] → dp[i]
  const arrowEls = vals.slice(2).map((_, idx) => {
    const i = idx + 2
    const start = (i + 1) * stepPct
    const targetX = startX + i * (cellW + gap) + cellW / 2
    const src1X = startX + (i - 1) * (cellW + gap) + cellW / 2
    const src2X = startX + (i - 2) * (cellW + gap) + cellW / 2
    return `<g opacity="0">
      ${animate({ attributeName: 'opacity', values: '0;0;0.6;0.6;0', dur, keyTimes: `0;${(start / 100).toFixed(3)};${((start + 1) / 100).toFixed(3)};${((start + stepPct) / 100).toFixed(3)};1`, calcMode: 'discrete' })}
      ${path(`M ${src1X} ${cellY - 5} Q ${(src1X + targetX) / 2} ${cellY - 30} ${targetX} ${cellY - 5}`, { stroke: COLORS.secondary, markerEnd: 'arrow-green', strokeWidth: 1.5 })}
      ${path(`M ${src2X} ${cellY - 5} Q ${(src2X + targetX) / 2} ${cellY - 45} ${targetX} ${cellY - 5}`, { stroke: COLORS.warning, markerEnd: 'arrow', strokeWidth: 1.5 })}
    </g>`
  }).join('\n')

  const content = [
    text(400, 40, 'Dynamic Programming — 1D', { fontSize: 20, fontWeight: '700' }),
    text(400, 65, 'Build solution from previously computed subproblems', { fontSize: 13, fill: COLORS.textSecondary }),
    // Labels
    ...vals.map((_, i) =>
      text(startX + i * (cellW + gap) + cellW / 2, cellY - 55, labels[i], { fontSize: 11, fill: COLORS.textSecondary })
    ),
    arrowEls,
    cellEls,
    text(400, 310, 'dp[i] = dp[i-1] + dp[i-2]', { fontSize: 16, fill: COLORS.primary, fontWeight: '600' }),
    text(400, 340, 'Fibonacci sequence: each value is the sum of the two before it', { fontSize: 13, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 15. Dynamic Programming 2D ─────────────────────────────────

export function generateDP2D(): string {
  // LCS grid: strings "AC" and "ABC"
  const s1 = ['', 'A', 'B', 'C']
  const s2 = ['', 'A', 'C']
  const grid = [
    [0, 0, 0, 0],
    [0, 1, 1, 1],
    [0, 1, 1, 2],
  ]

  const cellSize = 55
  const offsetX = (800 - s1.length * cellSize) / 2
  const offsetY = 120

  const dur = '8s'
  const totalCells = (s2.length) * (s1.length)
  const stepPct = 100 / (totalCells + 2)

  // Fill order: row by row, left to right (skip headers)
  let step = 0
  const cellStyles: string[] = []
  const cellElements: string[] = []

  for (let r = 0; r < s2.length; r++) {
    for (let c = 0; c < s1.length; c++) {
      const start = (step + 1) * stepPct
      const id = `dp2-${r}-${c}`
      const isBase = r === 0 || c === 0

      cellStyles.push(`
        .${id} {
          animation: ${id}Fill ${dur} infinite;
        }
        @keyframes ${id}Fill {
          0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
          ${(start + stepPct * 0.3).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${isBase ? COLORS.highlight : COLORS.primary}; }
          100% { fill: ${COLORS.cellBg}; }
        }
      `)

      cellElements.push(
        gridCell(r, c, String(grid[r][c]), {
          cellSize, offsetX, offsetY,
          fill: COLORS.cellBg, className: id,
        })
      )
      step++
    }
  }

  // Column headers (s1)
  const colHeaders = s1.map((ch, i) =>
    text(offsetX + i * cellSize + cellSize / 2, offsetY - 15, ch || '-', { fontSize: 14, fontWeight: '700', fill: COLORS.primary })
  ).join('\n')

  // Row headers (s2)
  const rowHeaders = s2.map((ch, i) =>
    text(offsetX - 20, offsetY + i * cellSize + cellSize / 2, ch || '-', { fontSize: 14, fontWeight: '700', fill: COLORS.secondary })
  ).join('\n')

  const content = [
    text(400, 35, 'Dynamic Programming — 2D', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'LCS of "AC" and "ABC" — fill grid row by row', { fontSize: 13, fill: COLORS.textSecondary }),
    colHeaders,
    rowHeaders,
    ...cellElements,
    text(400, offsetY + s2.length * cellSize + 40, 'dp[i][j] = dp[i-1][j-1]+1 if match, else max(dp[i-1][j], dp[i][j-1])', { fontSize: 12, fill: COLORS.primary }),
    text(400, offsetY + s2.length * cellSize + 65, 'LCS length = 2 ("AC")', { fontSize: 14, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, cellStyles.join(''))
}

// ─── 16. Greedy ─────────────────────────────────────────────────

export function generateGreedy(): string {
  // Interval scheduling: select max non-overlapping intervals
  // Sorted by end time
  const intervals = [
    { start: 0, end: 3, label: 'A' },
    { start: 2, end: 5, label: 'B' },
    { start: 4, end: 7, label: 'C' },
    { start: 6, end: 9, label: 'D' },
    { start: 5, end: 8, label: 'E' },
    { start: 8, end: 11, label: 'F' },
  ]

  const timelineX = 100
  const timelineW = 600
  const timelineY = 300
  const maxTime = 12
  const barH = 28
  const barGap = 8
  const barsStartY = 100

  const scale = (t: number) => timelineX + (t / maxTime) * timelineW

  const dur = '8s'
  // Decision order: A(select), B(skip-overlaps), C(select), E(skip), D(skip), F(select)
  // Let's simplify: sorted by end → A(0-3), B(2-5), C(4-7), E(5-8), D(6-9), F(8-11)
  // Select A. Skip B (overlaps A? end 3 ≤ start 2? no, 3 > 2 → skip). Select C (start 4 ≥ end 3). Skip E (5 < 7). Skip D (6 < 7). Select F (8 ≥ 7).
  const decisions = [
    { idx: 0, selected: true },
    { idx: 1, selected: false },
    { idx: 2, selected: true },
    { idx: 4, selected: false },
    { idx: 3, selected: false },
    { idx: 5, selected: true },
  ]

  const stepPct = 100 / (decisions.length + 2)

  const styles = decisions.map((d, step) => {
    const start = (step + 1) * stepPct
    const color = d.selected ? COLORS.secondary : COLORS.danger
    return `
      .gr-${d.idx} {
        animation: grDecide${d.idx} ${dur} infinite;
      }
      @keyframes grDecide${d.idx} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
        ${(start + stepPct * 0.3).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${d.selected ? '#d1fae5' : '#fee2e2'}; stroke: ${color}; }
        100% { fill: ${COLORS.cellBg}; stroke: ${COLORS.border}; }
      }
    `
  }).join('')

  // Timeline
  const timeline = [
    line(timelineX, timelineY, timelineX + timelineW, timelineY, { stroke: COLORS.border }),
    ...Array.from({ length: maxTime + 1 }, (_, t) => [
      line(scale(t), timelineY - 4, scale(t), timelineY + 4, { stroke: COLORS.textSecondary }),
      text(scale(t), timelineY + 18, String(t), { fontSize: 10, fill: COLORS.textSecondary }),
    ]).flat(),
  ].join('\n')

  // Interval bars
  const bars = intervals.map((iv, i) => {
    const x = scale(iv.start)
    const w = scale(iv.end) - scale(iv.start)
    const y = barsStartY + i * (barH + barGap)
    return group([
      rect(x, y, w, barH, { fill: COLORS.cellBg, stroke: COLORS.border, rx: 4, className: `gr-${i}` }),
      text(x + w / 2, y + barH / 2, `${iv.label} [${iv.start},${iv.end}]`, { fontSize: 11, fontWeight: '600' }),
    ].join('\n'))
  }).join('\n')

  const content = [
    text(400, 35, 'Greedy — Interval Scheduling', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Select non-overlapping intervals sorted by end time', { fontSize: 13, fill: COLORS.textSecondary }),
    bars,
    timeline,
    // Legend
    rect(250, 360, 14, 14, { fill: '#d1fae5', stroke: COLORS.secondary, rx: 2 }),
    text(270, 367, 'Selected', { fontSize: 11, fill: COLORS.textSecondary, anchor: 'start' }),
    rect(370, 360, 14, 14, { fill: '#fee2e2', stroke: COLORS.danger, rx: 2 }),
    text(390, 367, 'Rejected (overlaps)', { fontSize: 11, fill: COLORS.textSecondary, anchor: 'start' }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 17. Merge Intervals ────────────────────────────────────────

export function generateMergeIntervals(): string {
  const intervals = [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
    { start: 15, end: 18 },
    { start: 16, end: 20 },
  ]

  const timelineX = 80
  const timelineW = 640
  const maxTime = 22
  const barH = 30
  const scale = (t: number) => timelineX + (t / maxTime) * timelineW

  const dur = '7s'

  // Phase 1 (0-40%): Show all intervals stacked
  // Phase 2 (40-70%): [1,3] and [2,6] merge → [1,6]; [15,18] and [16,20] merge → [15,20]
  // Phase 3 (70-90%): Show merged result
  // Phase 4 (90-100%): Reset

  const inputY = 120
  const outputY = 280

  // Input intervals
  const inputBars = intervals.map((iv, i) => {
    const x = scale(iv.start)
    const w = scale(iv.end) - scale(iv.start)
    const y = inputY + i * (barH + 6)
    return group([
      rect(x, y, w, barH, { fill: COLORS.highlight, stroke: COLORS.primary, rx: 4 }),
      text(x + w / 2, y + barH / 2, `[${iv.start},${iv.end}]`, { fontSize: 11, fontWeight: '600' }),
    ].join('\n'))
  }).join('\n')

  // Merged result: [1,6], [8,10], [15,20]
  const merged = [
    { start: 1, end: 6 },
    { start: 8, end: 10 },
    { start: 15, end: 20 },
  ]

  const mergedBars = merged.map((iv, i) => {
    const x = scale(iv.start)
    const w = scale(iv.end) - scale(iv.start)
    return `<g opacity="0">
      ${animate({ attributeName: 'opacity', values: '0;0;1;1;0', dur, keyTimes: '0;0.40;0.45;0.90;1', calcMode: 'discrete' })}
      ${rect(x, outputY, w, barH, { fill: '#d1fae5', stroke: COLORS.secondary, rx: 4 })}
      ${text(x + w / 2, outputY + barH / 2, `[${iv.start},${iv.end}]`, { fontSize: 11, fontWeight: '600', fill: '#065f46' })}
    </g>`
  }).join('\n')

  const content = [
    text(400, 35, 'Merge Intervals', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'Sort by start, merge overlapping intervals', { fontSize: 13, fill: COLORS.textSecondary }),
    text(100, inputY - 10, 'Input:', { fontSize: 13, fill: COLORS.textSecondary, anchor: 'start', fontWeight: '600' }),
    inputBars,
    text(100, outputY - 10, 'Merged:', { fontSize: 13, fill: COLORS.textSecondary, anchor: 'start', fontWeight: '600' }),
    mergedBars,
    // Arrow between input and output
    `<line x1="400" y1="${inputY + 5 * (barH + 6) + 5}" x2="400" y2="${outputY - 15}" stroke="${COLORS.primary}" stroke-width="2" marker-end="url(#arrow-blue)" opacity="0">
      ${animate({ attributeName: 'opacity', values: '0;0;1;1;0', dur, keyTimes: '0;0.35;0.38;0.90;1', calcMode: 'discrete' })}
    </line>`,
    text(400, 365, '[1,3]∪[2,6]→[1,6]   [8,10]→[8,10]   [15,18]∪[16,20]→[15,20]', { fontSize: 12, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content)
}

// ─── 18. Top K Elements ─────────────────────────────────────────

export function generateTopKElements(): string {
  // Min-heap with K=3, processing array [3, 1, 5, 12, 2, 11]
  // Show a simple heap tree that fills up
  const heapNodes = [
    { x: 400, y: 160, level: 0 },  // root
    { x: 280, y: 240, level: 1 },  // left
    { x: 520, y: 240, level: 1 },  // right
  ]
  const heapEdges = [[0, 1], [0, 2]]

  // States of the heap as values are inserted
  const states = [
    { heap: [3, '', ''], label: 'Insert 3', active: 0 },
    { heap: [1, 3, ''], label: 'Insert 1', active: 0 },
    { heap: [1, 3, 5], label: 'Insert 5', active: 2 },
    { heap: [3, 12, 5], label: '12>1, replace min→heapify', active: 0 },
    { heap: [3, 12, 5], label: '2<3, skip (too small)', active: -1 },
    { heap: [5, 12, 11], label: '11>3, replace min→heapify', active: 0 },
  ]

  const dur = '9s'
  const stepPct = 100 / (states.length + 1)

  // Heap edges
  const edgeEls = heapEdges.map(([a, b]) =>
    treeEdge(heapNodes[a].x, heapNodes[a].y + 22, heapNodes[b].x, heapNodes[b].y - 22, { stroke: COLORS.border })
  ).join('\n')

  // Input array
  const inputVals = [3, 1, 5, 12, 2, 11]
  const inputCellW = 50
  const inputStartX = (800 - inputVals.length * (inputCellW + 6) + 6) / 2
  const inputY = 70

  const inputCells = inputVals.map((v, i) =>
    arrayCell(inputStartX + i * (inputCellW + 6), inputY, String(v), { width: inputCellW, height: 36 })
  ).join('\n')

  // Heap nodes with animated values
  const nodeEls = heapNodes.map((n, i) => {
    const valuesStr = states.map(s => s.heap[i] || ' ').join(';') + ';' + states[0].heap[i]
    const kTimes = Array.from({ length: states.length + 1 }, (_, j) => (j / states.length).toFixed(3)).join(';')
    return group([
      circle(n.x, n.y, 26, { fill: COLORS.cellBg, stroke: COLORS.primary, strokeWidth: 2 }),
      `<text x="${n.x}" y="${n.y}" text-anchor="middle" dominant-baseline="central"
        font-size="16" font-weight="700" fill="${COLORS.text}" font-family="system-ui, -apple-system, sans-serif">
        ${animate({ attributeName: 'textContent', values: valuesStr, dur, keyTimes: kTimes, calcMode: 'discrete' })}
        ${states[0].heap[i]}
      </text>`,
    ].join('\n'))
  }).join('\n')

  // Step label
  const labelValues = states.map(s => s.label).join(';') + ';' + states[0].label
  const labelKTimes = Array.from({ length: states.length + 1 }, (_, j) => (j / states.length).toFixed(3)).join(';')

  const content = [
    text(400, 30, 'Top K Elements (K=3)', { fontSize: 20, fontWeight: '700' }),
    text(200, inputY + 18, 'Input:', { fontSize: 12, fill: COLORS.textSecondary, anchor: 'end' }),
    inputCells,
    edgeEls,
    nodeEls,
    text(400, 130, 'Min-Heap (size ≤ K)', { fontSize: 13, fill: COLORS.primary, fontWeight: '600' }),
    `<text x="400" y="330" text-anchor="middle" font-size="14" fill="${COLORS.textSecondary}"
      font-family="system-ui, -apple-system, sans-serif" font-weight="600">
      ${animate({ attributeName: 'textContent', values: labelValues, dur, keyTimes: labelKTimes, calcMode: 'discrete' })}
      ${states[0].label}
    </text>`,
    text(400, 370, 'Top 3: the K largest elements remain in the heap', { fontSize: 13, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content)
}

// ─── 19. Monotonic Stack ────────────────────────────────────────

export function generateMonotonicStack(): string {
  // Next Greater Element using decreasing monotonic stack
  const values = [2, 1, 5, 6, 2, 3]
  const nge =    [5, 5, 6, -1, 3, -1] // next greater element results

  const cellW = 55
  const gap = 6
  const startX = (800 - values.length * (cellW + gap) + gap) / 2
  const arrY = 80

  // Show the stack states at each step
  const stackStates = [
    { arr_idx: 0, stack: [2], result: [] },
    { arr_idx: 1, stack: [2, 1], result: [] },
    { arr_idx: 2, stack: [5], result: ['1→5', '2→5'] },
    { arr_idx: 3, stack: [6], result: ['5→6'] },
    { arr_idx: 4, stack: [6, 2], result: [] },
    { arr_idx: 5, stack: [6, 3], result: ['2→3'] },
  ]

  const dur = '9s'
  const stepPct = 100 / (stackStates.length + 1)

  // Array cells with highlight for current element
  const styles = stackStates.map((state, step) => {
    const start = (step + 1) * stepPct
    return `
      .ms-arr-${state.arr_idx} {
        animation: msHighlight${state.arr_idx} ${dur} infinite;
      }
      @keyframes msHighlight${state.arr_idx} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
        ${(start + 0.5).toFixed(1)}%, ${(start + stepPct - 0.5).toFixed(1)}% { fill: ${COLORS.warning}; }
        ${(start + stepPct).toFixed(1)}%, 100% { fill: ${COLORS.cellBg}; }
      }
    `
  }).join('')

  const arrCells = values.map((v, i) =>
    arrayCell(startX + i * (cellW + gap), arrY, String(v), { width: cellW, className: `ms-arr-${i}` })
  ).join('\n')

  // Stack visualization (vertical on the right)
  const stackX = 620
  const stackY = 320
  const stackCellH = 36
  const stackKTimes = Array.from({ length: stackStates.length + 1 }, (_, j) => (j / stackStates.length).toFixed(3)).join(';')

  // Draw stack as labels that change
  const maxStackSize = 3
  const stackVis = Array.from({ length: maxStackSize }, (_, slotIdx) => {
    const valuesStr = stackStates.map(s => {
      const fromBottom = s.stack.length - 1 - slotIdx
      return fromBottom >= 0 ? String(s.stack[slotIdx]) : ' '
    }).join(';') + '; '
    const y = stackY - slotIdx * stackCellH
    return group([
      rect(stackX, y - stackCellH + 4, 70, stackCellH - 4, { fill: COLORS.highlight, stroke: COLORS.primary, rx: 4 }),
      `<text x="${stackX + 35}" y="${y - stackCellH / 2 + 4}" text-anchor="middle" dominant-baseline="central"
        font-size="14" font-weight="700" fill="${COLORS.text}" font-family="system-ui, -apple-system, sans-serif">
        ${animate({ attributeName: 'textContent', values: valuesStr, dur, keyTimes: stackKTimes, calcMode: 'discrete' })}
      </text>`,
    ].join('\n'))
  }).join('\n')

  // NGE result array
  const resultY = 180
  const ngeVals = nge.map(v => v === -1 ? '-1' : String(v))
  const resultCells = ngeVals.map((v, i) => {
    const fillStart = ((i + 1) + 1) * stepPct // roughly when this element is processed
    return arrayCell(startX + i * (cellW + gap), resultY, v, {
      width: cellW, fill: COLORS.highlight,
    })
  }).join('\n')

  const content = [
    text(400, 30, 'Monotonic Stack', { fontSize: 20, fontWeight: '700' }),
    text(400, 52, 'Find Next Greater Element using a decreasing stack', { fontSize: 13, fill: COLORS.textSecondary }),
    text(startX - 5, arrY + 25, 'Input:', { fontSize: 12, fill: COLORS.textSecondary, anchor: 'end' }),
    arrCells,
    text(startX - 5, resultY + 25, 'NGE:', { fontSize: 12, fill: COLORS.textSecondary, anchor: 'end' }),
    resultCells,
    text(stackX + 35, stackY + 25, 'Stack', { fontSize: 12, fill: COLORS.primary, fontWeight: '600' }),
    rect(stackX - 5, stackY - maxStackSize * stackCellH, 80, maxStackSize * stackCellH + 10, { fill: 'none', stroke: COLORS.primary, strokeWidth: 1, rx: 4 }),
    stackVis,
    text(400, 380, 'Pop smaller elements, they found their next greater', { fontSize: 13, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}

// ─── 20. Bit Manipulation ───────────────────────────────────────

export function generateBitManipulation(): string {
  // XOR of two 8-bit numbers
  const a = [0, 1, 0, 1, 1, 0, 1, 0] // 90
  const b = [0, 0, 1, 1, 0, 1, 1, 0] // 54
  const xor = a.map((bit, i) => bit ^ b[i])  // 108

  const cellW = 55
  const gap = 8
  const startX = (800 - 8 * (cellW + gap) + gap) / 2
  const rowA_Y = 110
  const rowB_Y = 185
  const rowR_Y = 280
  const dur = '8s'
  const stepPct = 100 / (8 + 2) // 8 bits + pause

  // Animate each bit position from right to left (but display left to right)
  const bitOrder = [7, 6, 5, 4, 3, 2, 1, 0] // process from LSB to MSB visually

  const styles = bitOrder.map((bitIdx, step) => {
    const i = 7 - bitIdx // array index (left to right)
    const start = (step + 1) * stepPct
    const isMatch = a[i] === b[i]
    return `
      .bit-a-${i}, .bit-b-${i} {
        animation: bitHL${i} ${dur} infinite;
      }
      @keyframes bitHL${i} {
        0%, ${start.toFixed(1)}% { stroke: ${COLORS.border}; }
        ${(start + 0.5).toFixed(1)}%, ${(start + stepPct - 0.5).toFixed(1)}% { stroke: ${COLORS.warning}; stroke-width: 3; }
        ${(start + stepPct).toFixed(1)}%, 100% { stroke: ${COLORS.border}; }
      }
      .bit-r-${i} {
        animation: bitRes${i} ${dur} infinite;
      }
      @keyframes bitRes${i} {
        0%, ${start.toFixed(1)}% { fill: ${COLORS.cellBg}; }
        ${(start + stepPct * 0.3).toFixed(1)}%, ${(100 - stepPct).toFixed(1)}% { fill: ${isMatch ? COLORS.cellBg : '#d1fae5'}; }
        100% { fill: ${COLORS.cellBg}; }
      }
    `
  }).join('')

  const rowACells = a.map((bit, i) =>
    arrayCell(startX + i * (cellW + gap), rowA_Y, String(bit), { width: cellW, className: `bit-a-${i}` })
  ).join('\n')

  const rowBCells = b.map((bit, i) =>
    arrayCell(startX + i * (cellW + gap), rowB_Y, String(bit), { width: cellW, className: `bit-b-${i}` })
  ).join('\n')

  const rowRCells = xor.map((bit, i) =>
    arrayCell(startX + i * (cellW + gap), rowR_Y, String(bit), { width: cellW, className: `bit-r-${i}` })
  ).join('\n')

  // XOR operator symbol between rows
  const opY = (rowA_Y + rowB_Y) / 2 + 25
  const resLine = rowR_Y - 10

  const content = [
    text(400, 35, 'Bit Manipulation', { fontSize: 20, fontWeight: '700' }),
    text(400, 58, 'XOR operation — bits differ → 1, same → 0', { fontSize: 13, fill: COLORS.textSecondary }),
    // Labels
    text(startX - 15, rowA_Y + 25, 'A', { fontSize: 16, fontWeight: '700', fill: COLORS.primary }),
    text(startX - 15, rowB_Y + 25, 'B', { fontSize: 16, fontWeight: '700', fill: COLORS.secondary }),
    text(startX - 15, rowR_Y + 25, 'R', { fontSize: 16, fontWeight: '700', fill: COLORS.text }),
    // XOR symbol
    text(startX - 15, opY, '⊕', { fontSize: 20, fontWeight: '700', fill: COLORS.warning }),
    // Separator line
    line(startX, resLine, startX + 8 * (cellW + gap) - gap, resLine, { stroke: COLORS.text, strokeWidth: 2 }),
    rowACells,
    rowBCells,
    rowRCells,
    // Decimal values
    text(400, 365, 'A = 90 (01011010)    B = 54 (00110110)    A ⊕ B = 108 (01101100)', { fontSize: 13, fill: COLORS.textSecondary }),
  ].join('\n')

  return svgDocument(content, styles)
}
