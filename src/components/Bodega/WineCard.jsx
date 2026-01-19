import { useEffect, useRef, useState } from 'react';
import { FiHeart } from 'react-icons/fi';
import { getTimeAgo } from '../../utils/date';
import './WineCard.css';

const getOptimizedImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop&q=80';

  // Para Unsplash, asegurar tamaño uniforme
  if (url.includes('unsplash.com')) {
    // Quitar parámetros existentes y añadir nuevos
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=400&h=400&fit=crop&q=80`;
  }

  // Para Pexels, pedimos versión comprimida y cuadrada
  if (url.includes('images.pexels.com')) {
    return `${url}?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;
  }

  // Para Vivino, mantener como está (ya vienen optimizadas)
  if (url.includes('vivino')) {
    return url;
  }

  // Si ya tiene parámetros, devolverla
  if (url.includes('?')) return url;

  return url;
};

function WineCard({ wine, onClick, isHighlighted, likes = 0, liked = false, onToggleLike }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleLikeClick = (e) => {
    e.stopPropagation(); // Evitar que abra el modal del vino
    if (onToggleLike) {
      onToggleLike();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`wine-card ${isHighlighted ? 'highlighted' : ''} ${
        isVisible ? 'is-visible' : ''
      }`}
      onClick={() => onClick(wine)}
    >
      <div className="wine-card-image">
        <img
          src={getOptimizedImageUrl(wine.image)}
          alt={wine.name}
          loading="lazy"
        />
        {/* Botón de like flotante */}
        <button 
          className={`wine-like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLikeClick}
          aria-label="Me gusta"
        >
          <FiHeart size={16} />
        </button>
      </div>
      <div className="wine-card-info">
        <h3 className="wine-card-title">{wine.name}</h3>
        <div className="wine-card-footer">
          <p className="wine-card-updated">{getTimeAgo(wine.updatedAt)}</p>
          <div className="wine-likes-count">
            <FiHeart size={12} />
            <span>{likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WineCard;

