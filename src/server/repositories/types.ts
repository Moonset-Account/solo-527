import type { Prisma } from "@prisma/client";

export type Where<T> = (item: T) => boolean;
export type OrderDir = "asc" | "desc";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  findById(id: string): Promise<T | undefined>;
  findOne(where: Where<T>): Promise<T | undefined>;
  filter(where: Where<T>): Promise<T[]>;
  count(where?: Where<T>): Promise<number>;
  create(data: Partial<T> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | undefined>;
  remove(id: string): Promise<boolean>;
  sortBy<K extends keyof T>(items: T[], key: K, dir?: OrderDir): T[];
  paginate(items: T[], page: number, pageSize: number): PaginatedResult<T>;
}

export const prismaConfigured = () =>
  !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;
