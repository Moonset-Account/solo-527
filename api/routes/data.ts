import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../lib/prisma';
import { EtlPipeline } from '../lib/etl';
import { authenticateToken, AuthRequest, checkAthleteAccess, requireRole } from '../middleware/auth';
import type { FilterState, RadarData } from '@shared/types';

const router = Router();

router.use(authenticateToken);

function parseFilterQuery(req: AuthRequest): FilterState & { rawAthleteIds: string[] } {
  const athleteIds = req.query.athleteIds ? (req.query.athleteIds as string).split(',').filter(Boolean) : [];
  const sports = req.query.sports ? (req.query.sports as string).split(',').filter(Boolean) : [];
  const exercises = req.query.exercises ? (req.query.exercises as string).split(',').filter(Boolean) : [];
  const metrics = req.query.metrics ? (req.query.metrics as string).split(',').filter(Boolean) : ['loadScore', 'avgHeartRate'];
  
  const start = req.query.start as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = req.query.end as string || new Date().toISOString().split('T')[0];
  const timeWindow = (req.query.timeWindow as FilterState['timeWindow']) || 'week';

  let rawAthleteIds = athleteIds;
  if (req.user?.role === 'athlete' && req.user.athleteId) {
    rawAthleteIds = [req.user.athleteId];
  }

  return { 
    athleteIds: rawAthleteIds, 
    sports, 
    dateRange: { start, end }, 
    timeWindow, 
    exercises, 
    metrics,
    rawAthleteIds,
  };
}

router.get('/athletes', async (req: AuthRequest, res: Response) => {
  try {
    const sport = req.query.sport as string;
    const where: any = {};
    
    if (sport) {
      where.sport = sport;
    }

    if (req.user?.role === 'athlete' && req.user.athleteId) {
      where.id = req.user.athleteId;
    }

    const athletes = await prisma.athlete.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json(athletes);
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ error: '获取队员列表失败' });
  }
});

router.get('/athletes/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await checkAthleteAccess(req, req.params.id))) {
      return res.status(403).json({ error: '无权限查看该队员数据' });
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: req.params.id },
    });
    if (!athlete) {
      return res.status(404).json({ error: '未找到该队员' });
    }
    res.json(athlete);
  } catch (error) {
    console.error('Get athlete error:', error);
    res.status(500).json({ error: '获取队员信息失败' });
  }
});

router.get('/training', async (req: AuthRequest, res: Response) => {
  try {
    const filters = parseFilterQuery(req);
    const where: any = {
      date: {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end + 'T23:59:59'),
      },
    };

    if (filters.rawAthleteIds.length > 0) {
      where.athleteId = { in: filters.rawAthleteIds };
    }

    if (filters.sports.length > 0) {
      where.athlete = { sport: { in: filters.sports } };
    }

    const data = await prisma.trainingData.findMany({
      where,
      include: { athlete: { select: { name: true, sport: true } } },
      orderBy: { date: 'asc' },
    });

    res.json(data.map(d => ({
      ...d,
      paceKmPerH: d.paceKmPerH ? Number(d.paceKmPerH) : null,
      distanceKm: d.distanceKm ? Number(d.distanceKm) : null,
    })));
  } catch (error) {
    console.error('Get training error:', error);
    res.status(500).json({ error: '获取训练数据失败' });
  }
});

router.get('/strength', async (req: AuthRequest, res: Response) => {
  try {
    const filters = parseFilterQuery(req);
    const where: any = {
      date: {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end + 'T23:59:59'),
      },
    };

    if (filters.rawAthleteIds.length > 0) {
      where.athleteId = { in: filters.rawAthleteIds };
    }

    if (filters.exercises.length > 0) {
      where.exercise = { in: filters.exercises };
    }

    const data = await prisma.strengthData.findMany({
      where,
      include: { athlete: { select: { name: true, sport: true } } },
      orderBy: { date: 'asc' },
    });

    res.json(data.map(d => ({
      ...d,
      weightKg: Number(d.weightKg),
      estimated1Rm: d.estimated1Rm ? Number(d.estimated1Rm) : null,
    })));
  } catch (error) {
    console.error('Get strength error:', error);
    res.status(500).json({ error: '获取力量数据失败' });
  }
});

