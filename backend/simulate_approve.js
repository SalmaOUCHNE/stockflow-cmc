import usersService from './services/users.service.js';
import auditService from './services/audit.service.js';
import notificationsService from './services/notifications.service.js';

(async function(){
  try{
    const id = '7f14e8e7-3bfb-4107-bf4a-f7389f5dbf40';
    const updatedUser = await usersService.updateUser(id, { status: 'active' });
    console.log('updatedUser', updatedUser);
    await auditService.log({ action: 'APPROVE_USER', entite_cible: 'users', entite_id: id, user_id: 'e7424526-9f10-468b-a949-59f1d945f4a3', ip_address: '127.0.0.1' });
    await notificationsService.create(id, 'account_approved', 'Votre compte a été approuvé par un administrateur.', '/');
    console.log('simulate approve done');
  } catch(e){ console.error('simulate approve failed', e); process.exit(1); }
})();
