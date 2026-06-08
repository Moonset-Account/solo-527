import { LevelConfig, TileType, BookshelfData, BookData } from '@core/types';

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

function pairBooksToWrongShelves(
  shelves: BookshelfData[],
  books: BookData[]
): { shelves: BookshelfData[]; books: BookData[] } {
  const targetShelfIds = shelves.filter(s => s.isTarget).map(s => s.id);
  const nonTargetShelfIds = shelves.filter(s => !s.isTarget).map(s => s.id);
  
  const resultShelves = shelves.map(s => ({ ...s }));
  const resultBooks = books.map(b => ({ ...b }));

  resultBooks.forEach(book => {
    const correctId = book.correctShelfId;
    
    const nonCorrectIds = nonTargetShelfIds.filter(id => id !== correctId);
    const usedIds = resultBooks.filter(b => b.id !== book.id && b.currentShelfId).map(b => b.currentShelfId);
    const availableIds = nonCorrectIds.filter(id => !usedIds.includes(id));
    
    if (availableIds.length > 0) {
      const chosenId = availableIds[Math.floor(Math.random() * availableIds.length)];
      book.currentShelfId = chosenId;
      const shelf = resultShelves.find(s => s.id === chosenId);
      if (shelf) shelf.bookId = book.id;
    } else if (nonCorrectIds.length > 0) {
      const chosenId = nonCorrectIds[Math.floor(Math.random() * nonCorrectIds.length)];
      book.currentShelfId = chosenId;
      const shelf = resultShelves.find(s => s.id === chosenId);
      if (shelf && !shelf.bookId) shelf.bookId = book.id;
    } else {
      const otherTargets = targetShelfIds.filter(id => id !== correctId);
      if (otherTargets.length > 0) {
        const chosenId = otherTargets[Math.floor(Math.random() * otherTargets.length)];
        book.currentShelfId = chosenId;
        const shelf = resultShelves.find(s => s.id === chosenId);
        if (shelf && !shelf.bookId) shelf.bookId = book.id;
      }
    }
    
    book.isPlaced = !!book.currentShelfId;
  });

  return { shelves: resultShelves, books: resultBooks };
}

function buildLevel1(): LevelConfig {
  const rawShelves: BookshelfData[] = [
    { id: 'shelf_1', position: { x: 3, y: 3 }, isTarget: false, category: 'fiction' },
    { id: 'shelf_2', position: { x: 5, y: 2 }, isTarget: true, category: 'fiction' },
    { id: 'shelf_3', position: { x: 7, y: 3 }, isTarget: false, category: 'history' },
    { id: 'shelf_4', position: { x: 2, y: 5 }, isTarget: true, category: 'history' }
  ];
  const rawBooks: BookData[] = [
    { id: 'book_001', name: '迷雾之子', category: 'fiction', color: 0xe06c75, correctShelfId: 'shelf_2', currentShelfId: 'shelf_3', isPlaced: true },
    { id: 'book_002', name: '罗马帝国衰亡史', category: 'history', color: 0xc678dd, correctShelfId: 'shelf_4', currentShelfId: 'shelf_1', isPlaced: true }
  ];
  rawShelves[0].bookId = 'book_002';
  rawShelves[2].bookId = 'book_001';

  return {
    id: 'level_01',
    name: '第一夜：新手指引',
    description: '欢迎来到夜间书店。学习基础操作：移动、收集线索、取书放书。',
    width: 10,
    height: 8,
    maxSteps: 80,
    timeLimit: 600,
    recommendedSteps: 30,
    grid: createGrid(10, 8, [
      [4, 2], [4, 3],
      [6, 4], [6, 5]
    ]),
    playerStart: { x: 1, y: 1 },
    bookshelves: rawShelves,
    books: rawBooks,
    clues: [
      { id: 'clue_001', title: '管理员笔记', description: '《迷雾之子》是奇幻小说，fiction类。标签是fiction的shelf_2是它的家！', position: { x: 2, y: 2 }, collected: false, hintForBook: 'book_001' },
      { id: 'clue_002', title: '分类卡片', description: '历史类书籍应该放在标有history的书架上，shelf_4的位置。', position: { x: 8, y: 5 }, collected: false, hintForBook: 'book_002' }
    ],
    indexCards: [
      { id: 'card_001', position: { x: 5, y: 5 }, bookId: 'book_001', isFixed: false, requiredClueIds: ['clue_001'] },
      { id: 'card_002', position: { x: 6, y: 6 }, bookId: 'book_002', isFixed: false, requiredClueIds: ['clue_002'] }
    ],
    targetBooks: ['book_001', 'book_002']
  };
}

