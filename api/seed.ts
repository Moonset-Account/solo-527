import { getDb, initSchema, closeDb } from './db.js'

const BRANCHES = [
  { branch_id: 'BR001', branch_name: '中心馆', district: '中心城区' },
  { branch_id: 'BR002', branch_name: '城东分馆', district: '城东区' },
  { branch_id: 'BR003', branch_name: '城西分馆', district: '城西区' },
  { branch_id: 'BR004', branch_name: '城南分馆', district: '城南新区' },
  { branch_id: 'BR005', branch_name: '城北分馆', district: '城北区' },
  { branch_id: 'BR006', branch_name: '科技园分馆', district: '高新区' },
]

const COLLECTION_TYPES = ['文学', '社科', '科技', '少儿', '艺术', '生活']

const THEMES: Record<string, string[]> = {
  '文学': ['中国当代文学', '外国文学', '古典文学', '网络文学', '诗歌散文'],
  '社科': ['历史', '哲学', '心理学', '经济学', '社会学'],
  '科技': ['计算机', '工程', '医学', '自然科学', '数学'],
  '少儿': ['绘本', '童话', '科普启蒙', '少儿文学', '漫画'],
  '艺术': ['美术', '音乐', '摄影', '设计', '影视'],
  '生活': ['健康养生', '烹饪', '旅游', '家庭教育', '手工'],
}

