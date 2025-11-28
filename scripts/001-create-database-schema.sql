-- Script de creación de base de datos para Mundo Fitness Chimbarongo
-- Base de datos: MundoFitness
-- Servidor: AWS RDS SQL Server

USE MundoFitness;
GO

-- Tabla de Roles del Sistema
CREATE TABLE Roles (
    RolID INT PRIMARY KEY IDENTITY(1,1),
    NombreRol NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Activo BIT DEFAULT 1
);

-- Tabla de Usuarios del Sistema
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    RolID INT NOT NULL,
    NombreUsuario NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Telefono NVARCHAR(20),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    UltimoAcceso DATETIME,
    Activo BIT DEFAULT 1,
    FOREIGN KEY (RolID) REFERENCES Roles(RolID)
);

-- Tabla de Planes de Membresía
CREATE TABLE PlanesMembresía (
    PlanID INT PRIMARY KEY IDENTITY(1,1),
    NombrePlan NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500),
    Precio DECIMAL(10,2) NOT NULL,
    DuracionDias INT NOT NULL,
    TipoPlan NVARCHAR(20) CHECK (TipoPlan IN ('Normal', 'Oferta')) DEFAULT 'Normal',
    Descuento DECIMAL(5,2) DEFAULT 0,
    FechaInicioOferta DATE,
    FechaFinOferta DATE,
    Beneficios NVARCHAR(MAX),
    Activo BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE()
);

-- Tabla de Socios/Miembros
CREATE TABLE Socios (
    SocioID INT PRIMARY KEY IDENTITY(1,1),
    RUT NVARCHAR(12) NOT NULL UNIQUE,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    FechaNacimiento DATE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Telefono NVARCHAR(20),
    Direccion NVARCHAR(255),
    CodigoQR NVARCHAR(255) UNIQUE,
    PasswordHash NVARCHAR(255),
    EstadoSocio NVARCHAR(20) CHECK (EstadoSocio IN ('Activo', 'Suspendido', 'Moroso', 'Inactivo')) DEFAULT 'Activo',
    FechaRegistro DATETIME DEFAULT GETDATE(),
    FotoURL NVARCHAR(500),
    ContactoEmergencia NVARCHAR(100),
    TelefonoEmergencia NVARCHAR(20)
);

-- Tabla de Membresías (Asignación de planes a socios)
CREATE TABLE Membresías (
    MembresíaID INT PRIMARY KEY IDENTITY(1,1),
    SocioID INT NOT NULL,
    PlanID INT NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaVencimiento DATE NOT NULL,
    Estado NVARCHAR(20) CHECK (Estado IN ('Vigente', 'Vencida', 'Suspendida', 'Cancelada')) DEFAULT 'Vigente',
    MontoPagado DECIMAL(10,2) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID),
    FOREIGN KEY (PlanID) REFERENCES PlanesMembresía(PlanID)
);

-- Tabla de Pagos
CREATE TABLE Pagos (
    PagoID INT PRIMARY KEY IDENTITY(1,1),
    SocioID INT NOT NULL,
    MembresíaID INT,
    MontoPago DECIMAL(10,2) NOT NULL,
    MedioPago NVARCHAR(50) CHECK (MedioPago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Digital')) NOT NULL,
    FechaPago DATETIME DEFAULT GETDATE(),
    ComprobantePath NVARCHAR(500),
    NumeroComprobante NVARCHAR(50),
    Concepto NVARCHAR(255),
    UsuarioRegistro INT,
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID),
    FOREIGN KEY (MembresíaID) REFERENCES Membresías(MembresíaID),
    FOREIGN KEY (UsuarioRegistro) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Entrenadores
CREATE TABLE Entrenadores (
    EntrenadorID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    Especialidad NVARCHAR(255),
    Certificaciones NVARCHAR(MAX),
    Biografia NVARCHAR(1000),
    FotoURL NVARCHAR(500),
    Activo BIT DEFAULT 1,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Clases
CREATE TABLE Clases (
    ClaseID INT PRIMARY KEY IDENTITY(1,1),
    NombreClase NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500),
    EntrenadorID INT NOT NULL,
    DiaSemana NVARCHAR(20) NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    CupoMaximo INT NOT NULL,
    Activa BIT DEFAULT 1,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (EntrenadorID) REFERENCES Entrenadores(EntrenadorID)
);

-- Tabla de Reservas de Clases
CREATE TABLE ReservasClases (
    ReservaID INT PRIMARY KEY IDENTITY(1,1),
    ClaseID INT NOT NULL,
    SocioID INT NOT NULL,
    FechaClase DATE NOT NULL,
    Estado NVARCHAR(20) CHECK (Estado IN ('Reservada', 'Asistió', 'NoAsistió', 'Cancelada')) DEFAULT 'Reservada',
    FechaReserva DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ClaseID) REFERENCES Clases(ClaseID),
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID)
);

