import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Shirt, Package2, Users, Coins, Plus, Search,
  TrendingUp, DollarSign, UserCheck, CheckCircle2, AlertCircle,
  Sparkles, BarChart3, Edit2, Trash2, X, ChevronRight, ArrowLeft,
  Package, AlertTriangle, Filter, RefreshCw, Sun, Moon, Palette,
  ChevronDown
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// TEMA SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
type ThemeId = 'zinc-sagrado' | 'amanecer-akil' | 'noche-profunda' | 'campo-claro' | 'azul-kairon' | 'luz-sagrada';

interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  dotClass: string;
  icon: React.ReactNode;
}

const THEMES: ThemeDef[] = [
  { id: 'zinc-sagrado',   name: 'Zinc Sagrado',   description: 'Oscuro premium',         dotClass: 'theme-dot-zinc',     icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'amanecer-akil',  name: 'Amanecer Akil',  description: 'Cálido, tierras mayas',  dotClass: 'theme-dot-amanecer', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'noche-profunda', name: 'Noche Profunda',  description: 'Ultra oscuro, oro',      dotClass: 'theme-dot-noche',    icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'campo-claro',    name: 'Campo Claro',     description: 'Día, agrario cálido',   dotClass: 'theme-dot-campo',    icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'azul-kairon',    name: 'Azul Kairon',     description: 'Lateral azul, claro',   dotClass: 'theme-dot-azul',     icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'luz-sagrada',    name: 'Luz Sagrada',     description: 'Claro premium, Kairon', dotClass: 'theme-dot-luz',      icon: <Sun className="w-3.5 h-3.5" /> },
];

function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('kairon-theme') as ThemeId | null;
    return saved && THEMES.find(t => t.id === saved) ? saved : 'zinc-sagrado';
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('kairon-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA TYPES
// ══════════════════════════════════════════════════════════════════════════════
interface ClienteUI { id: number; nombre: string; telefono: string; saldoPuntos: number; }
interface Producto {
  id: number; nombre: string; precio: number; stock: number; stockMinimo?: number;
  categoria: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO'; factorPuntos: number;
  codigoBarras?: string; detalles?: { talla?: string; color?: string; estado?: string; marca?: string; [k: string]: any; };
}
interface Transaccion {
  id: number; clienteId?: number; cliente?: ClienteUI;
  tipoNegocio: 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO';
  monto: number; puntosGanados: number; comentarios?: string;
  metodoEntrega?: 'Tienda' | 'Retiro' | 'Envio';
  estatusEntrega?: 'Pendiente' | 'Preparado' | 'Enviado' | 'Entregado';
  createdAt: string;
  cancelada?: boolean;
  items?: any;
}
type ActiveTab = 'dashboard' | 'inventario' | 'caja' | 'clientes' | 'reportes' | 'configuracion';
type InventarioFilter = 'TODOS' | 'ROPA' | 'PAPELERIA' | 'ABARROTES' | 'SERVICIO';

const API = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// ══════════════════════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function CategoriaBadge({ cat }: { cat: string }) {
  const cls = cat === 'ROPA' ? 'badge-paca' : cat === 'PAPELERIA' ? 'badge-papeleria' : cat === 'ABARROTES' ? 'badge-abarrotes' : 'badge-servicio';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{cat}</span>;
}

function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] k-muted font-bold">${d.value.toFixed(0)}</span>
          <div className="w-full rounded-t-md transition-all duration-700" style={{ height: `${Math.max((d.value / max) * 80, 4)}px`, background: d.color, opacity: 0.9 }} />
          <span className="text-[9px] k-muted truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Trinity Sparkle — micro-animación al ganar puntos
function TrinitySparkle({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <span className="trinity-spark k-gold text-base">✦</span>
      <span className="trinity-spark k-green text-base">✦</span>
      <span className="trinity-spark k-teal  text-base">✦</span>
    </div>
  );
}

