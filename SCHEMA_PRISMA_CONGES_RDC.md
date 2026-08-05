# Schéma Prisma complet proposé - Module congés et absences RDC

Ce document propose le schéma Prisma cible pour le module `Congés et absences` dans `LESNORMESRH`.

Il tient compte :
- du schéma déjà présent dans [server/prisma/schema.prisma](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/server/prisma/schema.prisma:1129)
- du besoin multi-tenant déjà mis en place dans l'application
- du cahier fonctionnel défini dans [CAHIER_FONCTIONNEL_CONGES_RDC.md](/d:/Dev/Projects/LES_NORMES_PROJECTS/LESNORMESRH/CAHIER_FONCTIONNEL_CONGES_RDC.md:1)
- du besoin de conformité au droit du travail en RDC

## 1. Constat sur l'existant

Le projet contient déjà une base utile :
- `LeaveType`
- `EmployeeLeaveBalance`
- `EmployeeLeaveRequest`
- `EmployeeLeaveApproval`

Points positifs :
- le concept de type de congé existe déjà
- les soldes employés existent déjà
- la demande et l'approbation existent déjà
- les demi-journées sont déjà prévues

Écarts à corriger pour un vrai module professionnel :
- pas de `tenantId` sur les tables congés
- pas de politique de congé par tenant
- pas de calendrier de jours fériés paramétrable
- pas de justificatifs natifs
- pas de journal d'événements détaillé
- pas de lien explicite avec la paie
- pas de typologie juridique fine des absences
- pas de contrôle de conformité stocké

## 2. Principe de conception

Je recommande d'étendre l'existant et non de le remplacer.

Stratégie :
- conserver `LeaveType`
- conserver `EmployeeLeaveBalance`
- conserver `EmployeeLeaveRequest`
- conserver `EmployeeLeaveApproval`
- ajouter les tables de politique, calendrier, pièces, audit et paie

## 3. Ajustements indispensables sur l'existant

### 3.1 Multi-tenant

Ajouter `tenantId` sur :
- `LeaveType`
- `EmployeeLeaveBalance`
- `EmployeeLeaveRequest`
- `EmployeeLeaveApproval`
- toutes les nouvelles tables du module

Pourquoi :
- cohérence avec le reste du SaaS
- isolation complète des règles, demandes et audits par entreprise

### 3.2 Unicité métier

Je recommande :
- `@@unique([tenantId, code])` sur `LeaveType`
- `@@unique([tenantId, employeeId, leaveTypeId, year])` sur `EmployeeLeaveBalance`
- un `requestNumber` unique par tenant sur `EmployeeLeaveRequest`

## 4. Enums proposés

```prisma
enum LeaveCategory {
  ANNUAL
  CIRCUMSTANCE
  MATERNITY
  SICKNESS
  OCCUPATIONAL_ACCIDENT
  UNPAID
  HOLIDAY
  SPECIAL_AUTHORIZATION
  OTHER
}

enum LeaveAllowanceMode {
  NONE
  MONTHLY
  YEARLY
  MANUAL
}

enum LeaveCountMethod {
  WORKING_DAYS
  CALENDAR_DAYS
  HOURS
}

enum LeaveRequestStatus {
  DRAFT
  SUBMITTED
  IN_MANAGER_REVIEW
  IN_HR_REVIEW
  APPROVED
  REJECTED
  CANCELLED
  CONSUMED
  REGULARIZED
}

enum LeaveApprovalDecision {
  PENDING
  APPROVED
  REJECTED
  RETURNED
  SKIPPED
}

enum LeaveDocumentType {
  MEDICAL_CERTIFICATE
  DEATH_CERTIFICATE
  BIRTH_CERTIFICATE
  MARRIAGE_CERTIFICATE
  ADMINISTRATIVE_NOTE
  OTHER
}

enum LeavePayTreatment {
  FULLY_PAID
  PARTIALLY_PAID
  UNPAID
  EXTERNAL_SOCIAL_SECURITY
}

enum LeavePayrollStatus {
  NOT_APPLICABLE
  PENDING_EXPORT
  EXPORTED
  PROCESSED
  CANCELLED
}

enum LeaveComplianceSeverity {
  INFO
  WARNING
  CRITICAL
}

enum LeaveComplianceType {
  MISSING_DOCUMENT
  EXCESS_ALLOWANCE
  EXPIRED_ENTITLEMENT
  INVALID_PAY_TREATMENT
  LONG_SICKNESS_FOLLOW_UP
  RETURN_TO_WORK_VISIT_REQUIRED
  OVERLAPPING_REQUEST
  STAFFING_CONFLICT
}

enum PublicHolidayScope {
  NATIONAL
  PROVINCIAL
  SITE
}
```

