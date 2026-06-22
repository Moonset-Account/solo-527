import { success, error } from '../utils/response.js';
import * as licenseService from '../services/license.service.js';

export async function getLicenseList(req, res) {
  try {
    const result = await licenseService.getLicenseList(
      req.user.id,
      req.user.role,
      req.query
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getLicenseDetail(req, res) {
  try {
    const result = await licenseService.getLicenseDetail(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