// Theme Switcher component
function ThemeSwitcher({ current, onChange }: { current: ThemeId; onChange: (t: ThemeId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
        style={{ background: 'var(--k-nav-hover)' }}>
        <Palette className="w-4 h-4 k-gold" />
        <span className="text-xs k-muted font-medium flex-1 text-left">Tema de interfaz</span>
        <span className={`theme-dot ${THEMES.find(t => t.id === current)?.dotClass} w-5 h-5`} style={{ border: 'none' }} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-52 glass-panel rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-[10px] k-muted uppercase tracking-widest font-semibold px-2 py-1.5">Selecciona un tema</p>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => { onChange(t.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all text-left mb-0.5 ${current === t.id ? 'k-nav-item active' : 'k-nav-item'}`}>
              <span className={`theme-dot ${t.dotClass} ${current === t.id ? 'active' : ''}`} />
              <div>
                <p className="text-xs font-semibold k-text">{t.name}</p>
                <p className="text-[10px] k-muted">{t.description}</p>
              </div>
              {current === t.id && <CheckCircle2 className="w-3.5 h-3.5 ml-auto k-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Modal wrapper
function Modal({ title, icon, onClose, maxWidth = 'max-w-md', children }: { title: string; icon?: React.ReactNode; onClose: () => void; maxWidth?: string; children: React.ReactNode }) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div className={`glass-panel p-6 rounded-2xl w-full ${maxWidth} space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto`}
        style={{ background: 'var(--k-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold k-text flex items-center gap-2">{icon}{title}</h3>
          <button onClick={onClose} className="k-muted hover:k-text p-1.5 rounded-lg transition-all" style={{ background: 'var(--k-nav-hover)' }}><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs k-muted font-semibold uppercase tracking-wide block">{label}</label>
      {children}
    </div>
  );
}

function SubmitBtn({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="k-btn-primary w-full py-3 text-sm">{children}</button>
  );
}

function ProductModal({ title, form, setForm, onSubmit, onClose, config, submitLabel = 'Añadir al Inventario' }: {
  title: string; form: any; setForm: (v: any) => void;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
  config: any; submitLabel?: string;
}) {
  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="glass-panel p-6 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto space-y-5"
        style={{ background: 'var(--k-surface)' }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold k-text">{title}</h3>
          <button onClick={onClose} className="k-muted hover:k-text p-1.5 rounded-lg transition-all" style={{ background: 'var(--k-nav-hover)' }}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs k-muted font-semibold uppercase block">Nombre del Producto</label>
              <input type="text" required placeholder="Ej. Jean Cargo Negro" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="k-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs k-muted font-semibold uppercase block">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as any })} className="k-select">
                {config.habilitarRopa && <option value="ROPA">Ropa / Paca</option>}
                {config.habilitarPapeleria && <option value="PAPELERIA">Papelería</option>}
                {config.habilitarAbarrotes && <option value="ABARROTES">Abarrotes</option>}
                {config.habilitarServicios && <option value="SERVICIO">Servicios</option>}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs k-muted font-semibold uppercase block">Código de Barras</label>
              <input type="text" placeholder="Opcional" value={form.codigoBarras} onChange={e => setForm({ ...form, codigoBarras: e.target.value })} className="k-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs k-muted font-semibold uppercase block">Precio ($)</label>
              <input type="number" step="0.01" required placeholder="0.00" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} className="k-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs k-muted font-semibold uppercase block">Stock</label>
              <input type="number" required placeholder="1" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="k-input" />
            </div>
          </div>
          {form.categoria === 'ROPA' && (
            <div className="border-t grid grid-cols-2 gap-4 pt-4" style={{ borderColor: 'var(--k-border)' }}>
              <p className="col-span-2 text-xs font-bold k-gold uppercase tracking-wider">Detalles de la Prenda</p>
              <div className="space-y-1.5"><label className="text-xs k-muted font-semibold block">Talla</label><input type="text" placeholder="M, G, 32" value={form.talla} onChange={e => setForm({ ...form, talla: e.target.value })} className="k-input" /></div>
              <div className="space-y-1.5"><label className="text-xs k-muted font-semibold block">Color</label><input type="text" placeholder="Negro" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="k-input" /></div>
              <div className="space-y-1.5"><label className="text-xs k-muted font-semibold block">Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="k-select">
                  <option value="Nueva">Nueva c/ etiqueta</option>
                  <option value="Excelente">Excelente estado</option>
                  <option value="Semi-nueva">Semi-nueva</option>
                </select>
              </div>
              <div className="space-y-1.5"><label className="text-xs k-muted font-semibold block">Marca</label><input type="text" placeholder="Nike, Levi's" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="k-input" /></div>
            </div>
          )}
          {form.categoria === 'PAPELERIA' && (
            <div className="border-t pt-4 space-y-1.5" style={{ borderColor: 'var(--k-border)' }}>
              <p className="text-xs font-bold k-green uppercase tracking-wider mb-3">Detalles de Papelería</p>
              <label className="text-xs k-muted font-semibold block">Marca/Distribuidor</label>
              <input type="text" placeholder="Scribe, BIC, Sharpie" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="k-input" />
            </div>
          )}
          {form.categoria === 'ABARROTES' && (
            <div className="border-t pt-4 space-y-1.5" style={{ borderColor: 'var(--k-border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--k-indigo)' }}>Detalles de Abarrotes</p>
              <label className="text-xs k-muted font-semibold block">Marca/Distribuidor</label>
              <input type="text" placeholder="Coca-Cola, Sabritas, Lala" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="k-input" />
            </div>
          )}
          <button type="submit" className="k-btn-primary w-full py-3 text-sm">{submitLabel}</button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { theme, setTheme } = useTheme();

  // Data state
  const [clientes,     setClientes]     = useState<ClienteUI[]>([]);
  const [productos,    setProductos]    = useState<Producto[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);

  // UI state
  const [activeTab,         setActiveTab]         = useState<ActiveTab>('dashboard');
  const [backendStatus,     setBackendStatus]     = useState<'online' | 'offline'>('offline');
  const [alertMsg,          setAlertMsg]          = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [inventarioFilter,  setInventarioFilter]  = useState<InventarioFilter>('TODOS');
  const [clienteDetalle,    setClienteDetalle]    = useState<ClienteUI | null>(null);
  const [showTrinity,       setShowTrinity]       = useState(false);
  const [txToCancel,        setTxToCancel]        = useState<Transaccion | null>(null);

  // Modals
  const [showAddClientModal,  setShowAddClientModal]  = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState<Producto | null>(null);
  const [showEditClientModal,  setShowEditClientModal]  = useState<ClienteUI | null>(null);
  const [showManualChargeModal, setShowManualChargeModal] = useState(false);
  const [manualChargeForm, setManualChargeForm] = useState({
    nombre: '',
    precio: '',
    categoria: 'SERVICIO' as Producto['categoria'],
    nota: ''
  });

  // Forms
  const [newClient, setNewClient] = useState({ nombre: '', telefono: '' });
  const emptyProduct = { nombre: '', precio: '', stock: '', categoria: 'ROPA' as Producto['categoria'], factorPuntos: '0.1', codigoBarras: '', talla: '', color: '', estado: 'Nueva', marca: '' };
  const [newProduct,  setNewProduct]  = useState(emptyProduct);
  const [editProduct, setEditProduct] = useState(emptyProduct);
  const [editClient,  setEditClient]  = useState({ nombre: '', telefono: '' });
  const [newSale, setNewSale] = useState({
    clienteId: '',
    tipoNegocio: 'ROPA' as Transaccion['tipoNegocio'],
    monto: '',
    comentarios: '',
    puntosCanjeados: 0,
    metodoEntrega: 'Tienda' as 'Tienda' | 'Retiro' | 'Envio',
    estatusEntrega: 'Entregado' as 'Pendiente' | 'Preparado' | 'Enviado' | 'Entregado'
  });
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);
  const [prodSearch, setProdSearch] = useState<string>('');
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState<boolean>(false);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  const [cajaSubTab, setCajaSubTab] = useState<'registrar' | 'historial'>('registrar');
  const [config, setConfig] = useState({
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
  });
  const [configForm, setConfigForm] = useState<any>(config);
  useEffect(() => {
    setConfigForm(config);
  }, [config]);

  // Document Title Effect
  useEffect(() => {
    if (config.nombreNegocio) {
      document.title = `${config.nombreNegocio} - Admin Panel`;
    }
  }, [config.nombreNegocio]);

  const clientSelectRef = useRef<HTMLDivElement>(null);
  const productSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientSelectRef.current && !clientSelectRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
      if (productSelectRef.current && !productSelectRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API}/health`);
        if (r.ok) { setBackendStatus('online'); loadData(); }
        else       { setBackendStatus('offline'); loadMock(); }
      } catch     { setBackendStatus('offline'); loadMock(); }
    };
    check();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p, t, conf] = await Promise.all([
        fetch(`${API}/api/clientes`).then(r => r.json()),
        fetch(`${API}/api/productos`).then(r => r.json()),
        fetch(`${API}/api/transacciones`).then(r => r.json()),
        fetch(`${API}/api/configuracion`).then(r => r.json()),
      ]);
      setClientes(c); setProductos(p); setTransacciones(t); setConfig(conf);
    } catch { triggerAlert('error', 'Error cargando datos.'); }
    finally  { setLoading(false); }
  };

  const loadMock = () => {
    setClientes([
      { id: 1, nombre: 'Alejandro Morales',   telefono: '5512345678', saldoPuntos: 150 },
      { id: 2, nombre: 'María Fernanda Ruiz', telefono: '5598765432', saldoPuntos: 80  },
      { id: 3, nombre: 'Eduardo Gómez',        telefono: '5544332211', saldoPuntos: 320 },
      { id: 4, nombre: 'Gabriela Lozano',      telefono: '5577889900', saldoPuntos: 45  },
    ]);
    setProductos([
      { id: 1, nombre: "Chaqueta Mezclilla Vintage Levi's", precio: 450, stock: 1, stockMinimo: 1, categoria: 'ROPA',      factorPuntos: 0.1,  codigoBarras: 'PACA-001', detalles: { talla: 'M', color: 'Azul',  estado: 'Excelente', marca: "Levi's"  } },
      { id: 2, nombre: 'Sudadera Oversize Champion',        precio: 380, stock: 0, stockMinimo: 1, categoria: 'ROPA',      factorPuntos: 0.1,  codigoBarras: 'PACA-002', detalles: { talla: 'L', color: 'Gris',  estado: 'Nueva',     marca: 'Champion'} },
      { id: 3, nombre: 'Cuaderno Profesional Raya 100H',   precio: 45,  stock: 120,stockMinimo: 15,categoria: 'PAPELERIA', factorPuntos: 0.05, codigoBarras: '750102030405', detalles: { marca: 'Scribe'  } },
      { id: 4, nombre: 'Paquete de Plumones Sharpie x12',    precio: 220, stock: 5,  stockMinimo: 10,categoria: 'PAPELERIA', factorPuntos: 0.05, codigoBarras: '750987654321', detalles: { marca: 'Sharpie' } },
      { id: 5, nombre: 'Impresión Color A4',               precio: 5,   stock: 9999,stockMinimo:0, categoria: 'SERVICIO',  factorPuntos: 0 },
      { id: 6, nombre: 'Refresco Coca-Cola 600ml',         precio: 19,  stock: 80,  stockMinimo: 20,categoria: 'ABARROTES', factorPuntos: 0.02, codigoBarras: '750105530007', detalles: { marca: 'Coca-Cola' } }
    ]);
    setTransacciones([
      { id: 1, clienteId: 3, cliente: { id: 3, nombre: 'Eduardo Gómez',        telefono: '5544332211', saldoPuntos: 320 }, tipoNegocio: 'ROPA',      monto: 830, puntosGanados: 83, comentarios: 'Suéteres paca premium',  createdAt: new Date(Date.now()-7200000).toISOString()  },
      { id: 2, clienteId: 1, cliente: { id: 1, nombre: 'Alejandro Morales',    telefono: '5512345678', saldoPuntos: 150 }, tipoNegocio: 'PAPELERIA', monto: 180, puntosGanados: 9,  comentarios: 'Útiles escolares',       createdAt: new Date(Date.now()-18000000).toISOString() },
      { id: 3,               tipoNegocio: 'SERVICIO',  monto: 45,  puntosGanados: 0,  comentarios: 'Copias',                 createdAt: new Date(Date.now()-43200000).toISOString() },
      { id: 4, clienteId: 2, cliente: { id: 2, nombre: 'María Fernanda Ruiz', telefono: '5598765432', saldoPuntos: 80  }, tipoNegocio: 'ROPA',      monto: 560, puntosGanados: 56, comentarios: 'Jean cargo + blusa',     createdAt: new Date(Date.now()-86400000).toISOString() },
    ]);
    setConfig({
      nombreNegocio: 'Kairon (Demo)',
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
    });
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const flashTrinity = () => {
    setShowTrinity(true);
    setTimeout(() => setShowTrinity(false), 2000);
  };

  // ── Computed ────────────────────────────────────────────────────────────────
  const activeTransacciones = transacciones.filter(t => !t.cancelada);
  const totalCaja      = activeTransacciones.reduce((a, t) => a + Number(t.monto), 0);
  const totalPuntos    = activeTransacciones.reduce((a, t) => a + t.puntosGanados, 0);
  const ventasRopa     = activeTransacciones.filter(t => t.tipoNegocio === 'ROPA').reduce((a, t) => a + t.monto, 0);
  const ventasPapeleria= activeTransacciones.filter(t => t.tipoNegocio === 'PAPELERIA').reduce((a, t) => a + t.monto, 0);
  const ventasAbarrotes= activeTransacciones.filter(t => t.tipoNegocio === 'ABARROTES').reduce((a, t) => a + t.monto, 0);
  const ventasServicio = activeTransacciones.filter(t => t.tipoNegocio === 'SERVICIO').reduce((a, t) => a + t.monto, 0);
  const productosBajoStock = productos.filter(p => p.stockMinimo !== undefined && p.stock <= p.stockMinimo && p.stock !== 9999);

  const filteredProducts = productos.filter(p => {
    const m = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || (p.codigoBarras || '').includes(searchQuery);
    const f = inventarioFilter === 'TODOS' || p.categoria === inventarioFilter;
    return m && f;
  });
  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || c.telefono.includes(searchQuery)
  );
  const transaccionesCliente = (id: number) => transacciones.filter(t => t.clienteId === id);

  // ── Handlers: Clientes ──────────────────────────────────────────────────────
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nombre || !newClient.telefono) return;
    let createdId: number | null = null;
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/clientes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) });
        if (r.ok) {
          const clientData = await r.json();
          createdId = clientData.id;
          triggerAlert('success', 'Cliente registrado.');
          await loadData();
          if (createdId) {
            setNewSale(prev => ({ ...prev, clienteId: String(createdId), puntosCanjeados: 0 }));
          }
        }
        else { const err = await r.json(); triggerAlert('error', err.error || 'Error.'); }
      } catch { triggerAlert('error', 'Error de red.'); }
    } else {
      const newId = clientes.length + 1;
      setClientes(prev => [...prev, { id: newId, nombre: newClient.nombre, telefono: newClient.telefono, saldoPuntos: 0 }]);
      triggerAlert('success', 'Cliente agregado (offline).');
      setNewSale(prev => ({ ...prev, clienteId: String(newId), puntosCanjeados: 0 }));
    }
    setShowAddClientModal(false); setNewClient({ nombre: '', telefono: '' });
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditClientModal) return;
    const updated = { ...showEditClientModal, ...editClient };
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/clientes/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: updated.nombre, telefono: updated.telefono }),
        });
        if (r.ok) { triggerAlert('success', 'Cliente actualizado.'); loadData(); }
        else { const err = await r.json(); triggerAlert('error', err.error || 'Error al actualizar.'); }
      } catch { triggerAlert('error', 'Error de red.'); }
    } else {
      setClientes(prev => prev.map(c => c.id === updated.id ? updated : c));
      if (clienteDetalle?.id === updated.id) setClienteDetalle(updated);
      triggerAlert('success', 'Cliente actualizado (offline).');
    }
    setShowEditClientModal(null);
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return;
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/clientes/${id}`, { method: 'DELETE' });
        if (r.ok) { triggerAlert('success', 'Cliente eliminado.'); loadData(); }
        else triggerAlert('error', 'Error al eliminar.');
      } catch { triggerAlert('error', 'Error de red.'); }
    } else {
      setClientes(prev => prev.filter(c => c.id !== id));
      if (clienteDetalle?.id === id) setClienteDetalle(null);
      triggerAlert('success', 'Cliente eliminado (offline).');
    }
  };

  // ── Handlers: Productos ─────────────────────────────────────────────────────
  const buildProductPayload = (f: typeof emptyProduct) => ({
    nombre: f.nombre, precio: parseFloat(f.precio), stock: parseInt(f.stock) || 0,
    categoria: f.categoria, factorPuntos: parseFloat(f.factorPuntos),
    codigoBarras: f.codigoBarras || undefined,
    detalles: f.categoria === 'ROPA' ? { talla: f.talla, color: f.color, estado: f.estado, marca: f.marca }
            : (f.categoria === 'PAPELERIA' || f.categoria === 'ABARROTES') ? { marca: f.marca } : undefined,
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildProductPayload(newProduct);
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (r.ok) { triggerAlert('success', 'Producto registrado.'); loadData(); }
        else triggerAlert('error', 'Error al guardar.');
      } catch { triggerAlert('error', 'Error de red.'); }
    } else {
      setProductos(prev => [...prev, { id: prev.length + 1, ...payload, stockMinimo: 0 } as Producto]);
      triggerAlert('success', 'Producto agregado (offline).');
    }
    setShowAddProductModal(false); setNewProduct(emptyProduct);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProductModal) return;
    const payload = buildProductPayload(editProduct);
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/productos/${showEditProductModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (r.ok) { triggerAlert('success', 'Producto actualizado.'); loadData(); }
        else triggerAlert('error', 'Error al actualizar.');
      } catch { triggerAlert('error', 'Error de red.'); }
    } else {
      const updated: Producto = { ...showEditProductModal, ...payload };
      setProductos(prev => prev.map(p => p.id === updated.id ? updated : p));
      triggerAlert('success', 'Producto actualizado (offline).');
    }
    setShowEditProductModal(null);
  };

  const handleDeleteProduct = async (id: number, categoria: string) => {
    if (!confirm('¿Eliminar este producto del inventario? Esta acción no se puede deshacer.')) return;
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/productos/${id}?categoria=${categoria}`, { method: 'DELETE' });
        if (r.ok) { triggerAlert('success', 'Producto eliminado.'); loadData(); }
        else triggerAlert('error', 'Error al eliminar.');
      } catch { triggerAlert('error', 'Error de red.'); }
    } else {
      setProductos(prev => prev.filter(p => p.id !== id));
      triggerAlert('success', 'Producto eliminado (offline).');
    }
  };

  const handleOpenAddProductModal = () => {
    let defaultCat: Producto['categoria'] = 'ROPA';
    if (config.habilitarRopa) defaultCat = 'ROPA';
    else if (config.habilitarPapeleria) defaultCat = 'PAPELERIA';
    else if (config.habilitarAbarrotes) defaultCat = 'ABARROTES';
    else if (config.habilitarServicios) defaultCat = 'SERVICIO';

    setNewProduct({ ...emptyProduct, categoria: defaultCat });
    setShowAddProductModal(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalConfig = {
      ...configForm,
      factorPuntosRopa: configForm.factorPuntosRopa === '' ? 0.00 : (parseFloat(configForm.factorPuntosRopa as any) || 0.00),
      factorPuntosPapeleria: configForm.factorPuntosPapeleria === '' ? 0.00 : (parseFloat(configForm.factorPuntosPapeleria as any) || 0.00),
      factorPuntosAbarrotes: configForm.factorPuntosAbarrotes === '' ? 0.00 : (parseFloat(configForm.factorPuntosAbarrotes as any) || 0.00),
      valorPuntoDescuento: configForm.valorPuntoDescuento === '' ? 0.50 : (parseFloat(configForm.valorPuntoDescuento as any) || 0.50),
      habilitarRopa: !!configForm.habilitarRopa,
      habilitarPapeleria: !!configForm.habilitarPapeleria,
      habilitarAbarrotes: !!configForm.habilitarAbarrotes,
      habilitarServicios: !!configForm.habilitarServicios,
      habilitarPuntos: !!configForm.habilitarPuntos
    };
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/configuracion`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalConfig),
        });
        if (r.ok) {
          const updated = await r.json();
          setConfig(updated);
          triggerAlert('success', 'Configuración guardada correctamente.');
        } else {
          triggerAlert('error', 'Error al guardar la configuración.');
        }
      } catch {
        triggerAlert('error', 'Error de red.');
      }
    } else {
      setConfig(finalConfig);
      triggerAlert('success', 'Configuración guardada (offline).');
    }
  };
  // ── Handlers: Carrito de Compras ────────────────────────────────────────────
  const selectProduct = (p: Producto) => {
    const cartItem = cart.find(item => item.producto.id === p.id && item.producto.categoria === p.categoria);
    if (cartItem) {
      if (p.stock !== 9999 && cartItem.cantidad >= p.stock) {
        triggerAlert('error', `Stock insuficiente. Solo quedan ${p.stock} unidades.`);
        return;
      }
      setCart(prev => prev.map(item => (item.producto.id === p.id && item.producto.categoria === p.categoria) ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart(prev => [...prev, { producto: p, cantidad: 1 }]);
    }
    setProdSearch('');
    setShowProductDropdown(false);
  };

  const handleAddManualProduct = (category: Producto['categoria'], name: string) => {
    setManualChargeForm({
      nombre: name,
      precio: '',
      categoria: category,
      nota: ''
    });
    setShowManualChargeModal(true);
  };

  const handleAddManualGeneric = () => {
    let defaultCat: Producto['categoria'] = 'SERVICIO';
    if (config.habilitarServicios) defaultCat = 'SERVICIO';
    else if (config.habilitarRopa) defaultCat = 'ROPA';
    else if (config.habilitarPapeleria) defaultCat = 'PAPELERIA';
    else if (config.habilitarAbarrotes) defaultCat = 'ABARROTES';

    setManualChargeForm({
      nombre: 'Cobro Directo',
      precio: '',
      categoria: defaultCat,
      nota: ''
    });
    setShowManualChargeModal(true);
  };

  const handleSaveManualCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const { nombre, precio, categoria, nota } = manualChargeForm;
    const price = parseFloat(precio);
    if (!nombre.trim()) {
      triggerAlert('error', 'El nombre o concepto es requerido.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      triggerAlert('error', 'El precio ingresado no es válido.');
      return;
    }

    let factor = 0;
    if (categoria === 'ROPA') factor = config.factorPuntosRopa;
    else if (categoria === 'PAPELERIA') factor = config.factorPuntosPapeleria;
    else if (categoria === 'ABARROTES') factor = config.factorPuntosAbarrotes;

    const fullNombre = `${nombre.trim()}${nota.trim() ? ` (${nota.trim()})` : ''}`;

    const customProd: Producto = {
      id: -Math.floor(Math.random() * 100000), // Negative ID for manual items
      nombre: fullNombre,
      precio: price,
      stock: 9999, // Infinite stock
      categoria: categoria,
      factorPuntos: factor
    };

    setCart(prev => [...prev, { producto: customProd, cantidad: 1 }]);
    setShowManualChargeModal(false);
    setManualChargeForm({ nombre: '', precio: '', categoria: 'SERVICIO', nota: '' });
    setProdSearch('');
    setShowProductDropdown(false);
    triggerAlert('success', `Concepto "${fullNombre}" agregado al carrito.`);
  };

  const handleUpdateDeliveryStatus = async (transId: number, status: string) => {
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/transacciones/${transId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estatusEntrega: status })
        });
        if (r.ok) {
          triggerAlert('success', 'Estatus de envío actualizado.');
          loadData();
        } else {
          triggerAlert('error', 'Error al actualizar estatus.');
        }
      } catch {
        triggerAlert('error', 'Error de red.');
      }
    } else {
      setTransacciones(prev => prev.map(t => t.id === transId ? { ...t, estatusEntrega: status as any } : t));
      triggerAlert('success', 'Estatus actualizado localmente (offline).');
    }
  };

  const handleUpdateCartQty = (id: number, categoria: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveFromCart(id, categoria);
      return;
    }
    const item = cart.find(x => x.producto.id === id && x.producto.categoria === categoria);
    if (!item) return;
    if (item.producto.stock !== 9999 && qty > item.producto.stock) {
      triggerAlert('error', `Stock insuficiente. Solo quedan ${item.producto.stock} unidades.`);
      return;
    }
    setCart(prev => prev.map(x => (x.producto.id === id && x.producto.categoria === categoria) ? { ...x, cantidad: qty } : x));
  };

  const handleRemoveFromCart = (id: number, categoria: string) => {
    setCart(prev => prev.filter(x => !(x.producto.id === id && x.producto.categoria === categoria)));
  };

  // ── Handlers: Transacciones ─────────────────────────────────────────────────
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerAlert('error', 'El carrito está vacío. Agrega productos antes de cobrar.');
      return;
    }

    const clienteId     = newSale.clienteId ? parseInt(newSale.clienteId) : undefined;
    const puntosCanjeados = newSale.puntosCanjeados || 0;
    
    // Calcular montos
    const montoBase     = cart.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
    const montoFinal    = Math.max(0, montoBase - puntosCanjeados * config.valorPuntoDescuento);

    // Calcular puntos de forma ponderada por categoría usando los factores de la configuración
    const puntosBaseRopa      = cart.filter(x => x.producto.categoria === 'ROPA').reduce((acc, x) => acc + x.producto.precio * x.cantidad * config.factorPuntosRopa, 0);
    const puntosBasePapeleria = cart.filter(x => x.producto.categoria === 'PAPELERIA').reduce((acc, x) => acc + x.producto.precio * x.cantidad * config.factorPuntosPapeleria, 0);
    const puntosBaseAbarrotes = cart.filter(x => x.producto.categoria === 'ABARROTES').reduce((acc, x) => acc + x.producto.precio * x.cantidad * config.factorPuntosAbarrotes, 0);
    const totalPuntosBase     = puntosBaseRopa + puntosBasePapeleria + puntosBaseAbarrotes;
    const puntosGanados = clienteId && montoBase > 0 ? Math.floor(totalPuntosBase * (montoFinal / montoBase)) : 0;

    // Determinar categoría principal del negocio para la transacción
    const getCartTipoNegocio = (): Transaccion['tipoNegocio'] => {
      if (cart.some(x => x.producto.categoria === 'ROPA')) return 'ROPA';
      if (cart.some(x => x.producto.categoria === 'PAPELERIA')) return 'PAPELERIA';
      if (cart.some(x => x.producto.categoria === 'ABARROTES')) return 'ABARROTES';
      return 'SERVICIO';
    };
    const tipoNegocio = getCartTipoNegocio();

    // Generar desglose automático de productos para la nota/comentarios
    const autoNotas = cart.map(x => `${x.cantidad}x ${x.producto.nombre} ($${(x.producto.precio * x.cantidad).toFixed(2)})`).join(', ');
    const comentariosFinales = newSale.comentarios ? `${autoNotas} | ${newSale.comentarios}` : autoNotas;

    // Estructura de items para mandar al backend y descontar stock
    const payloadItems = cart.map(item => ({
      id: item.producto.id,
      categoria: item.producto.categoria,
      cantidad: item.cantidad
    }));

    const payloadVenta = {
      clienteId,
      tipoNegocio,
      monto: montoFinal,
      puntosGanados,
      comentarios: comentariosFinales,
      items: payloadItems,
      metodoEntrega: newSale.metodoEntrega,
      estatusEntrega: newSale.estatusEntrega
    };

    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/transacciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadVenta)
        });
        if (!r.ok) { triggerAlert('error', 'Error al registrar venta.'); return; }
        
        // Si hubo canje de puntos, registrar transacción negativa
        if (clienteId && puntosCanjeados > 0) {
          await fetch(`${API}/api/transacciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clienteId,
              tipoNegocio,
              monto: 0,
              puntosGanados: -puntosCanjeados,
              comentarios: `Canje: -${puntosCanjeados} pts = -$${(puntosCanjeados * config.valorPuntoDescuento).toFixed(2)} descuento`,
            }),
          });
        }
        triggerAlert('success', puntosCanjeados > 0 ? `Venta registrada. Canje de ${puntosCanjeados} pts aplicado.` : 'Venta registrada.');
        if (puntosGanados > 0) flashTrinity();
        loadData();
      } catch { triggerAlert('error', 'Error de conexión.'); }
    } else {
      const dbClient = clientes.find(c => c.id === clienteId);
      setTransacciones(prev => [{ id: prev.length + 1, ...payloadVenta, cliente: dbClient, createdAt: new Date().toISOString() }, ...prev]);
      
      // Actualizar puntos del cliente localmente
      if (clienteId) {
        setClientes(prev => prev.map(c => c.id === clienteId
          ? { ...c, saldoPuntos: c.saldoPuntos + puntosGanados - puntosCanjeados }
          : c
        ));
      }

      // Decrementar stock localmente
      setProductos(prev => prev.map(p => {
        const cartItem = cart.find(item => item.producto.id === p.id && item.producto.categoria === p.categoria);
        if (cartItem && p.stock !== 9999) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.cantidad) };
        }
        return p;
      }));

      if (puntosGanados > 0) flashTrinity();
      triggerAlert('success', 'Venta guardada (offline). Stock actualizado localmente.');
    }

    setNewSale({
      clienteId: '',
      tipoNegocio: 'ROPA',
      monto: '',
      comentarios: '',
      puntosCanjeados: 0,
      metodoEntrega: 'Retiro',
      estatusEntrega: 'Entregado'
    });
    setCart([]);
    setProdSearch('');
  };

  const handleCancelTransaction = async (t: Transaccion) => {
    if (backendStatus === 'online') {
      try {
        const r = await fetch(`${API}/api/transacciones/${t.id}/cancelar`, { method: 'POST' });
        if (r.ok) {
          triggerAlert('success', 'Venta cancelada correctamente. Inventario y puntos actualizados.');
          loadData();
        } else {
          const err = await r.json();
          triggerAlert('error', err.error || 'Error al cancelar la transacción.');
        }
      } catch {
        triggerAlert('error', 'Error de red.');
      }
    } else {
      setTransacciones(prev => prev.map(item => item.id === t.id ? { ...item, cancelada: true } : item));
      if (t.clienteId && t.puntosGanados !== 0) {
        setClientes(prev => prev.map(c => c.id === t.clienteId
          ? { ...c, saldoPuntos: Math.max(0, c.saldoPuntos - t.puntosGanados) }
          : c
        ));
      }
      if (t.items && Array.isArray(t.items)) {
        setProductos(prev => prev.map(p => {
          const returnedItem = t.items.find((item: any) => item.id === p.id && item.categoria === p.categoria);
          if (returnedItem && p.stock !== 9999) {
            return { ...p, stock: p.stock + returnedItem.cantidad };
          }
          return p;
        }));
      }
      triggerAlert('success', 'Venta cancelada localmente (offline). Inventario revertido.');
    }
    setTxToCancel(null);
  };

  // ── Nav items ───────────────────────────────────────────────────────────────
  const navItems = [
    { tab: 'dashboard'  as ActiveTab, icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { tab: 'inventario' as ActiveTab, icon: <Shirt className="w-5 h-5" />,           label: 'Inventario',   badge: productosBajoStock.length || undefined },
    { tab: 'caja'       as ActiveTab, icon: <Coins className="w-5 h-5" />,           label: 'Caja / Ventas' },
    { tab: 'clientes'   as ActiveTab, icon: <Users className="w-5 h-5" />,           label: 'Clientes' },
    { tab: 'reportes'   as ActiveTab, icon: <BarChart3 className="w-5 h-5" />,       label: 'Reportes' },
    { tab: 'configuracion' as ActiveTab, icon: <Palette className="w-5 h-5" />,      label: 'Configuración' },
  ];

  const clienteSeleccionado = newSale.clienteId ? clientes.find(c => c.id === parseInt(newSale.clienteId)) : null;
  const puntosDisponibles   = clienteSeleccionado?.saldoPuntos || 0;
  const puntosCanjeados     = newSale.puntosCanjeados || 0;
  const descuentoCanje      = puntosCanjeados * config.valorPuntoDescuento;
  const montoBase           = cart.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  const montoFinal          = Math.max(0, montoBase - descuentoCanje);
  const puntosBaseRopa      = cart.filter(x => x.producto.categoria === 'ROPA').reduce((acc, x) => acc + x.producto.precio * x.cantidad * config.factorPuntosRopa, 0);
  const puntosBasePapeleria = cart.filter(x => x.producto.categoria === 'PAPELERIA').reduce((acc, x) => acc + x.producto.precio * x.cantidad * config.factorPuntosPapeleria, 0);
  const puntosBaseAbarrotes = cart.filter(x => x.producto.categoria === 'ABARROTES').reduce((acc, x) => acc + x.producto.precio * x.cantidad * config.factorPuntosAbarrotes, 0);
  const totalPuntosBase     = puntosBaseRopa + puntosBasePapeleria + puntosBaseAbarrotes;
  const puntosPreview       = clienteSeleccionado && montoBase > 0
    ? Math.floor(totalPuntosBase * (montoFinal / montoBase))
    : 0;

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="k-app" style={{ position: 'relative' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside className="k-sidebar w-64 flex flex-col justify-between sticky top-0 h-screen z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--k-border)' }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--k-gold) 0%, color-mix(in srgb, var(--k-gold) 60%, var(--k-green)) 50%, var(--k-green) 100%)' }}>
              {/* La K trinitaria: ícono */}
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="kairon-logo-text text-lg leading-none truncate max-w-[160px]">{config.nombreNegocio.toUpperCase()}</h1>
              <p className="text-[10px] k-muted font-semibold uppercase tracking-widest mt-0.5">MultiSaaS Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(({ tab, icon, label, badge }) => (
              <button key={tab} id={`nav-${tab}`}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); setClienteDetalle(null); }}
                className={`k-nav-item ${activeTab === tab ? 'active' : ''}`}>
                <span className="flex items-center gap-3">{icon}<span>{label}</span></span>
                {badge ? <span className="text-[10px] font-extrabold text-white rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ background: 'var(--k-gold)' }}>{badge}</span> : null}
              </button>
            ))}
          </nav>

          {/* Footer sidebar */}
          <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--k-border)' }}>
            {/* Theme Switcher */}
            <ThemeSwitcher current={theme} onChange={setTheme} />

            {/* Backend status */}
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] k-muted">API:</span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold"
                style={{ color: backendStatus === 'online' ? '#22C55E' : '#F59E0B' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: backendStatus === 'online' ? '#22C55E' : '#F59E0B',
                           animation: backendStatus === 'online' ? 'ping 1.5s infinite' : 'none' }} />
                {backendStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            {backendStatus === 'online' && (
              <button onClick={loadData}
                className="w-full text-xs flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all k-muted"
                style={{ background: 'var(--k-nav-hover)' }}>
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Actualizar datos
              </button>
            )}
            <p className="text-[10px] k-muted text-center">KAIRON v1.1.0</p>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">

        {/* Header */}
        <header className="k-header h-20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto w-full h-full px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {clienteDetalle && (
                <button onClick={() => setClienteDetalle(null)}
                  className="k-muted hover:k-text p-1.5 rounded-lg transition-all"
                  style={{ background: 'var(--k-nav-hover)' }}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-bold k-text capitalize tracking-wide">
                {clienteDetalle ? `${clienteDetalle.nombre}`
                  : activeTab === 'dashboard' ? 'Panel de Control'
                  : activeTab === 'inventario' ? 'Inventario'
                  : activeTab === 'caja' ? 'Caja / Ventas'
                  : activeTab === 'clientes' ? 'Clientes & Puntos'
                  : activeTab === 'reportes' ? 'Reportes'
                  : 'Configuración'}
              </h2>
              {backendStatus === 'offline' && (
                <span className="text-xs font-medium flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border"
                  style={{ color: 'var(--k-gold)', borderColor: 'var(--k-border)', background: 'var(--k-nav-hover)' }}>
                  <AlertCircle className="w-3.5 h-3.5" />Datos locales
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {productosBajoStock.length > 0 && (
                <button onClick={() => setActiveTab('inventario')}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all"
                  style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)' }}>
                  <AlertTriangle className="w-4 h-4" />
                  {productosBajoStock.length} bajo stock
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Trinity flash */}
        {showTrinity && (
          <div className="fixed bottom-24 right-12 z-50 pointer-events-none">
            <TrinitySparkle show />
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">

          {/* ═══ DASHBOARD ═══ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { show: true, label: 'Ingresos en Caja',  value: `$${totalCaja.toFixed(2)}`,    sub: 'Total acumulado',       icon: <DollarSign className="w-6 h-6" />, color: 'var(--k-gold)'  },
                  { show: config.habilitarRopa, label: 'Stock Ropa Paca',    value: `${productos.filter(p=>p.categoria==='ROPA').reduce((a,p)=>a+p.stock,0)} pzs`, sub: 'Prendas únicas', icon: <Shirt className="w-6 h-6" />,     color: 'var(--k-green)' },
                  { show: config.habilitarPapeleria, label: 'Stock Papelería',    value: `${productos.filter(p=>p.categoria==='PAPELERIA').reduce((a,p)=>a+p.stock,0)} uds`, sub: 'Artículos', icon: <Package2 className="w-6 h-6" />,  color: 'var(--k-teal)'  },
                  { show: config.habilitarAbarrotes, label: 'Stock Abarrotes',    value: `${productos.filter(p=>p.categoria==='ABARROTES').reduce((a,p)=>a+p.stock,0)} uds`, sub: 'Abarrotes', icon: <Package className="w-6 h-6" />,  color: 'var(--k-gold)'  },
                  { show: true, label: 'Clientes Lealtad',   value: `${clientes.length}`,           sub: `${totalPuntos} pts otorgados`, icon: <Users className="w-6 h-6" />,    color: 'var(--k-gold)'  },
                ].filter(s => s.show).map((s, i) => (
                  <div key={i} className="glass-panel p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150"
                      style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)` }} />
                    <div className="space-y-1.5 relative z-10">
                      <p className="text-xs font-semibold k-muted uppercase tracking-wider">{s.label}</p>
                      <h3 className="text-3xl font-extrabold k-text tracking-tight">{s.value}</h3>
                      <p className="text-xs font-medium flex items-center gap-1" style={{ color: s.color }}>
                        <TrendingUp className="w-3.5 h-3.5" />{s.sub}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner relative z-10"
                      style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${s.color} 25%, transparent)`, color: s.color }}>
                      {s.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Transacciones + Acciones */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg k-text">Transacciones Recientes</h4>
                      <p className="text-xs k-muted">Historial general de ventas</p>
                    </div>
                    <span className="text-xs k-muted px-3 py-1 rounded-full"
                      style={{ background: 'var(--k-nav-hover)', border: '1px solid var(--k-border)' }}>
                      {transacciones.length} en total
                    </span>
                  </div>
                  <table className="w-full k-table text-left border-collapse">
                    <thead><tr>
                      <th>Tipo</th><th>Cliente / Detalle</th>
                      <th className="text-right">Monto</th>
                      {config.habilitarPuntos && <th className="text-right">Puntos</th>}
                      <th className="text-right">Hora</th>
                    </tr></thead>
                    <tbody>
                      {[...transacciones].reverse().slice(0, 6).map(t => (
                        <tr key={t.id} style={t.cancelada ? { opacity: 0.5 } : {}}>
                          <td><CategoriaBadge cat={t.tipoNegocio} /></td>
                          <td>
                            <p className="font-medium k-text">
                              {t.cliente?.nombre || 'Público General'}{' '}
                              {t.cancelada && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">Cancelada</span>}
                            </p>
                            <p className="text-xs k-muted truncate max-w-xs">{t.comentarios || 'Sin notas'}</p>
                          </td>
                          <td className="text-right font-bold k-text" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>${Number(t.monto).toFixed(2)}</td>
                          {config.habilitarPuntos && (
                            <td className="text-right font-bold" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>
                              {t.puntosGanados > 0 ? (
                                <span style={{ color: 'var(--k-gold)' }}>+{t.puntosGanados}</span>
                              ) : t.puntosGanados < 0 ? (
                                <span style={{ color: '#f87171' }}>{t.puntosGanados}</span>
                              ) : (
                                <span className="opacity-40 font-normal k-muted">—</span>
                              )}
                            </td>
                          )}
                          <td className="text-right text-xs k-muted">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-5">
                  <div>
                    <h4 className="font-bold text-lg k-text mb-1">Acciones Rápidas</h4>
                    <p className="text-xs k-muted mb-5">Registra nuevos activos</p>
                    <div className="space-y-3">
                      {[
                        { icon: <Shirt className="w-5 h-5" />, label: 'Agregar Producto', sub: 'Ropa de paca o papelería', color: 'var(--k-green)', fn: () => handleOpenAddProductModal() },
                        { icon: <Users className="w-5 h-5" />, label: 'Registrar Cliente', sub: 'Sumar al programa de lealtad', color: 'var(--k-teal)', fn: () => setShowAddClientModal(true) },
                      ].map((a, i) => (
                        <button key={i} onClick={a.fn}
                          className="w-full flex items-center justify-between p-4 rounded-xl transition-all group"
                          style={{ background: 'var(--k-nav-hover)', border: '1px solid var(--k-border)' }}>
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg" style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)`, color: a.color, border: `1px solid color-mix(in srgb, ${a.color} 25%, transparent)` }}>{a.icon}</div>
                            <div className="text-left">
                              <p className="font-semibold text-sm k-text">{a.label}</p>
                              <p className="text-[11px] k-muted">{a.sub}</p>
                            </div>
                          </div>
                          <Plus className="w-5 h-5 k-muted group-hover:k-text group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Reglas de Lealtad */}
                  <div className="p-4 rounded-xl space-y-3"
                    style={{ background: `color-mix(in srgb, var(--k-gold) 8%, var(--k-sidebar))`, border: '1px solid var(--k-border)' }}>
                    <div className="flex items-center gap-2 k-gold">
                      <Sparkles className="w-4 h-4" /><span className="font-bold text-xs uppercase tracking-wider">Reglas de Lealtad</span>
                    </div>
                    <ul className="text-xs space-y-1.5 k-muted">
                      {config.habilitarRopa && (
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--k-gold)' }} />
                          Ropa: <strong className="k-text ml-1">{(config.factorPuntosRopa * 100).toFixed(0)}%</strong>
                        </li>
                      )}
                      {config.habilitarPapeleria && (
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--k-green)' }} />
                          Papelería: <strong className="k-text ml-1">{(config.factorPuntosPapeleria * 100).toFixed(0)}%</strong>
                        </li>
                      )}
                      {config.habilitarAbarrotes && (
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--k-indigo)' }} />
                          Abarrotes: <strong className="k-text ml-1">{(config.factorPuntosAbarrotes * 100).toFixed(0)}%</strong>
                        </li>
                      )}
                      {config.habilitarServicios && (
                        <li className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--k-teal)' }} />
                          Servicios: sin acumulación
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══ INVENTARIO ═══ */}
          {activeTab === 'inventario' && (
            <div className="space-y-5">
              {productosBajoStock.length > 0 && (
                <div className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#f87171' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#f87171' }}>{productosBajoStock.length} producto{productosBajoStock.length > 1 ? 's' : ''} con stock bajo</p>
                    <p className="text-xs" style={{ color: 'rgba(248,113,113,0.7)' }}>{productosBajoStock.map(p => p.nombre).join(', ')}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 k-muted" />
                    <input type="text" placeholder="Buscar producto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="k-input pl-10" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 k-muted" />
                    {([
                      { value: 'TODOS', label: 'Todos', show: true },
                      { value: 'ROPA', label: 'Ropa', show: config.habilitarRopa },
                      { value: 'PAPELERIA', label: 'Papelería', show: config.habilitarPapeleria },
                      { value: 'ABARROTES', label: 'Abarrotes', show: config.habilitarAbarrotes },
                      { value: 'SERVICIO', label: 'Servicios', show: config.habilitarServicios }
                    ] as { value: InventarioFilter; label: string; show: boolean }[])
                      .filter(f => f.show)
                      .map(f => (
                        <button key={f.value} onClick={() => setInventarioFilter(f.value)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={inventarioFilter === f.value
                            ? { background: 'var(--k-gold)', color: '#fff' }
                            : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)', border: '1px solid var(--k-border)' }}>
                          {f.label}
                        </button>
                    ))}
                  </div>
                </div>
                <button id="btn-nuevo-producto" onClick={() => handleOpenAddProductModal()} className="k-btn-primary flex items-center gap-2 px-5 text-sm shrink-0" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                  <Plus className="w-4 h-4" />Nuevo Producto
                </button>
              </div>
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full k-table text-left border-collapse">
                  <thead><tr>
                    <th className="px-6">Producto</th><th className="px-6">Categoría</th>
                    <th className="px-6 text-right">Precio</th><th className="px-6 text-right">Stock</th>
                    <th className="px-6">Código</th><th className="px-6">Detalles</th>
                    <th className="px-6 text-right">Acciones</th>
                  </tr></thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const low = p.stockMinimo !== undefined && p.stock <= p.stockMinimo && p.stock !== 9999;
                      return (
                        <tr key={p.id} style={low ? { background: 'rgba(248,113,113,0.04)' } : {}}>
                          <td className="px-6">
                            <div className="flex items-center gap-2">
                              {low && <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#f87171' }} />}
                              <span className="font-bold k-text">{p.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6"><CategoriaBadge cat={p.categoria} /></td>
                          <td className="px-6 text-right font-bold k-text">${p.precio}</td>
                          <td className="px-6 text-right font-semibold">
                            <span style={{ color: p.stock === 0 ? '#f87171' : low ? '#fb923c' : 'var(--k-text)' }}>
                              {p.stock === 9999 ? '∞' : p.stock}
                            </span>
                          </td>
                          <td className="px-6 text-xs font-mono k-muted">{p.codigoBarras || '—'}</td>
                          <td className="px-6 text-xs k-muted">
                            {p.categoria === 'ROPA' && p.detalles ? `T:${p.detalles.talla} · ${p.detalles.color} · ${p.detalles.estado}` : p.detalles?.marca || '—'}
                          </td>
                          <td className="px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setShowEditProductModal(p); setEditProduct({ nombre: p.nombre, precio: String(p.precio), stock: String(p.stock), categoria: p.categoria, factorPuntos: String(p.factorPuntos), codigoBarras: p.codigoBarras || '', talla: p.detalles?.talla||'', color: p.detalles?.color||'', estado: p.detalles?.estado||'Nueva', marca: p.detalles?.marca||'' }); }}
                                className="p-2 rounded-lg k-muted transition-all" style={{ background: 'var(--k-nav-hover)' }}>
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id, p.categoria)}
                                className="p-2 rounded-lg transition-all" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-12 text-center k-muted">No se encontraron productos.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ CAJA ═══ */}
          {activeTab === 'caja' && (() => {
            const filteredProductOptions = productos.filter(p => {
              const isCategoryEnabled = 
                p.categoria === 'ROPA' ? config.habilitarRopa :
                p.categoria === 'PAPELERIA' ? config.habilitarPapeleria :
                p.categoria === 'ABARROTES' ? config.habilitarAbarrotes :
                p.categoria === 'SERVICIO' ? config.habilitarServicios : true;
              if (!isCategoryEnabled) return false;

              return p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) || 
                     (p.codigoBarras || '').includes(prodSearch);
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sub-Tabs Switcher */}
                <div className="flex gap-2 border-b pb-4" style={{ borderColor: 'var(--k-border)' }}>
                  <button
                    type="button"
                    onClick={() => setCajaSubTab('registrar')}
                    className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                    style={cajaSubTab === 'registrar'
                      ? { background: 'var(--k-gold)', color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }
                      : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)', border: '1px solid var(--k-border)' }}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Registrar Venta (Caja)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCajaSubTab('historial')}
                    className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                    style={cajaSubTab === 'historial'
                      ? { background: 'var(--k-gold)', color: '#fff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }
                      : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)', border: '1px solid var(--k-border)' }}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Historial & Métricas (Ventas)
                  </button>
                </div>

                {cajaSubTab === 'registrar' ? (
                  /* POS Panel */
                  <div className="glass-panel p-6 rounded-2xl space-y-6 shadow-xl animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--k-border)' }}>
                    <h3 className="text-lg font-bold k-text flex items-center gap-2">
                      <Coins className="w-5 h-5 k-gold" />
                      Registrar Venta (Punto de Venta)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddManualGeneric}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-all font-semibold flex items-center gap-1.5 px-3.5 py-2 rounded-xl"
                        style={{ background: 'var(--k-nav-hover)' }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cobro Manual (Otros)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCart([]);
                          setNewSale({
                            clienteId: '',
                            tipoNegocio: 'ROPA',
                            monto: '',
                            comentarios: '',
                            puntosCanjeados: 0,
                            metodoEntrega: 'Tienda',
                            estatusEntrega: 'Entregado'
                          });
                          setProdSearch('');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-all font-semibold flex items-center gap-1.5 px-3.5 py-2 rounded-xl"
                        style={{ background: 'var(--k-nav-hover)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Limpiar Venta
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleCreateSale} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Columna Izquierda: Búsqueda Combobox y Listado del Carrito */}
                    <div className="lg:col-span-7 space-y-5">
                      <Field label="Agregar Artículo (Buscar en Inventario)">
                        <div className="relative" ref={productSelectRef}>
                          <div className="relative">
                            <Search className="absolute left-3.5 top-3.5 w-4 h-4 k-muted" />
                            <input
                              type="text"
                              placeholder="Buscar por nombre o código de barras..."
                              value={prodSearch}
                              onChange={e => {
                                setProdSearch(e.target.value);
                                setShowProductDropdown(true);
                              }}
                              onFocus={() => setShowProductDropdown(true)}
                              className="k-input pl-11"
                            />
                            {prodSearch && (
                              <button
                                type="button"
                                onClick={() => setProdSearch('')}
                                className="absolute right-3.5 top-3.5 text-xs text-rose-400 hover:text-rose-300"
                              >
                                Limpiar
                              </button>
                            )}
                          </div>

                          {/* Dropdown flotante de productos */}
                          {showProductDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto glass-panel p-2 shadow-2xl z-[1000] rounded-xl border space-y-1"
                              style={{ background: 'var(--k-surface)', borderColor: 'var(--k-border)' }}>
                              {filteredProductOptions.map(p => {
                                const cartItem = cart.find(item => item.producto.id === p.id && item.producto.categoria === p.categoria);
                                const qtyInCart = cartItem?.cantidad || 0;
                                const remainingStock = p.stock === 9999 ? 9999 : p.stock - qtyInCart;
                                const isOutOfStock = p.stock !== 9999 && remainingStock <= 0;

                                return (
                                  <button
                                    key={`${p.categoria}-${p.id}`}
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => selectProduct(p)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-all ${
                                      isOutOfStock
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:bg-[var(--k-nav-hover)] text-[var(--k-text)]'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold truncate flex items-center gap-1.5">
                                        {p.nombre}
                                        {qtyInCart > 0 && (
                                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-extrabold">
                                            {qtyInCart} pzs
                                          </span>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <CategoriaBadge cat={p.categoria} />
                                        <span className="text-[10px] k-muted">{p.codigoBarras || 'Sin código'}</span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-3 shrink-0">
                                      <p className="font-extrabold text-xs k-text">${p.precio.toFixed(2)}</p>
                                      <p className={`text-[9px] font-bold ${isOutOfStock ? 'text-rose-400' : 'k-muted'}`}>
                                        {isOutOfStock ? 'Agotado' : p.stock === 9999 ? 'Disp: ∞' : `Disp: ${remainingStock}`}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                              {filteredProductOptions.length === 0 && (
                                <div className="space-y-2">
                                  <div className="text-center py-4 text-xs k-muted">No se encontraron productos</div>
                                  {prodSearch.trim() !== '' && (
                                    <div className="border-t pt-2 space-y-1" style={{ borderColor: 'var(--k-border)' }}>
                                      <p className="text-[10px] uppercase font-bold k-muted px-2.5 mb-1.5">Concepto Manual</p>
                                      {config.habilitarRopa && (
                                        <button
                                          type="button"
                                          onClick={() => handleAddManualProduct('ROPA', prodSearch.trim())}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--k-nav-hover)] text-[var(--k-text)] flex items-center justify-between rounded-lg"
                                        >
                                          <span>Añadir <strong>"{prodSearch.trim()}"</strong> como Ropa manual</span>
                                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-extrabold uppercase">ROPA</span>
                                        </button>
                                      )}
                                      {config.habilitarPapeleria && (
                                        <button
                                          type="button"
                                          onClick={() => handleAddManualProduct('PAPELERIA', prodSearch.trim())}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--k-nav-hover)] text-[var(--k-text)] flex items-center justify-between rounded-lg"
                                        >
                                          <span>Añadir <strong>"{prodSearch.trim()}"</strong> como Papelería manual</span>
                                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-extrabold uppercase">PAPELERIA</span>
                                        </button>
                                      )}
                                      {config.habilitarAbarrotes && (
                                        <button
                                          type="button"
                                          onClick={() => handleAddManualProduct('ABARROTES', prodSearch.trim())}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--k-nav-hover)] text-[var(--k-text)] flex items-center justify-between rounded-lg"
                                        >
                                          <span>Añadir <strong>"{prodSearch.trim()}"</strong> como Abarrotes manual</span>
                                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase">ABARROTES</span>
                                        </button>
                                      )}
                                      {config.habilitarServicios && (
                                        <button
                                          type="button"
                                          onClick={() => handleAddManualProduct('SERVICIO', prodSearch.trim())}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--k-nav-hover)] text-[var(--k-text)] flex items-center justify-between rounded-lg"
                                        >
                                          <span>Añadir <strong>"{prodSearch.trim()}"</strong> como Servicio manual</span>
                                          <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-extrabold uppercase">SERVICIO</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Field>

                      {/* Lista de artículos en la venta */}
                      <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--k-panel-bg)', borderColor: 'var(--k-border)' }}>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider k-muted">Artículos Agregados a esta Venta</span>
                        
                        {cart.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {cart.map(item => {
                              const p = item.producto;
                              return (
                                <div key={`${p.categoria}-${p.id}`} className="flex items-center justify-between gap-3 text-sm border-b pb-2.5 last:border-0 last:pb-0" style={{ borderColor: 'var(--k-border)' }}>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold k-text truncate text-xs">{p.nombre}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <CategoriaBadge cat={p.categoria} />
                                      <span className="text-[10px] k-muted">${p.precio.toFixed(2)} c/u</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-800/20 border border-slate-700/30 rounded-lg p-0.5" style={{ background: 'var(--k-nav-hover)', borderColor: 'var(--k-border)' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCartQty(p.id, p.categoria, item.cantidad - 1)}
                                      className="w-5.5 h-5.5 rounded flex items-center justify-center font-extrabold text-xs transition-all hover:bg-[var(--k-nav-hover)] k-text"
                                      style={{ width: '1.5rem', height: '1.5rem' }}
                                    >
                                      -
                                    </button>
                                    <span className="w-5 text-center font-mono font-bold k-text text-xs">{item.cantidad}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCartQty(p.id, p.categoria, item.cantidad + 1)}
                                      className="w-5.5 h-5.5 rounded flex items-center justify-center font-extrabold text-xs transition-all hover:bg-[var(--k-nav-hover)] k-text"
                                      style={{ width: '1.5rem', height: '1.5rem' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="text-right w-20 shrink-0">
                                    <span className="font-bold text-xs k-text">${(p.precio * item.cantidad).toFixed(2)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromCart(p.id, p.categoria)}
                                    className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg transition-colors shrink-0 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-xs k-muted flex flex-col items-center gap-2">
                            <Package className="w-8 h-8 opacity-20" />
                            El carrito está vacío. Agrega artículos usando el buscador de arriba.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Columna Derecha: Cliente, Puntos, Totales y Cobro */}
                    <div className="lg:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-6" style={{ borderColor: 'var(--k-border)' }}>
                      
                      {/* Vincular Cliente con botón "+" */}
                      <Field label="Vincular Cliente (Opcional)">
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1" ref={clientSelectRef}>
                            <button
                              type="button"
                              onClick={() => setShowClientDropdown(prev => !prev)}
                              className="k-input w-full text-left flex justify-between items-center py-2.5 px-3 text-xs"
                              style={{ background: 'var(--k-input-bg)' }}
                            >
                              {clienteSeleccionado ? (
                                <span className="truncate font-bold k-text">
                                  👤 {clienteSeleccionado.nombre} ({clienteSeleccionado.telefono})
                                </span>
                              ) : (
                                <span className="k-muted font-semibold">👥 Público General (Sin registrar)</span>
                              )}
                              <ChevronDown className="w-4 h-4 k-muted shrink-0 ml-2" />
                            </button>

                            {showClientDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto glass-panel p-2 shadow-2xl z-[1000] rounded-xl border text-[var(--k-text)] space-y-2"
                                style={{ background: 'var(--k-surface)', borderColor: 'var(--k-border)' }}>
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 k-muted" />
                                  <input
                                    type="text"
                                    placeholder="Buscar por nombre o teléfono..."
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    className="k-input pl-8 py-1.5 text-xs w-full"
                                    autoFocus
                                  />
                                </div>

                                <div className="space-y-0.5 max-h-44 overflow-y-auto pr-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewSale(prev => ({ ...prev, clienteId: '', puntosCanjeados: 0 }));
                                      setClientSearch('');
                                      setShowClientDropdown(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-[var(--k-nav-hover)] transition-all text-[var(--k-text)] font-semibold border-b border-dashed mb-1 pb-2"
                                    style={{ borderColor: 'var(--k-border)' }}
                                  >
                                    <span>— Público General (Sin cliente) —</span>
                                    <span className="text-[10px] k-muted">Ninguno</span>
                                  </button>

                                  {clientes
                                    .filter(c => c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || c.telefono.includes(clientSearch))
                                    .map(c => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                          setNewSale(prev => ({ ...prev, clienteId: String(c.id), puntosCanjeados: 0 }));
                                          setClientSearch('');
                                          setShowClientDropdown(false);
                                        }}
                                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-[var(--k-nav-hover)] transition-all text-[var(--k-text)]"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold truncate">{c.nombre}</p>
                                          <p className="text-[9px] k-muted">{c.telefono}</p>
                                        </div>
                                        {config.habilitarPuntos && (
                                          <div className="text-right ml-3 shrink-0">
                                            <p className="font-extrabold text-[var(--k-gold)] text-xs">{c.saldoPuntos} pts</p>
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setNewClient({ nombre: '', telefono: '' });
                              setShowAddClientModal(true);
                            }}
                            className="k-btn-primary p-3 flex items-center justify-center shrink-0"
                            style={{ borderRadius: '0.75rem' }}
                            title="Registrar Cliente Nuevo"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </Field>

                      {/* Canje de Puntos */}
                      {config.habilitarPuntos && clienteSeleccionado && puntosDisponibles > 0 && (
                        <div className="rounded-xl p-4 space-y-3 border shadow-sm" style={{ background: 'var(--k-panel-bg)', borderColor: 'var(--k-border)' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold k-teal uppercase tracking-wider flex items-center gap-1.5">
                              <Coins className="w-4 h-4" /> Puntos de Lealtad
                            </span>
                            <span className="text-xs k-muted">{puntosDisponibles} pts disponibles</span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min={0}
                              max={Math.min(puntosDisponibles, Math.floor(montoBase / config.valorPuntoDescuento))}
                              value={puntosCanjeados}
                              onChange={e => setNewSale({...newSale, puntosCanjeados: parseInt(e.target.value)})}
                              className="w-full accent-teal-500"
                            />
                            <div className="flex items-center justify-between text-xs">
                              <span className="k-muted">0 pts</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={Math.min(puntosDisponibles, Math.floor(montoBase / config.valorPuntoDescuento))}
                                  value={puntosCanjeados}
                                  onChange={e => setNewSale({...newSale, puntosCanjeados: Math.min(parseInt(e.target.value)||0, puntosDisponibles, Math.floor(montoBase/config.valorPuntoDescuento))})}
                                  className="k-input text-center w-20 py-1 px-2 text-xs"
                                />
                                <span className="k-muted">pts</span>
                              </div>
                              <span className="k-muted">{Math.min(puntosDisponibles, Math.floor(montoBase / config.valorPuntoDescuento))} pts máx</span>
                            </div>
                          </div>
                          {puntosCanjeados > 0 && (
                            <div className="rounded-lg p-2.5 text-xs space-y-1" style={{ background: 'color-mix(in srgb, var(--k-teal) 12%, transparent)' }}>
                              <div className="flex justify-between">
                                <span className="k-muted">Monto original:</span>
                                <span className="k-text font-medium">${montoBase.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between" style={{ color: 'var(--k-teal)' }}>
                                <span>Descuento ({puntosCanjeados} pts × ${config.valorPuntoDescuento.toFixed(2)}):</span>
                                <span className="font-bold font-mono">-${descuentoCanje.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Método de Entrega y Estado de Envío */}
                      <div className="rounded-xl p-4 space-y-4 border" style={{ background: 'var(--k-panel-bg)', borderColor: 'var(--k-border)' }}>
                        <div className="space-y-1.5">
                          <label className="text-[10px] k-muted font-bold uppercase tracking-wider block">Método de Entrega / Despacho</label>
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setNewSale({ ...newSale, metodoEntrega: 'Tienda', estatusEntrega: 'Entregado' })}
                              className="flex-1 text-xs py-2 px-1 rounded-lg font-bold border transition-all truncate"
                              style={newSale.metodoEntrega === 'Tienda'
                                ? { background: 'var(--k-gold)', color: '#fff', borderColor: 'var(--k-gold)' }
                                : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)', borderColor: 'var(--k-border)' }}
                            >
                              🛍️ Venta en Tienda
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewSale({ ...newSale, metodoEntrega: 'Retiro', estatusEntrega: 'Pendiente' })}
                              className="flex-1 text-xs py-2 px-1 rounded-lg font-bold border transition-all truncate"
                              style={newSale.metodoEntrega === 'Retiro'
                                ? { background: 'var(--k-gold)', color: '#fff', borderColor: 'var(--k-gold)' }
                                : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)', borderColor: 'var(--k-border)' }}
                            >
                              🏪 Pasar a Buscar
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewSale({ ...newSale, metodoEntrega: 'Envio', estatusEntrega: 'Pendiente' })}
                              className="flex-1 text-xs py-2 px-1 rounded-lg font-bold border transition-all truncate"
                              style={newSale.metodoEntrega === 'Envio'
                                ? { background: 'var(--k-gold)', color: '#fff', borderColor: 'var(--k-gold)' }
                                : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)', borderColor: 'var(--k-border)' }}
                            >
                              🚚 Envío a Domicilio
                            </button>
                          </div>
                        </div>

                        {newSale.metodoEntrega !== 'Tienda' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-[10px] k-muted font-bold uppercase tracking-wider block">
                              Estado de la Entrega ({newSale.metodoEntrega === 'Retiro' ? 'Retiro' : 'Envío'})
                            </label>
                            <select
                              value={newSale.estatusEntrega}
                              onChange={e => setNewSale({ ...newSale, estatusEntrega: e.target.value as any })}
                              className="k-select py-1.5 px-2.5 text-xs cursor-pointer"
                              style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)', borderColor: 'var(--k-border)' }}
                            >
                              <option value="Pendiente" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>⏳ Pendiente</option>
                              <option value="Preparado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>📦 Preparado</option>
                              {newSale.metodoEntrega === 'Envio' && (
                                <option value="Enviado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>🚚 Enviado</option>
                              )}
                              <option value="Entregado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>✅ Entregado</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Resumen de Totales */}
                      <div className="rounded-xl p-4 space-y-2.5 border" style={{ background: 'var(--k-panel-bg)', borderColor: 'var(--k-border)' }}>
                        <div className="flex justify-between text-sm">
                          <span className="k-muted">Subtotal:</span>
                          <span className="font-bold k-text">${montoBase.toFixed(2)}</span>
                        </div>
                        {puntosCanjeados > 0 && (
                          <div className="flex justify-between text-sm" style={{ color: 'var(--k-teal)' }}>
                            <span>Descuento aplicado:</span>
                            <span className="font-bold font-mono">-${descuentoCanje.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base border-t pt-2.5" style={{ borderColor: 'var(--k-border)' }}>
                          <span className="font-bold k-text">Total a cobrar:</span>
                          <span className="font-extrabold text-xl" style={{ color: 'var(--k-green)' }}>${montoFinal.toFixed(2)}</span>
                        </div>

                        {config.habilitarPuntos && puntosPreview > 0 && (
                          <div className="pt-2 text-[11px] flex items-center gap-1.5 k-gold font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Se otorgarán +{puntosPreview} puntos por esta venta</span>
                          </div>
                        )}
                      </div>

                      {/* Notas */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] k-muted font-bold uppercase tracking-wider block">Comentarios / Notas (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ej. Pago con transferencia, bolsa de regalo..."
                          value={newSale.comentarios}
                          onChange={e => setNewSale({ ...newSale, comentarios: e.target.value })}
                          className="k-input py-2.5 text-xs"
                        />
                      </div>

                      <SubmitBtn>{puntosCanjeados > 0 ? `Cobrar $${montoFinal.toFixed(2)}` : 'Registrar Venta'}</SubmitBtn>
                    </div>
                  </form>
                </div>
                ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Stats de Ventas por Categorías */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                  {[
                    { show: true, label: 'Total de Ventas', value: `$${totalCaja.toFixed(2)}`, color: 'var(--k-gold)' },
                    { show: config.habilitarRopa, label: 'Ventas Ropa', value: `$${ventasRopa.toFixed(2)}`, color: 'var(--k-green)' },
                    { show: config.habilitarPapeleria, label: 'Ventas Papelería', value: `$${ventasPapeleria.toFixed(2)}`, color: 'var(--k-teal)' },
                    { show: config.habilitarAbarrotes, label: 'Ventas Abarrotes', value: `$${ventasAbarrotes.toFixed(2)}`, color: 'var(--k-indigo)' },
                    { show: config.habilitarServicios, label: 'Ventas Servicios', value: `$${ventasServicio.toFixed(2)}`, color: 'var(--k-gold)' },
                  ].filter(s => s.show).map((s, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl" style={{ borderLeft: `4px solid ${s.color}` }}>
                      <p className="text-xs k-muted uppercase font-semibold">{s.label}</p>
                      <h3 className="text-2xl font-extrabold k-text mt-2">{s.value}</h3>
                    </div>
                  ))}
                </div>

                {/* Detalle Completo de Caja (Historial) */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h4 className="font-bold text-lg k-text mb-6">Detalle Completo de Caja</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full k-table text-left border-collapse">
                      <thead><tr>
                        <th>ID</th><th>Tipo</th><th>Cliente</th><th>Entrega</th><th>Notas</th>
                        <th className="text-right">Monto</th>
                        {config.habilitarPuntos && <th className="text-right">Puntos</th>}
                        <th className="text-right">Fecha</th>
                        <th className="text-right">Acción</th>
                      </tr></thead>
                      <tbody>
                        {[...transacciones].reverse().map(t => (
                          <tr key={t.id} style={t.cancelada ? { opacity: 0.6 } : {}}>
                            <td className="font-mono k-muted text-xs">#{t.id}</td>
                            <td><CategoriaBadge cat={t.tipoNegocio} /></td>
                            <td className="font-medium k-text">
                              {t.cliente?.nombre || 'Público General'}{' '}
                              {t.cancelada && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">Cancelada</span>}
                            </td>
                            <td>
                              {(t.metodoEntrega || 'Tienda') === 'Tienda' ? (
                                <span className="text-[11px] k-muted font-medium flex items-center gap-1">
                                  <span>🛍️ En Tienda</span>
                                </span>
                              ) : (t.metodoEntrega === 'Envio') ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-sky-400">🚚</span>
                                  <select
                                    value={t.estatusEntrega || 'Pendiente'}
                                    disabled={t.cancelada}
                                    onChange={e => handleUpdateDeliveryStatus(t.id, e.target.value)}
                                    className="border rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none cursor-pointer transition-all"
                                    style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)', borderColor: 'var(--k-border)' }}
                                  >
                                    <option value="Pendiente" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>⏳ Pendiente</option>
                                    <option value="Preparado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>📦 Preparado</option>
                                    <option value="Enviado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>🚚 Enviado</option>
                                    <option value="Entregado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>✅ Entregado</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-purple-400">🏪</span>
                                  <select
                                    value={t.estatusEntrega || 'Pendiente'}
                                    disabled={t.cancelada}
                                    onChange={e => handleUpdateDeliveryStatus(t.id, e.target.value)}
                                    className="border rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none cursor-pointer transition-all"
                                    style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)', borderColor: 'var(--k-border)' }}
                                  >
                                    <option value="Pendiente" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>⏳ Pendiente</option>
                                    <option value="Preparado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>📦 Preparado</option>
                                    <option value="Entregado" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>✅ Entregado</option>
                                  </select>
                                </div>
                              )}
                            </td>
                            <td className="k-muted text-xs max-w-sm truncate" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>{t.comentarios || '—'}</td>
                            <td className="text-right font-bold k-text" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>${Number(t.monto).toFixed(2)}</td>
                            {config.habilitarPuntos && (
                              <td className="text-right font-bold" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>
                                {t.puntosGanados > 0 ? (
                                  <span style={{ color: 'var(--k-gold)' }}>+{t.puntosGanados}</span>
                                ) : t.puntosGanados < 0 ? (
                                  <span style={{ color: '#f87171' }}>{t.puntosGanados}</span>
                                ) : (
                                  <span className="opacity-40 font-normal k-muted">—</span>
                                )}
                              </td>
                            )}
                            <td className="text-right text-xs k-muted" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>{new Date(t.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                            <td className="text-right">
                              {t.cancelada ? (
                                <span className="text-xs k-muted italic">Cancelada</span>
                              ) : (
                                <button
                                  onClick={() => setTxToCancel(t)}
                                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded transition-all"
                                  style={{ background: 'rgba(244,63,94,0.1)' }}
                                >
                                  Cancelar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
                )}
              </div>
            );
          })()}

          {/* ═══ CLIENTES ═══ */}
          {activeTab === 'clientes' && !clienteDetalle && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 k-muted" />
                  <input type="text" placeholder="Buscar cliente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="k-input pl-10" />
                </div>
                <button id="btn-registrar-cliente" onClick={() => setShowAddClientModal(true)}
                  className="k-btn-primary flex items-center gap-2 px-5 text-sm shrink-0" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                  <Plus className="w-4 h-4" />Registrar Cliente
                </button>
              </div>
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full k-table text-left border-collapse">
                  <thead><tr>
                    <th className="px-6">ID</th><th className="px-6">Nombre</th><th className="px-6">Teléfono</th>
                    {config.habilitarPuntos && <th className="px-6 text-right">Puntos</th>}
                    {config.habilitarPuntos && <th className="px-6 text-right">Equivalencia</th>}
                    <th className="px-6 text-right">Acciones</th>
                  </tr></thead>
                  <tbody>
                    {filteredClientes.map(c => (
                      <tr key={c.id} className="group">
                        <td className="px-6 font-mono k-muted text-xs">#{c.id}</td>
                        <td className="px-6">
                          <button onClick={() => setClienteDetalle(c)}
                            className="font-bold k-text flex items-center gap-1.5 transition-colors group-hover:k-gold">
                            {c.nombre}<ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        </td>
                        <td className="px-6 k-muted">{c.telefono}</td>
                        {config.habilitarPuntos && <td className="px-6 text-right font-extrabold text-base" style={{ color: 'var(--k-gold)' }}>{c.saldoPuntos} pts</td>}
                        {config.habilitarPuntos && <td className="px-6 text-right font-medium k-muted">${(c.saldoPuntos * config.valorPuntoDescuento).toFixed(2)} MXN</td>}
                        <td className="px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setShowEditClientModal(c); setEditClient({ nombre: c.nombre, telefono: c.telefono }); }}
                              className="p-2 rounded-lg k-muted transition-all" style={{ background: 'var(--k-nav-hover)' }}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClient(c.id)}
                              className="p-2 rounded-lg transition-all" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClientes.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center k-muted">Sin clientes.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ DETALLE CLIENTE ═══ */}
          {activeTab === 'clientes' && clienteDetalle && (
            <div className="space-y-5">
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shadow-lg k-gradient">
                    {clienteDetalle.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold k-text">{clienteDetalle.nombre}</h3>
                    <p className="k-muted text-sm">{clienteDetalle.telefono}</p>
                  </div>
                </div>
                <div className="flex gap-8">
                  {[
                    { label: 'Puntos', value: clienteDetalle.saldoPuntos, color: 'var(--k-gold)', show: config.habilitarPuntos },
                    { label: 'Equiv. MXN', value: `$${(clienteDetalle.saldoPuntos*config.valorPuntoDescuento).toFixed(2)}`, color: 'var(--k-text)', show: config.habilitarPuntos },
                    { label: 'Compras', value: transaccionesCliente(clienteDetalle.id).filter(t => !t.cancelada).length, color: 'var(--k-green)', show: true },
                  ].filter(x => x.show).map((s, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xs k-muted uppercase font-semibold mb-1">{s.label}</p>
                      <p className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="font-bold text-lg k-text mb-6">Historial de Compras</h4>
                {transaccionesCliente(clienteDetalle.id).length === 0 ? (
                  <div className="flex flex-col items-center py-12 k-muted gap-3">
                    <Package className="w-10 h-10 opacity-30" /><p>Sin compras aún.</p>
                  </div>
                ) : (
                    <table className="w-full k-table text-left border-collapse">
                      <thead><tr>
                        <th>ID</th><th>Tipo</th><th>Notas</th>
                        <th className="text-right">Monto</th>
                        {config.habilitarPuntos && <th className="text-right">Puntos</th>}
                        <th className="text-right">Fecha</th>
                      </tr></thead>
                      <tbody>
                        {[...transaccionesCliente(clienteDetalle.id)].reverse().map(t => (
                          <tr key={t.id} style={t.cancelada ? { opacity: 0.6 } : {}}>
                            <td className="font-mono k-muted text-xs">#{t.id}</td>
                            <td><CategoriaBadge cat={t.tipoNegocio} /></td>
                            <td className="k-muted text-xs">
                              {t.cancelada && <span className="text-rose-400 font-extrabold mr-1">[CANCELADA]</span>}
                              {t.comentarios || '—'}
                              {((t.metodoEntrega || 'Tienda') === 'Tienda') && (
                                <span className="block text-[10px] text-emerald-400 font-semibold mt-0.5">
                                  🛍️ En Tienda (Entregado)
                                </span>
                              )}
                              {t.metodoEntrega === 'Envio' && (
                                <span className="block text-[10px] text-sky-400 font-semibold mt-0.5">
                                  🚚 Envío ({t.estatusEntrega === 'Pendiente' ? '⏳ Pendiente' : t.estatusEntrega === 'Preparado' ? '📦 Preparado' : t.estatusEntrega === 'Enviado' ? '🚚 Envío' : '✅ Entregado'})
                                </span>
                              )}
                              {t.metodoEntrega === 'Retiro' && (
                                <span className="block text-[10px] text-purple-400 font-semibold mt-0.5">
                                  🏪 Retiro ({t.estatusEntrega === 'Pendiente' ? '⏳ Pendiente' : t.estatusEntrega === 'Preparado' ? '📦 Preparado' : '✅ Entregado'})
                                </span>
                              )}
                            </td>
                            <td className="text-right font-bold k-text" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>${Number(t.monto).toFixed(2)}</td>
                            {config.habilitarPuntos && (
                              <td className="text-right font-bold" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>
                                {t.puntosGanados > 0 ? (
                                  <span style={{ color: 'var(--k-gold)' }}>+{t.puntosGanados}</span>
                                ) : t.puntosGanados < 0 ? (
                                  <span style={{ color: '#f87171' }}>{t.puntosGanados}</span>
                                ) : (
                                  <span className="opacity-40 font-normal k-muted">—</span>
                                )}
                              </td>
                            )}
                            <td className="text-right text-xs k-muted" style={t.cancelada ? { textDecoration: 'line-through' } : {}}>{new Date(t.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ═══ REPORTES ═══ */}
          {activeTab === 'reportes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { show: true, label: 'Ticket Promedio', value: `$${transacciones.length > 0 ? (totalCaja/transacciones.length).toFixed(2) : '0.00'}`, icon: <TrendingUp className="w-5 h-5" />, color: 'var(--k-gold)' },
                  { show: config.habilitarPuntos, label: 'Puntos Otorgados', value: `${totalPuntos} pts`, icon: <Sparkles className="w-5 h-5" />, color: 'var(--k-green)' },
                  { show: config.habilitarPuntos, label: 'Clientes con Puntos', value: `${clientes.filter(c=>c.saldoPuntos>0).length} / ${clientes.length}`, icon: <UserCheck className="w-5 h-5" />, color: 'var(--k-teal)' },
                ].filter(k => k.show).map((k, i) => (
                  <div key={i} className="glass-panel p-6 rounded-2xl"
                    style={{ border: `1px solid color-mix(in srgb, ${k.color} 25%, transparent)`, background: `color-mix(in srgb, ${k.color} 5%, var(--k-panel-bg))` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `color-mix(in srgb, ${k.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${k.color} 25%, transparent)`, color: k.color }}>
                      {k.icon}
                    </div>
                    <p className="text-xs k-muted uppercase font-semibold">{k.label}</p>
                    <p className="text-3xl font-extrabold k-text mt-1">{k.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <div className={`glass-panel p-6 rounded-2xl space-y-5 ${!config.habilitarPuntos ? 'lg:col-span-2' : ''}`}>
                  <div>
                    <h4 className="font-bold text-lg k-text">Ventas por Tipo</h4>
                    <p className="text-xs k-muted">Total acumulado por categoría</p>
                  </div>
                  <MiniBarChart data={[
                    config.habilitarRopa && { label: 'Ropa',      value: ventasRopa,      color: 'linear-gradient(135deg,var(--k-green),color-mix(in srgb,var(--k-green) 70%,#fff))' },
                    config.habilitarPapeleria && { label: 'Papelería', value: ventasPapeleria, color: 'linear-gradient(135deg,var(--k-teal),color-mix(in srgb,var(--k-teal) 70%,#fff))' },
                    config.habilitarAbarrotes && { label: 'Abarrotes', value: ventasAbarrotes, color: 'linear-gradient(135deg,var(--k-indigo),color-mix(in srgb,var(--k-indigo) 70%,#fff))' },
                    config.habilitarServicios && { label: 'Servicios', value: ventasServicio,  color: 'linear-gradient(135deg,var(--k-gold),color-mix(in srgb,var(--k-gold) 70%,#fff))' },
                  ].filter(Boolean) as { label: string; value: number; color: string }[]} />
                  <div className="space-y-3 pt-2">
                    {[
                      { show: config.habilitarRopa, label: 'Ropa',      value: ventasRopa,      pct: totalCaja > 0 ? (ventasRopa/totalCaja*100).toFixed(1) : '0', color: 'var(--k-green)'  },
                      { show: config.habilitarPapeleria, label: 'Papelería', value: ventasPapeleria, pct: totalCaja > 0 ? (ventasPapeleria/totalCaja*100).toFixed(1) : '0', color: 'var(--k-teal)' },
                      { show: config.habilitarAbarrotes, label: 'Abarrotes', value: ventasAbarrotes, pct: totalCaja > 0 ? (ventasAbarrotes/totalCaja*100).toFixed(1) : '0', color: 'var(--k-indigo)' },
                      { show: config.habilitarServicios, label: 'Servicios', value: ventasServicio,  pct: totalCaja > 0 ? (ventasServicio/totalCaja*100).toFixed(1) : '0', color: 'var(--k-gold)'  },
                    ].filter(r => r.show).map((row, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: row.color }} />
                        <span className="text-sm k-muted w-24">{row.label}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--k-nav-hover)' }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, background: row.color }} />
                        </div>
                        <span className="text-xs k-muted w-10 text-right">{row.pct}%</span>
                        <span className="text-sm font-bold k-text w-20 text-right">${row.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top clientes */}
                {config.habilitarPuntos && (
                  <div className="glass-panel p-6 rounded-2xl space-y-5">
                    <div>
                      <h4 className="font-bold text-lg k-text">Top Clientes por Puntos</h4>
                      <p className="text-xs k-muted">Los más activos del programa de lealtad</p>
                    </div>
                    <div className="space-y-4">
                      {[...clientes].sort((a,b) => b.saldoPuntos - a.saldoPuntos).slice(0,5).map((c, i) => (
                        <div key={c.id} className="flex items-center gap-4">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                            style={i === 0
                              ? { background: `color-mix(in srgb, var(--k-gold) 20%, transparent)`, color: 'var(--k-gold)' }
                              : i === 1
                              ? { background: `color-mix(in srgb, var(--k-green) 15%, transparent)`, color: 'var(--k-green)' }
                              : { background: 'var(--k-nav-hover)', color: 'var(--k-muted)' }}>
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold k-text truncate">{c.nombre}</p>
                            <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--k-nav-hover)' }}>
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${clientes[0].saldoPuntos > 0 ? (c.saldoPuntos / Math.max(...clientes.map(x => x.saldoPuntos))) * 100 : 0}%`, background: `linear-gradient(90deg, var(--k-gold), var(--k-green))` }} />
                            </div>
                          </div>
                          <span className="font-extrabold text-sm shrink-0 k-gold">{c.saldoPuntos} pts</span>
                        </div>
                      ))}
                      {clientes.length === 0 && <p className="k-muted text-sm text-center py-4">Sin clientes aún.</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock alerts */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" style={{ color: '#f87171' }} />
                  <div>
                    <h4 className="font-bold text-lg k-text">Alertas de Stock</h4>
                    <p className="text-xs k-muted">Productos que requieren reabasto</p>
                  </div>
                </div>
                {productosBajoStock.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--k-green)' }}>
                    <CheckCircle2 className="w-5 h-5" />¡Todo el inventario tiene stock suficiente!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productosBajoStock.map(p => (
                      <div key={p.id} className="rounded-xl p-4 flex items-center justify-between"
                        style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        <div>
                          <p className="font-bold k-text text-sm">{p.nombre}</p>
                          <CategoriaBadge cat={p.categoria} />
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-extrabold" style={{ color: p.stock === 0 ? '#f87171' : '#fb923c' }}>{p.stock}</p>
                          <p className="text-[10px] k-muted">mín: {p.stockMinimo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ CONFIGURACIÓN ═══ */}
          {activeTab === 'configuracion' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="glass-panel p-6 rounded-2xl">
                <div>
                  <h4 className="font-bold text-lg k-text">Configuración General del Negocio</h4>
                  <p className="text-xs k-muted">Personaliza la información de tu comercio, módulos activos y el programa de puntos.</p>
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Datos del Negocio */}
                <div className="glass-panel p-6 rounded-2xl space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--k-border)' }}>
                    <Plus className="w-5 h-5 k-gold" />
                    <h5 className="font-bold text-sm k-text uppercase tracking-wider">Datos de la Tienda</h5>
                  </div>

                  <Field label="Nombre del Negocio">
                    <input
                      type="text"
                      required
                      value={configForm.nombreNegocio}
                      onChange={e => setConfigForm({ ...configForm, nombreNegocio: e.target.value })}
                      className="k-input"
                    />
                  </Field>

                  <Field label="WhatsApp de Pedidos">
                    <input
                      type="text"
                      required
                      value={configForm.whatsapp}
                      onChange={e => setConfigForm({ ...configForm, whatsapp: e.target.value })}
                      className="k-input"
                      placeholder="Ej. 525512345678"
                    />
                  </Field>

                  <Field label="Horarios de Atención">
                    <input
                      type="text"
                      required
                      value={configForm.horario}
                      onChange={e => setConfigForm({ ...configForm, horario: e.target.value })}
                      className="k-input"
                      placeholder="Ej. Lunes a Viernes 9am - 6pm"
                    />
                  </Field>
                </div>

                {/* 2. Módulos y Categorías */}
                <div className="glass-panel p-6 rounded-2xl space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--k-border)' }}>
                    <LayoutDashboard className="w-5 h-5 k-green" />
                    <h5 className="font-bold text-sm k-text uppercase tracking-wider">Módulos Activos</h5>
                  </div>
                  <p className="text-xs k-muted">Habilita o deshabilita los tipos de inventario. Las pestañas y selectores se adaptarán en tiempo real.</p>

                  <div className="space-y-4 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--k-nav-hover)] transition-all border" style={{ borderColor: 'var(--k-border)' }}>
                      <input
                        type="checkbox"
                        checked={configForm.habilitarRopa}
                        onChange={e => setConfigForm({ ...configForm, habilitarRopa: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                      />
                      <div>
                        <p className="text-sm font-semibold k-text">Módulo de Ropa / Paca</p>
                        <p className="text-[10px] k-muted">Inventario de prendas con talla, color y estado.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--k-nav-hover)] transition-all border" style={{ borderColor: 'var(--k-border)' }}>
                      <input
                        type="checkbox"
                        checked={configForm.habilitarPapeleria}
                        onChange={e => setConfigForm({ ...configForm, habilitarPapeleria: e.target.checked })}
                        className="w-4 h-4 rounded text-green-500 accent-green-500"
                      />
                      <div>
                        <p className="text-sm font-semibold k-text">Módulo de Papelería</p>
                        <p className="text-[10px] k-muted">Artículos escolares y de oficina.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--k-nav-hover)] transition-all border" style={{ borderColor: 'var(--k-border)' }}>
                      <input
                        type="checkbox"
                        checked={configForm.habilitarAbarrotes}
                        onChange={e => setConfigForm({ ...configForm, habilitarAbarrotes: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-500 accent-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-semibold k-text">Módulo de Abarrotes</p>
                        <p className="text-[10px] k-muted">Productos alimenticios, refrescos y más.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--k-nav-hover)] transition-all border" style={{ borderColor: 'var(--k-border)' }}>
                      <input
                        type="checkbox"
                        checked={configForm.habilitarServicios}
                        onChange={e => setConfigForm({ ...configForm, habilitarServicios: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-500 accent-teal-500"
                      />
                      <div>
                        <p className="text-sm font-semibold k-text">Módulo de Servicios / Copias</p>
                        <p className="text-[10px] k-muted">Servicio de impresión, copiado y cobros directos sin stock.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--k-nav-hover)] transition-all border" style={{ borderColor: 'var(--k-border)' }}>
                      <input
                        type="checkbox"
                        checked={configForm.habilitarPuntos}
                        onChange={e => setConfigForm({ ...configForm, habilitarPuntos: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                      />
                      <div>
                        <p className="text-sm font-semibold k-text">Sistema de Puntos de Lealtad</p>
                        <p className="text-[10px] k-muted">Permite a los clientes acumular y canjear puntos de fidelidad en sus compras.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Configuración de Puntos / Lealtad */}
                {configForm.habilitarPuntos && (
                  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-5">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--k-border)' }}>
                      <Sparkles className="w-5 h-5 k-teal" />
                      <h5 className="font-bold text-sm k-text uppercase tracking-wider">Programa de Lealtad</h5>
                    </div>
                    <p className="text-xs k-muted">Configura el porcentaje de acumulación de puntos por cada peso de compra.</p>

                    <div className="space-y-4">
                      <Field label={`Porcentaje Ropa (${((parseFloat(configForm.factorPuntosRopa as any) || 0) * 100).toFixed(0)}%)`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="0.30"
                            step="0.01"
                            value={configForm.factorPuntosRopa === '' ? 0 : configForm.factorPuntosRopa}
                            onChange={e => setConfigForm({ ...configForm, factorPuntosRopa: e.target.value })}
                            className="flex-1 accent-amber-500"
                          />
                          <input
                            type="number"
                            min="0"
                            max="0.30"
                            step="0.01"
                            value={configForm.factorPuntosRopa === '' ? '' : configForm.factorPuntosRopa}
                            onChange={e => setConfigForm({ ...configForm, factorPuntosRopa: e.target.value })}
                            className="k-input w-24 text-center font-bold"
                          />
                        </div>
                      </Field>

                      <Field label={`Porcentaje Papelería (${((parseFloat(configForm.factorPuntosPapeleria as any) || 0) * 100).toFixed(0)}%)`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="0.30"
                            step="0.01"
                            value={configForm.factorPuntosPapeleria === '' ? 0 : configForm.factorPuntosPapeleria}
                            onChange={e => setConfigForm({ ...configForm, factorPuntosPapeleria: e.target.value })}
                            className="flex-1 accent-green-500"
                          />
                          <input
                            type="number"
                            min="0"
                            max="0.30"
                            step="0.01"
                            value={configForm.factorPuntosPapeleria === '' ? '' : configForm.factorPuntosPapeleria}
                            onChange={e => setConfigForm({ ...configForm, factorPuntosPapeleria: e.target.value })}
                            className="k-input w-24 text-center font-bold"
                          />
                        </div>
                      </Field>

                      <Field label={`Porcentaje Abarrotes (${((parseFloat(configForm.factorPuntosAbarrotes as any) || 0) * 100).toFixed(0)}%)`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="0.30"
                            step="0.01"
                            value={configForm.factorPuntosAbarrotes === '' ? 0 : configForm.factorPuntosAbarrotes}
                            onChange={e => setConfigForm({ ...configForm, factorPuntosAbarrotes: e.target.value })}
                            className="flex-1 accent-indigo-500"
                          />
                          <input
                            type="number"
                            min="0"
                            max="0.30"
                            step="0.01"
                            value={configForm.factorPuntosAbarrotes === '' ? '' : configForm.factorPuntosAbarrotes}
                            onChange={e => setConfigForm({ ...configForm, factorPuntosAbarrotes: e.target.value })}
                            className="k-input w-24 text-center font-bold"
                          />
                        </div>
                      </Field>

                      <Field label="Valor en pesos de cada punto al canjearse ($)">
                        <input
                          type="number"
                          min="0.01"
                          max="100.00"
                          step="0.01"
                          value={configForm.valorPuntoDescuento === '' ? '' : (configForm.valorPuntoDescuento ?? 0.50)}
                          onChange={e => setConfigForm({ ...configForm, valorPuntoDescuento: e.target.value })}
                          className="k-input font-bold"
                          placeholder="0.50"
                        />
                      </Field>
                    </div>
                  </div>
                  </div>
                )}

                <div className="pt-5 border-t lg:col-span-3" style={{ borderColor: 'var(--k-border)' }}>
                    <button type="submit" className="k-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Guardar Configuración
                    </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </main>

      {/* ══════════ MODALES ══════════════════════════════════════════════════════ */}

      {showAddClientModal && (
        <Modal title="Registrar Cliente Nuevo" onClose={() => setShowAddClientModal(false)}>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <Field label="Nombre Completo"><input type="text" required placeholder="Ej. Juan Pérez" value={newClient.nombre} onChange={e => setNewClient({...newClient, nombre: e.target.value})} className="k-input" /></Field>
            <Field label="Número de Teléfono"><input type="tel" required placeholder="10 dígitos" value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} className="k-input" /></Field>
            <SubmitBtn>Guardar Cliente</SubmitBtn>
          </form>
        </Modal>
      )}

      {showEditClientModal && (
        <Modal title={`Editar: ${showEditClientModal.nombre}`} onClose={() => setShowEditClientModal(null)}>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <Field label="Nombre Completo"><input type="text" required value={editClient.nombre} onChange={e => setEditClient({...editClient, nombre: e.target.value})} className="k-input" /></Field>
            <Field label="Teléfono"><input type="tel" required value={editClient.telefono} onChange={e => setEditClient({...editClient, telefono: e.target.value})} className="k-input" /></Field>
            <SubmitBtn>Guardar Cambios</SubmitBtn>
          </form>
        </Modal>
      )}

      {showAddProductModal && (
        <ProductModal title="Añadir Nuevo Producto" form={newProduct} setForm={setNewProduct} onSubmit={handleCreateProduct} onClose={() => { setShowAddProductModal(false); setNewProduct(emptyProduct); }} config={config} />
      )}

      {showEditProductModal && (
        <ProductModal title={`Editar: ${showEditProductModal.nombre}`} form={editProduct} setForm={setEditProduct} onSubmit={handleUpdateProduct} onClose={() => setShowEditProductModal(null)} config={config} submitLabel="Guardar Cambios" />
      )}

      {showManualChargeModal && (
        <Modal title="Cobro Manual / Concepto Personalizado" onClose={() => setShowManualChargeModal(false)}>
          <form onSubmit={handleSaveManualCharge} className="space-y-4">
            <Field label="Nombre / Concepto">
              <input
                type="text"
                required
                placeholder="Ej. Cobro Directo, Envoltura de regalo..."
                value={manualChargeForm.nombre}
                onChange={e => setManualChargeForm({ ...manualChargeForm, nombre: e.target.value })}
                className="k-input"
                autoFocus={manualChargeForm.nombre === 'Cobro Directo' || !manualChargeForm.nombre}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio ($)">
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={manualChargeForm.precio}
                  onChange={e => setManualChargeForm({ ...manualChargeForm, precio: e.target.value })}
                  className="k-input"
                  autoFocus={manualChargeForm.nombre !== 'Cobro Directo' && manualChargeForm.nombre !== ''}
                />
              </Field>

              <Field label="Categoría">
                <select
                  value={manualChargeForm.categoria}
                  onChange={e => setManualChargeForm({ ...manualChargeForm, categoria: e.target.value as any })}
                  className="k-select py-3 text-xs cursor-pointer"
                  style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)', borderColor: 'var(--k-border)' }}
                >
                  {config.habilitarRopa && <option value="ROPA" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>🛍️ Ropa</option>}
                  {config.habilitarPapeleria && <option value="PAPELERIA" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>📝 Papelería</option>}
                  {config.habilitarAbarrotes && <option value="ABARROTES" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>🛒 Abarrotes</option>}
                  {config.habilitarServicios && <option value="SERVICIO" style={{ background: 'var(--k-input-bg)', color: 'var(--k-text)' }}>⚙️ Servicios / Otros</option>}
                </select>
              </Field>
            </div>

            <Field label="Comentarios / Notas (Opcional)">
              <input
                type="text"
                placeholder="Ej. Prenda con detalle, color específico, etc."
                value={manualChargeForm.nota}
                onChange={e => setManualChargeForm({ ...manualChargeForm, nota: e.target.value })}
                className="k-input"
              />
            </Field>

            <SubmitBtn>Agregar al Carrito</SubmitBtn>
          </form>
        </Modal>
      )}

      {txToCancel && (
        <Modal title="Confirmar Cancelación de Venta" onClose={() => setTxToCancel(null)}>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-400 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-sm">¿Estás seguro de cancelar esta venta?</p>
                <p className="mt-1">Esta acción no se puede deshacer. Se realizarán los siguientes movimientos:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Se devolverá la cantidad correspondiente al inventario.</li>
                  {config.habilitarPuntos && txToCancel.puntosGanados !== 0 && (
                    <li>Se revertirán los puntos acumulados/canjeados por el cliente.</li>
                  )}
                  <li>Las estadísticas de ingresos de la caja y reportes financieros se recalcularán de inmediato.</li>
                </ul>
              </div>
            </div>
            <div className="rounded-xl border p-4 space-y-2 text-xs" style={{ background: 'var(--k-panel-bg)', borderColor: 'var(--k-border)' }}>
              <p className="k-muted"><strong>Folio de Venta:</strong> #{txToCancel.id}</p>
              <p className="k-muted"><strong>Cliente:</strong> {txToCancel.cliente?.nombre || 'Público General'}</p>
              <p className="k-muted"><strong>Monto de la Venta:</strong> ${txToCancel.monto.toFixed(2)}</p>
              {config.habilitarPuntos && txToCancel.puntosGanados !== 0 && (
                <p className="k-muted">
                  <strong>Puntos a revertir:</strong>{' '}
                  <span className="font-bold" style={{ color: txToCancel.puntosGanados > 0 ? 'var(--k-gold)' : '#f87171' }}>
                    {txToCancel.puntosGanados > 0 ? `-${txToCancel.puntosGanados} pts (Descontar)` : `+${Math.abs(txToCancel.puntosGanados)} pts (Reembolsar)`}
                  </span>
                </p>
              )}
              <p className="k-muted"><strong>Detalle de artículos:</strong> {txToCancel.comentarios || 'Sin notas'}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTxToCancel(null)}
                className="flex-1 py-2.5 text-xs rounded-xl font-bold border transition-all"
                style={{ background: 'var(--k-nav-hover)', color: 'var(--k-muted)', borderColor: 'var(--k-border)' }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => handleCancelTransaction(txToCancel)}
                className="flex-1 py-2.5 text-xs rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-md"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </Modal>
      )}


      {/* Toast (fuera del contexto de main para evitar superposición de z-index) */}
      {alertMsg && (
        <div className="fixed top-24 right-8 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300"
          style={{
            background: alertMsg.type === 'success' ? 'color-mix(in srgb, var(--k-green) 15%, var(--k-sidebar))' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${alertMsg.type === 'success' ? 'color-mix(in srgb, var(--k-green) 35%, transparent)' : 'rgba(239,68,68,0.3)'}`,
            color: alertMsg.type === 'success' ? 'var(--k-green)' : '#f87171',
            zIndex: 9999,
          }}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{alertMsg.text}</span>
        </div>
      )}
    </div>
  );
}