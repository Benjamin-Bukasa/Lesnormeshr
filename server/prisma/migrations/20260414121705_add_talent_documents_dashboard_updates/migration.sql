-- CreateEnum
CREATE TYPE "TalentDocumentOwnerType" AS ENUM ('CANDIDATE', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "TalentDocumentCategory" AS ENUM ('CV', 'IDENTITY', 'DIPLOMA', 'CERTIFICATE', 'CONTRACT', 'OFFER_LETTER', 'OTHER');

-- CreateTable
CREATE TABLE "TalentDocument" (
    "id" TEXT NOT NULL,
    "ownerType" "TalentDocumentOwnerType" NOT NULL,
    "category" "TalentDocumentCategory" NOT NULL DEFAULT 'OTHER',
    "candidateId" TEXT,
    "onboardingPlanId" TEXT,
    "uploadedById" TEXT,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentDocument_ownerType_category_idx" ON "TalentDocument"("ownerType", "category");

-- CreateIndex
CREATE INDEX "TalentDocument_candidateId_idx" ON "TalentDocument"("candidateId");

-- CreateIndex
CREATE INDEX "TalentDocument_onboardingPlanId_idx" ON "TalentDocument"("onboardingPlanId");

-- AddForeignKey
ALTER TABLE "TalentDocument" ADD CONSTRAINT "TalentDocument_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentDocument" ADD CONSTRAINT "TalentDocument_onboardingPlanId_fkey" FOREIGN KEY ("onboardingPlanId") REFERENCES "OnboardingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentDocument" ADD CONSTRAINT "TalentDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
