# Cahier fonctionnel écran par écran - Module congés et absences RDC

Ce document décrit l'intégration fonctionnelle du module `Congés et absences` dans le projet actuel `LESNORMESRH`.

Il se base sur :
- la page existante [front-end/src/pages/Leave.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/Leave.jsx:1)
- la route existante [front-end/src/routes/routes.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/routes/routes.jsx:143)
- le module d'accès `LEAVE_WORKFLOW` déjà présent dans [server/src/constants/access-control.js](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/src/constants/access-control.js:23)
- l'objectif de conformité au droit du travail en RDC

## 1. Objectif du module

Le module doit permettre de gérer :
- les demandes de congé et d'absence
- le calcul des droits acquis
- le workflow de validation manager et RH
- les justificatifs
- les congés de circonstance
- le congé maternité
- les absences maladie et accident du travail
- les reports, expirations et plafonds
- l'impact paie
- l'audit de conformité

Le module doit être pensé comme un moteur de règles RH, et non comme un simple formulaire.

## 2. Positionnement dans l'application actuelle

Existant :
- route `Leave`
- entrée sidebar `Congé`
- widget dashboard `Demandes de congé`
- module d'accès `LEAVE_WORKFLOW`

Recommandation :
- conserver la page principale `Leave`
- en faire un conteneur à onglets ou sous-routes
- créer des vues métier selon le rôle

Répartition proposée :
- `Leave` = conteneur principal du module
- `Leave / Mes-demandes` = vue collaborateur
- `Leave / Validation` = vue manager / RH
- `Leave / Soldes` = vue droits et compteurs
- `Leave / Calendrier` = vue planning et chevauchements
- `Leave / Conformité` = vue RH de contrôle
- `Leave / Paramètres` = règles et politiques

## 3. Rôles et droits

### Collaborateur

Peut :
- voir ses soldes
- créer une demande
- joindre un justificatif
- annuler une demande tant qu'elle n'est pas validée définitivement
- suivre le statut
- consulter son historique

### Manager

Peut :
- voir les demandes de son équipe
- approuver ou rejeter un premier niveau
- voir le calendrier des absences de l'équipe
- détecter les conflits d'effectif
- demander un complément d'information

### RH

Peut :
- paramétrer les types de congé
- gérer les politiques d'acquisition
- valider les demandes soumises au contrôle RH
- contrôler les plafonds et pièces
- gérer les jours fériés
- forcer certaines régularisations
- préparer l'impact paie
- consulter l'audit et la conformité

### Paie

Peut :
- voir les absences validées impactant la paie
- distinguer payé, partiellement payé, non payé
- suivre les périodes prises en compte pour le calcul

### Admin

Peut :
- voir les paramètres globaux
- attribuer les permissions
- ouvrir le module à un tenant

## 4. Permissions fonctionnelles à prévoir

Le module `LEAVE_WORKFLOW` existe déjà. Je recommande d'ajouter des permissions dédiées :

- `leave.request.read`
- `leave.request.create`
- `leave.request.update`
- `leave.request.cancel`
- `leave.request.approve`
- `leave.request.reject`
- `leave.balance.read`
- `leave.policy.read`
- `leave.policy.create`
- `leave.policy.update`
- `leave.calendar.read`
- `leave.holiday.read`
- `leave.holiday.create`
- `leave.holiday.update`
- `leave.compliance.read`
- `leave.export.read`

## 5. Structure de navigation recommandée

### Option simple dans la route actuelle

Conserver :
- `/Leave`

Et à l'intérieur, afficher des onglets :
- `Vue d'ensemble`
- `Mes demandes`
- `Validation`
- `Soldes`
- `Calendrier`
- `Conformité`
- `Paramètres`

### Option plus propre à moyen terme

Sous-routes :
- `/Leave/Overview`
- `/Leave/My-Requests`
- `/Leave/Approvals`
- `/Leave/Balances`
- `/Leave/Calendar`
- `/Leave/Compliance`
- `/Leave/Settings`

Je recommande la deuxième option si tu veux un module réellement maintenable.

## 6. Écran par écran

## 6.1 Écran `Leave` - Vue d'ensemble

But :
- donner une lecture rapide des congés et absences en cours

Blocs :
- solde congé annuel disponible
- demandes en attente
- absences du jour dans l'équipe
- demandes urgentes nécessitant validation
- jours fériés à venir
- alertes de conformité

