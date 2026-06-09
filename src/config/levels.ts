import { LevelData, TileType, GameConfig } from './GameConfig';

const W = TileType.WALL;
const F = TileType.FLOOR;
const T = TileType.TARGET_ZONE;
const C = TileType.CARD_SLOT;
const E = TileType.EXIT;

const makeGrid = (rows: number, cols: number, custom?: (r: number, c: number) => number): number[][] => {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        row.push(W);
      } else if (custom) {
        row.push(custom(r, c));
      } else {
        row.push(F);
      }
    }
    grid.push(row);
  }
  return grid;
};

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: '第一夜：入门篇',
    description: '欢迎来到夜间书店！推动书架到目标区域，找到并收集散落的线索。',
    maxSteps: 35,
    starThresholds: [30, 22, 16],
    grid: makeGrid(GameConfig.GRID_ROWS, GameConfig.GRID_COLS, (r, c) => {
      if (r === 4 && c >= 3 && c <= 4) return W;
      if (r === 5 && c === 8) return T;
      if (r === 2 && c === 2) return C;
      if (r === 7 && c === 10) return E;
      return F;
    }),
    playerStart: { x: 1, y: 1 },
    shelves: [
      { pos: { x: 4, y: 2 }, id: 's1', targetZoneId: 't1' },
      { pos: { x: 6, y: 6 }, id: 's2' },
    ],
    books: [
      { pos: { x: 6, y: 2 }, id: 'b1', category: '文学', title: '月光诗集' },
      { pos: { x: 9, y: 5 }, id: 'b2', category: '历史', title: '古书店年鉴', isWrongPlace: true },
    ],
    clues: [
      { pos: { x: 3, y: 6 }, id: 'cl1', text: '线索：文学类书架应放在温暖的角落（右下区）。' },
      { pos: { x: 9, y: 2 }, id: 'cl2', text: '线索：索引卡损坏了，需要在卡槽处修复。' },
    ],
    indexCards: [
      { pos: { x: 2, y: 2 }, id: 'ic1', category: '历史' },
    ],
    targetZones: [
      { pos: { x: 8, y: 5 }, id: 't1', category: '文学' },
    ],
  },
  {
    id: 2,
    name: '第二夜：分类学',
    description: '学会整理不同类别的书。将书架推到对应分类的目标区。',
    maxSteps: 55,
    starThresholds: [50, 38, 28],
    grid: makeGrid(GameConfig.GRID_ROWS, GameConfig.GRID_COLS, (r, c) => {
      if (r === 3 && c >= 5 && c <= 7) return W;
      if (r === 6 && c >= 3 && c <= 5) return W;
      if (r === 2 && c === 9) return T;
      if (r === 7 && c === 9) return T;
      if (r === 5 && c === 2) return C;
      if (r === 7 && c === 8) return C;
      if (r === 8 && c === 1) return E;
      return F;
    }),
    playerStart: { x: 1, y: 1 },
    shelves: [
      { pos: { x: 3, y: 4 }, id: 's1', targetZoneId: 't1' },
      { pos: { x: 8, y: 4 }, id: 's2', targetZoneId: 't2' },
      { pos: { x: 6, y: 7 }, id: 's3' },
    ],
    books: [
      { pos: { x: 2, y: 6 }, id: 'b1', category: '科幻', title: '星际编年史' },
      { pos: { x: 9, y: 4 }, id: 'b2', category: '哲学', title: '深夜沉思录' },
      { pos: { x: 5, y: 8 }, id: 'b3', category: '科幻', title: '三体问题', isWrongPlace: true },
    ],
    clues: [
      { pos: { x: 10, y: 1 }, id: 'cl1', text: '线索：科幻类书籍应放在上层目标区。' },
      { pos: { x: 2, y: 8 }, id: 'cl2', text: '线索：哲学类书籍在下层区域寻找。' },
    ],
    indexCards: [
      { pos: { x: 2, y: 5 }, id: 'ic1', category: '科幻' },
      { pos: { x: 8, y: 7 }, id: 'ic2', category: '哲学' },
    ],
    targetZones: [
      { pos: { x: 9, y: 2 }, id: 't1', category: '科幻' },
      { pos: { x: 9, y: 7 }, id: 't2', category: '哲学' },
    ],
  },
  {
    id: 3,
    name: '第三夜：迷宫巷',
    description: '书店深处有更多墙壁。小心规划路线，每一步都要思考。',
    maxSteps: 60,
    starThresholds: [55, 42, 34],
    grid: makeGrid(GameConfig.GRID_ROWS, GameConfig.GRID_COLS, (r, c) => {
      if (c === 4 && r >= 2 && r <= 5) return W;
      if (c === 8 && r >= 4 && r <= 7) return W;
      if (r === 5 && c >= 6 && c <= 7) return W;
      if (r === 2 && c === 6) return T;
      if (r === 7 && c === 6) return T;
      if (r === 4 && c === 10) return T;
      if (r === 1 && c === 10) return C;
      if (r === 8 && c === 10) return C;
      if (r === 8 && c === 1) return E;
      return F;
    }),
    playerStart: { x: 1, y: 1 },
    shelves: [
      { pos: { x: 2, y: 3 }, id: 's1', targetZoneId: 't1' },
      { pos: { x: 6, y: 3 }, id: 's2', targetZoneId: 't2' },
      { pos: { x: 2, y: 6 }, id: 's3', targetZoneId: 't3' },
      { pos: { x: 9, y: 6 }, id: 's4' },
    ],
    books: [
      { pos: { x: 6, y: 1 }, id: 'b1', category: '推理', title: '午夜迷案' },
      { pos: { x: 2, y: 8 }, id: 'b2', category: '艺术', title: '光影美学' },
      { pos: { x: 9, y: 2 }, id: 'b3', category: '经济', title: '货币简史' },
      { pos: { x: 7, y: 8 }, id: 'b4', category: '推理', title: '密室钥匙', isWrongPlace: true },
    ],
    clues: [
      { pos: { x: 10, y: 3 }, id: 'cl1', text: '线索：推理书籍总是藏在最深处。' },
      { pos: { x: 3, y: 1 }, id: 'cl2', text: '线索：艺术类索引卡在东北角。' },
      { pos: { x: 6, y: 8 }, id: 'cl3', text: '线索：经济类书籍在东边可以找到。' },
    ],
    indexCards: [
      { pos: { x: 10, y: 1 }, id: 'ic1', category: '推理' },
      { pos: { x: 10, y: 8 }, id: 'ic2', category: '艺术' },
    ],
    targetZones: [
      { pos: { x: 6, y: 2 }, id: 't1', category: '推理' },
      { pos: { x: 6, y: 7 }, id: 't2', category: '艺术' },
      { pos: { x: 10, y: 4 }, id: 't3', category: '经济' },
    ],
  },
  {
    id: 4,
    name: '第四夜：错置之谜',
    description: '许多书被放到了错误的位置。仔细阅读线索，找出所有错位的书。',
    maxSteps: 80,
    starThresholds: [70, 55, 45],
    grid: makeGrid(GameConfig.GRID_ROWS, GameConfig.GRID_COLS, (r, c) => {
      if (r === 2 && c >= 3 && c <= 4) return W;
      if (r === 2 && c >= 8 && c <= 9) return W;
      if (r === 4 && c >= 2 && c <= 3) return W;
      if (r === 4 && c >= 8 && c <= 9) return W;
      if (r === 6 && c >= 4 && c <= 7) return W;
      if (r === 7 && c === 2) return W;
      if (r === 3 && c === 6) return T;
      if (r === 5 && c === 6) return T;
      if (r === 1 && c === 6) return C;
      if (r === 8 && c === 6) return C;
      if (r === 8 && c === 10) return E;
      return F;
    }),
    playerStart: { x: 1, y: 1 },
    shelves: [
      { pos: { x: 5, y: 2 }, id: 's1', targetZoneId: 't1' },
      { pos: { x: 7, y: 2 }, id: 's2', targetZoneId: 't2' },
      { pos: { x: 5, y: 5 }, id: 's3' },
      { pos: { x: 3, y: 7 }, id: 's4' },
      { pos: { x: 9, y: 7 }, id: 's5' },
    ],
    books: [
      { pos: { x: 5, y: 1 }, id: 'b1', category: '文学', title: '月光诗集' },
      { pos: { x: 1, y: 5 }, id: 'b2', category: '历史', title: '中世纪史', isWrongPlace: true },
      { pos: { x: 10, y: 5 }, id: 'b3', category: '科技', title: '代码之美' },
      { pos: { x: 5, y: 8 }, id: 'b4', category: '文学', title: '寂静之声', isWrongPlace: true },
      { pos: { x: 10, y: 1 }, id: 'b5', category: '历史', title: '古都记忆' },
    ],
    clues: [
      { pos: { x: 1, y: 3 }, id: 'cl1', text: '线索：文学类的目标在中部上层。' },
      { pos: { x: 10, y: 3 }, id: 'cl2', text: '线索：科技类索引卡需要在底部修复。' },
      { pos: { x: 2, y: 8 }, id: 'cl3', text: '线索：至少有2本书被错放了位置。' },
      { pos: { x: 9, y: 3 }, id: 'cl4', text: '线索：历史书应出现在奇数行。' },
    ],
    indexCards: [
      { pos: { x: 6, y: 1 }, id: 'ic1', category: '文学' },
      { pos: { x: 6, y: 8 }, id: 'ic2', category: '科技' },
    ],
    targetZones: [
      { pos: { x: 6, y: 3 }, id: 't1', category: '文学' },
      { pos: { x: 6, y: 5 }, id: 't2', category: '科技' },
    ],
  },
  {
    id: 5,
    name: '第五夜：终章整理',
    description: '最后一夜！书店最深处的挑战。综合运用所有技巧，完美整理整个书店。',
    maxSteps: 120,
    starThresholds: [110, 85, 65],
    grid: makeGrid(GameConfig.GRID_ROWS, GameConfig.GRID_COLS, (r, c) => {
      if (r === 2 && (c === 3 || c === 6 || c === 9)) return W;
      if (r === 4 && c >= 2 && c <= 4) return W;
      if (r === 4 && c >= 8 && c <= 10) return W;
      if (r === 6 && c === 5) return W;
      if (r === 7 && c >= 6 && c <= 8) return W;
      if (r === 1 && c === 5) return T;
      if (r === 3 && c === 10) return T;
      if (r === 5 && c === 1) return T;
      if (r === 8 && c === 5) return T;
      if (r === 3 && c === 1) return C;
      if (r === 8 && c === 1) return C;
      if (r === 5 && c === 10) return C;
      if (r === 8 && c === 10) return E;
      return F;
    }),
    playerStart: { x: 1, y: 1 },
    shelves: [
      { pos: { x: 2, y: 1 }, id: 's1', targetZoneId: 't1' },
      { pos: { x: 8, y: 1 }, id: 's2', targetZoneId: 't2' },
      { pos: { x: 2, y: 3 }, id: 's3' },
      { pos: { x: 6, y: 3 }, id: 's4', targetZoneId: 't3' },
      { pos: { x: 3, y: 5 }, id: 's5' },
      { pos: { x: 7, y: 5 }, id: 's6', targetZoneId: 't4' },
    ],
    books: [
      { pos: { x: 6, y: 1 }, id: 'b1', category: '奇幻', title: '龙之传说' },
      { pos: { x: 10, y: 2 }, id: 'b2', category: '传记', title: '书店老板回忆录' },
      { pos: { x: 4, y: 5 }, id: 'b3', category: '数学', title: '质数的秘密', isWrongPlace: true },
      { pos: { x: 9, y: 6 }, id: 'b4', category: '烹饪', title: '深夜食谱' },
      { pos: { x: 2, y: 7 }, id: 'b5', category: '奇幻', title: '魔戒指南', isWrongPlace: true },
      { pos: { x: 9, y: 8 }, id: 'b6', category: '传记', title: '编辑的一生' },
    ],
    clues: [
      { pos: { x: 4, y: 1 }, id: 'cl1', text: '线索：奇幻类书籍要放在最上方。' },
      { pos: { x: 8, y: 2 }, id: 'cl2', text: '线索：传记类应在最右侧。' },
      { pos: { x: 1, y: 4 }, id: 'cl3', text: '线索：数学类在左侧中间的目标区。' },
      { pos: { x: 10, y: 7 }, id: 'cl4', text: '线索：烹饪类索引卡在最右侧中间。' },
      { pos: { x: 4, y: 8 }, id: 'cl5', text: '线索：有两本奇幻书，但只有一本是错放的。' },
    ],
    indexCards: [
      { pos: { x: 1, y: 3 }, id: 'ic1', category: '奇幻' },
      { pos: { x: 1, y: 8 }, id: 'ic2', category: '数学' },
      { pos: { x: 10, y: 5 }, id: 'ic3', category: '烹饪' },
    ],
    targetZones: [
      { pos: { x: 5, y: 1 }, id: 't1', category: '奇幻' },
      { pos: { x: 10, y: 3 }, id: 't2', category: '传记' },
      { pos: { x: 1, y: 5 }, id: 't3', category: '数学' },
      { pos: { x: 5, y: 8 }, id: 't4', category: '烹饪' },
    ],
  },
];