function buildLevel2(): LevelConfig {
  const rawShelves: BookshelfData[] = [
    { id: 'shelf_a', position: { x: 2, y: 2 }, isTarget: false, category: 'science' },
    { id: 'shelf_b', position: { x: 4, y: 2 }, isTarget: true, category: 'literature' },
    { id: 'shelf_c', position: { x: 5, y: 4 }, isTarget: false, category: 'art' },
    { id: 'shelf_d', position: { x: 7, y: 4 }, isTarget: true, category: 'science' },
    { id: 'shelf_e', position: { x: 8, y: 2 }, isTarget: true, category: 'art' },
    { id: 'shelf_f', position: { x: 5, y: 6 }, isTarget: false, category: 'literature' },
    { id: 'shelf_g', position: { x: 8, y: 8 }, isTarget: true, category: 'philosophy' },
    { id: 'shelf_h', position: { x: 10, y: 5 }, isTarget: false, category: 'philosophy' }
  ];
  const rawBooks: BookData[] = [
    { id: 'book_101', name: '百年孤独', category: 'literature', color: 0xe06c75, correctShelfId: 'shelf_b', currentShelfId: 'shelf_a', isPlaced: true },
    { id: 'book_102', name: '时间简史', category: 'science', color: 0x56b6c2, correctShelfId: 'shelf_d', currentShelfId: 'shelf_c', isPlaced: true },
    { id: 'book_103', name: '艺术的故事', category: 'art', color: 0xe5c07b, correctShelfId: 'shelf_e', currentShelfId: 'shelf_f', isPlaced: true },
    { id: 'book_104', name: '存在与时间', category: 'philosophy', color: 0xc678dd, correctShelfId: 'shelf_g', currentShelfId: 'shelf_h', isPlaced: true }
  ];
  rawShelves[0].bookId = 'book_101';
  rawShelves[2].bookId = 'book_102';
  rawShelves[5].bookId = 'book_103';
  rawShelves[7].bookId = 'book_104';

  return {
    id: 'level_02',
    name: '第二夜：书架迷宫',
    description: '书架挡住了道路，需要先收集线索，再按线索找到错放的书。',
    width: 12,
    height: 10,
    maxSteps: 120,
    timeLimit: 600,
    recommendedSteps: 65,
    grid: createGrid(12, 10, [
      [3, 2], [3, 3], [3, 4],
      [6, 1], [6, 2], [6, 3], [6, 5], [6, 6], [6, 7],
      [9, 3], [9, 4], [9, 5], [9, 6],
      [2, 7], [3, 7], [4, 7]
    ]),
    playerStart: { x: 1, y: 1 },
    bookshelves: rawShelves,
    books: rawBooks,
    clues: [
      { id: 'clue_101', title: '文学标签', description: 'shelf_b标着literature，是放《百年孤独》的目标书架。', position: { x: 2, y: 4 }, collected: false, hintForBook: 'book_101' },
      { id: 'clue_102', title: '科学徽章', description: 'shelf_d在最深处，放着《时间简史》这类物理/宇宙书籍。', position: { x: 5, y: 2 }, collected: false, hintForBook: 'book_102' },
      { id: 'clue_103', title: '画廊海报', description: 'shelf_e曾是小型画廊的角落，现在是art类书籍专区。', position: { x: 10, y: 2 }, collected: false, hintForBook: 'book_103' },
      { id: 'clue_104', title: '哲学期刊', description: '最右下角的shelf_g是哲学专区，靠近读者休息区。', position: { x: 5, y: 8 }, collected: false, hintForBook: 'book_104' }
    ],
    indexCards: [
      { id: 'card_101', position: { x: 2, y: 5 }, bookId: 'book_101', isFixed: false, requiredClueIds: ['clue_101'] },
      { id: 'card_102', position: { x: 7, y: 6 }, bookId: 'book_102', isFixed: false, requiredClueIds: ['clue_102'] },
      { id: 'card_103', position: { x: 10, y: 8 }, bookId: 'book_103', isFixed: false, requiredClueIds: ['clue_103'] },
      { id: 'card_104', position: { x: 9, y: 8 }, bookId: 'book_104', isFixed: false, requiredClueIds: ['clue_104'] }
    ],
    targetBooks: ['book_101', 'book_102', 'book_103', 'book_104']
  };
}

