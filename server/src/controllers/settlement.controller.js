import { success, error } from '../utils/response.js';
import * as settlementService from '../services/settlement.service.js';

export async function getRenewalList(req, res) {
  try {
    const result = await settlementService.getRenewalList(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getDepartmentSummary(req, res) {
  try {
    const result = await settlementService.getDepartmentSummary(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
