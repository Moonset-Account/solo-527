import { generateMockDataset, type LibraryDataset } from '../data/mockDataGenerator.js';
import type { FilterParams, BorrowRecord, RawRecordWithValidation } from '../../shared/types.js';
import crypto from 'crypto';

class DataRepository {
  private dataset: LibraryDataset;
  private etlTimestamp: string;
  private etlStatus: 'success' | 'failed' | 'partial';
  private etlErrors: string[];

  constructor() {
    this.dataset = generateMockDataset();
    this.etlTimestamp = new Date().toISOString();
    this.etlStatus = 'success';
    this.etlErrors = [];
  }

  public refreshData(): void {
    try {
      this.dataset = generateMockDataset();
      this.etlTimestamp = new Date().toISOString();
      this.etlStatus = 'success';
      this.etlErrors = [];
    } catch (error) {
      this.etlStatus = 'failed';
      this.etlErrors = [error instanceof Error ? error.message : 'Unknown error'];
    }
  }

  public getDataset(): LibraryDataset {
    return this.dataset;
  }

  public getEtlStatus() {
    return {
      lastUpdate: this.etlTimestamp,
      updateStatus: this.etlStatus,
      errors: this.etlErrors,
    };
  }

  public getFilterOptions() {
    const { books, readers } = this.dataset;
    return {
      collections: [...new Set(books.map(b => b.collection))],
      subjects: [...new Set(books.map(b => b.subject))],
      branches: [...new Set(books.map(b => b.branch))],
      readerGroups: [...new Set(readers.map(r => r.readerGroup))],
      months: this.getAvailableMonths(),
    };
  }

  private getAvailableMonths(): string[] {
    const months = new Set<string>();
    this.dataset.borrowRecords.forEach(r => {
      const date = new Date(r.borrowDate);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort();
  }

  public filterBorrowRecords(filters: FilterParams): BorrowRecord[] {
    let records = [...this.dataset.borrowRecords];
    const { books, readers } = this.dataset;

    const bookMap = new Map(books.map(b => [b.id, b]));
    const readerMap = new Map(readers.map(r => [r.id, r]));

    records = records.filter(record => {
      const book = bookMap.get(record.bookId);
      const reader = readerMap.get(record.readerId);
      if (!book || !reader) return false;

      if (filters.collections.length > 0 && !filters.collections.includes(book.collection)) return false;
      if (filters.subjects.length > 0 && !filters.subjects.includes(book.subject)) return false;
      if (filters.branches.length > 0 && !filters.branches.includes(record.branch)) return false;
      if (filters.readerGroups.length > 0 && !filters.readerGroups.includes(reader.readerGroup)) return false;

      if (filters.months.length > 0) {
        const date = new Date(record.borrowDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!filters.months.includes(monthKey)) return false;
      }

      if (filters.timeWindow !== 'all') {
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysMap[filters.timeWindow]);
        if (new Date(record.borrowDate) < cutoff) return false;
      }

      return true;
    });

    return records;
  }

  public validateRecord(record: BorrowRecord): RawRecordWithValidation {
    const errors: string[] = [];
    const requiredFields = ['id', 'readerId', 'bookId', 'branch', 'borrowDate', 'dueDate'];
    requiredFields.forEach(field => {
      if (!(record as unknown as Record<string, unknown>)[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    const recordData = {
      readerId: record.readerId,
      bookId: record.bookId,
      branch: record.branch,
      borrowDate: record.borrowDate,
      dueDate: record.dueDate,
      returnDate: record.returnDate,
      renewCount: record.renewCount,
    };
    const computedHash = crypto.createHash('sha256').update(JSON.stringify(recordData)).digest('hex');
    const hashMatch = computedHash === record.dataHash;

    if (!hashMatch) {
      errors.push('Data hash mismatch - record may have been tampered with');
    }

    return {
      record,
      isValid: errors.length === 0,
      validationErrors: errors,
      hashMatch,
    };
  }
}

export const dataRepository = new DataRepository();
