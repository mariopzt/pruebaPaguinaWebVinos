# Catas Backend

API Express para guardar catas en MongoDB.

## Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=tu_connection_string_de_mongodb
MONGODB_DB=catas
```

## Comandos

```bash
npm install
npm run dev
npm start
```

## Endpoints

- `GET /api/health`
- `GET /api/catas`
- `GET /api/catas/:id`
- `POST /api/catas`
- `PUT /api/catas/:id`
- `DELETE /api/catas/:id`

## Modelo principal

La coleccion `catas` guarda nombre, categoria, productor, origen, fecha, lugar, catador, visual, aromas, sabores, maridaje, notas, puntuaciones parciales, puntuacion total, favorito y estado.
