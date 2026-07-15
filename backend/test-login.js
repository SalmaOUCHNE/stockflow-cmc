import authService from './services/auth.service.js';

(async () => {
  try {
    console.log('Starting test login');
    const res = await authService.login('admin@cmc.ma', 'admin123');
    console.log('LOGIN TEST SUCCESS', res);
  } catch (err) {
    console.error('LOGIN TEST ERROR', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();