/*
  Warnings:

  - You are about to drop the column `disabled_at` on the `usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `disabled_at`,
    ADD COLUMN `closed_at` TIMESTAMP(0) NULL;

-- CreateTable
CREATE TABLE `estadísticas_de_uso_demo` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `solicitudes_creadas` INTEGER UNSIGNED NULL DEFAULT 0,
    `cotizaciones_creadas` INTEGER UNSIGNED NULL DEFAULT 0,
    `boletos_creados` INTEGER UNSIGNED NULL DEFAULT 0,
    `ultima_actualizacion` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `estadísticas_de_uso_demo` ADD CONSTRAINT `estadísticas_de_uso_demo_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
