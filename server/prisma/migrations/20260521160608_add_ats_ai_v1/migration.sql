-- CreateEnum
CREATE TYPE "CandidateResumeStatus" AS ENUM ('PENDING', 'PROCESSING', 'PARSED', 'FAILED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "CandidateSkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "AtsDecisionStatus" AS ENUM ('TO_REVIEW', 'SHORTLISTED', 'HOLD', 'REJECTED', 'INTERVIEW_RECOMMENDED', 'OFFER_RECOMMENDED');

-- CreateEnum
CREATE TYPE "ScoreEvidenceSource" AS ENUM ('CV', 'APPLICATION_FORM', 'TEST', 'INTERVIEW', 'MANUAL', 'AI_INFERENCE');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('QCM', 'WRITTEN_CASE', 'PRACTICAL_CASE', 'TECHNICAL', 'PERSONALITY', 'LANGUAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentSubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'SCORED', 'REVIEWED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssessmentQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTI_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT', 'LONG_TEXT', 'FILE_UPLOAD', 'NUMERIC');

-- CreateEnum
CREATE TYPE "InterviewCriterionType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'CULTURE', 'COMMUNICATION', 'LEADERSHIP', 'MOTIVATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AiRunType" AS ENUM ('CV_PARSE', 'CV_SUMMARY', 'ATS_SCREENING', 'TEST_SCORING', 'INTERVIEW_QUESTION_GEN', 'INTERVIEW_SUMMARY', 'OFFER_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiRecommendationType" AS ENUM ('SHORTLIST', 'REVIEW', 'REJECT', 'INTERVIEW', 'TEST', 'OFFER');

-- CreateEnum
CREATE TYPE "AiRecommendationStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "atsScore" DECIMAL(5,2),
ADD COLUMN     "atsStatus" "AtsDecisionStatus" NOT NULL DEFAULT 'TO_REVIEW',
ADD COLUMN     "cvScore" DECIMAL(5,2),
ADD COLUMN     "finalScore" DECIMAL(5,2),
ADD COLUMN     "interviewScore" DECIMAL(5,2),
ADD COLUMN     "scoreCalculatedAt" TIMESTAMP(3),
ADD COLUMN     "testScore" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currentHeadline" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "portfolioUrl" TEXT,
ADD COLUMN     "yearsOfExperience" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "CandidateResumeProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "documentId" TEXT,
    "status" "CandidateResumeStatus" NOT NULL DEFAULT 'PENDING',
    "parsedFullName" TEXT,
    "parsedEmail" TEXT,
    "parsedPhone" TEXT,
    "parsedSummary" TEXT,
    "totalYearsExperience" DECIMAL(5,2),
    "currentRole" TEXT,
    "currentEmployer" TEXT,
    "languages" TEXT[],
    "rawExtractionJson" JSONB,
    "normalizedProfileJson" JSONB,
    "extractedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateResumeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level" "CandidateSkillLevel",
    "yearsExperience" DECIMAL(5,2),
    "sourceLabel" TEXT,
    "isAiExtracted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateExperience" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "durationMonths" INTEGER,
    "description" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEducation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "levelLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateCertification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "credentialCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobScorecard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobScorecardCriterion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scorecardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL,
    "minimumScore" DECIMAL(5,2),
    "knockout" BOOLEAN NOT NULL DEFAULT false,
    "evidenceSource" "ScoreEvidenceSource" NOT NULL DEFAULT 'CV',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobScorecardCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationScreening" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scorecardId" TEXT,
    "eligibilityPassed" BOOLEAN NOT NULL DEFAULT true,
    "knockoutReason" TEXT,
    "overallScore" DECIMAL(5,2),
    "confidenceScore" DECIMAL(5,2),
    "finalDecision" "AtsDecisionStatus" NOT NULL DEFAULT 'TO_REVIEW',
    "humanDecision" "AtsDecisionStatus",
    "humanDecisionAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationScreeningItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "screeningId" TEXT NOT NULL,
    "criterionId" TEXT,
    "label" TEXT NOT NULL,
    "weight" DECIMAL(5,2),
    "rawScore" DECIMAL(5,2),
    "weightedScore" DECIMAL(5,2),
    "rationale" TEXT,
    "evidenceSource" "ScoreEvidenceSource" NOT NULL DEFAULT 'CV',
    "evidenceSnippet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationScreeningItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMinutes" INTEGER,
    "maxScore" DECIMAL(6,2),
    "passingScore" DECIMAL(6,2),
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "AssessmentQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "helpText" TEXT,
    "weight" DECIMAL(5,2),
    "maxScore" DECIMAL(6,2),
    "expectedAnswerJson" JSONB,
    "rubricJson" JSONB,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "AssessmentSubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "rawAnswersJson" JSONB,
    "totalScore" DECIMAL(6,2),
    "aiScore" DECIMAL(6,2),
    "humanScore" DECIMAL(6,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScoreItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rawAnswerText" TEXT,
    "rawAnswerJson" JSONB,
    "autoScore" DECIMAL(6,2),
    "aiScore" DECIMAL(6,2),
    "humanScore" DECIMAL(6,2),
    "finalScore" DECIMAL(6,2),
    "correctionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentScoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewScorecard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewScorecardCriterion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scorecardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "InterviewCriterionType" NOT NULL,
    "weight" DECIMAL(5,2),
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewScorecardCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewEvaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scorecardId" TEXT,
    "evaluatorId" TEXT,
    "totalScore" DECIMAL(6,2),
    "recommendation" "AtsDecisionStatus",
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewEvaluationItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "criterionId" TEXT,
    "label" TEXT NOT NULL,
    "rawScore" DECIMAL(6,2),
    "weightedScore" DECIMAL(6,2),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewEvaluationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiEvaluationRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateId" TEXT,
    "applicationId" TEXT,
    "submissionId" TEXT,
    "runType" "AiRunType" NOT NULL,
    "status" "AiRunStatus" NOT NULL DEFAULT 'PENDING',
    "modelName" TEXT,
    "promptVersion" TEXT,
    "inputSummary" TEXT,
    "outputJson" JSONB,
    "refusalReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiEvaluationEvidence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sourceType" "ScoreEvidenceSource" NOT NULL,
    "sourceLabel" TEXT,
    "sourceDocumentId" TEXT,
    "snippet" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiEvaluationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRecommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT,
    "applicationId" TEXT NOT NULL,
    "type" "AiRecommendationType" NOT NULL,
    "status" "AiRecommendationStatus" NOT NULL DEFAULT 'PROPOSED',
    "score" DECIMAL(6,2),
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "decisionRationale" TEXT,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateResumeProfile_tenantId_candidateId_status_idx" ON "CandidateResumeProfile"("tenantId", "candidateId", "status");

-- CreateIndex
CREATE INDEX "CandidateResumeProfile_documentId_idx" ON "CandidateResumeProfile"("documentId");

-- CreateIndex
CREATE INDEX "CandidateSkill_tenantId_candidateId_idx" ON "CandidateSkill"("tenantId", "candidateId");

-- CreateIndex
CREATE INDEX "CandidateSkill_tenantId_name_idx" ON "CandidateSkill"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CandidateExperience_tenantId_candidateId_startDate_idx" ON "CandidateExperience"("tenantId", "candidateId", "startDate");

-- CreateIndex
CREATE INDEX "CandidateEducation_tenantId_candidateId_idx" ON "CandidateEducation"("tenantId", "candidateId");

-- CreateIndex
CREATE INDEX "CandidateCertification_tenantId_candidateId_idx" ON "CandidateCertification"("tenantId", "candidateId");

-- CreateIndex
CREATE INDEX "JobScorecard_tenantId_jobPostingId_idx" ON "JobScorecard"("tenantId", "jobPostingId");

-- CreateIndex
CREATE UNIQUE INDEX "JobScorecard_tenantId_jobPostingId_code_key" ON "JobScorecard"("tenantId", "jobPostingId", "code");

-- CreateIndex
CREATE INDEX "JobScorecardCriterion_tenantId_scorecardId_orderIndex_idx" ON "JobScorecardCriterion"("tenantId", "scorecardId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "JobScorecardCriterion_scorecardId_code_key" ON "JobScorecardCriterion"("scorecardId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationScreening_applicationId_key" ON "ApplicationScreening"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationScreening_tenantId_finalDecision_idx" ON "ApplicationScreening"("tenantId", "finalDecision");

-- CreateIndex
CREATE INDEX "ApplicationScreening_tenantId_overallScore_idx" ON "ApplicationScreening"("tenantId", "overallScore");

-- CreateIndex
CREATE INDEX "ApplicationScreeningItem_tenantId_screeningId_idx" ON "ApplicationScreeningItem"("tenantId", "screeningId");

-- CreateIndex
CREATE INDEX "ApplicationScreeningItem_criterionId_idx" ON "ApplicationScreeningItem"("criterionId");

-- CreateIndex
CREATE INDEX "AssessmentCampaign_tenantId_jobPostingId_status_idx" ON "AssessmentCampaign"("tenantId", "jobPostingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCampaign_tenantId_jobPostingId_code_key" ON "AssessmentCampaign"("tenantId", "jobPostingId", "code");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_tenantId_campaignId_orderIndex_idx" ON "AssessmentQuestion"("tenantId", "campaignId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_campaignId_code_key" ON "AssessmentQuestion"("campaignId", "code");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_tenantId_applicationId_status_idx" ON "AssessmentSubmission"("tenantId", "applicationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSubmission_campaignId_applicationId_key" ON "AssessmentSubmission"("campaignId", "applicationId");

-- CreateIndex
CREATE INDEX "AssessmentScoreItem_tenantId_submissionId_idx" ON "AssessmentScoreItem"("tenantId", "submissionId");

-- CreateIndex
CREATE INDEX "AssessmentScoreItem_questionId_idx" ON "AssessmentScoreItem"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewScorecard_tenantId_jobPostingId_code_key" ON "InterviewScorecard"("tenantId", "jobPostingId", "code");

-- CreateIndex
CREATE INDEX "InterviewScorecardCriterion_tenantId_scorecardId_orderIndex_idx" ON "InterviewScorecardCriterion"("tenantId", "scorecardId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewScorecardCriterion_scorecardId_code_key" ON "InterviewScorecardCriterion"("scorecardId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewEvaluation_interviewId_key" ON "InterviewEvaluation"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewEvaluation_tenantId_applicationId_idx" ON "InterviewEvaluation"("tenantId", "applicationId");

-- CreateIndex
CREATE INDEX "InterviewEvaluationItem_tenantId_evaluationId_idx" ON "InterviewEvaluationItem"("tenantId", "evaluationId");

-- CreateIndex
CREATE INDEX "AiEvaluationRun_tenantId_runType_status_idx" ON "AiEvaluationRun"("tenantId", "runType", "status");

-- CreateIndex
CREATE INDEX "AiEvaluationRun_tenantId_applicationId_createdAt_idx" ON "AiEvaluationRun"("tenantId", "applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiEvaluationEvidence_tenantId_runId_idx" ON "AiEvaluationEvidence"("tenantId", "runId");

-- CreateIndex
CREATE INDEX "AiRecommendation_tenantId_applicationId_type_status_idx" ON "AiRecommendation"("tenantId", "applicationId", "type", "status");

-- AddForeignKey
ALTER TABLE "CandidateResumeProfile" ADD CONSTRAINT "CandidateResumeProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateResumeProfile" ADD CONSTRAINT "CandidateResumeProfile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateResumeProfile" ADD CONSTRAINT "CandidateResumeProfile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TalentDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateExperience" ADD CONSTRAINT "CandidateExperience_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateExperience" ADD CONSTRAINT "CandidateExperience_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEducation" ADD CONSTRAINT "CandidateEducation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEducation" ADD CONSTRAINT "CandidateEducation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCertification" ADD CONSTRAINT "CandidateCertification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCertification" ADD CONSTRAINT "CandidateCertification_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScorecard" ADD CONSTRAINT "JobScorecard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScorecard" ADD CONSTRAINT "JobScorecard_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScorecardCriterion" ADD CONSTRAINT "JobScorecardCriterion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobScorecardCriterion" ADD CONSTRAINT "JobScorecardCriterion_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "JobScorecard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationScreening" ADD CONSTRAINT "ApplicationScreening_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationScreening" ADD CONSTRAINT "ApplicationScreening_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationScreening" ADD CONSTRAINT "ApplicationScreening_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "JobScorecard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationScreeningItem" ADD CONSTRAINT "ApplicationScreeningItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationScreeningItem" ADD CONSTRAINT "ApplicationScreeningItem_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "ApplicationScreening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationScreeningItem" ADD CONSTRAINT "ApplicationScreeningItem_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "JobScorecardCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCampaign" ADD CONSTRAINT "AssessmentCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCampaign" ADD CONSTRAINT "AssessmentCampaign_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AssessmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AssessmentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScoreItem" ADD CONSTRAINT "AssessmentScoreItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScoreItem" ADD CONSTRAINT "AssessmentScoreItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScoreItem" ADD CONSTRAINT "AssessmentScoreItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecardCriterion" ADD CONSTRAINT "InterviewScorecardCriterion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecardCriterion" ADD CONSTRAINT "InterviewScorecardCriterion_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "InterviewScorecard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluation" ADD CONSTRAINT "InterviewEvaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluation" ADD CONSTRAINT "InterviewEvaluation_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluation" ADD CONSTRAINT "InterviewEvaluation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluation" ADD CONSTRAINT "InterviewEvaluation_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "InterviewScorecard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluation" ADD CONSTRAINT "InterviewEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluationItem" ADD CONSTRAINT "InterviewEvaluationItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluationItem" ADD CONSTRAINT "InterviewEvaluationItem_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "InterviewEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEvaluationItem" ADD CONSTRAINT "InterviewEvaluationItem_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "InterviewScorecardCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationRun" ADD CONSTRAINT "AiEvaluationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationRun" ADD CONSTRAINT "AiEvaluationRun_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationRun" ADD CONSTRAINT "AiEvaluationRun_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationRun" ADD CONSTRAINT "AiEvaluationRun_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssessmentSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationEvidence" ADD CONSTRAINT "AiEvaluationEvidence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationEvidence" ADD CONSTRAINT "AiEvaluationEvidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AiEvaluationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluationEvidence" ADD CONSTRAINT "AiEvaluationEvidence_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "TalentDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AiEvaluationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
