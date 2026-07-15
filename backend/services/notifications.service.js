import pool from '../config/database.js';

const notificationsService = {
  async getForUser(userId) {
    if (!userId) return [];
    const result = await pool.query(`SELECT id, type, message, is_read, lien_action, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return result.rows;
  },

  async getUnreadCount(userId) {
    if (!userId) return 0;
    const result = await pool.query(`SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]);
    return parseInt(result.rows[0]?.count ?? 0);
  },

  async markRead(userId, ids) {
    if (!userId) return;
    if (!ids || ids.length === 0) {
      await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    } else {
      const placeholders = ids.map((_, i) => `$${i+2}`).join(',');
      const params = [userId, ...ids];
      await pool.query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND id IN (${placeholders})`, params);
    }
  },

  async create(userId, type, message, lien) {
    await pool.query('INSERT INTO notifications (user_id, type, message, lien_action, created_at) VALUES ($1,$2,$3,$4,NOW())', [userId, type, message, lien]);
  },

  // Notify all admins
  async notifyAdmins(type, message, linkAction) {
    const adminResult = await pool.query(`SELECT id FROM users WHERE role_id = 'Admin'`);
    for (const admin of adminResult.rows) {
      await this.create(admin.id, type, message, linkAction);
    }
  },

  // Notify specific user
  async notifyUser(userId, type, message, linkAction) {
    if (userId) {
      await this.create(userId, type, message, linkAction);
    }
  }
};

export default notificationsService;