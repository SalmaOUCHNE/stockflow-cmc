import * as categoriesService from '../services/categories.service.js';

export async function getCategories(req, res, next) {
  try {
    const rows = await categoriesService.getAll();
    res.json(rows);
  } catch (err) { next(err); }
}
