-- AlterTable
ALTER TABLE "NoticeEvent" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "grievanceId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "NoticeEvent_userId_kind_idx" ON "NoticeEvent"("userId", "kind");

-- AddForeignKey
ALTER TABLE "NoticeEvent" ADD CONSTRAINT "NoticeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