## 5. Modèles Prisma proposés

## 5.1 Politique de congé par tenant

```prisma
model LeavePolicy {
  id                            String              @id @default(cuid())
  tenantId                      String
  code                          String
  name                          String
  description                   String?
  isDefault                     Boolean             @default(false)
  annualCountMethod             LeaveCountMethod    @default(WORKING_DAYS)
  annualAllowanceMode           LeaveAllowanceMode  @default(MONTHLY)
  annualDaysPerMonth            Decimal?            @db.Decimal(8, 2)
  annualDaysPerYear             Decimal?            @db.Decimal(8, 2)
  carryForwardLimit             Decimal?            @db.Decimal(8, 2)
  expiryDelayMonths             Int?
  maxAccumulationYears          Int?
  annualEligibilityMonths       Int                 @default(12)
  circumstancePaidDaysLimit     Decimal?            @db.Decimal(8, 2)
  requireHrApprovalByDefault    Boolean             @default(false)
  enableHalfDay                 Boolean             @default(true)
  createdAt                     DateTime            @default(now())
  updatedAt                     DateTime            @updatedAt

  tenant                        Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveTypes                    LeaveType[]
  holidays                      LeaveHoliday[]

  @@unique([tenantId, code])
  @@index([tenantId, isDefault])
}
```

## 5.2 Typologie des congés

Extension recommandée de `LeaveType` :

```prisma
model LeaveType {
  id                        String               @id @default(cuid())
  tenantId                  String
  policyId                  String?
  code                      String
  name                      String
  description               String?
  category                  LeaveCategory
  unit                      LeaveUnit            @default(DAY)
  countMethod               LeaveCountMethod     @default(WORKING_DAYS)
  defaultAllowance          Decimal?             @db.Decimal(8, 2)
  carryForwardLimit         Decimal?             @db.Decimal(8, 2)
  annualQuota               Decimal?             @db.Decimal(8, 2)
  isPaid                    Boolean              @default(true)
  payTreatment              LeavePayTreatment    @default(FULLY_PAID)
  requiresApproval          Boolean              @default(true)
  requiresHrApproval        Boolean              @default(false)
  requiresDocument          Boolean              @default(false)
  requiresMedicalCertificate Boolean             @default(false)
  deductFromAnnualBalance   Boolean              @default(false)
  canExceedBalance          Boolean              @default(false)
  isActive                  Boolean              @default(true)
  createdAt                 DateTime             @default(now())
  updatedAt                 DateTime             @updatedAt

  tenant                    Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  policy                    LeavePolicy?         @relation(fields: [policyId], references: [id], onDelete: SetNull)
  balances                  EmployeeLeaveBalance[]
  requests                  EmployeeLeaveRequest[]
  requiredDocuments         LeaveTypeDocumentRequirement[]

  @@unique([tenantId, code])
  @@index([tenantId, category, isActive])
  @@index([policyId])
}
```

## 5.3 Pièces requises par type

