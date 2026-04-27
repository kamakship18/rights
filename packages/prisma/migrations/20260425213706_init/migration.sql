-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('PENDING', 'FILED', 'FOLLOWED_UP', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('FILED', 'FOLLOWUP_7D', 'ESCALATION_14D', 'SOS_BROADCAST');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "primaryPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jurisdictionPin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "statute" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'PENDING',
    "pin" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "filedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeEvent" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL,
    "channel" "Channel" NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "Officer_jurisdictionPin_department_idx" ON "Officer"("jurisdictionPin", "department");

-- CreateIndex
CREATE INDEX "Officer_parentId_idx" ON "Officer"("parentId");

-- CreateIndex
CREATE INDEX "Grievance_userId_status_idx" ON "Grievance"("userId", "status");

-- CreateIndex
CREATE INDEX "Grievance_officerId_idx" ON "Grievance"("officerId");

-- CreateIndex
CREATE INDEX "Grievance_pin_idx" ON "Grievance"("pin");

-- CreateIndex
CREATE INDEX "NoticeEvent_grievanceId_kind_idx" ON "NoticeEvent"("grievanceId", "kind");

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeEvent" ADD CONSTRAINT "NoticeEvent_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
