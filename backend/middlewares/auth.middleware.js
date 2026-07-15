import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    console.log('[AUTH MIDDLEWARE] Authorization header:', authHeader ? '[present]' : '[missing]');

    if (!token) {
      console.log('[AUTH MIDDLEWARE] Token missing');
      return res.status(401).json({ error: 'Token manquant' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stockflow_secret_key_2026');
      console.log('[AUTH MIDDLEWARE] Token verified for user id:', decoded?.id);
      req.user = decoded;
      next();
    } catch (verifyErr) {
      console.error('[AUTH MIDDLEWARE] Token verification failed:', verifyErr && (verifyErr.message || verifyErr));
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  } catch (error) {
    console.error('[AUTH MIDDLEWARE] unexpected error:', error && (error.stack || error.message || error));
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user?.role !== requiredRole) {
      return res.status(403).json({ error: 'Accès refusé. Admin requis.' });
    }
    next();
  };
};
