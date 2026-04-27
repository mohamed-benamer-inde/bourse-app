const OpenAI = require("openai");
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 60000, // 60 seconds
  defaultHeaders: {
    "HTTP-Referer": "https://bourseconnect.ma",
    "X-Title": "BourseConnect",
  }
});

const modelName = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

/**
 * Validates text relevance and quality using OpenRouter (Gemini).
 */
const validateWithAI = async (text, context = 'général') => {
    const minLength = context === 'lettre de motivation' ? 100 : 2;
    const strText = String(text || '');
    
    if (!strText.trim() || strText.trim().length < minLength) {
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
            Évalue la pertinence et la qualité du texte suivant fourni par un utilisateur dans le contexte : "${context}".
            
            Règles strictes :
            1. Le texte doit être sérieux, cohérent et poli.
            2. INTERDIT : Partage de coordonnées PERSONNELLES (téléphone, email, RIB).
            3. AUTORISÉ : L'adresse de l'établissement scolaire ou de l'université.
            4. INTERDIT : Insultes, contenu inapproprié ou texte aléatoire (ex: "asdfg").
            5. LANGUES : Accepte le Français, l'Arabe classique, et la Darija marocaine.
            
            Attribue un score de qualité de 0 à 100 :
            - 0-30 : Inacceptable (insultes, n'importe quoi, coordonnées interdites).
            - 31-50 : Faible qualité (trop court, peu sérieux, incohérent).
            - 51-80 : Bonne qualité (clair et poli).
            - 81-100 : Excellente qualité (très détaillé et convaincant).

            Texte à analyser :
            """
            ${strText}
            """
            
            Réponds UNIQUEMENT au format JSON suivant :
            {
                "score": number,
                "reason": "Une explication courte en français si le score est bas"
            }
        `;

        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0].message.content);
        const minScore = parseInt(process.env.MIN_QUALITY_SCORE) || 40;
        
        return {
            isValid: data.score >= minScore,
            reason: data.score < minScore ? (data.reason || "La qualité du texte est insuffisante.") : "",
            score: data.score
        };
    } catch (error) {
        console.error("OpenRouter Validation Error:", error);
        return { isValid: true, score: 100 }; // Default to true if AI fails
    }
};

/**
 * Validates if an image/PDF is a prohibited document (ID card, Passport).
 */
const validateDocumentWithAI = async (buffer, mimeType) => {
    try {
        // Note: PDFs might need conversion or different handling, but for images:
        const base64Image = buffer.toString("base64");
        const prompt = "Analyse ce document. S'agit-il d'une pièce d'identité (CIN, Carte Nationale, Passeport, Permis de conduire) ? Réponds UNIQUEMENT au format JSON : { \"isIdCard\": boolean, \"reason\": \"string\" }. Si c'est un relevé de notes ou un certificat de scolarité, isIdCard doit être false.";
        
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0].message.content);
        if (data.isIdCard) {
            return { isValid: false, reason: "Les pièces d'identité (CIN/Passeport) ne sont pas autorisées pour protéger votre vie privée. Veuillez ne fournir que des documents académiques." };
        }
        
        return { isValid: true };
    } catch (error) {
        console.error("OpenRouter Vision Error:", error);
        return { isValid: true }; // Allow if AI fails
    }
};

module.exports = { validateWithAI, validateDocumentWithAI };
