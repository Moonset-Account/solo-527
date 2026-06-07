import { invoke } from '@tauri-apps/api/tauri';

async function safeInvoke(command, args = {}) {
  try {
    return await invoke(command, args);
  } catch (e) {
    console.warn(`Tauri command ${command} failed, using mock data:`, e);
    return getMockData(command, args);
  }
}

function getMockData(command, args) {
  const mocks = {
    init_database: () => 'OK',
    get_batch_pass_rates: () => [
      { batch_code: 'BATCH-2024-01', total_count: 50, pass_count: 45, pass_rate: 0.90, is_pending: false },
      { batch_code: 'BATCH-2024-02', total_count: 45, pass_count: 38, pass_rate: 0.844, is_pending: false },
      { batch_code: 'BATCH-2024-03', total_count: 20, pass_count: 16, pass_rate: 0.80, is_pending: true },
    ],
    get_resample_reason_stats: () => [
      { reason_category: '样本质量问题', count: 4, percentage: 57.14 },
      { reason_category: '信息录入错误', count: 1, percentage: 14.29 },
      { reason_category: '设备问题', count: 1, percentage: 14.29 },
      { reason_category: '受试者原因', count: 1, percentage: 14.29 },
    ],
    get_backlog_stats: () => ({
      total_pending: 13,
      pending_over_24h: 8,
      pending_over_72h: 3,
    }),
    get_sample_evidence: () => ({
      sample: {
        id: 'sample-uuid-1',
        sample_code: 'S-B1-010',
        batch_code: 'BATCH-2024-01',
        volunteer_id: 'vol-uuid-1',
        sample_type: '血液',
        collection_time: '2024-05-15T10:30:00Z',
        initial_result: '指标异常',
        initial_status: 'fail',
        reviewer_id: 'R001',
        review_time: '2024-05-16T14:20:00Z',
        is_dirty: false,
        dirty_reason: null,
      },
      volunteer: {
        id: 'vol-uuid-1',
        volunteer_code: 'V001',
        name: '张三',
        gender: '男',
        age: 28,
        phone: '13800138001',
        is_dirty: false,
      },
      resamples: [
        {
          id: 'resample-uuid-1',
          original_sample_id: 'sample-uuid-1',
          new_sample_id: 'sample-uuid-2',
          reason: '样本溶血，无法检测',
          reason_category: '样本质量问题',
          operator: 'O001',
          resample_time: '2024-05-17T09:00:00Z',
        }
      ],
      screenshots: [
        {
          id: 'shot-uuid-1',
          sample_id: 'sample-uuid-1',
          screenshot_path: '/screenshots/S-B1-010_1.png',
          description: '初检异常波形图',
          uploaded_by: 'R001',
          uploaded_at: '2024-05-16T15:00:00Z',
        }
      ],
      review_history: [
        {
          id: 'review-uuid-1',
          sample_id: 'sample-uuid-1',
          first_reviewer: 'R001',
          first_review_result: 'fail',
          first_review_time: '2024-05-16T14:20:00Z',
          status: 'pending',
          comment: '需要确认异常原因',
        }
      ],
    }),
    mark_sample_dirty: () => 'OK',
    get_pending_second_reviews: () => [
      { id: 'r1', sample_id: 's1', first_reviewer: 'R001', first_review_result: 'fail', first_review_time: '2024-05-20T10:00:00Z', status: 'pending' },
      { id: 'r2', sample_id: 's2', first_reviewer: 'R002', first_review_result: 'fail', first_review_time: '2024-05-19T08:00:00Z', status: 'pending' },
      { id: 'r3', sample_id: 's3', first_reviewer: 'R001', first_review_result: 'fail', first_review_time: '2024-05-18T16:00:00Z', status: 'pending' },
    ],
    export_offline_bundle: () => '/tmp/sync_bundle.json',
    import_offline_bundle: () => 100,
    export_csv_report: () => 115,
  };
  return mocks[command] ? mocks[command]() : null;
}

export const api = {
  initDatabase: () => safeInvoke('init_database'),
  getBatchPassRates: (includeDirty) => safeInvoke('get_batch_pass_rates', { includeDirty: includeDirty || false }),
  getResampleReasonStats: () => safeInvoke('get_resample_reason_stats'),
  getBacklogStats: () => safeInvoke('get_backlog_stats'),
  getSampleEvidence: (sampleId) => safeInvoke('get_sample_evidence', { sampleId }),
  markSampleDirty: (sampleId, reason) => safeInvoke('mark_sample_dirty', { sampleId, reason }),
  getPendingSecondReviews: (onlyOverdue) => safeInvoke('get_pending_second_reviews', { onlyOverdue: onlyOverdue || false }),
  exportOfflineBundle: () => safeInvoke('export_offline_bundle'),
  importOfflineBundle: (filePath) => safeInvoke('import_offline_bundle', { filePath }),
  exportCsvReport: (filterParams, filePath) => safeInvoke('export_csv_report', { filterParams, filePath }),
};
