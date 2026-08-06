ALTER TABLE "PerformanceGoal" ADD COLUMN "kpiDefinitionId" TEXT;
ALTER TABLE "PerformanceGoal" ADD COLUMN "note" TEXT;

CREATE TABLE "KpiDefinition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "directionName" TEXT,
    "metricType" TEXT NOT NULL,
    "unit" TEXT,
    "defaultWeight" DECIMAL(5,2),
    "ownerLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "description" TEXT,
    "managerEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KpiDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KpiAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerEmployeeId" TEXT,
    "summary" TEXT,
    "assignedKpis" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(5,2),
    "completionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KpiAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KpiCheckIn" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "progressPercent" DECIMAL(5,2),
    "blocker" TEXT,
    "supportNeeded" TEXT,
    "nextActions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KpiCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KpiDefinition_tenantId_code_key" ON "KpiDefinition"("tenantId", "code");
CREATE INDEX "KpiDefinition_tenantId_status_idx" ON "KpiDefinition"("tenantId", "status");
CREATE INDEX "KpiAssignment_tenantId_status_idx" ON "KpiAssignment"("tenantId", "status");
CREATE INDEX "KpiAssignment_cycleId_employeeId_idx" ON "KpiAssignment"("cycleId", "employeeId");
CREATE INDEX "KpiCheckIn_tenantId_status_idx" ON "KpiCheckIn"("tenantId", "status");
CREATE INDEX "KpiCheckIn_goalId_checkInDate_idx" ON "KpiCheckIn"("goalId", "checkInDate");

ALTER TABLE "PerformanceGoal"
ADD CONSTRAINT "PerformanceGoal_kpiDefinitionId_fkey"
FOREIGN KEY ("kpiDefinitionId") REFERENCES "KpiDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KpiDefinition"
ADD CONSTRAINT "KpiDefinition_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KpiDefinition"
ADD CONSTRAINT "KpiDefinition_managerEmployeeId_fkey"
FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KpiAssignment"
ADD CONSTRAINT "KpiAssignment_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KpiAssignment"
ADD CONSTRAINT "KpiAssignment_cycleId_fkey"
FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KpiAssignment"
ADD CONSTRAINT "KpiAssignment_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KpiAssignment"
ADD CONSTRAINT "KpiAssignment_managerEmployeeId_fkey"
FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KpiCheckIn"
ADD CONSTRAINT "KpiCheckIn_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "KpiCheckIn"
ADD CONSTRAINT "KpiCheckIn_goalId_fkey"
FOREIGN KEY ("goalId") REFERENCES "PerformanceGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
