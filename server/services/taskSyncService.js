/**
 * 任务同步服务 - 将已确认的行动项同步到外部系统
 * 内置 mock 适配器，支持扩展到 Jira/飞书/钉钉等
 */
const { getDb } = require('../db');
const { uuid, now, stringifyIfNeeded } = require('../utils/common');
const audit = require('../audit');
const logger = require('../utils/logger');
const metrics = require('../monitoring');

const ADAPTERS = {
  mock: {
    name: 'Mock 系统（内置）',
    sync: async (item) => {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 500));
      return {
        success: true,
        external_id: `MOCK-${uuid().slice(0, 8).toUpperCase()}`,
        response: { message: '已同步到Mock任务系统', project: item.project_name },
      };
    },
  },
  webhook: {
    name: 'Webhook',
    sync: async (item, config = {}) => {
      const axios = require('axios');
      const url = config.url || process.env.WEBHOOK_SYNC_URL;
      if (!url) throw new Error('Webhook URL not configured');
      const resp = await axios.post(url, {
        action_item: item,
        event: 'sync',
        timestamp: now(),
      }, { timeout: 10000 });
      return {
        success: true,
        external_id: resp.data?.id || `WEBHOOK-${uuid().slice(0, 8)}`,
        response: resp.data,
      };
    },
  },
  jira: {
    name: 'Jira',
    sync: async (item, config = {}) => {
      const axios = require('axios');
      const { baseUrl, email, apiToken, projectKey } = config;
      if (!baseUrl) throw new Error('Jira not configured');
      const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
      const resp = await axios.post(`${baseUrl}/rest/api/3/issue`, {
        fields: {
          project: { key: projectKey },
          summary: item.title,
          description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: item.description || item.title }] }] },
          issuetype: { name: 'Task' },
          ...(item.deadline ? { duedate: item.deadline } : {}),
        },
      }, {
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      return {
        success: true,
        external_id: resp.data.key,
        response: resp.data,
      };
    },
  },
};

async function syncActionItem(actionItemId, targetSystem = 'mock', config = {}) {
  const db = getDb();
  const item = db.prepare('SELECT * FROM action_items WHERE id = ?').get(actionItemId);
  if (!item) throw new Error('Action item not found');

  const adapter = ADAPTERS[targetSystem] || ADAPTERS.mock;

  let result;
  let status = 'success';
  let payload = stringifyIfNeeded({ item, targetSystem });

  try {
    result = await adapter.sync(item, config);
    if (!result.success) throw new Error(result.error || 'Adapter returned failure');
    metrics.recordSync(targetSystem, 'success');
  } catch (err) {
    status = 'failed';
    result = { error: err.message, stack: err.stack };
    metrics.recordSync(targetSystem, 'failed');
    logger.error(`[sync] Failed to sync ${actionItemId} to ${targetSystem}`, { error: err.message });
  }

  const logId = uuid();
  db.prepare(`
    INSERT INTO task_sync_logs (id, action_item_id, target_system, status, external_id, payload, response, sync_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId,
    actionItemId,
    targetSystem,
    status,
    result.external_id || null,
    payload,
    stringifyIfNeeded(result.response || result),
    now()
  );

  if (status === 'success') {
    db.prepare("UPDATE action_items SET status = 'synced', updated_at = ? WHERE id = ?")
      .run(now(), actionItemId);
    audit.log(audit.ENTITY_TYPES.ACTION_ITEM, actionItemId, audit.ACTIONS.SYNC, {
      newValue: { targetSystem, externalId: result.external_id },
      operatorName: 'system',
    });
    logger.info(`[sync] Synced ${actionItemId} -> ${targetSystem} (${result.external_id})`);
  }

  return { id: logId, status, externalId: result.external_id || null, targetSystem };
}

function listSyncLogs(actionItemId = null, limit = 100) {
  const db = getDb();
  let sql = 'SELECT * FROM task_sync_logs';
  const params = [];
  if (actionItemId) { sql += ' WHERE action_item_id = ?'; params.push(actionItemId); }
  sql += ' ORDER BY sync_at DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

function listAvailableAdapters() {
  return Object.entries(ADAPTERS).map(([key, a]) => ({
    key,
    name: a.name,
    configured: key === 'mock' ? true : _checkAdapterConfigured(key),
  }));
}

function _checkAdapterConfigured(key) {
  switch (key) {
    case 'webhook': return !!process.env.WEBHOOK_SYNC_URL;
    case 'jira': return !!process.env.JIRA_BASE_URL;
    default: return false;
  }
}

module.exports = {
  syncActionItem,
  listSyncLogs,
  listAvailableAdapters,
  ADAPTERS,
};
