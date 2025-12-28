import { useState } from 'react';
import './WineModal.css';

function WineModal({ wine, onClose, onWineOutOfStock, onUpdateWine, onDeleteWine }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedWine, setEditedWine] = useState({
    price: wine?.price || 0,
    stock: wine?.stock || 0,
    restaurantStock: wine?.restaurantStock || 0,
    location: wine?.location || '',
    image: wine?.image || '',
    grape: wine?.grape || '',
    grapeVariety: Array.isArray(wine?.grapeVariety) ? [...wine.grapeVariety] : []
  });
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [stockAdjustValue, setStockAdjustValue] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' o 'subtract'
  const [showRestaurantAdjust, setShowRestaurantAdjust] = useState(false);
  const [restaurantAdjustValue, setRestaurantAdjustValue] = useState('');
  const [restaurantAdjustType, setRestaurantAdjustType] = useState('add');

  if (!wine) return null;

  // Manejar cambios en los campos editables
  const handleChange = (field, value) => {
    setEditedWine({
      ...editedWine,
      [field]: field === 'price' || field === 'stock' || field === 'restaurantStock' ? parseFloat(value) || 0 : value
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
  const handleSave = async () => {
    const wasOutOfStock = wine.stock === 0;
    const payload = {
      ...wine,
      price: editedWine.price,
      stock: editedWine.stock,
      restaurantStock: editedWine.restaurantStock,
      location: editedWine.location,
      image: editedWine.image,
      grape: editedWine.grape,
      grapeVariety: editedWine.grapeVariety,
      updatedAtClient: new Date(),
    };

    // Si hay callback de actualización, usarlo (API)
    if (onUpdateWine) {
      const result = await onUpdateWine(wine.id || wine._id, payload);
      if (!result?.success) {
        alert(result?.message || 'No se pudo guardar el vino');
        return;
      }
    } else {
      // fallback local (no persiste en DB)
      wine.price = payload.price;
      wine.stock = payload.stock;
      wine.location = payload.location;
      wine.image = payload.image;
      wine.grape = payload.grape;
      wine.grapeVariety = payload.grapeVariety;
    }

    // Si el vino pasa a stock 0, crear notificación
    if (!wasOutOfStock && editedWine.stock === 0 && onWineOutOfStock) {
      onWineOutOfStock({ ...wine, ...payload });
    }
    
    alert('Cambios guardados correctamente');
    onClose();
  };

  // Cancelar edición
  const handleCancel = () => {
    setEditedWine({
      price: wine.price,
      stock: wine.stock,
      restaurantStock: wine.restaurantStock || 0,
      location: wine.location,
      image: wine.image,
      grape: wine.grape || '',
      grapeVariety: Array.isArray(wine.grapeVariety) ? [...wine.grapeVariety] : []
    });
    setIsEditMode(false);
  };

  // Manejar ajuste rápido de stock
  const handleStockAdjust = async () => {
    const value = parseInt(stockAdjustValue);
    if (isNaN(value) || value <= 0) {
      alert('Por favor ingresa un número válido');
      return;
    }

    const newStock = adjustType === 'add' 
      ? wine.stock + value 
      : Math.max(0, wine.stock - value);

    const payload = {
      ...wine,
      stock: newStock,
      updatedAtClient: new Date(),
    };

    if (onUpdateWine) {
      const result = await onUpdateWine(wine.id || wine._id, payload);
      if (!result?.success) {
        alert(result?.message || 'No se pudo actualizar el stock');
        return;
      }
    }

    // Si el vino pasa a stock 0, crear notificación
    if (wine.stock > 0 && newStock === 0 && onWineOutOfStock) {
      onWineOutOfStock({ ...wine, ...payload });
    }

    // Las notificaciones de cambio de stock ahora se crean automáticamente en el backend

    setShowStockAdjust(false);
    setStockAdjustValue('');
    alert(`Stock actualizado: ${wine.stock} → ${newStock}`);
  };

  // Manejar ajuste rápido de stock de restaurante
  const handleRestaurantAdjust = async () => {
    const value = parseInt(restaurantAdjustValue);
    if (isNaN(value) || value <= 0) {
      alert('Por favor ingresa un número válido');
      return;
    }

    const currentRestaurantStock = wine.restaurantStock || 0;
    const currentStock = wine.stock || 0;
    let newRestaurantStock;
    let newStock = currentStock;
    let message = '';

    if (restaurantAdjustType === 'add') {
      // SUMAR al restaurante = mover del almacén al restaurante
      if (value > currentStock) {
        alert(`No hay suficiente stock en almacén. Stock disponible: ${currentStock}`);
        return;
      }
      newRestaurantStock = currentRestaurantStock + value;
      newStock = currentStock - value;
      message = `Movido ${value} del almacén al restaurante.\nAlmacén: ${currentStock} → ${newStock}\nRestaurante: ${currentRestaurantStock} → ${newRestaurantStock}`;
    } else {
      // RESTAR del restaurante
      if (value <= currentRestaurantStock) {
        // Hay suficiente en restaurante, solo restamos del restaurante
        newRestaurantStock = currentRestaurantStock - value;
        message = `Stock restaurante: ${currentRestaurantStock} → ${newRestaurantStock}`;
      } else {
        // No hay suficiente en restaurante, tomamos del almacén lo que falta
        const faltante = value - currentRestaurantStock;
        newRestaurantStock = 0;
        newStock = Math.max(0, currentStock - faltante);
        message = `Restado ${value} (${currentRestaurantStock} del restaurante + ${faltante} del almacén).\nAlmacén: ${currentStock} → ${newStock}\nRestaurante: ${currentRestaurantStock} → 0`;
      }
    }

    const payload = {
      ...wine,
      stock: newStock,
      restaurantStock: newRestaurantStock,
      updatedAtClient: new Date(),
    };

    if (onUpdateWine) {
      const result = await onUpdateWine(wine.id || wine._id, payload);
      if (!result?.success) {
        alert(result?.message || 'No se pudo actualizar el stock');
        return;
      }
    }

    // Las notificaciones de cambio de stock ahora se crean automáticamente en el backend

    setShowRestaurantAdjust(false);
    setRestaurantAdjustValue('');
    alert(message);
  };

  return (
    <div className="wine-modal-overlay" onClick={onClose}>
      <div className="wine-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wine-modal-top-actions">
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
        </div>
        
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

            {/* Sección: Stock General */}
            <div className="wine-modal-info-section">
              <div className="wine-info-row wine-price-stock-row">
                <div className="wine-info-item">
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

                {/* Botones de ajuste rápido de stock (solo si NO está en modo edición) */}
                {!isEditMode && (
                  <div className="wine-stock-adjust-section">
                    {!showStockAdjust ? (
                      <div className="wine-stock-adjust-buttons">
                        <button 
                          className="wine-stock-btn wine-stock-add"
                          onClick={() => {
                            setAdjustType('add');
                            setShowStockAdjust(true);
                          }}
                          title="Agregar stock"
                        >
                          +
                        </button>
                        <button 
                          className="wine-stock-btn wine-stock-subtract"
                          onClick={() => {
                            setAdjustType('subtract');
                            setShowStockAdjust(true);
                          }}
                          title="Restar stock"
                        >
                          −
                        </button>
                      </div>
                    ) : (
                      <div className="wine-stock-adjust-input-container">
                        <span className="wine-stock-adjust-label">
                          {adjustType === 'add' ? 'Agregar:' : 'Restar:'}
                        </span>
                        <input 
                          type="number"
                          className="wine-stock-adjust-input"
                          value={stockAdjustValue}
                          onChange={(e) => setStockAdjustValue(e.target.value)}
                          placeholder="0"
                          autoFocus
                          min="1"
                        />
                        <button 
                          className="wine-stock-adjust-confirm"
                          onClick={handleStockAdjust}
                        >
                          ✓
                        </button>
                        <button 
                          className="wine-stock-adjust-cancel"
                          onClick={() => {
                            setShowStockAdjust(false);
                            setStockAdjustValue('');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Nueva sección: Stock en Restaurante */}
            <div className="wine-modal-info-section">
              <div className="wine-info-row wine-price-stock-row">
                <div className="wine-info-item">
                  <span className="wine-info-label">Restaurante:</span>
                  {isEditMode ? (
                    <div className="wine-editable-field">
                      <input 
                        type="number" 
                        className="wine-editable-input"
                        value={editedWine.restaurantStock}
                        onChange={(e) => handleChange('restaurantStock', e.target.value)}
                      />
                      <span className="wine-input-unit">unidades</span>
                    </div>
                  ) : (
                    <span className="wine-info-value">{wine.restaurantStock || 0} unidades</span>
                  )}
                </div>

                {/* Botones de ajuste rápido de stock restaurante (solo si NO está en modo edición) */}
                {!isEditMode && (
                  <div className="wine-stock-adjust-section">
                    {!showRestaurantAdjust ? (
                      <div className="wine-stock-adjust-buttons">
                        <button 
                          className="wine-stock-btn wine-stock-add"
                          onClick={() => {
                            setRestaurantAdjustType('add');
                            setShowRestaurantAdjust(true);
                          }}
                          title="Agregar stock restaurante"
                        >
                          +
                        </button>
                        <button 
                          className="wine-stock-btn wine-stock-subtract"
                          onClick={() => {
                            setRestaurantAdjustType('subtract');
                            setShowRestaurantAdjust(true);
                          }}
                          title="Restar stock restaurante"
                        >
                          −
                        </button>
                      </div>
                    ) : (
                      <div className="wine-stock-adjust-input-container">
                        <span className="wine-stock-adjust-label">
                          {restaurantAdjustType === 'add' ? 'Agregar:' : 'Restar:'}
                        </span>
                        <input 
                          type="number"
                          className="wine-stock-adjust-input"
                          value={restaurantAdjustValue}
                          onChange={(e) => setRestaurantAdjustValue(e.target.value)}
                          placeholder="0"
                          autoFocus
                          min="1"
                        />
                        <button 
                          className="wine-stock-adjust-confirm"
                          onClick={handleRestaurantAdjust}
                        >
                          ✓
                        </button>
                        <button 
                          className="wine-stock-adjust-cancel"
                          onClick={() => {
                            setShowRestaurantAdjust(false);
                            setRestaurantAdjustValue('');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                  <>
                    {/* Campo simple de uva */}
                    <div className="wine-variety-item-edit" style={{marginBottom: '10px'}}>
                      <input
                        type="text"
                        className="wine-editable-input"
                        style={{width: '100%'}}
                        value={editedWine.grape}
                        onChange={(e) => handleChange('grape', e.target.value)}
                        placeholder="Ej: Tempranillo, Garnacha, Albariño..."
                      />
                    </div>
                    {/* Variedades con porcentaje (opcional) */}
                    {editedWine.grapeVariety.map((grape, index) => (
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
                    ))}
                  </>
                ) : (
                  Array.isArray(wine.grapeVariety) && wine.grapeVariety.length > 0 ? (
                    wine.grapeVariety.map((grape, index) => (
                      <div key={index} className="wine-variety-item">
                        <span className="wine-variety-name">{grape.name}</span>
                        <span className="wine-variety-percentage">{grape.percentage}%</span>
                      </div>
                    ))
                  ) : wine.grape ? (
                    <div className="wine-variety-item">
                      <span className="wine-variety-name">{wine.grape}</span>
                    </div>
                  ) : wine.grapeVariety ? (
                    <div className="wine-variety-item">
                      <span className="wine-variety-name">{wine.grapeVariety}</span>
                    </div>
                  ) : (
                    <div className="wine-variety-item">
                      <span className="wine-variety-name" style={{opacity: 0.5}}>Sin especificar</span>
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

            {/* Botón Eliminar al final del contenido (solo si NO está en modo edición) */}
            {onDeleteWine && !isEditMode && (
              <div className="wine-delete-container">
                <button
                  className="wine-delete-button"
                  onClick={async () => {
                    const ok = window.confirm('¿Eliminar este vino?');
                    if (!ok) return;
                    const res = await onDeleteWine(wine.id || wine._id);
                    if (!res?.success) {
                      alert(res?.message || 'No se pudo eliminar');
                    } else {
                      onClose();
                    }
                  }}
                >
                  🗑️ Eliminar vino
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

