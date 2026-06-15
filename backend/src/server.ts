import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// Registrar CORS para permitir peticiones desde el panel de admin y catálogo
fastify.register(cors, {
  origin: '*',
});

// Ruta de diagnóstico (Health Check)
fastify.get('/health', async () => {
  return { status: 'OK', timestamp: new Date() };
});

// --- RUTAS DE CONFIGURACIÓN ---
fastify.get('/api/configuracion', async () => {
  let config = await prisma.configuracion.findFirst();
  if (!config) {
    config = await prisma.configuracion.create({
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
        habilitarPuntos: true,
      }
    });
  }
  return {
    ...config,
    factorPuntosRopa: Number(config.factorPuntosRopa),
    factorPuntosPapeleria: Number(config.factorPuntosPapeleria),
    factorPuntosAbarrotes: Number(config.factorPuntosAbarrotes),
    valorPuntoDescuento: Number(config.valorPuntoDescuento || 0.50),
  };
});

fastify.put('/api/configuracion', async (request, reply) => {
  const data = request.body as any;
  try {
    const config = await prisma.configuracion.findFirst();
    const id = config ? config.id : 1;
    const updated = await prisma.configuracion.upsert({
      where: { id },
      update: {
        nombreNegocio: data.nombreNegocio,
        whatsapp: data.whatsapp,
        horario: data.horario,
        factorPuntosRopa: data.factorPuntosRopa,
        factorPuntosPapeleria: data.factorPuntosPapeleria,
        factorPuntosAbarrotes: data.factorPuntosAbarrotes,
        valorPuntoDescuento: data.valorPuntoDescuento,
        habilitarRopa: data.habilitarRopa,
        habilitarPapeleria: data.habilitarPapeleria,
        habilitarAbarrotes: data.habilitarAbarrotes,
        habilitarServicios: data.habilitarServicios,
        habilitarPuntos: data.habilitarPuntos,
      },
      create: {
        id,
        nombreNegocio: data.nombreNegocio || 'Kairon',
        whatsapp: data.whatsapp || '525512345678',
        horario: data.horario || 'Lunes a Viernes 9am - 6pm',
        factorPuntosRopa: data.factorPuntosRopa || 0.10,
        factorPuntosPapeleria: data.factorPuntosPapeleria || 0.05,
        factorPuntosAbarrotes: data.factorPuntosAbarrotes || 0.02,
        valorPuntoDescuento: data.valorPuntoDescuento ?? 0.50,
        habilitarRopa: data.habilitarRopa ?? true,
        habilitarPapeleria: data.habilitarPapeleria ?? true,
        habilitarAbarrotes: data.habilitarAbarrotes ?? true,
        habilitarServicios: data.habilitarServicios ?? true,
        habilitarPuntos: data.habilitarPuntos ?? true,
      }
    });
    return {
      ...updated,
      factorPuntosRopa: Number(updated.factorPuntosRopa),
      factorPuntosPapeleria: Number(updated.factorPuntosPapeleria),
      factorPuntosAbarrotes: Number(updated.factorPuntosAbarrotes),
      valorPuntoDescuento: Number(updated.valorPuntoDescuento || 0.50),
    };
  } catch (error) {
    console.error(error);
    reply.status(400).send({ error: 'Error al actualizar la configuración.' });
  }
});

// --- RUTAS DE CLIENTES ---
fastify.get('/api/clientes', async () => {
  const list = await prisma.cliente.findMany();
  return list.map(c => ({
    id: c.id,
    nombre: c.nombreCompleto,
    telefono: c.telefono,
    saldoPuntos: c.puntosAcumulados
  }));
});

fastify.post('/api/clientes', async (request, reply) => {
  const { nombre, telefono } = request.body as { nombre: string; telefono: string };
  try {
    const cliente = await prisma.cliente.create({
      data: { 
        nombreCompleto: nombre, 
        telefono 
      },
    });
    return {
      id: cliente.id,
      nombre: cliente.nombreCompleto,
      telefono: cliente.telefono,
      saldoPuntos: cliente.puntosAcumulados
    };
  } catch (error) {
    reply.status(400).send({ error: 'Error al crear cliente o el teléfono ya existe.' });
  }
});

