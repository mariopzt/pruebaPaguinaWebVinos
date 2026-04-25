import './App.css';
import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCoffee,
  FiChevronDown,
  FiEdit3,
  FiHeart,
  FiHome,
  FiLock,
  FiLogOut,
  FiPlus,
  FiSave,
  FiSearch,
  FiSettings,
  FiSliders,
  FiStar,
  FiTrash2,
  FiUser,
  FiWifi,
  FiWifiOff,
  FiX,
} from 'react-icons/fi';
import { FaWineGlassAlt } from 'react-icons/fa';
import authService from './api/authService';
import cataService from './api/cataService';

const LOCAL_CATAS_KEY = 'catas_app_items';
const SETTINGS_KEY = 'catas_app_settings';
const SESSION_KEY = 'catas_app_session_v2';

const categories = ['Todas', 'Vino', 'Cafe', 'Comida', 'Cerveza', 'Queso', 'Chocolate', 'Otro'];

const scoreFields = [
  { key: 'visual', label: 'Visual' },
  { key: 'aroma', label: 'Aroma' },
  { key: 'taste', label: 'Sabor' },
  { key: 'texture', label: 'Textura' },
  { key: 'finish', label: 'Final' },
];

const today = () => new Date().toISOString().slice(0, 10);

const emptyCata = {
  name: '',
  category: 'Vino',
  producer: '',
  origin: '',
  vintage: '',
  date: today(),
  place: '',
  taster: '',
  appearance: '',
  aromas: [],
  flavors: [],
  pairing: '',
  notes: '',
  photo: '',
  score: {
    visual: 7,
    aroma: 7,
    taste: 7,
    texture: 7,
    finish: 7,
  },
  favorite: false,
  status: 'catada',
};

const defaultSettings = {
  tasterName: 'Catador',
  defaultPlace: 'Mesa de cata',
  compactCards: false,
  guidedNotes: true,
  autosaveLocal: true,
};

const templates = [
  {
    title: 'Vino tinto',
    icon: <FaWineGlassAlt />,
    data: {
      name: 'Cata de vino tinto',
      category: 'Vino',
      appearance: 'Capa media, brillo limpio, lagrima fina',
      aromas: ['fruta roja', 'madera', 'especias'],
      flavors: ['tanino', 'fruta madura', 'vainilla'],
      pairing: 'Carnes, quesos curados o setas',
    },
  },
  {
    title: 'Cafe',
    icon: <FiCoffee />,
    data: {
      name: 'Cata de cafe',
      category: 'Cafe',
      appearance: 'Crema uniforme y color avellana',
      aromas: ['cacao', 'frutos secos', 'caramelo'],
      flavors: ['acidez media', 'dulzor', 'cuerpo'],
      pairing: 'Chocolate negro o bolleria sencilla',
    },
  },
  {
    title: 'Comida',
    icon: <FiActivity />,
    data: {
      name: 'Cata de comida',
      category: 'Comida',
      appearance: 'Presentacion limpia, color apetecible y buena temperatura',
      aromas: ['tostado', 'especias', 'fresco'],
      flavors: ['salado', 'dulzor', 'umami'],
      pairing: 'Bebida suave, vino o pan',
    },
  },
  {
    title: 'Cerveza',
    icon: <FiArchive />,
    data: {
      name: 'Cata de cerveza',
      category: 'Cerveza',
      appearance: 'Espuma persistente y burbuja fina',
      aromas: ['malta', 'cereal', 'citricos'],
      flavors: ['amargor', 'lupulo', 'pan tostado'],
      pairing: 'Tapas, hamburguesa o fritos',
    },
  },
  {
    title: 'Queso',
    icon: <FiStar />,
    data: {
      name: 'Cata de queso',
      category: 'Queso',
      appearance: 'Corte limpio y pasta uniforme',
      aromas: ['lactico', 'mantequilla', 'frutos secos'],
      flavors: ['salino', 'cremoso', 'persistente'],
      pairing: 'Pan, membrillo o vino blanco',
    },
  },
  {
    title: 'Chocolate',
    icon: <FiHeart />,
    data: {
      name: 'Cata de chocolate',
      category: 'Chocolate',
      appearance: 'Brillo alto y rotura limpia',
      aromas: ['cacao', 'vainilla', 'fruta seca'],
      flavors: ['amargo', 'dulzor', 'tostado'],
      pairing: 'Cafe, frutos rojos o licor suave',
    },
  },
];

