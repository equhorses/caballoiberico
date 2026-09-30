-- Niveles de calidad (I–V) independientes de la edad y etapas por edad (desde 6 meses).
-- El nivel solo sube: por una valoración resuelta que lo mejore, o a mano por presidencia (méritos deportivos).

ALTER TABLE horses ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5);

CREATE TABLE IF NOT EXISTS level_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id    UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  from_level  INT NOT NULL,
  to_level    INT NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN ('VALORACION','MERITO','MANUAL')),
  case_id     UUID REFERENCES evaluation_cases(id) ON DELETE SET NULL,
  notes       TEXT,
  decided_by  UUID REFERENCES users(id),
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS level_history_horse_idx ON level_history(horse_id, at DESC);

ALTER TABLE evaluation_cases ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE evaluation_cases ADD COLUMN IF NOT EXISTS age_months INT;
ALTER TABLE evaluation_cases ADD COLUMN IF NOT EXISTS final_score NUMERIC(4,1);
ALTER TABLE evaluation_cases ADD COLUMN IF NOT EXISTS level_awarded INT;
