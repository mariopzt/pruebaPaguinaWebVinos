import { getTimeAgo } from '../../data/winesData';
import './WineCard.css';

function WineCard({ wine, onClick, isHighlighted }) {
  return (
    <div 
      className={`wine-card ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onClick(wine)}
    >
      <div className="wine-card-image">
        <img src={wine.image} alt={wine.name} />
      </div>
      <div className="wine-card-info">
        <h3 className="wine-card-title">{wine.name}</h3>
        <p className="wine-card-updated">{getTimeAgo(wine.updatedAt)}</p>
      </div>
    </div>
  );
}

export default WineCard;

