# Cahier fonctionnel ecran par ecran - Module KPI et gestion de performance

Ce document decrit l'integration fonctionnelle du module KPI et gestion de performance dans le projet actuel LESNORMESRH.

Il se base sur :
- les pages existantes `Kpiboard` et `Performances`
- la convention collective lue
- le schema cible propose dans `SCHEMA_PRISMA_KPI_PERFORMANCE.md`

## 1. Objectif du module

Le module doit permettre de gerer :
- les KPI banque, direction, service et employe
- la fixation des objectifs SMART
- les revues de mi-parcours
- les evaluations annuelles et 360
- la calibration
- les resultats finaux
- les PIP
- la gratification, la prime de performance et la prime de merite
- l'avancement, la promotion et les recommandations de formation

## 2. Positionnement dans l'application

Pages deja presentes :
- [front-end/src/pages/Kpiboard.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/Kpiboard.jsx:1)
- [front-end/src/pages/Performances.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/Performances.jsx:1)

Recommendation de structure :
- `Kpiboard` = pilotage des indicateurs et objectifs
- `Performances` = campagnes, evaluations, PIP, decisions RH

## 3. Roles et droits

### DRH

Peut :
- creer la politique de performance
- creer les campagnes
- suivre toutes les evaluations
- lancer la calibration
- valider les resultats
- ouvrir les PIP
- preparer promotions, avancements, gratifications

### Direction / Comite

Peut :
- consulter les KPI macro
- participer a la calibration
- approuver les decisions majeures

### Manager N1

Peut :
- definir les objectifs de son equipe
- faire les check-ins
- evaluer ses collaborateurs
- suivre les PIP
- recommander promotions et formations

### Manager N2

Peut :
- donner la revue de second niveau
- arbitrer les cas litigieux

### Collaborateur

Peut :
- voir ses objectifs
- mettre a jour son avancement
- faire son autoevaluation
- consulter ses feedbacks
- suivre son PIP

### Pair / Collegue

Peut :
- donner un feedback 360 si sollicite

## 4. Ecran par ecran - Kpiboard

## 4.1 Ecran `Kpiboard` - Vue d'ensemble

But :
- donner la vue executive des indicateurs RH et performance

Blocs :
- taux de completion des objectifs
- repartition des scores A/B/C/D/E
- employes en PIP
- promotions recommandees
- gratifications previsionnelles
- top performeurs
- indicateurs par direction

Filtres :
- campagne
- annee
- direction
- departement
- manager
- site

Actions :
- voir details KPI
- exporter
- ouvrir campagne

## 4.2 Ecran `Kpiboard / Catalogue KPI`

But :
- centraliser les KPI disponibles par scope

Colonnes :
- code
- nom
- scope
- type de mesure
- unite
- poids par defaut
- proprietaire
- statut

Actions :
- creer KPI
- modifier KPI
- archiver KPI

Sheet de creation :
- code
- nom
- description
- scope
- type de mesure
- methode de calcul
- unite
- poids par defaut
- direction / departement proprietaire

## 4.3 Ecran `Kpiboard / Affectations`

But :
- affecter des KPI a une campagne, une equipe ou un employe

Vues :
- par direction
- par departement
- par manager
- par employe

Actions :
- affectation en masse
- duplication depuis campagne precedente
- edition des poids
- edition des cibles

Regle cle :
- total des poids des objectifs d'un employe = `100 %`

## 4.4 Ecran `Kpiboard / Mes objectifs`

But :
- permettre au collaborateur et au manager de suivre les objectifs

Carte objectif :
- titre
- cible
- realise
- progression
- poids
- echeance
- statut
- dernier check-in

Actions :
- mettre a jour l'avancement
- ajouter commentaire
- charger preuve
- demander arbitrage

## 4.5 Ecran `Kpiboard / Check-ins`

But :
- suivre les revues de mi-parcours

Colonnes :
- employe
- objectif
- date
- progression
- blocker
- support necessaire
- prochaine action
- statut

Actions :
- creer check-in
- modifier check-in
- marquer fait

## 4.6 Ecran `Kpiboard / Analytique`

But :
- lire la performance par axe