function buildLevel3(): LevelConfig {
  const shelves: BookshelfData[] = [
    { id: 't_shelf_1', position: { x: 2, y: 2 }, isTarget: true, category: 'mystery' },
    { id: 't_shelf_2', position: { x: 6, y: 1 }, isTarget: false, category: 'romance' },
    { id: 't_shelf_3', position: { x: 8, y: 2 }, isTarget: true, category: 'scifi' },
    { id: 't_shelf_4', position: { x: 5, y: 4 }, isTarget: false, category: 'biography' },
    { id: 't_shelf_5', position: { x: 10, y: 2 }, isTarget: true, category: 'romance' },
    { id: 't_shelf_6', position: { x: 3, y: 7 }, isTarget: false, category: 'mystery' },
    { id: 't_shelf_7', position: { x: 5, y: 6 }, isTarget: true, category: 'biography' },
    { id: 't_shelf_8', position: { x: 10, y: 7 }, isTarget: true, category: 'scifi' },
    { id: 't_shelf_9', position: { x: 8, y: 10 }, isTarget: false, category: 'cooking' },
    { id: 't_shelf_10', position: { x: 11, y: 10 }, isTarget: true, category: 'cooking' },
    { id: 't_shelf_11', position: { x: 1, y: 10 }, isTarget: false, category: 'general' },
    { id: 't_shelf_12', position: { x: 12, y: 5 }, isTarget: false, category: 'general' }
  ];

  const books: BookData[] = [
    { id: 't_book_1', name: '福尔摩斯探案集', category: 'mystery', color: 0xe06c75, correctShelfId: 't_shelf_1', currentShelfId: 't_shelf_2', isPlaced: true },
    { id: 't_book_2', name: '傲慢与偏见', category: 'romance', color: 0xff85a8, correctShelfId: 't_shelf_5', currentShelfId: 't_shelf_4', isPlaced: true },
    { id: 't_book_3', name: '基地', category: 'scifi', color: 0x56b6c2, correctShelfId: 't_shelf_3', currentShelfId: 't_shelf_6', isPlaced: true },
    { id: 't_book_4', name: '乔布斯传', category: 'biography', color: 0xe5c07b, correctShelfId: 't_shelf_7', currentShelfId: 't_shelf_9', isPlaced: true },
    { id: 't_book_5', name: '沙丘', category: 'scifi', color: 0x98c379, correctShelfId: 't_shelf_8', currentShelfId: 't_shelf_11', isPlaced: true },
    { id: 't_book_6', name: '米其林主厨秘方', category: 'cooking', color: 0xd19a66, correctShelfId: 't_shelf_10', currentShelfId: 't_shelf_12', isPlaced: true }
  ];

  const shelfBookMap: Record<string, string> = {};
  books.forEach(book => {
    if (book.currentShelfId) {
      shelfBookMap[book.currentShelfId] = book.id;
    }
  });
  shelves.forEach(shelf => {
    if (shelfBookMap[shelf.id]) {
      shelf.bookId = shelfBookMap[shelf.id];
    }
  });

  return {
    id: 'level_03',
    name: '第三夜：终极考验',
    description: '大型书店的最后一夜，6本错放的书等待被找到并归位。',
    width: 14,
    height: 12,
    maxSteps: 180,
    timeLimit: 600,
    recommendedSteps: 110,
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
    bookshelves: shelves,
    books: books,
    clues: [
      { id: 't_clue_1', title: '侦探角标记', description: '《福尔摩斯》在入口左侧的t_shelf_1（侦探小说专架）。', position: { x: 3, y: 1 }, collected: false, hintForBook: 't_book_1' },
      { id: 't_clue_2', title: '读者留言', description: '《傲慢与偏见》常被窗边的t_shelf_5书架，标签romance。', position: { x: 12, y: 2 }, collected: false, hintForBook: 't_book_2' },
      { id: 't_clue_3', title: '科幻指南', description: '《基地》是经典科幻，t_shelf_3书架的scifi标签。', position: { x: 7, y: 1 }, collected: false, hintForBook: 't_book_3' },
      { id: 't_clue_4', title: '人物专区', description: '传记类书在中央灯柱旁的t_shelf_7。', position: { x: 5, y: 5 }, collected: false, hintForBook: 't_book_4' },
      { id: 't_clue_5', title: '新到通知', description: '《沙丘》刚到，被临时放在t_shelf_8科幻区。', position: { x: 11, y: 6 }, collected: false, hintForBook: 't_book_5' },
      { id: 't_clue_6', title: '美食角', description: '烹饪书的家在最内侧的t_shelf_10书架。', position: { x: 12, y: 10 }, collected: false, hintForBook: 't_book_6' }
    ],
    indexCards: [
      { id: 't_card_1', position: { x: 2, y: 3 }, bookId: 't_book_1', isFixed: false, requiredClueIds: ['t_clue_1'] },
      { id: 't_card_2', position: { x: 11, y: 1 }, bookId: 't_book_2', isFixed: false, requiredClueIds: ['t_clue_2'] },
      { id: 't_card_3', position: { x: 9, y: 1 }, bookId: 't_book_3', isFixed: false, requiredClueIds: ['t_clue_3'] },
      { id: 't_card_4', position: { x: 5, y: 7 }, bookId: 't_book_4', isFixed: false, requiredClueIds: ['t_clue_4'] },
      { id: 't_card_5', position: { x: 11, y: 7 }, bookId: 't_book_5', isFixed: false, requiredClueIds: ['t_clue_5'] },
      { id: 't_card_6', position: { x: 10, y: 9 }, bookId: 't_book_6', isFixed: false, requiredClueIds: ['t_clue_6'] }
    ],
    targetBooks: ['t_book_1', 't_book_2', 't_book_3', 't_book_4', 't_book_5', 't_book_6']
  };
}

export const demoLevels: LevelConfig[] = [
  buildLevel1(),
  buildLevel2(),
  buildLevel3()
];
