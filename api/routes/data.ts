import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  getDataStore,
  filterTrainingData,
  filterRecoveryData,
  filterStrengthData,
  getInjuryRecords,
  getRadarData,
  getDataQualityStatus,
  getAvailableSports,
  getAvailableExercises,
  getAthletes,
  refreshData,
} from '../data/store';
import type { FilterState } from '../../shared/types';

const router = Router();

function parseFilterQuery(req: Request): FilterState {
  const athleteIds = req.query.athleteIds ? (req.query.athleteIds as string).split(',') : [];
  const sports = req.query.sports ? (req.query.sports as string).split(',') : [];
  const exercises = req.query.exercises ? (req.query.exercises as string).split(',') : [];
  const metrics = req.query.metrics ? (req.query.metrics as string).split(',') : ['loadScore', 'avgHeartRate'];
  
  const start = req.query.start as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = req.query.end as string || new Date().toISOString().split('T')[0];
  const timeWindow = (req.query.timeWindow as FilterState['timeWindow']) || 'week';

  return { athleteIds, sports, dateRange: { start, end }, timeWindow, exercises, metrics };
}

router.get('/athletes', (req: Request, res: Response) => {
  const sport = req.query.sport as string;
  const athletes = getAthletes(sport);
  res.json(athletes);
});

router.get('/athletes/:id', (req: Request, res: Response) => {
  const store = getDataStore();
  const athlete = store.athletes.find(a => a.id === req.params.id);
  if (!athlete) {
    return res.status(404).json({ error: 'Athlete not found' });
  }
  res.json(athlete);
});

router.get('/training', (req: Request, res: Response) => {
  const filters = parseFilterQuery(req);
  const data = filterTrainingData(filters, 'coach');
  res.json(data);
});

router.get('/strength', (req: Request, res: Response) => {
  const filters = parseFilterQuery(req);
  const data = filterStrengthData(filters, 'coach');
  res.json(data);
});

router.get('/recovery', (req: Request, res: Response) => {
  const filters = parseFilterQuery(req);
  const data = filterRecoveryData(filters, 'coach');
  res.json(data);
});

router.get('/injuries', (req: Request, res: Response) => {
  const filters = parseFilterQuery(req);
  const data = getInjuryRecords(filters, 'coach');
  res.json(data);
});

router.get('/radar/:athleteId', (req: Request, res: Response) => {
  const data = getRadarData(req.params.athleteId);
  res.json(data);
});

router.get('/data-quality', (req: Request, res: Response) => {
  const filters = parseFilterQuery(req);
  const status = getDataQualityStatus(filters);
  res.json(status);
});

router.get('/sports', (_req: Request, res: Response) => {
  res.json(getAvailableSports());
});

router.get('/exercises', (_req: Request, res: Response) => {
  res.json(getAvailableExercises());
});

router.get('/presets', (_req: Request, res: Response) => {
  res.json([]);
});

router.post('/presets', (req: Request, res: Response) => {
  res.status(201).json({ id: 'preset-1', ...req.body });
});

router.delete('/presets/:id', (_req: Request, res: Response) => {
  res.status(204).send();
});

router.post('/etl/trigger', (_req: Request, res: Response) => {
  refreshData();
  res.json({ success: true, message: 'ETL triggered successfully' });
});

router.get('/export/report', (req: Request, res: Response) => {
  const filters = parseFilterQuery(req);
  const training = filterTrainingData(filters, 'coach');
  const recovery = filterRecoveryData(filters, 'coach');
  const strength = filterStrengthData(filters, 'coach');
  
  res.json({
    filters,
    summary: {
      trainingCount: training.length,
      recoveryCount: recovery.length,
      strengthCount: strength.length,
      totalLoad: training.reduce((sum, d) => sum + d.loadScore, 0),
      avgRecovery: recovery.length > 0 ? recovery.reduce((sum, d) => sum + d.overallScore, 0) / recovery.length : 0,
    },
    training,
    recovery,
    strength,
  });
});

export default router;