Graphiques :
- score moyen par direction
- taux de completion des objectifs
- heatmap des KPI en retard
- tendance des scores par campagne

## 5. Ecran par ecran - Performances

## 5.1 Ecran `Performances` - Tableau de bord campagne

But :
- piloter la campagne d'evaluation

Widgets :
- campagnes actives
- autoevaluations en attente
- revues manager en attente
- revues N2 en attente
- feedback 360 en attente
- calibrations a tenir
- resultats finalises
- employes en PIP

Actions :
- creer une campagne
- ouvrir une campagne
- clore une campagne

## 5.2 Ecran `Performances / Campagnes`

But :
- gerer les cycles d'evaluation

Colonnes :
- code
- nom
- type
- annee
- periode
- phase
- statut
- participants

Actions :
- creer campagne
- dupliquer campagne
- changer phase
- activer / cloturer

Formulaire campagne :
- code
- nom
- type
- annee
- periode
- dates d'ouverture et fermeture
- politique de performance
- evaluation 360 oui/non

## 5.3 Ecran `Performances / Participants`

But :
- definir qui participe a la campagne

Colonnes :
- employe
- manager N1
- manager N2
- autoevaluation
- revue manager
- revue N2
- statut global

Actions :
- ajout en masse
- import depuis organigramme
- exclusion
- reaffectation de reviewer

## 5.4 Ecran `Performances / Autoevaluation`

But :
- permettre au collaborateur de s'evaluer

Contenu :
- recap des objectifs
- score par objectif
- forces
- axes de progres
- commentaire global

Actions :
- enregistrer brouillon
- soumettre

## 5.5 Ecran `Performances / Evaluation manager`

But :
- evaluation N1

Contenu :
- objectifs et resultats
- competences
- comportements
- discipline / penalite eventuelle
- commentaire global
- recommandation manager

Actions :
- enregistrer
- soumettre
- renvoyer au collaborateur

## 5.6 Ecran `Performances / Evaluation N2`

But :
- validation ou arbitrage second niveau

Actions :
- confirmer la revue N1
- ajuster
- commenter

## 5.7 Ecran `Performances / Feedback 360`

But :
- collecter les avis des pairs, collaborateurs, managers

Vues :
- sollicitations envoyees
- feedbacks recus
- feedbacks anonymes

Actions :
- demander des reviewers
- relancer
- fermer la collecte

## 5.8 Ecran `Performances / Calibration`

But :
- harmoniser les scores avant cloture

Colonnes :
- employe
- score propose
- bande proposee
- score calibre
- bande calibree
- raison
- decision

Actions :
- valider
- ajuster
- noter le motif

Important :
- cette etape doit laisser une trace d'audit

## 5.9 Ecran `Performances / Resultats`

But :
- afficher le resultat final officiel

Colonnes :
- employe
- score final
- bande A-E
- eligibilite promotion
- eligibilite avancement
- gratification
- bonus
- statut PIP

Actions :
- exporter
- notifier
- ouvrir un PIP
- ouvrir un dossier promotion

## 5.10 Ecran `Performances / PIP`

But :
- gerer les plans d'amelioration

Colonnes :
- employe
- campagne
- note initiale
- type de PIP
- date debut
- date fin
- statut
- prochaine revue

Actions :
- creer un PIP
- ajouter actions
- ajouter mentor / coach
- enregistrer revue
- clore le PIP

Regles metier :
- note `D` : PIP de `12 mois`, revue semestrielle
- note `E` : PIP urgent de `6 mois`, revue bimensuelle, renouvelable une fois

## 5.11 Ecran `Performances / Promotions et avancements`

But :
- gerer les consequences positives

Colonnes :
- employe
- score final
- historique notes
- avancement propose
- promotion proposee
- commissionnement
- statut

Actions :
- ouvrir un cas
- approuver
- rejeter
- convertir en evenement RH

Regles issues du document :
- progression acceleree pour note `A`
- progression standard pour note `B`
- progression conditionnelle pour note `C`
- historique de notes pour eligibilite promotion

## 5.12 Ecran `Performances / Recompenses`

But :
- preparer gratification, bonus et prime de merite

Colonnes :
- employe
- note
- coefficient
- montant
- type recompense
- statut

