-- Script para agregar StockMaximo a la tabla Inventario
-- Este script debe ejecutarse para actualizar la base de datos existente

-- Verificar si la columna StockMaximo ya existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE Name = N'StockMaximo' 
    AND Object_ID = Object_ID(N'Inventario')
)
BEGIN
    -- Agregar columna StockMaximo con valor por defecto 100
    ALTER TABLE Inventario 
    ADD StockMaximo INT NOT NULL DEFAULT 100;
    
    PRINT 'Columna StockMaximo agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'La columna StockMaximo ya existe';
END

-- Actualizar productos existentes con StockMaximo basado en el StockActual
UPDATE Inventario
SET StockMaximo = CASE 
    WHEN StockActual < 50 THEN 100
    WHEN StockActual < 100 THEN 200
    ELSE StockActual * 2
END
WHERE StockMaximo = 100;

PRINT 'Base de datos actualizada correctamente';
