import entriesService from "../services/entries.service.js";

const getProducts = async (req,res) => {
  try {
    const data = await entriesService.getProducts();
    res.json(data);
  } catch(err) {
    res.status(500).json({message: err.message});
  }
};

const getPoles = async (req,res) => {
  try {
    const data = await entriesService.getPoles();
    res.json(data);
  } catch(err) {
    res.status(500).json({message: err.message});
  }
};

const getFilieres = async (req,res) => {
  try {
    const data = await entriesService.getFilieres();
    res.json(data);
  } catch(err) {
    res.status(500).json({message: err.message});
  }
};

const getRecentEntries = async (req,res) => {
  try {
    const data = await entriesService.getRecentEntries();
    res.json(data);
  } catch(err) {
    res.status(500).json({message: err.message});
  }
};

const createEntry = async (req,res) => {
  try {
    // include authenticated user id
    const payload = { ...req.body, user_id: req.user?.id };
    const data = await entriesService.createEntry(payload);
    res.status(201).json(data);
  } catch(err) {
    res.status(500).json({message: err.message});
  }
};

export default {
  getProducts,
  getPoles,
  getFilieres,
  getRecentEntries,
  createEntry
};