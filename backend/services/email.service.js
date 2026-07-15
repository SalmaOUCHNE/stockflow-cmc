const emailService = {
  sendTempPasswordEmail: async (email, nom, prenom, tempPassword) => {
    // Simulation - en production, utiliser nodemailer ou SendGrid
    const message = `
=====================================
Bienvenue ${prenom} ${nom} !

Votre compte StockFlow CMC a été créé.

Email: ${email}
Mot de passe temporaire: ${tempPassword}

Veuillez changer ce mot de passe à votre première connexion.
=====================================
    `;

    console.log('📧 EMAIL ENVOYÉ:');
    console.log(message);
  },

  sendPasswordResetEmail: async (email, resetLink) => {
    const message = `
=====================================
Réinitialisation du mot de passe StockFlow CMC

Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe:
${resetLink}

Ce lien expire dans 30 minutes.
=====================================
    `;

    console.log('📧 EMAIL ENVOYÉ:');
    console.log(message);
  },
};

export default emailService;
