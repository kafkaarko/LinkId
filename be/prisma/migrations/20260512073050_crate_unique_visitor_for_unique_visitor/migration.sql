/*
  Warnings:

  - You are about to drop the column `fingerprint` on the `Click` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Click_fingerprint_key";

-- AlterTable
ALTER TABLE "Click" DROP COLUMN "fingerprint";

-- CreateTable
CREATE TABLE "UniqueVisitor" (
    "id" SERIAL NOT NULL,
    "linkId" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "visitedDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniqueVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueVisitor_fingerprint_visitedDate_key" ON "UniqueVisitor"("fingerprint", "visitedDate");
