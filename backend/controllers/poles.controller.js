import * as polesService from '../services/poles.service.js';

export async function getPoles(req, res, next) {
  try {
    const rows = await polesService.getAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
