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

    // Logging formatted AI request
    console.log("\n" + "=".repeat(50));
    console.log(`🤖 AI REQUEST [${context.toUpperCase()}]`);
    console.log("-".repeat(50));
    console.log(`Input text: "${strText.substring(0, 100)}${strText.length > 100 ? '...' : ''}"`);
    console.log("=".repeat(50));

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
            6. INTERDIT : Toute suggestion de rencontre physique (ex: "rdv au café", "on se voit à l'hôtel", "viens chez moi", etc.). Les échanges doivent rester virtuels.
            7. INTERDIT : Méthodes de paiement alternatives ou parallèles (ex: Western Union, Wafacash, CashPlus, carte cadeau, cryptomonnaies).
            8. INTERDIT : Réseaux sociaux ou identifiants externes (ex: @Instagram, Facebook, TikTok, Snapchat).
            9. INTERDIT : Harcèlement, chantage, ou demande de faveurs personnelles/sexuelles en échange d'aide (Tolérance Zéro).
            10. INTERDIT : Se faire passer pour un administrateur ou un membre du staff de BourseConnect.
            11. INTERDIT : Mendicité agressive, spam, ou messages sans aucun rapport avec les études.
            
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
        
        // Logging formatted AI response
        console.log(`✅ AI RESPONSE: Score=${data.score}/100 | Reason: ${data.reason}`);
        console.log("=".repeat(50) + "\n");

        return {
            isValid: data.score >= minScore,
            reason: data.score < minScore ? (data.reason || "La qualité du texte est insuffisante.") : "",
            score: data.score
        };
    } catch (error) {
        console.error("❌ AI ERROR:", error.message);
        console.log("=".repeat(50) + "\n");
        return { isValid: true, score: 100 }; // Default to true if AI fails
    }
};

/**
 * Validates if an image/PDF is a prohibited document (ID card, Passport).
 */
const validateDocumentWithAI = async (buffer, mimeType) => {
    if (mimeType === 'application/pdf') {
        console.log(`ℹ️ AI VISION SKIP: PDF non analysé (${mimeType})`);
        return { isValid: true };
    }

    console.log("\n" + "=".repeat(50));
    console.log(`👁️ AI VISION REQUEST`);
    console.log("-".repeat(50));
    console.log(`MimeType: ${mimeType}`);
    console.log("=".repeat(50));

    try {
        // Note: PDFs might need conversion or different handling, but for images:
        const base64Image = buffer.toString("base64");
        const prompt = `Analyse ce document. 
        Est-il interdit ? Un document est INTERDIT s'il contient :
        1. Une pièce d'identité (CIN, Passeport, Permis).
        2. Des coordonnées bancaires (RIB, IBAN, numéro de carte).
        3. Un numéro de téléphone personnel ou une adresse email.
        4. Une adresse de domicile personnelle (l'adresse de l'école est autorisée).

        Réponds UNIQUEMENT au format JSON : { "isForbidden": boolean, "reason": "string" }. 
        Si c'est un relevé de notes ou un certificat de scolarité standard sans coordonnées bancaires, isForbidden doit être false.`;
        
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
        
        // Logging formatted AI response
        console.log(`✅ AI VISION RESPONSE: isForbidden=${data.isForbidden} | Reason: ${data.reason}`);
        console.log("=".repeat(50) + "\n");

        if (data.isForbidden) {
            return { isValid: false, reason: data.reason || "Ce document contient des informations personnelles non autorisées (CIN, RIB, Téléphone, etc.)." };
        }
        
        return { isValid: true };
    } catch (error) {
        console.error("❌ AI VISION ERROR:", error.message);
        console.log("=".repeat(50) + "\n");
        return { isValid: true }; // Allow if AI fails
    }
};

module.exports = { validateWithAI, validateDocumentWithAI };
