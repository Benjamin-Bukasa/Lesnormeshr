# Documentation des endpoints

Ce fichier recense les endpoints backend disponibles et le body attendu.

## Auth

### POST `/api/auth/register`

Body:

```json
{
  "firstName": "Jean",
  "lastName": "Mukendi",
  "email": "jean@example.com",
  "phone": "+243900000000",
  "password": "Password123",
  "preferredChannel": "EMAIL"
}
```

Notes:
- `email` ou `phone` est obligatoire
- `preferredChannel` accepte `EMAIL` ou `SMS`

### POST `/api/auth/login`

Body:

```json
{
  "identifier": "superadmin@lesnormes.local",
  "password": "ChangeMe123!"
}
```

Notes:
- `identifier` peut etre un email ou un numero de telephone
- cree une session via cookie `httpOnly`

### POST `/api/auth/logout`

Auth:
- cookie de session requis

Body:

```json
{}
```

### GET `/api/auth/me`

Auth:
- cookie de session requis

Body:

```json
{}
```

### PATCH `/api/auth/me`

Auth:
- cookie de session requis

Body:

```json
{
  "firstName": "Jean",
  "lastName": "Mukendi",
  "email": "jean@example.com",
  "phone": "+243900000000",
  "preferredChannel": "EMAIL"
}
```

Notes:
- permet a l utilisateur connecte de mettre a jour ses propres informations
- `email` ou `phone` doit toujours rester renseigne
- `preferredChannel` accepte `EMAIL` ou `SMS`

### PATCH `/api/auth/me/avatar`

Auth:
- cookie de session requis

Body:
- `multipart/form-data`
- champ fichier: `file`

Notes:
- permet a l utilisateur connecte de changer sa photo de profil
- accepte uniquement une image
- taille max recommandee: `2 MB`

### POST `/api/auth/change-password`

Auth:
- cookie de session requis

Body:

```json
{
  "currentPassword": "ChangeMe123!",
  "newPassword": "NewPassword123"
}
```

Notes:
- utilise ce endpoint pour le changement de mot de passe au premier login

### POST `/api/auth/forgot-password`

Body:

```json
{
  "identifier": "jean@example.com",
  "channel": "EMAIL"
}
```

Notes:
- `identifier` peut etre un email ou un numero de telephone
- `channel` accepte `EMAIL` ou `SMS`

### POST `/api/auth/reset-password`

Body:

```json
{
  "identifier": "jean@example.com",
  "code": "123456",
  "newPassword": "NewPassword123"
}
```

Notes:
- `code` est le code envoye par email ou SMS

## Admin

Tous les endpoints ci-dessous demandent:
- une session active
- un mot de passe deja change si l utilisateur etait en first login
- des permissions adaptees selon le endpoint

### GET `/api/admin/access/options`

Body:

```json
{}
```

Retourne:
- les roles
- les permissions
- les modules applicatifs

### GET `/api/admin/users`

Body:

```json
{}
```

### POST `/api/admin/users`

Body:

```json
{
  "firstName": "Alice",
  "lastName": "Kasongo",
  "email": "alice@example.com",
  "phone": "+243900000001",
  "roleCode": "ADMIN",
  "permissionCodes": [
    "user.read",
    "module.read"
  ],
  "moduleCodes": [
    "TALENT_ACQUISITION",
    "TIME_ATTENDANCE"
  ],
  "preferredChannel": "EMAIL"
}
```

Notes:
- `firstName`, `lastName`, `roleCode` sont obligatoires
- `email` ou `phone` est obligatoire
- genere un mot de passe temporaire et l envoie via Brevo

### PATCH `/api/admin/users/:userId/access`

Body:

```json
{
  "roleCode": "EMPLOYEE",
  "permissionCodes": [
    "profile.read",
    "profile.update"
  ],
  "moduleCodes": [
    "TALENT_ACQUISITION"
  ]
}
```

Notes:
- permet de changer le role
- permet d attribuer des permissions directes
- permet d attribuer les modules accessibles

### PATCH `/api/admin/users/:userId/status`

