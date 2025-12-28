import { useState } from 'react';
import './WineModal.css';

function AddWineModal({ onClose, onAddWine }) {
  const [newWine, setNewWine] = useState({
    name: '',
    type: 'Tinto',
    region: '',
    year: new Date().getFullYear(),
    price: 0,
    stock: 0,
    restaurantStock: 0,
    alcoholContent: '13%',
    location: '',
    image: '',
    grapeVariety: [{ name: '', percentage: 0 }]
  });

  const handleChange = (field, value) => {
    setNewWine({
      ...newWine,
      [field]: value
    });
  };

  const handleVarietyChange = (index, field, value) => {
    const newVarieties = [...newWine.grapeVariety];
    newVarieties[index] = {
      ...newVarieties[index],
      [field]: field === 'percentage' ? parseFloat(value) || 0 : value
    };
    setNewWine({
      ...newWine,
      grapeVariety: newVarieties
    });
  };

  const handleAddVariety = () => {
    setNewWine({
      ...newWine,
      grapeVariety: [...newWine.grapeVariety, { name: '', percentage: 0 }]
    });
  };

  const handleRemoveVariety = (index) => {
    const newVarieties = newWine.grapeVariety.filter((_, i) => i !== index);
    setNewWine({
      ...newWine,
      grapeVariety: newVarieties
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewWine({
          ...newWine,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Validar campos obligatorios
    if (!newWine.name.trim()) {
      alert('El nombre del vino es obligatorio');
      return;
    }
    if (!newWine.region.trim()) {
      alert('La región es obligatoria');
      return;
    }
    if (newWine.price <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    if (newWine.stock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }
    if (newWine.restaurantStock < 0) {
      alert('El stock del restaurante no puede ser negativo');
      return;
    }

    // Crear el nuevo vino con un ID único
    const wineToAdd = {
      ...newWine,
      id: Date.now(),
      awards: []
    };

    onAddWine(wineToAdd);
    alert('Vino agregado correctamente');
    onClose();
  };

  return (
    <div className="wine-modal-overlay" onClick={onClose}>
      <div className="wine-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header con icono */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238b5cf6'%3E%3Cpath d='M12 2C9.79 2 8 3.79 8 6v4.5c0 1.38-.56 2.63-1.46 3.54L6 14.59V16h12v-1.41l-.54-.55C16.56 13.13 16 11.88 16 10.5V6c0-2.21-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2v4.5c0 1.77.72 3.45 2 4.67V14H8v1.17c1.28-1.22 2-2.9 2-4.67V6c0-1.1.9-2 2-2zM8 17v1h8v-1H8zm2 2v1h4v-1h-4z'/%3E%3C/svg%3E"
              alt="Vino"
              style={{ width: '28px', height: '28px' }}
            />
            <span style={{ fontSize: '18px', color: '#fff', fontWeight: '600' }}>Vinos</span>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#9ca3c0', 
              fontSize: '24px', 
              cursor: 'pointer', 
              padding: '4px 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
        
        <div className="wine-modal-content">
          <div className="wine-modal-image">
            {newWine.image ? (
              <img src={newWine.image} alt="Vista previa" />
            ) : (
              <div className="wine-image-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Sin imagen</p>
              </div>
            )}
            <div className="wine-image-edit-overlay">
              <label htmlFor="new-wine-image-input" className="wine-image-edit-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Agregar foto
              </label>
              <input
                id="new-wine-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          <div className="wine-modal-details">
            <div className="add-wine-header">
              <h2 className="wine-modal-title">Nuevo Vino</h2>
              <p className="add-wine-subtitle">Completa la información del vino</p>
            </div>
            
            {/* Nombre */}
            <div className="wine-form-group">
              <label className="wine-form-label">Nombre del vino *</label>
              <input
                type="text"
                className="wine-editable-input"
                value={newWine.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Ribera del Duero Reserva"
              />
            </div>

            {/* Tipo y Región */}
            <div className="wine-form-row">
              <div className="wine-form-group">
                <label className="wine-form-label">Tipo *</label>
                <select
                  className="wine-editable-input"
                  value={newWine.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="Tinto">Tinto</option>
                  <option value="Blanco">Blanco</option>
                  <option value="Rosado">Rosado</option>
                  <option value="Dulce">Dulce</option>
                  <option value="Espumoso">Espumoso</option>
                </select>
              </div>

              <div className="wine-form-group">
                <label className="wine-form-label">Región *</label>
                <input
                  type="text"
                  className="wine-editable-input"
                  value={newWine.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  placeholder="Ej: Ribera del Duero"
                />
              </div>
            </div>

            {/* Año y Graduación */}
            <div className="wine-form-row">
              <div className="wine-form-group">
                <label className="wine-form-label">Año</label>
                <input
                  type="number"
                  className="wine-editable-input"
                  value={newWine.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="wine-form-group">
                <label className="wine-form-label">Graduación</label>
                <input
                  type="text"
                  className="wine-editable-input"
                  value={newWine.alcoholContent}
                  onChange={(e) => handleChange('alcoholContent', e.target.value)}
                  placeholder="Ej: 13.5%"
                />
              </div>
            </div>

            {/* Precio */}
            <div className="wine-form-group">
              <label className="wine-form-label">Precio (€) *</label>
              <input
                type="number"
                className="wine-editable-input"
                value={newWine.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>

            {/* Stock Almacén y Restaurante */}
            <div className="wine-form-row">
              <div className="wine-form-group">
                <label className="wine-form-label">Stock (unidades) *</label>
                <input
                  type="number"
                  className="wine-editable-input"
                  value={newWine.stock}
                  onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="wine-form-group">
                <label className="wine-form-label">Stock Restaurante *</label>
                <input
                  type="number"
                  className="wine-editable-input"
                  value={newWine.restaurantStock}
                  onChange={(e) => handleChange('restaurantStock', parseInt(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Variedades */}
            <div className="wine-varieties-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className="wine-varieties-title" style={{ margin: 0 }}>Variedades de Uva</h3>
                <button 
                  className="wine-add-variety-btn"
                  onClick={handleAddVariety}
                  type="button"
                >
                  + Agregar
                </button>
              </div>
              <div className="wine-varieties-list">
                {newWine.grapeVariety.map((grape, index) => (
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
                    {newWine.grapeVariety.length > 1 && (
                      <button
                        className="wine-remove-variety-btn"
                        onClick={() => handleRemoveVariety(index)}
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ubicación */}
            <div className="wine-form-group">
              <label className="wine-form-label">Ubicación en bodega</label>
              <textarea
                className="wine-editable-textarea"
                value={newWine.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ej: Estante #2 Centro"
                rows="2"
              />
            </div>

            {/* Botones */}
            <div className="wine-modal-actions">
              <button className="wine-cancel-button" onClick={onClose} type="button">
                Cancelar
              </button>
              <button className="wine-save-button" onClick={handleSubmit} type="button">
                ✓ Agregar Vino
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWineModal;

