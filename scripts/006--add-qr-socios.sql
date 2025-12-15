use MundoFitness;

IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Socios' 
    AND COLUMN_NAME = 'CodigoQR'
)
BEGIN

    ALTER TABLE Socios
    ADD CodigoQR NVARCHAR(255) NULL; 
    
    PRINT 'Columna CodigoQR añadida a la tabla Socios.';
END
ELSE
BEGIN
    PRINT 'La columna CodigoQR ya existe en la tabla Socios.';
END

TRUNCATE TABLE Socios;

UPDATE Socios
SET CodigoQR = 'QR-' + RUT + '-' + CONVERT(NVARCHAR(50), DATEDIFF(SECOND, '1970-01-01', GETUTCDATE())) + CONVERT(NVARCHAR(50), SocioID)

WHERE CodigoQR IS NULL OR CodigoQR = '';

-- Opcional: Verifica el resultado
SELECT SocioID, RUT, CodigoQR
FROM Socios
WHERE CodigoQR LIKE 'QR-%' AND CodigoQR IS NOT NULL;