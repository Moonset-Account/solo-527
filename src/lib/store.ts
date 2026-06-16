'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LeadStage, LeadTag, Lead, FollowUpRecord, SurveyRecord, ContractAttachment, ChangeLog, DashboardStats } from './types';
import * as api from './api';

interface AppState {
  currentUser: User | null;
  users: User[];
  stages: LeadStage[];
  tags: LeadTag[];
  leads: Lead[];
  followUps: FollowUpRecord[];
  surveys: SurveyRecord[];
  attachments: ContractAttachment[];
  changeLogs: ChangeLog[];
  revisitRecords: any[];
  dashboardStats: DashboardStats;
  trendData: any[];
  performanceData: any[];
  isLoading: boolean;
  supabaseError: string | null;

  initialize: () => Promise<void>;

  login: (email: string) => Promise<boolean>;
  logout: () => void;

  updateLeadStage: (leadId: string, stageId: string) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  assignLead: (leadId: string, assigneeId: string | null) => Promise<void>;
  recycleLeadToPool: (leadId: string) => Promise<void>;
  createLead: (data: Partial<Lead>) => Promise<void>;
  batchAssignFromPool: (leadIds: string[], assigneeId: string) => Promise<void>;

  addFollowUp: (record: Omit<FollowUpRecord, 'id' | 'created_at'>) => Promise<void>;
  addSurvey: (record: Omit<SurveyRecord, 'id' | 'created_at'>) => Promise<void>;
  addAttachment: (record: Omit<ContractAttachment, 'id' | 'created_at'>) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;

  createStage: (stage: Omit<LeadStage, 'id' | 'updated_at' | 'created_at'>) => Promise<void>;
  updateStage: (stageId: string, updates: Partial<LeadStage>) => Promise<void>;
  deleteStage: (stageId: string) => Promise<void>;