```prisma
model LeaveTypeDocumentRequirement {
  id               String             @id @default(cuid())
  tenantId         String
  leaveTypeId      String
  documentType     LeaveDocumentType
  name             String
  requiredAtSubmit Boolean            @default(true)
  maxDelayDays     Int?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  tenant           Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveType        LeaveType          @relation(fields: [leaveTypeId], references: [id], onDelete: Cascade)

  @@index([tenantId, leaveTypeId])
}
```

## 5.4 Soldes employés

Extension recommandée de `EmployeeLeaveBalance` :

```prisma
model EmployeeLeaveBalance {
  id              String    @id @default(cuid())
  tenantId        String
  employeeId      String
  leaveTypeId     String
  year            Int
  openingBalance  Decimal   @default(0) @db.Decimal(8, 2)
  earned          Decimal   @default(0) @db.Decimal(8, 2)
  used            Decimal   @default(0) @db.Decimal(8, 2)
  pending         Decimal   @default(0) @db.Decimal(8, 2)
  carryForward    Decimal   @default(0) @db.Decimal(8, 2)
  expired         Decimal   @default(0) @db.Decimal(8, 2)
  adjustment      Decimal   @default(0) @db.Decimal(8, 2)
  available       Decimal   @default(0) @db.Decimal(8, 2)
  lastRecalculatedAt DateTime?
  updatedAt       DateTime  @updatedAt

  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employee        Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id], onDelete: Cascade)

  @@unique([tenantId, employeeId, leaveTypeId, year])
  @@index([tenantId, leaveTypeId, year])
  @@index([tenantId, employeeId, year])
}
```

## 5.5 Demandes de congé

Extension recommandée de `EmployeeLeaveRequest` :

```prisma
model EmployeeLeaveRequest {
  id                 String               @id @default(cuid())
  tenantId           String
  requestNumber      String
  employeeId         String
  leaveTypeId        String
  payrollRunId       String?
  managerEmployeeId  String?
  startDate          DateTime
  endDate            DateTime
  startHalfDay       Boolean              @default(false)
  endHalfDay         Boolean              @default(false)
  requestedUnits     Decimal              @db.Decimal(8, 2)
  approvedUnits      Decimal?             @db.Decimal(8, 2)
  reason             String?
  contactAddress     String?
  contactPhone       String?
  replacementEmployeeId String?
  status             LeaveRequestStatus   @default(DRAFT)
  workflowStep       Int                  @default(1)
  payTreatment       LeavePayTreatment?
  payrollStatus      LeavePayrollStatus   @default(PENDING_EXPORT)
  appliedAt          DateTime?
  submittedAt        DateTime?
  decidedAt          DateTime?
  consumedAt         DateTime?
  cancelledAt        DateTime?
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  tenant             Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employee           Employee             @relation("EmployeeLeaveRequestOwner", fields: [employeeId], references: [id], onDelete: Cascade)
  manager            Employee?            @relation("EmployeeLeaveRequestManager", fields: [managerEmployeeId], references: [id], onDelete: SetNull)
  leaveType          LeaveType            @relation(fields: [leaveTypeId], references: [id], onDelete: Restrict)
  replacementEmployee Employee?           @relation("EmployeeLeaveRequestReplacement", fields: [replacementEmployeeId], references: [id], onDelete: SetNull)
  approvals          EmployeeLeaveApproval[]
  documents          EmployeeLeaveDocument[]
  complianceAlerts   LeaveComplianceAlert[]
  events             LeaveRequestEvent[]
  payrollImpact      LeavePayrollImpact?

  @@unique([tenantId, requestNumber])
  @@index([tenantId, employeeId, status])
  @@index([tenantId, leaveTypeId, status])
  @@index([tenantId, startDate, endDate])
  @@index([tenantId, managerEmployeeId, status])
}
```

## 5.6 Étapes d'approbation

Extension recommandée de `EmployeeLeaveApproval` :

