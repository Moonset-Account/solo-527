import { Router } from 'express';
import { getStrategies, getStrategy, createStrategy, updateStrategy, toggleStrategy } from '../services/strategies';
import type { StrategyStatus } from '../../shared/types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      status: req.query.status as StrategyStatus | undefined,
      keyword: req.query.keyword as string | undefined,
    };
    const result = await getStrategies(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const strategy = await getStrategy(req.params.id);
    if (!strategy) {
      res.status(404).json({ error: '策略不存在' });
      return;
    }
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, triggerCondition, action, status, createdById } = req.body;
    if (!name || !triggerCondition || !action || !createdById) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    const strategy = await createStrategy({
      name,
      description: description || '',
      triggerCondition,
      action,
      status: status || 'ACTIVE',
      createdById,
    });
    res.json({ success: true, data: strategy });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const strategy = await updateStrategy(req.params.id, req.body);
    if (!strategy) {
      res.status(404).json({ error: '策略不存在' });
      return;
    }
    res.json({ success: true, data: strategy });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id/toggle', async (req, res) => {
  try {
    const strategy = await toggleStrategy(req.params.id);
    if (!strategy) {
      res.status(404).json({ error: '策略不存在' });
      return;
    }
    res.json({ success: true, data: strategy });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
