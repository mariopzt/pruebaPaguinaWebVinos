# Catas

APK/PWA para registrar catas de vino, cafe, aceite, cerveza, queso, chocolate u otros productos.

## Que incluye

- Frontend React + Vite con diseno tipo app movil.
- Pantallas de inicio, archivo de catas y ajustes.
- Plantillas rapidas por tipo de cata.
- Ficha con visual, aromas, sabores, maridaje, notas y puntuacion /100.
- Guardado local en el dispositivo y sincronizacion con API cuando el backend esta disponible.
- Backend Express + MongoDB con base de datos `catas`.

## Desarrollo

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backEnd
npm install
npm run dev
```

Variables del backend (`backEnd/.env`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=tu_connection_string_de_mongodb
MONGODB_DB=catas
```

Variables del frontend (`.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

## API

- `GET /api/catas`
- `GET /api/catas/:id`
- `POST /api/catas`
- `PUT /api/catas/:id`
- `DELETE /api/catas/:id`

El backend fuerza por defecto `MONGODB_DB=catas`, aunque el connection string apunte a otra base.
