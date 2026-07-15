import inventoryService from "../services/inventory.service.js";

export const getAllInventories = async (req, res) => {
  try {

    const data =
      await inventoryService.getAllInventories();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur récupération inventaires"
    });

  }
};

export const getPoles = async (req, res) => {
  try {

    const data =
      await inventoryService.getPoles();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur récupération pôles"
    });

  }
};

export const getFilieres = async (req, res) => {
  try {

    const data =
      await inventoryService.getFilieres();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur récupération filières"
    });

  }
};

export const createInventory = async (req, res) => {
  try {

    const inventory =
      await inventoryService.createInventory(req.body);

    res.status(201).json(inventory);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur création inventaire"
    });

  }
};

export const getInventoryById = async (req, res) => {
  try {

    const inventory =
      await inventoryService.getInventoryById(req.params.id);

    res.json(inventory);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur récupération inventaire"
    });

  }
};

export const updateInventoryLine = async (req, res) => {
  try {

    const line =
      await inventoryService.updateInventoryLine(
        req.params.id,
        req.body
      );

    res.json(line);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur mise à jour ligne"
    });

  }
};

export const deleteInventory = async (req, res) => {
  try {

    const inventory = await inventoryService.deleteInventory(req.params.id);
    res.json(inventory);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur suppression inventaire"
    });

  }
};

export const closeInventory = async (req, res) => {
  try {

    const inventory =
      await inventoryService.closeInventory(req.params.id);

    res.json(inventory);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur clôture inventaire"
    });

  }
};