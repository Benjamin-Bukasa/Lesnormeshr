-- Add nullable tenant columns first for safe backfill.
ALTER TABLE "PerformanceGoal" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PerformanceReview" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "PerformanceFeedback" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "EmployeeTraining" ADD COLUMN "tenantId" TEXT;

-- Backfill from performance cycles first, then from employee ownership as fallback.
UPDATE "PerformanceGoal" pg
SET "tenantId" = COALESCE(
    (SELECT pc."tenantId" FROM "PerformanceCycle" pc WHERE pc."id" = pg."cycleId"),
    (
        SELECT u."tenantId"
        FROM "Employee" e
        JOIN "User" u ON u."id" = e."userId"
        WHERE e."id" = pg."employeeId"
        LIMIT 1
    ),
    'tenant_default'
)
WHERE pg."tenantId" IS NULL;

UPDATE "PerformanceReview" pr
SET "tenantId" = COALESCE(
    (SELECT pc."tenantId" FROM "PerformanceCycle" pc WHERE pc."id" = pr."cycleId"),
    (
        SELECT u."tenantId"
        FROM "Employee" e
        JOIN "User" u ON u."id" = e."userId"
        WHERE e."id" = pr."revieweeEmployeeId"
        LIMIT 1
    ),
    (
        SELECT u."tenantId"
        FROM "Employee" e
        JOIN "User" u ON u."id" = e."userId"
        WHERE e."id" = pr."reviewerEmployeeId"
        LIMIT 1
    ),
    'tenant_default'
)
WHERE pr."tenantId" IS NULL;

UPDATE "PerformanceFeedback" pf
SET "tenantId" = COALESCE(
    (SELECT pc."tenantId" FROM "PerformanceCycle" pc WHERE pc."id" = pf."cycleId"),
    (
        SELECT u."tenantId"
        FROM "Employee" e
        JOIN "User" u ON u."id" = e."userId"
        WHERE e."id" = pf."toEmployeeId"
        LIMIT 1
    ),
    (
        SELECT u."tenantId"
        FROM "Employee" e
        JOIN "User" u ON u."id" = e."userId"
        WHERE e."id" = pf."fromEmployeeId"
        LIMIT 1
    ),
    'tenant_default'
)
WHERE pf."tenantId" IS NULL;

UPDATE "EmployeeTraining" et
SET "tenantId" = COALESCE(
    (SELECT pc."tenantId" FROM "PerformanceCycle" pc WHERE pc."id" = et."cycleId"),
    (
        SELECT u."tenantId"
        FROM "Employee" e
        JOIN "User" u ON u."id" = e."userId"
        WHERE e."id" = et."employeeId"
        LIMIT 1
    ),
    'tenant_default'
)
WHERE et."tenantId" IS NULL;

ALTER TABLE "PerformanceGoal" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PerformanceReview" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PerformanceFeedback" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "EmployeeTraining" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "PerformanceGoal_tenantId_status_idx" ON "PerformanceGoal"("tenantId", "status");
CREATE INDEX "PerformanceReview_tenantId_status_idx" ON "PerformanceReview"("tenantId", "status");
CREATE INDEX "PerformanceFeedback_tenantId_createdAt_idx" ON "PerformanceFeedback"("tenantId", "createdAt");
CREATE INDEX "EmployeeTraining_tenantId_status_idx" ON "EmployeeTraining"("tenantId", "status");

ALTER TABLE "PerformanceGoal"
ADD CONSTRAINT "PerformanceGoal_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PerformanceReview"
ADD CONSTRAINT "PerformanceReview_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PerformanceFeedback"
ADD CONSTRAINT "PerformanceFeedback_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmployeeTraining"
ADD CONSTRAINT "EmployeeTraining_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
