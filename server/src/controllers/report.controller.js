import { success, error } from '../utils/response.js';
import * as reportService from '../services/report.service.js';

export async function getUsageTrend(req, res) {
  try {
    const result = await reportService.getUsageTrend(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getSeatUtilization(req, res) {
  try {
    const result = await reportService.getSeatUtilization(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
