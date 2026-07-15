import authService from "../services/auth.service.js";

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('[AUTH] Login request received for email:', email);

      const result = await authService.login(email, password);

      console.log('[AUTH] Login successful for email:', email, 'userId:', result.user?.id);
      res.json(result);
    } catch (error) {
      console.error('[AUTH] auth.controller.login error:', error && (error.stack || error.message || error));
      res.status(401).json({ error: error && error.message ? error.message : 'Authentification échouée' });
    }
  },
  register: async (req, res) => {

  try {
    console.log('[AUTH] Register request body:', req.body);

    const result =
      await authService.register(
        req.body
      );

    console.log('[AUTH] Register successful for email:', req.body?.email);
    res.status(201).json(result);

  } catch (error) {
    console.error('[AUTH] Register error:', error && (error.stack || error.message || error));
    res.status(400).json({
      error: error.message
    });

  }

},
};

export default authController;