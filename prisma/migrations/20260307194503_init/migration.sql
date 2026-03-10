-- CreateTable
CREATE TABLE `boleto` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `cotizacion_id` INTEGER UNSIGNED NOT NULL,
    `reemplaza_boleto_id` INTEGER UNSIGNED NULL,
    `estado_actual_id` INTEGER UNSIGNED NOT NULL,
    `aerolinea` VARCHAR(100) NULL,
    `codigo_reserva` VARCHAR(20) NULL,
    `numero_tiquete` VARCHAR(50) NULL,
    `url_archivo_adjunto` TEXT NULL,
    `valor_final` DECIMAL(14, 2) NULL,
    `fecha_compra` DATE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `closed_at` TIMESTAMP(0) NULL,

    INDEX `fk_boleto_estado`(`estado_actual_id`),
    INDEX `fk_boleto_reemplaza`(`reemplaza_boleto_id`),
    INDEX `idx_boleto_cotizacion`(`cotizacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cotizacion` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER UNSIGNED NOT NULL,
    `cotizacion_anterior_id` INTEGER UNSIGNED NULL,
    `estado_actual_id` INTEGER UNSIGNED NOT NULL,
    `cobertura` VARCHAR(30) NULL,
    `valor_total` DECIMAL(14, 2) NOT NULL,
    `aerolinea` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `closed_at` TIMESTAMP(0) NULL,

    INDEX `fk_cotizacion_anterior`(`cotizacion_anterior_id`),
    INDEX `fk_cotizacion_estado`(`estado_actual_id`),
    INDEX `idx_cotizacion_solicitud`(`solicitud_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estado_boleto` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `estado` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `editable` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estado_cotizacion` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `estado` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `editable` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estado_solicitud` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `estado` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `color_hexa_main` VARCHAR(10) NULL,
    `color_hexa_sec` VARCHAR(10) NULL,
    `editable` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_estado_boleto` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `boleto_id` INTEGER UNSIGNED NOT NULL,
    `estado_id` INTEGER UNSIGNED NOT NULL,
    `usuario_id` INTEGER UNSIGNED NOT NULL,
    `observacion` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_hist_boleto`(`boleto_id`),
    INDEX `fk_hist_boleto_estado`(`estado_id`),
    INDEX `fk_hist_boleto_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_estado_cotizacion` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `cotizacion_id` INTEGER UNSIGNED NOT NULL,
    `estado_id` INTEGER UNSIGNED NOT NULL,
    `usuario_id` INTEGER UNSIGNED NOT NULL,
    `observacion` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_hist_cotizacion`(`cotizacion_id`),
    INDEX `fk_hist_cotizacion_estado`(`estado_id`),
    INDEX `fk_hist_cotizacion_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_estado_solicitud` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER UNSIGNED NOT NULL,
    `estado_id` INTEGER UNSIGNED NOT NULL,
    `usuario_id` INTEGER UNSIGNED NOT NULL,
    `observacion` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_hist_solicitud`(`solicitud_id`),
    INDEX `fk_hist_solicitud_estado`(`estado_id`),
    INDEX `fk_hist_solicitud_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `radicado` VARCHAR(100) NULL,
    `usuario_id` INTEGER UNSIGNED NOT NULL,
    `estado_actual_id` INTEGER UNSIGNED NOT NULL,
    `tipo_de_vuelo` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `closed_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `radicado`(`radicado`),
    INDEX `fk_solicitud_estado`(`estado_actual_id`),
    INDEX `idx_solicitud_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `numero_documento` VARCHAR(50) NOT NULL,
    `cod_empleado` VARCHAR(50) NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` TEXT NOT NULL,
    `rol` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `disabled_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalle_vuelo_solicitud` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `solicitud_id` INTEGER UNSIGNED NOT NULL,
    `preferencia_aerolinea` VARCHAR(100) NULL,
    `origen` VARCHAR(100) NOT NULL,
    `destino` VARCHAR(100) NOT NULL,
    `fecha_ida` DATE NOT NULL,
    `fecha_vuelta` DATE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_detalle_solicitud`(`solicitud_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `segmento_cotizacion` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `cotizacion_id` INTEGER UNSIGNED NOT NULL,
    `tipo_segmento` ENUM('IDA', 'VUELTA') NOT NULL,
    `numero_vuelo` VARCHAR(20) NOT NULL,
    `fecha_vuelo` DATETIME(0) NOT NULL,
    `clase_tarifaria` VARCHAR(50) NULL,
    `politica_equipaje` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_segmento_cotizacion`(`cotizacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `boleto` ADD CONSTRAINT `fk_boleto_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizacion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `boleto` ADD CONSTRAINT `fk_boleto_estado` FOREIGN KEY (`estado_actual_id`) REFERENCES `estado_boleto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `boleto` ADD CONSTRAINT `fk_boleto_reemplaza` FOREIGN KEY (`reemplaza_boleto_id`) REFERENCES `boleto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_anterior` FOREIGN KEY (`cotizacion_anterior_id`) REFERENCES `cotizacion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_estado` FOREIGN KEY (`estado_actual_id`) REFERENCES `estado_cotizacion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cotizacion` ADD CONSTRAINT `fk_cotizacion_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_boleto` ADD CONSTRAINT `fk_hist_boleto` FOREIGN KEY (`boleto_id`) REFERENCES `boleto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_boleto` ADD CONSTRAINT `fk_hist_boleto_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_boleto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_boleto` ADD CONSTRAINT `fk_hist_boleto_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_cotizacion` ADD CONSTRAINT `fk_hist_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizacion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_cotizacion` ADD CONSTRAINT `fk_hist_cotizacion_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_cotizacion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_cotizacion` ADD CONSTRAINT `fk_hist_cotizacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_solicitud` ADD CONSTRAINT `fk_hist_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_solicitud` ADD CONSTRAINT `fk_hist_solicitud_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_solicitud`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `historial_estado_solicitud` ADD CONSTRAINT `fk_hist_solicitud_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_solicitud_estado` FOREIGN KEY (`estado_actual_id`) REFERENCES `estado_solicitud`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_solicitud_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `detalle_vuelo_solicitud` ADD CONSTRAINT `fk_detalle_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `segmento_cotizacion` ADD CONSTRAINT `fk_segmento_cotizacion` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizacion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
