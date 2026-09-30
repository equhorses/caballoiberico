-- Caballos cruzados sin documentación: el % de sangre ibérica puede ser desconocido
-- y el origen se marca como DECLARADO (lo dice el titular) o ACREDITADO (documentos / ADN revisados por la presidencia).
ALTER TABLE horses ALTER COLUMN iberic_blood_pct DROP NOT NULL;
ALTER TABLE horses ALTER COLUMN iberic_blood_pct DROP DEFAULT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS origin_status TEXT NOT NULL DEFAULT 'DECLARADO'
  CHECK (origin_status IN ('DECLARADO','ACREDITADO'));
ALTER TABLE horses ADD COLUMN IF NOT EXISTS origin_notes TEXT;