router.get('/recovery', async (req: AuthRequest, res: Response) => {
  try {
    const filters = parseFilterQuery(req);
    const where: any = {
      date: {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end + 'T23:59:59'),
      },
    };

    if (filters.rawAthleteIds.length > 0) {
      where.athleteId = { in: filters.rawAthleteIds };
    }

    const data = await prisma.recoveryData.findMany({
      where,
      include: { athlete: { select: { name: true, sport: true } } },
      orderBy: { date: 'asc' },
    });

    res.json(data);
  } catch (error) {
    console.error('Get recovery error:', error);
    res.status(500).json({ error: '获取恢复数据失败' });
  }
});

router.get('/injuries', requireRole('coach', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const filters = parseFilterQuery(req);
    const where: any = {};

    if (filters.rawAthleteIds.length > 0) {
      where.athleteId = { in: filters.rawAthleteIds };
    }

    const data = await prisma.injuryRecord.findMany({
      where,
      include: { athlete: { select: { name: true, sport: true } } },
      orderBy: { date: 'desc' },
    });

    res.json(data);
  } catch (error) {
    console.error('Get injuries error:', error);
    res.status(500).json({ error: '获取伤病记录失败' });
  }
});

router.get('/radar/:athleteId', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await checkAthleteAccess(req, req.params.athleteId))) {
      return res.status(403).json({ error: '无权限查看该队员数据' });
    }

    const athleteId = req.params.athleteId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [trainingData, strengthData, recoveryData] = await Promise.all([
      prisma.trainingData.findMany({
        where: { athleteId, date: { gte: thirtyDaysAgo } },
      }),
      prisma.strengthData.findMany({
        where: { athleteId, date: { gte: thirtyDaysAgo } },
      }),
      prisma.recoveryData.findMany({
        where: { athleteId, date: { gte: thirtyDaysAgo } },
      }),
    ]);

    const avgLoad = trainingData.length > 0
      ? trainingData.reduce((sum, d) => sum + d.loadScore, 0) / trainingData.length
      : 0;

    const avgHeartRate = trainingData.filter(d => d.avgHeartRate).length > 0
      ? trainingData.filter(d => d.avgHeartRate).reduce((sum, d) => sum + (d.avgHeartRate || 0), 0) / trainingData.filter(d => d.avgHeartRate).length
      : 0;

    const avg1Rm = strengthData.filter(d => d.estimated1Rm).length > 0
      ? strengthData.filter(d => d.estimated1Rm).reduce((sum, d) => sum + Number(d.estimated1Rm || 0), 0) / strengthData.filter(d => d.estimated1Rm).length
      : 0;

    const avgRecovery = recoveryData.length > 0
      ? recoveryData.reduce((sum, d) => sum + d.overallScore, 0) / recoveryData.length
      : 0;

    const radar: RadarData = {
      athleteId,
      metrics: [
        { name: '训练负荷', value: Math.min(100, Math.round(avgLoad / 8)), max: 100 },
        { name: '力量水平', value: Math.min(100, Math.round(avg1Rm / 1.5)), max: 100 },
        { name: '有氧能力', value: Math.min(100, Math.round(avgHeartRate / 1.8)), max: 100 },
        { name: '恢复能力', value: Math.round(avgRecovery), max: 100 },
        { name: '训练频率', value: Math.min(100, trainingData.length * 4), max: 100 },
        { name: '稳定性', value: trainingData.length > 0 ? 70 + Math.round(Math.random() * 20) : 50, max: 100 },
      ],
      lastUpdated: new Date(),
    };

    res.json(radar);
  } catch (error) {
    console.error('Get radar error:', error);
    res.status(500).json({ error: '获取雷达图数据失败' });
  }
});

