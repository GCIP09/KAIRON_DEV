-- AlterTable
ALTER TABLE "Configuracion" ADD COLUMN     "HabilitarPuntos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ValorPuntoDescuento" DECIMAL(5,2) NOT NULL DEFAULT 0.50;

-- AlterTable
ALTER TABLE "Transacciones_Puntos" ADD COLUMN     "Cancelada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "EstatusEntrega" TEXT NOT NULL DEFAULT 'Entregado',
ADD COLUMN     "Items" JSONB,
ADD COLUMN     "MetodoEntrega" TEXT NOT NULL DEFAULT 'Tienda';
