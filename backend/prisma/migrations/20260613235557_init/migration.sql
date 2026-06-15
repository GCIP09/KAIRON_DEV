/*
  Warnings:

  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaccion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaccion" DROP CONSTRAINT "Transaccion_clienteId_fkey";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "Producto";

-- DropTable
DROP TABLE "Transaccion";

-- CreateTable
CREATE TABLE "Roles" (
    "RoleID" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("RoleID")
);

-- CreateTable
CREATE TABLE "Permisos" (
    "PermisoID" SERIAL NOT NULL,
    "Slug_Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("PermisoID")
);

-- CreateTable
CREATE TABLE "Role_Permiso" (
    "RoleID" INTEGER NOT NULL,
    "PermisoID" INTEGER NOT NULL,

    CONSTRAINT "Role_Permiso_pkey" PRIMARY KEY ("RoleID","PermisoID")
);

-- CreateTable
CREATE TABLE "Usuarios" (
    "UsuarioID" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Activo" BOOLEAN NOT NULL DEFAULT true,
    "FechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModificadoEn" TIMESTAMP(3),
    "ModificadoPor" TEXT,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("UsuarioID")
);

-- CreateTable
CREATE TABLE "Usuario_Role" (
    "UsuarioID" INTEGER NOT NULL,
    "RoleID" INTEGER NOT NULL,

    CONSTRAINT "Usuario_Role_pkey" PRIMARY KEY ("UsuarioID","RoleID")
);

-- CreateTable
CREATE TABLE "Negocios" (
    "NegocioID" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "MontoMinimoParaPunto" DECIMAL(10,2) NOT NULL,
    "FactorPuntos" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "Activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Negocios_pkey" PRIMARY KEY ("NegocioID")
);

-- CreateTable
CREATE TABLE "Clientes" (
    "ClienteID" SERIAL NOT NULL,
    "UsuarioID" INTEGER,
    "NombreCompleto" TEXT NOT NULL,
    "Telefono" TEXT,
    "Email" TEXT,
    "PuntosAcumulados" INTEGER NOT NULL DEFAULT 0,
    "FechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UltimaCompra" TIMESTAMP(3),

    CONSTRAINT "Clientes_pkey" PRIMARY KEY ("ClienteID")
);

-- CreateTable
CREATE TABLE "Transacciones_Puntos" (
    "TransaccionID" SERIAL NOT NULL,
    "ClienteID" INTEGER,
    "NegocioID" INTEGER,
    "MontoVenta" DECIMAL(18,2) NOT NULL,
    "PuntosGenerados" INTEGER NOT NULL,
    "TipoMovimiento" TEXT NOT NULL,
    "Fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transacciones_Puntos_pkey" PRIMARY KEY ("TransaccionID")
);

-- CreateTable
CREATE TABLE "Paca_Estados" (
    "EstadoID" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,

    CONSTRAINT "Paca_Estados_pkey" PRIMARY KEY ("EstadoID")
);

-- CreateTable
CREATE TABLE "Paca_Categorias" (
    "CategoriaID" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,

    CONSTRAINT "Paca_Categorias_pkey" PRIMARY KEY ("CategoriaID")
);

-- CreateTable
CREATE TABLE "Inventario_Paca" (
    "PrendaID" SERIAL NOT NULL,
    "CodigoBarras" TEXT,
    "Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,
    "CategoriaID" INTEGER,
    "Talla" TEXT,
    "Color" TEXT,
    "Precio" DECIMAL(18,2) NOT NULL,
    "StockActual" INTEGER NOT NULL DEFAULT 1,
    "StockMinimo" INTEGER NOT NULL DEFAULT 0,
    "ImagenURL" TEXT,
    "EstadoID" INTEGER,
    "EsJoyita" BOOLEAN NOT NULL DEFAULT false,
    "FechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventario_Paca_pkey" PRIMARY KEY ("PrendaID")
);

-- CreateTable
CREATE TABLE "Inventario_Papeleria" (
    "ProductoID" SERIAL NOT NULL,
    "SKU" TEXT,
    "Nombre" TEXT NOT NULL,
    "CantidadStock" INTEGER NOT NULL DEFAULT 0,
    "PrecioUnitario" DECIMAL(18,2) NOT NULL,
    "PuntoReorden" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Inventario_Papeleria_pkey" PRIMARY KEY ("ProductoID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_Nombre_key" ON "Roles"("Nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permisos_Slug_Nombre_key" ON "Permisos"("Slug_Nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_Email_key" ON "Usuarios"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Clientes_Telefono_key" ON "Clientes"("Telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Paca_Estados_Nombre_key" ON "Paca_Estados"("Nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Paca_Categorias_Nombre_key" ON "Paca_Categorias"("Nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_Paca_CodigoBarras_key" ON "Inventario_Paca"("CodigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_Papeleria_SKU_key" ON "Inventario_Papeleria"("SKU");

-- AddForeignKey
ALTER TABLE "Role_Permiso" ADD CONSTRAINT "Role_Permiso_RoleID_fkey" FOREIGN KEY ("RoleID") REFERENCES "Roles"("RoleID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role_Permiso" ADD CONSTRAINT "Role_Permiso_PermisoID_fkey" FOREIGN KEY ("PermisoID") REFERENCES "Permisos"("PermisoID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario_Role" ADD CONSTRAINT "Usuario_Role_UsuarioID_fkey" FOREIGN KEY ("UsuarioID") REFERENCES "Usuarios"("UsuarioID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario_Role" ADD CONSTRAINT "Usuario_Role_RoleID_fkey" FOREIGN KEY ("RoleID") REFERENCES "Roles"("RoleID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clientes" ADD CONSTRAINT "Clientes_UsuarioID_fkey" FOREIGN KEY ("UsuarioID") REFERENCES "Usuarios"("UsuarioID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacciones_Puntos" ADD CONSTRAINT "Transacciones_Puntos_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Clientes"("ClienteID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacciones_Puntos" ADD CONSTRAINT "Transacciones_Puntos_NegocioID_fkey" FOREIGN KEY ("NegocioID") REFERENCES "Negocios"("NegocioID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario_Paca" ADD CONSTRAINT "Inventario_Paca_CategoriaID_fkey" FOREIGN KEY ("CategoriaID") REFERENCES "Paca_Categorias"("CategoriaID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario_Paca" ADD CONSTRAINT "Inventario_Paca_EstadoID_fkey" FOREIGN KEY ("EstadoID") REFERENCES "Paca_Estados"("EstadoID") ON DELETE SET NULL ON UPDATE CASCADE;