const seedCatas = templates.map((template, index) => ({
  ...emptyCata,
  ...template.data,
  id: `seed-${index + 1}`,
  date: today(),
  taster: defaultSettings.tasterName,
  place: defaultSettings.defaultPlace,
  notes: 'Ficha de ejemplo lista para editar y guardar con tus datos reales.',
  score: {
    visual: 7 + (index % 2),
    aroma: 8,
    taste: 7 + (index % 3),
    texture: 7,
    finish: 8,
  },
  favorite: index === 0,
  status: 'catada',
}));

const categoryMetaMap = {
  Vino: { icon: FaWineGlassAlt, tone: 'wine' },
  Cafe: { icon: FiCoffee, tone: 'coffee' },
  Comida: { icon: FiActivity, tone: 'food' },
  Cerveza: { icon: FiArchive, tone: 'beer' },
  Queso: { icon: FiStar, tone: 'cheese' },
  Chocolate: { icon: FiHeart, tone: 'chocolate' },
  Otro: { icon: FiArchive, tone: 'other' },
};

const calculateTotalScore = (score = {}) => {
  const total = scoreFields.reduce((sum, field) => sum + (Number(score[field.key]) || 0), 0);
  return Math.round((total / 50) * 100);
};

const normalizeCata = (cata) => ({
  ...emptyCata,
  ...cata,
  id: cata.id || cata._id,
  date: cata.date ? new Date(cata.date).toISOString().slice(0, 10) : today(),
  aromas: Array.isArray(cata.aromas) ? cata.aromas : [],
  flavors: Array.isArray(cata.flavors) ? cata.flavors : [],
  photo: cata.photo || '',
  score: { ...emptyCata.score, ...(cata.score || {}) },
  totalScore: cata.totalScore ?? calculateTotalScore(cata.score),
});

const readLocalCatas = () => {
  try {
    const stored = localStorage.getItem(LOCAL_CATAS_KEY);
    return stored ? JSON.parse(stored).map(normalizeCata) : seedCatas.map(normalizeCata);
  } catch (error) {
    return seedCatas.map(normalizeCata);
  }
};

const writeLocalCatas = (items) => {
  localStorage.setItem(LOCAL_CATAS_KEY, JSON.stringify(items));
};

