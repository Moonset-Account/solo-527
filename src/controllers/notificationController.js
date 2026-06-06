const db = require('../db');
const { logger } = require('../utils/logger');

async function getNotifications(req, res, next) {
  try {
    const { isRead, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [req.user.id];

    if (isRead !== undefined) {
      query += ` AND is_read = $2`;
      params.push(isRead === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    const result = await db.query(query, params);

    const unreadCount = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;

    await db.query(`
      UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);

    res.json({ success: true, message: '标记已读' });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    await db.query(`
      UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
    `, [req.user.id]);

    res.json({ success: true, message: '全部标记已读' });
  } catch (error) {
    next(error);
  }
}

async function createNotification(userId, title, content, notificationType = 'system', priority = 'normal', relatedType = null, relatedId = null) {
  try {
    await db.query(`
      INSERT INTO notifications 
      (user_id, title, content, notification_type, priority, related_type, related_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, title, content, notificationType, priority, relatedType, relatedId]);
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
}

async function checkExpiringBatches() {
  try {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const result = await db.query(`
      SELECT sb.*, si.item_name, si.item_code
      FROM supply_batches sb
      JOIN supply_items si ON sb.supply_item_id = si.id
      WHERE sb.expiry_date <= $1 AND sb.expiry_date > CURRENT_DATE
        AND sb.status = 'normal' AND sb.quantity > 0
    `, [sevenDaysLater]);

    if (result.rows.length > 0) {
      const equipmentUsers = await db.query(
        "SELECT id FROM users WHERE role IN ('equipment', 'admin', 'head_nurse') AND status = 'active'"
      );

      for (const user of equipmentUsers.rows) {
        await createNotification(
          user.id,
          `有 ${result.rows.length} 个批号将在7天内过期`,
          `请及时处理即将过期的耗材，共 ${result.rows.length} 项`,
          'expiry_alert',
          'high',
          'supply_batches'
        );
      }

      const alreadyAlerted = await db.query(`
        SELECT DISTINCT supply_item_id FROM stock_alerts 
        WHERE alert_type = 'expiring_soon' AND is_resolved = false 
          AND created_at > NOW() - INTERVAL '24 hours'
      `);
      const alertedIds = alreadyAlerted.rows.map(r => r.supply_item_id);

      for (const batch of result.rows) {
        if (!alertedIds.includes(batch.supply_item_id)) {
          await db.query(`
            INSERT INTO stock_alerts 
            (supply_item_id, alert_type, message, threshold_value, current_value)
            VALUES ($1, 'expiring_soon', $2, 7, $3)
          `, [batch.supply_item_id, `批号 ${batch.batch_no} (${batch.item_name}) 将在7天内过期`, batch.quantity]);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to check expiring batches:', error);
  }
}

async function checkLowStock() {
  try {
    const result = await db.query(`
      SELECT si.*, COALESCE(SUM(sb.quantity), 0) as current_stock
      FROM supply_items si
      LEFT JOIN supply_batches sb ON si.id = sb.supply_item_id 
        AND sb.status = 'normal' AND sb.expiry_date > CURRENT_DATE
      GROUP BY si.id
      HAVING COALESCE(SUM(sb.quantity), 0) <= si.safety_stock
    `);

    if (result.rows.length > 0) {
      const equipmentUsers = await db.query(
        "SELECT id FROM users WHERE role IN ('equipment', 'admin') AND status = 'active'"
      );

      for (const user of equipmentUsers.rows) {
        await createNotification(
          user.id,
          `有 ${result.rows.length} 种耗材库存不足`,
          `请及时补充库存，共 ${result.rows.length} 项低于安全库存`,
          'stock_alert',
          'high',
          'supply_items'
        );
      }
    }
  } catch (error) {
    logger.error('Failed to check low stock:', error);
  }
}

async function checkPendingPackages() {
  try {
    const result = await db.query(`
      SELECT COUNT(*) as count FROM package_preparations WHERE status = 'pending_review'
    `);

    const count = parseInt(result.rows[0].count);
    if (count > 0) {
      const headNurses = await db.query(
        "SELECT id FROM users WHERE role IN ('head_nurse', 'admin') AND status = 'active'"
      );

      for (const user of headNurses.rows) {
        const existingNotification = await db.query(`
          SELECT COUNT(*) FROM notifications 
          WHERE user_id = $1 AND notification_type = 'approval_required' 
            AND is_read = false AND created_at > NOW() - INTERVAL '4 hours'
        `, [user.id]);

        if (parseInt(existingNotification.rows[0].count) === 0) {
          await createNotification(
            user.id,
            `有 ${count} 个备包待审核`,
            `请及时审核待确认的备包申请`,
            'approval_required',
            'normal',
            'package_preparations'
          );
        }
      }
    }
  } catch (error) {
    logger.error('Failed to check pending packages:', error);
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllRead,
  createNotification,
  checkExpiringBatches,
  checkLowStock,
  checkPendingPackages,
};
