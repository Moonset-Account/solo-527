// ========================================================
// 游戏数据配置 - 物品/笔记/谜题/章节/房间
// ========================================================

// ============ 物品数据 ============
export const ITEMS = {
  ITEM_001: {
    id: 'ITEM_001',
    displayName: '半旧的毛巾',
    description: '叠得很整齐，边角有些磨毛。',
    icon: '🧺',
    mesh: 'towel',
    color: '#D8C8A0',
    bIsPickable: true,
    bIsNote: false,
    examineTexts: [
      '叠得很整齐...似乎很久没人用了。',
      '边角有磨毛的痕迹，用了很多年的样子。',
    ],
    hotspots: [],
  },
  ITEM_002: {
    id: 'ITEM_002',
    displayName: '1998年日历',
    description: '挂在玄关墙上的旧日历。',
    icon: '📅',
    mesh: 'calendar',
    color: '#E8D8B8',
    bIsPickable: false,
    bIsNote: false,
    examineTexts: [
      '一本发黄的1998年日历。',
      '停在7月14日那天...日期上被红笔圈了三次。',
      '「那天...发生了什么？」',
    ],
    hotspots: [],
  },
  NOTE_001: {
    id: 'NOTE_001',
    displayName: '雇佣委托信',
    description: '放在茶几上的一封信。',
    icon: '✉️',
    mesh: 'letter',
    color: '#F5E6C8',
    bIsPickable: true,
    bIsNote: true,
    noteId: 'NOTE_001',
  },
  ITEM_003: {
    id: 'ITEM_003',
    displayName: '泛黄的全家福',
    description: '电视柜抽屉里的照片。',
    icon: '🖼️',
    mesh: 'photo',
    color: '#C8B080',
    bIsPickable: true,
    bIsNote: false,
    examineTexts: [
      '一张全家福，泛黄的边缘。',
      '照片里有三个人：妈妈、爸爸，还有一个扎辫子的小女孩。',
      '翻到背面...手写着：小岚7岁生日，1991年夏。',
    ],
    hotspots: [
      { x: 78, y: 75, text: '背面的数字：1991 —— 这或许是某个密码。' },
    ],
  },
  ITEM_004: {
    id: 'ITEM_004',
    displayName: '老茶罐',
    description: '餐边柜上的空罐子。',
    icon: '🫙',
    mesh: 'jar',
    color: '#8B5A2B',
    bIsPickable: true,
    bIsNote: false,
    examineTexts: [
      '一个锡制的老茶罐，里面已经空了。',
      '罐底有一个手工刻的数字「7」。',
    ],
    hotspots: [],
  },
  NOTE_002: {
    id: 'NOTE_002',
    displayName: '冰箱便签',
    description: '贴在冰箱上的购物清单。',
    icon: '📝',
    mesh: 'notepaper',
    color: '#FFFAE8',
    bIsPickable: true,
    bIsNote: true,
    noteId: 'NOTE_002',
  },
  ITEM_005: {
    id: 'ITEM_005',
    displayName: '黑色长柄伞',
    description: '伞桶里的雨伞。',
    icon: '☂️',
    mesh: 'umbrella',
    color: '#1A1A1A',
    bIsPickable: true,
    bIsNote: false,
    examineTexts: [
      '一把老式黑色长柄伞。',
      '仔细看，伞骨有一根断了，用细铁丝绑着。',
      '「这种伤...像是被强风夹着吹向硬物过。」',
    ],
    hotspots: [],
  },
  ITEM_006: {
    id: 'ITEM_006',
    displayName: '走廊钥匙',
    description: '藏在书架后的铜钥匙。',
    icon: '🔑',
    mesh: 'key',
    color: '#CD9B1D',
    bIsPickable: true,
    bIsNote: false,
    examineTexts: ['一把黄铜色的旧钥匙，上面写着「走廊」。'],
    hotspots: [],
    unlocksDoor: 'DOOR_HALLWAY',
  },
  ITEM_101: {
    id: 'ITEM_101',
    displayName: '安眠药瓶',
    description: '卫生间药柜里的药瓶。',
    icon: '💊',
    mesh: 'pillbottle',
    color: '#F5F5DC',
    bIsPickable: true,
    examineTexts: [
      '处方安眠药，标签上写着「睡前一片」。',
      '还有大半瓶...她应该不怎么吃。',
    ],
  },
  NOTE_101: {
    id: 'NOTE_101',
    displayName: '日记本·1998',
    description: '床头柜抽屉里的旧日记本。',
    icon: '📔',
    mesh: 'diary',
    color: '#6B4423',
    bIsPickable: true,
    bIsNote: true,
    noteId: 'NOTE_101',
  },
  NOTE_103: {
    id: 'NOTE_103',
    displayName: '新日记本',
    description: 'CD机里发现的薄薄新本子。',
    icon: '📓',
    mesh: 'diary2',
    color: '#8A9AA8',
    bIsPickable: true,
    bIsNote: true,
    noteId: 'NOTE_103',
  },
  ITEM_104: {
    id: 'ITEM_104',
    displayName: '梳妆台钥匙',
    description: '大衣口袋里的小钥匙。',
    icon: '🗝️',
    mesh: 'key2',
    color: '#B08040',
    bIsPickable: true,
    unlocksPuzzle: 'PUZZLE_002_KEY',
  },
  NOTE_102: {
    id: 'NOTE_102',
    displayName: '失踪报案回执',
    description: '梳妆台抽屉里的发黄文件。',
    icon: '📄',
    mesh: 'paper',
    color: '#F0E0C0',
    bIsPickable: true,
    bIsNote: true,
    noteId: 'NOTE_102',
    bIsEvidence: true,
  },
  ITEM_105: {
    id: 'ITEM_105',
    displayName: '地下室钥匙',
    description: '报案回执信封里的钥匙。',
    icon: '🔐',
    mesh: 'key3',
    color: '#806040',
    bIsPickable: true,
    unlocksDoor: 'DOOR_BASEMENT',
  },
  ITEM_201: {
    id: 'ITEM_201',
    displayName: '蓝色雨衣',
    description: '旧箱子里叠放整齐的雨衣。',
    icon: '🧥',
    mesh: 'raincoat',
    color: '#4A90D9',
    bIsPickable: true,
  },
  NOTE_201: {
    id: 'NOTE_201',
    displayName: '粉色太阳画',
    description: '压在雨衣下的蜡笔画。',
    icon: '🎨',
    mesh: 'drawing',
    color: '#FFE0E0',
    bIsPickable: true,
    bIsNote: true,
    noteId: 'NOTE_201',
    bIsEvidence: true,
  },
};

