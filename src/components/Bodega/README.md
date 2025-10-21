# Componente Bodega

## Estructura de Archivos

```
src/
├── components/
│   └── Bodega/
│       ├── Bodega.jsx          # Componente principal
│       ├── Bodega.css          # Estilos del componente principal
│       ├── WineCard.jsx        # Componente de tarjeta de vino
│       ├── WineCard.css        # Estilos de la tarjeta
│       ├── WineModal.jsx       # Modal con detalles del vino
│       └── WineModal.css       # Estilos del modal
└── data/
    └── winesData.js            # Datos de ejemplo de vinos
```

## Características

### 1. **Bodega.jsx** - Componente Principal
- Gestiona el estado de filtros, paginación y modal
- Sistema de filtros funcional (Todos, Dulce, Blanco, Tinto)
- Paginación dinámica (10 elementos por página)
- Botón "Inicio" para volver al hero de la página
- Grid responsive adaptable

### 2. **WineCard.jsx** - Tarjeta de Vino
- Muestra imagen, nombre y fecha de actualización
- Efecto hover con animación
- Click handler para abrir modal de detalles
- Diseño responsive

### 3. **WineModal.jsx** - Modal de Detalles
- Muestra información completa del vino:
  - Imagen
  - Nombre y región
  - Tipo, año y variedad de uva
  - Graduación alcohólica
  - Stock disponible
  - Precio
  - Descripción
  - Premios y reconocimientos
- Overlay con blur
- Animación de entrada suave
- Botón de cierre con animación

### 4. **winesData.js** - Datos
- 23 vinos de ejemplo con datos completos
- Función `getTimeAgo()` para formatear fechas
- Estructura de datos:
  ```js
  {
    id: number,
    name: string,
    type: 'Tinto' | 'Blanco' | 'Dulce',
    image: string,
    region: string,
    year: number,
    grapeVariety: string,
    alcoholContent: string,
    description: string,
    stock: number,
    price: number,
    awards: string[],
    updatedAt: Date
  }
  ```

## Funcionalidades

### Filtros
- **Todos**: Muestra todos los vinos (23 total)
- **Dulce**: Filtra vinos dulces
- **Blanco**: Filtra vinos blancos y rosados
- **Tinto**: Filtra vinos tintos
- Indicador visual del filtro activo con checkmark ✓

### Paginación
- 10 vinos por página
- Navegación inteligente de páginas
- Muestra números de página relevantes con "..."
- Scroll automático al cambiar de página
- Se resetea al cambiar de filtro

### Modal de Detalles
- Se abre al hacer click en cualquier tarjeta
- Cierra al hacer click fuera o en el botón ×
- Muestra toda la información del vino
- Design responsive para móvil

### Responsive Design
- **Desktop**: Grid de 5-7 columnas
- **Tablet**: Grid de 4-5 columnas
- **Mobile**: Grid de 2 columnas
- Filtros y botones adaptables
- Modal optimizado para pantallas pequeñas

## Estilos

### Colores
- **Primario**: `#6b5ce7` (púrpura)
- **Background tarjetas**: `#f5f3ff` (púrpura claro)
- **Texto**: `#1a1a1a` (negro)
- **Secundario**: `#666` (gris)

### Animaciones
- Hover en tarjetas: translateY + shadow
- Modal: slide-in desde arriba
- Botón cerrar: rotación 90°
- Transiciones suaves en todos los elementos

## Uso

```jsx
import Bodega from './components/Bodega/Bodega'

function App() {
  return (
    <div>
      <Bodega />
    </div>
  )
}
```

## Personalización

Para añadir más vinos, edita `src/data/winesData.js`:

```js
export const winesData = [
  ...winesData,
  {
    id: 24,
    name: 'Nuevo Vino',
    type: 'Tinto',
    // ... resto de propiedades
  }
]
```

Para cambiar los tipos de filtro, edita la línea 105 de `Bodega.jsx`:

```jsx
{['Todos', 'Dulce', 'Blanco', 'Tinto', 'NuevoTipo'].map((filter) => (
  // ...
))}
```

