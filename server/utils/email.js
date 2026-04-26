const nodemailer = require('nodemailer');

// Configure the SMTP transporter
// Make sure to add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to your .env file
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net', // Default example
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
    },
});

const getStatusMessage = (status) => {
    switch (status) {
        case 'SUBMITTED':
            return "Votre dossier de bourse a été soumis avec succès. Il est désormais visible par nos donateurs.";
        case 'ANALYZING':
            return "Bonne nouvelle ! Un donateur est actuellement en train d'étudier votre dossier.";
        case 'REQUEST_INFO':
            return "Le donateur a besoin d'informations ou de documents complémentaires. Veuillez vous connecter à votre espace étudiant pour lui répondre.";
        case 'INFO_RECEIVED':
            return "Vos informations ont bien été transmises au donateur.";
        case 'VALIDATED':
            return "Félicitations ! Votre dossier a été validé par le donateur. L'engagement de financement est en cours.";
        case 'ACCEPTED':
            return "Votre demande de bourse a été acceptée !";
        case 'PAID':
            return "Le financement de votre bourse a été effectué par le donateur. Veuillez confirmer la bonne réception des fonds sur votre espace.";
        case 'CONFIRMED':
            return "Le processus est terminé. Nous vous souhaitons une excellente réussite dans vos études !";
        default:
            return "Le statut de votre dossier a été mis à jour. Connectez-vous pour en savoir plus.";
    }
};

const sendStatusEmail = async (studentEmail, studentName, newStatus) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[Email Mock] Email non envoyé à ${studentEmail} (SMTP non configuré). Statut: ${newStatus}`);
        return;
    }

    try {
        const message = getStatusMessage(newStatus);
        
        const mailOptions = {
            from: `"Bourse Étudiante" <${process.env.SMTP_FROM || 'no-reply@votre-domaine.com'}>`, // sender address
            to: studentEmail,
            subject: `Mise à jour de votre dossier de bourse - Statut : ${newStatus}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Bonjour ${studentName},</h2>
                    <p style="font-size: 16px; color: #475569; line-height: 1.5;">
                        ${message}
                    </p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                        <a href="${process.env.FRONTEND_URL || 'https://bourse-front.onrender.com'}/student" 
                           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                           Accéder à mon espace
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
                        Ceci est un message automatique, merci de ne pas y répondre.
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
    }
};

module.exports = {
    sendStatusEmail
};
