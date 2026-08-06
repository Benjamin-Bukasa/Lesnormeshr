-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "kanbanOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Application_tenantId_stage_kanbanOrder_idx" ON "Application"("tenantId", "stage", "kanbanOrder");
