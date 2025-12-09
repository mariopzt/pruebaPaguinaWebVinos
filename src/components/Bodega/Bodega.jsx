import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { winesData } from '../../data/winesData';
import WineCard from './WineCard';
import './Bodega.css';

function Bodega({ onNavigateHome, onSelectWine, onOpenAddWine, wineLikes, onToggleWineLike }) {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const itemsPerPage = 18;

  // Referencias para detectar clics fuera
  const searchRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // Filtrar vinos según el tipo seleccionado y término de búsqueda (memorizado)
  const filteredWines = useMemo(() => {
    const baseList =
      activeFilter === 'Todos'
        ? winesData.filter((wine) => wine.stock > 0)
        : winesData.filter((wine) => wine.type === activeFilter && wine.stock > 0);

    if (!searchTerm.trim()) return baseList;

    const lowered = searchTerm.toLowerCase();
    return baseList.filter((wine) => wine.name.toLowerCase().includes(lowered));
  }, [activeFilter, searchTerm]);

  // Calcular la paginación (memorizado)
  const totalPages = useMemo(
    () => Math.ceil(filteredWines.length / itemsPerPage) || 1,
    [filteredWines.length]
  );

  const currentWines = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredWines.slice(startIndex, endIndex);
  }, [filteredWines, currentPage]);

  // Manejar cambio de filtro
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset a la primera página al cambiar filtro
  }, []);

  // Manejar cambio de página
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Scroll al inicio de la sección (sin animación para evitar tirones)
    window.scrollTo(0, 0);
  }, []);

  // Manejar tecla ESC para cerrar búsqueda
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  // Manejar click en el icono de búsqueda
  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Si se va a abrir, limpiar el término
      setTimeout(() => {
        const input = document.querySelector('.search-input');
        if (input) input.focus();
      }, 0);
    }
  };

  // Manejar cierre del buscador
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  // Detectar clics fuera del buscador y del menú de filtros
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar buscador si se hace clic fuera
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchTerm('');
        }
      }

      // Cerrar menú de filtros si se hace clic fuera
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        if (isFilterMenuOpen) {
          setIsFilterMenuOpen(false);
        }
      }
    };

    // Agregar el listener
    document.addEventListener('mousedown', handleClickOutside);

    // Limpiar el listener al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, isFilterMenuOpen]);

  // Generar números de páginas para mostrar (memorizado)
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 6;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i += 1) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }, [totalPages, currentPage]);

  // Navegar al Home
  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  return (
    <div className="bodega-container">
      {/* Botón agregar vino - Posición superior derecha */}
      <button 
        className="add-wine-button add-wine-button-top"
        onClick={onOpenAddWine}
        title="Agregar nuevo vino"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nuevo
      </button>

      <div className="bodega-filters">
        {/* Botones de filtro individuales (solo desktop) */}
        <div className="filter-buttons-desktop">
          {['Todos', 'Dulce', 'Blanco', 'Tinto'].map((filter) => (
            <button
              key={filter}
              className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => handleFilterChange(filter)}
            >
              {activeFilter === filter && <span className="checkmark">✓</span>}
              {filter}
            </button>
          ))}
        </div>

        {/* Botón de Filtros con menú desplegable (solo móvil) */}
        <div className="filter-dropdown-container filter-dropdown-mobile" ref={filterDropdownRef}>
          <button 
            className={`filter-dropdown-button ${isFilterMenuOpen ? 'open' : ''}`}
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtros
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          {isFilterMenuOpen && (
            <div className="filter-dropdown-menu">
              {['Todos', 'Dulce', 'Blanco', 'Tinto'].map((filter) => (
                <button
                  key={filter}
                  className={`filter-dropdown-item ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => {
                    handleFilterChange(filter);
                    setIsFilterMenuOpen(false);
                  }}
                >
                  {activeFilter === filter && <span className="checkmark">✓</span>}
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Buscador expandible */}
        <div className={`search-container ${isSearchOpen ? 'open' : ''}`} ref={searchRef}>
          <button 
            className="search-button"
            onClick={handleSearchToggle}
            title={isSearchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar vinos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isSearchOpen && (
            <button 
              className="close-search-button"
              onClick={handleCloseSearch}
              title="Cerrar búsqueda"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="bodega-grid">
        {currentWines.map((wine) => (
          <WineCard
            key={wine.id}
            wine={wine}
            onClick={(w) => onSelectWine && onSelectWine(w)}
            likes={wineLikes[wine.id]?.count || 0}
            liked={wineLikes[wine.id]?.liked || false}
            onToggleLike={() => onToggleWineLike(wine.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="bodega-pagination">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                {page}
              </span>
            ) : (
              <button
                key={page}
                className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          ))}
        </div>
      )}

      {/* Modal eliminado aquí; ahora se renderiza a nivel de App para que cubra toda la pantalla */}
    </div>
  );
}

export default Bodega;

