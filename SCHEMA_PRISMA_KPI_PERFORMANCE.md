# Schema Prisma propose pour le module KPI et gestion de performance

Ce document propose un schema cible pour integrer un module KPI et gestion de performance dans LESNORMESRH.

Il tient compte :
- du schema actuel dans [server/prisma/schema.prisma](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/prisma/schema.prisma:1189)
- de la convention collective lue dans le document SOFIBANQUE
- du besoin metier de gerer KPI, evaluation 360, calibration, PIP, gratifications, bonus, avancement et promotion

## 1. Constat sur l'existant

Le projet contient deja une premiere base :
- `PerformanceCycle`
- `PerformanceGoal`
- `PerformanceReview`
- `PerformanceFeedback`
- `EmployeeTraining`

Points positifs :
- un cycle existe deja
- des objectifs existent deja
- la revue et le feedback 360 ont deja une base
- la formation est deja reliee au cycle

Ecarts a corriger pour coller au besoin reel :
- pas de `tenantId` sur les entites performance
- pas de table de politique RH pour la notation A-E
- pas de catalogue KPI mutualisable
- pas de definition de poids et de methode de calcul suffisamment structurante
- pas de table de check-in mi-parcours
- pas de decomposition des revues par criteres notes
- pas de table de calibration
- pas de table de resultat final consolide
- pas de table PIP
- pas de table de recompense ou gratification
- pas de table de recommandation de promotion
- pas de table de recommandation de formation issue de la campagne

## 2. Principe de conception

Je recommande de ne pas jeter l'existant, mais de l'etendre.

Strategie :
- conserver `PerformanceCycle` comme notion de campagne
- conserver `PerformanceGoal` mais l'enrichir pour devenir un vrai objectif KPI
- conserver `PerformanceReview` comme conteneur de revue
- ajouter des tables filles pour les items notes, les check-ins, les calibrations et les consequences RH

## 3. Ajustements indispensables

### 3.1 Multi-tenant

Le module doit etre tenant-aware.

A ajouter :
- `tenantId` sur `Employee` si tu veux une isolation RH complete
- `tenantId` sur `PerformanceCycle`
- `tenantId` sur `PerformanceGoal`
- `tenantId` sur `PerformanceReview`
- `tenantId` sur `PerformanceFeedback`
- `tenantId` sur `EmployeeTraining`
- `tenantId` sur toutes les nouvelles tables du module

### 3.2 Lien avec la convention collective

Le schema doit permettre :
- une notation de `1 a 100`
- une conversion en notes `A, B, C, D, E`
- des consequences metier parametrables
- un PIP de `12 mois` pour note `D`
- un PIP urgent de `6 mois` renouvelable une fois pour note `E`
- une logique de gratification par coefficient
- une logique d'avancement / promotion / prime de merite

## 4. Enums proposes

