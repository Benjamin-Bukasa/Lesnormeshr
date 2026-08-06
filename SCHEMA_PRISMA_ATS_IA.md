# Schéma Prisma complet proposé - Module ATS + IA

Ce document propose le schéma Prisma cible pour transformer le recrutement actuel de `LESNORMESRH` en véritable module ATS enrichi par IA.

Il tient compte :
- des tables existantes de recrutement dans [server/prisma/schema.prisma](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/prisma/schema.prisma:357)
- des pages front déjà en place dans [RecruitmentPublication.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/RecruitmentPublication.jsx:1) et [RecruitmentSelectionInterviews.jsx](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/front-end/src/pages/RecruitmentSelectionInterviews.jsx:1)
- du besoin d'un ATS professionnel avec parsing CV, screening, tests, entretien structuré et recommandations IA traçables

## 1. Constat sur l'existant

Le projet contient déjà une base ATS utile :
- `RecruitmentRequest`
- `JobPosting`
- `Candidate`
- `Application`
- `Interview`
- `HiringOffer`
- `OnboardingPlan`
- `TalentDocument`

Points positifs :
- le pipeline recrutement existe déjà
- les candidatures sont reliées aux postes
- les entretiens et offres existent déjà
- le tenant est déjà en place
- le document CV peut déjà être stocké dans `TalentDocument`

Écarts à corriger pour un ATS moderne :
- pas de profil candidat structuré issu du CV
- pas de scorecard par poste
- pas de score détaillé par critère
- pas de tests et évaluations formalisés
- pas de correction structurée des réponses
- pas de recommandation IA traçable
- pas de séparation claire entre score métier et score IA
- pas de journal d'explication ni d'evidence associée au scoring

## 2. Principe de conception

Je recommande de ne pas remplacer l'existant, mais de l'étendre autour de `Candidate`, `Application`, `Interview` et `TalentDocument`.

Stratégie :
- conserver `JobPosting` comme référentiel de besoin
- conserver `Candidate` comme identité du candidat
- conserver `Application` comme dossier ATS principal
- conserver `Interview` comme étape humaine
- ajouter les briques de structuration, scoring, tests et IA

## 3. Enums proposés

```prisma
enum CandidateResumeStatus {
  PENDING
  PROCESSING
  PARSED
  FAILED
  REVIEW_REQUIRED
}

enum CandidateSkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum AtsDecisionStatus {
  TO_REVIEW
  SHORTLISTED
  HOLD
  REJECTED
  INTERVIEW_RECOMMENDED
  OFFER_RECOMMENDED
}

enum ScoreEvidenceSource {
  CV
  APPLICATION_FORM
  TEST
  INTERVIEW
  MANUAL
  AI_INFERENCE
}

enum AssessmentType {
  QCM
  WRITTEN_CASE
  PRACTICAL_CASE
  TECHNICAL
  PERSONALITY
  LANGUAGE
  CUSTOM
}

enum AssessmentStatus {
  DRAFT
  PUBLISHED
  ACTIVE
  CLOSED
  ARCHIVED
}

enum AssessmentSubmissionStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  SCORED
  REVIEWED
  CANCELLED
}

enum AssessmentQuestionType {
  SINGLE_CHOICE
  MULTI_CHOICE
  TRUE_FALSE
  SHORT_TEXT
  LONG_TEXT
  FILE_UPLOAD
  NUMERIC
}

enum InterviewCriterionType {
  TECHNICAL
  BEHAVIORAL
  CULTURE
  COMMUNICATION
  LEADERSHIP
  MOTIVATION
  CUSTOM
}

enum AiRunType {
  CV_PARSE
  CV_SUMMARY
  ATS_SCREENING
  TEST_SCORING
  INTERVIEW_QUESTION_GEN
  INTERVIEW_SUMMARY
  OFFER_RECOMMENDATION
}

enum AiRunStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum AiRecommendationType {
  SHORTLIST
  REVIEW
  REJECT
  INTERVIEW
  TEST
  OFFER
}

enum AiRecommendationStatus {
  PROPOSED
  ACCEPTED
  REJECTED
  EXPIRED
}
```

