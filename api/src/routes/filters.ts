import { Router } from 'express';
import { getSavedFilters, saveFilter, deleteFilter } from '../services/dataService.js';

const router = Router();

router.get('/list', (req, res) => {
  try {
    const { userId = 'default' } = req.query;
    const data = getSavedFilters(userId as string);
    res.json(data);
  } catch (error) {
    console.error('Error getting saved filters:', error);
    res.status(500).json({ error: 'Failed to get saved filters' });
  }
});

router.post('/save', (req, res) => {
  try {
    const { name, filters, userId = 'default' } = req.body;
    if (!name || !filters) {
      return res.status(400).json({ error: 'name and filters are required' });
    }
    const data = saveFilter(name, filters, userId);
    res.json(data);
  } catch (error) {
    console.error('Error saving filter:', error);
    res.status(500).json({ error: 'Failed to save filter' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteFilter(id);
    if (!success) {
      return res.status(404).json({ error: 'Filter not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting filter:', error);
    res.status(500).json({ error: 'Failed to delete filter' });
  }
});

export default router;
