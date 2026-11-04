-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `rol_id` INTEGER NOT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `ultimo_acceso` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    INDEX `usuarios_rol_id_idx`(`rol_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `codigo` VARCHAR(20) NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `programas_nombre_key`(`nombre`),
    UNIQUE INDEX `programas_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `tipo_autor` ENUM('estudiante', 'docente', 'egresado', 'externo') NOT NULL,
    `correo` VARCHAR(150) NULL,
    `orcid` VARCHAR(19) NULL,
    `institucion` VARCHAR(200) NULL,
    `programa_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `autores_orcid_key`(`orcid`),
    INDEX `autores_apellidos_nombres_idx`(`apellidos`, `nombres`),
    INDEX `autores_programa_id_idx`(`programa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipos_publicacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',

    UNIQUE INDEX `tipos_publicacion_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revistas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `editorial` VARCHAR(200) NULL,
    `issn_impreso` VARCHAR(9) NULL,
    `issn_electronico` VARCHAR(9) NULL,
    `pais` VARCHAR(100) NULL,
    `url_revista` VARCHAR(500) NULL,
    `indexacion` VARCHAR(255) NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `revistas_nombre_idx`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publicaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(500) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `resumen` TEXT NULL,
    `idioma` VARCHAR(10) NOT NULL DEFAULT 'es',
    `tipo_publicacion_id` INTEGER NOT NULL,
    `revista_id` INTEGER NULL,
    `programa_id` INTEGER NULL,
    `anio_publicacion` SMALLINT NOT NULL,
    `fecha_publicacion` DATE NULL,
    `volumen` VARCHAR(20) NULL,
    `numero` VARCHAR(20) NULL,
    `paginas` VARCHAR(30) NULL,
    `doi` VARCHAR(191) NULL,
    `url_publicacion` VARCHAR(500) NULL,
    `estado` ENUM('borrador', 'revision', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',
    `destacado` BOOLEAN NOT NULL DEFAULT false,
    `creado_por` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `publicaciones_slug_key`(`slug`),
    UNIQUE INDEX `publicaciones_doi_key`(`doi`),
    INDEX `publicaciones_titulo_idx`(`titulo`),
    INDEX `publicaciones_anio_publicacion_idx`(`anio_publicacion`),
    INDEX `publicaciones_estado_idx`(`estado`),
    INDEX `publicaciones_revista_id_idx`(`revista_id`),
    INDEX `publicaciones_tipo_publicacion_id_idx`(`tipo_publicacion_id`),
    INDEX `publicaciones_programa_id_idx`(`programa_id`),
    INDEX `publicaciones_estado_anio_publicacion_idx`(`estado`, `anio_publicacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publicaciones_autores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `publicacion_id` INTEGER NOT NULL,
    `autor_id` INTEGER NOT NULL,
    `orden_autoria` SMALLINT NOT NULL,
    `es_autor_correspondencia` BOOLEAN NOT NULL DEFAULT false,

    INDEX `publicaciones_autores_autor_id_idx`(`autor_id`),
    UNIQUE INDEX `publicaciones_autores_publicacion_id_autor_id_key`(`publicacion_id`, `autor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `palabras_clave` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `palabras_clave_slug_key`(`slug`),
    INDEX `palabras_clave_nombre_idx`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publicaciones_palabras_clave` (
    `publicacion_id` INTEGER NOT NULL,
    `palabra_clave_id` INTEGER NOT NULL,

    INDEX `publicaciones_palabras_clave_palabra_clave_id_idx`(`palabra_clave_id`),
    PRIMARY KEY (`publicacion_id`, `palabra_clave_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lineas_investigacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',

    UNIQUE INDEX `lineas_investigacion_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publicaciones_lineas` (
    `publicacion_id` INTEGER NOT NULL,
    `linea_id` INTEGER NOT NULL,

    INDEX `publicaciones_lineas_linea_id_idx`(`linea_id`),
    PRIMARY KEY (`publicacion_id`, `linea_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archivos_publicacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `publicacion_id` INTEGER NOT NULL,
    `nombre_original` VARCHAR(255) NOT NULL,
    `ruta_archivo` VARCHAR(255) NOT NULL,
    `tipo_mime` VARCHAR(100) NOT NULL,
    `tamano` INTEGER NOT NULL,
    `tipo_archivo` ENUM('pdf', 'portada', 'otro') NOT NULL DEFAULT 'pdf',
    `autorizado_publico` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `archivos_publicacion_publicacion_id_idx`(`publicacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bitacora` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NULL,
    `accion` VARCHAR(50) NOT NULL,
    `entidad` VARCHAR(50) NOT NULL,
    `registro_id` INTEGER NULL,
    `detalle` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bitacora_usuario_id_idx`(`usuario_id`),
    INDEX `bitacora_entidad_registro_id_idx`(`entidad`, `registro_id`),
    INDEX `bitacora_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autores` ADD CONSTRAINT `autores_programa_id_fkey` FOREIGN KEY (`programa_id`) REFERENCES `programas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones` ADD CONSTRAINT `publicaciones_tipo_publicacion_id_fkey` FOREIGN KEY (`tipo_publicacion_id`) REFERENCES `tipos_publicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones` ADD CONSTRAINT `publicaciones_revista_id_fkey` FOREIGN KEY (`revista_id`) REFERENCES `revistas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones` ADD CONSTRAINT `publicaciones_programa_id_fkey` FOREIGN KEY (`programa_id`) REFERENCES `programas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones` ADD CONSTRAINT `publicaciones_creado_por_fkey` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones_autores` ADD CONSTRAINT `publicaciones_autores_publicacion_id_fkey` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones_autores` ADD CONSTRAINT `publicaciones_autores_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `autores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones_palabras_clave` ADD CONSTRAINT `publicaciones_palabras_clave_publicacion_id_fkey` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones_palabras_clave` ADD CONSTRAINT `publicaciones_palabras_clave_palabra_clave_id_fkey` FOREIGN KEY (`palabra_clave_id`) REFERENCES `palabras_clave`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones_lineas` ADD CONSTRAINT `publicaciones_lineas_publicacion_id_fkey` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publicaciones_lineas` ADD CONSTRAINT `publicaciones_lineas_linea_id_fkey` FOREIGN KEY (`linea_id`) REFERENCES `lineas_investigacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archivos_publicacion` ADD CONSTRAINT `archivos_publicacion_publicacion_id_fkey` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bitacora` ADD CONSTRAINT `bitacora_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

