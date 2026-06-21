import type { IRepository, PaginatedResult, Where, OrderDir } from "./types";
import { db } from "../db";
import { toDate } from "@/lib/utils";
import type { Lead, Trial, Consumption, ParentFeedback, ExportTask, FollowUp } from "@/types";

function clone<T>(x: T): T {
  if (x === null || x === undefined) return x;
  if (x instanceof Date) return new Date(x.getTime()) as any;
  if (typeof x !== "object") return x;
  if (Array.isArray(x)) return x.map(clone) as any;
  const out: any = {};
  for (const k of Object.keys(x as any)) out[k] = clone((x as any)[k]);
  return out;
}

function ensureDates<T extends Record<string, any>>(item: any, dateFields: (keyof T)[]): T {
  const out: any = { ...item };
  for (const f of dateFields) {
    if (out[f]) out[f] = toDate(out[f]);
  }
  return out as T;
}

const LEAD_DATE_FIELDS: (keyof Lead)[] = ["createdAt", "updatedAt"];
const FOLLOWUP_DATE_FIELDS: (keyof FollowUp)[] = ["createdAt", "updatedAt", "nextFollowAt"];
const TRIAL_DATE_FIELDS: (keyof Trial)[] = ["createdAt", "updatedAt", "trialAt"];
const CONSUMPTION_DATE_FIELDS: (keyof Consumption)[] = ["createdAt", "updatedAt"];
const FEEDBACK_DATE_FIELDS: (keyof ParentFeedback)[] = ["createdAt", "updatedAt", "repliedAt"];
const EXPORT_DATE_FIELDS: (keyof ExportTask)[] = ["createdAt", "updatedAt", "doneAt"];

export class MemoryRepository<T extends { id: string }, D extends keyof typeof db> implements IRepository<T> {
  private dateFields: (keyof T)[];
  private repoKey: D;

  constructor(repoKey: D, dateFields: (keyof T)[]) {
    this.repoKey = repoKey;
    this.dateFields = dateFields;
  }

  private get repo() {
    return db[this.repoKey] as any;
  }

  private hydrate(item: any): T {
    return ensureDates<T>(clone(item), this.dateFields);
  }

  async list(): Promise<T[]> {
    return this.repo.list().map((x: any) => this.hydrate(x));
  }

  async findById(id: string): Promise<T | undefined> {
    const r = this.repo.findById(id);
    return r ? this.hydrate(r) : undefined;
  }

  async findOne(where: Where<T>): Promise<T | undefined> {
    const r = this.repo.findOne(where as any);
    return r ? this.hydrate(r) : undefined;
  }

  async filter(where: Where<T>): Promise<T[]> {
    return this.repo.filter(where as any).map((x: any) => this.hydrate(x));
  }

  async count(where?: Where<T>): Promise<number> {
    if (!where) return this.repo.list().length;
    return this.repo.filter(where as any).length;
  }

  async create(data: any): Promise<T> {
    const created = this.repo.create(data);
    return this.hydrate(created);
  }

  async update(id: string, patch: Partial<T>): Promise<T | undefined> {
    const updated = this.repo.update(id, patch);
    return updated ? this.hydrate(updated) : undefined;
  }

  async remove(id: string): Promise<boolean> {
    return this.repo.remove(id);
  }

  sortBy<K extends keyof T>(items: T[], key: K, dir: OrderDir = "desc"): T[] {
    return [...items].sort((a, b) => {
      const av = a[key]; const bv = b[key];
      const an = (av instanceof Date || (typeof av === "string" && !Number.isNaN(Date.parse(av)))) ? toDate(av).getTime() : av;
      const bn = (bv instanceof Date || (typeof bv === "string" && !Number.isNaN(Date.parse(bv)))) ? toDate(bv).getTime() : bv;
      if (an === bn) return 0;
      return dir === "asc" ? (an > bn ? 1 : -1) : (an > bn ? -1 : 1);
    });
  }

  paginate(items: T[], page: number, pageSize: number): PaginatedResult<T> {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
  }
}

// Repository instances for each migrated module
export const memoryRepos = {
  leads: new MemoryRepository<Lead, "leads">("leads", LEAD_DATE_FIELDS),
  followUps: new MemoryRepository<FollowUp, "followUps">("followUps", FOLLOWUP_DATE_FIELDS),
  trials: new MemoryRepository<Trial, "trials">("trials", TRIAL_DATE_FIELDS),
  consumptions: new MemoryRepository<Consumption, "consumptions">("consumptions", CONSUMPTION_DATE_FIELDS),
  parentFeedbacks: new MemoryRepository<ParentFeedback, "parentFeedbacks">("parentFeedbacks", FEEDBACK_DATE_FIELDS),
  exportTasks: new MemoryRepository<ExportTask, "exportTasks">("exportTasks", EXPORT_DATE_FIELDS),
};