-- Tabla de Asistencia General (Ingreso al gimnasio)
CREATE TABLE Asistencias (
    AsistenciaID INT PRIMARY KEY IDENTITY(1,1),
    SocioID INT NOT NULL,
    FechaHoraIngreso DATETIME DEFAULT GETDATE(),
    FechaHoraSalida DATETIME,
    UsuarioRegistro INT,
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID),
    FOREIGN KEY (UsuarioRegistro) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Turnos del Personal
CREATE TABLE Turnos (
    TurnoID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    FechaTurno DATE NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NOT NULL,
    Rol NVARCHAR(100),
    Observaciones NVARCHAR(500),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Categorías de Inventario
CREATE TABLE CategoriasInventario (
    CategoriaID INT PRIMARY KEY IDENTITY(1,1),
    NombreCategoria NVARCHAR(100) NOT NULL,
    TipoCategoria NVARCHAR(20) CHECK (TipoCategoria IN ('Venta', 'UsoInterno')) NOT NULL,
    Descripcion NVARCHAR(255)
);

-- Tabla de Productos/Artículos de Inventario
CREATE TABLE Inventario (
    ProductoID INT PRIMARY KEY IDENTITY(1,1),
    CategoriaID INT NOT NULL,
    NombreProducto NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500),
    PrecioVenta DECIMAL(10,2),
    StockActual INT NOT NULL DEFAULT 0,
    StockMinimo INT NOT NULL DEFAULT 5,
    UnidadMedida NVARCHAR(20),
    Estado NVARCHAR(50),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoriaID) REFERENCES CategoriasInventario(CategoriaID)
);

-- Tabla de Movimientos de Inventario
CREATE TABLE MovimientosInventario (
    MovimientoID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    TipoMovimiento NVARCHAR(20) CHECK (TipoMovimiento IN ('Entrada', 'Salida', 'Ajuste')) NOT NULL,
    Cantidad INT NOT NULL,
    FechaMovimiento DATETIME DEFAULT GETDATE(),
    Motivo NVARCHAR(255),
    UsuarioRegistro INT,
    FOREIGN KEY (ProductoID) REFERENCES Inventario(ProductoID),
    FOREIGN KEY (UsuarioRegistro) REFERENCES Usuarios(UsuarioID)
);

-- Tabla de Notificaciones
CREATE TABLE Notificaciones (
    NotificacionID INT PRIMARY KEY IDENTITY(1,1),
    SocioID INT,
    Titulo NVARCHAR(200) NOT NULL,
    Mensaje NVARCHAR(1000) NOT NULL,
    TipoNotificacion NVARCHAR(50),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Leida BIT DEFAULT 0,
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
CREATE INDEX IX_Socios_RUT ON Socios(RUT);
CREATE INDEX IX_Socios_Email ON Socios(Email);
CREATE INDEX IX_Membresías_SocioID ON Membresías(SocioID);
CREATE INDEX IX_Pagos_SocioID ON Pagos(SocioID);
CREATE INDEX IX_Asistencias_SocioID ON Asistencias(SocioID);
CREATE INDEX IX_ReservasClases_SocioID ON ReservasClases(SocioID);

GO
