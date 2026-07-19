# 📝 Documentation & Choix Architecturaux - Plateforme d'Enchères (Agorastore)

## 🎯 1. Vision et Pilotage du Projet
La conception de cette application a été pilotée selon une méthodologie Agile stricte. L'objectif était de livrer un MVP fonctionnel tout en garantissant un socle robuste.
*   **Gouvernance Git (Git Flow) :** Adoption de la règle `1 feature = 1 branche`, avec Pull Request vers `main` et tests avant chaque merge.

## 🏗️ 2. Choix Technologiques & Architecturaux
*   **Architecture MVC :** Découpage strict entre routes, controllers et middlewares.
*   **Base de Données MySQL :** Utilisation d'un Pool de connexions et respect des contraintes ACID. `DECIMAL(10,2)` pour tous les montants afin d'éviter les erreurs d'arrondi des flottants sur des données monétaires.
*   **Sécurité JWT :** Architecture stateless et mots de passe hachés via bcrypt (salt round 10). Vérification centralisée dans un middleware dédié plutôt que dupliquée dans chaque controller.
*   **Documentation vivante :** Swagger généré depuis des annotations JSDoc directement dans les fichiers de routes (`/api-docs`) — la doc reste au plus près du code.

## 📓 3. Journal des Features

### Feature : CRUD Enchères (`feature/auctions`)
*   `GET /api/auctions` — liste des enchères, triée par date de création.
*   `GET /api/auctions/:id` — détail d'une enchère, avec 404 métier si introuvable (distinction volontaire entre "route inexistante" et "ressource inexistante").
*   `POST /api/auctions` — création protégée par JWT ; le `seller_id` vient du token décodé (`req.auth.userId`) et jamais du body, pour empêcher un utilisateur de publier au nom d'un autre.
*   **Choix :** `current_price` initialisé à `starting_price` dès l'INSERT pour que la logique d'enchère ne gère qu'un seul champ de prix courant.
*   **Tests :** suite smoke (`backend/tests/smoke.test.js`, exécutable via `node --test tests/`) : démarrage serveur, montage des routes, 401 sans token / token invalide. Tests sans dépendance MySQL pour pouvoir tourner en CI.

### Feature : Système d'offres (`feature/bids`)
*   `POST /api/auctions/:id/bids` — placement d'une offre, protégé par JWT.
*   `GET /api/auctions/:id/bids` — historique des offres, trié du montant le plus haut au plus bas (utile pour la page de détail côté front).

**Le point critique : la concurrence.** Deux utilisateurs peuvent enchérir à la même milliseconde. Sans précaution, tous deux lisent `current_price = 100`, tous deux valident leur offre à 110, et la seconde écrase la première : une offre disparaît silencieusement.
La parade retenue est une **transaction SQL avec `SELECT ... FOR UPDATE`** : la ligne de l'enchère est verrouillée le temps de vérifier le prix, insérer l'offre et mettre à jour `current_price`. La seconde requête attend le `COMMIT` de la première, relit le prix réel (110) et rejette donc logiquement une offre identique. Une seule offre gagne la course, sans perte de données.

**Règles métier implémentées :**
*   Montant strictement supérieur au prix courant (pas d'égalité).
*   Refus si l'enchère est `CLOSED` ou si `end_date` est dépassée — la date fait foi même si le job de clôture n'est pas encore passé, pour ne jamais accepter une offre sur un lot expiré.
*   Interdiction d'enchérir sur sa propre vente (403).
*   Validation du format du montant avant tout accès base.

**Choix : la diffusion temps réel est non bloquante.** L'émission Socket.IO se fait *après* le `COMMIT` et derrière un `if (io)`. La base est la source de vérité, la notification n'est qu'un confort d'affichage : si le canal WebSocket est absent ou tombe, l'offre reste enregistrée et l'API fonctionnelle. On ne fait jamais échouer une transaction validée à cause d'une couche de notification.

**Gestion du pool :** `connection.release()` est placé dans un `finally`, pour rendre la connexion quoi qu'il arrive. Sans cela, le pool (limité à 10) se viderait et l'API se figerait après quelques erreurs.

**Tests :** `backend/tests/bids.test.js` — sécurité 401 (sans token / token invalide), montage des routes, absence de collision entre `/:id` et `/:id/bids`. Lancement : `npm test`.

## 🚧 4. Journal de Bord : Défis Techniques
*   **Défi Git :** Nettoyage d'historique complexe suite à l'inclusion de variables d'environnement. Résolu par un reset du cache global et un strict paramétrage du `.gitignore`.
*   **Défi Node :** Erreur de routing résolue par un refactoring du scope des fonctions exportées.

## 🔭 5. Roadmap (V2)
1. Conteneurisation (Docker) et hébergement Cloud (AWS).
2. Mise en place de pipelines CI/CD (GitHub Actions).
