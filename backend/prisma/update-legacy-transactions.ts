import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.transaccionPuntos.updateMany({
    where: {
      metodoEntrega: 'Retiro',
    },
    data: {
      metodoEntrega: 'Tienda',
      estatusEntrega: 'Entregado',
    },
  });
  console.log(`Updated ${result.count} legacy transactions from Retiro to Tienda.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
