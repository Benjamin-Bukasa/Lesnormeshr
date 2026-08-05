# Plan technique backend/front écran par écran - Module ATS + IA

Ce document décrit comment implémenter concrètement le module `ATS + IA` dans le projet `LESNORMESRH`.

Il complète :
- [SCHEMA_PRISMA_ATS_IA.md](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/SCHEMA_PRISMA_ATS_IA.md:1)
- l'existant recrutement côté backend
- les pages [RecruitmentPublication.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/RecruitmentPublication.jsx:1) et [RecruitmentSelectionInterviews.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/RecruitmentSelectionInterviews.jsx:1)

## 1. Objectif d'implémentation

Le but est de faire évoluer le recrutement actuel vers un ATS professionnel capable de :
- centraliser les candidatures
- parser les CV
- scorer les candidats selon des critères pondérés
- gérer des tests
- structurer les entretiens
- proposer des recommandations IA explicables

## 2. Positionnement dans l'application actuelle

Je recommande la structure suivante :

### `Recruitment / Publication`

Reste la zone de :
- demande de recrutement
- création d'offre
- définition du besoin

### `Recruitment / Selection-Entretiens`

Devient le cœur ATS :
- candidats
- candidatures
- scoring ATS
- tests
- entretiens
- recommandations IA

### `Recruitment / ATS`

Option recommandée à moyen terme :
- vue analytique spécialisée ATS
- scoreboard pipeline
- shortlist automatique
- qualité de screening

## 3. Backend - modules à créer ou enrichir

## 3.1 Prisma

Fichier :
- [server/prisma/schema.prisma](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/prisma/schema.prisma:357)

À faire :
- ajouter tous les modèles du document `SCHEMA_PRISMA_ATS_IA.md`
- créer les migrations
- propager `tenantId`
- ajouter les index de tri et de recherche

Priorité :
1. `CandidateResumeProfile`
2. `JobScorecard`
3. `ApplicationScreening`
4. `AssessmentCampaign`
5. `InterviewEvaluation`
6. `AiEvaluationRun`
7. `AiRecommendation`

## 3.2 Service backend recrutement

Fichier principal existant :
- [server/src/services/talent-acquisition.service.js](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/src/services/talent-acquisition.service.js:1)

Je recommande de ne pas tout empiler dedans à long terme.

Créer :
- `server/src/services/ats-screening.service.js`
- `server/src/services/ats-assessment.service.js`
- `server/src/services/ats-ai.service.js`
- `server/src/services/ats-scorecard.service.js`

Et garder `talent-acquisition.service.js` comme orchestrateur haut niveau.

## 3.3 Routes backend

Créer :
- `server/src/routes/ats.routes.js`
- `server/src/controllers/ats.controller.js`

Ou intégrer progressivement dans `talent-acquisition.routes.js` si tu veux limiter la surface.

Je recommande ces endpoints :

### Scorecards
- `GET /api/ats/job-scorecards`
- `POST /api/ats/job-scorecards`
- `PATCH /api/ats/job-scorecards/:id`
- `DELETE /api/ats/job-scorecards/:id`

### Screening
- `GET /api/ats/screenings`
- `GET /api/ats/screenings/:applicationId`
- `POST /api/ats/screenings/run`
- `PATCH /api/ats/screenings/:id/human-decision`

### CV parsing
- `POST /api/ats/candidates/:candidateId/parse-resume`
- `GET /api/ats/candidates/:candidateId/resume-profile`

### Tests
- `GET /api/ats/assessments`
- `POST /api/ats/assessments`
- `PATCH /api/ats/assessments/:id`
- `POST /api/ats/assessments/:id/questions`
- `POST /api/ats/submissions`
- `POST /api/ats/submissions/:id/score`

### Entretiens structurés
- `GET /api/ats/interview-scorecards`
- `POST /api/ats/interview-scorecards`
- `POST /api/ats/interviews/:id/evaluation`
- `PATCH /api/ats/interviews/:id/evaluation`

### IA
- `POST /api/ats/ai/screen-application`
- `POST /api/ats/ai/score-submission`
- `POST /api/ats/ai/generate-interview-questions`
- `GET /api/ats/ai/runs/:id`
- `GET /api/ats/applications/:id/recommendations`

