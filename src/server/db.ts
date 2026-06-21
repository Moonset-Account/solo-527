import {
  campus as seedCampus, staff as seedStaff, leads as seedLeads, followUps as seedFollowUps,
  trials as seedTrials, students as seedStudents, classes as seedClasses, lessons as seedLessons,
  attendances as seedAttendances, consumptions as seedConsumptions, revisions as seedRevisions,
  works as seedWorks, workFeedbacks as seedWorkFeedbacks, questionBankVersions as seedQB,
  parentFeedbacks as seedFeedback, operationLogs as seedLogs, exportTasks as seedExport, settingRules as seedRules,
} from "./mock/seed";
import { deepClone } from "@/lib/utils";
import type {
  Campus, Staff, Lead, FollowUp, Trial, Student, Class, Lesson, Attendance, Consumption,
  Revision, Work, WorkFeedback, QuestionBankVersion, ParentFeedback, OperationLog, ExportTask, SettingRule,
} from "@/types";

type KeyOf<T> = Extract<keyof T, string>;

class Repo<T extends { id: string; createdAt?: Date; updatedAt?: Date }> {
  constructor(private store: T[]) {}
  list() { return [...this.store]; }
  findById(id: string) { return this.store.find((x) => x.id === id); }
  filter(pred: (x: T) => boolean) { return this.store.filter(pred); }
  findOne(pred: (x: T) => boolean) { return this.store.find(pred); }
  create(data: Omit<T, "id" | "createdAt"> & Partial<Pick<T, "id" | "createdAt">>): T {
    const now = new Date();
    const entity = {
      createdAt: now,
      ...(data as any),
      id: (data as any).id ?? Math.random().toString(36).slice(2, 10) + now.getTime().toString(36).slice(-4),
    } as T;
    this.store.unshift(entity);
    return entity;
  }
  update(id: string, patch: Partial<T>): T | undefined {
    const idx = this.store.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    const updated = { ...this.store[idx], ...patch, updatedAt: new Date() } as T;
    this.store[idx] = updated;
    return updated;
  }
  remove(id: string) {
    const idx = this.store.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    this.store.splice(idx, 1);
    return true;
  }
  count(pred?: (x: T) => boolean) {
    return pred ? this.store.filter(pred).length : this.store.length;
  }
}

// ========== Deep clone initial seed ==========
const clone = <T,>(x: T): T => deepClone(x);

class DB {
  campus = new Repo<Campus>([clone(seedCampus)]);
  staff = new Repo<Staff>(clone(seedStaff));
  leads = new Repo<Lead>(clone(seedLeads));
  followUps = new Repo<FollowUp>(clone(seedFollowUps));
  trials = new Repo<Trial>(clone(seedTrials));
  students = new Repo<Student>(clone(seedStudents));
  classes = new Repo<Class>(clone(seedClasses));
  lessons = new Repo<Lesson>(clone(seedLessons));
  attendances = new Repo<Attendance>(clone(seedAttendances));
  consumptions = new Repo<Consumption>(clone(seedConsumptions));
  revisions = new Repo<Revision>(clone(seedRevisions));
  works = new Repo<Work>(clone(seedWorks));
  workFeedbacks = new Repo<WorkFeedback>(clone(seedWorkFeedbacks));
  questionBanks = new Repo<QuestionBankVersion>(clone(seedQB));
  parentFeedbacks = new Repo<ParentFeedback>(clone(seedFeedback));
  operationLogs = new Repo<OperationLog>(clone(seedLogs));
  exportTasks = new Repo<ExportTask>(clone(seedExport));
  settingRules = new Repo<SettingRule>([clone(seedRules)]);

  log(params: Omit<OperationLog, "id" | "createdAt">) {
    this.operationLogs.create({
      ...params,
    });
  }
}

const globalForDB = globalThis as unknown as { db: DB };
export const db: DB = globalForDB.db ?? new DB();
if (process.env.NODE_ENV !== "production") globalForDB.db = db;

// Utilities
export const sortBy = <T extends Record<string, any>>(arr: T[], key: keyof T, dir: "asc" | "desc" = "desc") =>
  [...arr].sort((a, b) => {
    const av = a[key]; const bv = b[key];
    const an = (av instanceof Date || typeof av === "string" && !Number.isNaN(Date.parse(av))) ? toDate(av).getTime() : av;
    const bn = (bv instanceof Date || typeof bv === "string" && !Number.isNaN(Date.parse(bv))) ? toDate(bv).getTime() : bv;
    if (an === bn) return 0;
    return dir === "asc" ? (an > bn ? 1 : -1) : (an > bn ? -1 : 1);
  });

export const paginate = <T,>(items: T[], page: number, pageSize: number) => {
  const p = Math.max(1, page); const s = Math.max(1, pageSize);
  const start = (p - 1) * s;
  return { items: items.slice(start, start + s), total: items.length, page: p, pageSize: s, totalPages: Math.ceil(items.length / s) };
};
