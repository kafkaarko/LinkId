/*
  Warnings:

  - A unique constraint covering the columns `[fingerprint]` on the table `Click` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Click_clickedAt_idx";

-- DropIndex
DROP INDEX "Click_linkId_idx";

-- DropIndex
DROP INDEX "Click_linkId_ipAddress_userAgent_key";

-- AlterTable
ALTER TABLE "Click" ADD COLUMN     "fingerprint" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Click_fingerprint_key" ON "Click"("fingerprint");

-- CreateIndex
CREATE INDEX "Click_linkId_clickedAt_idx" ON "Click"("linkId", "clickedAt");
