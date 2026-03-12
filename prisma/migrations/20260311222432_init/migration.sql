/*
  Warnings:

  - You are about to drop the column `aerolinea` on the `cotizacion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cotizacion` DROP COLUMN `aerolinea`;

-- AlterTable
ALTER TABLE `segmento_cotizacion` ADD COLUMN `aerolinea` VARCHAR(100) NULL,
    MODIFY `tipo_segmento` ENUM('IDA', 'VUELTA', 'ESCALA') NOT NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `updated_at` TIMESTAMP(0) NULL;
