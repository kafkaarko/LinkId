/*
  Warnings:

  - A unique constraint covering the columns `[linkId,ipAddress,userAgent]` on the table `Click` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Click_linkId_idx" ON "Click"("linkId");

-- CreateIndex
CREATE INDEX "Click_clickedAt_idx" ON "Click"("clickedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Click_linkId_ipAddress_userAgent_key" ON "Click"("linkId", "ipAddress", "userAgent");

-- CreateIndex
CREATE INDEX "Link_userId_idx" ON "Link"("userId");

-- CreateIndex
CREATE INDEX "Link_createdAt_idx" ON "Link"("createdAt");
