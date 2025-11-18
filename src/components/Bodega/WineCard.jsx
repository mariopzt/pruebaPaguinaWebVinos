import { getTimeAgo } from '../../data/winesData';
import './WineCard.css';

const getOptimizedImageUrl = (url) => {
  if (!url) return url;

  // Si ya tiene parámetros, asumimos que viene optimizada
  if (url.includes('?')) return url;

  // Para Pexels u otras CDNs, pedimos versión comprimida y más pequeña
  if (url.includes('images.pexels.com')) {
    return `${url}?auto=compress&cs=tinysrgb&w=480&h=480&fit=crop`;
  }

  return url;
};

function WineCard({ wine, onClick, isHighlighted }) {
  return (
    <div
      className={`wine-card ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onClick(wine)}
    >
      <div className="wine-card-image">
        <img
          src={getOptimizedImageUrl(wine.image)}
          alt={wine.name}
          loading="lazy"
        />
      </div>
      <div className="wine-card-info">
        <h3 className="wine-card-title">{wine.name}</h3>
        <p className="wine-card-updated">{getTimeAgo(wine.updatedAt)}</p>
      </div>
    </div>
  );
}

export default WineCard;

