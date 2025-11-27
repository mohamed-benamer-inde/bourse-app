export const APP_CONFIG = {
    currency: {
        code: 'MAD',
        symbol: 'DH',
        position: 'after' // 'before' or 'after'
    },
    educationLevels: [
        'Baccalauréat',
        'Bac +1',
        'Bac +2 (DEUG, BTS, DUT)',
        'Licence (Bac +3)',
        'Master 1 (Bac +4)',
        'Master 2 (Bac +5)',
        'Cycle Ingénieur',
        'Doctorat',
        'Autre'
    ],
    studyFields: [
        'Sciences & Technologies',
        'Économie & Gestion',
        'Droit & Sciences Politiques',
        'Lettres & Sciences Humaines',
        'Médecine & Pharmacie',
        'Architecture & Urbanisme',
        'Autre'
    ]
};

export const formatCurrency = (amount) => {
    return `${amount} ${APP_CONFIG.currency.symbol}`;
};
