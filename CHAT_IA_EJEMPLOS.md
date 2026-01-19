# 🤖 Chat IA - Ejemplos de Uso

La IA de VinosStK tiene **acceso total** a tu bodega. Puede crear, modificar, eliminar vinos y cambiar cualquier información.

## 🎯 Resumen Rápido

| Acción | Ejemplo |
|--------|---------|
| ➖ **Restar 1 vino** | "Quita 5 del Albariño" |
| ➖ **Restar varios** | "Resta 3 Rioja, 2 Ribera y 5 Godello" |
| ➕ **Sumar 1 vino** | "Añade 20 al Priorat" |
| ➕ **Sumar varios** | "Suma 15 Albariño, 10 Rioja y 25 Mencía" |
| 🔄 **Restar y Sumar** | "Vendí 3 Rioja pero llegaron 20 Priorat" |
| ➕ **Crear vino** | "Añade un vino Ribera del Duero Reserva 2019" |
| ✏️ **Modificar vino** | "Cambia el precio del Godello a 18€" |
| 🖼️ **Cambiar imagen** | "Actualiza la imagen del Albariño" |
| ❌ **Eliminar vino** | "Elimina el Rioja Reserva" |

---

## 📋 Capacidades Completas

### 1️⃣ Modificar Stock (update_stock / set_stock)

**RESTAR stock (uno o varios vinos):**
```
Usuario: "Quita 5 botellas de Albariño Mar de Frades"
Usuario: "Resta 3 del Ribera del Duero"
Usuario: "Vendí 2 Albariño, 3 Rioja y 1 Godello"
Usuario: "Quita 10 unidades de Priorat y 5 de Ribeiro"
```

**SUMAR stock (uno o varios vinos):**
```
Usuario: "Añade 20 unidades de Rioja Reserva"
Usuario: "Suma 15 botellas al Albariño y 10 al Godello"
Usuario: "Agrega 30 unidades de Ribera, 25 de Priorat y 20 de Mencía"
```

**ESTABLECER stock exacto:**
```
Usuario: "Establece el stock de Godello a 15"
Usuario: "Pon el stock del Rioja en 50 unidades"
```

**MEZCLAR (restar y sumar en el mismo comando):**
```
Usuario: "Resta 5 del Albariño y añade 10 al Rioja"
Usuario: "Vendí 3 Ribera pero llegaron 20 Priorat nuevos"
```

### 2️⃣ Agregar Vinos Nuevos (add_wine)

```
Usuario: "Añade un vino Ribera del Duero Reserva 2019 con precio 25€"
Usuario: "Crea un vino tinto llamado Priorat Gran Reserva"
Usuario: "Agrega los siguientes vinos: Albariño Pazo, Mencía Bierzo, Tempranillo Rioja"
```

### 3️⃣ ✨ NUEVO: Modificar Vinos Existentes (update_wine)

**Cambiar descripción:**
```
Usuario: "Añade una descripción al Albariño Mar de Frades"
Usuario: "Cambia la descripción de Ribera del Duero a 'Vino excepcional de crianza'"
Usuario: "Actualiza la descripción del Godello"
```

**Cambiar precio:**
```
Usuario: "Cambia el precio de Rioja Reserva a 28 euros"
Usuario: "Sube el precio del Priorat a 35€"
Usuario: "Reduce el precio del Albariño a 12€"
```

**Cambiar imagen/foto (BUSCA AUTOMÁTICAMENTE EN INTERNET):**
```
Usuario: "Ponle una foto al Ribera del Duero"
Usuario: "Busca una imagen para el Albariño"
Usuario: "Actualiza la foto del Godello"
Usuario: "Busca una foto en internet para el vino Rioja"
Usuario: "Ponle foto a todos los vinos"
```

🖼️ **La IA buscará automáticamente una imagen de vino apropiada en internet basándose en el tipo de vino (tinto, blanco, rosado, espumoso).**

