import { useState } from 'react';
import { winesData } from '../../data/winesData';
import WineCard from './WineCard';
import './Bodega.css';

function Bodega({ onNavigateHome, onSelectWine }) {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const itemsPerPage = 10;

  // Filtrar vinos según el tipo seleccionado y término de búsqueda
  let filteredWines = activeFilter === 'Todos' 
    ? winesData 
    : winesData.filter(wine => wine.type === activeFilter);

  // Aplicar búsqueda por nombre
  if (searchTerm.trim()) {
    filteredWines = filteredWines.filter(wine => 
      wine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Calcular la paginación
  const totalPages = Math.ceil(filteredWines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWines = filteredWines.slice(startIndex, endIndex);

  // Manejar cambio de filtro
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset a la primera página al cambiar filtro
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll al inicio de la sección
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Generar números de páginas para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 6;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Navegar al Home
  const handleNavigateHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  return (
    <div className="bodega-container">
      <div className="bodega-filters">
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
        
        {/* Buscador expandible */}
        <div className={`search-container ${isSearchOpen ? 'open' : ''}`}>
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
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="bodega-pagination">
          {getPageNumbers().map((page, index) => (
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

