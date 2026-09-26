# C-IBERICO · Iberian Horses

Certificado **privado** de origen y calidad del caballo ibérico deportivo (PRE, PSL y cruces).
No es un libro genealógico oficial ni está avalado por ningún organismo público: funciona como un
certificado SSL, con número único y verificación pública en la web.

```
frontend/   Web pública + paneles (React + Vite)        → Vercel  (Root Directory: frontend)
backend/    API + base de datos + IA (Node + Express)    → Railway (Root Directory: backend) + PostgreSQL
```

## Qué incluye

**Web pública:** inicio, Registro C-IBERICO (buscador y fichas), Valoración IA, Gestiones con tarifas,
Lista Laureada y resultados, Reglamento y **Verificar certificado** (por código `CV-XXXX-XXXX` o nº `CIB-xxxxx`).
Mientras no haya ejemplares reales publicados se muestran fichas de **ejemplo**, siempre marcadas como tales
(`frontend/src/data/examples.js`; para quitarlas del todo, deja los arrays vacíos).

**Panel del titular (`/panel`):** alta de ejemplares, las 5 fotos reglamentarias, vídeo, solicitudes de gestión y pago (Stripe).

**Panel del evaluador / presidencia (`/evaluador`):**
- Valoraciones v2: la IA **propone** por criterio (observación, nota, evidencia, confianza) y el **evaluador resuelve**
  (aceptar / corregir / rechazar / no evaluable). Revisión de material por criterio: un material malo nunca baja la nota.
- Rúbrica **versionada**: editar = crear versión nueva; cada valoración queda ligada a su versión.
- Historial de auditoría que no se borra.
- Expedición y revocación de certificados, méritos deportivos (las estrellas salen de méritos verificados, nunca de la IA),
  gestiones, usuarios y roles.

## Variables de entorno

### Railway (backend)
| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres) |
| `JWT_SECRET` | una clave larga y aleatoria |
| `FRONTEND_URL` | la URL de Vercel, p. ej. `https://caballoiberico.vercel.app` (varias separadas por comas) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | cuenta de presidencia (se crea sola al arrancar) |
| `UPLOAD_DIR` | `/data/uploads` (con un **Volume** montado en `/data`, si no las fotos se pierden en cada despliegue) |
| `AI_BASE_URL` | `https://api.moonshot.ai/v1` (Kimi) u otra API compatible con OpenAI |
| `AI_API_KEY` / `AI_MODEL` | clave y modelo con visión. Sin ellas la web muestra "IA pendiente de integración" |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | opcional. Webhook: `https://TU-BACKEND/api/payments/webhook` |

La base de datos se crea sola: al arrancar se aplican los `.sql` de `backend/db/migrations/` y se crea la rúbrica v2.

### Vercel (frontend)
| Variable | Valor |
|---|---|
| `VITE_API_URL` | la URL pública del backend de Railway, sin barra final |

## Imágenes
Las de `frontend/public/images/` están recortadas de capturas de pantalla (baja resolución). Sustitúyelas por
los originales con el **mismo nombre**: `hero.jpg`, `valoracion.jpg`, `cinco-vistas.jpg`, `pre.jpg`, `psl.jpg`,
`yeguada.jpg`, `pista.jpg`, `ejemplo-doma.jpg`, `sello.png`, `logo.png`.

## Local
```bash
cd backend && cp .env.example .env && npm install && npm run dev     # http://localhost:3001
cd frontend && npm install && npm run dev                              # http://localhost:5173
```