## 3.4 Permissions à ajouter

Fichier :
- [server/src/constants/access-control.js](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/src/constants/access-control.js:1)

Ajouter un module :
- `ATS_AI_RECRUITMENT`

Ajouter des permissions :
- `ats.scorecard.read`
- `ats.scorecard.create`
- `ats.scorecard.update`
- `ats.screening.read`
- `ats.screening.run`
- `ats.screening.update`
- `ats.assessment.read`
- `ats.assessment.create`
- `ats.assessment.update`
- `ats.submission.read`
- `ats.submission.score`
- `ats.interview.scorecard.read`
- `ats.interview.scorecard.create`
- `ats.interview.evaluation.read`
- `ats.interview.evaluation.create`
- `ats.interview.evaluation.update`
- `ats.ai.run`
- `ats.ai.read`
- `ats.ai.recommendation.read`
- `ats.ai.recommendation.accept`

## 4. Intégration IA - architecture recommandée

## 4.1 Moteur IA

Créer :
- `server/src/lib/openai.js`
- `server/src/services/ai/ats-openai.service.js`

Responsabilités :
- appeler l'API OpenAI
- utiliser Structured Outputs
- versionner les prompts
- journaliser les runs
- gérer les erreurs et retries

## 4.2 Cas d'usage IA à implémenter

### Parsing CV

Entrée :
- document CV
- poste visé facultatif

Sortie structurée :
- nom
- coordonnées
- expériences
- compétences
- diplômes
- langues
- années d'expérience
- résumé professionnel

### Scoring ATS

Entrée :
- scorecard poste
- profil candidat structuré
- candidature

Sortie structurée :
- score global
- score par critère
- critères KO
- recommandations
- questions d'approfondissement

### Correction de test ouvert

Entrée :
- copie candidat
- barème
- réponse attendue

Sortie :
- note
- justification
- points forts
- lacunes

### Génération de questions d'entretien

Entrée :
- poste
- screening
- zones de risque

Sortie :
- questions ciblées par thème

## 4.3 Garde-fous IA indispensables

À implémenter dans le service :
- suppression ou masquage des attributs sensibles
- refus de décision automatique finale
- sortie JSON stricte
- trace du prompt versionné
- traçabilité des évidences utilisées

## 5. Front-end - écrans à créer ou enrichir

## 5.1 Écran `Recruitment / Publication`

Fichier existant :
- [front-end/src/pages/RecruitmentPublication.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/RecruitmentPublication.jsx:1)

À ajouter :
- bloc `Scorecard du poste`
- bouton `Configurer les critères ATS`
- bouton `Associer un test`

Nouveau `Sheet` :
- création / édition de `JobScorecard`
- définition des critères
- poids
- knockout oui/non

## 5.2 Écran `Recruitment / Selection-Entretiens`

Fichier existant :
- [front-end/src/pages/RecruitmentSelectionInterviews.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/RecruitmentSelectionInterviews.jsx:1)

À enrichir très fortement.

Je recommande de faire évoluer les tabs actuels :

### Onglet `Candidats`

Ajouter :
- statut parsing CV
- score CV
- bouton `Parser CV`
- bouton `Voir profil structuré`
- bouton `Voir rapport IA`

### Onglet `Candidatures`

Ajouter :
- score ATS
- score test
- score entretien
- score final
- décision IA
- décision recruteur
- bouton `Lancer screening`
- bouton `Shortlist`
- bouton `Demander revue humaine`

### Onglet `Entretiens`

Ajouter :
- scorecard entretien
- notation par critère
- questions suggérées par IA
- résumé entretien

### Onglet `Offres`

Ajouter :
- recommandation IA avant offre
- risques de mismatch
- résumé final candidat

## 5.3 Nouveau `Sheet` : Profil candidat ATS

Nouveau composant recommandé :
- `front-end/src/components/recruitment/CandidateAtsProfileSheet.jsx`

Contenu :
- résumé candidat
- expériences
- compétences
- études
- certifications
- score CV
- observations IA
- pièces

## 5.4 Nouveau `Sheet` : Rapport de screening

