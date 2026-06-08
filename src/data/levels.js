export const LEVELS = [
  {
    id: 0,
    name: '第一章 · 春晓',
    cipai: '五言绝句',
    difficulty: 1,
    description: '春眠不觉晓，处处闻啼鸟。',
    poet: '孟浩然',
    dynasty: '唐',
    background: 'mountain',
    tonesPattern: ['平仄仄平仄', '仄仄平平仄'],
    imageries: ['春', '眠', '鸟', '晓'],
    puzzle: {
      mode: 'fill',
      lines: [
        {
          text: '春眠不觉晓',
          pattern: '平仄仄平仄',
          blanks: [2, 3],
          hints: ['不知不觉', '天亮']
        },
        {
          text: '处处闻啼鸟',
          pattern: '仄仄平平仄',
          blanks: [3],
          hints: ['鸟叫']
        }
      ],
      options: ['觉', '晓', '啼', '知', '明', '叫', '飞', '鸣'],
      correctAnswers: ['觉', '晓', '啼']
    },
    learningCard: {
      id: 'card_0',
      title: '五言绝句',
      content: '五言绝句是中国传统诗歌体裁之一，简称五绝。每首四句，每句五个字，共二十字。全篇讲究平仄、押韵，是近体诗的重要形式。',
      keyPoints: [
        '每首四句，每句五字',
        '二四句必押韵',
        '讲究平仄交替'
      ]
    },
    scoreTarget: 80,
    timeLimit: 120
  },
  {
    id: 1,
    name: '第二章 · 静夜思',
    cipai: '五言绝句',
    difficulty: 1,
    description: '床前明月光，疑是地上霜。',
    poet: '李白',
    dynasty: '唐',
    background: 'mountain',
    tonesPattern: ['平平平仄平', '平仄仄仄平'],
    imageries: ['月', '霜', '床', '光'],
    puzzle: {
      mode: 'reorder',
      lines: [
        {
          text: '床前明月光',
          pattern: '平平平仄平',
          chars: ['床', '前', '明', '月', '光'],
          shuffled: ['月', '床', '光', '前', '明']
        },
        {
          text: '疑是地上霜',
          pattern: '平仄仄仄平',
          chars: ['疑', '是', '地', '上', '霜'],
          shuffled: ['上', '霜', '疑', '地', '是']
        }
      ],
      hints: ['李白思乡名作', '月光如霜']
    },
    learningCard: {
      id: 'card_1',
      title: '李白',
      content: '李白（701年—762年），字太白，号青莲居士，又号"谪仙人"，唐代伟大的浪漫主义诗人，被后人誉为"诗仙"。',
      keyPoints: [
        '字太白，号青莲居士',
        '诗仙',
        '浪漫主义诗歌代表'
      ]
    },
    scoreTarget: 90,
    timeLimit: 150
  },
  {
    id: 2,
    name: '第三章 · 登鹳雀楼',
    cipai: '五言绝句',
    difficulty: 2,
    description: '白日依山尽，黄河入海流。',
    poet: '王之涣',
    dynasty: '唐',
    background: 'mountain',
    tonesPattern: ['仄仄平平仄', '平平仄仄平'],
    imageries: ['日', '山', '河', '海', '楼'],
    puzzle: {
      mode: 'choice',
      lines: [
        {
          text: '白日依山尽',
          pattern: '仄仄平平仄',
          question: '填入合适的字：白日_山尽',
          choices: ['依', '靠', '傍', '临'],
          correct: 0
        },
        {
          text: '黄河入海流',
          pattern: '平平仄仄平',
          question: '填入合适的字：黄河入_流',
          choices: ['海', '江', '河', '湖'],
          correct: 0
        }
      ],
      hints: ['鹳雀楼在山西', '壮阔的自然景象']
    },
    learningCard: {
      id: 'card_2',
      title: '平仄格律',
      content: '平仄是中国诗词中用字的声调。平指平直，仄指曲折。古代汉语有四种声调：平、上、去、入。除平声外，其余三声总称仄声。',
      keyPoints: [
        '平声：平直，第一、二声',
        '上声：上扬，第三声',
        '去声：下降，第四声',
        '入声：短促，已消失于普通话'
      ]
    },
    scoreTarget: 100,
    timeLimit: 180
  },
  {
    id: 3,
    name: '第四章 · 江雪',
    cipai: '五言绝句',
    difficulty: 2,
    description: '千山鸟飞绝，万径人踪灭。',
    poet: '柳宗元',
    dynasty: '唐',
    background: 'mountain',
    tonesPattern: ['平平仄平仄', '仄仄平平仄'],
    imageries: ['山', '雪', '鸟', '人', '江'],
    puzzle: {
      mode: 'fill',
      lines: [
        {
          text: '千山鸟飞绝',
          pattern: '平平仄平仄',
          blanks: [1, 4],
          hints: ['众多山峦', '尽、消失']
        },
        {
          text: '万径人踪灭',
          pattern: '仄仄平平仄',
          blanks: [1, 3, 4],
          hints: ['道路', '人的踪迹', '消失']
        }
      ],
      options: ['山', '绝', '径', '踪', '灭', '峰', '影', '迹', '路', '消'],
      correctAnswers: ['山', '绝', '径', '踪', '灭']
    },
    learningCard: {
      id: 'card_3',
      title: '意象·山',
      content: '在中国古典诗词中，"山"是一个重要的意象。它可以象征高远、隐逸、坚韧，也可以表达思乡、离愁等情感。山水诗更是中国诗歌的重要流派。',
      keyPoints: [
        '象征坚韧不拔',
        '常与隐逸相关',
        '山水画派影响诗歌'
      ]
    },
    scoreTarget: 120,
    timeLimit: 180
  },
  {
    id: 4,
    name: '第五章 · 相思',
    cipai: '五言绝句',
    difficulty: 3,
    description: '红豆生南国，春来发几枝。',
    poet: '王维',
    dynasty: '唐',
    background: 'bamboo',
    tonesPattern: ['平仄平平仄', '平平仄仄平'],
    imageries: ['红豆', '春', '南国', '相思'],
    puzzle: {
      mode: 'mixed',
      lines: [
        {
          text: '红豆生南国',
          pattern: '平仄平平仄',
          blanks: [0, 3],
          hints: ['相思豆', '南方']
        }
      ],
      reorderLines: [
        {
          text: '春来发几枝',
          pattern: '平平仄仄平',
          chars: ['春', '来', '发', '几', '枝'],
          shuffled: ['几', '春', '枝', '发', '来']
        }
      ],
      options: ['红', '豆', '南', '国', '绿', '叶', '北', '疆'],
      correctAnswers: ['红', '豆', '国']
    },
    learningCard: {
      id: 'card_4',
      title: '王维',
      content: '王维（701年—761年），字摩诘，号摩诘居士。唐代著名诗人、画家。其诗多咏山水田园，与孟浩然合称"王孟"，有"诗佛"之称。',
      keyPoints: [
        '诗佛',
        '山水田园诗代表',
        '诗中有画，画中有诗'
      ]
    },
    scoreTarget: 150,
    timeLimit: 200
  },
  {
    id: 5,
    name: '第六章 · 望庐山瀑布',
    cipai: '七言绝句',
    difficulty: 3,
    description: '日照香炉生紫烟，遥看瀑布挂前川。',
    poet: '李白',
    dynasty: '唐',
    background: 'mountain',
    tonesPattern: ['仄仄平平平仄平', '平平仄仄仄平平'],
    imageries: ['日', '香炉', '烟', '瀑布', '川'],
    puzzle: {
      mode: 'fill',
      lines: [
        {
          text: '日照香炉生紫烟',
          pattern: '仄仄平平平仄平',
          blanks: [2, 4, 5, 6],
          hints: ['香炉峰', '升起', '紫色', '云雾']
        },
        {
          text: '遥看瀑布挂前川',
          pattern: '平平仄仄仄平平',
          blanks: [0, 2, 3, 5, 6],
          hints: ['远望', '瀑布', '悬挂', '前面', '河流']
        }
      ],
      options: ['炉', '生', '紫', '烟', '遥', '瀑', '布', '挂', '前', '川', '云', '雾'],
      correctAnswers: ['炉', '生', '紫', '烟', '遥', '瀑', '布', '挂', '前', '川']
    },
    learningCard: {
      id: 'card_5',
      title: '七言绝句',
      content: '七言绝句是绝句的一种，简称七绝。每首四句，每句七个字，共二十八字。是唐代最流行的诗歌体裁之一。',
      keyPoints: [
        '每首四句，每句七字',
        '押韵严格',
        '盛唐最流行'
      ]
    },
    scoreTarget: 180,
    timeLimit: 240
  }
]

export const CIPAIS = {
  '五言绝句': {
    name: '五言绝句',
    pattern: '20字',
    description: '四句五言',
    rhymeScheme: '二四句押平韵'
  },
  '七言绝句': {
    name: '七言绝句',
    pattern: '28字',
    description: '四句七言',
    rhymeScheme: '二四句押平韵'
  },
  '五言律诗': {
    name: '五言律诗',
    pattern: '40字',
    description: '八句五言',
    rhymeScheme: '二四六八句押平韵'
  },
  '七言律诗': {
    name: '七言律诗',
    pattern: '56字',
    description: '八句七言',
    rhymeScheme: '二四六八句押平韵'
  }
}

export function getLevelById(id) {
  return LEVELS.find(level => level.id === id) || null
}

export function getTotalLevels() {
  return LEVELS.length
}

export function getNextLevelId(currentId) {
  const idx = LEVELS.findIndex(l => l.id === currentId)
  if (idx >= 0 && idx < LEVELS.length - 1) {
    return LEVELS[idx + 1].id
  }
  return null
}
