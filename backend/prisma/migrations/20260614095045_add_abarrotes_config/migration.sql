-- CreateTable
CREATE TABLE "Inventario_Abarrotes" (
    "ProductoID" SERIAL NOT NULL,
    "SKU" TEXT,
    "Nombre" TEXT NOT NULL,
    "CantidadStock" INTEGER NOT NULL DEFAULT 0,
    "PrecioUnitario" DECIMAL(18,2) NOT NULL,
    "PuntoReorden" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Inventario_Abarrotes_pkey" PRIMARY KEY ("ProductoID")
);

-- CreateTable
CREATE TABLE "Inventario_Servicios" (
    "ServicioID" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "PrecioUnitario" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "Inventario_Servicios_pkey" PRIMARY KEY ("ServicioID")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "ConfiguracionID" INTEGER NOT NULL DEFAULT 1,
    "NombreNegocio" TEXT NOT NULL DEFAULT 'Kairon',
    "WhatsApp" TEXT NOT NULL DEFAULT '525512345678',
    "Horario" TEXT NOT NULL DEFAULT 'Lunes a Viernes 9am - 6pm',
    "FactorPuntosRopa" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "FactorPuntosPapeleria" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "FactorPuntosAbarrotes" DECIMAL(5,4) NOT NULL DEFAULT 0.02,
    "HabilitarRopa" BOOLEAN NOT NULL DEFAULT true,
    "HabilitarPapeleria" BOOLEAN NOT NULL DEFAULT true,
    "HabilitarAbarrotes" BOOLEAN NOT NULL DEFAULT true,
    "HabilitarServicios" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("ConfiguracionID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_Abarrotes_SKU_key" ON "Inventario_Abarrotes"("SKU");
