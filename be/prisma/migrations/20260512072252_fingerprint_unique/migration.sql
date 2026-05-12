/*
  Warnings:

  - Made the column `fingerprint` on table `Click` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Click" ALTER COLUMN "fingerprint" SET NOT NULL;
