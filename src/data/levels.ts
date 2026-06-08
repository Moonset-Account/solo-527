import { LevelConfig, TileType } from '@core/types';

function createGrid(width: number, height: number, walls: Array<[number, number]>, floors: Array<[number, number]> = []): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        row.push('wall');
      } else {
        row.push('floor');
      }
    }
    grid.push(row);
  }
  
  walls.forEach(([x, y]) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      grid[y][x] = 'wall';
    }
  });

  floors.forEach(([x, y]) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      grid[y][x] = 'floor';
    }
  });

  return grid;
}

export const demoLevels: LevelConfig[] = [
  {
    id: 'level_01',
    name: '第一夜：新手指引',
    description: '欢迎来到夜间书店。学习基础操作：移动、推书架、收集线索。',
    width: 10,
    height: 8,
    maxSteps: 60,
    timeLimit: 300,
    recommendedSteps: 25,
    grid: createGrid(10, 8, [
      [4, 2], [4, 3],
      [6, 4], [6, 5]
    ]),
    playerStart: { x: 1, y: 1 },
    bookshelves: [
      { id: 'shelf_1', position: { x: 3, y: 3 }, isTarget: false, category: 'fiction' },
      { id: 'shelf_2', position: { x: 5, y: 2 }, isTarget: true, category: 'fiction' },
      { id: 'shelf_3', position: { x: 7, y: 3 }, isTarget: false, category: 'history' },
      { id: 'shelf_4', position: { x: 2, y: 5 }, isTarget: true, category: 'history' }
    ],
    books: [
      { id: 'book_001', name: '迷雾之子', category: 'fiction', color: 0xe06c75, correctShelfId: 'shelf_2', isPlaced: false },
      { id: 'book_002', name: '罗马帝国衰亡史', category: 'history', color: 0xc678dd, correctShelfId: 'shelf_4', isPlaced: false }
    ],
    clues: [
      { id: 'clue_001', title: '管理员笔记', description: '《迷雾之子》属于奇幻小说区，书架2上的标签是fiction。', position: { x: 2, y: 2 }, collected: false, hintForBook: 'book_001' },
      { id: 'clue_002', title: '分类卡片', description: '历史类书籍应该放在标有history的书架上。', position: { x: 8, y: 5 }, collected: false, hintForBook: 'book_002' }
    ],
    indexCards: [
      { id: 'card_001', position: { x: 5, y: 5 }, bookId: 'book_001', isFixed: false, requiredClueIds: ['clue_001'] },
      { id: 'card_002', position: { x: 3, y: 6 }, bookId: 'book_002', isFixed: false, requiredClueIds: ['clue_002'] }
    ],
    targetBooks: ['book_001', 'book_002']
  },
  {
    id: 'level_02',
    name: '第二夜：书架迷宫',
    description: '书架挡住了道路，需要推动它们才能找到所有线索。',
    width: 12,
    height: 10,
    maxSteps: 100,
    timeLimit: 420,
    recommendedSteps: 50,
    grid: createGrid(12, 10, [
      [3, 2], [3, 3], [3, 4],
      [6, 1], [6, 2], [6, 3], [6, 5], [6, 6], [6, 7],
      [9, 3], [9, 4], [9, 5], [9, 6],
      [2, 7], [3, 7], [4, 7]
    ]),
    playerStart: { x: 1, y: 1 },
    bookshelves: [
      { id: 'shelf_a', position: { x: 2, y: 2 }, isTarget: false, category: 'science' },
      { id: 'shelf_b', position: { x: 4, y: 2 }, isTarget: true, category: 'literature' },
      { id: 'shelf_c', position: { x: 5, y: 4 }, isTarget: false, category: 'art' },
      { id: 'shelf_d', position: { x: 7, y: 4 }, isTarget: true, category: 'science' },
      { id: 'shelf_e', position: { x: 8, y: 2 }, isTarget: true, category: 'art' },
      { id: 'shelf_f', position: { x: 5, y: 6 }, isTarget: false, category: 'literature' },
      { id: 'shelf_g', position: { x: 8, y: 8 }, isTarget: true, category: 'philosophy' },
      { id: 'shelf_h', position: { x: 10, y: 5 }, isTarget: false, category: 'philosophy' }
    ],
    books: [
      { id: 'book_101', name: '百年孤独', category: 'literature', color: 0xe06c75, correctShelfId: 'shelf_b', isPlaced: false },
      { id: 'book_102', name: '时间简史', category: 'science', color: 0x56b6c2, correctShelfId: 'shelf_d', isPlaced: false },
      { id: 'book_103', name: '艺术的故事', category: 'art', color: 0xe5c07b, correctShelfId: 'shelf_e', isPlaced: false },
      { id: 'book_104', name: '存在与时间', category: 'philosophy', color: 0xc678dd, correctShelfId: 'shelf_g', isPlaced: false }
    ],
    clues: [
      { id: 'clue_101', title: '文学标签', description: '蓝色书架（shelf_b）是文学类区域。', position: { x: 2, y: 4 }, collected: false, hintForBook: 'book_101' },
      { id: 'clue_102', title: '科学徽章', description: '最深处的shelf_d放着宇宙与物理相关的书。', position: { x: 5, y: 2 }, collected: false, hintForBook: 'book_102' },
      { id: 'clue_103', title: '画廊海报', description: 'shelf_e的位置之前是小型画廊，现在放艺术类书籍。', position: { x: 10, y: 2 }, collected: false, hintForBook: 'book_103' },
      { id: 'clue_104', title: '哲学期刊', description: '右下角的shelf_g属于哲学专区，靠近休息区。', position: { x: 5, y: 8 }, collected: false, hintForBook: 'book_104' }
    ],
    indexCards: [
      { id: 'card_101', position: { x: 2, y: 5 }, bookId: 'book_101', isFixed: false, requiredClueIds: ['clue_101'] },
      { id: 'card_102', position: { x: 7, y: 6 }, bookId: 'book_102', isFixed: false, requiredClueIds: ['clue_102'] },
      { id: 'card_103', position: { x: 10, y: 8 }, bookId: 'book_103', isFixed: false, requiredClueIds: ['clue_103'] },
      { id: 'card_104', position: { x: 8, y: 6 }, bookId: 'book_104', isFixed: false, requiredClueIds: ['clue_104'] }
    ],
    targetBooks: ['book_101', 'book_102', 'book_103', 'book_104']
  },
  {
    id: 'level_03',
    name: '第三夜：终极考验',
    description: '大型书店的最后一夜，所有技能都将派上用场。小心步数！',
    width: 14,
    height: 12,
    maxSteps: 150,
    timeLimit: 600,
    recommendedSteps: 90,
    grid: createGrid(14, 12, [
      [4, 1], [4, 2], [4, 3], [4, 4],
      [9, 7], [9, 8], [9, 9], [9, 10],
      [2, 5], [3, 5], [4, 5],
      [7, 3], [7, 4],
      [11, 3], [11, 4], [11, 5],
      [6, 8], [7, 8], [8, 8],
      [2, 9], [3, 9]
    ], [
      [4, 5]
    ]),
    playerStart: { x: 1, y: 1 },
    bookshelves: [
      { id: 't_shelf_1', position: { x: 2, y: 2 }, isTarget: true, category: 'mystery' },
      { id: 't_shelf_2', position: { x: 6, y: 1 }, isTarget: false, category: 'romance' },
      { id: 't_shelf_3', position: { x: 8, y: 2 }, isTarget: true, category: 'scifi' },
      { id: 't_shelf_4', position: { x: 5, y: 4 }, isTarget: false, category: 'biography' },
      { id: 't_shelf_5', position: { x: 10, y: 2 }, isTarget: true, category: 'romance' },
      { id: 't_shelf_6', position: { x: 3, y: 7 }, isTarget: false, category: 'mystery' },
      { id: 't_shelf_7', position: { x: 5, y: 6 }, isTarget: true, category: 'biography' },
      { id: 't_shelf_8', position: { x: 10, y: 7 }, isTarget: true, category: 'scifi' },
      { id: 't_shelf_9', position: { x: 8, y: 10 }, isTarget: false, category: 'cooking' },
      { id: 't_shelf_10', position: { x: 11, y: 10 }, isTarget: true, category: 'cooking' }
    ],
    books: [
      { id: 't_book_1', name: '福尔摩斯探案集', category: 'mystery', color: 0xe06c75, correctShelfId: 't_shelf_1', isPlaced: false },
      { id: 't_book_2', name: '傲慢与偏见', category: 'romance', color: 0xff85a8, correctShelfId: 't_shelf_5', isPlaced: false },
      { id: 't_book_3', name: '基地', category: 'scifi', color: 0x56b6c2, correctShelfId: 't_shelf_3', isPlaced: false },
      { id: 't_book_4', name: '乔布斯传', category: 'biography', color: 0xe5c07b, correctShelfId: 't_shelf_7', isPlaced: false },
      { id: 't_book_5', name: '沙丘', category: 'scifi', color: 0x98c379, correctShelfId: 't_shelf_8', isPlaced: false },
      { id: 't_book_6', name: '米其林主厨秘方', category: 'cooking', color: 0xd19a66, correctShelfId: 't_shelf_10', isPlaced: false }
    ],
    clues: [
      { id: 't_clue_1', title: '侦探角标记', description: '入口左侧的t_shelf_1是侦探小说专区。', position: { x: 3, y: 1 }, collected: false, hintForBook: 't_book_1' },
      { id: 't_clue_2', title: '读者留言', description: '《傲慢与偏见》常被放在窗边的t_shelf_5。', position: { x: 12, y: 2 }, collected: false, hintForBook: 't_book_2' },
      { id: 't_clue_3', title: '科幻指南', description: '《基地》属于经典科幻，在t_shelf_3。', position: { x: 7, y: 1 }, collected: false, hintForBook: 't_book_3' },
      { id: 't_clue_4', title: '人物专区', description: '传记类的书在t_shelf_7，靠近中央灯柱。', position: { x: 5, y: 5 }, collected: false, hintForBook: 't_book_4' },
      { id: 't_clue_5', title: '新到通知', description: '《沙丘》刚到，在t_shelf_8上架。', position: { x: 12, y: 7 }, collected: false, hintForBook: 't_book_5' },
      { id: 't_clue_6', title: '美食角', description: '烹饪书在最里面的t_shelf_10。', position: { x: 12, y: 10 }, collected: false, hintForBook: 't_book_6' }
    ],
    indexCards: [
      { id: 't_card_1', position: { x: 2, y: 3 }, bookId: 't_book_1', isFixed: false, requiredClueIds: ['t_clue_1'] },
      { id: 't_card_2', position: { x: 11, y: 1 }, bookId: 't_book_2', isFixed: false, requiredClueIds: ['t_clue_2'] },
      { id: 't_card_3', position: { x: 8, y: 1 }, bookId: 't_book_3', isFixed: false, requiredClueIds: ['t_clue_3'] },
      { id: 't_card_4', position: { x: 5, y: 7 }, bookId: 't_book_4', isFixed: false, requiredClueIds: ['t_clue_4'] },
      { id: 't_card_5', position: { x: 10, y: 6 }, bookId: 't_book_5', isFixed: false, requiredClueIds: ['t_clue_5'] },
      { id: 't_card_6', position: { x: 10, y: 9 }, bookId: 't_book_6', isFixed: false, requiredClueIds: ['t_clue_6'] }
    ],
    targetBooks: ['t_book_1', 't_book_2', 't_book_3', 't_book_4', 't_book_5', 't_book_6']
  }
];