```prisma
model EmployeeLeaveApproval {
  id                 String                 @id @default(cuid())
  tenantId           String
  leaveRequestId     String
  approverEmployeeId String
  stepOrder          Int
  roleLabel          String?
  decision           LeaveApprovalDecision @default(PENDING)
  comment            String?
  actedAt            DateTime?
  createdAt          DateTime               @default(now())
  updatedAt          DateTime               @updatedAt

  tenant             Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveRequest       EmployeeLeaveRequest   @relation(fields: [leaveRequestId], references: [id], onDelete: Cascade)
  approver           Employee               @relation(fields: [approverEmployeeId], references: [id], onDelete: Restrict)

  @@unique([leaveRequestId, stepOrder])
  @@index([tenantId, approverEmployeeId, decision])
}
```

## 5.7 Justificatifs

```prisma
model EmployeeLeaveDocument {
  id              String             @id @default(cuid())
  tenantId        String
  leaveRequestId  String
  documentType    LeaveDocumentType
  title           String
  fileName        String
  filePath        String
  mimeType        String?
  fileSize        Int?
  uploadedByEmployeeId String?
  uploadedAt      DateTime           @default(now())

  tenant          Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveRequest    EmployeeLeaveRequest @relation(fields: [leaveRequestId], references: [id], onDelete: Cascade)
  uploadedBy      Employee?          @relation(fields: [uploadedByEmployeeId], references: [id], onDelete: SetNull)

  @@index([tenantId, leaveRequestId])
}
```

## 5.8 Journal d'événements

```prisma
model LeaveRequestEvent {
  id               String               @id @default(cuid())
  tenantId         String
  leaveRequestId   String
  actorEmployeeId  String?
  eventType        String
  fromStatus       LeaveRequestStatus?
  toStatus         LeaveRequestStatus?
  comment          String?
  metadataJson     Json?
  createdAt        DateTime             @default(now())

  tenant           Tenant               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveRequest     EmployeeLeaveRequest @relation(fields: [leaveRequestId], references: [id], onDelete: Cascade)
  actor            Employee?            @relation(fields: [actorEmployeeId], references: [id], onDelete: SetNull)

  @@index([tenantId, leaveRequestId, createdAt])
}
```

## 5.9 Jours fériés

```prisma
model LeaveHoliday {
  id             String            @id @default(cuid())
  tenantId       String
  policyId       String?
  title          String
  holidayDate    DateTime
  scope          PublicHolidayScope @default(NATIONAL)
  siteCode       String?
  isPaid         Boolean           @default(true)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  tenant         Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  policy         LeavePolicy?      @relation(fields: [policyId], references: [id], onDelete: SetNull)

  @@index([tenantId, holidayDate])
  @@index([tenantId, scope, siteCode])
}
```

## 5.10 Alertes de conformité

```prisma
model LeaveComplianceAlert {
  id              String                 @id @default(cuid())
  tenantId        String
  leaveRequestId  String?
  employeeId      String?
  type            LeaveComplianceType
  severity        LeaveComplianceSeverity
  title           String
  description     String?
  detectedAt      DateTime               @default(now())
  resolvedAt      DateTime?
  resolvedByEmployeeId String?
  resolutionNote  String?

  tenant          Tenant                 @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveRequest    EmployeeLeaveRequest?  @relation(fields: [leaveRequestId], references: [id], onDelete: SetNull)
  employee        Employee?              @relation("LeaveComplianceEmployee", fields: [employeeId], references: [id], onDelete: SetNull)
  resolvedBy      Employee?              @relation("LeaveComplianceResolver", fields: [resolvedByEmployeeId], references: [id], onDelete: SetNull)

  @@index([tenantId, type, severity])
  @@index([tenantId, detectedAt])
}
```

## 5.11 Impact paie