Body:

```json
{
  "status": "SUSPENDED"
}
```

Valeurs possibles:
- `ACTIVE`
- `SUSPENDED`
- `ARCHIVED`

### GET `/api/admin/super-admin/ping`

Body:

```json
{}
```

Notes:
- reserve au role `SUPER_ADMIN`

## Rappel de modules applicatifs

Codes modules disponibles:
- `TALENT_ACQUISITION`
- `DOCUMENT_ADMIN`
- `PAYROLL_COMPENSATION`
- `TIME_ATTENDANCE`
- `LEAVE_WORKFLOW`
- `PERFORMANCE_360`

## Performance 360 et KPI

Tous les endpoints ci-dessous demandent :
- une session active
- le module `PERFORMANCE_360`
- les permissions metier adequates

### GET `/api/performance/dashboard`

Body :

```json
{}
```

Retourne :
- un resume des campagnes, objectifs, evaluations, feedbacks et plans de developpement
- une distribution des scores `A` a `E`

### GET `/api/performance/options`

Body :

```json
{}
```

Retourne :
- `cycles`
- `employees`
- `managers`
- `directions`
- les listes de statuts et types du module

### GET `/api/performance/cycles`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `status`
- valeurs possibles pour `status` : `DRAFT`, `ACTIVE`, `CLOSED`, `ARCHIVED`

### POST `/api/performance/cycles`

Body :

```json
{
  "code": "PERF-2026",
  "name": "Campagne annuelle 2026",
  "description": "Cycle annuel avec autoevaluation, revue manager et calibration",
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-12-31T23:59:59.000Z",
  "status": "ACTIVE"
}
```

### PATCH `/api/performance/cycles/:cycleId`

Body :

```json
{
  "name": "Campagne annuelle 2026 - calibration",
  "status": "ACTIVE",
  "description": "Mise a jour du cadrage et du calendrier"
}
```

### DELETE `/api/performance/cycles/:cycleId`

Body :

```json
{}
```

### GET `/api/performance/goals`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `cycleId`, `employeeId`, `status`
- valeurs possibles pour `status` : `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED`

### POST `/api/performance/goals`

Body :

```json
{
  "employeeId": "cm_employee_id",
  "cycleId": "cm_cycle_id",
  "title": "Clore les comptes mensuels en 3 jours ou moins",
  "description": "Objectif SMART rattache a la cloture finance",
  "weight": 25,
  "progressPercent": 0,
  "targetValue": "<= 3 jours",
  "achievedValue": "",
  "dueDate": "2026-12-31T00:00:00.000Z",
  "status": "NOT_STARTED"
}
```

### PATCH `/api/performance/goals/:goalId`

Body :

```json
{
  "progressPercent": 62,
  "achievedValue": "3,8 jours",
  "status": "IN_PROGRESS",
  "note": "Point de vigilance sur les delais fournisseurs"
}
```

### DELETE `/api/performance/goals/:goalId`

Body :

```json
{}
```

### GET `/api/performance/kpis`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `status`

### POST `/api/performance/kpis`

Body :

```json
{
  "code": "KPI-SLA-AGENCE",
  "name": "Taux de resolution SLA agence",
  "scope": "TEAM",
  "directionName": "Operations",
  "managerEmployeeId": "cm_employee_manager",
  "metricType": "PERCENTAGE",
  "unit": "%",
  "defaultWeight": 15,
  "ownerLabel": "Direction operations",
  "status": "Active",
  "description": "Mesure le pourcentage de dossiers traites dans le SLA cible"
}
```

### PATCH `/api/performance/kpis/:kpiDefinitionId`

Body :

```json
{
  "name": "Taux de resolution SLA agence",
  "defaultWeight": 20,
  "status": "Active"
}
```

### DELETE `/api/performance/kpis/:kpiDefinitionId`

Body :

```json
{}
```

### GET `/api/performance/kpi-assignments`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `cycleId`, `employeeId`, `status`

### POST `/api/performance/kpi-assignments`

Body :

