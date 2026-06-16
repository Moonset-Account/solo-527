'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LeadStage, LeadTag, Lead, FollowUpRecord, SurveyRecord, ContractAttachment, ChangeLog, RevisitRecord, DashboardStats } from './types';
import { mockUsers, mockStages, mockTags, mockLeads, mockFollowUps, mockSurveys, mockAttachments, mockChangeLogs, mockRevisitRecords, mockDashboardStats, mockTrendData, mockPerformanceData } from './mock-data';
import { generateId } from './utils';

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
  revisitRecords: RevisitRecord[];
  dashboardStats: DashboardStats;
  trendData: any[];
  performanceData: any[];

  login: (email: string) => boolean;
  logout: () => void;

  updateLeadStage: (leadId: string, stageId: string) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  assignLead: (leadId: string, assigneeId: string | null) => void;
  recycleLeadToPool: (leadId: string) => void;
  createLead: (data: Partial<Lead>) => void;
  batchAssignFromPool: (leadIds: string[], assigneeId: string) => void;

  addFollowUp: (record: Omit<FollowUpRecord, 'id' | 'created_at'>) => void;
  addSurvey: (record: Omit<SurveyRecord, 'id' | 'created_at'>) => void;
  addAttachment: (record: Omit<ContractAttachment, 'id' | 'created_at'>) => void;

  createStage: (stage: Omit<LeadStage, 'id' | 'updated_at'>) => void;
  updateStage: (stageId: string, updates: Partial<LeadStage>) => void;
  deleteStage: (stageId: string) => void;

  createTag: (tag: Omit<LeadTag, 'id'>) => void;
  updateTag: (tagId: string, updates: Partial<LeadTag>) => void;
  deleteTag: (tagId: string) => void;

  createUser: (user: Omit<User, 'id' | 'created_at'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
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

      login: (email) => {
        const user = get().users.find((u) => u.email === email);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),

      updateLeadStage: (leadId, stageId) => {
        const { leads, changeLogs, currentUser, stages } = get();
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return;
        const oldStage = stages.find((s) => s.id === lead.stage_id);
        const newStage = stages.find((s) => s.id === stageId);

        set({
          leads: leads.map((l) =>
            l.id === leadId
              ? { ...l, stage_id: stageId, is_in_pool: stageId === 'stage-pool', updated_at: new Date().toISOString() }
              : l
          ),
          changeLogs: [
            ...changeLogs,
            {
              id: generateId(),
              lead_id: leadId,
              field: 'stage_id',
              old_value: oldStage?.name || lead.stage_id,
              new_value: newStage?.name || stageId,
              changed_by: currentUser?.id || '',
              changed_by_name: currentUser?.name || '',
              changed_at: new Date().toISOString(),
              change_type: 'stage_change',
            },
          ],
        });
      },

      updateLead: (leadId, updates) => {
        const { leads, changeLogs, currentUser } = get();
        set({
          leads: leads.map((l) =>
            l.id === leadId ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
          ),
        });
        Object.entries(updates).forEach(([key, value]) => {
          if (key !== 'stage_id' && key !== 'assignee_id') {
            set({
              changeLogs: [
                ...get().changeLogs,
                {
                  id: generateId(),
                  lead_id: leadId,
                  field: key,
                  new_value: value,
                  changed_by: currentUser?.id || '',
                  changed_by_name: currentUser?.name || '',
                  changed_at: new Date().toISOString(),
                  change_type: 'update',
                },
              ],
            });
          }
        });
      },

      assignLead: (leadId, assigneeId) => {
        const { leads, users, changeLogs, currentUser, stages } = get();
        const assignee = assigneeId ? users.find((u) => u.id === assigneeId) : null;
        const assignStage = stages.find((s) => s.order === 2);
        set({
          leads: leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  assignee_id: assigneeId || undefined,
                  assignee_name: assignee?.name,
                  is_in_pool: false,
                  stage_id: assignStage?.id || l.stage_id,
                  updated_at: new Date().toISOString(),
                  auto_recycle_at: undefined,
                }
              : l
          ),
          changeLogs: [
            ...changeLogs,
            {
              id: generateId(),
              lead_id: leadId,
              field: 'assignee_id',
              new_value: assignee?.name,
              changed_by: currentUser?.id || '',
              changed_by_name: currentUser?.name || '',
              changed_at: new Date().toISOString(),
              change_type: 'assign',
            },
          ],
        });
      },

      recycleLeadToPool: (leadId) => {
        const { leads, changeLogs, currentUser, stages } = get();
        const poolStage = stages.find((s) => s.order === 0);
        set({
          leads: leads.map((l) =>
            l.id === leadId
              ? { ...l, is_in_pool: true, stage_id: poolStage?.id || l.stage_id, assignee_id: undefined, assignee_name: undefined, updated_at: new Date().toISOString() }
              : l
          ),
          changeLogs: [
            ...changeLogs,
            {
              id: generateId(),
              lead_id: leadId,
              changed_by: currentUser?.id || '',
              changed_by_name: currentUser?.name || '',
              changed_at: new Date().toISOString(),
              change_type: 'recycle',
            },
          ],
        });
      },

      createLead: (data) => {
        const { leads, changeLogs, stages, currentUser } = get();
        const poolStage = stages.find((s) => s.order === 0);
        const newLead: Lead = {
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set({
          leads: [newLead, ...leads],
          changeLogs: [
            ...changeLogs,
            {
              id: generateId(),
              lead_id: newLead.id,
              changed_by: currentUser?.id || '',
              changed_by_name: currentUser?.name || '',
              changed_at: new Date().toISOString(),
              change_type: 'create',
            },
          ],
        });
      },

      batchAssignFromPool: (leadIds, assigneeId) => {
        const { users, stages } = get();
        const assignee = users.find((u) => u.id === assigneeId);
        const followStage = stages.find((s) => s.order === 2);
        leadIds.forEach((id) => {
          get().assignLead(id, assigneeId);
          if (followStage) {
            get().updateLeadStage(id, followStage.id);
          }
        });
      },

      addFollowUp: (record) => {
        set({
          followUps: [
            { ...record, id: generateId(), created_at: new Date().toISOString() },
            ...get().followUps,
          ],
        });
        get().updateLead(record.lead_id, { updated_at: new Date().toISOString(), auto_recycle_at: undefined });
      },

      addSurvey: (record) => {
        const { stages } = get();
        set({
          surveys: [
            { ...record, id: generateId(), created_at: new Date().toISOString() },
            ...get().surveys,
          ],
        });
        const surveyStage = stages.find((s) => s.order === 3);
        if (surveyStage) {
          get().updateLeadStage(record.lead_id, surveyStage.id);
        }
      },

      addAttachment: (record) => {
        set({
          attachments: [
            { ...record, id: generateId(), created_at: new Date().toISOString() },
            ...get().attachments,
          ],
        });
      },

      createStage: (stage) => {
        const { stages, currentUser } = get();
        set({
          stages: [
            ...stages,
            { ...stage, id: generateId(), updated_at: new Date().toISOString(), created_by: currentUser?.id, updated_by: currentUser?.id },
          ],
        });
      },
      updateStage: (stageId, updates) => {
        const { stages, currentUser } = get();
        set({
          stages: stages.map((s) =>
            s.id === stageId ? { ...s, ...updates, updated_by: currentUser?.id, updated_at: new Date().toISOString() } : s
          ),
        });
      },
      deleteStage: (stageId) => {
        set({ stages: get().stages.filter((s) => s.id !== stageId) });
      },

      createTag: (tag) => {
        set({ tags: [...get().tags, { ...tag, id: generateId() }] });
      },
      updateTag: (tagId, updates) => {
        set({
          tags: get().tags.map((t) => (t.id === tagId ? { ...t, ...updates } : t)),
        });
      },
      deleteTag: (tagId) => {
        set({ tags: get().tags.filter((t) => t.id !== tagId) });
      },

      createUser: (user) => {
        set({
          users: [...get().users, { ...user, id: generateId(), created_at: new Date().toISOString() }],
        });
      },
      updateUser: (userId, updates) => {
        set({
          users: get().users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
        });
      },
    }),
    {
      name: 'decoration-lead-pipeline-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        leads: state.leads,
        followUps: state.followUps,
        changeLogs: state.changeLogs,
        surveys: state.surveys,
        attachments: state.attachments,
      }),
    }
  )
);