Filtres :
- période
- équipe
- département
- site
- type de congé

Actions :
- créer une demande
- ouvrir mes demandes
- ouvrir validation
- exporter le résumé

Widgets recommandés :
- `Congés disponibles`
- `Demandes en attente`
- `Taux d'absentéisme`
- `Demandes bloquées pour justificatif`
- `Congés expirant bientôt`

## 6.2 Écran `Leave / Mes demandes`

But :
- permettre au collaborateur de soumettre et suivre ses demandes

Colonnes :
- référence
- type de congé
- date début
- date fin
- durée
- statut
- validateur courant
- date de demande

Filtres :
- statut
- type
- période

Actions :
- créer une demande
- voir détail
- modifier si brouillon
- annuler si non consommée
- télécharger justificatif

États métier :
- `BROUILLON`
- `SOUMISE`
- `EN_VALIDATION_MANAGER`
- `EN_VALIDATION_RH`
- `APPROUVÉE`
- `REJETÉE`
- `ANNULÉE`
- `CONSOMMÉE`

## 6.3 Écran `Leave / Nouvelle demande`

But :
- centraliser la saisie de toute nouvelle absence

Je recommande un `Sheet` ou une page dédiée avec ces champs :
- type de congé
- date début
- date fin
- demi-journée oui/non
- motif
- adresse pendant absence
- contact joignable
- remplaçant
- justificatif
- commentaire au manager

Comportements attendus :
- calcul automatique du nombre de jours ouvrables
- exclusion des jours fériés et repos selon politique
- affichage du solde avant / après
- message si dépassement
- blocage si pièces obligatoires manquantes
- avertissement si chevauchement avec une autre demande

Règles visibles dans l'interface :
- droit disponible
- délai minimum de soumission
- pièces requises
- niveau de validation requis
- impact paie

## 6.4 Écran `Leave / Détail d'une demande`

But :
- afficher toute la vie de la demande

Sections :
- résumé
- chronologie des validations
- justificatifs
- commentaires
- règle appliquée
- impact sur le solde
- impact paie

Actions selon rôle :
- approuver
- rejeter
- demander complément
- annuler
- régulariser
- télécharger les pièces

## 6.5 Écran `Leave / Validation`

But :
- donner au manager et à RH une file claire de travail

Colonnes :
- employé
- équipe
- type
- période
- nombre de jours
- date de soumission
- niveau de validation
- risque opérationnel
- statut

Filtres :
- niveau de validation
- type
- site
- département
- manager
- urgence

Actions :
- approuver
- rejeter
- renvoyer au collaborateur
- demander justificatif
- voir planning équipe
- voir historique employé

Vue manager :
- centrée sur son équipe
- met en avant l'impact sur le staffing

Vue RH :
- centrée sur la conformité
- met en avant la nature du droit et les plafonds

## 6.6 Écran `Leave / Soldes`

But :
- visualiser le compte congé et absence d'un collaborateur

Colonnes ou cartes :
- droit acquis
- report
- pris
- approuvé non consommé
- en attente
- expiré
- disponible

Détail par type :
- congé annuel
- congé circonstance
- maternité
- absence maladie
- sans solde

Actions :
- voir calcul
- corriger manuellement avec trace RH
- exporter le compte

Usage :
- collaborateur = son propre solde
- manager = soldes de son équipe
- RH = tous les soldes

## 6.7 Écran `Leave / Calendrier`

But :
- éviter les conflits d'absence et piloter la présence

Vues :
- mois
- semaine
- équipe
- département

Éléments visibles :
- absences validées
- absences en attente
- jours fériés
- périodes bloquées
- pics de charge

Actions :
- filtrer par équipe
- cliquer une absence pour détail
- créer une demande depuis une plage
- comparer disponibilité équipe

Règles métier :
- signaler si plusieurs personnes critiques sont absentes ensemble
- signaler si le minimum de couverture n'est pas respecté

## 6.8 Écran `Leave / Historique employé`

But :
- donner une lecture RH et manager de l'historique d'absence

Contenu :
- toutes les demandes passées
- totaux par type
- récurrence maladie
- annulations
- retours anticipés
- incidents ou irrégularités

Actions :
- ouvrir chaque dossier
- exporter historique
- préparer un entretien RH si besoin

## 6.9 Écran `Leave / Conformité`

But :
- permettre à RH de surveiller les risques juridiques et de paie

