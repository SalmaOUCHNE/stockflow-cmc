import * as filieresService from '../services/filieres.service.js';

export async function getFilieres(req, res, next) {
  try {
    const rows = await filieresService.getAll();
    res.json(rows);
  } catch (err) { next(err); }
}

export async function getFilieresByPole(req, res, next) {
  try {
    const poleId = req.params.poleId;
    const rows = await filieresService.getByPole(poleId);
    res.json(rows);
  } catch (err) { next(err); }
}
