/*
  Warnings:

  - Made the column `cobertura` on table `boleto` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `boleto` MODIFY `cobertura` VARCHAR(20) NOT NULL;
