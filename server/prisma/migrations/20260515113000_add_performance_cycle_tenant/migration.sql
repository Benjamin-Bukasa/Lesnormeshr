-- Add nullable tenant column first for safe backfill.
ALTER TABLE "PerformanceCycle" ADD COLUMN "tenantId" TEXT;

-- Backfill from goals, reviews, feedbacks and trainings when possible.
UPDATE "PerformanceCycle" pc
SET "tenantId" = COALESCE(
    (
        SELECT u."tenantId"
        FROM "PerformanceGoal" pg
        JOIN "Employee" e ON e."id" = pg."employeeId"
        JOIN "User" u ON u."id" = e."userId"
        WHERE pg."cycleId" = pc."id"
          AND u."tenantId" IS NOT NULL
        LIMIT 1
    ),
    (
        SELECT u."tenantId"
        FROM "PerformanceReview" pr
        JOIN "Employee" e ON e."id" = pr."revieweeEmployeeId"
        JOIN "User" u ON u."id" = e."userId"
        WHERE pr."cycleId" = pc."id"
          AND u."tenantId" IS NOT NULL
        LIMIT 1
    ),
    (
        SELECT u."tenantId"
        FROM "PerformanceFeedback" pf
        JOIN "Employee" e ON e."id" = pf."toEmployeeId"
        JOIN "User" u ON u."id" = e."userId"
        WHERE pf."cycleId" = pc."id"
          AND u."tenantId" IS NOT NULL
        LIMIT 1
    ),
    (
        SELECT u."tenantId"
        FROM "EmployeeTraining" et
        JOIN "Employee" e ON e."id" = et."employeeId"
        JOIN "User" u ON u."id" = e."userId"
        WHERE et."cycleId" = pc."id"
          AND u."tenantId" IS NOT NULL
        LIMIT 1
    ),
    'tenant_default'
)
WHERE pc."tenantId" IS NULL;

ALTER TABLE "PerformanceCycle" ALTER COLUMN "tenantId" SET NOT NULL;

-- Replace global uniqueness with tenant-scoped uniqueness.
DROP INDEX IF EXISTS "PerformanceCycle_code_key";
CREATE UNIQUE INDEX "PerformanceCycle_tenantId_code_key" ON "PerformanceCycle"("tenantId", "code");
CREATE INDEX "PerformanceCycle_tenantId_status_periodStart_periodEnd_idx" ON "PerformanceCycle"("tenantId", "status", "periodStart", "periodEnd");

ALTER TABLE "PerformanceCycle"
ADD CONSTRAINT "PerformanceCycle_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
