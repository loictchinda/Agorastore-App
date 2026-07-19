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

## 🚧 4. Journal de Bord : Défis Techniques
*   **Défi Git :** Nettoyage d'historique complexe suite à l'inclusion de variables d'environnement. Résolu par un reset du cache global et un strict paramétrage du `.gitignore`.
*   **Défi Node :** Erreur de routing résolue par un refactoring du scope des fonctions exportées.

## 🔭 5. Roadmap (V2)
1. Conteneurisation (Docker) et hébergement Cloud (AWS).
2. Mise en place de pipelines CI/CD (GitHub Actions).
