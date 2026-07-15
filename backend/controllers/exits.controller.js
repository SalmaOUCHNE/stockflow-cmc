import exitsService from '../services/exits.service.js';

const getProducts = async(req,res)=>{
  try{
    const data = await exitsService.getProducts();
    res.json(data);
  }catch(error){
    res.status(500).json({message:error.message});
  }
};

const getPoles = async(req,res)=>{
  try{
    const data = await exitsService.getPoles();
    res.json(data);
  }catch(error){
    res.status(500).json({message:error.message});
  }
};

const getFilieres = async(req,res)=>{
  try{
    const data = await exitsService.getFilieres();
    res.json(data);
  }catch(error){
    res.status(500).json({message:error.message});
  }
};

const createExit = async(req,res)=>{
  try{
    const payload = { ...req.body, user_id: req.user?.id };
    const data = await exitsService.createExit(payload);
    res.json(data);
  }catch(error){
    res.status(500).json({message:error.message});
  }
};

export default {
  getProducts,
  getPoles,
  getFilieres,
  createExit
};