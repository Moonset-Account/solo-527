import express from 'express';
import { query, getClient } from '../db/index.ts';
import { authenticate } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { payload } = req.body;
    
    if (!payload) {
      return res.status(400).json({ error: '缺少提交数据' });
    }
    
    const submissionId = uuidv4();
    
    await query(`
      INSERT INTO offline_submissions (id, user_id, payload, status)
      VALUES ($1, $2, $3, 'pending')
    `, [submissionId, user.id, payload]);
    
    res.status(201).json({ 
      message: '离线提交已保存',
      submission_id: submissionId
    });
  } catch (error) {
    console.error('Save offline submission error:', error);
    res.status(500).json({ error: '保存离线提交失败' });
  }
});

router.get('/pending', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    const result = await query(`
      SELECT * FROM offline_submissions
      WHERE user_id = $1 AND status IN ('pending', 'failed')
      ORDER BY created_at ASC
    `, [user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({ error: '获取待提交列表失败' });
  }
});

router.post('/:submissionId/retry', authenticate, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const user = req.user;
    const { submissionId } = req.params;
    
    const submissionResult = await client.query(`
      SELECT * FROM offline_submissions 
      WHERE id = $1 AND user_id = $2
    `, [submissionId, user.id]);
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: '提交记录不存在' });
    }
    
    const submission = submissionResult.rows[0];
    const payload = submission.payload;
    
    if (payload.type === 'issue') {
      const issueId = uuidv4();
      const data = payload.data;
      
      await client.query(`
        INSERT INTO issues (id, store_id, category, title, description, 
                           created_by, due_date, freezer_temperature, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        issueId, data.store_id, data.category, data.title, 
        data.description || null, user.id, 
        data.due_date || null, data.freezer_temperature || null, 
        data.location || null
      ]);
      
      await client.query(`
        INSERT INTO issue_logs (issue_id, action, to_status, created_by, comment)
        VALUES ($1, $2, $3, $4, $5)
      `, [issueId, 'create', 'pending_confirm', user.id, '离线提交创建问题']);
    }
    
    await client.query(`
      UPDATE offline_submissions 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [submissionId]);
    
    await client.query('COMMIT');
    
    res.json({ message: '离线提交重试成功' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Retry submission error:', error);
    
    await query(`
      UPDATE offline_submissions 
      SET status = 'failed', 
          retry_count = retry_count + 1,
          last_retry_at = CURRENT_TIMESTAMP,
          error_message = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [error.message, req.params.submissionId]);
    
    res.status(500).json({ error: '重试失败' });
  } finally {
    client.release();
  }
});

router.delete('/:submissionId', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { submissionId } = req.params;
    
    await query(`
      DELETE FROM offline_submissions 
      WHERE id = $1 AND user_id = $2
    `, [submissionId, user.id]);
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