fastify.put('/api/clientes/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { nombre, telefono } = request.body as { nombre: string; telefono: string };
  try {
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: { nombreCompleto: nombre, telefono },
    });
    return {
      id: cliente.id,
      nombre: cliente.nombreCompleto,
      telefono: cliente.telefono,
      saldoPuntos: cliente.puntosAcumulados
    };
  } catch (error) {
    reply.status(400).send({ error: 'Error al actualizar cliente.' });
  }
});

fastify.delete('/api/clientes/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  try {
    await prisma.cliente.delete({ where: { id: parseInt(id) } });
    return { success: true };
  } catch (error) {
    reply.status(400).send({ error: 'Error al eliminar cliente.' });
  }
});

// --- RUTAS DE PRODUCTOS ---
fastify.get('/api/productos', async () => {
  const [config, paca, papeleria, abarrotes, servicios] = await Promise.all([
    prisma.configuracion.findFirst(),
    prisma.inventarioPaca.findMany({ include: { categoria: true, estado: true } }),
    prisma.inventarioPapeleria.findMany(),
    prisma.inventarioAbarrotes.findMany(),
    prisma.inventarioServicio.findMany(),
  ]);

  const fRopa = config ? Number(config.factorPuntosRopa) : 0.10;
  const fPapeleria = config ? Number(config.factorPuntosPapeleria) : 0.05;
  const fAbarrotes = config ? Number(config.factorPuntosAbarrotes) : 0.02;

  const combined = [
    ...paca.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      stock: p.stockActual,
      categoria: 'ROPA' as const,
      factorPuntos: fRopa,
      codigoBarras: p.codigoBarras || undefined,
      detalles: {
        talla: p.talla || undefined,
        color: p.color || undefined,
        estado: p.estado?.nombre || 'Excelente',
        marca: p.descripcion || undefined
      }
    })),
    ...papeleria.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precioUnitario),
      stock: p.cantidadStock,
      categoria: 'PAPELERIA' as const,
      factorPuntos: fPapeleria,
      codigoBarras: p.sku || undefined,
      detalles: {
        marca: p.nombre.split(' ')[0]
      }
    })),
    ...abarrotes.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precioUnitario),
      stock: p.cantidadStock,
      categoria: 'ABARROTES' as const,
      factorPuntos: fAbarrotes,
      codigoBarras: p.sku || undefined,
      detalles: {
        marca: p.nombre.split(' ')[0]
      }
    })),
    ...servicios.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precioUnitario),
      stock: 9999, // Stock infinito para servicios
      categoria: 'SERVICIO' as const,
      factorPuntos: 0,
      codigoBarras: undefined,
      detalles: undefined
    }))
  ];

  return combined;
});

fastify.post('/api/productos', async (request, reply) => {
  const { nombre, precio, stock, categoria, codigoBarras, detalles } = request.body as {
    nombre: string;
    precio: number;
    stock: number;
    categoria: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO';
    codigoBarras?: string;
    detalles?: any;
  };
  try {
    const config = await prisma.configuracion.findFirst();
    const fRopa = config ? Number(config.factorPuntosRopa) : 0.10;
    const fPapeleria = config ? Number(config.factorPuntosPapeleria) : 0.05;
    const fAbarrotes = config ? Number(config.factorPuntosAbarrotes) : 0.02;

    if (categoria === 'ROPA') {
      let cat = await prisma.pacaCategoria.findFirst({ where: { nombre: detalles?.categoria || 'General' } });
      if (!cat) cat = await prisma.pacaCategoria.create({ data: { nombre: detalles?.categoria || 'General' } });

      let est = await prisma.pacaEstado.findFirst({ where: { nombre: detalles?.estado || 'Nueva' } });
      if (!est) est = await prisma.pacaEstado.create({ data: { nombre: detalles?.estado || 'Nueva' } });

      const item = await prisma.inventarioPaca.create({
        data: {
          nombre,
          precio,
          stockActual: stock || 1,
          codigoBarras,
          talla: detalles?.talla,
          color: detalles?.color,
          categoriaId: cat.id,
          estadoId: est.id,
          descripcion: detalles?.marca
        }
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precio),
        stock: item.stockActual,
        categoria: 'ROPA',
        factorPuntos: fRopa,
        codigoBarras: item.codigoBarras || undefined,
        detalles
      };
    } else if (categoria === 'PAPELERIA') {
      const item = await prisma.inventarioPapeleria.create({
        data: {
          nombre,
          precioUnitario: precio,
          cantidadStock: stock || 0,
          sku: codigoBarras,
        }
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precioUnitario),
        stock: item.cantidadStock,
        categoria: 'PAPELERIA',
        factorPuntos: fPapeleria,
        codigoBarras: item.sku || undefined,
        detalles
      };
    } else if (categoria === 'ABARROTES') {
      const item = await prisma.inventarioAbarrotes.create({
        data: {
          nombre,
          precioUnitario: precio,
          cantidadStock: stock || 0,
          sku: codigoBarras,
        }
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precioUnitario),
        stock: item.cantidadStock,
        categoria: 'ABARROTES',
        factorPuntos: fAbarrotes,
        codigoBarras: item.sku || undefined,
        detalles
      };
    } else {
      const item = await prisma.inventarioServicio.create({
        data: {
          nombre,
          precioUnitario: precio,
        }
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precioUnitario),
        stock: 9999,
        categoria: 'SERVICIO',
        factorPuntos: 0,
        codigoBarras: undefined,
        detalles: undefined
      };
    }
  } catch (error) {
    console.error(error);
    reply.status(400).send({ error: 'Error al crear producto.' });
  }
});

