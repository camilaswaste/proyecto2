-- Script para agregar campos de duración a la tabla Clases
USE MundoFitness;
GO

-- Agregar columnas para manejar clases temporales e indefinidas
ALTER TABLE Clases
ADD TipoClase NVARCHAR(20) CHECK (TipoClase IN ('Temporal', 'Indefinida')) DEFAULT 'Indefinida',
    NumeroSemanas INT NULL,
    FechaInicio DATE NULL,
    FechaFin DATE NULL;
GO

-- Actualizar clases existentes para que sean indefinidas
UPDATE Clases
SET TipoClase = 'Indefinida',
    FechaInicio = CAST(FechaCreacion AS DATE)
WHERE TipoClase IS NULL;
GO
