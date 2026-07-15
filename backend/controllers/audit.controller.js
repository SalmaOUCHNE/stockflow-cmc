import auditService from '../services/audit.service.js';

const log = async (req, res) => {
  try {
    const { action, entite_cible, entite_id, details } = req.body;
    const user_id = req.user?.id || null;
    await auditService.log({ action, entite_cible, entite_id, user_id, ip_address: req.ip, details });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const logs = await auditService.getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { log, getLogs };
