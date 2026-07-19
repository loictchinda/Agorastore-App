# 📝 Documentation & Choix Architecturaux - Plateforme d'Enchères (Agorastore)

## 🎯 1. Vision et Pilotage du Projet
La conception de cette application a été pilotée selon une méthodologie Agile stricte. L'objectif était de livrer un MVP fonctionnel tout en garantissant un socle robuste.
*   **Gouvernance Git (Git Flow) :** Adoption de la règle `1 feature = 1 branche`.

## 🏗️ 2. Choix Technologiques & Architecturaux
*   **Architecture MVC :** Découpage strict entre routes, controllers et middlewares.
*   **Base de Données MySQL :** Utilisation d'un Pool de connexions et respect des contraintes ACID.
*   **Sécurité JWT :** Architecture stateless et mots de passe hachés via bcrypt.

## 🚧 3. Journal de Bord : Défis Techniques
*   **Défi Git :** Nettoyage d'historique complexe suite à l'inclusion de variables d'environnement. Résolu par un reset du cache global et un strict paramétrage du `.gitignore`.
*   **Défi Node :** Erreur de routing résolue par un refactoring du scope des fonctions exportées.

## 🔭 4. Roadmap (V2)
1. Conteneurisation (Docker) et hébergement Cloud (AWS).
2. Mise en place de pipelines CI/CD (GitHub Actions).