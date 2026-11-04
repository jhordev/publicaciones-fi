-- Ajustes generales del portal (clave → valor JSON)
CREATE TABLE `configuracion` (
    `clave` VARCHAR(100) NOT NULL,
    `valor` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