Regles de base tirees du document :
- `A` = `200 %` de gratification
- `B` = `150 %`
- `C` = `100 %`
- `D` = `50 %`
- `E` = `0`

Actions :
- recalculer
- valider
- envoyer a la paie

## 5.13 Ecran `Performances / Formation`

But :
- transformer les gaps de performance en plan de developpement

Colonnes :
- employe
- origine
- type besoin
- formation recommandee
- mentoring
- coaching
- statut

Sources :
- evaluation annuelle
- PIP
- calibration

## 6. API backend a creer

Je recommande un namespace unique :

- `GET /api/performance/policies`
- `POST /api/performance/policies`
- `PATCH /api/performance/policies/:policyId`
- `GET /api/performance/kpis`
- `POST /api/performance/kpis`
- `PATCH /api/performance/kpis/:kpiId`
- `GET /api/performance/cycles`
- `POST /api/performance/cycles`
- `PATCH /api/performance/cycles/:cycleId`
- `POST /api/performance/cycles/:cycleId/participants`
- `GET /api/performance/goals`
- `POST /api/performance/goals`
- `PATCH /api/performance/goals/:goalId`
- `POST /api/performance/check-ins`
- `PATCH /api/performance/check-ins/:checkInId`
- `GET /api/performance/reviews`
- `POST /api/performance/reviews`
- `PATCH /api/performance/reviews/:reviewId`
- `POST /api/performance/calibrations`
- `PATCH /api/performance/calibrations/:calibrationId`
- `GET /api/performance/results`
- `POST /api/performance/results/finalize`
- `GET /api/performance/pips`
- `POST /api/performance/pips`
- `PATCH /api/performance/pips/:pipId`
- `GET /api/performance/rewards`
- `POST /api/performance/rewards/generate`
- `PATCH /api/performance/rewards/:rewardId`
- `GET /api/performance/promotions`
- `POST /api/performance/promotions`
- `PATCH /api/performance/promotions/:promotionId`

## 7. Fichiers du repo a prevoir

### Backend

- `server/src/routes/performance.routes.js`
- `server/src/controllers/performance.controller.js`
- `server/src/services/performance.service.js`
- `server/src/services/performance-policy.service.js`
- `server/src/services/performance-kpi.service.js`
- `server/src/services/performance-review.service.js`
- `server/src/services/performance-pip.service.js`
- `server/src/services/performance-reward.service.js`

### Front

- `front-end/src/pages/Kpiboard.jsx`
- `front-end/src/pages/Performances.jsx`
- `front-end/src/pages/PerformanceCampaigns.jsx`
- `front-end/src/pages/PerformanceResults.jsx`
- `front-end/src/pages/PerformancePips.jsx`
- `front-end/src/pages/PerformancePromotions.jsx`
- `front-end/src/pages/PerformanceRewards.jsx`

### Services front

- `front-end/src/services/performanceApi.js`
- `front-end/src/services/performanceKpiApi.js`
- `front-end/src/services/performanceReviewApi.js`

## 8. Priorite d'implementation

### Phase 1

Objectif :
- faire vivre `Kpiboard` et `Performances`

Inclure :
- campagnes
- catalogue KPI
- objectifs employe
- check-ins
- autoevaluation
- evaluation manager
- score final simple

### Phase 2

Inclure :
- 360 complet
- calibration
- PIP
- recommandations de formation

### Phase 3

Inclure :
- gratification
- bonus
- prime de merite
- avancement
- promotion
- integration paie

## 9. Regles metier minimales a coder

- somme des poids = `100 %`
- score final sur `100`
- mapping `A-E`
- calendrier par campagne
- historisation de toute validation
- audit des modifications de score
- separation entre discipline et performance
- generation automatique du PIP selon bande
- generation automatique de gratification selon bande

## 10. Conclusion

Dans l'etat actuel du projet :
- `Kpiboard` et `Performances` sont encore vides
- le schema backend a une base, mais pas encore le moteur RH attendu

Le bon chemin pour LESNORMESRH est :
- utiliser `Kpiboard` pour la definition et le suivi des KPI
- utiliser `Performances` pour le cycle d'evaluation et les consequences RH
- brancher le tout sur un schema multi-tenant parametrable par convention collective
