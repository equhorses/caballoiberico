-- C-IBERICO · Certificado privado de calidad del caballo ibérico deportivo.
-- No es un libro genealógico oficial ni está avalado por ningún organismo público.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────── Usuarios ───────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'TITULAR' CHECK (role IN ('ADMIN','EVALUADOR','TITULAR')),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  phone       TEXT,
  country     TEXT NOT NULL,
  city        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Yeguada asociada
CREATE TABLE studs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id),
  breeder_code  TEXT UNIQUE,
  name          TEXT NOT NULL,
  city          TEXT,
  country       TEXT NOT NULL,
  is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────── Ejemplares ───────────
CREATE TABLE horses (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number  TEXT UNIQUE,                 -- CIB-xxxxx, al expedir el Certificado de Origen
  name                 TEXT NOT NULL,
  birth_date           DATE NOT NULL,
  sex                  TEXT NOT NULL CHECK (sex IN ('MACHO','HEMBRA','CASTRADO')),
  coat                 TEXT NOT NULL,
  country              TEXT NOT NULL,
  breed                TEXT NOT NULL CHECK (breed IN ('PRE','PSL','PRE_PSL','CRUZADO')),
  iberic_blood_pct     INT NOT NULL DEFAULT 100 CHECK (iberic_blood_pct BETWEEN 10 AND 100),
  sire_name            TEXT,
  dam_name             TEXT,
  breeder_name         TEXT,
  microchip            TEXT,
  official_registry    TEXT,                        -- nº en ANCCE / APSL / DIE si existe
  is_public            BOOLEAN NOT NULL DEFAULT TRUE,
  status               TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE','CERTIFICADO','RECHAZADO','BAJA')),
  owner_id             UUID NOT NULL REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX horses_owner_idx ON horses(owner_id);

CREATE TABLE horse_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id    UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  view        TEXT NOT NULL CHECK (view IN ('LATERAL_IZQUIERDO','LATERAL_DERECHO','FRONTAL','TRASERA','SUPERIOR')),
  url         TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (horse_id, view)
);

CREATE TABLE horse_videos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id    UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  seconds     INT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────── Certificados (verificables como un SSL) ───────────
CREATE TABLE certificates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id     UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('ORIGEN','CALIDAD')),
  code         TEXT NOT NULL UNIQUE,
  stars        INT CHECK (stars IN (3,6,12,24)),
  amber_stars  INT NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'VIGENTE' CHECK (status IN ('VIGENTE','REVOCADO')),
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at   TIMESTAMPTZ,
  notes        TEXT
);

-- Resultados deportivos acreditados con documentación oficial del organismo competente
CREATE TABLE sport_merits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id      UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  competition   TEXT NOT NULL,
  category      TEXT NOT NULL,
  level         TEXT NOT NULL CHECK (level IN ('JOVENES_NACIONAL','NACIONAL_ABSOLUTO','INTERNACIONAL','MUNDIAL_OLIMPICO')),
  position      TEXT NOT NULL,
  score         NUMERIC(5,2),
  date          DATE NOT NULL,
  stars_given   INT NOT NULL,
  document_url  TEXT,
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────── Valoración IA v2: la IA propone, el evaluador resuelve ───────────
CREATE TABLE rubrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'EXPERIMENTAL' CHECK (status IN ('EXPERIMENTAL','PROVISIONAL','VALIDADA','PUBLICADA','ARCHIVADA')),
  content     JSONB NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE evaluation_cases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id     UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  rubric_id    UUID NOT NULL REFERENCES rubrics(id),
  status       TEXT NOT NULL DEFAULT 'REVISION_MATERIAL' CHECK (status IN ('REVISION_MATERIAL','EN_REVISION_HUMANA','REQUIERE_MATERIAL','RESUELTO')),
  age_years    INT,
  summary      TEXT,
  guidance     TEXT,     -- orientación emitida por el evaluador humano (nunca por la IA)
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Puerta de material por criterio: un material deficiente nunca se convierte en nota baja
CREATE TABLE material_checks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id        UUID NOT NULL REFERENCES evaluation_cases(id) ON DELETE CASCADE,
  criterion_key  TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('APTO','APTO_PARCIAL','REQUIERE_MATERIAL','NO_EVALUABLE')),
  notes          TEXT,
  checked_by     TEXT,    -- 'IA' o id de usuario
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, criterion_key)
);

CREATE TABLE ai_proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES evaluation_cases(id) ON DELETE CASCADE,
  criterion_key   TEXT NOT NULL,
  observation     TEXT NOT NULL,
  score           NUMERIC(3,1) CHECK (score BETWEEN 0 AND 10),
  confidence      TEXT NOT NULL CHECK (confidence IN ('ALTA','MEDIA','BAJA','ABSTENCION')),
  evidence        JSONB,
  limitations     TEXT,
  source_label    TEXT,
  rubric_version  TEXT NOT NULL,
  model           TEXT NOT NULL,
  raw             JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE human_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID NOT NULL REFERENCES evaluation_cases(id) ON DELETE CASCADE,
  proposal_id     UUID REFERENCES ai_proposals(id),
  criterion_key   TEXT NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('ACEPTAR','CORREGIR','RECHAZAR','NO_EVALUABLE')),
  final_score     NUMERIC(3,1) CHECK (final_score BETWEEN 0 AND 10),
  notes           TEXT,
  decided_by      UUID NOT NULL REFERENCES users(id),
  decided_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, criterion_key)
);

-- Historial que no se borra
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  entity     TEXT NOT NULL,
  entity_id  TEXT NOT NULL,
  action     TEXT NOT NULL,
  data       JSONB,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_log(entity, entity_id);

-- ─────────── Gestiones y pagos ───────────
CREATE TABLE service_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  horse_id     UUID REFERENCES horses(id) ON DELETE SET NULL,
  service      TEXT NOT NULL CHECK (service IN ('ORIGEN','CALIDAD','CAMBIO_NOMBRE','CAMBIO_TITULARIDAD','LAUREADA','YEGUADA')),
  status       TEXT NOT NULL DEFAULT 'PENDIENTE_PAGO' CHECK (status IN ('PENDIENTE_PAGO','PAGADA','EN_REVISION','REQUIERE_DOCUMENTACION','RESUELTA','RECHAZADA')),
  documents    JSONB,
  notes        TEXT,
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

CREATE TABLE payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  request_id  UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  stripe_id   TEXT UNIQUE,
  amount      INT NOT NULL,          -- céntimos
  currency    TEXT NOT NULL DEFAULT 'eur',
  status      TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE','COMPLETADO','FALLIDO','REEMBOLSADO')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at     TIMESTAMPTZ
);