// ============ 笔记内容 ============
export const NOTES = {
  NOTE_001: {
    id: 'NOTE_001',
    title: '雇佣委托信',
    author: '陈志远',
    dateStr: '2026年7月10日',
    mood: 'neutral',
    pages: [
      `遗物整理师 敬启：

家母林慧兰 于上月18日病逝，
生前独居建国南路二段37号5楼。
她未曾留下遗嘱，屋内物品烦请
于七日内整理完毕，有价值物品
请列出清单供家属认领。

付款将于验收完成后汇入户头。

                                                        委托人 陈志远 签章`,
    ],
    relatedPuzzleId: null,
    bIsEvidence: false,
  },
  NOTE_002: {
    id: 'NOTE_002',
    title: '冰箱上的便签',
    author: '林女士',
    dateStr: '无日期',
    mood: 'tense',
    pages: [
      `13日晚 要买：
- 阳春面（一包不够）
- 鸡蛋（要土鸡蛋）
- 牛奶（全脂的小岚才喝）
- 感冒药（那个蓝色盒的）
- 4号电池×4（小岚的CD机）

明天雨大，记得带伞。
别留她一个人在家太久...`,
    ],
    relatedPuzzleId: 'PUZZLE_001',
    bIsEvidence: false,
  },
  NOTE_101: {
    id: 'NOTE_101',
    title: '林慧兰的日记本',
    author: '林慧兰',
    dateStr: '1998年7月',
    mood: 'somber',
    pages: [
      `7月10日

小岚说暑假想去海边。
我说好，等发了薪水就带她去。
她画了一张画给我，画里我们俩
站在沙滩上，太阳是粉色的。`,

      `7月13日

今晚要加班，她一个人在家。
留了字条让她先吃饭。
雨下得很大，心里总不踏实。
买了她爱喝的牛奶，明天回去给她。`,

      `7月14日

她不在了。
警察说监控里，她最后是往地铁站
方向走的，说要给我送伞。

地铁出口是14号口。
她总是记不住4号，总是走14号。

是我的错。
是我的错。
是我的错。`,
    ],
    relatedPuzzleId: 'PUZZLE_002',
    bIsEvidence: true,
  },
  NOTE_103: {
    id: 'NOTE_103',
    title: '新日记本',
    author: '林慧兰',
    dateStr: '2020年',
    mood: 'somber',
    pages: [
      `整理旧物时翻到了小岚的CD机，
电池早烂了，机芯也锈了。

可我还是想修好它。
想再听一次她常听的那首歌。

二十二年了。
每一天我都在想，
如果那天我没有加班，
如果那天我接她放学，
如果...`,
    ],
    relatedPuzzleId: null,
  },
  NOTE_102: {
    id: 'NOTE_102',
    title: '失踪人口报案登记表',
    author: '警察局',
    dateStr: '1998年7月15日',
    mood: 'urgent',
    pages: [
      `━━━━━━━━━━━━━━━━━━━━━━━━
          失踪人口报案登记表
━━━━━━━━━━━━━━━━━━━━━━━━

姓    名：林小岚
性    别：女
年    龄：14 岁
身    高：156 cm

最后出现地点：建国南路地铁站14号口外
最后出现时间：1998年7月13日 22:47

衣着特征：
- 蓝色雨衣（带白色圆点）
- 绿色雨靴
- 背粉色双肩包

携带物品：
- 黑色长柄伞（一把伞骨折断，铁丝绑）

备    注：
当日暴雨，监控画面模糊。
案件编号：7814-B-1998

━━━━━━━━━━━━━━━━━━━━━━━━
承办警员：XXX  XXX  签章`,
    ],
    relatedPuzzleId: 'PUZZLE_003',
    bIsEvidence: true,
  },
  NOTE_201: {
    id: 'NOTE_201',
    title: '粉色太阳的画',
    author: '林小岚（10岁时）',
    dateStr: '1994年夏',
    mood: 'cryptic',
    pages: [
      `（一幅蜡笔画）

蓝色的海，金色的沙滩。
两个小人牵着手站在岸边。
天空画着一个粉色的太阳，
周围还画了一圈小心心。

画的角落歪歪扭扭写着：
"我和妈妈的海边"`,

      `（翻到背面）

用铅笔写着一行字，
被眼泪晕开，有些模糊：

「妈妈，我没有迷路。
 我只是走得太远了，
 你要好好吃饭。
 想你。

            小岚」`,
    ],
    relatedPuzzleId: null,
    bIsEvidence: true,
  },
};

