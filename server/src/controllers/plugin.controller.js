import { success, error } from '../utils/response.js';
import * as pluginService from '../services/plugin.service.js';

export async function getPluginList(req, res) {
  try {
    const result = await pluginService.getPluginList(req.query);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}

export async function getPluginDetail(req, res) {
  try {
    const result = await pluginService.getPluginDetail(req.params.id);
    res.json(success(result));
  } catch (err) {
    res.status(400).json(error(err.message, 400));
  }
}
