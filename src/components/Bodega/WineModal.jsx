import './WineModal.css';

function WineModal({ wine, onClose }) {
  if (!wine) return null;

  return (
    <div className="wine-modal-overlay" onClick={onClose}>
      <div className="wine-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wine-modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="wine-modal-content">
          <div className="wine-modal-image">
            <img src={wine.image} alt={wine.name} />
          </div>
          
          <div className="wine-modal-details">
            <h2 className="wine-modal-title">{wine.name}</h2>
            
            <div className="wine-modal-tags">
              <span className="wine-tag wine-type">{wine.type}</span>
              <span className="wine-tag">{wine.region}</span>
              <span className="wine-tag">{wine.year}</span>
            </div>

            <div className="wine-modal-info-section">
              <div className="wine-info-row">
                <div className="wine-info-item half-width">
                  <span className="wine-info-label">Graduación:</span>
                  <span className="wine-info-value">{wine.alcoholContent}</span>
                </div>
                
                <div className="wine-info-item half-width">
                  <span className="wine-info-label">Stock:</span>
                  <span className="wine-info-value">{wine.stock} unidades</span>
                </div>
              </div>
              
              <div className="wine-info-row">
                <div className="wine-info-item half-width">
                  <span className="wine-info-label">Precio:</span>
                  <span className="wine-info-value">{wine.price.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <div className="wine-varieties-section">
              <h3 className="wine-varieties-title">Variedad:</h3>
              <div className="wine-varieties-list">
                {Array.isArray(wine.grapeVariety) ? (
                  wine.grapeVariety.map((grape, index) => (
                    <div key={index} className="wine-variety-item">
                      <span className="wine-variety-name">{grape.name}</span>
                      <span className="wine-variety-percentage">{grape.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <div className="wine-variety-item">
                    <span className="wine-variety-name">{wine.grapeVariety}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="wine-modal-location">
              <h3>Lugar</h3>
              <p>{wine.location}</p>
            </div>

            {wine.awards && wine.awards.length > 0 && (
              <div className="wine-modal-awards">
                <h3>Premios y Reconocimientos</h3>
                <div className="awards-list">
                  {wine.awards.map((award, index) => (
                    <div key={index} className="award-item">
                      <span className="award-icon">🏆</span>
                      <span>{award}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WineModal;

