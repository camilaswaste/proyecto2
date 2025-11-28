-- Script para agregar la columna RequiereCambioPassword a las tablas
-- Este script debe ejecutarse en la base de datos SQL Server

USE MundoFitness;
GO

-- Agregar columna RequiereCambioPassword a la tabla Usuarios
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Usuarios') AND name = 'RequiereCambioPassword')
BEGIN
    ALTER TABLE Usuarios
    ADD RequiereCambioPassword BIT NOT NULL DEFAULT 0;
    
    PRINT 'Columna RequiereCambioPassword agregada a la tabla Usuarios';
END
ELSE
BEGIN
    PRINT 'La columna RequiereCambioPassword ya existe en la tabla Usuarios';
END
GO

-- Agregar columna RequiereCambioPassword a la tabla Socios
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Socios') AND name = 'RequiereCambioPassword')
BEGIN
    ALTER TABLE Socios
    ADD RequiereCambioPassword BIT NOT NULL DEFAULT 0;
    
    PRINT 'Columna RequiereCambioPassword agregada a la tabla Socios';
END
ELSE
BEGIN
    PRINT 'La columna RequiereCambioPassword ya existe en la tabla Socios';
END
GO

-- Crear índices para mejorar el rendimiento de las consultas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_RequiereCambioPassword' AND object_id = OBJECT_ID('Usuarios'))
BEGIN
    CREATE INDEX IX_Usuarios_RequiereCambioPassword ON Usuarios(RequiereCambioPassword);
    PRINT 'Índice IX_Usuarios_RequiereCambioPassword creado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Socios_RequiereCambioPassword' AND object_id = OBJECT_ID('Socios'))
BEGIN
    CREATE INDEX IX_Socios_RequiereCambioPassword ON Socios(RequiereCambioPassword);
    PRINT 'Índice IX_Socios_RequiereCambioPassword creado';
END
GO

PRINT 'Script completado exitosamente';
GO
