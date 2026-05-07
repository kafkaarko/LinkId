/*
  Warnings:

  - You are about to drop the column `expriesAt` on the `Link` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[host]` on the table `Domain` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `Domain` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "isVerified" BOOLEAN DEFAULT false,
ADD COLUMN     "verificationToken" TEXT,
ALTER COLUMN "host" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Link" DROP COLUMN "expriesAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Domain_host_key" ON "Domain"("host");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_verificationToken_key" ON "Domain"("verificationToken");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