## 4. Ajustements sur les tables existantes

## 4.1 `JobPosting`

Je recommande d'ajouter :

```prisma
model JobPosting {
  ...
  screeningProfileId      String?
  scorecards              JobScorecard[]
  assessments             AssessmentCampaign[]
  applications            Application[]
}
```

Pourquoi :
- un poste doit porter ses critères d'évaluation ATS
- les tests doivent être rattachés au poste

## 4.2 `Candidate`

Je recommande d'ajouter :

```prisma
model Candidate {
  ...
  currentHeadline         String?
  linkedinUrl             String?
  portfolioUrl            String?
  city                    String?
  country                 String?
  yearsOfExperience       Decimal?                    @db.Decimal(5, 2)
  resumeProfiles          CandidateResumeProfile[]
  skills                  CandidateSkill[]
  experiences             CandidateExperience[]
  educations              CandidateEducation[]
  certifications          CandidateCertification[]
  aiRuns                  AiEvaluationRun[]
}
```

Pourquoi :
- garder une vue enrichie du candidat
- permettre un affichage ATS moderne

## 4.3 `Application`

Je recommande d'ajouter :

```prisma
model Application {
  ...
  atsStatus               AtsDecisionStatus           @default(TO_REVIEW)
  atsScore                Decimal?                    @db.Decimal(5, 2)
  cvScore                 Decimal?                    @db.Decimal(5, 2)
  testScore               Decimal?                    @db.Decimal(5, 2)
  interviewScore          Decimal?                    @db.Decimal(5, 2)
  finalScore              Decimal?                    @db.Decimal(5, 2)
  scoreCalculatedAt       DateTime?
  screening               ApplicationScreening?
  submissions             AssessmentSubmission[]
  interviewEvaluations    InterviewEvaluation[]
  aiRuns                  AiEvaluationRun[]
  recommendations         AiRecommendation[]
}
```

Pourquoi :
- distinguer le score pipeline existant d'un vrai score ATS détaillé

## 5. Modèles Prisma proposés

## 5.1 Profil CV structuré

```prisma
model CandidateResumeProfile {
  id                    String                 @id @default(cuid())
  tenantId              String
  candidateId           String
  documentId            String?
  status                CandidateResumeStatus  @default(PENDING)
  parsedFullName        String?
  parsedEmail           String?
  parsedPhone           String?
  parsedSummary         String?
  totalYearsExperience  Decimal?               @db.Decimal(5, 2)
  currentRole           String?
  currentEmployer       String?
  languages             String[]
  rawExtractionJson     Json?
  normalizedProfileJson Json?
  extractedAt           DateTime?
  reviewedAt            DateTime?
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt

  tenant                Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  candidate             Candidate              @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  document              TalentDocument?        @relation(fields: [documentId], references: [id], onDelete: SetNull)

  @@index([tenantId, candidateId, status])
  @@index([documentId])
}
```

## 5.2 Compétences candidat

```prisma
model CandidateSkill {
  id                 String              @id @default(cuid())
  tenantId           String
  candidateId        String
  name               String
  category           String?
  level              CandidateSkillLevel?
  yearsExperience    Decimal?            @db.Decimal(5, 2)
  sourceLabel        String?
  isAiExtracted      Boolean             @default(false)
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  tenant             Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  candidate          Candidate           @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([tenantId, candidateId])
  @@index([tenantId, name])
}
```

## 5.3 Expériences candidat

