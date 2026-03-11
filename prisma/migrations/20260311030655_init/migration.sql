/*
  Warnings:

  - You are about to drop the column `aerolinea` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `closed_at` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `codigo_reserva` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_compra` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `numero_tiquete` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `url_archivo_adjunto` on the `boleto` table. All the data in the column will be lost.
  - You are about to drop the column `closed_at` on the `cotizacion` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `cotizacion` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `cotizacion` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `detalle_vuelo_solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `estado_boleto` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `estado_cotizacion` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `estado_solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `historial_estado_boleto` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `historial_estado_cotizacion` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `historial_estado_solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `segmento_boleto` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `segmento_cotizacion` table. All the data in the column will be lost.
  - You are about to drop the column `closed_at` on the `solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `solicitud` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `disabled_at` on the `usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numero_documento]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cod_empleado]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[correo]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `estado_id` to the `segmento_boleto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correo` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `boleto` DROP COLUMN `aerolinea`,
    DROP COLUMN `closed_at`,
    DROP COLUMN `codigo_reserva`,
    DROP COLUMN `created_at`,
    DROP COLUMN `fecha_compra`,
    DROP COLUMN `numero_tiquete`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `url_archivo_adjunto`,
    MODIFY `cobertura` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `cotizacion` DROP COLUMN `closed_at`,
    DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`;

-- AlterTable
ALTER TABLE `detalle_vuelo_solicitud` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `estado_boleto` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `estado_cotizacion` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `estado_solicitud` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `historial_estado_boleto` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `historial_estado_cotizacion` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `historial_estado_solicitud` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `segmento_boleto` DROP COLUMN `created_at`,
    ADD COLUMN `aerolinea` VARCHAR(100) NULL,
    ADD COLUMN `codigo_reserva` VARCHAR(20) NULL,
    ADD COLUMN `estado_id` INTEGER UNSIGNED NOT NULL,
    ADD COLUMN `fecha_compra` DATE NULL,
    ADD COLUMN `numero_tiquete` VARCHAR(50) NULL,
    ADD COLUMN `url_archivo_adjunto` TEXT NULL,
    MODIFY `tipo_segmento` ENUM('IDA', 'VUELTA', 'ESCALA') NOT NULL;

-- AlterTable
ALTER TABLE `segmento_cotizacion` DROP COLUMN `created_at`;

-- AlterTable
ALTER TABLE `solicitud` DROP COLUMN `closed_at`,
    DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `created_at`,
    DROP COLUMN `disabled_at`,
    ADD COLUMN `correo` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `estado_segmento_boleto` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `estado` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `editable` BOOLEAN NULL DEFAULT true,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_segmento_estado` ON `segmento_boleto`(`estado_id`);

-- CreateIndex
CREATE UNIQUE INDEX `numero_documento` ON `usuario`(`numero_documento`);

-- CreateIndex
CREATE UNIQUE INDEX `cod_empleado` ON `usuario`(`cod_empleado`);

-- CreateIndex
CREATE UNIQUE INDEX `correo` ON `usuario`(`correo`);

-- AddForeignKey
ALTER TABLE `segmento_boleto` ADD CONSTRAINT `fk_segmento_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_segmento_boleto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
