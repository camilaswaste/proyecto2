-- Script para agregar tabla de Sesiones Personales de Entrenamiento
-- Esta tabla permite que los socios agenden sesiones individuales con entrenadores

USE MundoFitness;
GO

-- Tabla de Sesiones Personales de Entrenamiento
CREATE TABLE SesionesPersonales (
    SesionID INT PRIMARY KEY IDENTITY(1,1),
    EntrenadorID INT NOT NULL,
    SocioID INT NOT NULL,
    FechaSesion DATE NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    Estado NVARCHAR(20) CHECK (Estado IN ('Agendada', 'Completada', 'Cancelada', 'NoAsistio')) DEFAULT 'Agendada',
    Notas NVARCHAR(1000),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaModificacion DATETIME,
    UsuarioModificacion INT,
    FOREIGN KEY (EntrenadorID) REFERENCES Entrenadores(EntrenadorID),
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID),
    FOREIGN KEY (UsuarioModificacion) REFERENCES Usuarios(UsuarioID)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IX_SesionesPersonales_EntrenadorID ON SesionesPersonales(EntrenadorID);
CREATE INDEX IX_SesionesPersonales_SocioID ON SesionesPersonales(SocioID);
CREATE INDEX IX_SesionesPersonales_FechaSesion ON SesionesPersonales(FechaSesion);

GO
