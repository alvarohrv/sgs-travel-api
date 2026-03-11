-- CreateTable
CREATE TABLE `segmento_boleto` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `boleto_id` INTEGER UNSIGNED NOT NULL,
    `tipo_segmento` ENUM('IDA', 'VUELTA') NOT NULL,
    `numero_vuelo` VARCHAR(20) NOT NULL,
    `fecha_vuelo` DATETIME(0) NOT NULL,
    `clase_tarifaria` VARCHAR(50) NULL,
    `politica_equipaje` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_segmento_boleto`(`boleto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `segmento_boleto` ADD CONSTRAINT `fk_segmento_boleto` FOREIGN KEY (`boleto_id`) REFERENCES `boleto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