Nouveau composant recommandé :
- `front-end/src/components/recruitment/ApplicationScreeningSheet.jsx`

Contenu :
- score global
- décision proposée
- critères KO
- détail par critère
- snippets de preuve
- actions recruteur

## 5.5 Nouveau `Sheet` : Test et correction

Nouveau composant recommandé :
- `front-end/src/components/recruitment/AssessmentSubmissionSheet.jsx`

Contenu :
- test assigné
- état de soumission
- score détaillé
- correction IA
- révision humaine

## 5.6 Nouveau `Sheet` : Questions d'entretien IA

Nouveau composant recommandé :
- `front-end/src/components/recruitment/InterviewPrepSheet.jsx`

Contenu :
- 5 à 10 questions ciblées
- risques à creuser
- points forts à confirmer
- résumé ATS avant entretien

## 5.7 Option recommandée : nouvel écran ATS dédié

Créer :
- `front-end/src/pages/RecruitmentAts.jsx`

Et l'ajouter sous :
- `/Recruitment/ATS`

But :
- vue pipeline ATS
- ranking global
- shortlist
- anomalies
- performance de screening

## 6. Services front à créer

Créer :
- `front-end/src/services/atsApi.js`

Il doit couvrir :
- scorecards
- screening
- parsing CV
- tests
- évaluations entretien
- runs IA
- recommandations

Exemples de méthodes :
- `listJobScorecards`
- `createJobScorecard`
- `runApplicationScreening`
- `parseCandidateResume`
- `getCandidateResumeProfile`
- `listAssessments`
- `createAssessment`
- `scoreAssessmentSubmission`
- `generateInterviewQuestions`
- `getApplicationRecommendations`

## 7. Découpage d'implémentation recommandé

## Phase 1 - Base ATS

Backend :
- migration Prisma V1
- endpoints scorecard
- endpoints parsing CV
- endpoints screening

Front :
- ajout du bloc scorecard dans `RecruitmentPublication`
- score ATS dans `RecruitmentSelectionInterviews`
- `CandidateAtsProfileSheet`
- `ApplicationScreeningSheet`

Livrable :
- un recruteur peut configurer des critères et obtenir un score ATS sur un candidat

## Phase 2 - Tests

Backend :
- `AssessmentCampaign`
- `AssessmentQuestion`
- `AssessmentSubmission`
- scoring

Front :
- tab tests ou enrichissement onglet candidatures
- `AssessmentSubmissionSheet`

Livrable :
- un candidat peut être évalué sur test avec note détaillée

## Phase 3 - Entretien structuré

Backend :
- `InterviewScorecard`
- `InterviewEvaluation`

Front :
- notation d'entretien structurée
- préparation IA entretien

Livrable :
- les entretiens deviennent comparables et auditables

## Phase 4 - Recommandations IA

Backend :
- `AiEvaluationRun`
- `AiEvaluationEvidence`
- `AiRecommendation`

Front :
- visualisation des recommandations
- validation / rejet humain

Livrable :
- le recruteur a un copilote IA traçable

## 8. Règles métier à imposer

- aucune recommandation IA ne doit rejeter définitivement seule
- la décision finale reste humaine
- chaque score IA doit avoir une justification affichable
- chaque critère ATS doit être pondéré
- les données sensibles doivent être exclues du scoring
- les entretiens doivent utiliser une grille commune

## 9. Évaluation qualité du système

Prévoir ensuite :
- datasets de candidatures historiques
- comparaison shortlist IA vs shortlist recruteur
- taux de faux positifs / faux négatifs
- qualité des recommandations

À relier plus tard avec :
- evals internes du moteur IA
- audit RH

## 10. Recommandation finale

La meilleure manière de l'implémenter ici est :

1. démarrer par `scorecard + parsing CV + screening`
2. brancher ensuite `tests`
3. finir avec `entretien structuré + recommandations IA`

Si tu veux, la suite immédiate la plus utile est que je commence maintenant par :
- la **migration Prisma réelle V1 du module ATS + IA**
- ou la **maquette front réelle du bloc ATS dans `RecruitmentSelectionInterviews`**. 