fastify.put('/api/productos/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { nombre, precio, stock, categoria, codigoBarras, detalles } = request.body as {
    nombre: string;
    precio: number;
    stock: number;
    categoria: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO';
    codigoBarras?: string;
    detalles?: any;
  };
  try {
    const config = await prisma.configuracion.findFirst();
    const fRopa = config ? Number(config.factorPuntosRopa) : 0.10;
    const fPapeleria = config ? Number(config.factorPuntosPapeleria) : 0.05;
    const fAbarrotes = config ? Number(config.factorPuntosAbarrotes) : 0.02;

    if (categoria === 'ROPA') {
      const item = await prisma.inventarioPaca.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          precio,
          stockActual: stock,
          codigoBarras,
          talla: detalles?.talla,
          color: detalles?.color,
          descripcion: detalles?.marca,
        },
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precio),
        stock: item.stockActual,
        categoria: 'ROPA',
        factorPuntos: fRopa,
        codigoBarras: item.codigoBarras || undefined,
        detalles
      };
    } else if (categoria === 'PAPELERIA') {
      const item = await prisma.inventarioPapeleria.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          precioUnitario: precio,
          cantidadStock: stock,
          sku: codigoBarras,
        },
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precioUnitario),
        stock: item.cantidadStock,
        categoria: 'PAPELERIA',
        factorPuntos: fPapeleria,
        codigoBarras: item.sku || undefined,
        detalles
      };
    } else if (categoria === 'ABARROTES') {
      const item = await prisma.inventarioAbarrotes.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          precioUnitario: precio,
          cantidadStock: stock,
          sku: codigoBarras,
        },
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precioUnitario),
        stock: item.cantidadStock,
        categoria: 'ABARROTES',
        factorPuntos: fAbarrotes,
        codigoBarras: item.sku || undefined,
        detalles
      };
    } else {
      const item = await prisma.inventarioServicio.update({
        where: { id: parseInt(id) },
        data: {
          nombre,
          precioUnitario: precio,
        },
      });
      return {
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precioUnitario),
        stock: 9999,
        categoria: 'SERVICIO',
        factorPuntos: 0,
        codigoBarras: undefined,
        detalles: undefined
      };
    }
  } catch (error) {
    console.error(error);
    reply.status(400).send({ error: 'Error al actualizar producto.' });
  }
});

fastify.delete('/api/productos/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { categoria } = request.query as { categoria?: string };
  try {
    if (categoria === 'ROPA') {
      await prisma.inventarioPaca.delete({ where: { id: parseInt(id) } });
    } else if (categoria === 'PAPELERIA') {
      await prisma.inventarioPapeleria.delete({ where: { id: parseInt(id) } });
    } else if (categoria === 'ABARROTES') {
      await prisma.inventarioAbarrotes.delete({ where: { id: parseInt(id) } });
    } else {
      await prisma.inventarioServicio.delete({ where: { id: parseInt(id) } });
    }
    return { success: true };
  } catch (error) {
    reply.status(400).send({ error: 'Error al eliminar producto.' });
  }
});

