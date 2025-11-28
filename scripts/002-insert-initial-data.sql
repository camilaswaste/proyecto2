-- Script de datos iniciales para Mundo Fitness Chimbarongo

USE MundoFitness;
GO

-- Insertar Roles del Sistema
INSERT INTO Roles (NombreRol, Descripcion) VALUES
('Administrador', 'Acceso completo al sistema'),
('Entrenador', 'Gestión de clases y clientes asignados'),
('Recepcionista', 'Control de acceso y registro de pagos'),
('Socio', 'Acceso al portal de miembros');

-- Insertar Usuario Administrador por defecto
-- Password: Admin123! (debe ser hasheado en la aplicación)
INSERT INTO Usuarios (RolID, NombreUsuario, Email, PasswordHash, Nombre, Apellido, Telefono) VALUES
(1, 'admin', 'admin@mundofitness.cl', '$2b$10$placeholder', 'Administrador', 'Sistema', '912345678');

-- Insertar Planes de Membresía iniciales
INSERT INTO PlanesMembresía (NombrePlan, Descripcion, Precio, DuracionDias, TipoPlan, Beneficios) VALUES
('Mensual Básico', 'Acceso ilimitado al gimnasio por 30 días', 25000, 30, 'Normal', 'Acceso a todas las máquinas, Zona de pesas libre'),
('Trimestral', 'Acceso ilimitado por 90 días con descuento', 65000, 90, 'Normal', 'Acceso a todas las máquinas, Zona de pesas libre, 10% descuento'),
('Semestral', 'Acceso ilimitado por 180 días con mayor descuento', 120000, 180, 'Normal', 'Acceso a todas las máquinas, Zona de pesas libre, 20% descuento, 2 clases grupales gratis'),
('Anual Premium', 'Acceso ilimitado por 365 días con beneficios exclusivos', 200000, 365, 'Normal', 'Acceso total, Clases grupales ilimitadas, Evaluación física mensual, Nutricionista');

-- Insertar Categorías de Inventario
INSERT INTO CategoriasInventario (NombreCategoria, TipoCategoria, Descripcion) VALUES
('Bebidas', 'Venta', 'Bebidas energéticas y agua'),
('Suplementos', 'Venta', 'Proteínas y suplementos deportivos'),
('Snacks', 'Venta', 'Barras energéticas y snacks saludables'),
('Equipamiento', 'UsoInterno', 'Mancuernas, colchonetas, bandas'),
('Mantenimiento', 'UsoInterno', 'Productos de limpieza y mantenimiento');

GO