Blocs :
- demandes sans justificatif obligatoire
- congés annuels non pris à temps
- dépassement du plafond de congés de circonstance payés
- anomalies de solde
- demandes payées alors qu'elles devraient être sans solde
- absences longues nécessitant visite de reprise

Filtres :
- période
- site
- département
- type d'alerte

Actions :
- ouvrir l'anomalie
- corriger
- notifier le manager
- exporter rapport

## 6.10 Écran `Leave / Paramètres / Types de congé`

But :
- définir le catalogue des absences

Types de base recommandés :
- `ANNUEL`
- `MATERNITÉ`
- `CIRCONSTANCE_MARIAGE`
- `CIRCONSTANCE_NAISSANCE`
- `CIRCONSTANCE_DÉCÈS_1ER_DEGRÉ`
- `CIRCONSTANCE_DÉCÈS_2E_DEGRÉ`
- `MALADIE`
- `ACCIDENT_TRAVAIL`
- `SANS_SOLDE`
- `AUTORISATION_EXCEPTIONNELLE`

Champs de paramétrage :
- code
- libellé
- catégorie
- payé oui/non
- payé partiel oui/non
- justificatif obligatoire
- certificat médical obligatoire
- approbation RH obligatoire
- impact paie
- déductible du solde annuel oui/non
- quota annuel

## 6.11 Écran `Leave / Paramètres / Politiques`

But :
- définir les règles de calcul par tenant

Blocs :
- mode d'acquisition des congés annuels
- ancienneté minimale
- règle de report
- expiration
- plafond de cumul
- arrondi demi-journée
- calcul jours ouvrables ou calendaires
- règles spécifiques maternité
- règles maladie
- règles accident du travail

Actions :
- créer une politique
- versionner
- activer
- archiver

## 6.12 Écran `Leave / Paramètres / Jours fériés`

But :
- gérer le calendrier des jours fériés

Colonnes :
- date
- libellé
- pays
- province ou site si spécifique
- actif

Actions :
- ajouter
- modifier
- importer une année
- dupliquer l'année suivante

## 6.13 Écran `Leave / Paramètres / Workflow`

But :
- définir le circuit de validation

Paramètres :
- validation manager obligatoire
- validation RH obligatoire
- niveau supplémentaire selon type
- délégation en cas d'absence du validateur
- escalade si délai dépassé

## 6.14 Écran `Leave / Paramètres / Pièces justificatives`

But :
- définir les pièces attendues par type d'absence

Exemples :
- certificat médical
- acte de naissance
- certificat de décès
- attestation de mariage

Règles :
- obligatoire à la soumission
- obligatoire après soumission
- nombre de jours max avant blocage

## 6.15 Écran `Leave / Impact paie`

But :
- transmettre à la paie les absences validées

Colonnes :
- employé
- période
- type
- payé
- partiellement payé
- non payé
- coefficient
- statut d'intégration paie

Actions :
- exporter vers paie
- marquer intégré
- rouvrir si correction

## 6.16 Écran `Leave / Audit`

But :
- tracer toutes les actions sensibles

Événements à journaliser :
- création
- modification
- soumission
- approbation
- rejet
- annulation
- correction manuelle
- changement de solde
- ajout ou suppression de justificatif

Colonnes :
- date
- utilisateur
- action
- objet
- ancienne valeur
- nouvelle valeur
- motif

## 7. Flux métier recommandés

## 7.1 Flux congé annuel

1. Le collaborateur ouvre `Mes demandes`.
2. Il crée une demande de congé annuel.
3. Le système calcule le nombre de jours ouvrables.
4. Le système affiche le solde et vérifie l'éligibilité.
5. Le manager approuve ou rejette.
6. RH valide si la politique l'exige.
7. La demande passe à `APPROUVÉE`.
8. L'impact paie et solde est enregistré.

## 7.2 Flux congé de circonstance

1. Le collaborateur choisit le type exact.
2. Le système applique automatiquement le quota légal ou interne.
3. Le justificatif demandé est joint.
4. Le manager valide.
5. RH contrôle si nécessaire.
6. Le système surveille le plafond annuel des jours payés.

## 7.3 Flux maladie

1. Le collaborateur ou RH déclare l'absence.
2. Le certificat médical est joint.
3. Le système classe `maladie ordinaire` ou `accident du travail`.
4. RH contrôle la prise en compte pour les droits au congé annuel.
5. Si arrêt long, alerte sur visite de reprise.

