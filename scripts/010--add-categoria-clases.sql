-- Agregar columna Categoria a la tabla Clases
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Clases' AND COLUMN_NAME = 'Categoria')
BEGIN
    ALTER TABLE Clases
    ADD Categoria NVARCHAR(50) NULL;
    
    PRINT 'Columna Categoria agregada exitosamente';
END
ELSE
BEGIN
    PRINT 'La columna Categoria ya existe';
END;

-- Verificar la estructura actualizada
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Clases'
ORDER BY ORDINAL_POSITION;
