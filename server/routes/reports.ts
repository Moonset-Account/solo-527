import express from 'express';
import { query } from '../db/index.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = express.Router();

router.get('/overview', authenticate, requireRole('regional_manager', 'supervisor'), async (req, res) => {
  try {
    const user = req.user;
    const { start_date, end_date, region_id, store_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user.role === 'regional_manager' && user.region_id) {
      whereClause += ` AND s.region_id = $${paramIndex++}`;
      params.push(user.region_id);
    }
    
    if (region_id) {
      whereClause += ` AND s.region_id = $${paramIndex++}`;
      params.push(region_id);
    }
    
    if (store_id) {
      whereClause += ` AND s.id = $${paramIndex++}`;
      params.push(store_id);
    }
    
    if (start_date) {
      whereClause += ` AND i.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ` AND i.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    const statusSql = `
      SELECT 
        i.status,
        COUNT(*) as count
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      ${whereClause}
      GROUP BY i.status
    `;
    
    const categorySql = `
      SELECT 
        i.category,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE i.is_overdue = true) as overdue_count
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      ${whereClause}
      GROUP BY i.category
    `;
    
    const storeSql = `
      SELECT 
        s.id,
        s.name,
        s.store_code,
        COUNT(*) as total_issues,
        COUNT(*) FILTER (WHERE i.status = 'pending_rectify') as pending_count,
        COUNT(*) FILTER (WHERE i.is_overdue = true) as overdue_count,
        ROUND(
          CASE WHEN COUNT(*) > 0 
            THEN (COUNT(*) FILTER (WHERE i.is_overdue = true)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE i.status = 'pending_rectify'), 0)) * 100
            ELSE 0 
          END, 2
        ) as overdue_rate
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      ${whereClause}
      GROUP BY s.id, s.name, s.store_code
      ORDER BY overdue_rate DESC
    `;
    
    const [statusResult, categoryResult, storeResult] = await Promise.all([
      query(statusSql, params),
      query(categorySql, params),
      query(storeSql, params)
    ]);
    
    const totalIssues = statusResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const totalOverdue = categoryResult.rows.reduce((sum, row) => sum + parseInt(row.overdue_count), 0);
    
    res.json({
      summary: {
        total_issues: totalIssues,
        total_overdue: totalOverdue,
        overall_overdue_rate: totalIssues > 0 
          ? ((totalOverdue / (storeResult.rows.reduce((sum, r) => sum + parseInt(r.pending_count), 0) || 1)) * 100).toFixed(2)
          : 0
      },
      by_status: statusResult.rows,
      by_category: categoryResult.rows,
      by_store: storeResult.rows
    });
  } catch (error) {
    console.error('Get report overview error:', error);
    res.status(500).json({ error: '获取报表数据失败' });
  }
});

router.get('/export', authenticate, requireRole('regional_manager', 'supervisor'), async (req, res) => {
  try {
    const user = req.user;
    const { 
      start_date, end_date, region_id, store_id, 
      category, status, format = 'csv' 
    } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user.role === 'regional_manager' && user.region_id) {
      whereClause += ` AND s.region_id = $${paramIndex++}`;
      params.push(user.region_id);
    }
    
    if (region_id) {
      whereClause += ` AND s.region_id = $${paramIndex++}`;
      params.push(region_id);
    }
    
    if (store_id) {
      whereClause += ` AND i.store_id = $${paramIndex++}`;
      params.push(store_id);
    }
    
    if (category) {
      whereClause += ` AND i.category = $${paramIndex++}`;
      params.push(category);
    }
    
    if (status) {
      whereClause += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (start_date) {
      whereClause += ` AND i.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ` AND i.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    const sql = `
      SELECT 
        s.store_code as "门店编码",
        s.name as "门店名称",
        r.name as "所属区域",
        i.category as "问题类型",
        i.title as "问题标题",
        i.status as "当前状态",
        i.is_overdue as "是否逾期",
        u1.full_name as "创建人",
        u2.full_name as "整改负责人",
        TO_CHAR(i.created_at, 'YYYY-MM-DD HH24:MI:SS') as "创建时间",
        TO_CHAR(i.due_date, 'YYYY-MM-DD HH24:MI:SS') as "整改期限",
        i.location as "位置",
        i.freezer_temperature as "冷柜温度",
        i.description as "问题描述"
      FROM issues i
      LEFT JOIN stores s ON i.store_id = s.id
      LEFT JOIN regions r ON s.region_id = r.id
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;
    
    const result = await query(sql, params);
    
    const statusMap = {
      pending_confirm: '待确认',
      pending_rectify: '待整改',
      reviewed: '已复查',
      closed: '已关闭',
      false_positive: '误报'
    };
    
    const categoryMap = {
      shelf: '货架',
      price_tag: '价签',
      fire_exit: '消防通道',
      freezer_temp: '冷柜温度',
      cleanliness: '卫生',
      other: '其他'
    };
    
    const rows = result.rows.map(row => ({
      ...row,
      "当前状态": statusMap[row["当前状态"]] || row["当前状态"],
      "问题类型": categoryMap[row["问题类型"]] || row["问题类型"],
      "是否逾期": row["是否逾期"] ? '是' : '否'
    }));
    
    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {});
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(header => {
            const val = row[header] || '';
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="inspection_report_${Date.now()}.csv"`);
      res.send('\ufeff' + csvContent);
    } else {
      res.json({
        filters: { start_date, end_date, region_id, store_id, category, status },
        data: rows
      });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: '导出报表失败' });
  }
});

export default router;
