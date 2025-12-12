-- Tabla de Comprobantes (para gestionar comprobantes de pagos)
CREATE TABLE Comprobantes (
    ComprobanteID INT PRIMARY KEY IDENTITY(1,1),
    PagoID INT NOT NULL,
    SocioID INT NOT NULL,
    MembresíaID INT,
    NumeroComprobante NVARCHAR(50) NOT NULL UNIQUE,
    FechaEmision DATETIME DEFAULT GETDATE(),
    MontoPago DECIMAL(10,2) NOT NULL,
    MedioPago NVARCHAR(50) NOT NULL,
    NombreSocio NVARCHAR(200) NOT NULL,
    EmailSocio NVARCHAR(255),
    TelefonoSocio NVARCHAR(20),
    NombrePlan NVARCHAR(100),
    DuracionPlan INT,
    FechaInicio DATE,
    FechaVencimiento DATE,
    UsuarioRegistro INT,
    Concepto NVARCHAR(255),
    Estado NVARCHAR(20) DEFAULT 'Emitido',
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (PagoID) REFERENCES Pagos(PagoID),
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID),
    FOREIGN KEY (MembresíaID) REFERENCES Membresías(MembresíaID),
    FOREIGN KEY (UsuarioRegistro) REFERENCES Usuarios(UsuarioID)
);

-- Índice para mejora de rendimiento
CREATE INDEX IX_Comprobantes_PagoID ON Comprobantes(PagoID);
CREATE INDEX IX_Comprobantes_SocioID ON Comprobantes(SocioID);
CREATE INDEX IX_Comprobantes_NumeroComprobante ON Comprobantes(NumeroComprobante);

GO