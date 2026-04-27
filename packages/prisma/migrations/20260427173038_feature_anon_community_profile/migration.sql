-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('SYSTEM', 'OFFICER', 'USER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventKind" ADD VALUE 'USER_UPDATE';
ALTER TYPE "EventKind" ADD VALUE 'COMMUNITY_NOTICE';

-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locality" TEXT;

-- AlterTable
ALTER TABLE "NoticeEvent" ADD COLUMN     "message" TEXT,
ADD COLUMN     "source" "EventSource" NOT NULL DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CommunityGrievance" (
    "id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "locality" TEXT,
    "category" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'PENDING',
    "count" INTEGER NOT NULL DEFAULT 0,
    "officerId" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGrievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGrievanceMember" (
    "id" TEXT NOT NULL,
    "communityGrievanceId" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGrievanceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityGrievance_pin_category_idx" ON "CommunityGrievance"("pin", "category");

-- CreateIndex
CREATE INDEX "CommunityGrievance_status_idx" ON "CommunityGrievance"("status");

-- CreateIndex
CREATE INDEX "CommunityGrievanceMember_communityGrievanceId_idx" ON "CommunityGrievanceMember"("communityGrievanceId");

-- CreateIndex
CREATE INDEX "CommunityGrievanceMember_grievanceId_idx" ON "CommunityGrievanceMember"("grievanceId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGrievanceMember_communityGrievanceId_grievanceId_key" ON "CommunityGrievanceMember"("communityGrievanceId", "grievanceId");

-- CreateIndex
CREATE INDEX "Grievance_pin_category_idx" ON "Grievance"("pin", "category");

-- CreateIndex
CREATE INDEX "Grievance_isAnonymous_idx" ON "Grievance"("isAnonymous");

-- AddForeignKey
ALTER TABLE "CommunityGrievanceMember" ADD CONSTRAINT "CommunityGrievanceMember_communityGrievanceId_fkey" FOREIGN KEY ("communityGrievanceId") REFERENCES "CommunityGrievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGrievanceMember" ADD CONSTRAINT "CommunityGrievanceMember_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
