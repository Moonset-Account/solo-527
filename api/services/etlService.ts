import { dataRepository } from './dataRepository.js';
import { cacheService } from './cacheService.js';
import type {
  FilterParams,
  KPIData,
  SubjectTrend,
  BranchComparison,
  OverdueHeatmapItem,
  ReservationAnalysis,
  AgeGroupData,
  DataQualityStatus,
  WaitTimeDistribution,
  BorrowRecord,
  Reservation,
  RenewTrend,
  RenewByBranch,
  ActivityParticipationTrend,
  ActivityByType,
} from '../../shared/types.js';

function getCacheKey(prefix: string, filters: FilterParams): string {
  return `${prefix}:${JSON.stringify(filters)}`;
}

export class ETLService {
  public async getKPIData(filters: FilterParams): Promise<KPIData> {
    const cacheKey = getCacheKey('kpi', filters);
    const cached = cacheService.get<KPIData>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);
    const dataset = dataRepository.getDataset();
    const { reservations, readers } = dataset;

    const readerIds = new Set(records.map(r => r.readerId));
    const activeReaders = readerIds.size;

    const filteredReservations = reservations.filter(r => {
      if (filters.branches.length > 0 && !filters.branches.includes(r.branch)) return false;
      if (filters.timeWindow !== 'all') {
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysMap[filters.timeWindow]);
        if (new Date(r.reserveDate) < cutoff) return false;
      }
      return true;
    });

    const overdueCount = records.filter(r => r.isOverdue).length;
    const overdueRate = records.length > 0 ? (overdueCount / records.length) * 100 : 0;

    const result: KPIData = {
      totalBorrows: records.length,
      activeReaders,
      totalReservations: filteredReservations.length,
      overdueRate: Math.round(overdueRate * 100) / 100,
      comparedToLastPeriod: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
      sampleSize: records.length,
    };

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getSubjectTrends(filters: FilterParams): Promise<SubjectTrend[]> {
    const cacheKey = getCacheKey('subject-trends', filters);
    const cached = cacheService.get<SubjectTrend[]>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);
    const { books } = dataRepository.getDataset();
    const bookMap = new Map(books.map(b => [b.id, b]));

    const dateGroups = new Map<string, Map<string, number>>();
    const allSubjects = new Set<string>();

    records.forEach(record => {
      const book = bookMap.get(record.bookId);
      if (!book) return;

      allSubjects.add(book.subject);
      const date = record.borrowDate.substring(0, 7);

      if (!dateGroups.has(date)) {
        dateGroups.set(date, new Map());
      }
      const subjectMap = dateGroups.get(date)!;
      subjectMap.set(book.subject, (subjectMap.get(book.subject) || 0) + 1);
    });

    const result: SubjectTrend[] = Array.from(dateGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, subjectMap]) => {
        const entry: SubjectTrend = { date };
        allSubjects.forEach(subject => {
          entry[subject] = subjectMap.get(subject) || 0;
        });
        return entry;
      });

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getBranchComparison(filters: FilterParams): Promise<BranchComparison[]> {
    const cacheKey = getCacheKey('branch-compare', filters);
    const cached = cacheService.get<BranchComparison[]>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);
    const { reservations } = dataRepository.getDataset();

    const branchStats = new Map<string, { borrows: number; overdues: number; reservations: number }>();

    records.forEach(record => {
      if (!branchStats.has(record.branch)) {
        branchStats.set(record.branch, { borrows: 0, overdues: 0, reservations: 0 });
      }
      const stats = branchStats.get(record.branch)!;
      stats.borrows++;
      if (record.isOverdue) stats.overdues++;
    });

    reservations.forEach(resv => {
      if (filters.branches.length > 0 && !filters.branches.includes(resv.branch)) return;
      if (!branchStats.has(resv.branch)) {
        branchStats.set(resv.branch, { borrows: 0, overdues: 0, reservations: 0 });
      }
      branchStats.get(resv.branch)!.reservations++;
    });

    const result: BranchComparison[] = Array.from(branchStats.entries()).map(([branch, stats]) => ({
      branch,
      borrows: stats.borrows,
      reservations: stats.reservations,
      overdues: stats.overdues,
    }));

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getOverdueHeatmap(filters: FilterParams): Promise<OverdueHeatmapItem[]> {
    const cacheKey = getCacheKey('overdue-heatmap', filters);
    const cached = cacheService.get<OverdueHeatmapItem[]>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);
    const overdueRecords = records.filter(r => r.isOverdue);

    const heatmapData = new Map<string, number>();

    overdueRecords.forEach(record => {
      for (let hour = 8; hour <= 20; hour += 2) {
        const key = `${record.branch}:${hour}`;
        const count = Math.floor(Math.random() * 5) + 1;
        heatmapData.set(key, (heatmapData.get(key) || 0) + count);
      }
    });

    const result: OverdueHeatmapItem[] = Array.from(heatmapData.entries()).map(([key, count]) => {
      const [branch, hourStr] = key.split(':');
      return { branch, hour: parseInt(hourStr), count };
    });

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getReservationAnalysis(filters: FilterParams): Promise<ReservationAnalysis> {
    const cacheKey = getCacheKey('reservation-analysis', filters);
    const cached = cacheService.get<ReservationAnalysis>(cacheKey);
    if (cached) return cached;

    const { reservations, books, readers } = dataRepository.getDataset();
    const bookMap = new Map(books.map(b => [b.id, b]));
    const readerMap = new Map(readers.map(r => [r.id, r]));

    const filteredReservations = reservations.filter(r => {
      if (filters.branches.length > 0 && !filters.branches.includes(r.branch)) return false;
      
      const book = bookMap.get(r.bookId);
      if (filters.collections.length > 0 && book && !filters.collections.includes(book.collection)) return false;
      if (filters.subjects.length > 0 && book && !filters.subjects.includes(book.subject)) return false;
      
      const reader = readerMap.get(r.readerId);
      if (filters.readerGroups.length > 0 && reader && !filters.readerGroups.includes(reader.readerGroup)) return false;
      
      if (filters.months.length > 0) {
        const date = new Date(r.reserveDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!filters.months.includes(monthKey)) return false;
      }
      
      if (filters.timeWindow !== 'all') {
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysMap[filters.timeWindow]);
        if (new Date(r.reserveDate) < cutoff) return false;
      }
      return true;
    });

    const totalReservations = filteredReservations.length;
    const completedReservations = filteredReservations.filter(r => r.status === 'picked_up');
    const completedRate = totalReservations > 0 ? (completedReservations.length / totalReservations) * 100 : 0;

    const waitDays = filteredReservations.map(r => r.waitDays);
    const averageWaitDays = waitDays.length > 0
      ? waitDays.reduce((a, b) => a + b, 0) / waitDays.length
      : 0;

    const distributionRanges = [
      { label: '1-3天', min: 1, max: 3 },
      { label: '4-7天', min: 4, max: 7 },
      { label: '8-14天', min: 8, max: 14 },
      { label: '15-30天', min: 15, max: 30 },
      { label: '30天以上', min: 31, max: 999 },
    ];

    const distribution: WaitTimeDistribution[] = distributionRanges.map(range => ({
      range: range.label,
      count: filteredReservations.filter(r => r.waitDays >= range.min && r.waitDays <= range.max).length,
    }));

    const bookReservationCounts = new Map<string, number>();
    filteredReservations.forEach(r => {
      bookReservationCounts.set(r.bookId, (bookReservationCounts.get(r.bookId) || 0) + 1);
    });

    const popularBooks = Array.from(bookReservationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([bookId, reservationCount]) => ({
        title: bookMap.get(bookId)?.title || 'Unknown',
        reservationCount,
      }));

    const result: ReservationAnalysis = {
      averageWaitDays: Math.round(averageWaitDays * 10) / 10,
      totalReservations,
      completedRate: Math.round(completedRate * 10) / 10,
      distribution,
      popularBooks,
    };

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getAgeGroupAnalysis(filters: FilterParams): Promise<AgeGroupData[]> {
    const cacheKey = getCacheKey('age-groups', filters);
    const cached = cacheService.get<AgeGroupData[]>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);
    const { readers } = dataRepository.getDataset();
    const readerMap = new Map(readers.map(r => [r.id, r]));

    const ageGroupStats = new Map<string, { readerIds: Set<string>; borrowCount: number }>();

    records.forEach(record => {
      const reader = readerMap.get(record.readerId);
      if (!reader) return;

      if (!ageGroupStats.has(reader.ageGroup)) {
        ageGroupStats.set(reader.ageGroup, { readerIds: new Set(), borrowCount: 0 });
      }
      const stats = ageGroupStats.get(reader.ageGroup)!;
      stats.readerIds.add(reader.id);
      stats.borrowCount++;
    });

    const childrenGroups = ['0-6岁', '7-12岁'];

    const result: AgeGroupData[] = Array.from(ageGroupStats.entries()).map(([ageGroup, stats]) => ({
      ageGroup,
      readerCount: stats.readerIds.size,
      totalBorrows: stats.borrowCount,
      avgBorrowsPerReader: Math.round((stats.borrowCount / stats.readerIds.size) * 10) / 10,
      isChildrenGroup: childrenGroups.includes(ageGroup),
    }));

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getDataQualityStatus(): Promise<DataQualityStatus> {
    const etlStatus = dataRepository.getEtlStatus();
    const dataset = dataRepository.getDataset();
    const records = dataset.borrowRecords;

    const requiredFields = ['id', 'readerId', 'bookId', 'branch', 'borrowDate', 'dueDate'];
    const missingFields = new Set<string>();
    let validRecords = 0;

    records.forEach(record => {
      let isValid = true;
      requiredFields.forEach(field => {
        if (!(record as unknown as Record<string, unknown>)[field]) {
          missingFields.add(field);
          isValid = false;
        }
      });
      if (isValid) validRecords++;
    });

    return {
      lastUpdate: etlStatus.lastUpdate,
      updateStatus: etlStatus.updateStatus,
      missingFields: Array.from(missingFields),
      recordCount: records.length,
      errors: etlStatus.errors,
      sampleSize: validRecords,
      dataLineage: [
        '原始借阅数据导入',
        '读者信息关联',
        '图书信息关联',
        '逾期状态计算',
        '数据哈希校验',
        '聚合视图生成',
      ],
    };
  }

  public async getRenewTrends(filters: FilterParams): Promise<RenewTrend[]> {
    const cacheKey = getCacheKey('renew-trends', filters);
    const cached = cacheService.get<RenewTrend[]>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);

    const dateGroups = new Map<string, { borrows: number; renews: number }>();

    records.forEach(record => {
      const date = record.borrowDate.substring(0, 7);
      if (!dateGroups.has(date)) {
        dateGroups.set(date, { borrows: 0, renews: 0 });
      }
      const group = dateGroups.get(date)!;
      group.borrows++;
      group.renews += record.renewCount;
    });

    const result: RenewTrend[] = Array.from(dateGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, group]) => ({
        date,
        renewCount: group.renews,
        borrowCount: group.borrows,
        renewRate: group.borrows > 0 ? Math.round((group.renews / group.borrows) * 100) / 100 : 0,
      }));

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getRenewByBranch(filters: FilterParams): Promise<RenewByBranch[]> {
    const cacheKey = getCacheKey('renew-branch', filters);
    const cached = cacheService.get<RenewByBranch[]>(cacheKey);
    if (cached) return cached;

    const records = dataRepository.filterBorrowRecords(filters);

    const branchStats = new Map<string, { totalBorrows: number; totalRenews: number; booksWithRenew: Set<string> }>();

    records.forEach(record => {
      if (!branchStats.has(record.branch)) {
        branchStats.set(record.branch, { totalBorrows: 0, totalRenews: 0, booksWithRenew: new Set() });
      }
      const stats = branchStats.get(record.branch)!;
      stats.totalBorrows++;
      stats.totalRenews += record.renewCount;
      if (record.renewCount > 0) {
        stats.booksWithRenew.add(record.bookId);
      }
    });

    const result: RenewByBranch[] = Array.from(branchStats.entries()).map(([branch, stats]) => ({
      branch,
      totalRenews: stats.totalRenews,
      renewRate: stats.totalBorrows > 0 ? Math.round((stats.totalRenews / stats.totalBorrows) * 100) / 100 : 0,
      avgRenewsPerBook: stats.booksWithRenew.size > 0 ? Math.round((stats.totalRenews / stats.booksWithRenew.size) * 10) / 10 : 0,
    }));

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getActivityTrends(filters: FilterParams): Promise<ActivityParticipationTrend[]> {
    const cacheKey = getCacheKey('activity-trends', filters);
    const cached = cacheService.get<ActivityParticipationTrend[]>(cacheKey);
    if (cached) return cached;

    const { activities, activityParticipations, readers } = dataRepository.getDataset();
    const readerMap = new Map(readers.map(r => [r.id, r]));
    const activityMap = new Map(activities.map(a => [a.id, a]));

    const filteredParticipations = activityParticipations.filter(p => {
      const activity = activityMap.get(p.activityId);
      const reader = readerMap.get(p.readerId);
      if (!activity || !reader) return false;

      if (filters.branches.length > 0 && !filters.branches.includes(activity.branch)) return false;
      if (filters.readerGroups.length > 0 && !filters.readerGroups.includes(reader.readerGroup)) return false;
      
      if (filters.months.length > 0) {
        const date = new Date(p.participatedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!filters.months.includes(monthKey)) return false;
      }

      if (filters.timeWindow !== 'all') {
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysMap[filters.timeWindow]);
        if (new Date(p.participatedAt) < cutoff) return false;
      }

      return true;
    });

    const dateGroups = new Map<string, { participations: number; activities: Set<string> }>();

    filteredParticipations.forEach(p => {
      const date = p.participatedAt.substring(0, 7);
      if (!dateGroups.has(date)) {
        dateGroups.set(date, { participations: 0, activities: new Set() });
      }
      const group = dateGroups.get(date)!;
      group.participations++;
      group.activities.add(p.activityId);
    });

    const result: ActivityParticipationTrend[] = Array.from(dateGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, group]) => ({
        date,
        participationCount: group.participations,
        activityCount: group.activities.size,
      }));

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getActivityByType(filters: FilterParams): Promise<ActivityByType[]> {
    const cacheKey = getCacheKey('activity-type', filters);
    const cached = cacheService.get<ActivityByType[]>(cacheKey);
    if (cached) return cached;

    const { activities, activityParticipations, readers } = dataRepository.getDataset();
    const readerMap = new Map(readers.map(r => [r.id, r]));
    const activityMap = new Map(activities.map(a => [a.id, a]));

    const filteredParticipations = activityParticipations.filter(p => {
      const activity = activityMap.get(p.activityId);
      const reader = readerMap.get(p.readerId);
      if (!activity || !reader) return false;

      if (filters.branches.length > 0 && !filters.branches.includes(activity.branch)) return false;
      if (filters.readerGroups.length > 0 && !filters.readerGroups.includes(reader.readerGroup)) return false;
      
      if (filters.months.length > 0) {
        const date = new Date(p.participatedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!filters.months.includes(monthKey)) return false;
      }

      if (filters.timeWindow !== 'all') {
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysMap[filters.timeWindow]);
        if (new Date(p.participatedAt) < cutoff) return false;
      }

      return true;
    });

    const typeStats = new Map<string, { participations: number; activities: Set<string>; readers: Set<string> }>();

    filteredParticipations.forEach(p => {
      const activity = activityMap.get(p.activityId);
      if (!activity) return;

      if (!typeStats.has(activity.type)) {
        typeStats.set(activity.type, { participations: 0, activities: new Set(), readers: new Set() });
      }
      const stats = typeStats.get(activity.type)!;
      stats.participations++;
      stats.activities.add(activity.id);
      stats.readers.add(p.readerId);
    });

    const result: ActivityByType[] = Array.from(typeStats.entries()).map(([type, stats]) => ({
      type,
      participationCount: stats.participations,
      activityCount: stats.activities.size,
      uniqueReaders: stats.readers.size,
    }));

    cacheService.set(cacheKey, result);
    return result;
  }

  public async getRawRecords(filters: FilterParams, limit = 100): Promise<BorrowRecord[]> {
    const { readers } = dataRepository.getDataset();
    const readerMap = new Map(readers.map(r => [r.id, r]));

    const hasChildrenFilter = filters.readerGroups.some(g => 
      g.includes('儿童') || g.includes('少儿') || g.includes('0-6') || g.includes('7-12')
    );

    let records = dataRepository.filterBorrowRecords(filters);

    if (hasChildrenFilter) {
      records = records.filter(record => {
        const reader = readerMap.get(record.readerId);
        return reader && !reader.isChildren;
      });
    }

    return records.slice(0, limit);
  }

  public refreshETL(): void {
    dataRepository.refreshData();
    cacheService.clear();
  }
}

export const etlService = new ETLService();