// ============ 锁谜题数据 ============
export const PUZZLES = {
  PUZZLE_001: {
    id: 'PUZZLE_001',
    displayName: 'CD机密码锁',
    lockType: 'digit',
    digitCount: 4,
    password: [1, 9, 9, 1],
    hintText: '小岚最爱的那张CD，是她7岁生日那年买的...',
    failFeedback: '数字不对，CD机没有反应...',
    maxAttempts: 4,
    rewardItemId: 'NOTE_103',
    unlocksDoor: null,
    onSolveText: 'CD机舱门缓缓弹开，里面夹着一本薄薄的新本子...',
    shakeOnFail: 0.6,
  },
  PUZZLE_002: {
    id: 'PUZZLE_002',
    displayName: '梳妆台抽屉锁',
    lockType: 'digit',
    digitCount: 3,
    password: [7, 1, 4],
    hintText: '那一天，她永远记得。日历上被红笔圈了三次的日子...',
    failFeedback: '锁纹丝不动。',
    maxAttempts: 3,
    rewardItemId: 'NOTE_102',
    unlocksDoor: null,
    onSolveText: '抽屉开了。一份泛黄的旧文件静静躺在里面...',
    shakeOnFail: 1.2,
    requiresItem: 'ITEM_104',
  },
  PUZZLE_003: {
    id: 'PUZZLE_003',
    displayName: '旧箱子密码锁',
    lockType: 'digit',
    digitCount: 6,
    password: [7, 8, 1, 4, 9, 8],
    hintText: '案件编号：7814-B-1998。她说过，那是"事件的生日"...',
    failFeedback: '箱盖沉重，纹丝不动。',
    maxAttempts: 5,
    rewardItemId: 'ITEM_201',
    unlocksDoor: 'DOOR_BACKALLEY',
    onSolveText: '箱子开了。里面叠得整整齐齐的蓝色雨衣，旁边压着一幅画...',
    shakeOnFail: 1.5,
  },
};

