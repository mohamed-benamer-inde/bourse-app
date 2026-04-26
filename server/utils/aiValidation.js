const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: modelName });

/**
 * Validates text relevance and detects hidden contact info using Gemini.
 * @param {string} text - The text to validate
 * @param {string} context - The context (e.g., 'motivation', 'message')
 * @returns {Promise<{isValid: boolean, reason: string}>}
 */
const validateWithAI = async (text, context = 'général') => {
    const minLength = context === 'lettre de motivation' ? 100 : 2;
    if (!text || text.trim().length < minLength) {
        return { 
            isValid: false, 
            reason: context === 'lettre de motivation' 
                ? "Votre lettre de motivation est trop courte. Pour convaincre un donateur, merci d'écrire au moins 100 caractères."
                : "Le texte est trop court pour être pertinent." 
        };
    }

    try {
        const prompt = `
            Tu es un modérateur expert pour une plateforme de bourses d'études au Maroc nommée BourseConnect.
            Évalue la pertinence et la sécurité du texte suivant fourni par un utilisateur dans le contexte : "${context}".
            
            Règles strictes :
            1. Le texte doit être sérieux, cohérent et poli.
            2. INTERDIT : Partage de coordonnées PERSONNELLES (téléphone, email, RIB, ou adresse du domicile précise).
            3. AUTORISÉ : L'adresse de l'établissement scolaire ou de l'université est autorisée et nécessaire.
            4. INTERDIT : Insultes, contenu inapproprié ou texte aléatoire (ex: "asdfg", "test test").
            5. LANGUES : Accepte le Français, l'Arabe classique, et la Darija marocaine (même en caractères latins avec 3, 7, 9).
            
            Texte à analyser :
            """
            ${text}
            """
            
            Réponds UNIQUEMENT au format JSON suivant :
            {
                "isValid": boolean,
                "reason": "Une explication courte en français si invalide, sinon vide"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        // Extract JSON from response (Gemini might return markdown blocks)
        const jsonMatch = responseText.match(/\{.*\}/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return { isValid: true }; // Default to true if parsing fails
    } catch (error) {
        console.error("Gemini Validation Error:", error);
        return { isValid: true };
    }
};

/**
 * Validates if an image/PDF is a prohibited document (ID card, Passport).
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - File mime type
 * @returns {Promise<{isValid: boolean, reason: string}>}
 */
const validateDocumentWithAI = async (buffer, mimeType) => {
    try {
        const prompt = "Analyse ce document. S'agit-il d'une pièce d'identité (CIN, Carte Nationale, Passeport, Permis de conduire) ? Réponds UNIQUEMENT au format JSON : { \"isIdCard\": boolean, \"reason\": \"string\" }. Si c'est un relevé de notes ou un certificat de scolarité, isIdCard doit être false.";
        
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType
                }
            }
        ]);

        const responseText = await result.response.text();
        const jsonMatch = responseText.match(/\{.*\}/s);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.isIdCard) {
                return { isValid: false, reason: "Les pièces d'identité (CIN/Passeport) ne sont pas autorisées pour protéger votre vie privée. Veuillez ne fournir que des documents académiques." };
            }
        }
        return { isValid: true };
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return { isValid: true }; // Allow if AI fails
    }
};

module.exports = { validateWithAI, validateDocumentWithAI };

