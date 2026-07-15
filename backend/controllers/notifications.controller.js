import notificationsService from '../services/notifications.service.js';

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await notificationsService.getForUser(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await notificationsService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.id;
    await notificationsService.markRead(userId, ids);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markRead
};