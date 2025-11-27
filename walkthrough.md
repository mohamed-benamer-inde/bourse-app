# Guide de Démarrage - Plateforme Bourse

## 🚀 Lancer l'application

1.  Ouvrez un terminal dans le dossier du projet :
    ```bash
    cd c:/Users/amine/Desktop/Projets/Bourse
    ```
2.  Installez les dépendances (si ce n'est pas déjà fait) :
    ```bash
    npm install
    ```
3.  Lancez le serveur de développement :
    ```bash
    npm run dev
    ```
4.  Ouvrez votre navigateur sur l'URL indiquée (généralement `http://localhost:5173`).

## 🌟 Fonctionnalités Implémentées

### 1. Page d'Accueil (Landing Page)
- Présentation du concept.
- Accès rapide à l'inscription pour Étudiants et Donateurs.

### 2. Authentification
- **Inscription** : Choix du rôle (Étudiant, Donateur, Admin).
- **Connexion** : Redirection automatique vers le bon tableau de bord selon le rôle (simulé par l'email).
    - Email contenant "admin" -> Dashboard Admin
    - Email contenant "donor" -> Dashboard Donateur
    - Autres -> Dashboard Étudiant

### 3. Tableau de Bord Étudiant (`/student`)
- **Profil** : Formulaire complet (Nom, Adresse, Études, Notes, Ressources, Description).
- **Suivi** : Badge de statut de la demande (En attente, Promesse, Payé, Reçu).

### 4. Tableau de Bord Donateur (`/donor`)
- **Liste des étudiants** : Visualisation des profils avec besoins financiers.
- **Actions** :
    - "Faire une promesse de don" : Change le statut à "Promesse faite".
    - "Marquer Payé" : Change le statut à "Payé".

### 5. Tableau de Bord Administrateur (`/admin`)
- **Statistiques** : Vue globale des utilisateurs et dossiers.
- **Activités** : Tableau des dernières demandes avec statuts.

## 🛠️ Stack Technique
- **Frontend** : React + Vite
- **Styling** : TailwindCSS + Shadcn/ui (architecture)
- **Routing** : React Router Dom
- **Icons** : Lucide React
