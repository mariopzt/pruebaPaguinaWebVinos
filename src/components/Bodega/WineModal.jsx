import { useState } from 'react';
import './WineModal.css';

function WineModal({ wine, onClose, onWineOutOfStock }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedWine, setEditedWine] = useState({
    price: wine?.price || 0,
    stock: wine?.stock || 0,
    location: wine?.location || '',
    image: wine?.image || '',
    grapeVariety: Array.isArray(wine?.grapeVariety) ? [...wine.grapeVariety] : []
  });

  if (!wine) return null;

  // Manejar cambios en los campos editables
  const handleChange = (field, value) => {
    setEditedWine({
      ...editedWine,
      [field]: field === 'price' || field === 'stock' ? parseFloat(value) || 0 : value
    });
  };

  // Manejar cambios en variedades
  const handleVarietyChange = (index, field, value) => {
    const newVarieties = [...editedWine.grapeVariety];
    newVarieties[index] = {
      ...newVarieties[index],
      [field]: field === 'percentage' ? parseFloat(value) || 0 : value
    };
    setEditedWine({
      ...editedWine,
      grapeVariety: newVarieties
    });
  };

  // Agregar nueva variedad
  const handleAddVariety = () => {
    setEditedWine({
      ...editedWine,
      grapeVariety: [...editedWine.grapeVariety, { name: '', percentage: 0 }]
    });
  };

  // Eliminar variedad
  const handleRemoveVariety = (index) => {
    const newVarieties = editedWine.grapeVariety.filter((_, i) => i !== index);
    setEditedWine({
      ...editedWine,
      grapeVariety: newVarieties
    });
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedWine({
          ...editedWine,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar cambios en el objeto wine
  const handleSave = () => {
    const wasOutOfStock = wine.stock === 0;
    wine.price = editedWine.price;
    wine.stock = editedWine.stock;
    wine.location = editedWine.location;
    wine.image = editedWine.image;
    wine.grapeVariety = editedWine.grapeVariety;
    
    // Si el vino pasa a stock 0, crear notificación
    if (!wasOutOfStock && editedWine.stock === 0 && onWineOutOfStock) {
      onWineOutOfStock(wine);
    }
    
    alert('Cambios guardados correctamente');
    onClose();
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditedWine({
      price: wine.price,
      stock: wine.stock,
      location: wine.location,
      image: wine.image,
      grapeVariety: Array.isArray(wine.grapeVariety) ? [...wine.grapeVariety] : []
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
            <img src={editedWine.image} alt={wine.name} />
            {isEditMode && (
              <div className="wine-image-edit-overlay">
                <label htmlFor="wine-image-input" className="wine-image-edit-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Cambiar foto
                </label>
                <input
                  id="wine-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className="wine-varieties-title" style={{ margin: 0 }}>Variedad:</h3>
                {isEditMode && (
                  <button 
                    className="wine-add-variety-btn"
                    onClick={handleAddVariety}
                    title="Agregar variedad"
                  >
                    + Agregar
                  </button>
                )}
              </div>
              <div className="wine-varieties-list">
                {isEditMode ? (
                  editedWine.grapeVariety.map((grape, index) => (
                    <div key={index} className="wine-variety-item-edit">
                      <input
                        type="text"
                        className="wine-editable-input variety-name-input"
                        value={grape.name}
                        onChange={(e) => handleVarietyChange(index, 'name', e.target.value)}
                        placeholder="Nombre variedad"
                      />
                      <input
                        type="number"
                        className="wine-editable-input variety-percentage-input"
                        value={grape.percentage}
                        onChange={(e) => handleVarietyChange(index, 'percentage', e.target.value)}
                        placeholder="%"
                        min="0"
                        max="100"
                      />
                      <button
                        className="wine-remove-variety-btn"
                        onClick={() => handleRemoveVariety(index)}
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  Array.isArray(wine.grapeVariety) ? (
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
                  )
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

