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

**Criterio de la casa (rúbrica 2.2):** el caballo ibérico medido con la vara de movimiento del caballo de deporte centroeuropeo; la conformación por su función, respetando el tipo PRE/PSL. El movimiento pesa el 80 %.

**PRE, PSL y sus cruces:** microchip obligatorio. PRE/PSL aportan su nº de libro oficial; los cruces, padre y madre con su nº de registro (ANCCE, APSL o C-IBERICO). La ficha muestra la procedencia como *pendiente de acreditar* hasta que la presidencia revisa los documentos (`/evaluador` → Ejemplares); el Certificado de Origen no se puede expedir antes.

**Documentación leída por IA:** el titular sube la carta genealógica o el certificado (foto o PDF) del ejemplar y, en los cruces, de padre y madre. La IA rellena el formulario de alta (campos en amarillo para revisar) y en `/evaluador` se ve cada documento junto a lo declarado, con lo que no cuadra marcado en rojo. La IA solo lee y compara; la procedencia la acredita siempre una persona. Los documentos se guardan fuera de la carpeta pública (`DOCS_DIR`, por defecto junto a `UPLOAD_DIR`: en Railway, `/data/private-docs`).

**Etapas y niveles:** se valora desde los 6 meses (potro, añojo, 2, 3, 4, 5 y 6+ años). El resultado es un nivel I–V que no depende de la edad:
sube si una nueva valoración lo mejora (con tope por etapa: II potros/añojos, III a 2–3 años, IV a 4–5, V desde 6), nunca baja por valoración,
y la presidencia puede cambiarlo a mano por méritos deportivos (motivo obligatorio, queda en el historial).

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
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | IA principal (API compatible con OpenAI). Claude: `https://api.anthropic.com/v1` + `claude-sonnet-5`. Kimi: `https://api.moonshot.ai/v1` + `kimi-k2.6`. Sin clave la web muestra "IA pendiente de integración" |
| `AI2_BASE_URL` / `AI2_API_KEY` / `AI2_MODEL` | opcional, **segunda IA** para doble lectura: ambas puntúan por separado y el panel marca las discrepancias |
| `AI_VIDEO_FRAMES` | fotogramas repartidos por el vídeo (por defecto 8, máx. 16) |
| `AI_VIDEO_BURSTS` | ráfagas de 6 fotogramas consecutivos cada 0,1 s para ver la secuencia de apoyos (por defecto 2, máx. 4) |
| `PREVALORACION_PRICE_EUR` | precio de la pre-valoración (por defecto 0 = gratis; si es 0 no pasa por Stripe) |
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
