-- CreateEnum
CREATE TYPE "MODE" AS ENUM ('PERSONAL', 'DPD', 'MPM');

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "domainId" INTEGER,
ADD COLUMN     "expriesAt" TIMESTAMP(3),
ADD COLUMN     "mode" "MODE" DEFAULT 'PERSONAL';

-- CreateTable
CREATE TABLE "Domain" (
    "id" SERIAL NOT NULL,
    "host" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
