'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

const isConfigured =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-url' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-supabase-anon-key';

let mockDataStore: Record<string, any[]> = {};
let nextId = 1;

function generateId() {
  return `mock-${nextId++}`;
}

function initMockData() {
  const now = new Date().toISOString();
  
  mockDataStore = {
    exhibits: [
      { id: 'exh-1', accession_number: 'EXH-2024-001', title: '青花瓷瓶', artist: '清代官窑', year: '1750', material: '陶瓷', dimensions: '30x15x15 cm', condition: 'good', status: 'in_collection', created_at: now, updated_at: now },
      { id: 'exh-2', accession_number: 'EXH-2024-002', title: '山水画轴', artist: '齐白石', year: '1920', material: '纸本水墨', dimensions: '120x60 cm', condition: 'good', status: 'in_collection', created_at: now, updated_at: now },
      { id: 'exh-3', accession_number: 'EXH-2024-003', title: '青铜鼎', artist: '商代', year: '公元前1200', material: '青铜', dimensions: '50x40x40 cm', condition: 'fair', status: 'on_loan', created_at: now, updated_at: now },
    ],
    borrowing_institutions: [
      { id: 'inst-1', name: '故宫博物院', contact_person: '张馆长', email: 'contact@dpm.org.cn', phone: '010-12345678', address: '北京市东城区景山前街4号', qualification_status: 'approved', created_at: now },
      { id: 'inst-2', name: '上海博物馆', contact_person: '李馆长', email: 'contact@shanghaimuseum.net', phone: '021-87654321', address: '上海市黄浦区人民大道201号', qualification_status: 'approved', created_at: now },
    ],
    loan_contracts: [
      { id: 'ctr-1', contract_number: 'CTR-2024-001', institution_id: 'inst-1', title: '2024故宫借展合同', start_date: '2024-06-01', end_date: '2024-09-01', status: 'confirmed', total_fee: 50000, created_at: now },
      { id: 'ctr-2', contract_number: 'CTR-2024-002', institution_id: 'inst-2', title: '2024上海博物馆借展合同', start_date: '2024-07-01', end_date: '2024-10-01', status: 'draft', total_fee: 80000, created_at: now },
    ],
    loan_applications: [
      { id: 'app-1', application_number: 'APP-2024-001', contract_id: 'ctr-1', institution_id: 'inst-1', exhibit_id: 'exh-1', start_date: '2024-06-15', end_date: '2024-08-15', purpose: '特展展出', status: 'pending_review', qualification_checked: false, availability_checked: false, schedule_checked: false, created_by: 'demo-user', created_at: now },
      { id: 'app-2', application_number: 'APP-2024-002', contract_id: 'ctr-1', institution_id: 'inst-1', exhibit_id: 'exh-2', start_date: '2024-06-15', end_date: '2024-08-15', purpose: '特展展出', status: 'confirmed', qualification_checked: true, availability_checked: true, schedule_checked: true, created_by: 'demo-user', created_at: now },
      { id: 'app-3', application_number: 'APP-2024-003', contract_id: 'ctr-2', institution_id: 'inst-2', exhibit_id: 'exh-3', start_date: '2024-07-10', end_date: '2024-09-10', purpose: '青铜器专题展', status: 'in_progress', qualification_checked: true, availability_checked: false, schedule_checked: false, created_by: 'demo-user', created_at: now },
    ],
    insurance_policies: [
      { id: 'ins-1', policy_number: 'INS-2024-001', application_id: 'app-2', insurance_company: '中国人民保险', insured_amount: 2000000, start_date: '2024-06-15', end_date: '2024-08-15', status: 'verified', verified_by: 'demo-user', verified_at: now, created_at: now },
      { id: 'ins-2', policy_number: 'INS-2024-002', application_id: 'app-3', insurance_company: '太平洋保险', insured_amount: 5000000, start_date: '2024-07-10', end_date: '2024-09-10', status: 'pending', verified_by: null, verified_at: null, created_at: now },
    ],
    transport_handovers: [
      { id: 'trp-1', transport_number: 'TRP-2024-001', application_id: 'app-2', carrier: '顺丰物流', departure_date: '2024-06-15', arrival_date: '2024-06-16', departure_signature: 'sender_sig.png', arrival_signature: 'receiver_sig.png', status: 'in_transit', created_at: now },
    ],
    shipping_crates: [
      { id: 'crt-1', crate_number: 'CRT-001', description: '大型文物专用运输箱', dimensions: '150x80x80 cm', material: '航空铝合金', current_status: 'in_use', created_at: now },
      { id: 'crt-2', crate_number: 'CRT-002', description: '中型字画运输箱', dimensions: '100x60x20 cm', material: '实木内衬', current_status: 'available', created_at: now },
    ],
    exhibition_locations: [
      { id: 'loc-1', code: 'LOC-A-01', building: '主馆', floor: '1层', room: 'A展厅', description: '主入口左侧展柜', is_active: true, created_at: now },
      { id: 'loc-2', code: 'LOC-A-02', building: '主馆', floor: '1层', room: 'A展厅', description: '中央独立展柜', is_active: true, created_at: now },
      { id: 'loc-3', code: 'LOC-B-01', building: '主馆', floor: '2层', room: 'B展厅', description: '字画墙展区', is_active: true, created_at: now },
    ],
    condition_reports: [
      { id: 'cr-1', report_number: 'CR-2024-001', exhibit_id: 'exh-3', application_id: 'app-3', report_date: '2024-06-10', reporter: '王修复师', condition_before: 'fair', condition_after: null, description: '表面有轻微氧化，整体结构完好', status: 'confirmed', photos: ['photo1.jpg'], confirmed_by: 'demo-user', confirmed_at: now, created_at: now },
    ],
    installation_records: [
      { id: 'instl-1', record_number: 'INST-2024-001', application_id: 'app-2', location_id: 'loc-2', install_date: '2024-06-18', installed_by: '张布展师', notes: '使用专用支架，水平校准完成', status: 'completed', confirmed: true, confirmed_by: 'demo-user', confirmed_at: now, created_at: now },
    ],
    deinstallation_records: [
      { id: 'deinst-1', record_number: 'DEINST-2024-001', application_id: 'app-2', location_id: 'loc-2', deinstall_date: '2024-08-20', deinstalled_by: '张布展师', notes: '撤展完成，已入箱', status: 'completed', confirmed: false, confirmed_by: null, confirmed_at: null, created_at: now },
    ],
    profiles: [
      { id: 'demo-user', email: 'admin@museum.com', full_name: '演示管理员', role: 'admin', created_at: now },
    ],
    notifications: [
      { id: 'notif-1', user_id: 'demo-user', title: '新申请待审核', message: '有1个新的借展申请等待审核', read: false, created_at: now },
      { id: 'notif-2', user_id: 'demo-user', title: '保险即将到期', message: '2份保险单将在30天内到期', read: false, created_at: now },
    ],
    error_logs: [],
    import_export_jobs: [],
    monthly_reconciliations: [],
    execution_records: [],
  };
}