// --- RUTAS DE TRANSACCIONES ---
fastify.get('/api/transacciones', async () => {
  const list = await prisma.transaccionPuntos.findMany({
    include: { cliente: true, negocio: true }
  });
  return list.map(t => ({
    id: t.id,
    clienteId: t.clienteId || undefined,
    cliente: t.cliente ? {
      id: t.cliente.id,
      nombre: t.cliente.nombreCompleto,
      telefono: t.cliente.telefono,
      saldoPuntos: t.cliente.puntosAcumulados
    } : undefined,
    tipoNegocio: t.negocio?.nombre || 'SERVICIO',
    monto: Number(t.montoVenta),
    puntosGanados: t.puntosGenerados,
    comentarios: t.comentarios || t.tipoMovimiento,
    metodoEntrega: t.metodoEntrega,
    estatusEntrega: t.estatusEntrega,
    createdAt: t.fecha,
    items: t.items || undefined,
    cancelada: t.cancelada
  }));
});

fastify.post('/api/transacciones', async (request, reply) => {
  const { clienteId, tipoNegocio, monto, puntosGanados, comentarios, items, metodoEntrega, estatusEntrega } = request.body as {
    clienteId?: number;
    tipoNegocio: string;
    monto: number;
    puntosGanados: number;
    comentarios?: string;
    items?: { id: number; categoria: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO'; cantidad: number }[];
    metodoEntrega?: string;
    estatusEntrega?: string;
  };
  try {
    let negocio = await prisma.negocio.findFirst({ where: { nombre: tipoNegocio } });
    if (!negocio) {
      negocio = await prisma.negocio.create({
        data: {
          nombre: tipoNegocio,
          montoMinimoParaPunto: tipoNegocio === 'ROPA' ? 10.00 : tipoNegocio === 'PAPELERIA' ? 20.00 : tipoNegocio === 'ABARROTES' ? 50.00 : 0.00,
          factorPuntos: tipoNegocio === 'ROPA' ? 1.0 : tipoNegocio === 'PAPELERIA' ? 0.5 : tipoNegocio === 'ABARROTES' ? 0.2 : 0.0
        }
      });
    }

    // 1. Descontar Stock si hay items en la venta
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.categoria === 'ROPA') {
          await prisma.inventarioPaca.update({
            where: { id: item.id },
            data: {
              stockActual: {
                decrement: item.cantidad
              }
            }
          });
        } else if (item.categoria === 'PAPELERIA') {
          await prisma.inventarioPapeleria.update({
            where: { id: item.id },
            data: {
              cantidadStock: {
                decrement: item.cantidad
              }
            }
          });
        } else if (item.categoria === 'ABARROTES') {
          await prisma.inventarioAbarrotes.update({
            where: { id: item.id },
            data: {
              cantidadStock: {
                decrement: item.cantidad
              }
            }
          });
        }
      }
    }

    const finalMetodo = metodoEntrega || 'Tienda';
    // 2. Crear la transacción
    const transaccion = await prisma.transaccionPuntos.create({
      data: {
        clienteId,
        negocioId: negocio.id,
        montoVenta: monto,
        puntosGenerados: puntosGanados,
        tipoMovimiento: puntosGanados >= 0 ? 'Suma' : 'Canje',
        comentarios: comentarios || null,
        metodoEntrega: finalMetodo,
        estatusEntrega: estatusEntrega || (finalMetodo === 'Tienda' ? 'Entregado' : 'Pendiente'),
        items: items ? (items as any) : undefined,
      },
    });

    // 3. Actualizar puntos del cliente
    if (clienteId && puntosGanados !== 0) {
      await prisma.cliente.update({
        where: { id: clienteId },
        data: {
          puntosAcumulados: {
            increment: puntosGanados,
          },
          ultimaCompra: new Date()
        },
      });
    }

    return {
      id: transaccion.id,
      clienteId: transaccion.clienteId || undefined,
      tipoNegocio: negocio.nombre,
      monto: Number(transaccion.montoVenta),
      puntosGanados: transaccion.puntosGenerados,
      comentarios: transaccion.comentarios || transaccion.tipoMovimiento,
      metodoEntrega: transaccion.metodoEntrega,
      estatusEntrega: transaccion.estatusEntrega,
      createdAt: transaccion.fecha,
      items: transaccion.items || undefined,
      cancelada: transaccion.cancelada
    };
  } catch (error) {
    console.error(error);
    reply.status(400).send({ error: 'Error al registrar transacción.' });
  }
});

