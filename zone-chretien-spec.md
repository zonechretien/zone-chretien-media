# CAHIER DES CHARGES – ZONE-CHRÉTIEN MEDIA (100% GRATUIT)

> Version corrigée pour compatibilité hébergement serverless (Vercel Hobby).
> Deux ajustements par rapport à la version initiale sont signalés par 🔧 CORRECTION.
> Tout le reste est inchangé et reste 100% gratuit, sans carte bancaire.

Agis comme un Architecte Logiciel Senior Full Stack, Expert en Next.js, TypeScript, Tailwind CSS, CMS modernes, SEO, PWA, IA et déploiement sur Vercel.

Ta mission est de générer une plateforme chrétienne complète, moderne, élégante, ultra légère, extrêmement rapide et entièrement fonctionnelle avec un budget de 0 USD.

Le résultat doit être prêt pour la production et déployable immédiatement.

---

# NOM DU PROJET

**Zone-Chrétien Media**

Slogan :

**"La musique, l'inspiration et la Parole pour édifier les nations."**

---

# OBJECTIF PRINCIPAL

Créer une plateforme chrétienne moderne permettant de :

* Publier des chansons évangéliques
* Publier des vidéos chrétiennes
* Publier des artistes évangéliques
* Publier des témoignages
* Publier des versets du jour
* Publier des prières
* Publier des dévotions
* Publier des articles bibliques
* Publier des textes inspirants
* Partager du contenu facilement sur les réseaux sociaux
* Gérer l'ensemble du contenu via un CMS intégré simple et intuitif

Le site doit être utilisable par une personne non technique.

---

# CONTRAINTE ABSOLUE

Le projet doit fonctionner avec un coût de 0 USD.

INTERDICTION d'utiliser :

* Firebase
* AWS
* Cloudinary payant
* Algolia
* MongoDB Atlas payant
* Services nécessitant une carte bancaire
* Vercel Pro
* Tout SaaS payant

Le projet doit fonctionner uniquement avec :

* GitHub
* Vercel Hobby
* Turso (libSQL / SQLite distribué) — 🔧 CORRECTION, voir note ci-dessous
* Prisma
* NextAuth
* JSON local pour les données statiques (démo, seed)

Aucune dépendance à un service externe payant.

## 🔧 CORRECTION 1 — Base de données : Turso au lieu de SQLite fichier local

Le prompt initial prévoyait un fichier SQLite local. **Ce choix est incompatible avec Vercel** : le système de fichiers des fonctions serverless est éphémère et réinitialisé à chaque déploiement ou redémarrage à froid. Un CMS écrivant dans un fichier `.db` local perdrait ses données en production.

