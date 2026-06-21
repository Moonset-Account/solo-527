import type { IRepository, PaginatedResult, Where, OrderDir } from "./types";
import { prisma } from "@/lib/prisma";
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

type PrismaKey = "lead" | "followUp" | "trial" | "consumption" | "parentFeedback" | "exportTask";

export class PrismaRepository<T extends { id: string }> implements IRepository<T> {
  private prismaKey: PrismaKey;
  private dateFields: (keyof T)[];

  constructor(prismaKey: PrismaKey, dateFields: (keyof T)[]) {
    this.prismaKey = prismaKey;
    this.dateFields = dateFields;
  }

  private get model() {
    const map: Record<PrismaKey, any> = {
      lead: prisma.lead,
      followUp: prisma.followUp,
      trial: prisma.trial,
      consumption: prisma.consumption,
      parentFeedback: prisma.parentFeedback,
      exportTask: prisma.exportTask,
    };
    return map[this.prismaKey];
  }

  private hydrate(item: any): T {
    if (!item) return item;
    return ensureDates<T>(clone(item), this.dateFields);
  }

  async list(): Promise<T[]> {
    const rows = await this.model.findMany();
    return rows.map((x: any) => this.hydrate(x));
  }

  async findById(id: string): Promise<T | undefined> {
    const r = await this.model.findUnique({ where: { id } });
    return r ? this.hydrate(r) : undefined;
  }

  async findOne(where: Where<T>): Promise<T | undefined> {
    const all = await this.list();
    return all.find(where);
  }

  async filter(where: Where<T>): Promise<T[]> {
    const all = await this.list();
    return all.filter(where);
  }

  async count(where?: Where<T>): Promise<number> {
    if (!where) return this.model.count();
    const all = await this.list();
    return all.filter(where).length;
  }

  async create(data: any): Promise<T> {
    const { id, ...rest } = data;
    const payload: any = { ...rest };
    if (id) payload.id = id;
    const created = await this.model.create({ data: payload });
    return this.hydrate(created);
  }

  async update(id: string, patch: Partial<T>): Promise<T | undefined> {
    try {
      const updated = await this.model.update({ where: { id }, data: patch });
      return this.hydrate(updated);
    } catch {
      return undefined;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.model.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
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

export const prismaRepos = {
  leads: new PrismaRepository<Lead>("lead", LEAD_DATE_FIELDS),
  followUps: new PrismaRepository<FollowUp>("followUp", FOLLOWUP_DATE_FIELDS),
  trials: new PrismaRepository<Trial>("trial", TRIAL_DATE_FIELDS),
  consumptions: new PrismaRepository<Consumption>("consumption", CONSUMPTION_DATE_FIELDS),
  parentFeedbacks: new PrismaRepository<ParentFeedback>("parentFeedback", FEEDBACK_DATE_FIELDS),
  exportTasks: new PrismaRepository<ExportTask>("exportTask", EXPORT_DATE_FIELDS),
};