## 7.4 Flux maternité

1. RH ou la collaboratrice ouvre une demande maternité.
2. Les dates prévisionnelles sont renseignées.
3. Le système applique la durée légale ou la politique interne alignée.
4. L'impact paie est marqué `partiellement payé` si c'est la règle applicable.
5. Le dossier reste protégé et tracé jusqu'au retour.

## 8. Données visibles par rôle

### Collaborateur

Voit :
- ses demandes
- ses soldes
- ses justificatifs
- ses alertes

Ne voit pas :
- les règles de correction RH
- les dossiers des autres
- les exports conformité

### Manager

Voit :
- demandes de son équipe
- calendrier d'équipe
- historiques utiles à la décision

Ne voit pas :
- informations d'autres équipes sans droit
- paramétrage global

### RH

Voit :
- tous les dossiers du tenant
- règles, politiques, pièces, audit, conformité

## 9. Écrans à créer ou adapter dans le repo

### Écran existant à transformer

- [front-end/src/pages/Leave.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/Leave.jsx:1)

Il doit devenir le conteneur principal du module.

### Pages recommandées

- `front-end/src/pages/Leave.jsx`
- `front-end/src/pages/LeaveMyRequests.jsx`
- `front-end/src/pages/LeaveApprovals.jsx`
- `front-end/src/pages/LeaveBalances.jsx`
- `front-end/src/pages/LeaveCalendar.jsx`
- `front-end/src/pages/LeaveCompliance.jsx`
- `front-end/src/pages/LeaveSettings.jsx`

### Services front recommandés

- `front-end/src/services/leaveApi.js`

### Routes recommandées

Dans [front-end/src/routes/routes.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/routes/routes.jsx:143), faire évoluer `Leave` en route parente avec enfants.

## 10. Intégrations avec les autres modules

### Employés

Le module doit lire :
- employé
- manager
- département
- site
- statut
- date d'entrée

### Temps et présence

Le module doit pousser :
- absence validée
- type d'absence
- retour effectif

### Paie

Le module doit pousser :
- absences payées
- absences sans solde
- absences partiellement payées
- dates à prendre en compte

### Dashboard

Le module doit exposer :
- demandes en attente
- absentéisme
- congés imminents
- risques de conformité

### Notifications

Le module doit notifier :
- demande soumise
- demande approuvée
- demande rejetée
- pièce manquante
- congé imminent
- retour de congé

## 11. États, badges et couleurs métier

Statuts recommandés :
- `BROUILLON`
- `SOUMISE`
- `EN_VALIDATION_MANAGER`
- `EN_VALIDATION_RH`
- `APPROUVÉE`
- `REJETÉE`
- `ANNULÉE`
- `CONSOMMÉE`
- `RÉGULARISÉE`

Badges :
- bleu = en attente
- vert = approuvée
- rouge = rejetée
- gris = annulée
- orange = action RH requise

## 12. Indicateurs clés à afficher

- taux d'absentéisme
- délai moyen de validation
- volume de demandes par type
- congés annuels consommés
- soldes expirant bientôt
- demandes bloquées
- absences maladie longues
- jours de circonstance payés cumulés

## 13. Priorité de réalisation

### Phase 1

- `Leave / Vue d'ensemble`
- `Leave / Mes demandes`
- `Leave / Nouvelle demande`
- `Leave / Validation`
- `Leave / Soldes`

### Phase 2

- `Leave / Calendrier`
- `Leave / Conformité`
- `Leave / Paramètres`
- `Leave / Impact paie`
- `Leave / Audit`

## 14. Recommandation finale

Pour ce projet, je recommande de commencer par un module simple mais déjà solide :
- un conteneur `Leave`
- trois vues métier principales
  - collaborateur
  - manager
  - RH
- un vrai workflow
- des soldes calculés
- un contrôle minimum de conformité

Ensuite seulement, on enrichit avec :
- calendrier avancé
- export paie
- audit détaillé
- règles fines par convention interne

## 15. Prochaine étape recommandée

La suite la plus utile est :

1. créer les routes et écrans front du module `Leave`
2. créer le schéma Prisma du module congés
3. brancher le workflow backend et les permissions

Si tu veux, je peux maintenant enchaîner directement avec :
- le `schéma Prisma complet du module congés`
- ou la `maquette fonctionnelle front des écrans Leave` dans le projet.