// ============ 章节与目标 ============
export const CHAPTERS = [
  {
    id: 1,
    title: '尘封的客厅',
    subtitle: '第 一 章',
    description: '整理租客留下的物品，熟悉这栋旧公寓的布局。留意墙上的日历和每一张纸。',
    levelId: 'LivingRoom',
    requiredItems: [],
    ambientSound: 'Ambient_Apartment_Lobby',
    bgGradient: ['#3a2e22', '#1a1612'],
    objectives: [
      { id: 'OBJ_001', desc: '阅读茶几上的雇佣信', type: 'ReadNote', value: 'NOTE_001', required: true },
      { id: 'OBJ_002', desc: '检查电视柜抽屉里的照片', type: 'ExamineItem', value: 'ITEM_003', required: true },
      { id: 'OBJ_003', desc: '阅读冰箱上的购物清单', type: 'ReadNote', value: 'NOTE_002', required: true },
      { id: 'OBJ_004', desc: '在书架后找到走廊钥匙', type: 'CollectItem', value: 'ITEM_006', required: true },
      { id: 'OBJ_005', desc: '打开走廊门进入卧室区域', type: 'EnterRoom', value: 'ROOM_HALLWAY', required: true },
      { id: 'OBJ_006', desc: '收集至少 4 件物品（可选）', type: 'CollectCount', value: 4, required: false },
    ],
  },
  {
    id: 2,
    title: '封闭的卧室',
    subtitle: '第 二 章',
    description: '进入私人空间，日记和锁着的抽屉里，藏着二十二年前的真相。',
    levelId: 'Bedroom',
    requiredItems: [],
    ambientSound: 'Ambient_Apartment_Night',
    bgGradient: ['#2a2830', '#12121a'],
    objectives: [
      { id: 'OBJ_101', desc: '阅读床头柜里的旧日记', type: 'ReadNote', value: 'NOTE_101', required: true },
      { id: 'OBJ_102', desc: '解开CD机的密码锁', type: 'SolvePuzzle', value: 'PUZZLE_001', required: true },
      { id: 'OBJ_103', desc: '阅读CD机里的新日记', type: 'ReadNote', value: 'NOTE_103', required: true },
      { id: 'OBJ_104', desc: '找到梳妆台钥匙', type: 'CollectItem', value: 'ITEM_104', required: true },
      { id: 'OBJ_105', desc: '解开梳妆台抽屉锁', type: 'SolvePuzzle', value: 'PUZZLE_002', required: true },
      { id: 'OBJ_106', desc: '阅读失踪报案回执', type: 'ReadNote', value: 'NOTE_102', required: true },
      { id: 'OBJ_107', desc: '取得地下室钥匙', type: 'CollectItem', value: 'ITEM_105', required: true },
    ],
  },
  {
    id: 3,
    title: '深夜的地下',
    subtitle: '第 三 章',
    description: '暴雨中的地下室，旧箱子里封存着最后的答案。',
    levelId: 'Basement',
    requiredItems: [],
    ambientSound: 'Ambient_Rain_Heavy',
    bgGradient: ['#1a2028', '#080c10'],
    objectives: [
      { id: 'OBJ_201', desc: '进入地下室', type: 'EnterRoom', value: 'ROOM_BASEMENT', required: true },
      { id: 'OBJ_202', desc: '解开旧箱子的六位密码锁', type: 'SolvePuzzle', value: 'PUZZLE_003', required: true },
      { id: 'OBJ_203', desc: '取出蓝色雨衣', type: 'CollectItem', value: 'ITEM_201', required: true },
      { id: 'OBJ_204', desc: '阅读画背面的文字', type: 'ReadNote', value: 'NOTE_201', required: true },
      { id: 'OBJ_205', desc: '打开后巷门，走出旧公寓', type: 'EnterRoom', value: 'ROOM_BACKALLEY', required: true },
    ],
  },
];

