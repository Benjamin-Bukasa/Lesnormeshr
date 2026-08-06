-- DropIndex
DROP INDEX "PerformanceCycle_status_periodStart_periodEnd_idx";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "tenantId" TEXT;

-- Ensure a default tenant exists for legacy rows without tenant context.
INSERT INTO "Tenant" ("id", "name", "slug", "status", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Tenant par defaut', 'tenant-default', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- First try to inherit the tenant from the linked user profile when available.
UPDATE "Employee" AS e
SET "tenantId" = u."tenantId"
FROM "User" AS u
WHERE e."userId" = u."id"
  AND e."tenantId" IS NULL;

-- Fallback all remaining legacy employees to the default tenant.
UPDATE "Employee"
SET "tenantId" = 'tenant_default'
WHERE "tenantId" IS NULL;

ALTER TABLE "Employee" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Employee_tenantId_employmentStatus_idx" ON "Employee"("tenantId", "employmentStatus");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