  createTag: (tag: Omit<LeadTag, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTag: (tagId: string, updates: Partial<LeadTag>) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;

  createUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;

  refreshLeads: () => Promise<void>;
  refreshChangeLogs: () => Promise<void>;
}

const emptyDashboardStats: DashboardStats = {
  totalLeads: 0,
  inPool: 0,
  inProgress: 0,
  completed: 0,
  totalRevenue: 0,
  conversionRate: 0,
  avgCycleDays: 0,
  poolConversionRate: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      stages: [],
      tags: [],
      leads: [],
      followUps: [],
      surveys: [],
      attachments: [],
      changeLogs: [],
      revisitRecords: [],
      dashboardStats: emptyDashboardStats,
      trendData: [],
      performanceData: [],
      isLoading: false,
      supabaseError: null,

      initialize: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, supabaseError: null });

        try {
          const [users, stages, tags, leads, followUps, surveys, attachments, changeLogs, revisitRecords] = await Promise.all([
            api.fetchUsers(),
            api.fetchStages(),
            api.fetchTags(),
            api.fetchLeads(),
            api.fetchFollowUps(),
            api.fetchSurveys(),
            api.fetchAttachments(),
            api.fetchChangeLogs(),
            api.fetchRevisitRecords(),
          ]);

          const totalLeads = leads.length;
          const inPool = leads.filter((l) => l.is_in_pool).length;
          const completed = leads.filter((l) => {
            const s = stages.find((st) => st.id === l.stage_id);
            return s?.name === '签约成交';
          }).length;
          const inProgress = totalLeads - inPool - completed;
          const totalRevenue = leads.reduce((sum, l) => sum + (l.budget_max || 0), 0);
          const conversionRate = totalLeads > 0 ? (completed / totalLeads) * 100 : 0;

          set({
            users,
            stages,
            tags,
            leads,
            followUps,
            surveys,
            attachments,
            changeLogs,
            revisitRecords,
            dashboardStats: {
              ...emptyDashboardStats,
              totalLeads,
              inPool,
              inProgress,
              completed,
              totalRevenue,
              conversionRate,
            },
            isLoading: false,
          });
        } catch (e) {
          console.error('Failed to initialize from Supabase:', e);
          set({
            supabaseError: e instanceof Error ? e.message : 'Unknown error',
            isLoading: false,
          });
          throw e;
        }
      },

      login: async (email) => {
        try {
          const user = await api.fetchUserByEmail(email);
          if (user) {
            set({ currentUser: user });
            return true;
          }
        } catch (e) {
          console.error('Login failed:', e);
          throw e;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),

      updateLeadStage: async (leadId, stageId) => {
        const { leads, changeLogs, currentUser, stages } = get();
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) throw new Error('Lead not found');

        const oldStage = stages.find((s) => s.id === lead.stage_id);
        const newStage = stages.find((s) => s.id === stageId);

        const savedLead = await api.updateLeadStage(leadId, stageId, stages);

        const newLog: Omit<ChangeLog, 'id' | 'changed_at'> = {
          lead_id: leadId,
          field: 'stage_id',
          old_value: oldStage?.name || lead.stage_id,
          new_value: newStage?.name || stageId,
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          change_type: 'stage_change',
        };

        const savedLog = await api.addChangeLog(newLog);

        set({
          leads: leads.map((l) => (l.id === leadId ? savedLead : l)),
          changeLogs: [savedLog, ...changeLogs],
        });
      },

      updateLead: async (leadId, updates) => {
        const { leads, changeLogs, currentUser } = get();
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) throw new Error('Lead not found');

        const savedLead = await api.updateLead(leadId, updates);

        const newLogs: Omit<ChangeLog, 'id' | 'changed_at'>[] = [];
        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'stage_id' && key !== 'assignee_id') {
            const oldVal = (lead as any)[key];
            if (oldVal !== value) {
              newLogs.push({
                lead_id: leadId,
                field: key,
                old_value: oldVal !== undefined && oldVal !== null ? String(oldVal) : null,
                new_value: value !== undefined && value !== null ? String(value) : null,
                changed_by: currentUser?.id || '',
                changed_by_name: currentUser?.name || '',
                change_type: 'update',
              });
            }
          }
        });

        const savedLogs: ChangeLog[] = [];
        for (const log of newLogs) {
          const saved = await api.addChangeLog(log);
          savedLogs.push(saved);
        }

        set({
          leads: leads.map((l) => (l.id === leadId ? savedLead : l)),
          changeLogs: [...savedLogs, ...changeLogs],
        });
      },

      assignLead: async (leadId, assigneeId) => {
        const { leads, users, changeLogs, currentUser, stages } = get();
        const assignee = assigneeId ? users.find((u) => u.id === assigneeId) : null;
        const oldLead = leads.find((l) => l.id === leadId);
        if (!oldLead) throw new Error('Lead not found');

        const savedLead = await api.assignLead(leadId, assigneeId, stages, users);

        const newLog: Omit<ChangeLog, 'id' | 'changed_at'> = {
          lead_id: leadId,
          field: 'assignee_id',
          old_value: oldLead.assignee_name || null,
          new_value: assignee?.name || null,
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          change_type: 'assign',
        };

        const savedLog = await api.addChangeLog(newLog);

        set({
          leads: leads.map((l) => (l.id === leadId ? savedLead : l)),
          changeLogs: [savedLog, ...changeLogs],
        });
      },

      recycleLeadToPool: async (leadId) => {
        const { leads, changeLogs, currentUser, stages } = get();
        const oldLead = leads.find((l) => l.id === leadId);
        if (!oldLead) throw new Error('Lead not found');

        const savedLead = await api.recycleLeadToPool(leadId, stages);

        const newLog: Omit<ChangeLog, 'id' | 'changed_at'> = {
          lead_id: leadId,
          field: 'assignee_id',
          old_value: oldLead.assignee_name || null,
          new_value: '公海池',
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          change_type: 'recycle',
        };

        const savedLog = await api.addChangeLog(newLog);

        set({
          leads: leads.map((l) => (l.id === leadId ? savedLead : l)),
          changeLogs: [savedLog, ...changeLogs],
        });
      },

      createLead: async (data) => {
        const { leads, changeLogs, stages, currentUser } = get();

        const savedLead = await api.createLead(data, stages);

        const newLog: Omit<ChangeLog, 'id' | 'changed_at'> = {
          lead_id: savedLead.id,
          field: 'lead',
          old_value: null,
          new_value: '新建线索',
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          change_type: 'create',
        };

        const savedLog = await api.addChangeLog(newLog);

        set({
          leads: [savedLead, ...leads],
          changeLogs: [savedLog, ...changeLogs],
        });
      },

      batchAssignFromPool: async (leadIds, assigneeId) => {
        for (const id of leadIds) {
          await get().assignLead(id, assigneeId);
          const followStage = get().stages.find((s) => s.order === 2);
          if (followStage) {
            await get().updateLeadStage(id, followStage.id);
          }
        }
      },

      addFollowUp: async (record) => {
        const savedRecord = await api.addFollowUp(record);
        const now = new Date().toISOString();

        set({
          followUps: [savedRecord, ...get().followUps],
        });
        await get().updateLead(record.lead_id, {
          updated_at: now,
          auto_recycle_at: undefined,
        });
      },

      addSurvey: async (record) => {
        const { stages } = get();
        const savedRecord = await api.addSurvey(record);

        set({
          surveys: [savedRecord, ...get().surveys],
        });
        const surveyStage = stages.find((s) => s.order === 3);
        if (surveyStage) {
          await get().updateLeadStage(record.lead_id, surveyStage.id);
        }
      },

      addAttachment: async (record) => {
        const savedRecord = await api.addAttachment(record);

        set({
          attachments: [savedRecord, ...get().attachments],
        });
      },

      deleteAttachment: async (id) => {
        await api.deleteAttachment(id);
        set({
          attachments: get().attachments.filter((a) => a.id !== id),
        });
      },

      createStage: async (stage) => {
        const { currentUser } = get();

        const savedStage = await api.createStage({
          ...stage,
          created_by: currentUser?.id || '',
          updated_by: currentUser?.id || '',
        });

        set({
          stages: [...get().stages, savedStage],
        });
      },

      updateStage: async (stageId, updates) => {
        const { currentUser } = get();

        const savedStage = await api.updateStage(stageId, {
          ...updates,
          updated_by: currentUser?.id || '',
        });

        set({
          stages: get().stages.map((s) => (s.id === stageId ? savedStage : s)),
        });
      },

      deleteStage: async (stageId) => {
        await api.deleteStage(stageId);
        set({ stages: get().stages.filter((s) => s.id !== stageId) });
      },

      createTag: async (tag) => {
        const { currentUser } = get();

        const savedTag = await api.createTag({
          ...tag,
          created_by: currentUser?.id || '',
          updated_by: currentUser?.id || '',
        });

        set({ tags: [...get().tags, savedTag] });
      },

      updateTag: async (tagId, updates) => {
        const { currentUser } = get();

        const savedTag = await api.updateTag(tagId, {
          ...updates,
          updated_by: currentUser?.id || '',
        });

        set({
          tags: get().tags.map((t) => (t.id === tagId ? savedTag : t)),
        });
      },

      deleteTag: async (tagId) => {
        await api.deleteTag(tagId);
        set({ tags: get().tags.filter((t) => t.id !== tagId) });
      },

      createUser: async (user) => {
        const savedUser = await api.createUser(user);
        set({ users: [...get().users, savedUser] });
      },

      updateUser: async (userId, updates) => {
        const savedUser = await api.updateUser(userId, updates);
        set({
          users: get().users.map((u) => (u.id === userId ? savedUser : u)),
        });
      },

      refreshLeads: async () => {
        const leads = await api.fetchLeads();
        set({ leads });
      },

      refreshChangeLogs: async () => {
        const changeLogs = await api.fetchChangeLogs();
        set({ changeLogs });
      },
    }),
    {
      name: 'decoration-lead-pipeline-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
