import express, { type Response } from 'express';
import { getSites, getSiteById, addSite } from '../db/index.js';
import { authMiddleware, getOrganizationFilter, adminOnly, type AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const sites = getSites(orgFilter || undefined);
    
    res.json({
      success: true,
      data: sites,
      total: sites.length,
    });
  } catch (error) {
    console.error('[Sites] Get error:', error);
    res.status(500).json({
      success: false,
      error: '获取采样点失败',
    });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const site = getSiteById(req.params.id);
    
    if (!site) {
      res.status(404).json({
        success: false,
        error: '采样点不存在',
      });
      return;
    }

    if (orgFilter && site.organization !== orgFilter) {
      res.status(403).json({
        success: false,
        error: '无权访问该采样点',
      });
      return;
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('[Sites] Get by id error:', error);
    res.status(500).json({
      success: false,
      error: '获取采样点详情失败',
    });
  }
});

router.post('/', adminOnly, (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgFilter = getOrganizationFilter(req);
    const siteData = req.body;

    if (orgFilter && siteData.organization && siteData.organization !== orgFilter) {
      res.status(403).json({
        success: false,
        error: '只能在所属机构下创建采样点',
      });
      return;
    }

    if (orgFilter) {
      siteData.organization = orgFilter;
    }

    const newSite = addSite(siteData);

    res.json({
      success: true,
      data: newSite,
      message: '采样点创建成功',
    });
  } catch (error) {
    console.error('[Sites] Create error:', error);
    res.status(500).json({
      success: false,
      error: '创建采样点失败',
    });
  }
});

export default router;
