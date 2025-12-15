-- Agregando validación para evitar error de columnas duplicadas
-- Verificar y agregar FechaInicio si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Clases' AND COLUMN_NAME = 'FechaInicio')
BEGIN
    ALTER TABLE Clases
    ADD FechaInicio DATE NULL;
END

-- Verificar y agregar FechaFin si no existe
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Clases' AND COLUMN_NAME = 'FechaFin')
BEGIN
    ALTER TABLE Clases
    ADD FechaFin DATE NULL;
END

-- Actualizar clases existentes para que tengan un rango de 3 meses desde hoy
UPDATE Clases
SET FechaInicio = CAST(GETDATE() AS DATE),
    FechaFin = DATEADD(MONTH, 3, CAST(GETDATE() AS DATE))
WHERE FechaInicio IS NULL;