```prisma
model LeavePayrollImpact {
  id                String              @id @default(cuid())
  tenantId          String
  leaveRequestId    String              @unique
  employeeId        String
  payTreatment      LeavePayTreatment
  payableUnits      Decimal?            @db.Decimal(8, 2)
  unpaidUnits       Decimal?            @db.Decimal(8, 2)
  coefficient       Decimal?            @db.Decimal(8, 2)
  status            LeavePayrollStatus  @default(PENDING_EXPORT)
  exportedAt        DateTime?
  processedAt       DateTime?
  notes             String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  tenant            Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leaveRequest      EmployeeLeaveRequest @relation(fields: [leaveRequestId], references: [id], onDelete: Cascade)
  employee          Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([tenantId, status])
  @@index([tenantId, employeeId, status])
}
```

## 6. Relations à ajouter sur `Tenant`

```prisma
model Tenant {
  ...
  leavePolicies         LeavePolicy[]
  leaveTypes            LeaveType[]
  leaveBalances         EmployeeLeaveBalance[]
  leaveRequests         EmployeeLeaveRequest[]
  leaveApprovals        EmployeeLeaveApproval[]
  leaveDocuments        EmployeeLeaveDocument[]
  leaveEvents           LeaveRequestEvent[]
  leaveHolidays         LeaveHoliday[]
  leaveComplianceAlerts LeaveComplianceAlert[]
  leavePayrollImpacts   LeavePayrollImpact[]
}
```

## 7. Relations à ajouter sur `Employee`

```prisma
model Employee {
  ...
  leaveBalances             EmployeeLeaveBalance[]
  leaveRequests             EmployeeLeaveRequest[]        @relation("EmployeeLeaveRequestOwner")
  managedLeaveRequests      EmployeeLeaveRequest[]        @relation("EmployeeLeaveRequestManager")
  replacementLeaveRequests  EmployeeLeaveRequest[]        @relation("EmployeeLeaveRequestReplacement")
  leaveApprovals            EmployeeLeaveApproval[]
  uploadedLeaveDocuments    EmployeeLeaveDocument[]
  leaveEvents               LeaveRequestEvent[]
  leaveComplianceCases      LeaveComplianceAlert[]        @relation("LeaveComplianceEmployee")
  resolvedLeaveCompliance   LeaveComplianceAlert[]        @relation("LeaveComplianceResolver")
  leavePayrollImpacts       LeavePayrollImpact[]
}
```

## 8. Flux de calcul recommandés

### 8.1 Acquisition annuelle

Une tâche périodique ou un calcul métier doit :
- ouvrir le solde annuel
- calculer `earned`
- calculer `carryForward`
- calculer `expired`
- recalculer `available`

### 8.2 À la soumission d'une demande

Le service doit :
- vérifier la politique
- calculer le nombre d'unités
- réserver la quantité en `pending`
- créer les étapes d'approbation
- journaliser l'événement

### 8.3 À l'approbation finale

Le service doit :
- déplacer `pending` vers `used`
- recalculer `available`
- créer l'impact paie
- créer les alertes de conformité si besoin

### 8.4 À l'annulation

Le service doit :
- libérer les quantités
- journaliser
- annuler l'impact paie si non traité

## 9. Priorité d'implémentation

### Phase 1

Implémenter :
- `tenantId` sur les 4 tables existantes
- `LeavePolicy`
- enrichissement de `LeaveType`
- enrichissement de `EmployeeLeaveRequest`
- `EmployeeLeaveDocument`
- `LeaveRequestEvent`
- `LeaveHoliday`

### Phase 2

Implémenter :
- `LeaveComplianceAlert`
- `LeavePayrollImpact`
- correctifs automatiques et recalcul avancé

## 10. Recommandation finale

Pour ce projet, je recommande :
- de ne pas supprimer les tables existantes
- de les migrer vers une version multi-tenant et plus métier
- d'ajouter ensuite les briques conformité et paie

La meilleure suite après ce document est :

1. préparer la migration Prisma réelle du module congés
2. créer les routes backend `leave`
3. brancher le front `Leave` sur ces endpoints