// ============ 房间/关卡 布局（俯视地图） ============
// 每个关卡: 2D网格 + 可交互物坐标 + 门连接
// 网格大小: 40x25 单位 (每单位 = 30px)

export const LEVELS = {
  LivingRoom: {
    id: 'LivingRoom',
    chapterId: 1,
    gridWidth: 40,
    gridHeight: 25,
    // 墙壁 (矩形 [x,y,w,h])
    walls: [
      [0, 0, 40, 1], [0, 24, 40, 1],
      [0, 0, 1, 25], [39, 0, 1, 25],
      // 玄关与客厅分隔(不完整)
      [10, 1, 1, 8],
      // 厨房入口墙
      [28, 14, 12, 1],
      [28, 14, 1, 10],
    ],
    // 地板区域装饰
    floorZones: [
      { name: '玄关', x: 1, y: 1, w: 9, h: 23, color: '#6B5338' },
      { name: '客厅', x: 11, y: 1, w: 27, h: 13, color: '#70583D' },
      { name: '餐厅', x: 11, y: 15, w: 17, h: 9, color: '#6A5038' },
      { name: '厨房入口', x: 29, y: 15, w: 10, h: 9, color: '#584840' },
    ],
    // 玩家出生点
    spawn: { x: 5, y: 12 },
    // 物品 (物品ID, 位置 x, y, 房间名)
    items: [
      { itemId: 'ITEM_001', x: 3, y: 5, room: 'ROOM_ENTRANCE' },
      { itemId: 'ITEM_002', x: 2, y: 10, room: 'ROOM_ENTRANCE' },
      { itemId: 'ITEM_005', x: 8, y: 18, room: 'ROOM_ENTRANCE' },
      { itemId: 'NOTE_001', x: 18, y: 8, room: 'ROOM_LIVING' },
      { itemId: 'ITEM_003', x: 26, y: 5, room: 'ROOM_LIVING' },
      { itemId: 'ITEM_004', x: 14, y: 20, room: 'ROOM_DINING' },
      { itemId: 'NOTE_002', x: 35, y: 18, room: 'ROOM_KITCHEN' },
      { itemId: 'ITEM_006', x: 32, y: 8, hidden: true, room: 'ROOM_LIVING' },
    ],
    // 门
    doors: [
      { id: 'DOOR_HALLWAY', x: 39, y: 10, w: 1, h: 4, toLevel: 'Bedroom', toSpawn: { x: 2, y: 12 },
        toRoom: 'ROOM_HALLWAY', locked: true, keyItem: 'ITEM_006', name: '通往走廊的门' },
    ],
    // 触发区 (进入房间)
    roomTriggers: [
      { id: 'ROOM_ENTRANCE', rect: [0,0,10,25], name: '玄关' },
      { id: 'ROOM_LIVING',   rect: [11,0,28,14], name: '客厅' },
      { id: 'ROOM_DINING',   rect: [11,14,18,11], name: '餐厅' },
      { id: 'ROOM_KITCHEN',  rect: [29,14,11,11], name: '厨房入口' },
    ],
  },

  Bedroom: {
    id: 'Bedroom',
    chapterId: 2,
    gridWidth: 40,
    gridHeight: 25,
    walls: [
      [0, 0, 40, 1], [0, 24, 40, 1],
      [0, 0, 1, 25], [39, 0, 1, 25],
      // 走廊隔墙
      [4, 1, 1, 10], [4, 14, 1, 10],
      // 主卧室与卫生间
      [20, 1, 1, 11],
      [4, 12, 17, 1],
      // 女儿房墙
      [20, 13, 1, 11],
    ],
    floorZones: [
      { name: '走廊',  x: 1,  y: 1,  w: 3,  h: 23, color: '#584838' },
      { name: '主卧室', x: 5, y: 1, w: 15, h: 11, color: '#6A5848' },
      { name: '卫生间', x: 5, y: 13, w: 15, h: 11, color: '#505860' },
      { name: '女儿房', x: 21, y: 1, w: 18, h: 11, color: '#685060' },
      { name: '楼梯间', x: 21, y: 13, w: 18, h: 11, color: '#483830' },
    ],
    spawn: { x: 2, y: 12 },
    items: [
      { itemId: 'NOTE_101', x: 8, y: 8, room: 'ROOM_MASTER' },
      { itemId: 'PUZZLE_001', x: 28, y: 7, isPuzzle: true, room: 'ROOM_DAUGHTER' },
      { itemId: 'ITEM_101', x: 10, y: 18, room: 'ROOM_BATHROOM' },
      { itemId: 'ITEM_104', x: 15, y: 6, hidden: true, room: 'ROOM_MASTER' },
      { itemId: 'PUZZLE_002', x: 12, y: 4, isPuzzle: true, requires: 'ITEM_104', room: 'ROOM_MASTER' },
      { itemId: 'ITEM_105', x: 11, y: 3, hidden: true, room: 'ROOM_MASTER' },
    ],
    doors: [
      { id: 'DOOR_BACK_LIVING', x: 0, y: 10, w: 1, h: 4, toLevel: 'LivingRoom', toSpawn: { x: 37, y: 11 },
        toRoom: 'ROOM_LIVING', locked: false, name: '返回客厅' },
      { id: 'DOOR_BASEMENT', x: 38, y: 18, w: 1, h: 4, toLevel: 'Basement', toSpawn: { x: 3, y: 12 },
        toRoom: 'ROOM_BASEMENT', locked: true, keyItem: 'ITEM_105', name: '通往地下室的门' },
    ],
    roomTriggers: [
      { id: 'ROOM_HALLWAY',  rect: [0,0,5,25], name: '走廊' },
      { id: 'ROOM_MASTER',   rect: [5,0,16,12], name: '主卧室' },
      { id: 'ROOM_BATHROOM', rect: [5,12,16,13], name: '卫生间' },
      { id: 'ROOM_DAUGHTER', rect: [21,0,19,12], name: '女儿的房间' },
      { id: 'ROOM_STAIRS',   rect: [21,12,19,13], name: '楼梯间' },
    ],
  },

  Basement: {
    id: 'Basement',
    chapterId: 3,
    gridWidth: 40,
    gridHeight: 25,
    walls: [
      [0, 0, 40, 1], [0, 24, 40, 1],
      [0, 0, 1, 25], [39, 0, 1, 25],
      // 储物间
      [14, 1, 1, 8], [14, 1, 12, 1],
      // 地下室分隔
      [20, 10, 1, 15],
    ],
    floorZones: [
      { name: '厨房后',  x: 1,  y: 1,  w: 13, h: 23, color: '#484038' },
      { name: '储物间',  x: 15, y: 2,  w: 10, h: 8,  color: '#3C3430' },
      { name: '地下室',  x: 1,  y: 10, w: 19, h: 14, color: '#2C3034' },
      { name: '深处',    x: 21, y: 10, w: 18, h: 14, color: '#1E2226' },
    ],
    spawn: { x: 3, y: 12 },
    items: [
      { itemId: 'PUZZLE_003', x: 32, y: 18, isPuzzle: true, room: 'ROOM_DEEP' },
      { itemId: 'NOTE_201', x: 33, y: 17, hidden: true, room: 'ROOM_DEEP' },
    ],
    doors: [
      { id: 'DOOR_BACK_BEDROOM', x: 0, y: 10, w: 1, h: 4, toLevel: 'Bedroom', toSpawn: { x: 36, y: 19 },
        toRoom: 'ROOM_STAIRS', locked: false, name: '返回楼上' },
      { id: 'DOOR_BACKALLEY', x: 39, y: 20, w: 1, h: 4, toLevel: null,
        toRoom: 'ROOM_BACKALLEY', locked: true, name: '后巷门', isEnding: true },
    ],
    roomTriggers: [
      { id: 'ROOM_KITCHEN_BACK', rect: [0,0,15,10], name: '厨房后方' },
      { id: 'ROOM_STORAGE',     rect: [14,0,13,10], name: '储物间' },
      { id: 'ROOM_BASEMENT',    rect: [0,9,21,16], name: '地下室' },
      { id: 'ROOM_DEEP',        rect: [20,9,20,16], name: '地下室深处' },
    ],
  },
};

