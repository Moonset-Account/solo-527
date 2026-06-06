const db = require('../db');
const { logger, logAudit } = require('../utils/logger');
const { AppError, ValidationError, NotFoundError } = require('../middleware/error');

async function getSchedules(req, res, next) {
  try {
    const { date, status, operatingRoomId, page = 1, pageSize = 20 } = req.query;
    
    let query = `
      SELECT s.*, st.name as surgery_type_name, st.code as surgery_type_code,
             ors.room_name, ors.room_code,
             pt.template_name, pt.template_code,
             u.real_name as created_by_name
      FROM surgery_schedules s
      LEFT JOIN surgery_types st ON s.surgery_type_id = st.id
      LEFT JOIN operating_rooms ors ON s.operating_room_id = ors.id
      LEFT JOIN package_templates pt ON s.package_template_id = pt.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (date) {
      query += ` AND DATE(s.scheduled_start_time) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (operatingRoomId) {
      query += ` AND s.operating_room_id = $${paramIndex}`;
      params.push(operatingRoomId);
      paramIndex++;
    }

    query += ` ORDER BY s.scheduled_start_time DESC`;

    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), parseInt(offset));

    const result = await db.query(query, params);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM surgery_schedules s WHERE 1=1 ${date ? 'AND DATE(s.scheduled_start_time) = $1' : ''}`,
      date ? [date] : []
    );

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    next(error);
  }
}

async function getScheduleById(req, res, next) {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT s.*, st.name as surgery_type_name, st.code as surgery_type_code,
             st.estimated_duration, st.is_high_risk,
             ors.room_name, ors.room_code, ors.floor, ors.room_type,
             pt.template_name, pt.template_code,
             u.real_name as created_by_name
      FROM surgery_schedules s
      LEFT JOIN surgery_types st ON s.surgery_type_id = st.id
      LEFT JOIN operating_rooms ors ON s.operating_room_id = ors.id
      LEFT JOIN package_templates pt ON s.package_template_id = pt.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('排班记录不存在');
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function createSchedule(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const {
      surgeryTypeId, operatingRoomId, patientName, patientId, admissionNo,
      surgeonName, anesthesiologist, scheduledStartTime, scheduledEndTime,
      priority, packageTemplateId, notes
    } = req.body;

    if (!surgeryTypeId || !operatingRoomId || !patientName || !surgeonName || !scheduledStartTime || !scheduledEndTime) {
      throw new ValidationError('请填写必填项');
    }

    const conflictResult = await client.query(`
      SELECT COUNT(*) FROM surgery_schedules
      WHERE operating_room_id = $1
      AND status NOT IN ('cancelled', 'completed')
      AND (
        (scheduled_start_time, scheduled_end_time) OVERLAPS ($2::TIMESTAMP, $3::TIMESTAMP)
      )
    `, [operatingRoomId, scheduledStartTime, scheduledEndTime]);

    if (parseInt(conflictResult.rows[0].count) > 0) {
      throw new ValidationError('该时段手术间已被占用，请选择其他时段');
    }

    const scheduleNo = `SCH${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const result = await client.query(`
      INSERT INTO surgery_schedules 
      (schedule_no, surgery_type_id, operating_room_id, patient_name, patient_id, 
       admission_no, surgeon_name, anesthesiologist, scheduled_start_time, 
       scheduled_end_time, priority, package_template_id, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [scheduleNo, surgeryTypeId, operatingRoomId, patientName, patientId,
        admissionNo, surgeonName, anesthesiologist, scheduledStartTime,
        scheduledEndTime, priority || 'normal', packageTemplateId, notes, req.user.id]);

    await logAudit(req.user.id, req.user.realName, 'create_schedule', 'schedule', 'surgery_schedule', result.rows[0].id, null, result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '排班创建成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function updateSchedule(req, res, next) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const oldResult = await client.query('SELECT * FROM surgery_schedules WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      throw new NotFoundError('排班记录不存在');
    }

    const {
      surgeryTypeId, operatingRoomId, patientName, patientId, admissionNo,
      surgeonName, anesthesiologist, scheduledStartTime, scheduledEndTime,
      priority, status, packageTemplateId, notes
    } = req.body;

    const result = await client.query(`
      UPDATE surgery_schedules SET
        surgery_type_id = COALESCE($1, surgery_type_id),
        operating_room_id = COALESCE($2, operating_room_id),
        patient_name = COALESCE($3, patient_name),
        patient_id = COALESCE($4, patient_id),
        admission_no = COALESCE($5, admission_no),
        surgeon_name = COALESCE($6, surgeon_name),
        anesthesiologist = COALESCE($7, anesthesiologist),
        scheduled_start_time = COALESCE($8, scheduled_start_time),
        scheduled_end_time = COALESCE($9, scheduled_end_time),
        priority = COALESCE($10, priority),
        status = COALESCE($11, status),
        package_template_id = COALESCE($12, package_template_id),
        notes = COALESCE($13, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [surgeryTypeId, operatingRoomId, patientName, patientId, admissionNo,
        surgeonName, anesthesiologist, scheduledStartTime, scheduledEndTime,
        priority, status, packageTemplateId, notes, id]);

    await logAudit(req.user.id, req.user.realName, 'update_schedule', 'schedule', 'surgery_schedule', id, oldResult.rows[0], result.rows[0], req);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0], message: '排班更新成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
}

async function cancelSchedule(req, res, next) {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const result = await db.query(`
      UPDATE surgery_schedules SET status = 'cancelled', notes = COALESCE($1, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [cancelReason, id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('排班记录不存在');
    }

    await logAudit(req.user.id, req.user.realName, 'cancel_schedule', 'schedule', 'surgery_schedule', id, null, result.rows[0], req);

    res.json({ success: true, message: '排班已取消' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  cancelSchedule,
};
