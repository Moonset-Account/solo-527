import express from 'express';
import { query } from '../db/index.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { region_id } = req.query;
    
    let sql = `
      SELECT s.*, r.name as region_name,
             (SELECT COUNT(*) FROM issues i WHERE i.store_id = s.id) as issue_count,
             (SELECT COUNT(*) FROM issues i WHERE i.store_id = s.id AND i.status = 'pending_rectify') as pending_issue_count
      FROM stores s
      LEFT JOIN regions r ON s.region_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user.role === 'store_manager') {
      sql += ` AND s.id = $${paramIndex++}`;
      params.push(user.store_id);
    }
    
    if (user.role === 'regional_manager' && user.region_id) {
      sql += ` AND s.region_id = $${paramIndex++}`;
      params.push(user.region_id);
    }
    
    if (region_id && user.role !== 'store_manager') {
      sql += ` AND s.region_id = $${paramIndex++}`;
      params.push(region_id);
    }
    
    sql += ` ORDER BY s.name`;
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: '获取门店列表失败' });
  }
});

router.get('/:storeId', authenticate, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const result = await query(`
      SELECT s.*, r.name as region_name
      FROM stores s
      LEFT JOIN regions r ON s.region_id = r.id
      WHERE s.id = $1
    `, [storeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '门店不存在' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: '获取门店信息失败' });
  }
});

router.get('/:storeId/managers', authenticate, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const result = await query(`
      SELECT id, full_name, username, phone, email
      FROM users
      WHERE store_id = $1 AND role = 'store_manager'
      ORDER BY full_name
    `, [storeId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get store managers error:', error);
    res.status(500).json({ error: '获取门店管理员失败' });
  }
});

export default router;
