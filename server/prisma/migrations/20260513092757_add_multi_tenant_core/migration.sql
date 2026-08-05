-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- Seed the first tenant used to backfill existing rows.
INSERT INTO "Tenant" ("id", "name", "slug", "status", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Tenant Principal', 'default', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add nullable tenant columns first so existing data can be backfilled safely.
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Session" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RecruitmentRequest" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "JobPosting" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Application" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Interview" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "HiringOffer" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "OnboardingPlan" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "TalentDocument" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RecruitmentWeeklyPlan" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RecruitmentPipelineStep" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RecruitmentScorecardCriterion" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RecruitmentPlanningHistory" ADD COLUMN "tenantId" TEXT;

-- Backfill direct ownership tables.
UPDATE "User"
SET "tenantId" = 'tenant_default'
WHERE "tenantId" IS NULL;

UPDATE "Candidate"
SET "tenantId" = 'tenant_default'
WHERE "tenantId" IS NULL;

UPDATE "RecruitmentWeeklyPlan"
SET "tenantId" = COALESCE(
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentWeeklyPlan"."createdById"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentWeeklyPlan"."updatedById"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "RecruitmentPipelineStep"
SET "tenantId" = COALESCE(
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentPipelineStep"."createdById"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentPipelineStep"."updatedById"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "RecruitmentScorecardCriterion"
SET "tenantId" = COALESCE(
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentScorecardCriterion"."createdById"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentScorecardCriterion"."updatedById"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "RecruitmentRequest"
SET "tenantId" = COALESCE(
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentRequest"."requestedById"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentRequest"."approvedById"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "Session" s
SET "tenantId" = COALESCE(u."tenantId", 'tenant_default')
FROM "User" u
WHERE s."userId" = u."id"
  AND s."tenantId" IS NULL;

UPDATE "Session"
SET "tenantId" = 'tenant_default'
WHERE "tenantId" IS NULL;

-- Backfill dependent talent acquisition tables in dependency order.
UPDATE "JobPosting"
SET "tenantId" = COALESCE(
    (SELECT rr."tenantId" FROM "RecruitmentRequest" rr WHERE rr."id" = "JobPosting"."recruitmentRequestId"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "JobPosting"."recruiterId"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "JobPosting"."hiringManagerId"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "Application"
SET "tenantId" = COALESCE(
    (SELECT jp."tenantId" FROM "JobPosting" jp WHERE jp."id" = "Application"."jobPostingId"),
    (SELECT c."tenantId" FROM "Candidate" c WHERE c."id" = "Application"."candidateId"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "Interview"
SET "tenantId" = COALESCE(
    (SELECT a."tenantId" FROM "Application" a WHERE a."id" = "Interview"."applicationId"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "Interview"."interviewerId"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "HiringOffer"
SET "tenantId" = COALESCE(
    (SELECT a."tenantId" FROM "Application" a WHERE a."id" = "HiringOffer"."applicationId"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "OnboardingPlan"
SET "tenantId" = COALESCE(
    (SELECT a."tenantId" FROM "Application" a WHERE a."id" = "OnboardingPlan"."applicationId"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "TalentDocument"
SET "tenantId" = COALESCE(
    (SELECT c."tenantId" FROM "Candidate" c WHERE c."id" = "TalentDocument"."candidateId"),
    (SELECT op."tenantId" FROM "OnboardingPlan" op WHERE op."id" = "TalentDocument"."onboardingPlanId"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "TalentDocument"."uploadedById"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

UPDATE "RecruitmentPlanningHistory"
SET "tenantId" = COALESCE(
    (SELECT wp."tenantId" FROM "RecruitmentWeeklyPlan" wp WHERE wp."id" = "RecruitmentPlanningHistory"."weeklyPlanId"),
    (SELECT ps."tenantId" FROM "RecruitmentPipelineStep" ps WHERE ps."id" = "RecruitmentPlanningHistory"."pipelineStepId"),
    (SELECT sc."tenantId" FROM "RecruitmentScorecardCriterion" sc WHERE sc."id" = "RecruitmentPlanningHistory"."scorecardCriterionId"),
    (SELECT u."tenantId" FROM "User" u WHERE u."id" = "RecruitmentPlanningHistory"."performedById"),
    'tenant_default'
)
WHERE "tenantId" IS NULL;

-- Lock the schema after backfill.
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RecruitmentRequest" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "JobPosting" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Candidate" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Application" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Interview" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "HiringOffer" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "OnboardingPlan" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TalentDocument" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RecruitmentWeeklyPlan" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RecruitmentPipelineStep" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RecruitmentScorecardCriterion" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RecruitmentPlanningHistory" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Session_tenantId_idx" ON "Session"("tenantId");
CREATE INDEX "RecruitmentRequest_tenantId_status_idx" ON "RecruitmentRequest"("tenantId", "status");
CREATE INDEX "JobPosting_tenantId_status_idx" ON "JobPosting"("tenantId", "status");
CREATE INDEX "Candidate_tenantId_createdAt_idx" ON "Candidate"("tenantId", "createdAt");
CREATE INDEX "Application_tenantId_status_idx" ON "Application"("tenantId", "status");
CREATE INDEX "Interview_tenantId_status_idx" ON "Interview"("tenantId", "status");
CREATE INDEX "HiringOffer_tenantId_status_idx" ON "HiringOffer"("tenantId", "status");
CREATE INDEX "OnboardingPlan_tenantId_status_idx" ON "OnboardingPlan"("tenantId", "status");
CREATE INDEX "TalentDocument_tenantId_createdAt_idx" ON "TalentDocument"("tenantId", "createdAt");
CREATE INDEX "RecruitmentWeeklyPlan_tenantId_status_orderIndex_idx" ON "RecruitmentWeeklyPlan"("tenantId", "status", "orderIndex");
CREATE INDEX "RecruitmentPipelineStep_tenantId_isActive_orderIndex_idx" ON "RecruitmentPipelineStep"("tenantId", "isActive", "orderIndex");
CREATE INDEX "RecruitmentScorecardCriterion_tenantId_isActive_orderIndex_idx" ON "RecruitmentScorecardCriterion"("tenantId", "isActive", "orderIndex");
CREATE INDEX "RecruitmentPlanningHistory_tenantId_createdAt_idx" ON "RecruitmentPlanningHistory"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentRequest" ADD CONSTRAINT "RecruitmentRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HiringOffer" ADD CONSTRAINT "HiringOffer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnboardingPlan" ADD CONSTRAINT "OnboardingPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TalentDocument" ADD CONSTRAINT "TalentDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentWeeklyPlan" ADD CONSTRAINT "RecruitmentWeeklyPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentPipelineStep" ADD CONSTRAINT "RecruitmentPipelineStep_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentScorecardCriterion" ADD CONSTRAINT "RecruitmentScorecardCriterion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentPlanningHistory" ADD CONSTRAINT "RecruitmentPlanningHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