const formatTags = (tags) => (Array.isArray(tags) ? tags.join(', ') : '');
const parseTags = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const getCategoryMeta = (category) => categoryMetaMap[category] || categoryMetaMap.Otro;
const formatDateLabel = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
};
const formatDayLabel = () => new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date());
const getScoreMood = (score) => {
  if (score >= 92) return 'Memorable';
  if (score >= 84) return 'Muy fina';
  if (score >= 75) return 'Equilibrada';
  if (score >= 65) return 'Prometedora';
  return 'Por pulir';
};

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (error) {
      return null;
    }
  });
  const [loginData, setLoginData] = useState({ user: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [view, setView] = useState('inicio');
  const [catas, setCatas] = useState(() => readLocalCatas());
  const [settings, setSettings] = useState(() => {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch (error) {
      return defaultSettings;
    }
  });
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCata, setEditingCata] = useState(null);
  const [form, setForm] = useState(emptyCata);
  const currentDayLabel = useMemo(() => formatDayLabel(), []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const loadCatas = async () => {
      setLoading(true);
      try {
        const response = await cataService.getCatas();
        const remoteCatas = (response.data || []).map(normalizeCata);
        if (remoteCatas.length > 0) {
          setCatas(remoteCatas);
          writeLocalCatas(remoteCatas);
        }
        setApiOnline(true);
        setNotice(remoteCatas.length > 0 ? 'Sincronizado con MongoDB catas' : 'MongoDB catas esta listo; usando ejemplos locales hasta guardar');
      } catch (error) {
        setApiOnline(false);
        setNotice('Modo local: abre el backend para sincronizar con MongoDB catas');
      } finally {
        setLoading(false);
      }
    };

    loadCatas();
  }, []);

  const stats = useMemo(() => {
    const realCatas = catas.filter((cata) => !String(cata.id).startsWith('seed-'));
    const scored = catas.map((cata) => calculateTotalScore(cata.score));
    const average = scored.length ? Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length) : 0;
    const favoriteCount = catas.filter((cata) => cata.favorite).length;
    const best = catas.reduce((winner, cata) => (
      calculateTotalScore(cata.score) > calculateTotalScore(winner?.score) ? cata : winner
    ), catas[0]);

    return {
      total: catas.length,
      real: realCatas.length,
      average,
      favoriteCount,
      best,
    };
  }, [catas]);

  const filteredCatas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catas.filter((cata) => {
      const matchesCategory = category === 'Todas' || cata.category === category;
      const matchesSearch = !term || [
        cata.name,
        cata.category,
        cata.producer,
        cata.origin,
        cata.notes,
        ...cata.aromas,
        ...cata.flavors,
      ].join(' ').toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [catas, category, search]);

  const openNewCata = (templateData = {}) => {
    setEditingCata(null);
    setForm({
      ...emptyCata,
      ...templateData,
      place: settings.defaultPlace,
      taster: settings.tasterName,
      date: today(),
      score: { ...emptyCata.score, ...(templateData.score || {}) },
    });
    setFormOpen(true);
  };

  const openEditCata = (cata) => {
    setEditingCata(cata);
    setForm(normalizeCata(cata));
    setFormOpen(true);
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateScore = (key, value) => {
    setForm((current) => ({
      ...current,
      score: {
        ...current.score,
        [key]: Number(value),
      },
    }));
  };

  const saveCata = async (event) => {
    event.preventDefault();

    const payload = normalizeCata({
      ...form,
      aromas: Array.isArray(form.aromas) ? form.aromas : parseTags(form.aromas || ''),
      flavors: Array.isArray(form.flavors) ? form.flavors : parseTags(form.flavors || ''),
      totalScore: calculateTotalScore(form.score),
    });

    if (!payload.name.trim()) {
      setNotice('Pon un nombre a la cata antes de guardar');
      return;
    }

    const localId = editingCata?.id || `local-${Date.now()}`;
    let nextItem = { ...payload, id: localId };

    if (apiOnline && !String(localId).startsWith('seed-') && !String(localId).startsWith('local-')) {
      try {
        const response = await cataService.updateCata(localId, payload);
        nextItem = normalizeCata(response.data);
        setNotice('Cata actualizada en MongoDB catas');
      } catch (error) {
        setApiOnline(false);
        setNotice('No se pudo sincronizar; guardado local');
      }
    } else if (apiOnline) {
      try {
        const response = await cataService.createCata(payload);
        nextItem = normalizeCata(response.data);
        setNotice('Cata guardada en MongoDB catas');
      } catch (error) {
        setApiOnline(false);
        setNotice('No se pudo sincronizar; guardado local');
      }
    } else {
      setNotice('Cata guardada localmente');
    }

    const nextCatas = editingCata
      ? catas.map((cata) => (cata.id === editingCata.id ? nextItem : cata))
      : [nextItem, ...catas];

    setCatas(nextCatas);
    writeLocalCatas(nextCatas);
    setFormOpen(false);
  };

  const deleteCata = async (cata) => {
    if (!confirm(`Eliminar "${cata.name}"?`)) return;

    const nextCatas = catas.filter((item) => item.id !== cata.id);
    setCatas(nextCatas);
    writeLocalCatas(nextCatas);

    if (apiOnline && !String(cata.id).startsWith('local-') && !String(cata.id).startsWith('seed-')) {
      try {
        await cataService.deleteCata(cata.id);
        setNotice('Cata eliminada de MongoDB catas');
      } catch (error) {
        setApiOnline(false);
        setNotice('Eliminada localmente; no se pudo sincronizar');
      }
    } else {
      setNotice('Cata eliminada localmente');
    }
  };

  const toggleFavorite = async (cata) => {
    const updated = { ...cata, favorite: !cata.favorite };
    const nextCatas = catas.map((item) => (item.id === cata.id ? updated : item));
    setCatas(nextCatas);
    writeLocalCatas(nextCatas);

    if (apiOnline && !String(cata.id).startsWith('local-') && !String(cata.id).startsWith('seed-')) {
      try {
        await cataService.updateCata(cata.id, updated);
      } catch (error) {
        setApiOnline(false);
        setNotice('Favorito guardado localmente');
      }
    }
  };

  const resetExamples = () => {
    const nextCatas = seedCatas.map(normalizeCata);
    setCatas(nextCatas);
    writeLocalCatas(nextCatas);
    setNotice('Ejemplos de cata restaurados en local');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const user = loginData.user.trim();
    setLoginError('');

    if (!user || loginData.password.length < 3) {
      setLoginError('Pon usuario y una contrasena de al menos 3 caracteres');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await authService.login({ user, password: loginData.password });
      const nextSession = {
        id: response.data.id,
        user: response.data.user,
        displayName: response.data.displayName,
        loggedAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setSettings((current) => ({
        ...current,
        tasterName: current.tasterName === defaultSettings.tasterName ? nextSession.displayName : current.tasterName,
      }));
    } catch (error) {
      setLoginError(error.message || 'Usuario o contrasena incorrectos');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setLoginData({ user: '', password: '' });
    setLoginError('');
  };

  if (!session) {
    return (
      <main className="app-shell login-shell">
        <section className="login-stage">
          <article className="login-card">
            <div className="login-intro">
              <span className="eyebrow">Acceso privado</span>
              <div className="login-header">
                <div className="login-mark">
                  <FaWineGlassAlt />
                </div>
                <div className="login-brand-copy">
                  <small>Cuaderno de cata</small>
                  <h1>Catas</h1>
                </div>
              </div>
              <p>Una entrada simple para seguir tus notas, puntuaciones y favoritos sin distracciones.</p>
            </div>

            <div className="login-visual">
              <div className="login-visual-card">
                <div className="login-visual-top">
                  <span className="category-badge">
                    <FaWineGlassAlt />
                    Vino
                  </span>
                  <span className="score-pill">91/100</span>
                </div>
                <strong>Ribera reserva</strong>
                <p>Fruta negra, cacao y final largo. Lo importante se entiende de un vistazo.</p>
              </div>
              <div className="login-visual-metrics">
                <span>Archivo claro</span>
                <span>Sincronizacion opcional</span>
              </div>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Usuario
                <div className="login-input">
                  <FiUser />
                  <input value={loginData.user} onChange={(event) => setLoginData({ ...loginData, user: event.target.value })} placeholder="Tu nombre" autoFocus />
                </div>
              </label>
              <label>
                Contrasena
                <div className="login-input">
                  <FiLock />
                  <input type="password" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} placeholder="Minimo 3 caracteres" />
                </div>
              </label>
              {loginError && <p className="login-error">{loginError}</p>}
              <button className="primary-button" type="submit" disabled={loginLoading}>
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="login-footnote">
              <span>Acceso privado para tu archivo de catas.</span>
              <span>La sesion conserva ajustes y notas locales.</span>
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="eyebrow">Cuaderno de cata</span>
            <h1>Catas</h1>
            <p>{session.displayName} / {currentDayLabel}</p>
          </div>
          <div className="topbar-actions">
            <div className="profile-pill">
              <FiUser />
              <span>{session.displayName}</span>
            </div>
            <button className={`sync-pill ${apiOnline ? 'online' : 'offline'}`} type="button">
              {apiOnline ? <FiWifi /> : <FiWifiOff />}
              {apiOnline ? 'Conectado' : 'Local'}
            </button>
          </div>
        </header>

        {view === 'inicio' && (
          <HomeView
            loading={loading}
            stats={stats}
            templates={templates}
            onStart={openNewCata}
            onGoList={() => setView('catas')}
          />
        )}

        {view === 'catas' && (
          <CatasView
            catas={filteredCatas}
            category={category}
            search={search}
            settings={settings}
            onSearch={setSearch}
            onCategory={setCategory}
            onCreate={() => openNewCata()}
            onEdit={openEditCata}
            onDelete={deleteCata}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {view === 'ajustes' && (
          <SettingsView
            settings={settings}
            stats={stats}
            session={session}
            onChange={setSettings}
            onResetExamples={resetExamples}
            onLogout={handleLogout}
          />
        )}

        <nav className="bottom-nav">
          <button className={view === 'inicio' ? 'active' : ''} onClick={() => setView('inicio')} type="button">
            <FiHome />
            Inicio
          </button>
          <button className={view === 'catas' ? 'active' : ''} onClick={() => setView('catas')} type="button">
            <FiBarChart2 />
            Catas
          </button>
          <button className="nav-add" onClick={() => openNewCata()} type="button" aria-label="Nueva cata">
            <FiPlus />
          </button>
          <button className={view === 'ajustes' ? 'active' : ''} onClick={() => setView('ajustes')} type="button">
            <FiSettings />
            Ajustes
          </button>
        </nav>
      </section>

      {formOpen && (
        <CataForm
          form={form}
          editing={Boolean(editingCata)}
          onClose={() => setFormOpen(false)}
          onSubmit={saveCata}
          onChange={updateForm}
          onScore={updateScore}
        />
      )}
    </main>
  );
}

function HomeView({ loading, stats, templates: templateList, onStart, onGoList }) {
  return (
    <div className="screen-content">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Panel rapido</p>
          <h2>Registra lo que pruebas con mas criterio visual.</h2>
          <p>Una portada clara, archivo filtrable y una ficha que deja la puntuacion en primer plano.</p>
          <button className="primary-button" onClick={() => onStart()} type="button">
            <FiPlus />
            Nueva cata
          </button>
        </div>

        <div className="hero-side">
          <div className="hero-score-card">
            <span className="eyebrow">Media actual</span>
            <div className="hero-score-value">
              <strong>{loading ? '...' : stats.average}</strong>
              <span>/100</span>
            </div>
            <p>{stats.best ? `${stats.best.name} marca el ritmo del archivo.` : 'Empieza con una plantilla y crea la primera referencia.'}</p>
          </div>
          <div className="hero-mini-grid">
            <div className="mini-stat">
              <span>Guardadas</span>
              <strong>{loading ? '...' : stats.real}</strong>
            </div>
            <div className="mini-stat">
              <span>Favoritas</span>
              <strong>{stats.favoriteCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Catas" value={loading ? '...' : stats.total} helper="Total cargadas en pantalla" />
        <StatCard label="Media" value={`${stats.average}/100`} helper={getScoreMood(stats.average)} />
        <StatCard label="Favoritas" value={stats.favoriteCount} helper="Referencias para repetir" />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Plantillas</span>
            <h3>Elige una plantilla</h3>
          </div>
          <button className="ghost-button" onClick={onGoList} type="button">Ver lista</button>
        </div>
        <div className="template-grid">
          {templateList.map((template) => (
            <button key={template.title} className="template-card" onClick={() => onStart(template.data)} type="button">
              <span>{template.icon}</span>
              <strong>{template.title}</strong>
            </button>
          ))}
        </div>
      </section>

      {stats.best && (
        <section className="best-card">
          <div className="best-card-head">
            <div>
              <span className="eyebrow">Mejor puntuacion</span>
              <h3>{stats.best.name}</h3>
            </div>
            <div className="best-card-score">{calculateTotalScore(stats.best.score)}/100</div>
          </div>
          <p>{[stats.best.category, stats.best.origin || stats.best.place || 'Sin origen'].join(' / ')}</p>
          <div className="tag-row">
            {[...stats.best.aromas, ...stats.best.flavors].slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </section>
      )}
    </div>
  );
}

function CatasView({
  catas,
  category,
  search,
  settings,
  onSearch,
  onCategory,
  onCreate,
  onEdit,
  onDelete,
  onToggleFavorite,
}) {
  const [detailCata, setDetailCata] = useState(null);

  return (
    <div className="screen-content">
      <section className="toolbar-card">
        <div className="search-box">
          <FiSearch />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nombre, aroma, origen..." />
        </div>
        <div className="chip-row">
          {categories.map((item) => (
            <button key={item} className={category === item ? 'chip active' : 'chip'} onClick={() => onCategory(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="archive-overview">
        <div>
          <span className="eyebrow">Archivo</span>
          <h3>{catas.length} catas visibles</h3>
          <p>{category === 'Todas' ? 'Mostrando todas las categorias con el filtro actual.' : `Filtrando por ${category.toLowerCase()}.`}</p>
        </div>
        <button className="primary-button small" onClick={onCreate} type="button"><FiPlus /> Nueva</button>
      </section>

      <section className={settings.compactCards ? 'cata-list compact' : 'cata-list'}>
        {catas.length === 0 && (
          <div className="empty-state">
            <FiSliders />
            <h3>No hay catas con ese filtro</h3>
            <p>Cambia la busqueda o crea una cata nueva.</p>
          </div>
        )}
        {catas.map((cata) => (
          <CataCard
            key={cata.id}
            cata={cata}
            onOpen={setDetailCata}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </section>

      {detailCata && (
        <CataDetailModal
          cata={detailCata}
          onClose={() => setDetailCata(null)}
          onEdit={(item) => {
            setDetailCata(null);
            onEdit(item);
          }}
          onDelete={(item) => {
            setDetailCata(null);
            onDelete(item);
          }}
          onToggleFavorite={(item) => {
            onToggleFavorite(item);
            setDetailCata({ ...item, favorite: !item.favorite });
          }}
        />
      )}
    </div>
  );
}

function SettingsView({ settings, stats, session, onChange, onResetExamples, onLogout }) {
  const update = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="screen-content">
      <section className="settings-card">
        <span className="eyebrow">Ajustes</span>
        <h2>Configuracion de cata</h2>
        <label>
          Nombre del catador
          <input value={settings.tasterName} onChange={(event) => update('tasterName', event.target.value)} />
        </label>
        <label>
          Lugar por defecto
          <input value={settings.defaultPlace} onChange={(event) => update('defaultPlace', event.target.value)} />
        </label>
      </section>

      <section className="settings-card">
        <h3>Preferencias</h3>
        <Toggle label="Tarjetas compactas" checked={settings.compactCards} onChange={(value) => update('compactCards', value)} />
        <Toggle label="Notas guiadas" checked={settings.guidedNotes} onChange={(value) => update('guidedNotes', value)} />
        <Toggle label="Guardar copia local" checked={settings.autosaveLocal} onChange={(value) => update('autosaveLocal', value)} />
      </section>

      <section className="settings-card">
        <h3>Datos</h3>
        <p>{stats.total} catas cargadas, {stats.real} guardadas por ti y media de {stats.average}/100.</p>
        <button className="ghost-button danger" onClick={onResetExamples} type="button">
          Restaurar ejemplos locales
        </button>
      </section>

      <section className="settings-card">
        <h3>Sesion</h3>
        <p>Conectado como {session.user}.</p>
        <button className="ghost-button danger" onClick={onLogout} type="button">
          <FiLogOut />
          Cerrar sesion
        </button>
      </section>
    </div>
  );
}

function CataCard({ cata, onOpen, onEdit, onDelete, onToggleFavorite }) {
  const score = calculateTotalScore(cata.score);
  const categoryMeta = getCategoryMeta(cata.category);
  const CategoryIcon = categoryMeta.icon;
  const tags = [...new Set([...cata.aromas, ...cata.flavors])].slice(0, 5);

  return (
    <article
      className={`cata-card tone-${categoryMeta.tone}`}
      onClick={() => onOpen(cata)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(cata);
      }}
      role="button"
      tabIndex={0}
    >
      <div className="cata-media">
        {cata.photo ? (
          <img src={cata.photo} alt={cata.name} />
        ) : (
          <div className="score-ring">
            <span className="score-ring-icon"><CategoryIcon /></span>
            <strong>{score}</strong>
            <span>/100</span>
          </div>
        )}
      </div>
      <div className="cata-main">
        <div className="cata-kicker-row">
          <span className="category-badge">
            <CategoryIcon />
            {cata.category}
          </span>
          <span className="score-pill">{score}/100</span>
        </div>
        <div className="cata-title-row">
          <div>
            <h3>{cata.name}</h3>
            <p className="cata-meta">{[cata.producer, cata.origin, cata.vintage].filter(Boolean).join(' / ') || cata.place || 'Sin origen'}</p>
          </div>
          <button
            className={cata.favorite ? 'icon-button favorite active' : 'icon-button favorite'}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(cata);
            }}
            type="button"
          >
            <FiHeart />
          </button>
        </div>
        <div className="cata-info-row">
          <span>{formatDateLabel(cata.date)}</span>
          {cata.place && <span>{cata.place}</span>}
          <span>{getScoreMood(score)}</span>
        </div>
        {cata.photo && <p className="cata-photo-score">{score}/100</p>}
        <div className="tag-row">
          {tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        {cata.notes && <p className="cata-notes">{cata.notes}</p>}
        <div className="card-actions">
          <button className="ghost-button" onClick={(event) => { event.stopPropagation(); onEdit(cata); }} type="button"><FiEdit3 /> Editar</button>
          <button className="ghost-button danger" onClick={(event) => { event.stopPropagation(); onDelete(cata); }} type="button"><FiTrash2 /> Borrar</button>
        </div>
      </div>
    </article>
  );
}

function CataDetailModal({ cata, onClose, onEdit, onDelete, onToggleFavorite }) {
  const score = calculateTotalScore(cata.score);
  const meta = [cata.producer, cata.origin, cata.vintage].filter(Boolean).join(' / ');
  const categoryMeta = getCategoryMeta(cata.category);
  const CategoryIcon = categoryMeta.icon;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className="detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Ficha completa</span>
            <h2>{cata.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button"><FiX /></button>
        </div>

        {cata.photo && <img className="detail-photo" src={cata.photo} alt={cata.name} />}

        <div className="detail-score-row">
          <div className="score-ring">
            <span className="score-ring-icon"><CategoryIcon /></span>
            <strong>{score}</strong>
            <span>/100</span>
          </div>
          <div className="detail-score-copy">
            <div className="detail-badge-row">
              <span className="category-badge">
                <CategoryIcon />
                {cata.category}
              </span>
              <span className="detail-mood">{getScoreMood(score)}</span>
            </div>
            <h3>Puntuacion final</h3>
            <p>{meta || cata.place || 'Sin origen indicado'}</p>
          </div>
          <button
            className={cata.favorite ? 'icon-button favorite active' : 'icon-button favorite'}
            onClick={() => onToggleFavorite(cata)}
            type="button"
          >
            <FiHeart />
          </button>
        </div>

        <div className="detail-grid">
          <DetailItem label="Fecha" value={formatDateLabel(cata.date)} />
          <DetailItem label="Lugar" value={cata.place} />
          <DetailItem label="Catador" value={cata.taster} />
          <DetailItem label="Maridaje" value={cata.pairing} />
        </div>

        {cata.appearance && (
          <section className="detail-section">
            <h3>Visual</h3>
            <p>{cata.appearance}</p>
          </section>
        )}

        <section className="detail-section">
          <h3>Aromas</h3>
          <div className="tag-row detail-tags">
            {cata.aromas.length ? cata.aromas.map((tag) => <span key={tag}>{tag}</span>) : <span>Sin aromas</span>}
          </div>
        </section>

        <section className="detail-section">
          <h3>Sabores</h3>
          <div className="tag-row detail-tags">
            {cata.flavors.length ? cata.flavors.map((tag) => <span key={tag}>{tag}</span>) : <span>Sin sabores</span>}
          </div>
        </section>

        <section className="detail-section">
          <h3>Puntuaciones</h3>
          <div className="detail-score-list">
            {scoreFields.map((field) => (
              <div key={field.key}>
                <span>{field.label}</span>
                <strong>{cata.score[field.key]}/10</strong>
              </div>
            ))}
          </div>
        </section>

        {cata.notes && (
          <section className="detail-section">
            <h3>Comentario completo</h3>
            <p>{cata.notes}</p>
          </section>
        )}

        <div className="modal-actions">
          <button className="ghost-button danger" onClick={() => onDelete(cata)} type="button"><FiTrash2 /> Borrar</button>
          <div className="detail-actions-right">
            <button className="ghost-button" onClick={() => onEdit(cata)} type="button"><FiEdit3 /> Editar</button>
            <button className="primary-button small" onClick={onClose} type="button">Cerrar</button>
          </div>
        </div>
      </article>
    </div>
  );
}

function DetailItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CataForm({ form, editing, onClose, onSubmit, onChange, onScore }) {
  const total = calculateTotalScore(form.score);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecciona una imagen valida');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('La foto es demasiado grande. Usa una de menos de 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange('photo', reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-backdrop">
      <form className="cata-modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{editing ? 'Editar' : 'Nueva ficha'}</span>
            <h2>{editing ? 'Editar cata' : 'Nueva cata'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button"><FiX /></button>
        </div>

        <div className="form-grid">
          <label>
            Nombre *
            <input value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Nombre del producto" required />
          </label>
          <label>
            Tipo
            <div className={isCategoryOpen ? 'category-select open' : 'category-select'}>
              <button className="category-select-trigger" onClick={() => setIsCategoryOpen((current) => !current)} type="button">
                <span>{form.category}</span>
                <FiChevronDown />
              </button>
              {isCategoryOpen && (
                <div className="category-picker">
                  {categories.filter((item) => item !== 'Todas').map((item) => (
                    <button
                      key={item}
                      className={form.category === item ? 'category-option active' : 'category-option'}
                      onClick={() => {
                        onChange('category', item);
                        setIsCategoryOpen(false);
                      }}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
          <label>
            Productor / marca
            <input value={form.producer} onChange={(event) => onChange('producer', event.target.value)} placeholder="Marca, productor, tostador..." />
          </label>
          <label>
            Origen
            <input value={form.origin} onChange={(event) => onChange('origin', event.target.value)} placeholder="Zona, pais, finca..." />
          </label>
          <label>
            Anada / lote
            <input value={form.vintage} onChange={(event) => onChange('vintage', event.target.value)} placeholder="2024, lote A12..." />
          </label>
          <label>
            Fecha
            <div className="date-field">
              <span>{form.date ? formatDateLabel(form.date) : 'Seleccionar fecha'}</span>
              <FiCalendar />
              <input type="date" value={form.date} onChange={(event) => onChange('date', event.target.value)} />
            </div>
          </label>
          <label>
            Lugar
            <input value={form.place} onChange={(event) => onChange('place', event.target.value)} />
          </label>
          <label>
            Catador
            <input value={form.taster} onChange={(event) => onChange('taster', event.target.value)} />
          </label>
        </div>

        <label>
          Visual
          <textarea value={form.appearance} onChange={(event) => onChange('appearance', event.target.value)} placeholder="Color, brillo, capa, espuma, textura visual..." />
        </label>
        <label>
          Aromas
          <input value={formatTags(form.aromas)} onChange={(event) => onChange('aromas', parseTags(event.target.value))} placeholder="fruta, cacao, madera..." />
        </label>
        <label>
          Sabores
          <input value={formatTags(form.flavors)} onChange={(event) => onChange('flavors', parseTags(event.target.value))} placeholder="dulzor, acidez, tanino..." />
        </label>
        <label>
          Maridaje
          <input value={form.pairing} onChange={(event) => onChange('pairing', event.target.value)} placeholder="Con que lo servirias" />
        </label>
        <label>
          Notas
          <textarea value={form.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Conclusion, temperatura, si lo repetirias, defectos..." />
        </label>

        <section className="photo-panel">
          <div>
            <span className="eyebrow">Foto</span>
            <h3>Imagen de la cata</h3>
            <p>Haz una foto o sube una imagen. Se guarda con la cata en MongoDB.</p>
          </div>
          {form.photo ? (
            <img className="photo-preview" src={form.photo} alt="Vista previa de la cata" />
          ) : (
            <div className="photo-empty">Sin foto todavia</div>
          )}
          <div className="photo-actions">
            <label className="ghost-button photo-button">
              Tomar / subir foto
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
            </label>
            {form.photo && (
              <button className="ghost-button danger" type="button" onClick={() => onChange('photo', '')}>
                Quitar foto
              </button>
            )}
          </div>
        </section>

        <section className="score-panel">
          <div className="section-heading inline">
            <div>
              <span className="eyebrow">Puntuacion</span>
              <h3>{total}/100</h3>
            </div>
            <label className="favorite-check">
              <input type="checkbox" checked={form.favorite} onChange={(event) => onChange('favorite', event.target.checked)} />
              Favorita
            </label>
          </div>
          {scoreFields.map((field) => (
            <div className="range-row" key={field.key}>
              <span>{field.label}</span>
              <input type="range" min="0" max="10" value={form.score[field.key]} onChange={(event) => onScore(field.key, event.target.value)} />
              <strong>{form.score[field.key]}</strong>
            </div>
          ))}
        </section>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} type="button"><FiX /> Cancelar</button>
          <button className="primary-button" type="submit"><FiSave /> Guardar</button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button className={checked ? 'toggle-row active' : 'toggle-row'} onClick={() => onChange(!checked)} type="button">
      <span>{label}</span>
      <i>{checked ? <FiCheck /> : null}</i>
    </button>
  );
}

export default App;