```prisma
model CandidateExperience {
  id                 String      @id @default(cuid())
  tenantId           String
  candidateId        String
  companyName        String
  jobTitle           String
  startDate          DateTime?
  endDate            DateTime?
  isCurrent          Boolean     @default(false)
  durationMonths     Int?
  description        String?
  industry           String?
  location           String?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  tenant             Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  candidate          Candidate   @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([tenantId, candidateId, startDate])
}
```

## 5.4 Études candidat

```prisma
model CandidateEducation {
  id                 String      @id @default(cuid())
  tenantId           String
  candidateId        String
  institution        String
  degree             String?
  fieldOfStudy       String?
  startDate          DateTime?
  endDate            DateTime?
  levelLabel         String?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  tenant             Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  candidate          Candidate   @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([tenantId, candidateId])
}
```

## 5.5 Certifications candidat

```prisma
model CandidateCertification {
  id                 String      @id @default(cuid())
  tenantId           String
  candidateId        String
  name               String
  issuer             String?
  issuedAt           DateTime?
  expiresAt          DateTime?
  credentialCode     String?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  tenant             Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  candidate          Candidate   @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([tenantId, candidateId])
}
```

## 5.6 Scorecard par poste

```prisma
model JobScorecard {
  id                 String      @id @default(cuid())
  tenantId           String
  jobPostingId       String
  code               String
  name               String
  description        String?
  isDefault          Boolean     @default(true)
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  tenant             Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  jobPosting         JobPosting  @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  criteria           JobScorecardCriterion[]
  screenings         ApplicationScreening[]

  @@unique([tenantId, jobPostingId, code])
  @@index([tenantId, jobPostingId])
}
```

## 5.7 Critères de scorecard

```prisma
model JobScorecardCriterion {
  id                 String               @id @default(cuid())
  tenantId           String
  scorecardId        String
  code               String
  label              String
  description        String?
  weight             Decimal              @db.Decimal(5, 2)
  minimumScore       Decimal?             @db.Decimal(5, 2)
  knockout           Boolean              @default(false)
  evidenceSource     ScoreEvidenceSource  @default(CV)
  orderIndex         Int                  @default(0)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  tenant             Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  scorecard          JobScorecard         @relation(fields: [scorecardId], references: [id], onDelete: Cascade)
  scoringItems       ApplicationScreeningItem[]
  interviewItems     InterviewEvaluationItem[]

  @@unique([scorecardId, code])
  @@index([tenantId, scorecardId, orderIndex])
}
```

## 5.8 Screening ATS par candidature

```prisma
model ApplicationScreening {
  id                    String           @id @default(cuid())
  tenantId              String
  applicationId         String           @unique
  scorecardId           String?
  eligibilityPassed     Boolean          @default(true)
  knockoutReason        String?
  overallScore          Decimal?         @db.Decimal(5, 2)
  confidenceScore       Decimal?         @db.Decimal(5, 2)
  finalDecision         AtsDecisionStatus @default(TO_REVIEW)
  humanDecision         AtsDecisionStatus?
  humanDecisionAt       DateTime?
  notes                 String?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  tenant                Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  application           Application      @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  scorecard             JobScorecard?    @relation(fields: [scorecardId], references: [id], onDelete: SetNull)
  items                 ApplicationScreeningItem[]

  @@index([tenantId, finalDecision])
  @@index([tenantId, overallScore])
}
```

## 5.9 Détail du screening par critère

```prisma
model ApplicationScreeningItem {
  id                    String                    @id @default(cuid())
  tenantId              String
  screeningId           String
  criterionId           String?
  label                 String
  weight                Decimal?                  @db.Decimal(5, 2)
  rawScore              Decimal?                  @db.Decimal(5, 2)
  weightedScore         Decimal?                  @db.Decimal(5, 2)
  rationale             String?
  evidenceSource        ScoreEvidenceSource       @default(CV)
  evidenceSnippet       String?
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt

  tenant                Tenant                    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  screening             ApplicationScreening      @relation(fields: [screeningId], references: [id], onDelete: Cascade)
  criterion             JobScorecardCriterion?    @relation(fields: [criterionId], references: [id], onDelete: SetNull)

  @@index([tenantId, screeningId])
  @@index([criterionId])
}
```