if (typeof window !== 'undefined') {
  initMockData();
}

interface QueryBuilderState {
  data: any[];
  count: number | null;
  head: boolean;
}

function createQueryBuilder(initialData: any[], options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
  let state: QueryBuilderState = {
    data: [...initialData],
    count: options?.count ? initialData.length : null,
    head: options?.head || false,
  };

  const builder = {
    eq: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] === value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    neq: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] !== value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    gt: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] > value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    gte: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] >= value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    lt: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] < value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    lte: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] <= value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    like: (column: string, pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
      state.data = state.data.filter(item => regex.test(String(item[column])));
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    ilike: (column: string, pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
      state.data = state.data.filter(item => regex.test(String(item[column])));
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    in: (column: string, values: any[]) => {
      state.data = state.data.filter(item => values.includes(item[column]));
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    not: (column: string, operator: string, value: any) => {
      const tempBuilder = createQueryBuilder(state.data);
      const op = operator as keyof typeof tempBuilder;
      if (typeof tempBuilder[op] === 'function') {
        const result = (tempBuilder[op] as Function)(column, value);
        const matchedIds = result.data.map((item: any) => item.id);
        state.data = state.data.filter(item => !matchedIds.includes(item.id));
      }
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    is: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] === value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    isFilter: (column: string, value: any) => {
      state.data = state.data.filter(item => item[column] === value);
      state.count = options?.count ? state.data.length : null;
      return builder;
    },
    order: (column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) => {
      const ascending = opts?.ascending ?? true;
      state.data.sort((a, b) => {
        if (a[column] == null && b[column] == null) return 0;
        if (a[column] == null) return opts?.nullsFirst ? -1 : 1;
        if (b[column] == null) return opts?.nullsFirst ? 1 : -1;
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
      return builder;
    },
    limit: (count: number) => {
      state.data = state.data.slice(0, count);
      return builder;
    },
    range: (from: number, to: number) => {
      state.data = state.data.slice(from, to + 1);
      return builder;
    },
    single: async () => ({ 
      data: state.data[0] || null, 
      error: state.data.length > 1 ? new Error('Expected 1 result, got multiple') : null,
      count: state.count 
    }),
    maybeSingle: async () => ({ 
      data: state.data[0] || null, 
      error: null,
      count: state.count 
    }),
    then: (onFulfilled: (value: { data: any[]; count: number | null; error: null }) => any) => {
      return Promise.resolve({ 
        data: state.head ? null : state.data, 
        count: state.count, 
        error: null 
      }).then(onFulfilled);
    },
    data: state.data,
  };
  
  return builder as any;
}

function createMockClient(): any {
  console.warn('⚠️ Supabase 未配置 - 使用演示模式 (数据保存在内存中，刷新后重置)');
  
  return {
    auth: {
      getUser: async () => ({ 
        data: { 
          user: { 
            id: 'demo-user', 
            email: 'admin@museum.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } 
        }, 
        error: null 
      }),
      signInWithPassword: async () => ({ 
        data: { user: { id: 'demo-user', email: 'admin@museum.com' }, session: null }, 
        error: null 
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => console.log('Demo mode: subscription unsubscribed') 
          } 
        } 
      }),
    },
    from: (table: string) => ({
      select: (columns: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        const data = mockDataStore[table] || [];
        return createQueryBuilder(data, options);
      },
      insert: async (rows: any | any[]) => {
        const rowsArray = Array.isArray(rows) ? rows : [rows];
        const inserted = rowsArray.map(row => ({
          id: generateId(),
          ...row,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        
        if (!mockDataStore[table]) {
          mockDataStore[table] = [];
        }
        mockDataStore[table].push(...inserted);
        
        console.log(`📝 Demo模式: 已插入 ${inserted.length} 条记录到 ${table}`, inserted);
        if (typeof window !== 'undefined') {
          alert(`✅ 操作成功！已在 ${table} 中添加 ${inserted.length} 条记录\n（演示模式，刷新页面后数据会重置）`);
        }
        
        return { data: inserted, error: null };
      },
      update: (updates: any) => {
        const ret: any = {
          eq: (column: string, value: any) => {
            const data = mockDataStore[table] || [];
            let updatedCount = 0;
            const updated = data.map(item => {
              if (item[column] === value) {
                updatedCount++;
                return { ...item, ...updates, updated_at: new Date().toISOString() };
              }
              return item;
            });
            mockDataStore[table] = updated;
            console.log(`✏️ Demo模式: 已更新 ${updatedCount} 条记录在 ${table}`, updates);
            if (typeof window !== 'undefined') {
              alert(`✅ 操作成功！已更新 ${updatedCount} 条记录\n（演示模式）`);
            }
            return { data: updated.filter(item => item[column] === value), error: null };
          }
        };
        return ret;
      },
      delete: () => {
        const ret: any = {
          eq: (column: string, value: any) => {
            const data = mockDataStore[table] || [];
            const before = data.length;
            mockDataStore[table] = data.filter(item => item[column] !== value);
            const deleted = before - mockDataStore[table].length;
            console.log(`🗑️ Demo模式: 已删除 ${deleted} 条记录从 ${table}`);
            if (typeof window !== 'undefined') {
              alert(`✅ 操作成功！已删除 ${deleted} 条记录\n（演示模式）`);
            }
            return { data: null, error: null };
          }
        };
        return ret;
      },
      upsert: async (rows: any | any[]) => {
        console.log(`🔄 Demo模式: upsert 到 ${table}`, rows);
        if (typeof window !== 'undefined') {
          alert(`✅ 操作成功！数据已保存\n（演示模式）`);
        }
        return { data: Array.isArray(rows) ? rows : [rows], error: null };
      },
    }),
    rpc: async (functionName: string, params: any) => {
      console.log(`🔧 Demo模式: 调用 RPC 函数 ${functionName}`, params);
      
      const mockResults: Record<string, any> = {
        check_exhibit_availability: { data: true, error: null },
        check_institution_qualification: { data: true, error: null },
        check_condition_report_confirmed: { data: true, error: null },
        check_transport_both_signed: { data: true, error: null },
        create_execution_record: { data: { id: generateId() }, error: null },
      };
      
      return mockResults[functionName] || { data: null, error: null };
    },
  };
}

export function createClient(): SupabaseClient<Database> {
  if (!isConfigured) {
    return createMockClient() as SupabaseClient<Database>;
  }

  try {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch (error) {
    console.error('Failed to create Supabase client, falling back to mock:', error);
    return createMockClient() as SupabaseClient<Database>;
  }
}

export const supabase = createClient();
