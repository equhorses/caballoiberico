-- Documentación del ejemplar y de sus padres. La IA lee el documento y propone los datos;
-- el titular los revisa y la presidencia acredita. Los archivos se guardan fuera de la carpeta pública.
CREATE TABLE IF NOT EXISTS horse_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  horse_id    UUID REFERENCES horses(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('EJEMPLAR','PADRE','MADRE')),
  file        TEXT NOT NULL,
  mime        TEXT NOT NULL,
  original_name TEXT,
  doc_type    TEXT,
  extracted   JSONB,
  ai_model    TEXT,
  ai_error    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS horse_documents_horse_idx ON horse_documents(horse_id);
