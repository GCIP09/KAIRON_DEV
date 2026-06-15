import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de base de datos (Seeding)...');

  // Limpiar tablas existentes en orden de dependencia
  console.log('🧹 Limpiando base de datos...');
  await prisma.transaccionPuntos.deleteMany({});
  await prisma.inventarioPaca.deleteMany({});
  await prisma.inventarioPapeleria.deleteMany({});
  await prisma.inventarioAbarrotes.deleteMany({});
  await prisma.inventarioServicio.deleteMany({});
  await prisma.pacaCategoria.deleteMany({});
  await prisma.pacaEstado.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.negocio.deleteMany({});
  await prisma.configuracion.deleteMany({});

  // 0. Crear Configuración
  console.log('⚙️ Creando configuración global...');
  await prisma.configuracion.create({
    data: {
      nombreNegocio: 'Kairon',
      whatsapp: '525512345678',
      horario: 'Lunes a Viernes 9am - 6pm',
      factorPuntosRopa: 0.10,
      factorPuntosPapeleria: 0.05,
      factorPuntosAbarrotes: 0.02,
      valorPuntoDescuento: 0.50,
      habilitarRopa: true,
      habilitarPapeleria: true,
      habilitarAbarrotes: true,
      habilitarServicios: true,
    }
  });

  // 1. Crear Negocios
  console.log('🏢 Creando negocios...');
  const negocioRopa = await prisma.negocio.create({
    data: {
      nombre: 'ROPA',
      montoMinimoParaPunto: 10.00,
      factorPuntos: 1.0, // 1 punto por cada $10 MXN (10%)
    },
  });

  const negocioPapeleria = await prisma.negocio.create({
    data: {
      nombre: 'PAPELERIA',
      montoMinimoParaPunto: 20.00,
      factorPuntos: 0.5, // 0.5 puntos por cada $10 MXN (5%)
    },
  });

  const negocioAbarrotes = await prisma.negocio.create({
    data: {
      nombre: 'ABARROTES',
      montoMinimoParaPunto: 50.00,
      factorPuntos: 0.2, // 2% de acumulación
    },
  });

  const negocioServicio = await prisma.negocio.create({
    data: {
      nombre: 'SERVICIO',
      montoMinimoParaPunto: 0.00,
      factorPuntos: 0.0, // Sin puntos
    },
  });

  // 2. Crear Clientes
  console.log('👥 Creando clientes...');
  const cliente1 = await prisma.cliente.create({
    data: {
      nombreCompleto: 'Juan Pérez',
      telefono: '5512345678',
      email: 'juan.perez@email.com',
      puntosAcumulados: 150, // Puntos iniciales
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombreCompleto: 'María Fernanda Ruiz',
      telefono: '5598765432',
      email: 'maria.ruiz@email.com',
      puntosAcumulados: 85,
    },
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      nombreCompleto: 'Eduardo Gómez',
      telefono: '5544332211',
      email: 'eduardo.gomez@email.com',
      puntosAcumulados: 320,
    },
  });

  const cliente4 = await prisma.cliente.create({
    data: {
      nombreCompleto: 'Gabriela Lozano',
      telefono: '5577889900',
      email: 'gabriela.lozano@email.com',
      puntosAcumulados: 10,
    },
  });

  // 3. Crear Historial de Transacciones
  console.log('🪙 Creando historial de transacciones para pruebas de puntos...');
  
  // Juan Pérez: compras normales que sumaron puntos, y un canje anterior
  await prisma.transaccionPuntos.createMany({
    data: [
      {
        clienteId: cliente1.id,
        negocioId: negocioRopa.id,
        montoVenta: 1000.00,
        puntosGenerados: 100,
        tipoMovimiento: 'Suma',
        fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Hace 5 días
      },
      {
        clienteId: cliente1.id,
        negocioId: negocioRopa.id,
        montoVenta: 0.00,
        puntosGenerados: -50,
        tipoMovimiento: 'Canje',
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
      },
      {
        clienteId: cliente1.id,
        negocioId: negocioPapeleria.id,
        montoVenta: 200.00,
        puntosGenerados: 100, // Sumó 100 puntos por compras
        tipoMovimiento: 'Suma',
        fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
      },
    ],
  });

  // María Ruiz: compra normal
  await prisma.transaccionPuntos.createMany({
    data: [
      {
        clienteId: cliente2.id,
        negocioId: negocioRopa.id,
        montoVenta: 850.00,
        puntosGenerados: 85,
        tipoMovimiento: 'Suma',
        fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Eduardo Gómez: acumuló mucho y canjeó una parte grande
  await prisma.transaccionPuntos.createMany({
    data: [
      {
        clienteId: cliente3.id,
        negocioId: negocioRopa.id,
        montoVenta: 4500.00,
        puntosGenerados: 450,
        tipoMovimiento: 'Suma',
        fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        clienteId: cliente3.id,
        negocioId: negocioRopa.id,
        montoVenta: 150.00, // Compró algo de $200 y canjeó 100 pts (-$50 MXN)
        puntosGenerados: 15,
        tipoMovimiento: 'Suma',
        fecha: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        clienteId: cliente3.id,
        negocioId: negocioRopa.id,
        montoVenta: 0.00,
        puntosGenerados: -145, // Canje de 145 puntos
        tipoMovimiento: 'Canje',
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Transacción sin cliente (público general)
  await prisma.transaccionPuntos.create({
    data: {
      negocioId: negocioServicio.id,
      montoVenta: 75.00,
      puntosGenerados: 0,
      tipoMovimiento: 'Suma',
      fecha: new Date(Date.now() - 12 * 60 * 60 * 1000), // Hace 12 horas
    },
  });

  // 4. Crear Categorías y Estados de Paca
  console.log('🏷️ Creando categorías y estados de paca...');
  const catChaqueta = await prisma.pacaCategoria.create({ data: { nombre: 'Chaquetas' } });
  const catSudadera = await prisma.pacaCategoria.create({ data: { nombre: 'Sudaderas' } });
  const catPantalon = await prisma.pacaCategoria.create({ data: { nombre: 'Pantalones' } });

  const estExcelente = await prisma.pacaEstado.create({ data: { nombre: 'Excelente' } });
  const estNueva = await prisma.pacaEstado.create({ data: { nombre: 'Nueva sin etiqueta' } });
  const estBueno = await prisma.pacaEstado.create({ data: { nombre: 'Buen Estado' } });

  // 5. Crear Inventario Paca
  console.log('👕 Creando inventario de ropa de paca...');
  await prisma.inventarioPaca.createMany({
    data: [
      {
        nombre: "Chaqueta Mezclilla Vintage Levi's",
        descripcion: "Levi's",
        precio: 450.00,
        stockActual: 1,
        stockMinimo: 1,
        talla: 'M',
        color: 'Azul Mezclilla',
        codigoBarras: 'PACA-001',
        categoriaId: catChaqueta.id,
        estadoId: estExcelente.id,
      },
      {
        nombre: 'Sudadera Oversize Champion',
        descripcion: 'Champion',
        precio: 380.00,
        stockActual: 0, // Agotada para alerta de stock
        stockMinimo: 1,
        talla: 'L',
        color: 'Gris Jaspe',
        codigoBarras: 'PACA-002',
        categoriaId: catSudadera.id,
        estadoId: estNueva.id,
      },
      {
        nombre: 'Jeans Cargo Wrangler',
        descripcion: 'Wrangler',
        precio: 290.00,
        stockActual: 2,
        stockMinimo: 1,
        talla: '32x30',
        color: 'Beige',
        codigoBarras: 'PACA-003',
        categoriaId: catPantalon.id,
        estadoId: estBueno.id,
      },
    ],
  });

  // 6. Crear Inventario Papelería
  console.log('✏️ Creando inventario de papelería...');
  await prisma.inventarioPapeleria.createMany({
    data: [
      {
        sku: '750102030405',
        nombre: 'Cuaderno Profesional Raya Scribe 100H',
        cantidadStock: 120,
        precioUnitario: 45.00,
        puntoReorden: 15,
      },
      {
        sku: '750987654321',
        nombre: 'Paquete de Plumones Sharpie x12',
        cantidadStock: 5, // Bajo stock
        precioUnitario: 220.00,
        puntoReorden: 10,
      },
    ],
  });

  // 7. Crear Inventario Abarrotes
  console.log('🥤 Creando inventario de abarrotes...');
  await prisma.inventarioAbarrotes.createMany({
    data: [
      {
        sku: '750105530007',
        nombre: 'Refresco Coca-Cola Original 600ml',
        cantidadStock: 80,
        precioUnitario: 19.00,
        puntoReorden: 20,
      },
      {
        sku: '750101111561',
        nombre: 'Papas Sabritas Originales 42g',
        cantidadStock: 45,
        precioUnitario: 18.00,
        puntoReorden: 15,
      },
      {
        sku: '750103130006',
        nombre: 'Leche Entera Lala 1L',
        cantidadStock: 3, // Bajo stock
        precioUnitario: 27.50,
        puntoReorden: 10,
      },
    ],
  });

  // 8. Crear Inventario Servicios
  console.log('🛠️ Creando inventario de servicios...');
  await prisma.inventarioServicio.createMany({
    data: [
      {
        nombre: 'Impresión y Copia Color A4',
        precioUnitario: 5.00,
      },
      {
        nombre: 'Impresión y Copia B/N A4',
        precioUnitario: 2.00,
      },
    ],
  });

  console.log('✨ ¡Siembra completada con éxito! La base de datos está lista.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
