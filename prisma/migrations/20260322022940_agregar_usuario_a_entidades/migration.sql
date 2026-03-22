/*
  Warnings:

  - You are about to drop the column `closed_at` on the `usuario` table. All the data in the column will be lost.
  - Added the required column `emitido_usuario_id` to the `boleto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cargada_usuario_id` to the `cotizacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `boleto` ADD COLUMN `emitido_usuario_id` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `cotizacion` ADD COLUMN `cargada_usuario_id` INTEGER UNSIGNED NOT NULL;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `closed_at`,
    ADD COLUMN `disabled_at` TIMESTAMP(0) NULL;

-- CreateIndex
CREATE INDEX `idx_boleto_usuario` ON `boleto`(`emitido_usuario_id`);

-- CreateIndex
CREATE INDEX `idx_cotizacion_usuario` ON `cotizacion`(`cargada_usuario_id`);

-- AddForeignKey
ALTER TABLE `boleto` ADD CONSTRAINT `fk_boleto_usuario` FOREIGN KEY (`emitido_usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_usuario` FOREIGN KEY (`cargada_usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