const AGE_GROUPS = ['child', 'youth', 'middle', 'senior'] as const
const AGE_LABELS: Record<string, string> = { child: '少儿', youth: '青年', middle: '中年', senior: '老年' }
const ACTIVITY_TYPES = ['读书会', '亲子阅读', '讲座', '手工坊', '电影放映', '展览']

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗']
const LAST_NAMES = ['伟', '芳', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娜', '秀英', '明', '辉', '华', '红', '平', '刚']

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateDate(year: number, month: number, dayRange = 28): string {
  const m = String(month).padStart(2, '0')
  const d = String(rand(1, Math.min(dayRange, new Date(year, month, 0).getDate()))).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function seed() {
  initSchema()
  const db = getDb()

  const countBranch = db.prepare('SELECT COUNT(*) as c FROM branch').get() as { c: number }
  if (countBranch.c > 0) {
    console.log('Database already seeded, skipping...')
    closeDb()
    return
  }

  console.log('Seeding database...')

  const insertBranch = db.prepare('INSERT INTO branch VALUES (?, ?, ?)')
  const insertBook = db.prepare('INSERT INTO book VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertReader = db.prepare('INSERT INTO reader VALUES (?, ?, ?, ?, ?)')
  const insertBorrow = db.prepare('INSERT INTO borrow_record VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertReservation = db.prepare('INSERT INTO reservation VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const insertActivity = db.prepare('INSERT INTO activity VALUES (?, ?, ?, ?, ?, ?)')

  const seedAll = db.transaction(() => {
    for (const b of BRANCHES) {
      insertBranch.run(b.branch_id, b.branch_name, b.district)
    }
    console.log('  Branches inserted')

    const books: { id: string; title: string; branchId: string; collectionType: string; theme: string; subTheme: string }[] = []
    let bookIdx = 0
    for (const branch of BRANCHES) {
      for (const collType of COLLECTION_TYPES) {
        const themes = THEMES[collType]
        for (const theme of themes) {
          const bookCount = rand(15, 40)
          for (let i = 0; i < bookCount; i++) {
            bookIdx++
            const id = `BK${String(bookIdx).padStart(5, '0')}`
            const title = `${theme}·${pick(FIRST_NAMES)}${pick(LAST_NAMES)}著·第${rand(1, 5)}版`
            const total = rand(2, 12)
            const available = rand(0, total)
            insertBook.run(id, title, `${pick(FIRST_NAMES)}${pick(LAST_NAMES)}`, collType, collType, theme, branch.branch_id, total, available)
            books.push({ id, title, branchId: branch.branch_id, collectionType: collType, theme: collType, subTheme: theme })
          }
        }
      }
    }
    console.log(`  Books inserted: ${books.length}`)

    const readers: { id: string; ageGroup: string; branchId: string; isChild: boolean }[] = []
    let readerIdx = 0
    for (const branch of BRANCHES) {
      const readerCount = rand(200, 400)
      for (let i = 0; i < readerCount; i++) {
        readerIdx++
        const id = `RD${String(readerIdx).padStart(5, '0')}`
        const ageGroup = pick([...AGE_GROUPS])
        const isChild = ageGroup === 'child' ? 1 : 0
        const regYear = rand(2022, 2025)
        const regMonth = rand(1, 12)
        insertReader.run(id, ageGroup, branch.branch_id, isChild, generateDate(regYear, regMonth))
        readers.push({ id, ageGroup, branchId: branch.branch_id, isChild: ageGroup === 'child' })
      }
    }
    console.log(`  Readers inserted: ${readers.length}`)

    let borrowIdx = 0
    for (let year = 2024; year <= 2025; year++) {
      const maxMonth = year === 2025 ? 5 : 12
      for (let month = 1; month <= maxMonth; month++) {
        const borrowCount = rand(600, 1200)
        for (let i = 0; i < borrowCount; i++) {
          borrowIdx++
          const id = `BR${String(borrowIdx).padStart(6, '0')}`
          const book = pick(books)
          const reader = pick(readers)
          const borrowDate = generateDate(year, month)
          const dueDay = new Date(borrowDate)
          dueDay.setDate(dueDay.getDate() + 30)
          const dueDate = dueDay.toISOString().slice(0, 10)

          const isOverdue = Math.random() < 0.12 ? 1 : 0
          const overdueDays = isOverdue ? rand(1, 60) : 0
          const isRenewed = Math.random() < 0.25 ? 1 : 0
          const returned = Math.random() < 0.85
          const returnDate = returned
            ? (() => {
                const rd = new Date(borrowDate)
                const daysToAdd = isOverdue ? rand(30, 30 + overdueDays) : rand(3, 28)
                rd.setDate(rd.getDate() + daysToAdd)
                return rd.toISOString().slice(0, 10)
              })()
            : null

          insertBorrow.run(id, book.id, reader.id, book.branchId, borrowDate, dueDate, returnDate, isRenewed, isOverdue, overdueDays)
        }
      }
    }
    console.log(`  Borrow records inserted: ${borrowIdx}`)

    let resIdx = 0
    for (let year = 2024; year <= 2025; year++) {
      const maxMonth = year === 2025 ? 5 : 12
      for (let month = 1; month <= maxMonth; month++) {
        const resCount = rand(80, 200)
        for (let i = 0; i < resCount; i++) {
          resIdx++
          const id = `RS${String(resIdx).padStart(6, '0')}`
          const book = pick(books)
          const reader = pick(readers)
          const reserveDate = generateDate(year, month)
          const status = pick(['waiting', 'fulfilled', 'fulfilled', 'fulfilled', 'cancelled'])
          const fulfillDate = status === 'fulfilled'
            ? (() => {
                const fd = new Date(reserveDate)
                fd.setDate(fd.getDate() + rand(1, 45))
                return fd.toISOString().slice(0, 10)
              })()
            : null
          const queuePos = status === 'waiting' ? rand(1, 25) : 0
          insertReservation.run(id, book.id, reader.id, book.branchId, reserveDate, fulfillDate, queuePos, status)
        }
      }
    }
    console.log(`  Reservations inserted: ${resIdx}`)

    let actIdx = 0
    for (let year = 2024; year <= 2025; year++) {
      const maxMonth = year === 2025 ? 5 : 12
      for (let month = 1; month <= maxMonth; month++) {
        for (const branch of BRANCHES) {
          const actCount = rand(2, 6)
          for (let i = 0; i < actCount; i++) {
            actIdx++
            const id = `AC${String(actIdx).padStart(5, '0')}`
            const actType = pick(ACTIVITY_TYPES)
            const actDate = generateDate(year, month)
            const participants = rand(10, 80)
            const childParticipants = actType === '亲子阅读' ? rand(5, participants) : rand(0, Math.floor(participants * 0.3))
            insertActivity.run(id, branch.branch_id, actType, actDate, participants, childParticipants)
          }
        }
      }
    }
    console.log(`  Activities inserted: ${actIdx}`)

    db.prepare('INSERT INTO update_log (table_name, record_count) VALUES (?, ?)').run('full_seed', borrowIdx)
  })

  seedAll()
  console.log('Seed completed successfully!')
  closeDb()
}

seed()
