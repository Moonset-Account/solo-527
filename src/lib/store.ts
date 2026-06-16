'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LeadStage, LeadTag, Lead, FollowUpRecord, SurveyRecord, ContractAttachment, ChangeLog, DashboardStats } from './types';
import { mockUsers, mockStages, mockTags, mockLeads, mockFollowUps, mockSurveys, mockAttachments, mockChangeLogs, mockRevisitRecords, mockDashboardStats, mockTrendData, mockPerformanceData } from './mock-data';
import { generateId } from './utils';
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

  createStage: (stage: Omit<LeadStage, 'id' | 'updated_at' | 'created_at'>) => Promise<void>;
  updateStage: (stageId: string, updates: Partial<LeadStage>) => Promise<void>;
  deleteStage: (stageId: string) => Promise<void>;

  createTag: (tag: Omit<LeadTag, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTag: (tagId: string, updates: Partial<LeadTag>) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;

  createUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      stages: mockStages,
      tags: mockTags,
      leads: mockLeads,
      followUps: mockFollowUps,
      surveys: mockSurveys,
      attachments: mockAttachments,
      changeLogs: mockChangeLogs,
      revisitRecords: mockRevisitRecords,
      dashboardStats: mockDashboardStats,
      trendData: mockTrendData,
      performanceData: mockPerformanceData,
      isLoading: false,

      initialize: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        
        try {
          const [users, stages, tags, leads, followUps, surveys, attachments, changeLogs] = await Promise.all([
            api.fetchUsers(),
            api.fetchStages(),
            api.fetchTags(),
            api.fetchLeads(),
            api.fetchFollowUps(),
            api.fetchSurveys(),
            api.fetchAttachments(),
            api.fetchChangeLogs(),
          ]);
          
          set({
            users,
            stages,
            tags,
            leads,
            followUps,
            surveys,
            attachments,
            changeLogs,
            isLoading: false,
          });
        } catch (e) {
          console.warn('Failed to initialize from Supabase, using mock data:', e);
          set({ isLoading: false });
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
          console.warn('Login via API failed, trying local:', e);
        }
        const user = get().users.find((u) => u.email === email);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),

      updateLeadStage: async (leadId, stageId) => {
        const { leads, changeLogs, currentUser, stages } = get();
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return;
        const oldStage = stages.find((s) => s.id === lead.stage_id);
        const newStage = stages.find((s) => s.id === stageId);

        let savedLead: Lead | null = null;
        try {
          savedLead = await api.updateLeadStage(leadId, stageId, stages);
        } catch (e) {
          console.warn('Failed to update stage via API:', e);
        }

        const updatedLead = savedLead || {
          ...lead,
          stage_id: stageId,
          is_in_pool: newStage?.order === 0,
          updated_at: new Date().toISOString(),
          assignee_id: newStage?.order === 0 ? undefined : lead.assignee_id,
          assignee_name: newStage?.order === 0 ? undefined : lead.assignee_name,
        };

        const newLog: ChangeLog = {
          id: generateId(),
          lead_id: leadId,
          field: 'stage_id',
          old_value: oldStage?.name || lead.stage_id,
          new_value: newStage?.name || stageId,
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          changed_at: new Date().toISOString(),
          change_type: 'stage_change',
        };

        try {
          await api.addChangeLog(newLog);
        } catch (e) {
          console.warn('Failed to add change log via API:', e);
        }

        set({
          leads: leads.map((l) => (l.id === leadId ? updatedLead : l)),
          changeLogs: [newLog, ...changeLogs],
        });
      },

      updateLead: async (leadId, updates) => {
        const { leads, changeLogs, currentUser } = get();
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return;

        let savedLead: Lead | null = null;
        try {
          savedLead = await api.updateLead(leadId, updates);
        } catch (e) {
          console.warn('Failed to update lead via API:', e);
        }

        const updatedLead = savedLead || {
          ...lead,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const newLogs: ChangeLog[] = [];
        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'stage_id' && key !== 'assignee_id') {
            const oldVal = (lead as any)[key];
            newLogs.push({
              id: generateId(),
              lead_id: leadId,
              field: key,
              old_value: oldVal !== undefined && oldVal !== null ? String(oldVal) : undefined,
              new_value: value !== undefined && value !== null ? String(value) : undefined,
              changed_by: currentUser?.id || '',
              changed_by_name: currentUser?.name || '',
              changed_at: new Date().toISOString(),
              change_type: 'update',
            });
          }
        });

        try {
          for (const log of newLogs) {
            await api.addChangeLog(log);
          }
        } catch (e) {
          console.warn('Failed to add change logs via API:', e);
        }

        set({
          leads: leads.map((l) => (l.id === leadId ? updatedLead : l)),
          changeLogs: [...newLogs, ...changeLogs],
        });
      },

      assignLead: async (leadId, assigneeId) => {
        const { leads, users, changeLogs, currentUser, stages } = get();
        const assignee = assigneeId ? users.find((u) => u.id === assigneeId) : null;

        let savedLead: Lead | null = null;
        try {
          savedLead = await api.assignLead(leadId, assigneeId, stages, users);
        } catch (e) {
          console.warn('Failed to assign lead via API:', e);
        }

        const assignStage = stages.find((s) => s.order === 2);
        const updatedLead = savedLead || {
          ...leads.find((l) => l.id === leadId)!,
          assignee_id: assigneeId || undefined,
          assignee_name: assignee?.name,
          is_in_pool: false,
          stage_id: assignStage?.id || leadId,
          updated_at: new Date().toISOString(),
          auto_recycle_at: undefined,
        };

        const newLog: ChangeLog = {
          id: generateId(),
          lead_id: leadId,
          field: 'assignee_id',
          old_value: (leads.find((l) => l.id === leadId)?.assignee_name),
          new_value: assignee?.name,
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          changed_at: new Date().toISOString(),
          change_type: 'assign',
        };

        try {
          await api.addChangeLog(newLog);
        } catch (e) {
          console.warn('Failed to add change log via API:', e);
        }

        set({
          leads: leads.map((l) => (l.id === leadId ? updatedLead : l)),
          changeLogs: [newLog, ...changeLogs],
        });
      },

      recycleLeadToPool: async (leadId) => {
        const { leads, changeLogs, currentUser, stages } = get();
        const poolStage = stages.find((s) => s.order === 0);
        const lead = leads.find((l) => l.id === leadId);

        let savedLead: Lead | null = null;
        try {
          savedLead = await api.recycleLeadToPool(leadId, stages);
        } catch (e) {
          console.warn('Failed to recycle lead via API:', e);
        }

        const updatedLead = savedLead || {
          ...leads.find((l) => l.id === leadId)!,
          is_in_pool: true,
          stage_id: poolStage?.id || leadId,
          assignee_id: undefined,
          assignee_name: undefined,
          updated_at: new Date().toISOString(),
        };

        const newLog: ChangeLog = {
          id: generateId(),
          lead_id: leadId,
          field: 'assignee_id',
          old_value: lead?.assignee_name,
          new_value: '公海池',
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          changed_at: new Date().toISOString(),
          change_type: 'recycle',
        };

        try {
          await api.addChangeLog(newLog);
        } catch (e) {
          console.warn('Failed to add change log via API:', e);
        }

        set({
          leads: leads.map((l) => (l.id === leadId ? updatedLead : l)),
          changeLogs: [newLog, ...changeLogs],
        });
      },

      createLead: async (data) => {
        const { leads, changeLogs, stages, currentUser } = get();
        const now = new Date().toISOString();

        let savedLead: Lead | null = null;
        try {
          savedLead = await api.createLead(data, stages);
        } catch (e) {
          console.warn('Failed to create lead via API:', e);
        }

        const poolStage = stages.find((s) => s.order === 0);
        const newLead = savedLead || {
          id: generateId(),
          customer_name: data.customer_name || '',
          phone: data.phone || '',
          community: data.community,
          area: data.area,
          budget_min: data.budget_min,
          budget_max: data.budget_max,
          style: data.style,
          source: data.source,
          stage_id: poolStage?.id || stages[0].id,
          tags: data.tags || [],
          remark: data.remark,
          is_in_pool: true,
          assignee_id: undefined,
          assignee_name: undefined,
          auto_recycle_at: undefined,
          created_at: now,
          updated_at: now,
        };

        const newLog: ChangeLog = {
          id: generateId(),
          lead_id: newLead.id,
          field: 'lead',
          old_value: undefined,
          new_value: '新建线索',
          changed_by: currentUser?.id || '',
          changed_by_name: currentUser?.name || '',
          changed_at: now,
          change_type: 'create',
        };

        try {
          await api.addChangeLog(newLog);
        } catch (e) {
          console.warn('Failed to add change log via API:', e);
        }

        set({
          leads: [newLead, ...leads],
          changeLogs: [newLog, ...changeLogs],
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
        const now = new Date().toISOString();

        let savedRecord: FollowUpRecord | null = null;
        try {
          savedRecord = await api.addFollowUp(record);
        } catch (e) {
          console.warn('Failed to add follow-up via API:', e);
        }

        const newRecord = savedRecord || {
          ...record,
          id: generateId(),
          created_at: now,
          follow_up_time: record.follow_up_time || now,
        };

        set({
          followUps: [newRecord, ...get().followUps],
        });
        await get().updateLead(record.lead_id, {
          updated_at: now,
          auto_recycle_at: undefined,
        });
      },

      addSurvey: async (record) => {
        const { stages } = get();
        const now = new Date().toISOString();

        let savedRecord: SurveyRecord | null = null;
        try {
          savedRecord = await api.addSurvey(record);
        } catch (e) {
          console.warn('Failed to add survey via API:', e);
        }

        const newRecord = savedRecord || {
          ...record,
          id: generateId(),
          created_at: now,
          survey_time: record.survey_time || now,
        };

        set({
          surveys: [newRecord, ...get().surveys],
        });
        const surveyStage = stages.find((s) => s.order === 3);
        if (surveyStage) {
          await get().updateLeadStage(record.lead_id, surveyStage.id);
        }
      },

      addAttachment: async (record) => {
        const now = new Date().toISOString();

        let savedRecord: ContractAttachment | null = null;
        try {
          savedRecord = await api.addAttachment(record);
        } catch (e) {
          console.warn('Failed to add attachment via API:', e);
        }

        const newRecord = savedRecord || {
          ...record,
          id: generateId(),
          created_at: now,
        };

        set({
          attachments: [newRecord, ...get().attachments],
        });
      },

      createStage: async (stage) => {
        const { currentUser, stages } = get();
        const now = new Date().toISOString();

        let savedStage: LeadStage | null = null;
        try {
          savedStage = await api.createStage({
            ...stage,
            created_by: currentUser?.id || '',
            updated_by: currentUser?.id || '',
          });
        } catch (e) {
          console.warn('Failed to create stage via API:', e);
        }

        const newStage = savedStage || {
          ...stage,
          id: generateId(),
          created_by: currentUser?.id || '',
          updated_by: currentUser?.id || '',
          created_at: now,
          updated_at: now,
        };

        set({
          stages: [...stages, newStage],
        });
      },
      updateStage: async (stageId, updates) => {
        const { currentUser, stages } = get();

        let savedStage: LeadStage | null = null;
        try {
          savedStage = await api.updateStage(stageId, {
            ...updates,
            updated_by: currentUser?.id || '',
          });
        } catch (e) {
          console.warn('Failed to update stage via API:', e);
        }

        set({
          stages: stages.map((s) =>
            s.id === stageId
              ? savedStage || { ...s, ...updates, updated_by: currentUser?.id || '', updated_at: new Date().toISOString() }
              : s
          ),
        });
      },
      deleteStage: async (stageId) => {
        try {
          await api.deleteStage(stageId);
        } catch (e) {
          console.warn('Failed to delete stage via API:', e);
        }
        set({ stages: get().stages.filter((s) => s.id !== stageId) });
      },

      createTag: async (tag) => {
        const { currentUser, tags } = get();
        const now = new Date().toISOString();

        let savedTag: LeadTag | null = null;
        try {
          savedTag = await api.createTag({
            ...tag,
            created_by: currentUser?.id || '',
            updated_by: currentUser?.id || '',
          });
        } catch (e) {
          console.warn('Failed to create tag via API:', e);
        }

        const newTag = savedTag || {
          ...tag,
          id: generateId(),
          created_by: currentUser?.id || '',
          updated_by: currentUser?.id || '',
          created_at: now,
          updated_at: now,
        };

        set({ tags: [...tags, newTag] });
      },
      updateTag: async (tagId, updates) => {
        const { currentUser, tags } = get();

        let savedTag: LeadTag | null = null;
        try {
          savedTag = await api.updateTag(tagId, {
            ...updates,
            updated_by: currentUser?.id || '',
          });
        } catch (e) {
          console.warn('Failed to update tag via API:', e);
        }

        set({
          tags: tags.map((t) =>
            t.id === tagId
              ? savedTag || { ...t, ...updates, updated_by: currentUser?.id || '', updated_at: new Date().toISOString() }
              : t
          ),
        });
      },
      deleteTag: async (tagId) => {
        try {
          await api.deleteTag(tagId);
        } catch (e) {
          console.warn('Failed to delete tag via API:', e);
        }
        set({ tags: get().tags.filter((t) => t.id !== tagId) });
      },

      createUser: async (user) => {
        const { users } = get();

        let savedUser: User | null = null;
        try {
          savedUser = await api.createUser(user);
        } catch (e) {
          console.warn('Failed to create user via API:', e);
        }

        const now = new Date().toISOString();
        const newUser = savedUser || {
          ...user,
          id: generateId(),
          created_at: now,
          updated_at: now,
        };

        set({ users: [...users, newUser] });
      },
      updateUser: async (userId, updates) => {
        const { users } = get();

        let savedUser: User | null = null;
        try {
          savedUser = await api.updateUser(userId, updates);
        } catch (e) {
          console.warn('Failed to update user via API:', e);
        }

        set({
          users: users.map((u) =>
            u.id === userId
              ? savedUser || { ...u, ...updates, updated_at: new Date().toISOString() }
              : u
          ),
        });
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