```json
{
  "cycleId": "cm_cycle_id",
  "employeeId": "cm_employee_id",
  "managerEmployeeId": "cm_employee_manager",
  "summary": "Portefeuille KPI du semestre 2",
  "assignedKpis": 4,
  "totalWeight": 100,
  "completionPercent": 0,
  "riskLevel": "Medium",
  "status": "Active"
}
```

### PATCH `/api/performance/kpi-assignments/:assignmentId`

Body :

```json
{
  "completionPercent": 35,
  "riskLevel": "High",
  "summary": "Portefeuille a renforcer sur le mois en cours"
}
```

### DELETE `/api/performance/kpi-assignments/:assignmentId`

Body :

```json
{}
```

### GET `/api/performance/check-ins`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `goalId`, `status`

### POST `/api/performance/check-ins`

Body :

```json
{
  "goalId": "cm_goal_id",
  "title": "Revue mensuelle SLA agence",
  "checkInDate": "2026-07-05T09:00:00.000Z",
  "progressPercent": 45,
  "blocker": "Surcharge sur les dossiers complexes",
  "supportNeeded": "Renfort ponctuel sur l equipe",
  "nextActions": "Redistribuer les portefeuilles et suivre hebdomadairement",
  "status": "Scheduled"
}
```

### PATCH `/api/performance/check-ins/:checkInId`

Body :

```json
{
  "progressPercent": 60,
  "blocker": "Retard sur les arbitrages",
  "nextActions": "Revue manager hebdomadaire",
  "status": "Done"
}
```

### DELETE `/api/performance/check-ins/:checkInId`

Body :

```json
{}
```

### GET `/api/performance/reviews`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `cycleId`, `revieweeEmployeeId`, `reviewerEmployeeId`, `reviewType`, `status`

Valeurs possibles pour `reviewType` :
- `SELF`
- `MANAGER`
- `PEER`
- `DIRECT_REPORT`
- `REVIEW_360`

Valeurs possibles pour `status` :
- `DRAFT`
- `SUBMITTED`
- `COMPLETED`
- `CANCELLED`

### POST `/api/performance/reviews`

Body :

```json
{
  "cycleId": "cm_cycle_id",
  "revieweeEmployeeId": "cm_employee_reviewee",
  "reviewerEmployeeId": "cm_employee_reviewer",
  "reviewType": "MANAGER",
  "status": "DRAFT",
  "overallScore": 84,
  "strengths": "Execution rigoureuse, sens du controle",
  "developmentAreas": "Presentation executive, mentoring",
  "comments": "Bon dossier en attente de calibration"
}
```

### PATCH `/api/performance/reviews/:reviewId`

Body :

```json
{
  "status": "SUBMITTED",
  "overallScore": 88,
  "comments": "Revue manager finalisee",
  "submittedAt": "2026-12-12T12:00:00.000Z"
}
```

### DELETE `/api/performance/reviews/:reviewId`

Body :

```json
{}
```

### GET `/api/performance/feedbacks`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `cycleId`, `toEmployeeId`, `feedbackType`

Valeurs possibles pour `feedbackType` :
- `PRAISE`
- `CONSTRUCTIVE`
- `COACHING`

### POST `/api/performance/feedbacks`

Body :

```json
{
  "cycleId": "cm_cycle_id",
  "fromEmployeeId": "cm_employee_author",
  "toEmployeeId": "cm_employee_receiver",
  "feedbackType": "COACHING",
  "title": "Point de coaching mensuel",
  "message": "Renforcer la preparation des memos avant revue",
  "rating": 4.5,
  "isAnonymous": false
}
```

### GET `/api/performance/trainings`

Body :

```json
{}
```

Notes :
- filtres query supportes : `page`, `limit`, `search`, `cycleId`, `employeeId`, `status`

