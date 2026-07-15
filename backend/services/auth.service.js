import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const authService = {
  login: async (email, password) => {
    try {
      console.log('[AUTH SERVICE] login called for:', email);
      // Fetch user. Since role_id stores the role name (VARCHAR), use it directly
      const result = await pool.query(
        `
        SELECT
          u.id,
          u.nom,
          u.prenom,
          u.email,
          u.password_hash,
          u.role_id as role,
          u.status
        FROM users u
        WHERE u.email = $1
        LIMIT 1
        `,
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        console.log('[AUTH SERVICE] user not found for email:', email);
        throw new Error("Utilisateur introuvable");
      }

      console.log('[AUTH SERVICE] user found id:', user.id, 'email:', user.email, 'role:', user.role, 'status:', user.status);

      // Check if user account is pending approval
      if (user.status === 'pending') {
        console.log('[AUTH SERVICE] user account pending approval:', email);
        throw new Error("Votre compte est en attente de validation par l'administrateur. Veuillez patienter.");
      }

      // Check if user account is rejected
      if (user.status === 'rejected') {
        console.log('[AUTH SERVICE] user account rejected:', email);
        throw new Error("Votre compte a été refusé. Contactez l'administrateur.");
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password_hash);

      console.log('[AUTH SERVICE] bcrypt.compare result for', email, ':', valid);

      if (!valid) {
        throw new Error("Mot de passe incorrect");
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET || 'stockflow_secret_key_2026',
        {
          expiresIn: process.env.JWT_EXPIRY || '24h',
        }
      );

      console.log('[AUTH SERVICE] JWT generated for userId:', user.id);

      return {
        token,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
        },
      };
    } catch (err) {
      console.error('[AUTH SERVICE] authService.login error:', err && (err.stack || err.message || err));
      throw err;
    }
  },
  register: async (data) => {
    try {
      console.log('[AUTH SERVICE] register called with:', data?.email);

      const {
        full_name,
        email,
        password
      } = data;

      if (!full_name || !email || !password) {
        throw new Error('full_name, email et password sont requis');
      }

      const existing = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
        `,
        [email]
      );

      if (existing.rows.length > 0) {
        console.log('[AUTH SERVICE] register failed - email exists:', email);
        throw new Error("Cet email existe déjà");
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const names = full_name.trim().split(/\s+/);
      // Try to map firstname/lastname sensibly
      const prenom = names[0] || '-';
      const nom = names.slice(1).join(' ') || prenom;

      // find role name for default 'Utilisateur' (roles.nom is used as users.role_id FK)
      const roleRes = await pool.query(`SELECT nom FROM roles WHERE LOWER(nom) = 'utilisateur' LIMIT 1`);
      const roleName = roleRes.rows[0] ? roleRes.rows[0].nom : 'Utilisateur';

      // Register with status='pending' and inactive so user must be approved
      const userResult = await pool.query(
        `
        INSERT INTO users
        (
          nom,
          prenom,
          email,
          password_hash,
          role_id,
          status,
          is_active
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          'pending',
          false
        )
        RETURNING id
        `,
        [
          nom,
          prenom,
          email,
          passwordHash,
          roleName
        ]
      );

      const newUserId = userResult.rows[0]?.id;

      // Notify all admins about new registration
      const adminResult = await pool.query(`
        SELECT id FROM users WHERE role_id = 'Admin'
      `);

      for (const admin of adminResult.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, message, lien_action, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            admin.id,
            'user_registration',
            `Nouvelle demande d'inscription de ${full_name}`,
            `/users?status=pending`
          ]
        );
      }

      console.log('[AUTH SERVICE] register success for:', email, 'new user id:', newUserId);

      return {
        message: "Compte créé avec succès. Votre demande d'accès est en attente de validation par l'administrateur.",
        userId: newUserId
      };
    } catch (err) {
      console.error('[AUTH SERVICE] register error:', err && (err.stack || err.message || err));
      throw err;
    }
  },
};

export default authService;