fastify.put('/api/transacciones/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { estatusEntrega } = request.body as { estatusEntrega: string };
  try {
    const updated = await prisma.transaccionPuntos.update({
      where: { id: parseInt(id) },
      data: { estatusEntrega }
    });
    return {
      id: updated.id,
      clienteId: updated.clienteId || undefined,
      monto: Number(updated.montoVenta),
      puntosGanados: updated.puntosGenerados,
      comentarios: updated.comentarios || updated.tipoMovimiento,
      metodoEntrega: updated.metodoEntrega,
      estatusEntrega: updated.estatusEntrega,
      createdAt: updated.fecha,
      items: updated.items || undefined,
      cancelada: updated.cancelada
    };
  } catch (err: any) {
    console.error(err);
    reply.status(500).send({ error: 'Error al actualizar la transacción.' });
  }
});

fastify.post('/api/transacciones/:id/cancelar', async (request, reply) => {
  const { id } = request.params as { id: string };
  try {
    const txId = parseInt(id);
    const transaccion = await prisma.transaccionPuntos.findUnique({
      where: { id: txId },
      include: { cliente: true, negocio: true }
    });

    if (!transaccion) {
      return reply.status(404).send({ error: 'La transacción no existe.' });
    }

    if (transaccion.cancelada) {
      return reply.status(400).send({ error: 'La transacción ya está cancelada.' });
    }

    // 1. Revertir Stock si la transacción tiene items almacenados
    const items = transaccion.items as { id: number; categoria: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO'; cantidad: number }[] | null;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.categoria === 'ROPA') {
          await prisma.inventarioPaca.update({
            where: { id: item.id },
            data: {
              stockActual: {
                increment: item.cantidad
              }
            }
          });
        } else if (item.categoria === 'PAPELERIA') {
          await prisma.inventarioPapeleria.update({
            where: { id: item.id },
            data: {
              cantidadStock: {
                increment: item.cantidad
              }
            }
          });
        } else if (item.categoria === 'ABARROTES') {
          await prisma.inventarioAbarrotes.update({
            where: { id: item.id },
            data: {
              cantidadStock: {
                increment: item.cantidad
              }
            }
          });
        }
      }
    }

    // 2. Revertir Puntos del cliente
    if (transaccion.clienteId && transaccion.puntosGenerados !== 0) {
      await prisma.cliente.update({
        where: { id: transaccion.clienteId },
        data: {
          puntosAcumulados: {
            increment: -transaccion.puntosGenerados
          }
        }
      });
    }

    // 3. Marcar como cancelada
    const updated = await prisma.transaccionPuntos.update({
      where: { id: txId },
      data: {
        cancelada: true
      },
      include: { cliente: true, negocio: true }
    });

    return {
      id: updated.id,
      clienteId: updated.clienteId || undefined,
      cliente: updated.cliente ? {
        id: updated.cliente.id,
        nombre: updated.cliente.nombreCompleto,
        telefono: updated.cliente.telefono,
        saldoPuntos: updated.cliente.puntosAcumulados
      } : undefined,
      tipoNegocio: updated.negocio?.nombre || 'SERVICIO',
      monto: Number(updated.montoVenta),
      puntosGanados: updated.puntosGenerados,
      comentarios: updated.comentarios || updated.tipoMovimiento,
      metodoEntrega: updated.metodoEntrega,
      estatusEntrega: updated.estatusEntrega,
      createdAt: updated.fecha,
      items: updated.items || undefined,
      cancelada: updated.cancelada
    };
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: 'Error al cancelar la transacción.' });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Servidor corriendo en http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
