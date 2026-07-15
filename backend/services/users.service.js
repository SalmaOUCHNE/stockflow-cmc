import crypto from 'crypto';
import bcrypt from 'bcrypt';
import db from '../config/database.js';
import emailService from './email.service.js';

const TEMP_PASSWORD_LENGTH = 12;

const generateTempPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const allChars = uppercase + digits.toLowerCase() + digits;
  for (let i = 3; i < TEMP_PASSWORD_LENGTH; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const usersService = {
  // Récupérer la liste des utilisateurs avec filtres
  getUsers: async ({ role, is_active, status, search, page = 1, limit = 10 }) => {
    let query = 'SELECT id, nom, prenom, email, role_id, is_active, status, last_login, created_at FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role_id = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (nom ILIKE $${paramIndex} OR prenom ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
      paramIndex++;
    }

    // Compter le total
    const countResult = await db.query(
      query.replace('SELECT id, nom, prenom, email, role_id, is_active, last_login, created_at FROM users', 'SELECT COUNT(*) as total FROM users'),
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Appliquer la pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    return {
      users: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Récupérer un utilisateur par ID
  getUserById: async (id) => {
    const result = await db.query(
      'SELECT id, nom, prenom, email, role_id, is_active, status, last_login, created_at, avatar_url, fonction FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  // Chercher un utilisateur par email
  findByEmail: async (email) => {
    const result = await db.query(
      'SELECT id, email FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rows[0] || null;
  },

  // Créer un utilisateur
  createUser: async ({ nom, prenom, email, role_id, pole_id }) => {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await db.query(
      `INSERT INTO users (nom, prenom, email, password_hash, role_id, pole_id, status, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', true, NOW())
       RETURNING id, nom, prenom, email, role_id, is_active, last_login, created_at`,
      [nom, prenom, email, passwordHash, role_id, pole_id]
    );

    const newUser = result.rows[0];

    // Envoyer le mot de passe temporaire par email
    await emailService.sendTempPasswordEmail(email, nom, prenom, tempPassword);

    return newUser;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id, updates) => {
    const allowedFields = ['nom', 'prenom', 'email', 'role_id', 'is_active', 'status'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const key of allowedFields) {
      if (key in updates) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return await usersService.getUserById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, nom, prenom, email, role_id, is_active, last_login, created_at`,
      values
    );

    return result.rows[0];
  },

  // Supprimer un utilisateur
  deleteUser: async (id) => {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  },

  // Vérifier si un utilisateur a des mouvements de stock
  checkStockMovements: async (userId) => {
    const result = await db.query(
      'SELECT id FROM stock_movements WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return result.rows.length > 0;
  },

  // Mettre à jour le mot de passe pour l'utilisateur
  updatePassword: async (id, currentPassword, newPassword) => {
    // Récupérer le hash actuel
    const res = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
    const row = res.rows[0];
    if (!row) throw new Error('Utilisateur introuvable');
    const valid = await bcrypt.compare(currentPassword, row.password_hash);
    if (!valid) throw new Error('Mot de passe actuel incorrect');
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, id]);
    return true;
  },

  // Approve a pending user registration
  approveUser: async (userId) => {
    const userResult = await db.query(
      `UPDATE users SET status = 'active', is_active = true, updated_at = NOW() WHERE id = $1 RETURNING id, nom, prenom, email`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) throw new Error('Utilisateur introuvable');
    
    // Notify the user that their account was approved
    const notificationsService = (await import('./notifications.service.js')).default;
    await notificationsService.notifyUser(
      userId,
      'account_approved',
      'Votre compte a été approuvé. Vous pouvez maintenant vous connecter.',
      '/login'
    );

    return user;
  },

  // Reject a pending user registration
  rejectUser: async (userId, reason) => {
    const userResult = await db.query(
      `UPDATE users SET status = 'rejected', is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, nom, prenom, email`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) throw new Error('Utilisateur introuvable');
    
    // Notify the user that their account was rejected
    const notificationsService = (await import('./notifications.service.js')).default;
    await notificationsService.notifyUser(
      userId,
      'account_rejected',
      `Votre demande d'inscription a été refusée. Raison: ${reason || 'Non spécifiée'}`,
      null
    );

    return user;
  },
};

export default usersService;