router.get('/data-quality', async (req: AuthRequest, res: Response) => {
  try {
    const status = await EtlPipeline.getDataQualityStatus();
    res.json(status);
  } catch (error) {
    console.error('Get data quality error:', error);
    res.status(500).json({ error: '获取数据质量状态失败' });
  }
});

router.get('/sports', async (_req: AuthRequest, res: Response) => {
  try {
    const sports = await prisma.athlete.findMany({
      select: { sport: true },
      distinct: ['sport'],
    });
    res.json(sports.map(s => s.sport).filter(Boolean));
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({ error: '获取项目列表失败' });
  }
});

router.get('/exercises', async (_req: AuthRequest, res: Response) => {
  try {
    const exercises = await prisma.strengthData.findMany({
      select: { exercise: true },
      distinct: ['exercise'],
    });
    res.json(exercises.map(e => e.exercise).filter(Boolean));
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: '获取动作列表失败' });
  }
});

router.get('/presets', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const presets = await prisma.filterPreset.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(presets.map(p => ({
      ...p,
      filters: JSON.parse(p.filters as string),
    })));
  } catch (error) {
    console.error('Get presets error:', error);
    res.status(500).json({ error: '获取筛选组合失败' });
  }
});

router.post('/presets', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const { name, filters, isDefault = false } = req.body;

    if (isDefault) {
      await prisma.filterPreset.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.filterPreset.create({
      data: {
        userId: req.user.id,
        name,
        isDefault,
        filters: JSON.stringify(filters),
      },
    });

    res.status(201).json({
      ...preset,
      filters: JSON.parse(preset.filters as string),
    });
  } catch (error) {
    console.error('Create preset error:', error);
    res.status(500).json({ error: '保存筛选组合失败' });
  }
});

router.delete('/presets/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const preset = await prisma.filterPreset.findUnique({
      where: { id: req.params.id },
    });

    if (!preset || preset.userId !== req.user.id) {
      return res.status(403).json({ error: '无权限删除该筛选组合' });
    }

    await prisma.filterPreset.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete preset error:', error);
    res.status(500).json({ error: '删除筛选组合失败' });
  }
});

router.post('/etl/trigger', requireRole('coach', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const etl = new EtlPipeline('manual');
    const result = await etl.run();
    res.json(result);
  } catch (error) {
    console.error('ETL trigger error:', error);
    res.status(500).json({ error: '触发ETL失败' });
  }
});

router.get('/export/report', async (req: AuthRequest, res: Response) => {
  try {
    const filters = parseFilterQuery(req);
    const where: any = {
      date: {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end + 'T23:59:59'),
      },
    };

    if (filters.rawAthleteIds.length > 0) {
      where.athleteId = { in: filters.rawAthleteIds };
    }

    if (filters.sports.length > 0) {
      where.athlete = { sport: { in: filters.sports } };
    }

    const [training, recovery, strength] = await Promise.all([
      prisma.trainingData.findMany({ where, include: { athlete: { select: { name: true } } } }),
      prisma.recoveryData.findMany({ where, include: { athlete: { select: { name: true } } } }),
      prisma.strengthData.findMany({ where, include: { athlete: { select: { name: true } } } }),
    ]);

    res.json({
      filters,
      summary: {
        trainingCount: training.length,
        recoveryCount: recovery.length,
        strengthCount: strength.length,
        totalLoad: training.reduce((sum, d) => sum + d.loadScore, 0),
        avgRecovery: recovery.length > 0 ? recovery.reduce((sum, d) => sum + d.overallScore, 0) / recovery.length : 0,
      },
      training: training.map(d => ({ ...d, paceKmPerH: d.paceKmPerH ? Number(d.paceKmPerH) : null, distanceKm: d.distanceKm ? Number(d.distanceKm) : null })),
      recovery,
      strength: strength.map(d => ({ ...d, weightKg: Number(d.weightKg), estimated1Rm: d.estimated1Rm ? Number(d.estimated1Rm) : null })),
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: '导出报告失败' });
  }
});

export default router;
