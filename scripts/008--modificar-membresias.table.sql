USE MundoFitness;
ALTER TABLE Membresías
ADD MotivoEstado NVARCHAR(255) NULL,
    FechaSuspension DATE NULL,
    DiasSuspension INT NULL;
