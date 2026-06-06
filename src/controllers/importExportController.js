const db = require('../db');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { logger, logAudit } = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../middleware/error');

const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

async function getTasks(req, res, next) {
  try {
    const { taskType, status, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT t.*, u.real_name as created_by_name
      FROM import_export_tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (taskType) {
      query += ` AND t.task_type = $${paramIndex}`;
      params.push(taskType);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function createExportTask(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { dataType, taskName, filters } = req.body;

    if (!dataType) {
      throw new ValidationError('请选择导出数据类型');
    }

    const taskResult = await client.query(`
      INSERT INTO import_export_tasks 
      (task_type, task_name, data_type, created_by, status)
      VALUES ('export', $1, $2, $3, 'processing')
      RETURNING *
    `, [taskName || `${dataType}导出`, dataType, req.user.id]);

    const taskId = taskResult.rows[0].id;

    setTimeout(async () => {
      try {
        let data = [];
        let columns = [];

        switch (dataType) {
          case 'supply_items':
            const supplyResult = await db.query(`
              SELECT item_code, item_name, specification, unit, category, 
                     is_high_value, manufacturer, supplier, price, safety_stock
              FROM supply_items ORDER BY item_code
            `);
            data = supplyResult.rows;
            columns = ['耗材编码', '耗材名称', '规格型号', '单位', '分类', '是否高值', '生产厂家', '供应商', '单价', '安全库存'];
            break;

          case 'batches':
            const batchResult = await db.query(`
              SELECT sb.batch_no, si.item_code, si.item_name, si.specification, si.unit,
                     sb.quantity, sb.unit_price, sb.manufacture_date, sb.expiry_date,
                     sb.supplier, sb.certificate_no, sb.status
              FROM supply_batches sb
              JOIN supply_items si ON sb.supply_item_id = si.id
              ORDER BY sb.created_at DESC
            `);
            data = batchResult.rows;
            columns = ['批号', '耗材编码', '耗材名称', '规格型号', '单位', '数量', '单价', '生产日期', '有效期', '供应商', '注册证号', '状态'];
            break;

          case 'schedules':
            const scheduleResult = await db.query(`
              SELECT s.schedule_no, st.code, st.name, ors.room_code, ors.room_name,
                     s.patient_name, s.surgeon_name, s.scheduled_start_time, s.scheduled_end_time,
                     s.priority, s.status
              FROM surgery_schedules s
              JOIN surgery_types st ON s.surgery_type_id = st.id
              JOIN operating_rooms ors ON s.operating_room_id = ors.id
              ORDER BY s.scheduled_start_time DESC
            `);
            data = scheduleResult.rows;
            columns = ['排班编号', '术式编码', '术式名称', '手术间编码', '手术间名称', '患者姓名', '主刀医生', '预约开始', '预约结束', '优先级', '状态'];
            break;

          case 'ledger':
            const ledgerResult = await db.query(`
              SELECT il.ledger_no, il.transaction_type, il.transaction_time,
                     si.item_code, si.item_name, si.unit,
                     sb.batch_no, il.quantity, il.unit_price, il.total_amount,
                     il.operator_name, il.remarks
              FROM inventory_ledger il
              JOIN supply_items si ON il.supply_item_id = si.id
              LEFT JOIN supply_batches sb ON il.batch_id = sb.id
              ORDER BY il.transaction_time DESC
              LIMIT 1000
            `);
            data = ledgerResult.rows;
            columns = ['台账编号', '交易类型', '交易时间', '耗材编码', '耗材名称', '单位', '批号', '数量', '单价', '金额', '操作人', '备注'];
            break;

          case 'reconciliation':
            const reconResult = await db.query(`
              SELECT mr.reconciliation_month, si.item_code, si.item_name, si.unit,
                     mr.opening_quantity, mr.purchase_in_quantity, mr.used_quantity,
                     mr.returned_quantity, mr.discarded_quantity, mr.closing_quantity,
                     mr.physical_quantity, mr.variance_quantity, mr.status
              FROM monthly_reconciliations mr
              JOIN supply_items si ON mr.supply_item_id = si.id
              ORDER BY mr.reconciliation_month DESC
            `);
            data = reconResult.rows;
            columns = ['对账月份', '耗材编码', '耗材名称', '单位', '期初数量', '采购入库', '使用出库', '退库', '报损', '结存数量', '实盘数量', '差异', '状态'];
            break;

          default:
            throw new Error('不支持的导出类型');
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 'A1' });
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '数据');

        const fileName = `${dataType}_${Date.now()}.xlsx`;
        const filePath = path.join(EXPORT_DIR, fileName);
        XLSX.writeFile(workbook, filePath);

        await db.query(`
          UPDATE import_export_tasks SET
            status = 'completed',
            file_name = $1,
            file_path = $2,
            result_file_path = $2,
            total_count = $3,
            processed_count = $3,
            completed_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [fileName, filePath, data.length, taskId]);

        await logAudit(req.user.id, req.user.realName, 'export_data', 'system', 'import_export_task', taskId, null, { dataType, count: data.length }, null);

      } catch (error) {
        logger.error('Export task failed:', error);
        await db.query(`
          UPDATE import_export_tasks SET
            status = 'failed',
            error_message = $1,
            completed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [error.message, taskId]);
      }
    }, 100);

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      data: taskResult.rows[0], 
      message: '导出任务已创建，正在后台处理' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function downloadExport(req, res, next) {
  try {
    const { id } = req.params;

    const taskResult = await db.query(
      'SELECT * FROM import_export_tasks WHERE id = $1 AND task_type = $2',
      [id, 'export']
    );

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('导出任务不存在');
    }

    const task = taskResult.rows[0];

    if (task.status !== 'completed' || !task.result_file_path) {
      throw new ValidationError('导出任务未完成或文件不存在');
    }

    if (!fs.existsSync(task.result_file_path)) {
      throw new NotFoundError('导出文件不存在');
    }

    res.download(task.result_file_path, task.file_name);
  } catch (error) {
    next(error);
  }
}

async function createImportTask(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { dataType, taskName } = req.body;
    const file = req.file;

    if (!dataType || !file) {
      throw new ValidationError('请选择数据类型并上传文件');
    }

    const taskResult = await client.query(`
      INSERT INTO import_export_tasks 
      (task_type, task_name, data_type, file_name, file_path, created_by, status)
      VALUES ('import', $1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [taskName || `${dataType}导入`, dataType, file.originalname, file.path, req.user.id]);

    const taskId = taskResult.rows[0].id;

    setTimeout(async () => {
      try {
        await db.query(`UPDATE import_export_tasks SET status = 'processing' WHERE id = $1`, [taskId]);

        const workbook = XLSX.readFile(file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData.shift();
        let processedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < jsonData.length; i++) {
          try {
            const row = jsonData[i];
            if (row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) continue;

            switch (dataType) {
              case 'supply_items':
                if (row[0]) {
                  const existing = await db.query('SELECT COUNT(*) FROM supply_items WHERE item_code = $1', [row[0]]);
                  if (parseInt(existing.rows[0].count) === 0) {
                    await db.query(`
                      INSERT INTO supply_items 
                      (item_code, item_name, specification, unit, category, is_high_value, manufacturer, supplier, price, safety_stock)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `, [row[0], row[1], row[2], row[3], row[4] || 'other', row[5] === '是' || row[5] === true, row[6], row[7], row[8] ? parseFloat(row[8]) : null, row[9] ? parseInt(row[9]) : 10]);
                  }
                }
                break;

              case 'batches':
                if (row[0] && row[1]) {
                  const itemResult = await db.query('SELECT id FROM supply_items WHERE item_code = $1', [row[1]]);
                  if (itemResult.rows.length > 0) {
                    await db.query(`
                      INSERT INTO supply_batches 
                      (batch_no, supply_item_id, quantity, unit_price, manufacture_date, expiry_date, supplier, certificate_no, status)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'normal')
                      ON CONFLICT (batch_no, supply_item_id) DO NOTHING
                    `, [row[0], itemResult.rows[0].id, row[5] ? parseInt(row[5]) : 0, row[6] ? parseFloat(row[6]) : null, row[7], row[8], row[9], row[10]]);
                  }
                }
                break;
            }
            processedCount++;
          } catch (rowError) {
            failedCount++;
            logger.warn(`Import row ${i + 2} failed:`, rowError.message);
          }
        }

        await db.query(`
          UPDATE import_export_tasks SET
            status = 'completed',
            total_count = $1,
            processed_count = $2,
            failed_count = $3,
            completed_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [jsonData.length, processedCount, failedCount, taskId]);

        await logAudit(req.user.id, req.user.realName, 'import_data', 'system', 'import_export_task', taskId, null, { dataType, processedCount, failedCount }, null);

      } catch (error) {
        logger.error('Import task failed:', error);
        await db.query(`
          UPDATE import_export_tasks SET
            status = 'failed',
            error_message = $1,
            completed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [error.message, taskId]);
      }
    }, 100);

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      data: taskResult.rows[0], 
      message: '导入任务已创建，正在后台处理' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getTasks,
  createExportTask,
  downloadExport,
  createImportTask,
};
