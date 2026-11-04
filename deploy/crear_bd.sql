-- Ejecutar como root de MySQL. Cambie la contraseña.
CREATE DATABASE IF NOT EXISTS publicaciones_fi CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'pubfi_app'@'localhost' IDENTIFIED BY 'CAMBIAR_CONTRASENA';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON publicaciones_fi.* TO 'pubfi_app'@'localhost';
FLUSH PRIVILEGES;
