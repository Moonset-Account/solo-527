import pool from './db';
import { Channel, Sample, ReviewQueueItem } from './mockData';

export async function getChannelsDB(): Promise<Channel[]> {
  const result = await pool.query(`
    SELECT 
      id,
      name,
      total_samples as "totalSamples",
      quality_score as "qualityScore",
      pending_review as "pendingReview",
      fast_answer_count as "fastAnswerCount",
      duplicate_submission_count as "duplicateSubmissionCount",
      device_concentration_count as "deviceConcentrationCount",
      skip_abnormal_count as "skipAbnormalCount",
      open_copy_count as "openCopyCount",
      to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt"
    FROM channels
    ORDER BY updated_at DESC
  `);
  return result.rows;
}

export async function getChannelByIdDB(id: string): Promise<Channel | null> {
  const result = await pool.query(`
    SELECT 
      id,
      name,
      total_samples as "totalSamples",
      quality_score as "qualityScore",
      pending_review as "pendingReview",
      fast_answer_count as "fastAnswerCount",
      duplicate_submission_count as "duplicateSubmissionCount",
      device_concentration_count as "deviceConcentrationCount",
      skip_abnormal_count as "skipAbnormalCount",
      open_copy_count as "openCopyCount",
      to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt"
    FROM channels
    WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function getSamplesByChannelDB(channelId: string): Promise<Sample[]> {
  const result = await pool.query(`
    SELECT 
      id,
      channel_id as "channelId",
      channel_name as "channelName",
      total_duration as "totalDuration",
      device_id as "deviceId",
      ip_region as "ipRegion",
      abnormal_types as "abnormalTypes",
      status,
      question_group_durations as "questionGroupDurations",
      skip_pattern as "skipPattern",
      open_answers as "openAnswers",
      to_char(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as "submittedAt"
    FROM samples
    WHERE channel_id = $1
    ORDER BY submitted_at DESC
  `, [channelId]);
  return result.rows;
}

export async function getReviewQueueDB(status?: string, channelId?: string): Promise<ReviewQueueItem[]> {
  let query = `
    SELECT 
      id,
      sample_id as "sampleId",
      channel_id as "channelId",
      channel_name as "channelName",
      abnormal_types as "abnormalTypes",
      to_char(marked_at, 'YYYY-MM-DD HH24:MI:SS') as "markedAt",
      status,
      reviewer,
      to_char(reviewed_at, 'YYYY-MM-DD HH24:MI:SS') as "reviewedAt"
    FROM review_queue
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status && status !== 'all') {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (channelId) {
    params.push(channelId);
    query += ` AND channel_id = $${params.length}`;
  }
  
  query += ` ORDER BY marked_at DESC`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getPendingReviewCountDB(): Promise<number> {
  const result = await pool.query(`
    SELECT COUNT(*) as count FROM review_queue WHERE status = 'pending'
  `);
  return parseInt(result.rows[0].count, 10);
}

export async function getDurationBinsDB(channelId?: string): Promise<{ label: string; count: number }[]> {
  let whereClause = '';
  const params: any[] = [];
  
  if (channelId) {
    params.push(channelId);
    whereClause = `WHERE channel_id = $1`;
  }

  const result = await pool.query(`
    SELECT 
      CASE 
        WHEN total_duration BETWEEN 0 AND 60 THEN '0-60秒'
        WHEN total_duration BETWEEN 61 AND 120 THEN '61-120秒'
        WHEN total_duration BETWEEN 121 AND 180 THEN '121-180秒'
        WHEN total_duration BETWEEN 181 AND 300 THEN '181-300秒'
        WHEN total_duration BETWEEN 301 AND 600 THEN '301-600秒'
        ELSE '600秒以上'
      END as label,
      COUNT(*) as count
    FROM samples
    ${whereClause}
    GROUP BY label
    ORDER BY MIN(total_duration)
  `, params);
  
  const allBins = [
    '0-60秒',
    '61-120秒',
    '121-180秒',
    '181-300秒',
    '301-600秒',
    '600秒以上',
  ];
  
  return allBins.map(label => {
    const found = result.rows.find(r => r.label === label);
    return { label, count: found ? parseInt(found.count, 10) : 0 };
  });
}

export async function getDeviceAggregationDB(channelId?: string): Promise<{ deviceId: string; count: number }[]> {
  let whereClause = '';
  const params: any[] = [];
  
  if (channelId) {
    params.push(channelId);
    whereClause = `WHERE channel_id = $1`;
  }

  const result = await pool.query(`
    SELECT 
      device_id as "deviceId",
      COUNT(*) as count
    FROM samples
    ${whereClause}
    GROUP BY device_id
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `, params);
  
  return result.rows.map(r => ({
    deviceId: r.deviceId,
    count: parseInt(r.count, 10),
  }));
}

export async function getIpRegionAggregationDB(channelId?: string): Promise<{ region: string; count: number }[]> {
  let whereClause = '';
  const params: any[] = [];
  
  if (channelId) {
    params.push(channelId);
    whereClause = `WHERE channel_id = $1`;
  }

  const result = await pool.query(`
    SELECT 
      ip_region as region,
      COUNT(*) as count
    FROM samples
    ${whereClause}
    GROUP BY ip_region
    ORDER BY count DESC
  `, params);
  
  return result.rows.map(r => ({
    region: r.region,
    count: parseInt(r.count, 10),
  }));
}

export async function getAbnormalSamplesDB(channelId?: string): Promise<Sample[]> {
  let whereClause = 'WHERE array_length(abnormal_types, 1) > 0';
  const params: any[] = [];
  
  if (channelId) {
    params.push(channelId);
    whereClause += ` AND channel_id = $1`;
  }

  const result = await pool.query(`
    SELECT 
      id,
      channel_id as "channelId",
      channel_name as "channelName",
      total_duration as "totalDuration",
      device_id as "deviceId",
      ip_region as "ipRegion",
      abnormal_types as "abnormalTypes",
      status,
      question_group_durations as "questionGroupDurations",
      skip_pattern as "skipPattern",
      open_answers as "openAnswers",
      to_char(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as "submittedAt"
    FROM samples
    ${whereClause}
    ORDER BY submitted_at DESC
  `, params);
  
  return result.rows;
}

export async function batchReviewDB(
  ids: string[],
  action: 'approved' | 'rejected',
  reviewer: string = '调研经理'
): Promise<{ processedCount: number; updatedChannelIds: string[] }> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const updateQueueResult = await client.query(`
      UPDATE review_queue
      SET 
        status = $1,
        reviewer = $2,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ANY($3) AND status = 'pending'
      RETURNING id, channel_id
    `, [action, reviewer, ids]);
    
    const processedIds = updateQueueResult.rows.map(r => r.id);
    const affectedChannelIds = [...new Set(updateQueueResult.rows.map(r => r.channel_id))];
    
    if (processedIds.length > 0) {
      const sampleIdsResult = await client.query(`
        SELECT sample_id FROM review_queue WHERE id = ANY($1)
      `, [processedIds]);
      
      const sampleIds = sampleIdsResult.rows.map(r => r.sample_id);
      
      await client.query(`
        UPDATE samples
        SET status = $1
        WHERE id = ANY($2)
      `, [action, sampleIds]);
      
      for (const channelId of affectedChannelIds) {
        await client.query(`
          WITH channel_stats AS (
            SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
              COUNT(*) FILTER (WHERE status != 'rejected' AND 'fast_answer' = ANY(abnormal_types)) as fast_count,
              COUNT(*) FILTER (WHERE status != 'rejected' AND 'duplicate_submission' = ANY(abnormal_types)) as duplicate_count,
              COUNT(*) FILTER (WHERE status != 'rejected' AND 'device_concentration' = ANY(abnormal_types)) as device_count,
              COUNT(*) FILTER (WHERE status != 'rejected' AND 'skip_abnormal' = ANY(abnormal_types)) as skip_count,
              COUNT(*) FILTER (WHERE status != 'rejected' AND 'open_copy' = ANY(abnormal_types)) as open_count,
              COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
              COUNT(*) FILTER (WHERE status = 'approved') as approved_count
            FROM samples
            WHERE channel_id = $1
          )
          UPDATE channels
          SET 
            total_samples = cs.total,
            pending_review = cs.pending_count,
            fast_answer_count = cs.fast_count,
            duplicate_submission_count = cs.duplicate_count,
            device_concentration_count = cs.device_count,
            skip_abnormal_count = cs.skip_count,
            open_copy_count = cs.open_count,
            quality_score = ROUND(
              100 
              - (cs.rejected_count::float / NULLIF(cs.total, 0) * 40)
              - (cs.pending_count::float / NULLIF(cs.total, 0) * 10)
              - (
                  (cs.fast_count * 0.5 + cs.duplicate_count * 1.5 + cs.device_count * 1 + cs.skip_count * 0.8 + cs.open_count * 1.2) 
                  / NULLIF(cs.total, 0) * 30
                )
            ),
            updated_at = CURRENT_TIMESTAMP
          FROM channel_stats cs
          WHERE id = $1
        `, [channelId]);
      }
    }
    
    await client.query('COMMIT');
    
    return {
      processedCount: processedIds.length,
      updatedChannelIds: affectedChannelIds,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getSampleByIdDB(id: string): Promise<Sample | null> {
  const result = await pool.query(`
    SELECT 
      id,
      channel_id as "channelId",
      channel_name as "channelName",
      total_duration as "totalDuration",
      device_id as "deviceId",
      ip_region as "ipRegion",
      abnormal_types as "abnormalTypes",
      status,
      question_group_durations as "questionGroupDurations",
      skip_pattern as "skipPattern",
      open_answers as "openAnswers",
      to_char(submitted_at, 'YYYY-MM-DD HH24:MI:SS') as "submittedAt"
    FROM samples
    WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function reviewSingleSampleBySampleIdDB(
  sampleId: string,
  action: 'approved' | 'rejected',
  reviewer: string = '调研经理'
): Promise<{ processedCount: number; updatedChannelIds: string[] }> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const queueResult = await client.query(`
      SELECT id, channel_id FROM review_queue 
      WHERE sample_id = $1 AND status = 'pending'
      LIMIT 1
    `, [sampleId]);
    
    if (queueResult.rows.length === 0) {
      await client.query('COMMIT');
      return { processedCount: 0, updatedChannelIds: [] };
    }
    
    const queueId = queueResult.rows[0].id;
    const channelId = queueResult.rows[0].channel_id;
    
    await client.query(`
      UPDATE review_queue
      SET 
        status = $1,
        reviewer = $2,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [action, reviewer, queueId]);
    
    await client.query(`
      UPDATE samples
      SET status = $1
      WHERE id = $2
    `, [action, sampleId]);
    
    await client.query(`
      WITH channel_stats AS (
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) FILTER (WHERE status != 'rejected' AND 'fast_answer' = ANY(abnormal_types)) as fast_count,
          COUNT(*) FILTER (WHERE status != 'rejected' AND 'duplicate_submission' = ANY(abnormal_types)) as duplicate_count,
          COUNT(*) FILTER (WHERE status != 'rejected' AND 'device_concentration' = ANY(abnormal_types)) as device_count,
          COUNT(*) FILTER (WHERE status != 'rejected' AND 'skip_abnormal' = ANY(abnormal_types)) as skip_count,
          COUNT(*) FILTER (WHERE status != 'rejected' AND 'open_copy' = ANY(abnormal_types)) as open_count,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
        FROM samples
        WHERE channel_id = $1
      )
      UPDATE channels
      SET 
        total_samples = cs.total,
        pending_review = cs.pending_count,
        fast_answer_count = cs.fast_count,
        duplicate_submission_count = cs.duplicate_count,
        device_concentration_count = cs.device_count,
        skip_abnormal_count = cs.skip_count,
        open_copy_count = cs.open_count,
        quality_score = ROUND(
          100 
          - (cs.rejected_count::float / NULLIF(cs.total, 0) * 40)
          - (cs.pending_count::float / NULLIF(cs.total, 0) * 10)
          - (
              (cs.fast_count * 0.5 + cs.duplicate_count * 1.5 + cs.device_count * 1 + cs.skip_count * 0.8 + cs.open_count * 1.2) 
              / NULLIF(cs.total, 0) * 30
            )
        ),
        updated_at = CURRENT_TIMESTAMP
      FROM channel_stats cs
      WHERE id = $1
    `, [channelId]);
    
    await client.query('COMMIT');
    
    return {
      processedCount: 1,
      updatedChannelIds: [channelId],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkUserPermissionDB(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1 AND p.name = $2
  `, [userId, permissionName]);
  
  return parseInt(result.rows[0].count, 10) > 0;
}

export async function checkUserPermissionByUsernameDB(
  username: string,
  permissionName: string
): Promise<boolean> {
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.username = $1 AND p.name = $2
  `, [username, permissionName]);
  
  return parseInt(result.rows[0].count, 10) > 0;
}

export async function getUserRoleDB(userId: string): Promise<{ roleId: string; roleName: string } | null> {
  const result = await pool.query(`
    SELECT r.id as "roleId", r.name as "roleName"
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = $1
  `, [userId]);
  
  return result.rows[0] || null;
}

export async function getExportableChannelsForUserDB(
  userId: string
): Promise<string[]> {
  const hasExportAll = await checkUserPermissionDB(userId, 'export_all_channels');
  if (hasExportAll) {
    const result = await pool.query('SELECT id FROM channels');
    return result.rows.map(r => r.id);
  }
  
  const hasExportOwn = await checkUserPermissionDB(userId, 'export_own_channel');
  if (hasExportOwn) {
    const result = await pool.query(`
      SELECT DISTINCT c.id
      FROM channels c
      JOIN channel_managers cm ON c.id = cm.channel_id
      WHERE cm.user_id = $1
    `, [userId]);
    return result.rows.map(r => r.id);
  }
  
  return [];
}

export async function logExportActionDB(
  userId: string,
  channelId: string,
  format: string,
  sampleCount: number,
  ipAddress?: string
): Promise<void> {
  await pool.query(`
    INSERT INTO export_logs (user_id, channel_id, format, sample_count, ip_address)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, channelId, format, sampleCount, ipAddress || null]);
}
