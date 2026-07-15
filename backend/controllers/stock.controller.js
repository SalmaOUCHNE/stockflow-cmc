// backend/controllers/stock.controller.js

import stockService from "../services/stock.service.js";

const getProducts = async (req, res) => {
  try {
    const data = await stockService.getProducts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFilieres = async (req, res) => {
  try {
    const data = await stockService.getFilieres();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPoles = async (req, res) => {
  try {
    const data = await stockService.getPoles();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRecentMovements = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 50;
    const data = await stockService.getRecentMovements(days, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const data = await stockService.createProduct(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const data = await stockService.updateProduct(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const data = await stockService.deleteProduct(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProductPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }
    const data = await stockService.uploadProductPhoto(req.params.id, req.file);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getProducts,
  getFilieres,
  getPoles,
  getRecentMovements,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductPhoto,
};