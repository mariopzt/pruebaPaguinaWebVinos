import { useState, useEffect } from 'react';
import './WineModal.css';

// Imagen de fallback confiable (Unsplash)
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=600&fit=crop&q=80';

// Optimizar URL de imagen para que todas se vean uniformes
const getOptimizedImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;

  // Para Unsplash, asegurar tamaño uniforme y mayor calidad
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=600&h=600&fit=crop&q=80`;
  }

  // Para Pexels
  if (url.includes('images.pexels.com')) {
    return `${url}?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop`;
  }

  // Si ya tiene parámetros, devolverla
  if (url.includes('?')) return url;

  return url;
};

function WineModal({ wine, onClose, onWineOutOfStock, onUpdateWine, onDeleteWine, isGuest = false }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedWine, setEditedWine] = useState({
    price: wine?.price || 0,
    stock: wine?.stock || 0,
    restaurantStock: wine?.restaurantStock || 0,
    location: wine?.location || '',
    image: wine?.image || '',
    grape: wine?.grape || '',
    grapeVariety: Array.isArray(wine?.grapeVariety) ? [...wine.grapeVariety] : [],
    description: wine?.description || ''
  });
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [stockAdjustValue, setStockAdjustValue] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' o 'subtract'
  const [showRestaurantAdjust, setShowRestaurantAdjust] = useState(false);
  const [restaurantAdjustValue, setRestaurantAdjustValue] = useState('');
  const [restaurantAdjustType, setRestaurantAdjustType] = useState('add');
  const [showLossAdjust, setShowLossAdjust] = useState(false);
  const [lossAdjustValue, setLossAdjustValue] = useState('');
  const [lossReason, setLossReason] = useState('roto'); // 'roto', 'jefe', 'otro'
  const [isClosingLossForm, setIsClosingLossForm] = useState(false);
  const [imgSrc, setImgSrc] = useState(getOptimizedImageUrl(wine?.image));
  const [imgError, setImgError] = useState(false);

  // Actualizar imagen si cambia el vino o editedWine.image
  useEffect(() => {
    setImgSrc(getOptimizedImageUrl(editedWine.image));
    setImgError(false);
  }, [editedWine.image]);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

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
      description: editedWine.description,
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
      grapeVariety: Array.isArray(wine.grapeVariety) ? [...wine.grapeVariety] : [],
      description: wine.description || ''
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

    // Si se resta stock, registrar como venta
    if (adjustType === 'subtract') {
      try {
        const statsService = await import('../../api/statsService').then(m => m.default);
        await statsService.registerSale(wine._id || wine.id, value);
        console.log(`✅ Venta registrada: ${value} unidades de ${wine.name}`);
      } catch (err) {
        console.warn('No se pudo registrar la venta en estadísticas:', err);
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
      // RESTAR del restaurante = VENTA
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

      // Registrar venta cuando se resta del restaurante
      try {
        const statsService = await import('../../api/statsService').then(m => m.default);
        await statsService.registerSale(wine._id || wine.id, value);
        console.log(`✅ Venta registrada: ${value} unidades de ${wine.name}`);
      } catch (err) {
        console.warn('No se pudo registrar la venta en estadísticas:', err);
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

  // Manejar ajuste de pérdidas (rotos/sacados por el jefe)
  const handleLossAdjust = async () => {
    const value = parseInt(lossAdjustValue);
    if (isNaN(value) || value <= 0) {
      alert('Por favor ingresa un número válido');
      return;
    }

    const currentRestaurantStock = wine.restaurantStock || 0;
    const currentStock = wine.stock || 0;
    const totalAvailable = currentRestaurantStock + currentStock;

    // Verificar si hay suficiente stock total
    if (value > totalAvailable) {
      alert(`No hay suficiente stock. Total disponible: ${totalAvailable} (Restaurante: ${currentRestaurantStock} + Almacén: ${currentStock})`);
      return;
    }

    let newRestaurantStock;
    let newStock;
    let message;
    const reasonText = lossReason === 'roto' ? 'rotos' : lossReason === 'jefe' ? 'llevados por el jefe' : 'perdidos';

    if (value <= currentRestaurantStock) {
      // Hay suficiente en el restaurante
      newRestaurantStock = currentRestaurantStock - value;
      newStock = currentStock;
      message = `${value} unidades ${reasonText}\nRestaurante: ${currentRestaurantStock} → ${newRestaurantStock}\nAlmacén: ${currentStock} (sin cambios)`;
    } else {
      // No hay suficiente en restaurante, tomar del almacén la diferencia
      const fromRestaurant = currentRestaurantStock;
      const fromStock = value - currentRestaurantStock;
      newRestaurantStock = 0;
      newStock = currentStock - fromStock;
      message = `${value} unidades ${reasonText}\n- ${fromRestaurant} del restaurante (${currentRestaurantStock} → 0)\n- ${fromStock} del almacén (${currentStock} → ${newStock})`;
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

    // Registrar la pérdida en estadísticas
    try {
      const statsService = await import('../../api/statsService').then(m => m.default);
      await statsService.registerLoss(wine._id || wine.id, value, reasonText);
    } catch (err) {
      console.warn('No se pudo registrar la pérdida en estadísticas:', err);
    }

    setShowLossAdjust(false);
    setLossAdjustValue('');
    setIsClosingLossForm(false);
    alert(message);
  };

  // Manejar cierre con animación del formulario de pérdidas
  const handleCloseLossForm = () => {
    setIsClosingLossForm(true);
    setTimeout(() => {
      setShowLossAdjust(false);
      setLossAdjustValue('');
      setLossReason('roto');
      setIsClosingLossForm(false);
    }, 250); // Duración de la animación
  };

  return (
    <div className="wine-modal-overlay" onClick={onClose}>
      <div className="wine-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wine-modal-top-actions">
          <button className="wine-modal-close" onClick={onClose}>
            ×
          </button>

          {/* Botón Editar - Solo para usuarios no invitados */}
          {!isGuest && (
            <button 
              className="wine-edit-button"
              onClick={() => setIsEditMode(!isEditMode)}
              title={isEditMode ? 'Cancelar edición' : 'Editar vino'}
            >
              {isEditMode ? '✕' : '✎'}
            </button>
          )}
        </div>
        
        <div className="wine-modal-content">
          <div className="wine-modal-image">
            <img src={imgSrc} alt={wine.name} onError={handleImageError} />
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

                {/* Botones de ajuste rápido de stock (solo si NO está en modo edición y NO es invitado) */}
                {!isEditMode && !isGuest && (
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

                {/* Botones de ajuste rápido de stock restaurante (solo si NO está en modo edición y NO es invitado) */}
                {!isEditMode && !isGuest && (
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

            {/* Nueva sección: Pérdidas (Rotos/Sacados) */}
            <div className="wine-modal-info-section" style={{ 
              borderTop: '1px solid rgba(255,255,255,0.1)', 
              paddingTop: '14px',
              marginTop: '14px',
              background: 'radial-gradient(circle at top right, rgba(99,102,241,0.05) 0%, rgba(20,20,35,0.4) 60%)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(99,102,241,0.12)'
            }}>
              <div className="wine-info-row">
                <div className="wine-info-item" style={{ width: '100%' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      fontSize: '18px',
                      filter: 'grayscale(0%)'
                    }}>⚠️</span>
                    <span className="wine-info-label" style={{ 
                      color: 'rgba(255,255,255,0.8)', 
                      fontWeight: '600',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      Rotos / Retirados
                    </span>
                  </div>
                  
                  {!isEditMode && (
                    <div className="wine-stock-adjust-section">
                      {!showLossAdjust ? (
                        <button 
                          style={{ 
                            width: '100%',
                            maxWidth: '280px',
                            margin: '0 auto',
                            display: 'flex',
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(129,140,248,0.15) 100%)',
                            border: '1.5px solid rgba(99,102,241,0.4)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                            backdropFilter: 'blur(10px)'
                          }}
                          onClick={() => setShowLossAdjust(true)}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(129,140,248,0.25) 100%)';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
                            e.target.style.borderColor = 'rgba(99,102,241,0.6)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(129,140,248,0.15) 100%)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(99,102,241,0.15)';
                            e.target.style.borderColor = 'rgba(99,102,241,0.4)';
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>−</span>
                          <span>Registrar pérdida</span>
                        </button>
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '16px',
                          padding: '4px 0',
                          maxWidth: '380px',
                          margin: '0 auto',
                          width: '100%',
                          animation: isClosingLossForm ? 'slideUpFade 0.25s ease-in' : 'slideDownFade 0.4s ease-out',
                          overflow: 'hidden'
                        }}>
                          {/* Input de cantidad */}
                          <div style={{ width: '100%' }}>
                            <label style={{ 
                              display: 'block',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '11px',
                              fontWeight: '600',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              textAlign: 'center'
                            }}>
                              Cantidad:
                            </label>
                            <input 
                              type="number"
                              value={lossAdjustValue}
                              onChange={(e) => setLossAdjustValue(e.target.value)}
                              placeholder="Ingresa cantidad"
                              autoFocus
                              min="1"
                              style={{ 
                                width: '100%',
                                padding: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                backgroundColor: 'rgba(20,20,35,0.6)',
                                border: '1.5px solid rgba(99,102,241,0.3)',
                                borderRadius: '10px',
                                color: '#fff',
                                textAlign: 'center',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2)'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#6366f1';
                                e.target.style.backgroundColor = 'rgba(99,102,241,0.08)';
                                e.target.style.boxShadow = 'inset 0 1px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(99,102,241,0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(99,102,241,0.3)';
                                e.target.style.backgroundColor = 'rgba(20,20,35,0.6)';
                                e.target.style.boxShadow = 'inset 0 1px 4px rgba(0,0,0,0.2)';
                              }}
                            />
                          </div>
                          
                          {/* Motivos */}
                          <div>
                            <label style={{ 
                              display: 'block',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '11px',
                              fontWeight: '600',
                              marginBottom: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              textAlign: 'center'
                            }}>
                              Motivo:
                            </label>
                            <div style={{ 
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                              gap: '8px'
                            }}>
                              <button 
                                onClick={() => setLossReason('roto')}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: lossReason === 'roto' ? '2px solid #6366f1' : '1.5px solid rgba(255,255,255,0.15)',
                                  background: lossReason === 'roto' 
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(129,140,248,0.15) 100%)' 
                                    : 'rgba(20,20,35,0.4)',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: lossReason === 'roto' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                                  backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.borderColor = '#818cf8';
                                  e.target.style.boxShadow = '0 3px 12px rgba(99,102,241,0.3)';
                                  e.target.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(129,140,248,0.12) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  if (lossReason !== 'roto') {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.background = 'rgba(20,20,35,0.4)';
                                  }
                                }}
                              >
                                <span style={{ fontSize: '16px' }}>🔴</span>
                                <span>Roto</span>
                              </button>
                              
                              <button 
                                onClick={() => setLossReason('jefe')}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: lossReason === 'jefe' ? '2px solid #6366f1' : '1.5px solid rgba(255,255,255,0.15)',
                                  background: lossReason === 'jefe' 
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(129,140,248,0.15) 100%)' 
                                    : 'rgba(20,20,35,0.4)',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: lossReason === 'jefe' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                                  backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.borderColor = '#818cf8';
                                  e.target.style.boxShadow = '0 3px 12px rgba(99,102,241,0.3)';
                                  e.target.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(129,140,248,0.12) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  if (lossReason !== 'jefe') {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.background = 'rgba(20,20,35,0.4)';
                                  }
                                }}
                              >
                                <span style={{ fontSize: '16px' }}>👤</span>
                                <span>Jefe</span>
                              </button>
                              
                              <button 
                                onClick={() => setLossReason('otro')}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: lossReason === 'otro' ? '2px solid #6366f1' : '1.5px solid rgba(255,255,255,0.15)',
                                  background: lossReason === 'otro' 
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(129,140,248,0.15) 100%)' 
                                    : 'rgba(20,20,35,0.4)',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  boxShadow: lossReason === 'otro' ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                                  backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.borderColor = '#818cf8';
                                  e.target.style.boxShadow = '0 3px 12px rgba(99,102,241,0.3)';
                                  e.target.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(129,140,248,0.12) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  if (lossReason !== 'otro') {
                                    e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.background = 'rgba(20,20,35,0.4)';
                                  }
                                }}
                              >
                                <span style={{ fontSize: '16px' }}>❓</span>
                                <span>Otro</span>
                              </button>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            marginTop: '8px'
                          }}>
                            <button 
                              onClick={handleLossAdjust}
                              style={{ 
                                padding: '10px 14px',
                                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                                border: '1.5px solid #4caf50',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(76,175,80,0.3)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(76,175,80,0.5)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(76,175,80,0.3)';
                              }}
                            >
                              <span style={{ fontSize: '15px' }}>✓</span>
                              <span>Confirmar</span>
                            </button>
                            
                            <button 
                              onClick={handleCloseLossForm}
                              style={{ 
                                padding: '10px 14px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1.5px solid rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(10px)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.12)';
                                e.target.style.borderColor = 'rgba(255,255,255,0.35)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.05)';
                                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                              }}
                            >
                              <span style={{ fontSize: '15px' }}>✕</span>
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Descripción */}
            <div className="wine-modal-info-section" style={{ 
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(20,20,35,0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(99,102,241,0.15)'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#9ca3c0',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>📝</span>
                Descripción:
              </h3>
              {isEditMode ? (
                <textarea
                  className="wine-editable-input"
                  value={editedWine.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe el vino: aroma, sabor, maridaje recomendado, cuerpo, etc..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(99,102,241,0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.backgroundColor = 'rgba(99,102,241,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(99,102,241,0.3)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                />
              ) : (
                <p style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: wine.description ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                  fontStyle: wine.description ? 'normal' : 'italic',
                  margin: 0
                }}>
                  {wine.description || 'Sin descripción'}
                </p>
              )}
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

            {/* Botón Eliminar al final del contenido (solo si NO está en modo edición y NO es invitado) */}
            {onDeleteWine && !isEditMode && !isGuest && (
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

