-- CreateEnum
CREATE TYPE "RecruitmentWeeklyPlanStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecruitmentPlanningEntityType" AS ENUM ('WEEKLY_PLAN', 'PIPELINE_STEP', 'SCORECARD_CRITERION');

-- CreateEnum
CREATE TYPE "RecruitmentPlanningAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateTable
CREATE TABLE "RecruitmentWeeklyPlan" (
    "id" TEXT NOT NULL,
    "weekLabel" VARCHAR(30) NOT NULL,
    "objective" TEXT NOT NULL,
    "keyActions" TEXT NOT NULL,
    "ownerLabel" TEXT NOT NULL,
    "deliverable" TEXT NOT NULL,
    "kpiTarget" TEXT NOT NULL,
    "status" "RecruitmentWeeklyPlanStatus" NOT NULL DEFAULT 'PLANNED',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentWeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentPipelineStep" (
    "id" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "entryCriteria" TEXT NOT NULL,
    "exitCriteria" TEXT NOT NULL,
    "ownerLabel" TEXT NOT NULL,
    "slaDays" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentPipelineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentScorecardCriterion" (
    "id" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "weight" DECIMAL(6,2) NOT NULL,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentScorecardCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentPlanningHistory" (
    "id" TEXT NOT NULL,
    "entityType" "RecruitmentPlanningEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "RecruitmentPlanningAction" NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "performedById" TEXT,
    "weeklyPlanId" TEXT,
    "pipelineStepId" TEXT,
    "scorecardCriterionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentPlanningHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruitmentWeeklyPlan_status_orderIndex_idx" ON "RecruitmentWeeklyPlan"("status", "orderIndex");

-- CreateIndex
CREATE INDEX "RecruitmentPipelineStep_isActive_orderIndex_idx" ON "RecruitmentPipelineStep"("isActive", "orderIndex");

-- CreateIndex
CREATE INDEX "RecruitmentScorecardCriterion_isActive_orderIndex_idx" ON "RecruitmentScorecardCriterion"("isActive", "orderIndex");

-- CreateIndex
CREATE INDEX "RecruitmentPlanningHistory_entityType_entityId_createdAt_idx" ON "RecruitmentPlanningHistory"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentPlanningHistory_createdAt_idx" ON "RecruitmentPlanningHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "RecruitmentWeeklyPlan" ADD CONSTRAINT "RecruitmentWeeklyPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentWeeklyPlan" ADD CONSTRAINT "RecruitmentWeeklyPlan_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPipelineStep" ADD CONSTRAINT "RecruitmentPipelineStep_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPipelineStep" ADD CONSTRAINT "RecruitmentPipelineStep_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentScorecardCriterion" ADD CONSTRAINT "RecruitmentScorecardCriterion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentScorecardCriterion" ADD CONSTRAINT "RecruitmentScorecardCriterion_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPlanningHistory" ADD CONSTRAINT "RecruitmentPlanningHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPlanningHistory" ADD CONSTRAINT "RecruitmentPlanningHistory_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "RecruitmentWeeklyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPlanningHistory" ADD CONSTRAINT "RecruitmentPlanningHistory_pipelineStepId_fkey" FOREIGN KEY ("pipelineStepId") REFERENCES "RecruitmentPipelineStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentPlanningHistory" ADD CONSTRAINT "RecruitmentPlanningHistory_scorecardCriterionId_fkey" FOREIGN KEY ("scorecardCriterionId") REFERENCES "RecruitmentScorecardCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
