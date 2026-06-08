import type { CharacterUnit } from '@/types'

const IMAGERY_DATABASE: Record<string, string[]> = {
  '春': ['春景', '生机', '花草'],
  '夏': ['夏景', '炎热', '繁盛'],
  '秋': ['秋景', '萧瑟', '思念'],
  '冬': ['冬景', '寒冷', '寂寥'],
  '月': ['月色', '思念', '孤寂'],
  '风': ['风物', '漂泊', '感慨'],
  '花': ['春景', '美好', '凋零'],
  '雪': ['冬景', '纯洁', '寒冷'],
  '雨': ['愁绪', '润泽', '离别'],
  '柳': ['离别', '春景', '依恋'],
  '山': ['山景', '高远', '隐逸'],
  '水': ['水景', '流动', '愁绪'],
  '云': ['漂泊', '高远', '变幻'],
  '雁': ['思念', '远行', '秋景'],
  '梅': ['冬景', '坚韧', '高洁'],
  '竹': ['高洁', '坚韧', '隐逸'],
  '菊': ['秋景', '高洁', '隐逸'],
  '兰': ['高洁', '幽雅', '隐逸'],
  '酒': ['愁绪', '豪迈', '离别'],
  '愁': ['愁绪', '思念', '感慨'],
  '梦': ['虚幻', '思念', '追忆'],
  '泪': ['悲伤', '离别', '思念'],
  '霜': ['秋景', '寒冷', '萧瑟'],
  '露': ['晨景', '短暂', '润泽'],
  '烟': ['朦胧', '愁绪', '离别'],
  '日': ['壮丽', '光明', '时间'],
  '星': ['夜色', '遥远', '永恒'],
  '叶': ['秋景', '凋零', '离别'],
  '草': ['春景', '生机', '离别'],
  '燕': ['春景', '归家', '相思'],
  '鹤': ['高远', '仙道', '隐逸'],
  '琴': ['音律', '知音', '高雅'],
  '剑': ['豪迈', '征战', '壮志'],
  '笛': ['音律', '思乡', '离别'],
  '楼': ['登临', '远望', '愁绪'],
  '舟': ['漂泊', '远行', '离别'],
  '桥': ['离别', '相聚', '过渡'],
  '红': ['春景', '美好', '相思'],
  '翠': ['春景', '生机', '山景'],
  '寒': ['冬景', '凄凉', '萧瑟'],
  '暮': ['黄昏', '思念', '迟暮'],
  '晓': ['晨景', '希望', '离别'],
  '夜': ['夜色', '思念', '孤寂'],
  '远': ['遥远', '思念', '漂泊'],
  '归': ['归家', '思念', '离别'],
  '思': ['思念', '愁绪', '追忆'],
  '忆': ['追忆', '思念', '往事'],
  '恨': ['怨恨', '遗憾', '离别'],
  '情': ['爱情', '思念', '感慨'],
}

export class ImageryMatcher {
  private imageryDb: Record<string, string[]>

  constructor() {
    this.imageryDb = { ...IMAGERY_DATABASE }
  }

  checkImagery(
    char: string,
    position: number,
    expectedImagery: string[]
  ): { match: boolean; message: string } {
    if (expectedImagery.length === 0) {
      return { match: true, message: '' }
    }

    const charImagery = this.imageryDb[char]
    if (!charImagery) {
      return { match: true, message: '' }
    }

    const hasOverlap = charImagery.some((ci) =>
      expectedImagery.some((ei) => ci.includes(ei) || ei.includes(ci))
    )

    if (hasOverlap) {
      return { match: true, message: '' }
    }

    const charImageryStr = charImagery.join('、')
    const expectedImageryStr = expectedImagery.join('、')
    return {
      match: false,
      message: `此字意象与'${expectedImageryStr}'不合，此句当写${expectedImagery[0]}之景`,
    }
  }

  getCharImagery(char: string): string[] {
    return this.imageryDb[char] || []
  }

  addImagery(char: string, categories: string[]): void {
    if (this.imageryDb[char]) {
      const existing = new Set(this.imageryDb[char])
      for (const c of categories) {
        existing.add(c)
      }
      this.imageryDb[char] = Array.from(existing)
    } else {
      this.imageryDb[char] = [...categories]
    }
  }
}
