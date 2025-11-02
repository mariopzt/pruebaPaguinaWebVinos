import { useState } from 'react';
import './WineModal.css';

function WineModal({ wine, onClose }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedWine, setEditedWine] = useState({
    price: wine?.price || 0,
    stock: wine?.stock || 0,
    location: wine?.location || ''
  });

  if (!wine) return null;

  // Manejar cambios en los campos editables
  const handleChange = (field, value) => {
    setEditedWine({
      ...editedWine,
      [field]: field === 'price' || field === 'stock' ? parseFloat(value) || 0 : value
    });
  };

  // Guardar cambios en el objeto wine
  const handleSave = () => {
    wine.price = editedWine.price;
    wine.stock = editedWine.stock;
    wine.location = editedWine.location;
    setIsEditMode(false);
    alert('Cambios guardados correctamente');
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditedWine({
      price: wine.price,
      stock: wine.stock,
      location: wine.location
    });
    setIsEditMode(false);
  };

  return (
    <div className="wine-modal-overlay" onClick={onClose}>
      <div className="wine-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wine-modal-close" onClick={onClose}>
          ×
        </button>
        
        {/* Botón Editar */}
        <button 
          className="wine-edit-button"
          onClick={() => setIsEditMode(!isEditMode)}
          title={isEditMode ? 'Cancelar edición' : 'Editar vino'}
        >
          {isEditMode ? '✕' : '✎'}
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
                  {isEditMode ? (
                    <div className="wine-editable-field">
                      <input 
                        type="number" 
                        className="wine-editable-input"
                        value={editedWine.stock}
                        onChange={(e) => handleChange('stock', e.target.value)}
                      />
                      <span className="wine-input-unit">unidades</span>
                    </div>
                  ) : (
                    <span className="wine-info-value">{wine.stock} unidades</span>
                  )}
                </div>
              </div>
              
              <div className="wine-info-row">
                <div className="wine-info-item half-width">
                  <span className="wine-info-label">Precio:</span>
                  {isEditMode ? (
                    <div className="wine-editable-field">
                      <input 
                        type="number" 
                        className="wine-editable-input"
                        value={editedWine.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        step="0.01"
                      />
                      <span className="wine-input-unit">€</span>
                    </div>
                  ) : (
                    <span className="wine-info-value">{wine.price.toFixed(2)}€</span>
                  )}
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
              {isEditMode ? (
                <textarea 
                  className="wine-editable-textarea"
                  value={editedWine.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              ) : (
                <p>{wine.location}</p>
              )}
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

            {/* Botones de Guardar y Cancelar (solo en modo edición) */}
            {isEditMode && (
              <div className="wine-modal-actions">
                <button className="wine-cancel-button" onClick={handleCancel}>
                  Cancelar
                </button>
                <button className="wine-save-button" onClick={handleSave}>
                  💾 Guardar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WineModal;

