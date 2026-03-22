/*
  Warnings:

  - You are about to drop the column `color_hexa_main` on the `estado_solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `color_hexa_sec` on the `estado_solicitud` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `estado_solicitud` DROP COLUMN `color_hexa_main`,
    DROP COLUMN `color_hexa_sec`;