```prisma
enum KpiScope {
  BANK
  DIVISION
  DEPARTMENT
  TEAM
  EMPLOYEE
}

enum KpiMetricType {
  PERCENTAGE
  CURRENCY
  NUMBER
  BOOLEAN
  TEXT
  SCORE
}

enum KpiAggregationMethod {
  SUM
  AVERAGE
  MAX
  MIN
  LAST_VALUE
  MANUAL
}

enum PerformanceCampaignType {
  ANNUAL
  SEMESTER
  QUARTERLY
  PROBATION
  PROMOTION_CONFIRMATION
}

enum PerformancePhase {
  GOAL_SETTING
  MID_YEAR_REVIEW
  SELF_REVIEW
  MANAGER_REVIEW
  PEER_REVIEW
  CALIBRATION
  FINALIZATION
  CLOSED
}

enum ScoreBandCode {
  A
  B
  C
  D
  E
}

enum ReviewActorType {
  SELF
  N1
  N2
  PEER
  DIRECT_REPORT
  HR
  COMMITTEE
}

enum ReviewItemType {
  KPI_RESULT
  COMPETENCY
  BEHAVIOR
  VALUES
  DISCIPLINE_ADJUSTMENT
}

enum CheckInStatus {
  SCHEDULED
  DONE
  MISSED
}

enum PIPStatus {
  DRAFT
  ACTIVE
  ON_TRACK
  AT_RISK
  COMPLETED
  FAILED
  CANCELLED
}

enum RewardType {
  GRATIFICATION
  PERFORMANCE_BONUS
  MERIT_PRIME
  GRADE_ADVANCEMENT
  PROMOTION
}

enum RewardStatus {
  DRAFT
  VALIDATED
  REJECTED
  PAID
}

enum PromotionDecisionStatus {
  PENDING
  ELIGIBLE
  IN_REVIEW
  APPROVED
  REJECTED
  CONFIRMED
}

enum TrainingRecommendationStatus {
  PLANNED
  APPROVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## 5. Extension des modeles existants

### 5.1 Employee

Recommandation :

```prisma
model Employee {
  id                 String   @id @default(cuid())
  tenantId           String
  // champs existants...
  tenant             Tenant   @relation(fields: [tenantId], references: [id])

  kpiAssignments     EmployeeKpiAssignment[]
  checkIns           PerformanceCheckIn[]
  finalResults       PerformanceResult[]
  improvementPlans   PerformanceImprovementPlan[] @relation("PipSubject")
  pipActionsOwned    PerformanceImprovementAction[] @relation("PipActionOwner")
  promotionCases     PromotionCase[] @relation("PromotionEmployee")

  @@index([tenantId, employmentStatus])
}
```

### 5.2 PerformanceCycle

Garder la table, mais l'etendre :

```prisma
model PerformanceCycle {
  id                    String                 @id @default(cuid())
  tenantId              String
  code                  String
  name                  String
  description           String?
  cycleType             PerformanceCampaignType @default(ANNUAL)
  year                  Int
  periodStart           DateTime
  periodEnd             DateTime
  phase                 PerformancePhase      @default(GOAL_SETTING)
  status                PerformanceCycleStatus @default(DRAFT)
  selfReviewOpensAt     DateTime?
  selfReviewClosesAt    DateTime?
  managerReviewOpensAt  DateTime?
  managerReviewClosesAt DateTime?
  calibrationAt         DateTime?
  finalizationAt        DateTime?
  policyId              String?
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt

  tenant                Tenant                @relation(fields: [tenantId], references: [id])
  policy                PerformancePolicy?    @relation(fields: [policyId], references: [id], onDelete: SetNull)
  goals                 PerformanceGoal[]
  reviews               PerformanceReview[]
  feedbacks             PerformanceFeedback[]
  trainings             EmployeeTraining[]
  participants          PerformanceParticipant[]
  results               PerformanceResult[]
  calibrations          PerformanceCalibration[]
  rewardDecisions       PerformanceRewardDecision[]
  promotionCases        PromotionCase[]

  @@unique([tenantId, code])
  @@index([tenantId, year, status])
}
```

### 5.3 PerformanceGoal

Elle doit devenir un objectif rattache soit a un KPI catalogue, soit a un objectif libre.

```prisma
model PerformanceGoal {
  id                   String           @id @default(cuid())
  tenantId             String
  employeeId           String
  cycleId              String
  kpiDefinitionId      String?
  title                String
  description          String?
  itemType             ReviewItemType   @default(KPI_RESULT)
  metricType           KpiMetricType    @default(NUMBER)
  aggregationMethod    KpiAggregationMethod @default(MANUAL)
  weight               Decimal          @db.Decimal(5, 2)
  targetValue          String?
  achievedValue        String?
  progressPercent      Decimal          @default(0) @db.Decimal(5, 2)
  dueDate              DateTime?
  status               GoalStatus       @default(NOT_STARTED)
  managerComment       String?
  employeeComment      String?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  tenant               Tenant           @relation(fields: [tenantId], references: [id])
  employee             Employee         @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  cycle                PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  kpiDefinition        KpiDefinition?   @relation(fields: [kpiDefinitionId], references: [id], onDelete: SetNull)
  checkIns             PerformanceCheckIn[]
  reviewItems          PerformanceReviewItem[]

  @@index([tenantId, cycleId, employeeId])
  @@index([tenantId, status])
}
```

### 5.4 PerformanceReview

Ajouter le score calcule, la note finale et la relation vers les lignes de revue.

```prisma
model PerformanceReview {
  id                   String           @id @default(cuid())
  tenantId             String
  cycleId              String
  revieweeEmployeeId   String
  reviewerEmployeeId   String
  reviewType           ReviewType
  actorType            ReviewActorType
  status               ReviewStatus     @default(DRAFT)
  normalizedScore      Decimal?         @db.Decimal(5, 2)
  scoreBand            ScoreBandCode?
  strengths            String?
  developmentAreas     String?
  comments             String?
  submittedAt          DateTime?
  completedAt          DateTime?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  tenant               Tenant           @relation(fields: [tenantId], references: [id])
  cycle                PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  reviewee             Employee         @relation("Reviewee", fields: [revieweeEmployeeId], references: [id], onDelete: Cascade)
  reviewer             Employee         @relation("Reviewer", fields: [reviewerEmployeeId], references: [id], onDelete: Restrict)
  items                PerformanceReviewItem[]

  @@unique([cycleId, revieweeEmployeeId, reviewerEmployeeId, reviewType])
  @@index([tenantId, cycleId, status])
}
```

## 6. Nouvelles tables centrales

### 6.1 Politique de performance

Permet de parametrer les regles de la convention par tenant.

```prisma
model PerformancePolicy {
  id                         String   @id @default(cuid())
  tenantId                   String
  code                       String
  name                       String
  description                String?
  requires360                Boolean  @default(true)
  requiresMidYearReview      Boolean  @default(true)
  pipDurationMonthsForD      Int      @default(12)
  pipDurationMonthsForE      Int      @default(6)
  pipRenewalLimitForE        Int      @default(1)
  promotionCreditPercent     Decimal? @db.Decimal(5, 2)
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  tenant                     Tenant   @relation(fields: [tenantId], references: [id])
  scoreBands                 PerformanceScoreBand[]
  cycles                     PerformanceCycle[]

  @@unique([tenantId, code])
}
```

### 6.2 Bandes de notation

```prisma
model PerformanceScoreBand {
  id                       String         @id @default(cuid())
  policyId                 String
  code                     ScoreBandCode
  minScore                 Decimal        @db.Decimal(5, 2)
  maxScore                 Decimal        @db.Decimal(5, 2)
  label                    String
  description              String?
  gratificationPercent     Decimal?       @db.Decimal(5, 2)
  meritPrimePercent        Decimal?       @db.Decimal(5, 2)
  gradeStepIncrement       Int            @default(0)
  requiresPip              Boolean        @default(false)
  allowsPromotionPriority  Boolean        @default(false)
  allowsTerminationTrack   Boolean        @default(false)
  sortOrder                Int            @default(0)

  policy                   PerformancePolicy @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@unique([policyId, code])
}
```

### 6.3 Catalogue KPI

```prisma
model KpiDefinition {
  id                   String               @id @default(cuid())
  tenantId             String
  code                 String
  name                 String
  description          String?
  scope                KpiScope
  metricType           KpiMetricType
  aggregationMethod    KpiAggregationMethod @default(MANUAL)
  unitLabel            String?
  defaultWeight        Decimal?             @db.Decimal(5, 2)
  ownerDepartmentId    String?
  isActive             Boolean              @default(true)
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  tenant               Tenant               @relation(fields: [tenantId], references: [id])
  goals                PerformanceGoal[]
  assignments          EmployeeKpiAssignment[]

  @@unique([tenantId, code])
  @@index([tenantId, scope, isActive])
}
```

### 6.4 Affectation des KPI

```prisma
model EmployeeKpiAssignment {
  id                   String        @id @default(cuid())
  tenantId             String
  employeeId           String
  cycleId              String
  kpiDefinitionId      String
  assignedByUserId     String?
  weight               Decimal       @db.Decimal(5, 2)
  targetValue          String?
  thresholdValue       String?
  stretchValue         String?
  dueDate              DateTime?
  notes                String?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  tenant               Tenant        @relation(fields: [tenantId], references: [id])
  employee             Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  cycle                PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  kpiDefinition        KpiDefinition @relation(fields: [kpiDefinitionId], references: [id], onDelete: Cascade)
  assignedBy           User?         @relation(fields: [assignedByUserId], references: [id], onDelete: SetNull)

  @@unique([cycleId, employeeId, kpiDefinitionId])
  @@index([tenantId, employeeId, cycleId])
}
```

### 6.5 Participants de campagne

```prisma
model PerformanceParticipant {
  id                   String        @id @default(cuid())
  tenantId             String
  cycleId              String
  employeeId           String
  managerEmployeeId    String?
  secondLevelManagerId String?
  isEligibleFor360     Boolean       @default(true)
  selfReviewSubmitted  Boolean       @default(false)
  managerReviewDone    Boolean       @default(false)
  finalScore           Decimal?      @db.Decimal(5, 2)
  finalBand            ScoreBandCode?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  tenant               Tenant        @relation(fields: [tenantId], references: [id])
  cycle                PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  employee             Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  manager              Employee?     @relation("PerformanceParticipantManager", fields: [managerEmployeeId], references: [id], onDelete: SetNull)
  secondLevelManager   Employee?     @relation("PerformanceParticipantN2", fields: [secondLevelManagerId], references: [id], onDelete: SetNull)

  @@unique([cycleId, employeeId])
  @@index([tenantId, cycleId])
}
```

### 6.6 Check-in mi-parcours

```prisma
model PerformanceCheckIn {
  id                   String         @id @default(cuid())
  tenantId             String
  cycleId              String
  goalId               String
  employeeId           String
  reviewerEmployeeId   String?
  checkInDate          DateTime
  status               CheckInStatus  @default(SCHEDULED)
  progressPercent      Decimal?       @db.Decimal(5, 2)
  currentValue         String?
  blocker              String?
  supportNeeded        String?
  nextActions          String?
  comment              String?
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt

  tenant               Tenant         @relation(fields: [tenantId], references: [id])
  cycle                PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  goal                 PerformanceGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)
  employee             Employee       @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  reviewer             Employee?      @relation("CheckInReviewer", fields: [reviewerEmployeeId], references: [id], onDelete: SetNull)

  @@index([tenantId, cycleId, employeeId])
}
```

### 6.7 Lignes de revue

```prisma
model PerformanceReviewItem {
  id                   String            @id @default(cuid())
  reviewId             String
  goalId               String?
  itemType             ReviewItemType
  title                String
  description          String?
  weight               Decimal?          @db.Decimal(5, 2)
  score                Decimal?          @db.Decimal(5, 2)
  maxScore             Decimal?          @db.Decimal(5, 2)
  comment              String?
  disciplinePenalty    Decimal?          @db.Decimal(5, 2)
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  review               PerformanceReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  goal                 PerformanceGoal?  @relation(fields: [goalId], references: [id], onDelete: SetNull)

  @@index([reviewId])
  @@index([goalId])
}
```

### 6.8 Resultat final consolide

```prisma
model PerformanceResult {
  id                       String         @id @default(cuid())
  tenantId                 String
  cycleId                  String
  employeeId               String
  finalScore               Decimal        @db.Decimal(5, 2)
  scoreBand                ScoreBandCode
  weightedKpiScore         Decimal?       @db.Decimal(5, 2)
  weightedCompetencyScore  Decimal?       @db.Decimal(5, 2)
  disciplinePenalty        Decimal?       @db.Decimal(5, 2)
  calibratedScore          Decimal?       @db.Decimal(5, 2)
  isPromotionEligible      Boolean        @default(false)
  isGradeAdvanceEligible   Boolean        @default(false)
  requiresPip              Boolean        @default(false)
  validatedAt              DateTime?
  validatedByUserId        String?
  createdAt                DateTime       @default(now())
  updatedAt                DateTime       @updatedAt

  tenant                   Tenant         @relation(fields: [tenantId], references: [id])
  cycle                    PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  employee                 Employee       @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  validatedBy              User?          @relation(fields: [validatedByUserId], references: [id], onDelete: SetNull)
  rewards                  PerformanceRewardDecision[]
  pipPlan                  PerformanceImprovementPlan?
  promotionCase            PromotionCase?

  @@unique([cycleId, employeeId])
  @@index([tenantId, scoreBand])
}
```

### 6.9 Calibration

```prisma
model PerformanceCalibration {
  id                   String         @id @default(cuid())
  tenantId             String
  cycleId              String
  employeeId           String
  proposedScore        Decimal?       @db.Decimal(5, 2)
  proposedBand         ScoreBandCode?
  calibratedScore      Decimal?       @db.Decimal(5, 2)
  calibratedBand       ScoreBandCode?
  decision             String?
  reason               String?
  validatedByUserId    String?
  validatedAt          DateTime?
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt

  tenant               Tenant         @relation(fields: [tenantId], references: [id])
  cycle                PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  employee             Employee       @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  validatedBy          User?          @relation(fields: [validatedByUserId], references: [id], onDelete: SetNull)

  @@unique([cycleId, employeeId])
  @@index([tenantId, cycleId])
}
```

### 6.10 PIP

```prisma
model PerformanceImprovementPlan {
  id                    String      @id @default(cuid())
  tenantId              String
  resultId              String      @unique
  employeeId            String
  cycleId               String
  status                PIPStatus   @default(DRAFT)
  reason                String?
  startDate             DateTime
  endDate               DateTime
  reviewFrequencyDays   Int?
  mentoringRequired     Boolean     @default(false)
  coachingRequired      Boolean     @default(false)
  renewalCount          Int         @default(0)
  outcomeSummary        String?
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  tenant                Tenant      @relation(fields: [tenantId], references: [id])
  result                PerformanceResult @relation(fields: [resultId], references: [id], onDelete: Cascade)
  employee              Employee    @relation("PipSubject", fields: [employeeId], references: [id], onDelete: Cascade)
  cycle                 PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  actions               PerformanceImprovementAction[]

  @@index([tenantId, employeeId, status])
}
```

```prisma
model PerformanceImprovementAction {
  id                  String      @id @default(cuid())
  pipPlanId           String
  ownerEmployeeId     String?
  title               String
  description         String?
  dueDate             DateTime?
  completedAt         DateTime?
  status              TrainingRecommendationStatus @default(PLANNED)
  evidenceNote        String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  pipPlan             PerformanceImprovementPlan @relation(fields: [pipPlanId], references: [id], onDelete: Cascade)
  owner               Employee?   @relation("PipActionOwner", fields: [ownerEmployeeId], references: [id], onDelete: SetNull)

  @@index([pipPlanId, status])
}
```

### 6.11 Recompenses et gratifications

```prisma
model PerformanceRewardDecision {
  id                    String        @id @default(cuid())
  tenantId              String
  resultId              String
  cycleId               String
  employeeId            String
  rewardType            RewardType
  status                RewardStatus  @default(DRAFT)
  basisScoreBand        ScoreBandCode?
  coefficientPercent    Decimal?      @db.Decimal(5, 2)
  amount                Decimal?      @db.Decimal(12, 2)
  currency              String?       @db.VarChar(10)
  notes                 String?
  approvedByUserId      String?
  approvedAt            DateTime?
  paidAt                DateTime?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  tenant                Tenant        @relation(fields: [tenantId], references: [id])
  result                PerformanceResult @relation(fields: [resultId], references: [id], onDelete: Cascade)
  cycle                 PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  employee              Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  approvedBy            User?         @relation(fields: [approvedByUserId], references: [id], onDelete: SetNull)

  @@index([tenantId, cycleId, rewardType, status])
}
```

### 6.12 Promotion

```prisma
model PromotionCase {
  id                         String                  @id @default(cuid())
  tenantId                   String
  cycleId                    String
  resultId                   String?                 @unique
  employeeId                 String
  currentGradeLevel          String?
  targetGradeLevel           String?
  currentPositionId          String?
  targetPositionId           String?
  promotionCreditPercent     Decimal?               @db.Decimal(5, 2)
  historicalScoreSummary     Json?
  status                     PromotionDecisionStatus @default(PENDING)
  commissionStartDate        DateTime?
  commissionEndDate          DateTime?
  confirmationReviewDueAt    DateTime?
  approvedByUserId           String?
  approvedAt                 DateTime?
  notes                      String?
  createdAt                  DateTime               @default(now())
  updatedAt                  DateTime               @updatedAt

  tenant                     Tenant                 @relation(fields: [tenantId], references: [id])
  cycle                      PerformanceCycle       @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  result                     PerformanceResult?     @relation(fields: [resultId], references: [id], onDelete: SetNull)
  employee                   Employee               @relation("PromotionEmployee", fields: [employeeId], references: [id], onDelete: Cascade)
  approvedBy                 User?                  @relation(fields: [approvedByUserId], references: [id], onDelete: SetNull)

  @@index([tenantId, cycleId, status])
}
```

## 7. Relations avec les modules existants

### Formations

`EmployeeTraining` doit pouvoir etre cree depuis :
- un PIP
- une recommandation post-evaluation
- le plan annuel de formation

Option simple :
- ajouter `improvementPlanId` et `resultId` a `EmployeeTraining`

### Paie

Les bonus et gratifications doivent pouvoir alimenter plus tard le module payroll.

Approche simple :
- `PerformanceRewardDecision` reste la source metier
- le module paie lit les decisions `VALIDATED` ou `PAID`

### Historique RH

Quand une promotion ou un avancement est valide :
- creer aussi une ligne dans `EmployeeEmploymentEvent`

## 8. Recommandation d'implementation dans ce repo

### Etape 1

Etendre l'existant sans casser :
- ajouter `tenantId` aux tables performance
- ajouter `PerformancePolicy`
- ajouter `PerformanceScoreBand`
- ajouter `KpiDefinition`
- ajouter `EmployeeKpiAssignment`
- ajouter `PerformanceCheckIn`
- ajouter `PerformanceReviewItem`
- ajouter `PerformanceResult`

### Etape 2

Ajouter les consequences RH :
- `PerformanceCalibration`
- `PerformanceImprovementPlan`
- `PerformanceImprovementAction`
- `PerformanceRewardDecision`
- `PromotionCase`

### Etape 3

Relier au reste du SI :
- sync avec payroll
- sync avec historique emploi
- sync avec training

## 9. Gaps critiques du schema actuel

Les tables actuelles sont utiles mais insuffisantes pour la convention collective.

Les plus gros manques sont :
- pas de parametrage des notes `A-E`
- pas de grille de gratification
- pas de prime de merite
- pas de suivi PIP
- pas de commission de calibration
- pas de gestion explicite des promotions
- pas de check-in mi-parcours
- pas de lignes de revue detaillees

## 10. Conclusion

Le schema actuel est une bonne base technique, mais pas encore un moteur RH de performance complet.

La bonne approche pour LESNORMESRH est :
- garder les modeles existants
- les enrichir
- ajouter les modeles de politique, notation, calibration, PIP et rewards
- faire de tout cela un module multi-tenant, paramétrable et compatible avec les conventions collectives de chaque client
