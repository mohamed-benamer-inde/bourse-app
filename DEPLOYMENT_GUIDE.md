# Guide de Déploiement : Bourse App

Ce guide vous accompagne étape par étape pour mettre votre application en ligne sur **Render**, configurer une base de données **MongoDB Atlas** gratuite, et créer votre **répertoire GitHub**.

> [!IMPORTANT]
> **Git n'est pas détecté sur votre système.** Vous devrez l'installer pour pouvoir créer le répertoire GitHub et déployer sur Render.

## Étape 1 : Installation de Git

1.  Téléchargez Git pour Windows : [https://git-scm.com/download/win](https://git-scm.com/download/win)
2.  Installez-le en suivant les instructions par défaut.
3.  Une fois installé, redémarrez votre terminal (ou VS Code).
4.  Vérifiez l'installation en tapant : `git --version`

## Étape 2 : Création du Répertoire GitHub

1.  Connectez-vous à votre compte [GitHub](https://github.com).
2.  Créez un nouveau repository (bouton "+" en haut à droite -> "New repository").
3.  Nommez-le `bourse-app` (ou autre).
4.  Ne cochez **pas** "Initialize with README", .gitignore ou License (nous avons déjà préparé ces fichiers).
5.  Cliquez sur "Create repository".

## Étape 3 : Initialisation Locale et Envoi (Push)

Ouvrez un terminal dans le dossier de votre projet (`c:\Users\amine\Desktop\Projets\Bourse`) et exécutez les commandes suivantes une par une :

```bash
git init
git add .
# Si c'est la première fois que vous utilisez Git, configurez votre identité :
git config --global user.email "votre_email@exemple.com"
git config --global user.name "Votre Nom"

git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/bourse-app.git
git push -u origin main
```
*(Remplacez `VOTRE_NOM_UTILISATEUR` par votre pseudo GitHub)*

## Étape 4 : Base de Données MongoDB Atlas (Gratuit)

1.  Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  Créez un compte et un cluster gratuit (M0 Sandbox).
3.  Dans "Database Access", créez un utilisateur (ex: `admin`) et un mot de passe. **Notez ce mot de passe !**
4.  Dans "Network Access", ajoutez l'adresse IP `0.0.0.0/0` (Allow Access from Anywhere) pour que Render puisse s'y connecter.
5.  Cliquez sur "Connect" -> "Drivers" -> Copiez la chaîne de connexion (Connection String).
    *   Elle ressemble à : `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    *   Remplacez `<password>` par votre vrai mot de passe.

## Étape 5 : Déploiement sur Render

Nous avons préparé un fichier `render.yaml` qui automatise la configuration.

1.  Allez sur [Render Dashboard](https://dashboard.render.com/).
2.  Cliquez sur "New +" -> "Blueprint".
3.  Connectez votre compte GitHub et sélectionnez le repo `bourse-app`.
4.  Donnez un nom au blueprint (ex: `bourse-app`).
5.  Render va détecter les deux services définis dans `render.yaml` :
    *   `bourse-api` (Backend)
    *   `bourse-frontend` (Frontend)
6.  **Configuration des Variables d'Environnement** :
    Render vous demandera de valider les variables. Vous devez remplir :
    *   `MONGODB_URI` : Collez la chaîne de connexion MongoDB Atlas (étape 4).
    *   `JWT_SECRET` : Render va en générer un automatiquement (ou mettez une chaîne aléatoire longue).
    *   `FRONTEND_URL` : L'URL de votre site frontend (ex: `https://bourse-frontend-xxxx.onrender.com`).
        *   *Note : Vous pouvez ajouter cette variable après le premier déploiement, une fois que vous connaissez l'URL du frontend.*
        *   *Important : Cela sécurise votre API pour qu'elle ne réponde qu'à votre site.*
7.  Cliquez sur "Apply".

Render va maintenant construire et déployer votre frontend et votre backend.

## Vérification

Une fois le déploiement terminé (vert), vous pourrez accéder à votre application via l'URL fournie par Render pour le service `bourse-frontend`.

> [!NOTE]
> Le fichier `src/utils/api.js` a été configuré pour détecter automatiquement l'URL du backend sur Render.

## Étape 6 : Accéder à votre site

Une fois le déploiement terminé, vous aurez deux services dans votre tableau de bord Render :

1.  **bourse-api** : C'est votre Backend (API). Son URL affiche "API is running...". C'est normal !
2.  **bourse-frontend** : C'est votre Site Web (l'interface utilisateur).
    *   Cliquez sur le service `bourse-frontend`.
    *   Cliquez sur l'URL affichée en haut à gauche (ex: `https://bourse-frontend-xxxx.onrender.com`).
    *   **C'est ce lien que vous devez partager et utiliser.**