```

**Cambiar tipo, año, región:**
```
Usuario: "Cambia el tipo de 'Vino X' a Rosado"
Usuario: "Actualiza el año del Ribera a 2020"
Usuario: "Cambia la región del vino a D.O. Navarra"
```

**Cambiar nombre:**
```
Usuario: "Renombra el vino 'Rioja' a 'Rioja Gran Reserva'"
Usuario: "Cambia el nombre de 'Vino Tinto' a 'Marqués de Riscal'"
```

**Cambiar uvas/variedades:**
```
Usuario: "Cambia las uvas del Ribera a Tempranillo, Cabernet"
Usuario: "Actualiza las variedades del Albariño"
```

**Modificar varios campos a la vez:**
```
Usuario: "Cambia el precio del Godello a 18€ y añádele una descripción"
Usuario: "Actualiza el Ribera: precio 30€, año 2019, descripción nueva"
```

### 4️⃣ Eliminar Vinos (delete_wine)

```
Usuario: "Elimina el vino Albariño"
Usuario: "Borra el Ribera del Duero"
Usuario: "Elimina estos vinos: Vino1, Vino2, Vino3"
Usuario: "Elimina todos los vinos" ⚠️ (¡Cuidado!)
```

### 5️⃣ Consultas y Búsquedas

```
Usuario: "¿Qué vinos tenemos?"
Usuario: "Vinos con poco stock"
Usuario: "Vinos agotados"
Usuario: "¿Qué vinos tienen descripción?"
Usuario: "Dame información del Albariño"
Usuario: "Busca información sobre el vino Ribera del Duero en internet"
Usuario: "¿Qué tipo de vino es el Godello?"
```

---

## 🎯 Ejemplos Prácticos Completos

### Escenario 1: Añadir un vino completamente nuevo
```
Usuario: "Añade un vino llamado 'Viña Ardanza Reserva', tipo Tinto, 
año 2018, región D.O.Ca. Rioja, uvas Tempranillo y Garnacha, 
precio 22€, stock 30 unidades en bodega y 10 en restaurante"
```

### Escenario 2: Modificar un vino existente
```
Usuario: "Del vino 'Albariño Mar de Frades', cambia el precio a 15€, 
añade la descripción 'Vino blanco fresco con notas cítricas' 
y actualiza la imagen"
```

### Escenario 3: Gestión de stock por venta
```
Usuario: "Vendí 3 Rioja Reserva y 2 Ribera del Duero"
```

### Escenario 4: Actualización masiva
```
Usuario: "Sube el precio de todos los vinos tintos en 2 euros"
Usuario: "Añade descripciones a todos los vinos que no tienen"
```

### Escenario 5: Consulta con búsqueda web
```
Usuario: "Busca información sobre el vino Viña Ardanza en internet 
y añádela como descripción"
```

### Escenario 6: Gestión múltiple de stock
```
Usuario: "Vendí 3 Albariño, 2 Rioja y 5 Ribera del Duero"
IA: ✅ Resta 3, 2 y 5 unidades respectivamente

Usuario: "Llegó pedido: 30 Priorat, 25 Godello y 20 Mencía"
IA: ✅ Suma 30, 25 y 20 unidades respectivamente

Usuario: "Resta 2 del Albariño pero añade 15 al stock del Rioja"
IA: ✅ Resta 2 de uno y suma 15 al otro
```

---

## 💡 Consejos

1. **Sé natural**: Habla con la IA como con un compañero de trabajo
2. **Sé específico**: Menciona el nombre completo o parcial del vino
3. **Comandos múltiples**: Puedes hacer varias acciones en un mismo mensaje
4. **Imágenes**: La IA buscará imágenes automáticamente de servicios como Unsplash
5. **Búsquedas web**: La IA puede buscar información en internet sobre vinos

---

## ⚠️ Acceso Total

La IA tiene **acceso completo** a:
- ✅ Crear vinos
- ✅ Modificar cualquier campo (nombre, tipo, año, región, uvas, precio, descripción, imagen, ubicación, etc.)
- ✅ Eliminar vinos (uno, varios o todos)
- ✅ Cambiar stock (bodega y restaurante)
- ✅ Buscar información en internet
- ✅ Consultar y analizar datos

**¡Úsala con confianza! La IA es tu asistente de bodega completo.**

