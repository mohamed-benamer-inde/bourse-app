/**
 * Local Content Filter
 * Blocks common patterns like phone numbers, emails, IBANs, and specific address keywords.
 */

const ribRegex = /\b\d{24}\b/g;
const ibanRegex = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/gi;
const phoneRegex = /(\+212|0)([ \-_.]?[567])([ \-_.]?\d{2}){4}/g;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Address keywords (common in Moroccan addresses)
const addressKeywords = [
    'rue', 'hay', 'quartier', 'zenqa', 'lotissement', 'appartement', 'appt', 'imm', 'immeuble', 
    'secteur', 'bloc', 'villa', 'n°', 'numéro', 'residence', 'douar'
];

const checkContent = (text, isSchool = false) => {
    if (!text) return { isValid: true };

    const lowerText = text.toLowerCase();

    // 1. Check Phone
    if (phoneRegex.test(text)) {
        return { isValid: false, reason: "Les numéros de téléphone ne sont pas autorisés pour votre sécurité." };
    }

    // 2. Check Email
    if (emailRegex.test(text)) {
        return { isValid: false, reason: "Les adresses email ne sont pas autorisées pour éviter les contacts hors plateforme." };
    }

    // 3. Check RIB/IBAN
    if (ribRegex.test(text) || ibanRegex.test(text)) {
        return { isValid: false, reason: "Le partage de coordonnées bancaires (RIB/IBAN) est strictement interdit." };
    }

    // 4. Check Address Keywords (SKIP for school address)
    if (!isSchool) {
        for (const keyword of addressKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lowerText)) {
                return { isValid: false, reason: `Votre message semble contenir une adresse personnelle (${keyword}). Les adresses précises ne sont pas autorisées.` };
            }
        }
    }

    return { isValid: true };
};

module.exports = { checkContent };
