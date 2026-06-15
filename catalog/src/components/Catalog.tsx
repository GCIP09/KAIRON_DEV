import React, { useState, useEffect } from 'react';
import { Search, Shirt, BookOpen, Sparkles, Coins, Phone, ArrowRight, CheckCircle, Smartphone, Package } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO';
  factorPuntos: number;
  codigoBarras?: string;
  detalles?: {
    talla?: string;
    color?: string;
    estado?: string;
    marca?: string;
    [key: string]: any;
  };
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  saldoPuntos: number;
}

export default function Catalog() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'points'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Configuration settings state
  const [config, setConfig] = useState({
    nombreNegocio: 'Kairon',
    whatsapp: '525512345678',
    horario: 'Lunes a Viernes 9am - 6pm',
    habilitarRopa: true,
    habilitarPapeleria: true,
    habilitarAbarrotes: true,
    habilitarServicios: true,
    factorPuntosRopa: 0.10,
    factorPuntosPapeleria: 0.05,
    factorPuntosAbarrotes: 0.02,
    valorPuntoDescuento: 0.50,
    habilitarPuntos: true,
  });
  const [catalogFilter, setCatalogFilter] = useState<'TODOS' | Producto['categoria']>('TODOS');
  
  // Data states
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  
  // Points lookup state
  const [phoneQuery, setPhoneQuery] = useState('');
  const [foundClient, setFoundClient] = useState<Cliente | null>(null);
  const [hasSearchedPhone, setHasSearchedPhone] = useState(false);

  // Default WhatsApp configuration
  const defaultWhatsApp = '525512345678'; // Fallback seller number

  const API = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API}/health`);
        if (res.ok) {
          setBackendStatus('online');
          loadBackendData();
        } else {
          setBackendStatus('offline');
          loadMockData();
        }
      } catch (e) {
        setBackendStatus('offline');
        loadMockData();
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    if (config.nombreNegocio) {
      document.title = `${config.nombreNegocio} - Catálogo & Lealtad`;
    }
  }, [config.nombreNegocio]);

  useEffect(() => {
    if (config.habilitarPuntos === false && activeTab === 'points') {
      setActiveTab('catalog');
    }
  }, [config.habilitarPuntos, activeTab]);

  const loadBackendData = async () => {
    try {
      const [productosRes, clientesRes, configRes] = await Promise.all([
        fetch(`${API}/api/productos`).then(r => r.json()),
        fetch(`${API}/api/clientes`).then(r => r.json()),
        fetch(`${API}/api/configuracion`).then(r => r.json())
      ]);
      setProductos(productosRes);
      setClientes(clientesRes);
      setConfig(configRes);
    } catch (e) {
      loadMockData();
    }
  };

  const loadMockData = () => {
    setProductos([
      { id: 1, nombre: 'Chaqueta de Mezclilla Vintage Levi\'s', precio: 450.00, stock: 1, categoria: 'ROPA', factorPuntos: 0.1, codigoBarras: 'PACA-001', detalles: { talla: 'M', color: 'Azul', estado: 'Excelente', marca: 'Levi\'s' } },
      { id: 2, nombre: 'Sudadera Oversize Champion', precio: 380.00, stock: 1, categoria: 'ROPA', factorPuntos: 0.1, codigoBarras: 'PACA-002', detalles: { talla: 'L', color: 'Gris', estado: 'Nueva sin etiqueta', marca: 'Champion' } },
      { id: 3, nombre: 'Cuaderno Profesional Raya 100 Hojas', precio: 45.00, stock: 120, categoria: 'PAPELERIA', factorPuntos: 0.05, codigoBarras: '750102030405', detalles: { marca: 'Scribe' } },
      { id: 4, nombre: 'Paquete de Plumones Sharpie x12', precio: 220.00, stock: 25, categoria: 'PAPELERIA', factorPuntos: 0.05, codigoBarras: '750987654321', detalles: { marca: 'Sharpie' } },
      { id: 5, nombre: 'Impresión y Copia Color A4', precio: 5.00, stock: 9999, categoria: 'SERVICIO', factorPuntos: 0.0 },
      { id: 6, nombre: 'Refresco Coca-Cola 600ml', precio: 19.00, stock: 80, categoria: 'ABARROTES', factorPuntos: 0.02, codigoBarras: '750105530007', detalles: { marca: 'Coca-Cola' } }
    ]);

    setClientes([
      { id: 1, nombre: 'Alejandro Morales', telefono: '5512345678', saldoPuntos: 150 },
      { id: 2, nombre: 'María Fernanda Ruiz', telefono: '5598765432', saldoPuntos: 80 },
      { id: 3, nombre: 'Eduardo Gómez', telefono: '5544332211', saldoPuntos: 320 },
      { id: 4, nombre: 'Gabriela Lozano', telefono: '5577889900', saldoPuntos: 45 }
    ]);
  };

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;
    
    const client = clientes.find(c => c.telefono === phoneQuery.trim());
    setFoundClient(client || null);
    setHasSearchedPhone(true);
  };

  const getWhatsAppLink = (p: Producto) => {
    const message = encodeURIComponent(
      `¡Hola! Vi el producto "${p.nombre}" en su catálogo de Kairon. Me interesa comprarlo. Código: ${p.codigoBarras || 'N/A'}`
    );
    return `https://wa.me/${config.whatsapp || defaultWhatsApp}?text=${message}`;
  };

  const filteredProducts = productos.filter(p => {
    const isCategoryEnabled = 
      p.categoria === 'ROPA' ? config.habilitarRopa :
      p.categoria === 'PAPELERIA' ? config.habilitarPapeleria :
      p.categoria === 'ABARROTES' ? config.habilitarAbarrotes :
      p.categoria === 'SERVICIO' ? config.habilitarServicios : true;
    if (!isCategoryEnabled) return false;

    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.codigoBarras && p.codigoBarras.includes(searchQuery));
    const matchesFilter = catalogFilter === 'TODOS' || p.categoria === catalogFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      <div>
        <header className="h-20 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 w-full">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <span className="text-white font-extrabold text-sm">
                  {(config.nombreNegocio || 'K').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase">
                  {config.nombreNegocio}
                </h2>
                <p className="text-[9px] text-brand-400 font-bold uppercase tracking-widest">Catálogo & Lealtad</p>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 font-medium">
              {config.horario}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-12 p-8 md:p-12 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center space-x-2 px-3 py-1 bg-brand-500/10 border border-brand-500/30 rounded-full text-xs font-semibold text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catálogo Exclusivo {config.nombreNegocio}</span>
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Descubre nuestros productos y servicios
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Explora nuestro catálogo en línea y haz tus pedidos por WhatsApp. Horarios: {config.horario}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-8 space-x-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-4 text-base font-semibold border-b-2 transition-all ${
            activeTab === 'catalog' 
              ? 'border-brand-500 text-brand-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Ver Catálogo
        </button>
        {config.habilitarPuntos && (
          <button
            onClick={() => setActiveTab('points')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${
              activeTab === 'points' 
                ? 'border-brand-500 text-brand-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Mis Puntos Kairon
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'catalog' ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-brand-500 focus:outline-none transition-all placeholder:text-slate-500 text-slate-100"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'TODOS', label: 'Todos', show: true },
                { value: 'ROPA', label: 'Ropa / Paca', show: config.habilitarRopa },
                { value: 'PAPELERIA', label: 'Papelería', show: config.habilitarPapeleria },
                { value: 'ABARROTES', label: 'Abarrotes', show: config.habilitarAbarrotes },
                { value: 'SERVICIO', label: 'Servicios', show: config.habilitarServicios },
              ]
                .filter(f => f.show)
                .map(f => (
                  <button
                    key={f.value}
                    onClick={() => setCatalogFilter(f.value as any)}
                    className={`text-xs px-4 py-2.5 rounded-xl font-semibold transition-all border ${
                      catalogFilter === f.value
                        ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/10'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Grid Products */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div 
                key={`${p.categoria}-${p.id}`} 
                className="bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
              >
                {/* Category Icon tag */}
                <div className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
                  {p.categoria === 'ROPA' ? (
                    <Shirt className="w-5 h-5 text-indigo-400" />
                  ) : p.categoria === 'PAPELERIA' ? (
                    <BookOpen className="w-5 h-5 text-sky-400" />
                  ) : p.categoria === 'ABARROTES' ? (
                    <Package className="w-5 h-5 text-violet-400" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-brand-400" />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.categoria}</span>
                    <h3 className="font-bold text-lg text-white leading-snug group-hover:text-brand-400 transition-colors pr-8">
                      {p.nombre}
                    </h3>
                  </div>

                  {/* Badges/Tags for Clothes */}
                  {p.categoria === 'ROPA' && p.detalles && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-md">
                        Talla: {p.detalles.talla}
                      </span>
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-md">
                        Color: {p.detalles.color}
                      </span>
                      <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-md">
                        {p.detalles.estado}
                      </span>
                    </div>
                  )}

                  {/* Brand label */}
                  {p.detalles?.marca && (
                    <p className="text-xs text-slate-400">
                      Marca: <span className="font-semibold text-slate-300">{p.detalles.marca}</span>
                    </p>
                  )}

                  <div className="flex items-baseline space-x-1.5 pt-2">
                    <span className="text-2xl font-black text-white">${p.precio}</span>
                    <span className="text-xs text-slate-500">MXN</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {p.stock === 0 ? (
                      <span className="text-rose-400 font-semibold">Agotado</span>
                    ) : p.stock === 1 && p.categoria === 'ROPA' ? (
                      <span className="text-amber-400 font-medium">Única pieza</span>
                    ) : (
                      <span>Stock: {p.stock} pzas</span>
                    )}
                  </span>

                  {p.stock > 0 && (
                    <a
                      href={getWhatsAppLink(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/10"
                    >
                      <Phone className="w-3.5 h-3.5 fill-current" />
                      <span>Comprar</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-500">
                No se encontraron productos en este catálogo.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Points Tab lookup */
        <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center space-x-3 text-brand-400">
              <Coins className="w-6 h-6" />
              <h3 className="font-bold text-lg text-white">Consulta tus Puntos</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ingresa el número de teléfono registrado al momento de tu compra para conocer tus puntos acumulados y su equivalencia en dinero.
            </p>

            <form onSubmit={handlePhoneSearch} className="space-y-4">
              <div className="relative">
                <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="Tu teléfono (ej. 5512345678)"
                  value={phoneQuery}
                  onChange={(e) => {
                    setPhoneQuery(e.target.value);
                    setHasSearchedPhone(false);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm focus:border-brand-500 focus:outline-none transition-all text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center space-x-2"
              >
                <span>Consultar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Results display */}
          {hasSearchedPhone && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              {foundClient ? (
                <div className="bg-gradient-to-tr from-brand-950/80 via-slate-900 to-slate-900 border border-brand-500/30 p-6 rounded-2xl text-center space-y-4 shadow-xl">
                  <div className="mx-auto w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                    <CheckCircle className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">¡Hola!</p>
                    <h4 className="font-extrabold text-xl text-white">{foundClient.nombre}</h4>
                  </div>
                  <div className="py-4 border-y border-slate-800/80">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Saldo Disponible</p>
                    <p className="text-4xl font-black text-brand-400 tracking-tight">{foundClient.saldoPuntos} pts</p>
                    {/* Suppose 1 point = $0.50 pesos */}
                    <p className="text-sm text-slate-300 font-semibold mt-2">
                      Equivalente a: ${(foundClient.saldoPuntos * (config.valorPuntoDescuento ?? 0.50)).toFixed(2)} MXN en tienda
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    Puedes canjear estos puntos en tu siguiente compra. ¡Gracias por tu lealtad!
                  </p>
                </div>
              ) : (
                <div className="bg-rose-950/20 border border-rose-500/20 p-5 rounded-2xl text-center text-rose-300 text-sm">
                  No se encontró ningún cliente registrado con el teléfono ingresado. Por favor valida con el vendedor.
                </div>
              )}
            </div>
          )}
        </div>
      )}
        </main>
      </div>
      <footer className="border-t border-slate-900 bg-slate-950/40 py-8 text-center text-xs text-slate-500 mt-12 w-full">
        <p>© {new Date().getFullYear()} {config.nombreNegocio}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
