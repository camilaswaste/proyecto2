CREATE TABLE Ventas (
    VentaID INT PRIMARY KEY IDENTITY(1,1),
    SocioID INT NULL, -- NULL si es venta al público (no socio)
    FechaVenta DATETIME NOT NULL DEFAULT GETDATE(),
    MontoTotal DECIMAL(10,2) NOT NULL,
    MetodoPago NVARCHAR(50) NOT NULL CHECK (MetodoPago IN ('Efectivo', 'Tarjeta', 'Transferencia')),
    UsuarioRegistro INT NOT NULL, -- Quién realizó la venta
    
    -- Campos de Comprobante/Referencia
    NumeroComprobante NVARCHAR(50) UNIQUE,
    TipoVenta NVARCHAR(50) NOT NULL DEFAULT 'Producto', -- Para distinguir de pagos de membresía si los mezclas en reportes
    
    -- Restricciones
    FOREIGN KEY (SocioID) REFERENCES Socios(SocioID),
    FOREIGN KEY (UsuarioRegistro) REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE DetalleVenta (
    DetalleID INT PRIMARY KEY IDENTITY(1,1),
    VentaID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad INT NOT NULL CHECK (Cantidad > 0),
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    
    -- Restricciones
    FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
    FOREIGN KEY (ProductoID) REFERENCES Inventario(ProductoID),
    
    -- Asegura que un producto solo aparezca una vez por venta (opcional)
    UNIQUE (VentaID, ProductoID) 
);

-- 1. Permitir que Comprobantes se vincule a PagoID O VentaID.
--    Hacemos PagoID opcional, ya que si es una venta de producto, el PagoID será NULL.
ALTER TABLE Comprobantes
ALTER COLUMN PagoID INT NULL;

-- 2. Permitir el registro de Ventas (añadir la columna VentaID).
ALTER TABLE Comprobantes
ADD VentaID INT NULL; 

-- 3. Permitir ventas "al público" (SocioID = NULL), que ocurre en las ventas de productos.
--    Si el SocioID es NOT NULL, la inserción de una Venta al Público fallará.
ALTER TABLE Comprobantes
ALTER COLUMN SocioID INT NULL; 

-- 4. Opcional, pero recomendado: Asegurar que MembresíaID también sea NULLable (ya lo es según tu DDL, pero se reconfirma)
ALTER TABLE Comprobantes
ALTER COLUMN MembresíaID INT NULL;


ALTER TABLE Ventas
ADD ComprobantePath NVARCHAR(MAX) NULL;
-- 5. Opcional: Eliminar la restricción NOT NULL si existe alguna que impide la mutua exclusividad.
-- La aplicación (el código TypeScript) debe garantizar que solo uno de los dos (PagoID o VentaID) sea no nulo.