Valeurs possibles pour `status` :
- `PLANNED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### POST `/api/performance/trainings`

Body :

```json
{
  "employeeId": "cm_employee_id",
  "cycleId": "cm_cycle_id",
  "title": "Formation memo de credit",
  "provider": "Academie RH",
  "startDate": "2026-06-15T08:00:00.000Z",
  "endDate": "2026-06-16T17:00:00.000Z",
  "status": "PLANNED",
  "hours": 14,
  "score": 0,
  "certificateUrl": "https://example.com/certificat.pdf",
  "notes": "Plan de developpement issu du PIP"
}
```

### PATCH `/api/performance/trainings/:trainingId`

Body :

```json
{
  "status": "COMPLETED",
  "score": 88,
  "notes": "Formation terminee avec validation manager"
}
```

### DELETE `/api/performance/trainings/:trainingId`

Body :

```json
{}
```

## Talent Acquisition et Onboarding

Tous les endpoints ci-dessous demandent:
- une session active
- le module `TALENT_ACQUISITION`
- les permissions metier adequates

### GET `/api/talent-acquisition/recruitment-requests`

Body:

```json
{}
```

### POST `/api/talent-acquisition/recruitment-requests`

Body:

```json
{
  "title": "Recrutement Comptable Senior",
  "departmentName": "Finance",
  "location": "Kinshasa",
  "employmentType": "CDI",
  "headcount": 2,
  "budgetAmount": 1500,
  "currency": "USD",
  "targetStartDate": "2026-05-15T00:00:00.000Z",
  "reason": "Renforcer l'equipe finance",
  "status": "SUBMITTED"
}
```

### PATCH `/api/talent-acquisition/recruitment-requests/:requestId/status`

Body:

```json
{
  "status": "APPROVED",
  "approvalComment": "Budget valide"
}
```

Valeurs possibles:
- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `CLOSED`

### GET `/api/talent-acquisition/job-postings`

Body:

```json
{}
```

### POST `/api/talent-acquisition/job-postings`

Body:

```json
{
  "recruitmentRequestId": "cm_request_id",
  "title": "Comptable Senior",
  "description": "Gestion comptable, clotures mensuelles et reporting",
  "departmentName": "Finance",
  "location": "Kinshasa",
  "employmentType": "CDI",
  "openings": 2,
  "status": "PUBLISHED",
  "recruiterId": "cm_user_recruiter",
  "hiringManagerId": "cm_user_manager"
}
```

### PATCH `/api/talent-acquisition/job-postings/:jobPostingId`

Body:

```json
{
  "title": "Comptable Senior Confirme",
  "description": "Mise a jour du descriptif de poste",
  "departmentName": "Finance",
  "location": "Kinshasa - Gombe",
  "employmentType": "CDI",
  "openings": 1,
  "status": "PAUSED",
  "recruiterId": "cm_user_recruiter",
  "hiringManagerId": "cm_user_manager"
}
```

### GET `/api/talent-acquisition/candidates`

Body:

```json
{}
```

### POST `/api/talent-acquisition/candidates`

Body:

```json
{
  "firstName": "Grace",
  "lastName": "Ilunga",
  "email": "grace.ilunga@example.com",
  "phone": "+243900000010",
  "source": "LINKEDIN",
  "resumeUrl": "https://example.com/cv/grace-ilunga.pdf",
  "summary": "Comptable avec 5 ans d'experience",
  "tags": ["finance", "sage", "taxes"]
}
```

### PATCH `/api/talent-acquisition/candidates/:candidateId`

Body:

```json
{
  "firstName": "Grace",
  "lastName": "Ilunga",
  "email": "grace.ilunga.updated@example.com",
  "phone": "+243900000011",
  "source": "REFERRAL",
  "resumeUrl": "https://example.com/cv/grace-ilunga-v2.pdf",
  "summary": "Profil shortlist",
  "tags": ["finance", "erp", "shortlist"]
}
```

### GET `/api/talent-acquisition/applications`

Body:

```json
{}
```

Notes:
- filtres query supportes: `jobPostingId`, `candidateId`, `stage`, `status`

### POST `/api/talent-acquisition/applications`

Body:

```json
{
  "jobPostingId": "cm_job_id",
  "candidateId": "cm_candidate_id",
  "stage": "APPLIED",
  "status": "ACTIVE",
  "score": 82.5,
  "notes": "CV tres pertinent"
}
```

### PATCH `/api/talent-acquisition/applications/:applicationId/stage`

Body:

```json
{
  "stage": "HR_INTERVIEW",
  "status": "ACTIVE",
  "score": 86,
  "notes": "Validee pour entretien RH"
}
```

Valeurs possibles pour `stage`:
- `APPLIED`
- `SCREENING`
- `TEST`
- `HR_INTERVIEW`
- `TECHNICAL_INTERVIEW`
- `MANAGER_INTERVIEW`
- `OFFER`
- `HIRED`
- `REJECTED`

Valeurs possibles pour `status`:
- `ACTIVE`
- `HIRED`
- `REJECTED`
- `WITHDRAWN`

### GET `/api/talent-acquisition/interviews`

Body:

```json
{}
```

Notes:
- filtres query supportes: `applicationId`, `status`

### POST `/api/talent-acquisition/interviews`

Body:

```json
{
  "applicationId": "cm_application_id",
  "interviewerId": "cm_user_id",
  "type": "HR",
  "status": "SCHEDULED",
  "scheduledAt": "2026-05-10T09:00:00.000Z",
  "location": "Salle RH 2",
  "meetingLink": "https://meet.example.com/interview",
  "feedback": "A renseigner apres l'entretien",
  "score": 0
}
```

Valeurs possibles pour `type`:
- `HR`
- `TECHNICAL`
- `MANAGERIAL`
- `FINAL`

Valeurs possibles pour `status`:
- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

### PATCH `/api/talent-acquisition/interviews/:interviewId`

Body:

```json
{
  "interviewerId": "cm_user_id",
  "type": "TECHNICAL",
  "status": "COMPLETED",
  "scheduledAt": "2026-05-10T09:00:00.000Z",
  "completedAt": "2026-05-10T10:00:00.000Z",
  "location": "Salle RH 2",
  "meetingLink": "https://meet.example.com/interview",
  "feedback": "Candidat recommande pour l'etape manageriale",
  "score": 88
}
```

### GET `/api/talent-acquisition/offers`

Body:

```json
{}
```

### POST `/api/talent-acquisition/offers`

Body:

```json
{
  "applicationId": "cm_application_id",
  "salaryAmount": 1800,
  "currency": "USD",
  "proposedStartDate": "2026-06-01T00:00:00.000Z",
  "status": "SENT",
  "notes": "Offre validee par la direction"
}
```

### PATCH `/api/talent-acquisition/offers/:offerId/status`

Body:

```json
{
  "status": "ACCEPTED",
  "notes": "Le candidat a accepte l'offre"
}
```

Valeurs possibles:
- `DRAFT`
- `SENT`
- `ACCEPTED`
- `REJECTED`
- `EXPIRED`

### GET `/api/talent-acquisition/onboarding-plans`

Body:

```json
{}
```

### POST `/api/talent-acquisition/onboarding-plans`

Body:

```json
{
  "applicationId": "cm_application_id",
  "status": "NOT_STARTED",
  "startDate": "2026-06-01T00:00:00.000Z",
  "departmentName": "Finance",
  "siteName": "Siege Gombe",
  "managerName": "Paul Kanku",
  "notes": "Integration sur 30 jours",
  "tasks": [
    {
      "title": "Preparer le poste de travail",
      "description": "PC, acces reseau et badge",
      "ownerLabel": "IT",
      "dueDate": "2026-05-29T00:00:00.000Z"
    }
  ]
}
```

Valeurs possibles pour `status`:
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### POST `/api/talent-acquisition/onboarding-plans/:planId/tasks`

Body:

```json
{
  "title": "Planifier la reunion d'accueil",
  "description": "Invitation manager et RH",
  "ownerLabel": "RH",
  "dueDate": "2026-05-30T00:00:00.000Z",
  "status": "TODO"
}
```

Valeurs possibles pour `status`:
- `TODO`
- `IN_PROGRESS`
- `DONE`
- `BLOCKED`

### PATCH `/api/talent-acquisition/onboarding-tasks/:taskId/status`

Body:

```json
{
  "status": "DONE"
}
```

### GET `/api/talent-acquisition/dashboard`

Body:

```json
{}
```

Retourne:
- volumes par statut des demandes de recrutement
- volumes par statut des offres de recrutement
- total candidats
- pipeline des candidatures
- statuts des offres d'embauche
- statuts d'onboarding
- candidatures recentes

### GET `/api/talent-acquisition/planning`

Body:

```json
{}
```

Retourne:
- `weeklyPlans`
- `pipelineSteps`
- `scorecardCriteria`
- `history`
- `summary`

### GET `/api/talent-acquisition/planning/history`

Body:

```json
{}
```

Notes:
- filtres query supportes: `entityType`, `entityId`, `limit`
- valeurs possibles pour `entityType`: `WEEKLY_PLAN`, `PIPELINE_STEP`, `SCORECARD_CRITERION`

### POST `/api/talent-acquisition/planning/weekly`

Body:

```json
{
  "weekLabel": "S1",
  "objective": "Cadrage du besoin",
  "keyActions": "Kick-off manager; validation budget; fiche de poste v1",
  "ownerLabel": "RH + Manager",
  "deliverable": "Demande validee",
  "kpiTarget": "SLA validation <= 3 jours",
  "status": "PLANNED",
  "orderIndex": 1
}
```

Valeurs possibles pour `status`:
- `PLANNED`
- `IN_PROGRESS`
- `DONE`
- `BLOCKED`
- `CANCELLED`

### PATCH `/api/talent-acquisition/planning/weekly/:weeklyPlanId`

Body:

```json
{
  "objective": "Preparation campagne",
  "status": "IN_PROGRESS",
  "orderIndex": 2
}
```

### DELETE `/api/talent-acquisition/planning/weekly/:weeklyPlanId`

Body:

```json
{}
```

### POST `/api/talent-acquisition/planning/pipeline`

Body:

```json
{
  "stepName": "Prequalification RH",
  "entryCriteria": "CV recevables",
  "exitCriteria": "Candidats shortlistes",
  "ownerLabel": "RH",
  "slaDays": 7,
  "orderIndex": 4,
  "isActive": true
}
```

### PATCH `/api/talent-acquisition/planning/pipeline/:pipelineStepId`

Body:

```json
{
  "ownerLabel": "RH Senior",
  "slaDays": 5,
  "isActive": true
}
```

### DELETE `/api/talent-acquisition/planning/pipeline/:pipelineStepId`

Body:

```json
{}
```

### POST `/api/talent-acquisition/planning/scorecard`

Body:

```json
{
  "criterion": "Competences techniques",
  "weight": 30,
  "notes": "Evaluation metier",
  "orderIndex": 1,
  "isActive": true
}
```

### PATCH `/api/talent-acquisition/planning/scorecard/:scorecardCriterionId`

Body:

```json
{
  "criterion": "Communication",
  "weight": 15,
  "notes": "Communication orale et ecrite",
  "isActive": true
}
```

### DELETE `/api/talent-acquisition/planning/scorecard/:scorecardCriterionId`

Body:

```json
{}
```

### GET `/api/talent-acquisition/documents`

Body:

```json
{}
```

Notes:
- filtres query supportes: `ownerType`, `candidateId`, `onboardingPlanId`, `category`

### POST `/api/talent-acquisition/documents/upload`

Content-Type:
- `multipart/form-data`

Champs attendus:
- `file`: fichier a televerser
- `ownerType`: `CANDIDATE` ou `ONBOARDING`
- `ownerId`: id du candidat ou du plan d'onboarding
- `title`: titre documentaire facultatif
- `category`: `CV`, `IDENTITY`, `DIPLOMA`, `CERTIFICATE`, `CONTRACT`, `OFFER_LETTER`, `OTHER`

Exemple de champs:

```text
file=<binary>
ownerType=CANDIDATE
ownerId=cm_candidate_id
title=CV Grace Ilunga
category=CV
```

Notes:
- les fichiers sont stockes localement et exposes via `/uploads/talent/<nom>`
