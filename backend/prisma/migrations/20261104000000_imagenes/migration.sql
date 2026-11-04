-- Imagen principal de la publicación y foto del autor (WebP optimizado en varios tamaños)
ALTER TABLE `publicaciones` ADD COLUMN `imagen` VARCHAR(64) NULL;
ALTER TABLE `autores` ADD COLUMN `foto` VARCHAR(64) NULL;
