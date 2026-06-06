import crypto from 'crypto';
import type {
  Reader,
  Book,
  BorrowRecord,
  Reservation,
  Activity,
  ActivityParticipation,
  Branch,
} from '../../shared/types.js';

const BRANCHES: Omit<Branch, 'id'>[] = [
  { name: '中心图书馆', address: '市中心大道100号' },
  { name: '东城分馆', address: '东区文化路50号' },
  { name: '西城分馆', address: '西区科技路200号' },
  { name: '南城分馆', address: '南区学府路80号' },
  { name: '北城分馆', address: '北区和平路150号' },
];

const SUBJECTS = ['文学小说', '历史传记', '科学技术', '艺术设计', '经济管理', '儿童读物', '社会科学', '医药健康'];
const COLLECTIONS = ['中文图书', '外文图书', '期刊杂志', '视听资料', '电子书籍'];
const READER_GROUPS = ['学生', '教师', '公务员', '企业职员', '退休人员', '自由职业', '儿童', '青少年'];
const AGE_GROUPS = ['0-6岁', '7-12岁', '13-18岁', '19-30岁', '31-45岁', '46-60岁', '60岁以上'];

const ACTIVITY_TYPES = ['读书会', '讲座', '工作坊', '展览', '亲子活动', '培训课程'];

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高'];
const LAST_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛'];

const BOOK_TITLES = [
  '百年孤独', '三体', '活着', '围城', '平凡的世界', '红楼梦', '西游记',
  '时间简史', '人类简史', '思考，快与慢', '原则', '穷查理宝典', '影响力',
  '小王子', '哈利波特', '夏洛的网', '窗边的小豆豆', '安徒生童话',
  '明朝那些事儿', '万历十五年', '史记', '资治通鉴',
  '设计心理学', '写给大家看的设计书', '艺术的故事',
  '经济学原理', '国富论', '卓有成效的管理者',
  '黄帝内经', '本草纲目', '只有医生知道',
];

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function generateDataHash(data: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getAgeGroup(age: number): string {
  if (age <= 6) return '0-6岁';
  if (age <= 12) return '7-12岁';
  if (age <= 18) return '13-18岁';
  if (age <= 30) return '19-30岁';
  if (age <= 45) return '31-45岁';
  if (age <= 60) return '46-60岁';
  return '60岁以上';
}

export function generateBranches(): Branch[] {
  return BRANCHES.map((b, i) => ({ id: `branch-${i + 1}`, ...b }));
}

export function generateReaders(count: number, branches: Branch[]): Reader[] {
  const readers: Reader[] = [];
  for (let i = 0; i < count; i++) {
    const age = Math.floor(Math.random() * 70) + 5;
    const ageGroup = getAgeGroup(age);
    const isChildren = age <= 12;
    let readerGroup: string;
    if (isChildren) {
      readerGroup = age <= 6 ? '儿童' : '青少年';
    } else {
      readerGroup = randomItem(READER_GROUPS.filter(g => g !== '儿童' && g !== '青少年'));
    }
    readers.push({
      id: `reader-${i + 1}`,
      name: `${randomItem(FIRST_NAMES)}${randomItem(LAST_NAMES)}`,
      age,
      ageGroup,
      readerGroup,
      branch: randomItem(branches).name,
      isChildren,
    });
  }
  return readers;
}

export function generateBooks(count: number, branches: Branch[]): Book[] {
  const books: Book[] = [];
  for (let i = 0; i < count; i++) {
    books.push({
      id: `book-${i + 1}`,
      title: BOOK_TITLES[i % BOOK_TITLES.length] + (i >= BOOK_TITLES.length ? ` (第${Math.floor(i / BOOK_TITLES.length) + 1}版)` : ''),
      subject: randomItem(SUBJECTS),
      collection: randomItem(COLLECTIONS),
      branch: randomItem(branches).name,
    });
  }
  return books;
}

export function generateBorrowRecords(
  count: number,
  readers: Reader[],
  books: Book[],
  branches: Branch[]
): BorrowRecord[] {
  const records: BorrowRecord[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  for (let i = 0; i < count; i++) {
    const reader = randomItem(readers);
    const book = randomItem(books);
    const borrowDate = randomDate(startDate, endDate);
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const hasReturned = Math.random() > 0.15;
    let returnDate: Date | null = null;
    let isOverdue = false;
    let overdueDays = 0;

    if (hasReturned) {
      returnDate = new Date(borrowDate);
      returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 45));
      isOverdue = returnDate > dueDate;
      overdueDays = isOverdue ? Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    } else {
      isOverdue = new Date() > dueDate;
      overdueDays = isOverdue ? Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    }

    const renewCount = Math.floor(Math.random() * 3);
    const recordData = {
      readerId: reader.id,
      bookId: book.id,
      branch: book.branch,
      borrowDate: formatDate(borrowDate),
      dueDate: formatDate(dueDate),
      returnDate: returnDate ? formatDate(returnDate) : null,
      renewCount,
    };

    records.push({
      id: `borrow-${i + 1}`,
      ...recordData,
      isOverdue,
      overdueDays,
      dataHash: generateDataHash(recordData),
    });
  }
  return records;
}