**Solution retenue : Turso** (https://turso.tech)
- Base libSQL (fork SQLite) distribuée, compatible avec le driver SQLite/Prisma
- Tier gratuit généreux (500 DB, largement suffisant), aucune carte bancaire requise
- Provider Prisma : `@prisma/adapter-libsql` ou driver adapter officiel
- Le schéma Prisma reste quasi identique à un schéma SQLite classique — migration triviale

---

# TECHNOLOGIES OBLIGATOIRES

Utiliser :

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* App Router
* Prisma ORM
* Turso (libSQL) — 🔧 remplace SQLite fichier local
* NextAuth
* React Hook Form
* Zod
* Lucide React
* Framer Motion
* PWA

Architecture propre et maintenable.

---

# DESIGN

Inspirations :

* Spotify
* YouTube Music
* Bible App
* BGospel

Style :

* Moderne
* Élégant
* Chrétien
* Professionnel
* Mobile First
* Très rapide

Couleurs :

* Bleu foncé
* Blanc
* Or discret

Fonctionnalités :

* Dark Mode
* Light Mode
* Animations légères
* Accessibilité élevée

Objectif Lighthouse :

* Performance : 95+
* SEO : 100
* Accessibility : 95+
* Best Practices : 95+

---

# STRUCTURE PUBLIQUE DU SITE

## ACCUEIL

Afficher :

* Hero Banner inspirant
* Verset du jour
* Chanson vedette
* Article vedette
* Dernières chansons
* Dernières inspirations
* Dernières dévotions
* Derniers témoignages
* Artistes populaires
* Catégories
* Barre de recherche

---

# SECTION CHANSONS

Afficher :

* Image
* Titre
* Artiste
* Date
* Catégorie
* Nombre de vues

Filtres :

* Catégories
* Artistes
* Recherche

Pagination.

---

# PAGE CHANSON

Afficher :

* Image de couverture
* Titre
* Artiste
* Description
* Lecteur audio HTML5
* Lecteur vidéo YouTube
* Nombre de vues
* Date
* Catégorie
* Partage WhatsApp
* Partage Facebook
* Partage X
* Chansons similaires

IMPORTANT :

Le site ne doit héberger aucun fichier audio.

Les audios doivent être lus via URL externe.

Exemples :

* GitHub Pages
* GitHub Releases
* URL publique

Exemple :

https://monsite.github.io/audio/chanson.mp3

Les vidéos proviennent exclusivement de YouTube.

---

# SECTION ARTISTES

Afficher :

* Photo
* Nom
* Biographie
* Réseaux sociaux
* Liste des chansons

---

# SECTION VIDÉOS

Afficher :

* Miniature
* Titre
* Description
* Lecteur YouTube intégré

---

# SECTION INSPIRATIONS

Permettre de publier :

* Pensées du jour
* Citations chrétiennes
* Encouragements
* Réflexions spirituelles

Chaque contenu contient :

* Image
* Titre
* Contenu
* Auteur
* Date
* Partage social

---

# SECTION DÉVOTIONS

Publier :

* Dévotions quotidiennes
* Méditations bibliques

Chaque dévotion contient :

* Verset principal
* Réflexion
* Application pratique
* Prière

---

# SECTION PRIÈRES

Catégories :

* Prière du matin
* Prière de midi
* Prière du soir
* Prière familiale
* Prière pour la guérison
* Prière pour la protection

---

# SECTION VERSET DU JOUR

Afficher :

* Référence biblique
* Texte
* Explication
* Image partageable

---

# SECTION TÉMOIGNAGES

Publier :

* Témoignages écrits
* Histoires inspirantes
* Expériences chrétiennes

---

# BLOG CHRÉTIEN

Publier :

* Enseignements bibliques
* Études bibliques
* Réflexions spirituelles
* Actualités chrétiennes

---

# RECHERCHE GLOBALE

Recherche instantanée dans :

* Chansons
* Artistes
* Articles
* Inspirations
* Dévotions
* Prières
* Témoignages
* Versets

---

# CMS ADMINISTRATEUR

Créer un CMS moderne, simple et sécurisé.

Connexion :

* Email
* Mot de passe

---

# TABLEAU DE BORD

Afficher :

* Nombre de chansons
* Nombre d'articles
* Nombre de dévotions
* Nombre de témoignages
* Nombre d'artistes
* Nombre de vues
* Statistiques mensuelles

---

# GESTION DES CHANSONS

Ajouter / Modifier / Supprimer

Champs :

* Titre
* Artiste
* Description
* Image URL
* Audio URL
* YouTube URL
* Catégorie
* Tags

---

# GESTION DES ARTICLES

Ajouter / Modifier / Supprimer

Éditeur riche.

---

# GESTION DES INSPIRATIONS

Ajouter / Modifier / Supprimer

---

# GESTION DES DÉVOTIONS

Ajouter / Modifier / Supprimer

---

# GESTION DES PRIÈRES

Ajouter / Modifier / Supprimer

---

# GESTION DES VERSETS

Ajouter / Modifier / Supprimer

---

# GESTION DES TÉMOIGNAGES

Ajouter / Modifier / Supprimer

---

# GESTION DES ARTISTES

Ajouter / Modifier / Supprimer

---

# GESTION DES CATÉGORIES

Ajouter / Modifier / Supprimer

---

# MODULE IA

## 🔧 CORRECTION 2 — Moteur IA cloud gratuit en production, Ollama réservé au dev local

Le prompt initial prévoyait Ollama comme moteur par défaut. **Ollama ne peut pas tourner sur les fonctions serverless de Vercel** (pas de process persistant, pas de GPU/CPU dédié disponible). Architecture retenue :

* **Production (Vercel)** : fournisseur cloud gratuit — **Gemini API** (tier gratuit généreux, clé API simple, aucune carte bancaire) comme moteur par défaut
* **Développement local** : Ollama reste disponible en option, cohérent avec le pattern déjà utilisé sur Lepolo_Bible
* Architecture modulaire (interface commune type `AIProvider`) permettant de basculer entre Gemini / Ollama / autre via variable d'environnement, sans changer le code appelant

Fonctionnalités :

* Générer une dévotion
* Générer une prière
* Générer un verset du jour
* Générer un message inspirant
* Générer une description de chanson
* Générer une publication Facebook
* Générer une publication WhatsApp

Architecture modulaire permettant d'activer ou désactiver l'IA.

---

# SEO AVANCÉ

Générer automatiquement :

* Meta Title
* Meta Description
* Open Graph
* Twitter Cards
* Sitemap XML
* Robots.txt
* Canonical URLs
* Schema.org

SEO optimisé pour Google.

---

# MONÉTISATION

Prévoir des zones configurables pour :

* Google AdSense
* Artiste sponsorisé
* Événement sponsorisé
* Bannière partenaire

Les publicités doivent être discrètes.

---

# PWA

Transformer le site en application installable.

Fonctionnalités :

* Installation Android
* Installation iPhone
* Splash Screen
* Icônes
* Cache intelligent

---

# SÉCURITÉ

Implémenter :

* Validation Zod
* Protection XSS
* Protection CSRF
* Rate Limiting
* Gestion des rôles
* Authentification sécurisée

---

# BASE DE DONNÉES

Créer les modèles Prisma (sur Turso/libSQL) pour :

* Users
* Songs
* Artists
* Videos
* Inspirations
* Devotions
* Prayers
* Verses
* Testimonies
* Articles
* Categories
* Tags
* Views
* Settings

---

# DÉPLOIEMENT

Préparer :

* Configuration Vercel Hobby
* Configuration Turso (création DB, token, connection URL)
* Variables d'environnement (dont clé Gemini API, credentials Turso)
* Prisma Migration (adapté au driver libSQL)
* Build Production
* Guide d'installation complet

---

# DONNÉES DE DÉMONSTRATION

Créer automatiquement :

* 20 chansons évangéliques
* 10 artistes
* 20 inspirations
* 20 dévotions
* 20 prières
* 20 versets
* 10 témoignages
* 20 articles

Avec images de démonstration.

---

# LIVRABLES ATTENDUS

Générer intégralement, de façon incrémentale (une étape validée avant de passer à la suivante) :

1. Structure complète du projet
2. Tous les fichiers du frontend
3. Tous les composants React
4. Toutes les pages publiques
5. Toutes les pages d'administration
6. Toutes les API Routes
7. Base de données Prisma + Turso
8. CMS Administrateur complet
9. Authentification
10. PWA
11. SEO
12. Module IA (Gemini par défaut, Ollama en option dev)
13. Données de démonstration
14. Documentation d'installation
15. Documentation d'utilisation
16. Guide de déploiement Vercel + Turso

Le résultat final doit être une plateforme chrétienne professionnelle, moderne, légère, optimisée SEO, administrable facilement, compatible mobile, prête pour Vercel Hobby et entièrement fonctionnelle sans aucun coût de service externe.