// ============ 家具装饰物 (视觉) ============
export const DECOR = {
  LivingRoom: [
    { type: 'shoerack', x: 2, y: 3, w: 2, h: 4, label: '鞋架' },
    { type: 'umbrellastand', x: 7, y: 17, w: 2, h: 2, label: '伞桶' },
    { type: 'sofa', x: 14, y: 10, w: 6, h: 3, label: '沙发' },
    { type: 'coffeetable', x: 17, y: 7, w: 3, h: 2, label: '茶几' },
    { type: 'tvcabinet', x: 25, y: 3, w: 4, h: 3, label: '电视柜' },
    { type: 'bookshelf', x: 31, y: 7, w: 3, h: 5, label: '书架' },
    { type: 'window', x: 18, y: 1, w: 5, h: 1, label: '窗' },
    { type: 'diningtable', x: 17, y: 17, w: 4, h: 5, label: '餐桌' },
    { type: 'sideboard', x: 13, y: 19, w: 2, h: 4, label: '餐边柜' },
    { type: 'fridge', x: 34, y: 17, w: 2, h: 3, label: '冰箱' },
  ],
  Bedroom: [
    { type: 'bed_master', x: 6, y: 3, w: 5, h: 6, label: '双人床' },
    { type: 'nightstand', x: 8, y: 7, w: 2, h: 2, label: '床头柜' },
    { type: 'dresser', x: 11, y: 3, w: 3, h: 3, label: '梳妆台' },
    { type: 'wardrobe', x: 17, y: 3, w: 3, h: 6, label: '衣柜' },
    { type: 'desk_daughter', x: 27, y: 5, w: 3, h: 2, label: '书桌(CD机)' },
    { type: 'bed_single', x: 24, y: 8, w: 4, h: 5, label: '单人床' },
    { type: 'toybox', x: 36, y: 9, w: 2, h: 2, label: '玩具箱' },
    { type: 'bookshelf_s', x: 36, y: 3, w: 2, h: 4, label: '小书架' },
    { type: 'sink', x: 7, y: 14, w: 3, h: 2, label: '洗手台' },
    { type: 'bathtub', x: 14, y: 14, w: 4, h: 4, label: '浴缸' },
    { type: 'medicinecabinet', x: 6, y: 17, w: 2, h: 2, label: '药柜' },
  ],
  Basement: [
    { type: 'stove', x: 4, y: 3, w: 3, h: 2, label: '灶台' },
    { type: 'shelves', x: 17, y: 4, w: 7, h: 1, label: '储物架' },
    { type: 'boxes', x: 18, y: 6, w: 6, h: 2, label: '旧纸箱×n' },
    { type: 'pipes', x: 4, y: 20, w: 14, h: 1, label: '水管' },
    { type: 'fuse', x: 23, y: 12, w: 2, h: 3, label: '电闸箱' },
    { type: 'trunk_old', x: 31, y: 17, w: 4, h: 3, label: '旧箱子' },
    { type: 'waterpuddle', x: 10, y: 14, w: 4, h: 3, label: '积水' },
  ],
};
