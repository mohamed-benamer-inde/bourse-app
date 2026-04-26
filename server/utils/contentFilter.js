/**
 * Local Content Filter
 * Blocks common patterns like phone numbers, emails, and IBANs.
 */

const ribRegex = /\b\d{24}\b/g;
const ibanRegex = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/gi;
const phoneRegex = /(\+212|0)([ \-_.]?[567])([ \-_.]?\d{2}){4}/g;
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Basic list of insults (Français + Darija phonétique)
const forbiddenWords = [
    'merde', 'con', 'salope', 'pute', 'connard', 'encule', 'zebb', 'zamel', 'qahba', 'taboun', 'mouk'
];

/**
 * Checks for insults and forbidden words.
 */
const checkInsults = (text) => {
    if (!text) return { isValid: true };
    const lowerText = text.toLowerCase();
    for (const word of forbiddenWords) {
        if (lowerText.includes(word)) {
            return { isValid: false, reason: "Contenu inapproprié détecté." };
        }
    }
    return { isValid: true };
};

/**
 * Strict phone validation (no letters allowed).
 */
const checkPhoneStrict = (phone) => {
    if (!phone) return { isValid: true };
    const hasLetters = /[a-zA-Z]/.test(phone);
    if (hasLetters) {
        return { isValid: false, reason: "Le numéro de téléphone ne doit pas contenir de lettres." };
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
        return { isValid: false, reason: "Le numéro de téléphone est incomplet ou invalide." };
    }
    return { isValid: true };
};

const checkContent = (text) => {
    if (!text) return { isValid: true };

    const lowerText = text.toLowerCase();

    // 1. Check Insults FIRST
    const insultCheck = checkInsults(text);
    if (!insultCheck.isValid) return insultCheck;

    // 2. Check Phone
    if (phoneRegex.test(text)) {
        return { isValid: false, reason: "Les numéros de téléphone ne sont pas autorisés dans ce champ." };
    }

    // 3. Check Email
    if (emailRegex.test(text)) {
        return { isValid: false, reason: "Les adresses email ne sont pas autorisées pour éviter les contacts hors plateforme." };
    }

    // 4. Check RIB/IBAN
    if (ribRegex.test(text) || ibanRegex.test(text)) {
        return { isValid: false, reason: "Le partage de coordonnées bancaires (RIB/IBAN) est strictement interdit." };
    }

    return { isValid: true };
};

module.exports = { checkContent, checkInsults, checkPhoneStrict };