## 5.10 Campagnes de tests

```prisma
model AssessmentCampaign {
  id                 String            @id @default(cuid())
  tenantId           String
  jobPostingId       String
  code               String
  title              String
  description        String?
  type               AssessmentType
  status             AssessmentStatus  @default(DRAFT)
  durationMinutes    Int?
  maxScore           Decimal?          @db.Decimal(6, 2)
  passingScore       Decimal?          @db.Decimal(6, 2)
  instructions       String?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  tenant             Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  jobPosting         JobPosting        @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  questions          AssessmentQuestion[]
  submissions        AssessmentSubmission[]

  @@unique([tenantId, jobPostingId, code])
  @@index([tenantId, jobPostingId, status])
}
```

## 5.11 Questions de test

```prisma
model AssessmentQuestion {
  id                 String                   @id @default(cuid())
  tenantId           String
  campaignId         String
  code               String
  type               AssessmentQuestionType
  prompt             String
  helpText           String?
  weight             Decimal?                 @db.Decimal(5, 2)
  maxScore           Decimal?                 @db.Decimal(6, 2)
  expectedAnswerJson Json?
  rubricJson         Json?
  orderIndex         Int                      @default(0)
  createdAt          DateTime                 @default(now())
  updatedAt          DateTime                 @updatedAt

  tenant             Tenant                   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  campaign           AssessmentCampaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  scoreItems         AssessmentScoreItem[]

  @@unique([campaignId, code])
  @@index([tenantId, campaignId, orderIndex])
}
```

## 5.12 Soumission de test

```prisma
model AssessmentSubmission {
  id                 String                     @id @default(cuid())
  tenantId           String
  campaignId         String
  applicationId      String
  status             AssessmentSubmissionStatus @default(NOT_STARTED)
  startedAt          DateTime?
  submittedAt        DateTime?
  reviewedAt         DateTime?
  rawAnswersJson     Json?
  totalScore         Decimal?                   @db.Decimal(6, 2)
  aiScore            Decimal?                   @db.Decimal(6, 2)
  humanScore         Decimal?                   @db.Decimal(6, 2)
  notes              String?
  createdAt          DateTime                   @default(now())
  updatedAt          DateTime                   @updatedAt

  tenant             Tenant                     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  campaign           AssessmentCampaign         @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  application        Application                @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  scoreItems         AssessmentScoreItem[]
  aiRuns             AiEvaluationRun[]

  @@unique([campaignId, applicationId])
  @@index([tenantId, applicationId, status])
}
```

## 5.13 Score détaillé de test

```prisma
model AssessmentScoreItem {
  id                 String               @id @default(cuid())
  tenantId           String
  submissionId       String
  questionId         String
  rawAnswerText      String?
  rawAnswerJson      Json?
  autoScore          Decimal?             @db.Decimal(6, 2)
  aiScore            Decimal?             @db.Decimal(6, 2)
  humanScore         Decimal?             @db.Decimal(6, 2)
  finalScore         Decimal?             @db.Decimal(6, 2)
  correctionNotes    String?
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  tenant             Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  submission         AssessmentSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  question           AssessmentQuestion   @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([tenantId, submissionId])
  @@index([questionId])
}
```

## 5.14 Scorecard entretien

```prisma
model InterviewScorecard {
  id                 String                 @id @default(cuid())
  tenantId           String
  jobPostingId       String
  code               String
  title              String
  description        String?
  createdAt          DateTime               @default(now())
  updatedAt          DateTime               @updatedAt

  tenant             Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  jobPosting         JobPosting             @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  criteria           InterviewScorecardCriterion[]
  evaluations        InterviewEvaluation[]

  @@unique([tenantId, jobPostingId, code])
}
```