export function getLevelById(id: number): LevelData | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function validateLevelData(level: LevelData): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows = level.grid.length;
  const cols = level.grid[0]?.length || 0;
  if (rows !== GameConfig.GRID_ROWS || cols !== GameConfig.GRID_COLS) {
    errors.push(`网格尺寸不符：期望 ${GameConfig.GRID_ROWS}x${GameConfig.GRID_COLS}，实际 ${rows}x${cols}`);
  }
  let hasExit = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (level.grid[r][c] === TileType.EXIT) hasExit = true;
    }
  }
  if (!hasExit) errors.push('关卡缺少出口 tile（EXIT = 5），无法完成胜利判定');

  const posKey = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  const occ = new Set<string>();
  const addOcc = (p: { x: number; y: number }, type: string, expectedTile?: TileType, expectedLabel?: string) => {
    const k = posKey(p);
    if (occ.has(k)) errors.push(`${type} 与其他物体位置重叠：(${p.x},${p.y})`);
    occ.add(k);
    if (p.x < 0 || p.x >= cols || p.y < 0 || p.y >= rows) {
      errors.push(`${type} 超出边界：(${p.x},${p.y})`);
      return;
    }
    if (level.grid[p.y][p.x] === TileType.WALL) {
      errors.push(`${type} 放在墙上：(${p.x},${p.y})`);
      return;
    }
    if (expectedTile && level.grid[p.y][p.x] !== expectedTile) {
      const label = expectedLabel || '要求的 tile';
      errors.push(`${type} 必须在${label}上：实际位置 (${p.x},${p.y}) 格子类型=${level.grid[p.y][p.x]}，期望=${expectedTile}`);
    }
  };
  addOcc(level.playerStart, '玩家');
  level.shelves.forEach((s, i) => addOcc(s.pos, `书架${i}`));
  level.books.forEach((b, i) => addOcc(b.pos, `书籍${i}`));
  level.clues.forEach((c, i) => addOcc(c.pos, `线索${i}`));
  level.indexCards.forEach((c, i) => addOcc(c.pos, `索引卡${i}`, TileType.CARD_SLOT, '卡槽 tile（CARD_SLOT = 4）'));
  level.targetZones.forEach((t, i) => addOcc(t.pos, `目标区${i}`, TileType.TARGET_ZONE, '目标区 tile（TARGET_ZONE = 3）'));

  const linkedTargetIds = new Set(level.shelves.filter((s) => s.targetZoneId).map((s) => s.targetZoneId));
  const definedTargetIds = new Set(level.targetZones.map((t) => t.id));
  for (const id of linkedTargetIds) {
    if (!definedTargetIds.has(id!)) errors.push(`书架引用了不存在的 targetZoneId: ${id}`);
  }
  for (const id of definedTargetIds) {
    if (!linkedTargetIds.has(id)) warnings.push(`目标区 "${id}" 没有书架引用`);
  }
  if (level.indexCards.length > 0) {
    const cardSlotCount = level.grid.flat().filter((t) => t === TileType.CARD_SLOT).length;
    if (cardSlotCount < level.indexCards.length) {
      errors.push(`卡槽 tile 数量(${cardSlotCount}) 少于索引卡数量(${level.indexCards.length})`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