export function generateReservations(
  count: number,
  readers: Reader[],
  books: Book[],
  branches: Branch[]
): Reservation[] {
  const reservations: Reservation[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  for (let i = 0; i < count; i++) {
    const reader = randomItem(readers);
    const book = randomItem(books);
    const reserveDate = randomDate(startDate, endDate);
    const waitDays = Math.floor(Math.random() * 30) + 1;
    const availableDate = new Date(reserveDate);
    availableDate.setDate(availableDate.getDate() + waitDays);

    const statusRoll = Math.random();
    let status: Reservation['status'];
    let pickupDate: Date | null = null;

    if (statusRoll < 0.6) {
      status = 'picked_up';
      pickupDate = new Date(availableDate);
      pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 5));
    } else if (statusRoll < 0.75) {
      status = 'available';
    } else if (statusRoll < 0.9) {
      status = 'pending';
    } else {
      status = 'cancelled';
    }

    reservations.push({
      id: `resv-${i + 1}`,
      readerId: reader.id,
      bookId: book.id,
      branch: book.branch,
      reserveDate: formatDate(reserveDate),
      availableDate: status !== 'pending' && status !== 'cancelled' ? formatDate(availableDate) : null,
      pickupDate: pickupDate ? formatDate(pickupDate) : null,
      waitDays,
      status,
    });
  }
  return reservations;
}

export function generateActivities(count: number, branches: Branch[]): Activity[] {
  const activities: Activity[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  const activityNames = [
    '经典文学读书会', '历史文化讲座', '科学实验工作坊', '当代艺术展览',
    '亲子阅读活动', '数字资源培训', '作家见面会', '电影赏析会',
    '书法练习班', '英语角活动', '创业分享会', '健康养生讲座',
  ];

  for (let i = 0; i < count; i++) {
    activities.push({
      id: `activity-${i + 1}`,
      name: activityNames[i % activityNames.length],
      type: randomItem(ACTIVITY_TYPES),
      date: formatDate(randomDate(startDate, endDate)),
      branch: randomItem(branches).name,
    });
  }
  return activities;
}

export function generateActivityParticipations(
  count: number,
  readers: Reader[],
  activities: Activity[]
): ActivityParticipation[] {
  const participations: ActivityParticipation[] = [];
  for (let i = 0; i < count; i++) {
    const reader = randomItem(readers);
    const activity = randomItem(activities);
    participations.push({
      id: `participation-${i + 1}`,
      readerId: reader.id,
      activityId: activity.id,
      participatedAt: activity.date,
    });
  }
  return participations;
}

export interface LibraryDataset {
  branches: Branch[];
  readers: Reader[];
  books: Book[];
  borrowRecords: BorrowRecord[];
  reservations: Reservation[];
  activities: Activity[];
  activityParticipations: ActivityParticipation[];
  generationTime: string;
}

export function generateMockDataset(): LibraryDataset {
  const branches = generateBranches();
  const readers = generateReaders(500, branches);
  const books = generateBooks(200, branches);
  const borrowRecords = generateBorrowRecords(3000, readers, books, branches);
  const reservations = generateReservations(800, readers, books, branches);
  const activities = generateActivities(50, branches);
  const activityParticipations = generateActivityParticipations(1200, readers, activities);

  return {
    branches,
    readers,
    books,
    borrowRecords,
    reservations,
    activities,
    activityParticipations,
    generationTime: new Date().toISOString(),
  };
}