## 5.15 Critères d'entretien

```prisma
model InterviewScorecardCriterion {
  id                 String                 @id @default(cuid())
  tenantId           String
  scorecardId        String
  code               String
  label              String
  type               InterviewCriterionType
  weight             Decimal?               @db.Decimal(5, 2)
  description        String?
  orderIndex         Int                    @default(0)
  createdAt          DateTime               @default(now())
  updatedAt          DateTime               @updatedAt

  tenant             Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  scorecard          InterviewScorecard     @relation(fields: [scorecardId], references: [id], onDelete: Cascade)
  evaluationItems    InterviewEvaluationItem[]

  @@unique([scorecardId, code])
  @@index([tenantId, scorecardId, orderIndex])
}
```

## 5.16 Évaluation d'entretien

```prisma
model InterviewEvaluation {
  id                 String                    @id @default(cuid())
  tenantId           String
  interviewId        String                    @unique
  applicationId      String
  scorecardId        String?
  evaluatorId        String?
  totalScore         Decimal?                  @db.Decimal(6, 2)
  recommendation     AtsDecisionStatus?
  summary            String?
  createdAt          DateTime                  @default(now())
  updatedAt          DateTime                  @updatedAt

  tenant             Tenant                    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  interview          Interview                 @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  application        Application               @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  scorecard          InterviewScorecard?       @relation(fields: [scorecardId], references: [id], onDelete: SetNull)
  evaluator          User?                     @relation(fields: [evaluatorId], references: [id], onDelete: SetNull)
  items              InterviewEvaluationItem[]

  @@index([tenantId, applicationId])
}
```

## 5.17 Détail notation entretien

```prisma
model InterviewEvaluationItem {
  id                 String                       @id @default(cuid())
  tenantId           String
  evaluationId       String
  criterionId        String?
  label              String
  rawScore           Decimal?                     @db.Decimal(6, 2)
  weightedScore      Decimal?                     @db.Decimal(6, 2)
  comment            String?
  createdAt          DateTime                     @default(now())
  updatedAt          DateTime                     @updatedAt

  tenant             Tenant                       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  evaluation         InterviewEvaluation          @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  criterion          InterviewScorecardCriterion? @relation(fields: [criterionId], references: [id], onDelete: SetNull)

  @@index([tenantId, evaluationId])
}
```

## 5.18 Run IA

```prisma
model AiEvaluationRun {
  id                  String               @id @default(cuid())
  tenantId            String
  candidateId         String?
  applicationId       String?
  submissionId        String?
  runType             AiRunType
  status              AiRunStatus          @default(PENDING)
  modelName           String?
  promptVersion       String?
  inputSummary        String?
  outputJson          Json?
  refusalReason       String?
  startedAt           DateTime?
  completedAt         DateTime?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  tenant              Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  candidate           Candidate?           @relation(fields: [candidateId], references: [id], onDelete: SetNull)
  application         Application?         @relation(fields: [applicationId], references: [id], onDelete: SetNull)
  submission          AssessmentSubmission? @relation(fields: [submissionId], references: [id], onDelete: SetNull)
  evidences           AiEvaluationEvidence[]
  recommendations     AiRecommendation[]

  @@index([tenantId, runType, status])
  @@index([tenantId, applicationId, createdAt])
}
```

## 5.19 Evidence IA

```prisma
model AiEvaluationEvidence {
  id                  String              @id @default(cuid())
  tenantId            String
  runId               String
  sourceType          ScoreEvidenceSource
  sourceLabel         String?
  sourceDocumentId    String?
  snippet             String?
  metadataJson        Json?
  createdAt           DateTime            @default(now())

  tenant              Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  run                 AiEvaluationRun     @relation(fields: [runId], references: [id], onDelete: Cascade)
  sourceDocument      TalentDocument?     @relation(fields: [sourceDocumentId], references: [id], onDelete: SetNull)

  @@index([tenantId, runId])
}
```

