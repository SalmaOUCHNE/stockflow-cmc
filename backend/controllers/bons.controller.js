import * as bonsService from "../services/bons.service.js";

export const getAllBons = async (req, res) => {
  try {

    const data =
      await bonsService.getAllBons();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });

  }
};

export const getBonById = async (req, res) => {
  try {

    const bon =
      await bonsService.getBonById(
        req.params.id
      );

    if (!bon) {
      return res.status(404).json({
        message: "Bon introuvable"
      });
    }

    res.json(bon);

  } catch (error) {

    res.status(500).json({
      message: "Erreur serveur"
    });

  }
};

export const validateBon = async (
  req,
  res
) => {
  try {

    const bon =
      await bonsService.updateBonStatus(
        req.params.id,
        "validee",
        null,
        req.body.validateur_id
      );

    res.json(bon);

  } catch (error) {

    res.status(500).json({
      message: "Erreur validation"
    });

  }
};

export const rejectBon = async (
  req,
  res
) => {
  try {

    const bon =
      await bonsService.updateBonStatus(
        req.params.id,
        "rejetee",
        req.body.refusal_comment
      );

    res.json(bon);

  } catch (error) {

    res.status(500).json({
      message: "Erreur refus"
    });

  }
};

export const deliverBon = async (
  req,
  res
) => {
  try {

    const bon =
      await bonsService.markDelivered(
        req.params.id
      );

    res.json(bon);

  } catch (error) {

    res.status(500).json({
      message: "Erreur livraison"
    });

  }
};