## 5.20 Recommandation IA

```prisma
model AiRecommendation {
  id                  String                 @id @default(cuid())
  tenantId            String
  runId               String?
  applicationId       String
  type                AiRecommendationType
  status              AiRecommendationStatus @default(PROPOSED)
  score               Decimal?               @db.Decimal(6, 2)
  title               String
  explanation         String?
  decisionRationale   String?
  acceptedById        String?
  acceptedAt          DateTime?
  createdAt           DateTime               @default(now())
  updatedAt           DateTime               @updatedAt

  tenant              Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  run                 AiEvaluationRun?       @relation(fields: [runId], references: [id], onDelete: SetNull)
  application         Application            @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  acceptedBy          User?                  @relation(fields: [acceptedById], references: [id], onDelete: SetNull)

  @@index([tenantId, applicationId, type, status])
}
```

## 6. Relations à ajouter sur `Tenant`

```prisma
model Tenant {
  ...
  candidateResumeProfiles   CandidateResumeProfile[]
  candidateSkills           CandidateSkill[]
  candidateExperiences      CandidateExperience[]
  candidateEducations       CandidateEducation[]
  candidateCertifications   CandidateCertification[]
  jobScorecards             JobScorecard[]
  jobScorecardCriteria      JobScorecardCriterion[]
  applicationScreenings     ApplicationScreening[]
  applicationScreeningItems ApplicationScreeningItem[]
  assessmentCampaigns       AssessmentCampaign[]
  assessmentQuestions       AssessmentQuestion[]
  assessmentSubmissions     AssessmentSubmission[]
  assessmentScoreItems      AssessmentScoreItem[]
  interviewScorecards       InterviewScorecard[]
  interviewScorecardCriteria InterviewScorecardCriterion[]
  interviewEvaluations      InterviewEvaluation[]
  interviewEvaluationItems  InterviewEvaluationItem[]
  aiEvaluationRuns          AiEvaluationRun[]
  aiEvaluationEvidences     AiEvaluationEvidence[]
  aiRecommendations         AiRecommendation[]
}
```

## 7. Flux métier recommandés

## 7.1 Parsing CV

1. upload du CV dans `TalentDocument`
2. création d'un `AiEvaluationRun` de type `CV_PARSE`
3. sortie IA structurée vers `CandidateResumeProfile`
4. alimentation des tables :
- `CandidateSkill`
- `CandidateExperience`
- `CandidateEducation`
- `CandidateCertification`

## 7.2 Screening ATS

1. ouverture d'une `Application`
2. rattachement à une `JobScorecard`
3. calcul ou génération de `ApplicationScreening`
4. création des `ApplicationScreeningItem`
5. proposition de décision IA dans `AiRecommendation`

## 7.3 Tests

1. définition des tests dans `AssessmentCampaign`
2. questions dans `AssessmentQuestion`
3. copie candidat dans `AssessmentSubmission`
4. correction détaillée dans `AssessmentScoreItem`
5. remontée du score dans `Application`

## 7.4 Entretien

1. le recruteur planifie `Interview`
2. la grille métier vient de `InterviewScorecard`
3. la notation est enregistrée dans `InterviewEvaluation`
4. les détails sont dans `InterviewEvaluationItem`

## 7.5 Recommandation finale

Le score final peut être composé de :
- CV : `30 %`
- test : `30 %`
- entretien : `40 %`

Mais la pondération doit rester paramétrable par poste.

## 8. Recommandation finale

Je recommande de déployer ce module en 3 vagues :

### Vague 1
- parsing CV
- scorecard poste
- screening candidature

### Vague 2
- tests et correction
- shortlist IA
- rapport recruteur

### Vague 3
- génération des questions d'entretien
- scoring d'entretien complet
- analytics qualité du recrutement

La suite logique après ce document est le plan technique détaillé d'implémentation backend/front.
